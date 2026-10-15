---
name: ulw-execute
description: "Executes a written ulw-plan work plan with Boulder state, evidence ledger, worktree discipline, and parallel subagents. Use when the user says ulw-execute or asks to run a doc/plans plan."
argument-hint: "[plan-name] [--worktree <absolute-path>] [--make-pr] [--ship]"
---

## OMP runtime contract

Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Host instructions, current user instructions and exposed tool schemas take precedence over this guidance, including its workflow, reporting and verification rules. This workflow requires explicit activation; bare ULW never selects it. Legacy difficulty labels are plan metadata, not callable categories.

Reuse references already read in this session; load operation-specific guidance when that operation needs it.


## Work ownership

**YOU DO NOT WRITE PRODUCT CODE OR EDIT PRODUCT FILES YOURSELF. EVERY unit of implementation, test authoring, sub-task QA, and review work MUST be delegated to a spawned subagent.** Your hands touch only plan selection, `doc/` state (Boulder, ledger, plan checkboxes), decomposition, dispatch, verdicts, evidence records, and your own independent verification: you MAY run independent real-surface QA and integration checks (the actual consumer/entrypoint, the plan's verification commands once after integration) and record them as parent evidence. That verification is read-only for product files; a failure goes back to a worker with the exact failure, never fixed by you. Worker reports are claims to verify, not completion evidence by themselves; host verification and delegation rules take precedence. About to edit a product file or run an implementation command yourself? **STOP. SPAWN A WORKER INSTEAD.** Parallelize only independent units (disjoint files, state and proof); units with overlapping write paths and named dependencies serialize.

# ulw-execute

Execute a work plan until every top-level checkbox is verified `[x]` or blocked `[~]`. Blocked is terminal non-success, never a met dependency. The durable Boulder record is the resume source. An installed OMP hook may resume active owned work for pending tasks or final reporting; do not assume an external hook or complete work from its notifications.

## Usage

```text
$ulw-execute [plan-name] [--worktree <absolute-path>] [--make-pr] [--ship]
```

- `plan-name` (optional): a full or partial file stem under `doc/plans/`.
- `--worktree` (optional): reuse an existing task-owned worktree for the first phase instead of creating one; task-owned worktrees apply when branch/commit delivery was explicitly authorised; otherwise isolate disjoint local file scopes.
- `--make-pr` (optional): deliver each phase's worktree as a pull request — push the branch, open a reviewer-readable PR, hand off with the URL, and merge only if the user asks.
- `--ship` (optional): full delivery lifecycle; implies `--make-pr`. After the PR opens, stay on the job until it is MERGED: watch CI and review gates, fix failures and address feedback from the worktree (fresh QA evidence for behavior changes), merge per the repository's merge policy, then remove the worktree and sync `doc/` state back.

## Goal and todo discipline (MANDATORY)

Do ALL of this immediately after the plan is selected, BEFORE the first implementation dispatch. Skipping any step is a defect.

1. **Set the binding goal, in detail.** OMP has no goal tool: write the first ledger entry before dispatch, naming the plan path, concrete end state, phase/task counts, delivery mode, verification criteria, constraints and WHEN TO STOP. Each phase carries its own goal ledger entry, derived from the previous phase’s verified evidence; never invent a goal API or duplicate the aggregate objective.
2. **Register every phase and task as todos.** Mirror the plan into the todo/plan tool of your harness: one phase per plan wave, one todo per column-zero checkbox (including the final verification wave). Register ALL of them up front - never keep tasks in memory only.
3. **Keep them current at every moment.** Mark a todo in_progress when its work dispatches and done immediately after its verification passes. Never batch-complete at the end, never execute work that is not a registered todo; discovered work inside the change's blast radius — the request not delivered, a regression this change introduces, an invalid proof, a failing test or stale doc of touched code — is appended after the open checkpoint as a follow-up checkbox and mirrored as a todo; it joins the open checkpoint only if it blocks that checkpoint's acceptance, otherwise runs after it closes; a defect outside it gets a local finding with reproduction and evidence and a line in the final report; create an external issue only when explicitly authorized. A worker that meets a defect outside its assigned files reports it instead of fixing it; only the orchestrator appends the checkbox and dispatches it to a correctly scoped unit. The todo list, Boulder state, and plan checkboxes must always tell the same story.

## Phase 1: Select the plan

1. Read `doc/boulder.json` if it exists.
2. List work plan files under `doc/plans/`.
3. Select in this strict order, stopping at the first match: (a) an explicit `plan-name` argument matches a plan; (b) exactly one active or paused Boulder work owned by this session — resume it; (c) exactly one selectable plan.
4. If several plans or works remain possible, or the selected existing plan conflicts with the user's latest stated goal, ask ONE focused selection/scope question (which plan, or existing plan vs. new scope) and do nothing else until answered. Do not bootstrap and do not silently pick.
5. If the user explicitly asks for a NEW plan or a new goal, generate it with its own review scope instead of reusing an old plan.
6. Only when no selectable plan exists, enter **No-plan bootstrap**.
7. Record the selected plan path, and the review digest/revision if the plan or its draft already carries one, in the first goal ledger entry and Boulder handoff. If no review receipt exists, write "no review receipt"; never invent or imply one.

### No-plan bootstrap

When the user explicitly said `start work` / `$ulw-execute` and Phase 1 found NO selectable plan (no explicit plan-name match, no owned active/paused work, no plan under `doc/plans/`), that phrase authorizes generating the prerequisite plan: bootstrap `ulw-plan` to create it before execution and implementation, instead of stalling or asking a generic approval question. Bootstrap is never chosen while any plan is selectable, and never on the strength of an inferred "latest" recommendation or goal. A brief or notes file without waves, checkboxes, and acceptance criteria is NOT decision-complete — enter this bootstrap too. Generating the prerequisite plan preserves the user's original explicit execution request: it neither revokes implementation already authorized nor adds commit, push or deploy permission; those remain governed by what the user actually granted.

1. Invoke the `ulw-plan` skill from the current request and require its dynamic adversarial workflow: collect, verify, design, adversarial plan-review, synthesize.
2. The generated work plan must be saved under `doc/plans/<slug>.md` before implementation or Boulder state writes that point at plan work. Record that it was bootstrapped without the curated review gate; do not claim a review receipt.
3. Use safe parallelism in the generated plan only where files, state and verification are independent; same-file writes, shared state, and named dependencies serialize.
4. Preserve safety boundaries. Ask one focused question only when the objective is missing, destructive, or has a safety/product ambiguity that repository exploration cannot resolve.
5. After the plan exists, continue directly to Phase 2.

## Phase 2: Create or update Boulder state

Write `doc/boulder.json` before implementation starts. Use the actual host-supplied session id with omp: prefix for hook ownership; do not invent an id. If no session id is exposed, keep session_ids empty and continue the explicit local run without claiming hook ownership.

```json
{
  "schema_version": 2,
  "active_work_id": "<work-id>",
  "works": {
    "<work-id>": {
      "work_id": "<work-id>",
      "active_plan": "doc/plans/<plan-name>.md",
      "plan_name": "<plan-name>",
      "session_ids": ["omp:<run-id>"],
      "status": "active",
      "worktree_path": null
    }
  }
}
```

Every phase (plan wave) has its own goal and its own branch: before the wave's first dispatch, record the wave's goal — its checkboxes and their acceptance criteria — as a ledger entry, then make sure the work happens off the integration base, never on `develop`/`main` directly. Use the plan's `## Commit strategy` branch (`git switch -c <branch> <integration base>` when it does not exist); when another session or the user shares the checkout, or branch/commit delivery was explicitly authorised, use a task-owned worktree instead: `git worktree add <repo>-wt/<plan>-<wave> <branch off the integration base>` (or verify a `--worktree` path with `git worktree list --porcelain`) and store the absolute path as `worktree_path`. Run every edit, command, test, and evidence capture on that branch; the wave advances once its checkboxes are verified or `[~]`, but only verified changes land on the integration base once landing is authorised (direct merge, or the PR under `--make-pr`/`--ship`; isolate unverified changes without reverting user or sibling work), and the next wave branches from that landed base. Branch creation needs no authorisation; commit, push and merge do.

## Parallel delivery lanes (teams and worktrees)

Solo orchestration with parallel background workers is the default topology. Decide once, when the wave's lanes are known, and record the verdict in the ledger:

- **Independent lanes -> parallel workers.** Separate files, no shared contract: one parallel spawn burst; no team.
- **Dependency-ordered lanes -> native task dependency waves.** Record one phase graph with producer and verification nodes, then batch only dependency-ready nodes. A documented workpool may handle independent items; use only its documented operations. Recover through lead-owned state, supported agent messaging and fresh tasks after failed attempts settle; definition changes invalidate the changed node and its descendants. Reconcile the entire pending set across native wait wakes before starting dependents. Define the next phase as a new graph, not one graph for the whole plan. Read mass-ulw's SKILL.md and references/planning.md in full before defining any graph, and follow the shared OMP recovery contract.
- **Overlapping lanes -> lead-coordinated workers.** Relay discoveries through actual `agent://` ids and serialize conflicting writes. Run them concurrently only when ownership can be separated and parallel work finishes sooner; no team service is assumed.
- **PR-mode independent lanes -> a worktree per lane.** Under `--make-pr`/`--ship`, when a wave holds independent checkboxes, give each lane its own branch and task-owned worktree, delivered as its own PR.

Landing rules, regardless of topology:

- **Merge per verified unit.** A lane lands the moment its own gates pass — it never waits for the slowest sibling once landing is explicitly authorised. Integrate landed work back into the base the remaining lanes branch from.
- **Only the orchestrator merges.** Workers and team members never merge and never push the base branch.
- **Conflicts are the orchestrator's job.** Decide the landing order and tell the later lane what changed; a worker never resolves a sibling's conflict blind.

## Phase 3: Execute the next checkbox

1. Read the full selected plan.
2. Find the first pending `- [ ]` column-0 checkbox in `## Todos` or `## Final verification wave` whose dependencies are met. Skip `[~]` rows and their transitive dependents; continue independent pending tasks.
3. Ignore nested checkboxes under acceptance criteria, evidence, and definition-of-done sections.
4. Classify the checkbox tier and record it in its ledger entry. Default is LIGHT — a narrow change inside existing layers. Take HEAVY only on a fact you can point to: a new module / abstraction / domain model; auth, security, or session; an external integration; a DB schema or migration; concurrency or transaction boundaries; a cross-domain refactor; or the plan or user signals care. When unsure, take HEAVY; upgrade and redo skipped gates the moment a HEAVY fact surfaces; never downgrade.
5. Decompose that checkbox into atomic sub-tasks sized for ONE worker in ONE run — a sub-task that would need mid-flight steering is two sub-tasks. One cohesive change (for example one file plus its test) is ONE sub-task and ONE worker; never split to reach a count. Collect every other unchecked checkbox in the same plan wave whose dependencies are met; their lanes run concurrently only when write paths, state and proof are disjoint, and lanes with overlapping write paths run serially.
6. **DELEGATE IMPLEMENTATION. YOU NEVER IMPLEMENT.** Route every sub-task through the delegation router below, then dispatch the independent sub-tasks (disjoint write paths, state and proof) in one parallel worker-spawn burst (a single batched spawn call where the harness supports it); serialize overlapping write scopes and route named dependencies per the lane-topology decision above. Verification and checkbox marking stay per-checkbox, and the parent's independent real-surface verification is allowed per the absolute rule.
7. Give every dispatched sub-task its completion condition and watch for it per the section below. A dispatch whose completion nobody watches is an unfinished dispatch.

### Monitor every dispatched subagent to its completion condition

A spawned worker is not fire-and-forget. For EACH subagent in the burst, name the observable state that ends its lane — the file written, the PR opened, the checkbox's gates green — and put a watcher on THAT state, never on a clock.

- **Arm one watcher per lane, at spawn time.** The worker's own completion arrives on its own as an injected notification; arm an explicit native async bash condition watch on top of it only when the lane's completion condition lives OUTSIDE the child's final message — CI turning green, a log line, a build artifact appearing, a branch landing. Watch the state itself (native async bash condition watch with a command that exits or emits on that condition), and keep the burst's watchers distinct so one lane firing never reads as another's.
- **NEVER poll and NEVER sleep.** No `sleep`, no timed retry loop, no re-reading the same status hoping it changed, no empty wait loops. Between waves, do independent root work or end the turn to await the auto-delivered notification; an idle session is woken by it. Call native wait only when the next action is blocked on a result still in the pending set, never when that set is empty. A single read of the actual agent:// id is allowed once, only when a midpoint decision genuinely depends on it.
- **Tear the watcher down the instant it resolves.** The moment a monitor fires, or you discover it was armed on the WRONG condition (it watches a path the lane never touches, a pattern that can never match, a lane you already cancelled), stop it with the documented native process-stop route and say so in the ledger. A stale watcher re-fires on unrelated output and corrupts the next wave's verdict.
- **Then advance.** Fired watcher plus verified evidence means that lane's gates run and its checkbox closes; a mis-set watcher means re-arm it on the right condition or drop it, and continue. Never let a dead watcher hold the run open, and never treat watcher silence as a pass.
- **Live pending set.** Keep the pending set as actual handles (child ids, async bash/watch handles). A terminal result removes only its own handle; siblings stay pending. A first result or message is not whole-wave completion, and wait takes no handles and has no filtered or list-jobs form. If the remaining items are auto-delivery-owned and wait cannot target them, end the turn and await the notification rather than looping empty waits.
- **Observation versus runnable check.** A period-defined observation (cron at a stated time, N-day soak) stays waiting until its period or event: record the evidence-backed end condition and never shorten the window. A runnable same-entrypoint check (the cron-equivalent command, run now) is a separate audit: run it when existing permission, duplicate-run, external-write and spend boundaries allow, and record it as an audit, not as the observation. An external message (for example Slack) stays held until the user explicitly approves it.
- **Korean handoff.** For a Korean-speaking user the first sentence states the completed result, the current wait (implementation, CI, observation or approval), the evidence-backed end condition or time, and the next action. Report by phase or event; no ETA or timer daemon is invented. Put the decision context inside the ask panel. Boulder status enum values are unchanged; explanations go in the existing ledger and report.

### Delegation router — recommended task executor category

When the plan annotates a todo with `Recommended task executor category:`, treat it as difficulty/specialty metadata and map it to a listed OMP role under ../ulw-loop/references/omp-contract.md. Never send category or model in a task entry. Omit agent for default task work; choose sonic only for mechanical assignments, scout for exploratory discovery, listed senior-task for difficult reasoning, and reviewer/security-reviewer for reviews. Record any deviation in the ledger and the actual resolved model only after the result. Otherwise classify by shape using the labels below:

| Category | Route here |
| --- | --- |
| `quick` (low) | mechanical, single-file, boilerplate, config/copy — the default for mechanical pieces |
| `unspecified-low` (low) | small tasks that fit no other category |
| `unspecified-high` (medium) | standard features across a few files with known patterns |
| `visual-engineering` (medium) | frontend, UI/UX, styling, animation |
| `writing` (low) | documentation and prose |
| `git` (low) | git operations |
| `deep-low` (medium) | hairy debugging, research-heavy or subtle cross-module work the worker can settle from what it reads |
| `deep-high` (high) | the same, when the central decision cannot be settled from evidence: a trade-off, a cross-package contract, or correctness argued from invariants |
| `ultrabrain` (high) | ONE genuinely hard, logic-heavy problem — hand it the goal, not step-by-step instructions |

Sizing is a two-branch decision made per checkbox, before dispatch:

- **Independent pieces run in parallel.** When the checkbox decomposes into pieces with disjoint files, state and proof, dispatch them in ONE parallel burst of the cheapest adequate workers. Piece count is never a goal; a checkbox that does not decompose is one worker.
- **Cohesive work stays whole.** One cohesive change (a file plus its test, one algorithm, one migration, one subtle bug) is ONE worker; when splitting would sever shared reasoning, send the WHOLE problem to `deep-low`, `deep-high` or `ultrabrain` as ONE delegation. Never force-split work whose parts share one insight or write path.

Each sub-task message must include:

1. Goal, exact files or directories in scope, and the ALLOWED WRITE PATHS: the only paths this worker may modify; everything else is read-only.
2. The tests already covering the touched behavior, READ before any edit as the behavior of record (intent, coverage, pass); a bug's reproduction captured before the fix. A new test ONLY where the repository keeps tests for this behavior AND a regression would otherwise pass unnoticed by the sub-task's Manual-QA scenario — never one that mirrors its implementation (mock-call assertions, pinned constants) or restates the change.
3. Implementation constraints from the plan and project rules.
4. Automated verification commands to run.
5. One Manual-QA channel, named with the exact tool and exact invocation (the literal `curl`, `send-keys`, `page.click` / `session.click`, payload, selectors, and the binary observable that decides PASS/FAIL), not "verify it works". A LIGHT checkbox needs one real-surface proof of its deliverable, and auxiliary surfaces (CLI stdout, DB state diff, parsed config dump) are first-class when the surface is CLI- or data-shaped:
   - HTTP call: `curl -i` against the live endpoint.
   - Terminal / TUI: drive a real pty; `tmux send-keys` is fine for a boot/behavior smoke, but color/layout/CJK evidence goes through an available real terminal renderer, NEVER `tmux capture-pane`.
   - **Browser use**: use the exposed browser tools, with a task-owned profile or authorised attached session as their contract prescribes. Capture action log and screenshot. Never downgrade browser-facing QA to fetched text or clone a live profile.
   - Computer use: OS-level GUI automation against the running desktop app when the surface is not a page.
   - TUI visual evidence: render the real terminal through available host tools and capture a screenshot plus invocation; absence of a renderer is a capability blocker, never a fictional script invocation.
6. The adversarial classes that apply to this sub-task (from the 9 ultraqa classes) and how each is probed.
7. Required artifact path and cleanup receipt.
8. Tool-use expectations: batch independent tool calls in parallel; when the harness exposes a code-execution surface (eval), use it for multi-call steps instead of one-by-one calls.

### Write scope and stage/commit ownership

- **Allowed write paths per dispatch.** Concurrent lanes must have disjoint allowed write paths. Lanes that overlap (same file, generated artifact, shared state or contract) run serially: read the earlier lane's result back before the next starts. Separate worktrees isolate lanes when the checkout is shared or branch/commit delivery was explicitly authorised; otherwise all lanes share the wave's feature branch. Never commit to manufacture isolation.
- **One stage/commit owner per worktree.** Name exactly one owner (default: the orchestrator) in the ledger. Workers never stage, commit, stash, reset, checkout or revert; they report their changed paths. Commit only when the plan's Commit line is `Y` or the user asked for commits; otherwise record `no-commit: user has not authorized commits`, leave the verified unstaged diff on the feature branch, and state in the handoff the branch name and the number of uncommitted files so the user can decide.
- **Scoped staging only.** Before any stage, inspect the working tree for other WIP (other workers, other sessions, the user's dirty files). While any WIP outside the owned paths exists, never use `git add -A`, `git add .`, `git commit -a` or any unscoped stage; stage explicit owned paths only and confirm the staged list equals them before committing.

The 9 ultraqa classes are trigger-mapped: new input parsing → malformed input; untrusted external text → prompt injection; resumable or long-running flows → cancel/resume; generated or cached artifacts → stale state; uncommitted user files in scope → dirty worktree; long external commands → hung or long commands; new or timing-sensitive tests → flaky tests; log-based success claims → misleading success output; mid-operation interrupts → repeated interruptions. A class applies when its trigger fact holds. Probe each applicable class; record the rest as not-applicable with a one-line reason.

## Phase 4: Verify and record evidence

For each checkbox, complete all five gates before marking it done:

1. Plan reread: confirm the checkbox and acceptance criteria.
2. Automated verification: run tests, typecheck, lint, build, or the plan-specific equivalent.
3. Manual-QA channel: capture a real artifact, not a dry-run claim. It must exercise the plan's core behavior through the actual consumer/entrypoint at the revision under test and record a binary observable plus that revision; see Core-behavior acceptance below.
4. Adversarial QA: exercise every class the Phase 3 trigger map marks applicable and capture the observable result for each.
5. Cleanup: register every QA resource teardown as its own todo when spawned (QA scripts, tmux assets, browser sessions, PIDs, ports, containers, temp dirs), execute each, and capture the receipt. No QA asset is left running.

Append evidence to `doc/ulw-execute/ledger.jsonl`, one JSON object per line. Include at least `event`, `plan`, `task`, `session_id`, `commands`, `artifact`, `adversarial_classes`, and `cleanup` fields, plus `attempt` and `checkpoint_opened_at` on every entry tied to a checkbox. `adversarial_classes` lists each probed class with its observable result and each ruled-out class with a one-line reason.

### Completion contract

A worker done claim is never final: each implementation sub-task returns a `DoneClaim`, a different context runs `AdversarialVerify` probing or reproducing the claim, failures loop back to the executor, and only a confirmed verifier verdict becomes `FullyDone`.

Describe each required JSON receipt in its task assignment: the executor returns the DoneClaim object with all the required fields below; a separate verifier returns AdversarialVerify with its required fields and an enum restricted to the four verdict values. The combined example illustrates the two receipts, not one worker returning both. Do not pass outputSchema/schemaMode unless the exposed task schema supports them. Track every pending child by its actual handle across auto-deliveries and first-result native wait wakes, removing only terminal ones and keeping siblings pending, and wait only while a pending result blocks the gate; validate the actual terminal response (or full agent:// payload), and independently inspect the cited evidence. Invalid/missing fields, execution failures or an unfinished verifier keep the gate blocked. Never infer FullyDone from job status, preview text, or an unparsed result envelope.

```json
{
  "DoneClaim": {
    "task": "<task id/title>",
    "changed_files": ["path"],
    "tests": ["exact command + result"],
    "manual_qa": ["artifact path"],
    "cleanup": ["receipt"],
    "risks": ["known risk or none"]
  },
  "AdversarialVerify": {
    "verdict": "confirmed | false-positive | needs-fix | needs-human-review",
    "failure_class": "none | product | harness",
    "evidence": ["file path, command, log, artifact, or explicit not inspected"],
    "repro": "exact command or manual steps when available",
    "confidence": 0.0
  }
}
```

Rules:
- `confirmed` is the only pass verdict. `false-positive`, `needs-fix`, and `needs-human-review` all block checkbox completion.
- The verifier must be independent from the executor: use a fresh available reviewer worker, or root only when root did not implement or materially rewrite that task. OMP selects the role's model.
- A worker done claim must be independently verified before it becomes checkbox completion.
- On a non-confirmed verdict, record the attempt number and failure signature: the failing check plus its first error line, stripping volatile temp paths, timestamps, process/run ids and durations. Count attempts per checkbox across sub-tasks, re-splits and resumes from its first dispatch (`checkpoint_opened_at`). Stop when the same signature repeats on consecutive attempts, on the third failed attempt, or after 4 hours open. A plan may change these numbers, never remove the bound. Check elapsed time on watcher completion and every resume even without a verdict; cancel and settle the lane when the bound expires.
- At a bound, mark the checkbox `- [~]` with a one-line unmet gap and last evidence. Mark all direct and transitive dependents `[~]` with `blocked by <id>`, close their todos labelled `blocked: <gap>` without claiming success, and append an `unmet` ledger entry listing what each attempt changed. Continue independent pending checkpoints in the same turn, or finalize when none remain. Below the bound, keep `- [ ]` and re-dispatch with the exact failure.
- Final Verification Wave rows verify delivered work and report blocked rows as known gaps; they are not blocked dependents, and a known `[~]` gap alone does not fail their verification. Never reopen or re-queue a `[~]` gap in this run, including through blast-radius discoveries or final-wave feedback; the single harness-repair follow-up below is the only exception.
- The verifier sets `failure_class`. A `harness` failure means the runner, fixture, CI job or environment failed before product behavior was exercised. Allow one repair dispatch inside the checkpoint, excluded from the attempt count but not the elapsed-time bound. If it recurs, block as above and append one harness-repair follow-up checkbox. A blocked harness-repair follow-up is reported, never appended again.
- Isolate a blocked row's unverified changes from delivery. Never revert user or sibling changes; retain inseparable changes and report the delivery blocker instead of rolling back shared work.
- The verifier must probe the applicable adversarial keys, including `stale_state`, `dirty_worktree`, and `misleading_success_output`, before allowing `FullyDone`.
- **Core-behavior acceptance.** A done claim or verifier verdict counts only if it proves the ORIGINAL request's core behavior at the real consumer/entrypoint that will be delivered, against the named source revision, with a binary PASS/FAIL observable. A header, list, fixture, exit 0, passing log, grep hit, or worker assertion alone is `needs-fix`, never `confirmed`. Example: a list screen visible but the terminal pane blank is FAIL; a CLI that passes only on a fixture the real entrypoint never reads is FAIL. When existing checks cannot catch the defect, reproduce it against the known-bad prior revision or an isolated mutation and show the fixed revision differs. Not every prose-only change needs a mutation.

## Phase 5: Mark progress

Only after verification passes:

1. Edit the plan checkbox from `- [ ]` to `- [x]`.
2. Re-read the plan and confirm the remaining count decreased.
3. Append a `task-completed` ledger entry.
4. Continue with the next checkbox. Do not ask whether to continue.

## Completion

When all top-level checkboxes in `## Todos` and `## Final verification wave` are `[x]` or `[~]`:

Finalize in the closing turn: the hook does not restart blocked-only work, even if its Boulder status is still active.

1. Run the plan’s final verification commands once through fresh verification workers or the parent as independent verifier, and independently audit their artifacts.
2. For PR/branch work, finish the lifecycle from the last phase's worktree: sync `doc/` state back to the main repo, create or update the PR, wait for review/verification gates, merge only with explicit user authorisation, and remove the worktree only after successful merge or explicit handoff.
3. Mark the Boulder work `complete` only when every row is verified; otherwise mark it `blocked`, retaining the unmet ledger and gaps.
4. Print an `ORCHESTRATION COMPLETE` block with the plan path, verification commands, artifacts, and cleanup receipts. If any row is `[~]`, state that the objective remains unmet and name each blocked row, its gap and last evidence; orchestration ending is not success.

## Hard rules

- No production change before the tests covering that behavior were read and a bug's reproduction captured; existing tests are green on the unchanged code first, and one that contradicts the intent is a FINDING, never edited green.
- No `--dry-run` as completion evidence.
- No tests-only completion claim. A Manual-QA artifact is required.
- **NO DIRECT PRODUCT IMPLEMENTATION BY THE ORCHESTRATOR.** Root NEVER edits product files or writes tests itself — a spawned worker does. Root independently verifies delivery and MAY run real-surface QA and integration checks (including the main-session checks the host requires), recording them as its own evidence; do not delegate follow-up merely to relay another worker's claim.
- No completion claim while an applicable ultraqa adversarial class was never probed. Each applicable class needs a captured observable result; each skipped class needs a one-line not-applicable reason in the ledger.
- For authorised branch delivery, implementation and review use owned worktrees. Without that authorisation use disjoint owned local scopes and preserve dirty user files; never manufacture commits to create isolation. Stage and commit only through the single named owner, with owned paths only (see Write scope and stage/commit ownership).
- No invented or unprefixed session ids in Boulder state. Actual host ids use `omp:<run-id>`; unavailable identity leaves session_ids empty.
- No stale-memory execution. The plan and ledger are the durable source of truth.
