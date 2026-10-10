# Task 3 - pending set, observation vs runnable check, Korean handoff (QA-by-read)

Scope: `skills/ulw-execute/SKILL.md`, `skills/ulw-loop/references/omp-contract.md`. Prose change only; not executed. `bun test`, `bun tests/ulw-host-check.ts`, build/lint/format not run (parent runs later). No Git operations. This is a document judgment from reading the post-edit files, NOT evidence that a live model obeys the prose.

Basis read before editing: plan task3 (plan lines 87-97), task1/2 language in both files (selection, core-behavior acceptance, write/stage ownership, parent QA allowed), and the current `wait` tool doc (schema `{}`, no handles; "returns on the first result, a message ... or a steering interrupt"; "Nothing you started running? Errors"; "Results and messages auto-deliver. NEVER poll"). No filtered wait or list-jobs API appears there, and none was added.

## Edits (post-edit line refs)

- omp-contract.md 13: "wait collects terminal outputs" -> native wait wakes on a settled result or message. 19: live pending set keyed by actual handles; a terminal result removes only its own handle; first result/message/still-running snapshot is not whole-wave completion; call wait only when the next action is blocked on a pending result; never on an empty set, no empty-wait loops; if the rest is auto-delivery-owned and wait cannot target it, end the turn and await the notification; explicitly no filtered-wait/list-jobs API. 21 (new): period-defined observation vs runnable same-entrypoint audit; external messages (Slack/email/chat) stay held until explicit approval. 23 (new): Korean handoff four fields in the first sentence, phase/event based, no ETA/timer daemon, Boulder enum unchanged. 35: decision context goes inside the ask panel. 49: async bash/watch handles join the pending set and auto-deliver; wait only when blocked (replaces "collect their handles through wait").
- execute/SKILL.md 114: no empty wait loops; end turn to await auto-delivery; wait only when blocked on a pending result, never on an empty set. 117-119 (new bullets in the monitor section): live pending set, observation vs runnable check (+ Slack hold), Korean handoff. 182 (DoneClaim/verify gate): "Collect all pending children across first-result wake" -> track by actual handle, remove only terminal ones, wait only while a pending result blocks the gate.
- Untouched on purpose: execute 89 (reconcile the pending set across wake events; consistent), 225 (waiting for PR review gates; unrelated), contract 15 (task/wait dependency waves; consistent), contract 47 (external send authorization already present; reinforced by 21). Task1/2 selection, acceptance and staging text is unchanged.

## Six-case matrix (read of both files)

| # | Case | Contract result | Where | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Last pending child reaches terminal result | Its own handle is removed; the set is empty; wait must NOT be called, no empty loop; proceed to the dependent/final step | contract 19; execute 114, 117 | PASS |
| 2 | One of several children finishes (or a message/first result arrives) | Only that handle is removed; siblings stay pending; not whole-wave completion; wait again only if the next action is blocked by a pending result; if the rest cannot be targeted by wait, end the turn and await notification | contract 19; execute 117, 182 | PASS |
| 3 | Duration observation (cron at a stated time, N-day soak) | Stays waiting; end condition recorded with evidence; window never shortened; an early check is not a substitute | contract 21; execute 118 | PASS |
| 4 | Runnable cron-equivalent command (same entrypoint) | Distinct from case 3: run now as an audit if existing permission, duplicate-run, external-write and spend boundaries allow; recorded as an audit, not the observation; blocked boundary recorded and held | contract 21; execute 118 | PASS |
| 5 | Slack send without user approval | Held until explicit approval, even if the command is otherwise runnable; also covered by the existing external-message rule | contract 21, 47; execute 118 | PASS |
| 6 | Korean handoff | First sentence: completed result, current wait (implementation/CI/observation/approval), evidence-backed end condition or time, next action; phase/event based; no ETA or timer daemon; ask-panel context; Boulder enum unchanged | contract 23, 35; execute 119 | PASS |

Cases are distinguishable in the new text: 1 vs 2 (empty vs non-empty set), 3 vs 4 (period vs runnable), 4 vs 5 (runnable command vs external write needing approval).

## DoneClaim

```json
{
  "task": "task3 - pending-set, observation/runnable, Korean handoff contract",
  "changed_files": ["skills/ulw-execute/SKILL.md", "skills/ulw-loop/references/omp-contract.md", "doc/evidence/ulw-session-reliability/task-3-wait-review.md"],
  "tests": ["none run (prose change; QA-by-read only)"],
  "manual_qa": ["doc/evidence/ulw-session-reliability/task-3-wait-review.md six-case read matrix, all PASS"],
  "cleanup": ["no temp files, processes or backups created"],
  "risks": ["prose-level guidance only; live model compliance and real cron/Slack behavior not exercised", "execute/SKILL.md line 16 and other long lines were not rewritten; only the lines listed above changed"]
}
```
