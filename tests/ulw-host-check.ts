// Run with: bun tests/ulw-host-check.ts (requires the installed omp binary).
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { renderPreset } from "../presets";

const requests: unknown[] = [];
let continuationState: { kind: string; path: string } | undefined;
let scenarioRequests = 0;
let spawnedChildren = 0;
let exitedChildren = 0;
const tempRoots: string[] = [];
const policyBytes: Record<string, number> = {};
interface LocalCommandTrace { id: string; command: string; notifications: Array<{ message: string; notifyType: string }>; providerRequestDelta: number }
interface Frame {
  type?: string; id?: string; success?: boolean; status?: string; agentInvoked?: boolean; method?: string; notifyType?: string; kind?: string; path?: string;
  message?: { stopReason?: string } | string; data?: { agentInvoked?: boolean };
}
const server = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  async fetch(request) {
    requests.push(await request.json());
    scenarioRequests++;
    if (continuationState && scenarioRequests === 2) writeFileSync(continuationState.path, continuationState.kind === "loop"
      ? JSON.stringify({ status: "complete", goals: [{ status: "complete" }] }) : "- [x] 1. Local hook probe\n");
    if (continuationState?.kind === "execute" && scenarioRequests === 3) {
      const path = resolve(continuationState.path, "../../boulder.json");
      const boulder: unknown = JSON.parse(readFileSync(path, "utf8"));
      assert(typeof boulder === "object" && boulder !== null && "works" in boulder && typeof boulder.works === "object" && boulder.works !== null && "probe" in boulder.works);
      const work = boulder.works.probe;
      assert(typeof work === "object" && work !== null && "status" in work && work.status === "active");
      work.status = "complete";
      writeFileSync(path, JSON.stringify(boulder));
    }
    return new Response([
      'data: {"id":"ulw-probe","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":"ULW-PROBE"},"finish_reason":null}]}',
      'data: {"id":"ulw-probe","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}',
      'data: [DONE]', "",
    ].join("\n\n"), { headers: { "content-type": "text/event-stream" } });
  },
});
const source = readFileSync(new URL("../skills/ultrawork/SKILL.md", import.meta.url), "utf8");
const directive = source.split("<ultrawork-mode>")[1].split("</ultrawork-mode>")[0];

async function run(prompts: string[], flags: string[] = [], continuation?: "loop" | "execute", provider?: string, model = "gpt-6.1-sol", loadSkills = false, trace: LocalCommandTrace[] = [], fixtureRoot = true): Promise<string[]> {
  const offset = requests.length;
  continuationState = undefined;
  scenarioRequests = 0;
  const cwd = continuation ? mkdtempSync(join(tmpdir(), "omo-ulw-host-")) : process.cwd();
  if (continuation) tempRoots.push(cwd);
  const child = Bun.spawn([
    "omp", "--mode", "rpc", ...(prompts.some(prompt => /^\/ulw-(status|off)$/.test(prompt)) ? [] : ["--no-ui"]), "--no-extensions", "-e", resolve("."), ...(fixtureRoot ? ["-e", resolve("tests/fixtures")] : []),
    "-e", resolve("tests/fixtures/ulw-provider.ts"), "--model", provider ? `${provider}/deepseek-v4-flash-omo-local-probe` : `omo-ulw-probe/${model}`,
    "--cwd", cwd, ...(loadSkills ? ["--tools", "read"] : ["--no-tools", "--no-skills"]), "--no-rules", "--no-title", "--no-session", "--no-lsp", ...flags,
  ], { stdin: "pipe", stdout: "pipe", stderr: "pipe", env: { ...process.env, OMO_ULW_PROBE_BASE_URL: `http://127.0.0.1:${server.port}/v1`, OMO_ULW_PROBE_CONTINUATION: continuation ?? "", OMO_ULW_PROBE_PROVIDER: provider ?? "", OMO_ULW_PROBE_MODEL: model } });
  spawnedChildren++;
  const stderr = new Response(child.stderr).text();
  let signal = Promise.withResolvers<void>();
  let expected = "ready";
  let expectedRequests = 0;
  let failure: unknown;
  const notifications: Array<{ message: string; notifyType: string }> = [];
  let pending: { id: string; completed: boolean; notificationsAtSend: number } | undefined;
  const abort = AbortSignal.timeout(60000);
  abort.addEventListener("abort", () => {
    failure = new Error(`OMP host deadline: provider=${provider ?? "omo-ulw-probe"}, mode=${continuation ?? "ordinary"}, event=${expected}, requests=${scenarioRequests}/${expectedRequests}`);
    signal.reject(failure);
  }, { once: true });
  const output = (async () => {
    let buffer = "";
    for await (const bytes of child.stdout) {
      buffer += new TextDecoder().decode(bytes);
      for (;;) {
        const end = buffer.indexOf("\n");
        if (end < 0) break;
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        if (!line.startsWith("{")) continue;
        const event = JSON.parse(line) as Frame;
        if (typeof event.type !== "string") continue;
        if (event.type === "message_end" && typeof event.message === "object" && event.message.stopReason === "error") {
          failure = event.message;
          signal.reject(new Error(JSON.stringify(event.message)));
        }
        if (event.type === "ulw_probe_state" && typeof event.kind === "string" && typeof event.path === "string") continuationState = { kind: event.kind, path: event.path };
        if (event.type === "extension_ui_request" && event.method === "notify") notifications.push({ message: String(event.message), notifyType: String(event.notifyType) });
        if ((event.type === "response" && event.success === false) || (event.type === "prompt_result" && event.status === "error")) {
          failure = event;
          signal.reject(new Error(JSON.stringify(event)));
        } else if (expected === "ready") {
          if (event.id === "ready") signal.resolve();
        } else if (pending) {
          // Local-command completion: only this id's explicit non-agent success counts.
          if (event.id === pending.id && event.type === "response" && event.success === true && event.data?.agentInvoked === false) pending.completed = true;
          if (event.id === pending.id && event.type === "prompt_result" && event.agentInvoked === false && event.status === "completed") pending.completed = true;
        } else if (expected === "agent_end" && event.type === "agent_end" && scenarioRequests >= expectedRequests) signal.resolve();
        if (pending?.completed && notifications.length > pending.notificationsAtSend) signal.resolve();
      }
    }
    if (expected !== "finished") signal.reject(new Error(`OMP exited before ${expected}`));
  })();
  try {
    child.stdin.write(JSON.stringify({ type: "get_state", id: "ready" }) + "\n");
    await signal.promise;
    const commandCounts: Record<string, number> = {};
    let modelPrompts = 0;
    for (const [index, prompt] of prompts.entries()) {
      const command = /^\/(ulw-status|ulw-off)$/.exec(prompt)?.[1];
      const id = command ? `${command.slice(4)}-${commandCounts[command] = (commandCounts[command] ?? 0) + 1}` : `prompt-${index}`;
      const before = scenarioRequests;
      // Register exact completion tracking before the frame is written.
      signal = Promise.withResolvers<void>();
      pending = command ? { id, completed: false, notificationsAtSend: notifications.length } : undefined;
      expected = command ? "local command completion" : "agent_end";
      if (!command) expectedRequests = continuation === "execute" ? 3 : continuation === "loop" ? 2 : ++modelPrompts;
      child.stdin.write(JSON.stringify({ type: "prompt", id, message: prompt }) + "\n");
      await signal.promise;
      if (failure) throw new Error(JSON.stringify(failure));
      if (pending) {
        assert.equal(scenarioRequests, before, `local command must not reach the provider: ${prompt}`);
        trace.push({ id, command: prompt, notifications: notifications.slice(pending.notificationsAtSend), providerRequestDelta: scenarioRequests - before });
        pending = undefined;
      }
    }
    expected = "finished";
  } finally {
    child.kill();
    await child.exited;
    exitedChildren++;
    await output;
    const errors = await stderr;
    if (failure) console.error(errors);
    if (continuation) rmSync(cwd, { recursive: true, force: true });
  }
  return requests.slice(offset).map(body => {
    assert(typeof body === "object" && body !== null && "messages" in body && Array.isArray(body.messages));
    const messages: unknown[] = body.messages;
    return messages.flatMap(message => {
      if (typeof message !== "object" || message === null || !("role" in message) || !["system", "developer"].includes(String(message.role)) || !("content" in message) || typeof message.content !== "string") return [];
      return [message.content];
    }).join("\n");
  });
}

let result: object;
try {
  const astra = readFileSync(new URL("../skills/ultrawork/references/astra-directive.md", import.meta.url), "utf8");
  for (const model of ["gpt-6-astra", "gpt-6-astra-fast"]) {
    const [prompt] = await run(["/ulw validate the Astra directive"], [], undefined, undefined, model);
    assert(prompt.includes(`<ultrawork-mode>${astra}</ultrawork-mode>`));
    policyBytes[model === "gpt-6-astra" ? "astra" : "astraFast"] = Buffer.byteLength(prompt.split("<ultrawork-mode>")[1].split("</ultrawork-mode>")[0], "utf8");
  }
  const [catalog] = await run(["inspect installed skill metadata"], [], undefined, undefined, "gpt-6.1-sol", true);
  for (const name of ["design", "brand", "design-system", "ui-styling", "ui-ux-pro-max", "slides", "banner-design", "native-ui-design"]) {
    assert(!catalog.includes(`skill://${name}`) && !catalog.includes(`<name>${name}</name>`) && !new RegExp(`^\\s*- ${name}(?: \\(|:)`, "m").test(catalog), `disabled design skill must not be advertised: ${name}`);
  }
  assert(catalog.includes("ego-browser"), "unrelated browser skill remains available");
  assert(catalog.includes("Catalogue-only fixture for host checks"), "ego-browser must come from the explicit fixture root, not an ambient install");
  assert(/^- ulw-plan:/m.test(catalog) && /^- debugging:/m.test(catalog), "package skills must be advertised alongside the fixture");
  for (const name of ["debugging", "review-work", "visual-qa", "visualize", "frontend", "data-scientist", "remove-ai-slops", "hyperplan", "memory-advisor", "reflection", "init-deep"]) {
    const [prompt] = await run([`/${name} exercise installed routing`]);
    const body = JSON.stringify(requests.at(-1));
    assert(body.includes(`<omo-${name}-pointer>`), `real command must resolve its skill pointer: ${name}`);
    assert(body.includes(resolve(`skills/${name}/SKILL.md`)));
    assert(!prompt.includes("<omo-ulw-policy>"));
  }
  for (const name of ["review-work", "hyperplan"]) {
    const body = readFileSync(resolve(`skills/${name}/SKILL.md`), "utf8").replace(/^---\n[\s\S]*?\n---\n/, "").trim();
    for (const args of ["", "ulw verify this local probe", "ulw-plan plan this local probe"]) {
      // Exercise the expanded input delivered by native /skill invocation, not the literal CLI command.
      const expanded = `[IMPORTANT: User invoked the "${name}" skill; follow its instructions. Full skill below.]\n\n${body}\n\n---\n\n[Skill directory: ${resolve(`skills/${name}`)}]\nResolve relative paths in this skill (e.g. \`scripts/foo.js\`, \`templates/config.yaml\`) against this absolute directory; read referenced assets and templates; run scripts with the terminal tool when skill instructions call for it.${args ? `\nUser: ${args}` : ""}`;
      const offset = requests.length;
      const prompts = await run([expanded, "continue"]);
      assert.equal(prompts.length, 2);
      for (const prompt of prompts) assert.equal(prompt.includes("<omo-ulw-policy>"), args !== "", `native skill body must not activate ULW: ${name}`);
      assert.equal(JSON.stringify(requests[offset]).includes("<omo-ulw-plan-pointer>"), args.startsWith("ulw-plan"), `only explicit arguments select planning: ${name}`);
      assert(!JSON.stringify(requests[offset]).includes(`<omo-${name}-pointer>`), "already-expanded native skill must not receive a duplicate pointer");
    }
  }
  const armed = await run(["/ulw verify this local probe", "continue"]);
  assert.equal(armed.length, 2);
  for (const prompt of armed) {
    assert(prompt.includes(`<ultrawork-mode>${directive}</ultrawork-mode>`), "actual provider request must contain the shipped complete directive");
    assert.equal(prompt.split("<omo-ulw-policy>").length - 1, 1, "policy must not duplicate on follow-up");
    assert.equal(prompt.split("<omo-model-preset>").length - 1, 1, "model preset must coexist with ULW");
  }
  policyBytes.baseline = Buffer.byteLength(armed[0].split("<ultrawork-mode>")[1].split("</ultrawork-mode>")[0], "utf8");
  const controls: LocalCommandTrace[] = [];
  const sequence = await run(["/ulw-status", "/ulw probe", "/ulw-off", "continue", "/ulw probe"], [], undefined, undefined, "gpt-6.1-sol", false, controls);
  assert.equal(sequence.length, 3, "only the three model prompts reach the provider");
  assert.deepEqual(controls.map(entry => [entry.id, entry.command, entry.providerRequestDelta]), [["status-1", "/ulw-status", 0], ["off-1", "/ulw-off", 0]]);
  for (const entry of controls) assert(entry.notifications.some(note => note.notifyType === "info"), `local command must emit an info notification: ${entry.command}`);
  assert.deepEqual(sequence.map(request => request.includes("<omo-ulw-policy>")), [true, false, true], "policy present after /ulw, absent after /ulw-off, present after re-arming");
  const quoted = await run(["Explain the quoted token `ulw`."]);
  assert.equal(quoted.length, 1);
  assert(!quoted[0].includes("<omo-ulw-policy>"));
  for (const text of ["Read doc/ulw/notes.md", "Do not use ulw; fix this normally", "> ulw plan the old task", "[REPORT] worker mentioned ulw-loop", "see https://example.com/search?q=ulw"]) {
    const [prompt] = await run([text]);
    assert(!prompt.includes("<omo-ulw-policy>"), `reference must not arm: ${text}`);
    assert(!JSON.stringify(requests.at(-1)).includes("-pointer>"), `reference must not inject a skill pointer: ${text}`);
  }
  const [mass] = await run(["/mass-ulw verify this local probe"]);
  assert(!mass.includes("<omo-ulw-policy>"));
  assert(JSON.stringify(requests.at(-1)).includes("<omo-mass-ulw-pointer>"));
  const [contrast] = await run(["Do not use tmux, but ulw verify this local probe"]);
  assert(contrast.includes("<omo-ulw-policy>"));
  const disabled = await run(["ulw verify this probe"], ["--omo-ultrawork-disabled"]);
  assert.equal(disabled.length, 1);
  assert(!disabled[0].includes("<omo-ulw-policy>"));
  const specialised = await run(["/ulw-plan plan this local probe"]);
  assert.equal(specialised.length, 1);
  assert(specialised[0].includes("<omo-ulw-policy>"));
  assert(JSON.stringify(requests.at(-1)).includes("<omo-ulw-plan-pointer>"));
  for (const mode of ["loop", "execute"] as const) {
    const continued = await run([`/ulw-${mode} exercise owned local state`], [], mode);
    assert.equal(continued.length, mode === "execute" ? 3 : 2, `${mode} must continue through its final gate and stop at completed state`);
  }
  for (const provider of ["deepseek", "omo-third-party-probe"]) {
    const [prompt] = await run(["verify the selected model profile"], [], undefined, provider);
    const profile = renderPreset({ provider, id: "deepseek-v4-flash-omo-local-probe", name: "DeepSeek V4 Flash" }, { surface: "app", toolNames: [] })!;
    assert(prompt.includes(`<omo-model-preset>\n${profile.prompt}\n</omo-model-preset>`), "actual provider request must contain the provider-specific shipped profile");
  }
  result = { status: "PASS", requests: requests.length, scenarios: ["Astra directive", "Astra-fast directive", "eight design skills excluded", "unrelated browser skill advertised from explicit fixture root", "eleven new skill commands", "native skill body suppression", "native skill explicit ULW arguments", "native skill explicit planning arguments", "slash activation", "session follow-up", "quoted keyword suppression", "path reference suppression", "negated invocation suppression", "blockquote suppression", "relay suppression", "URL suppression", "mass pointer without base arming", "contrast clause activation", "disable flag", "specialised command pointer", "loop continuation", "execute final-gate continuation", "official DeepSeek profile", "third-party DeepSeek profile", "local /ulw-status and /ulw-off command-only session sequence"], localCommands: controls, policyBytes };
} finally { await server.stop(true); }
const providerStopped = await fetch(`http://127.0.0.1:${server.port}/`).then(() => false, () => true);
const tempRootsRemoved = tempRoots.filter(path => !existsSync(path)).length;
assert.equal(exitedChildren, spawnedChildren, "every owned OMP child must have exited");
assert(providerStopped, "local provider must be stopped");
assert.equal(tempRootsRemoved, tempRoots.length, "temp roots must be removed");
console.log(JSON.stringify({ ...result, cleanup: { ownedChildren: spawnedChildren, childrenExited: exitedChildren, providerStopped, tempRootsCreated: tempRoots.length, tempRootsRemoved } }));
