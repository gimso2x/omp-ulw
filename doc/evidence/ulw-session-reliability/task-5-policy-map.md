# Task 5 policy map: source -> compact (QA-by-read)

Scope: `skills/ultrawork/SKILL.md` (baseline) and `skills/ultrawork/references/astra-directive.md` (Astra). Prose only. This is a document read, NOT evidence that a live model obeys the compact text. Sizes: `task-5-payload-size.json`. Runtime (`ulw.ts`), tests and other skills untouched. No Git operations.

Astra is generated from the baseline body plus three deliberate differences (below), so one table covers both. Line numbers are the baseline `SKILL.md` after edit; Astra lines are about 6 lower (no frontmatter/source note).

## Structure kept

| Item | Where | Result |
|---|---|---|
| Frontmatter, `Source:` note | SKILL.md 1-6 | byte-identical to HEAD |
| Exactly one `<ultrawork-mode>` region | SKILL.md 8 / 88 | 1 open, 1 close; none in Astra (raw body, `ulw.ts` splits only SKILL.md) |
| Mandatory first marker `ULTRAWORK MODE ENABLED!` | 10-11, 76 | kept in both |
| Astra provenance comment | astra 1 | identical to HEAD |
| Model selection (`gpt-6-astra`, `-fast` only) | `ulw.ts` | unchanged; `selectUlwDirective` verified in size JSON |

## Preservation map

| Source principle (old section) | Compact location | Kept / changed |
|---|---|---|
| Opening marker replaces ordinary format; armed session; cancel stops; new unrelated request replaces goal (OMP transport) | 15-17 | kept; added: same-goal follow-up does not repeat bootstrap, plan summary or handoff |
| Tool schemas, project instructions, user restrictions binding; no manufactured permission | 19 | kept |
| Commit/stage/push only when explicitly authorized; else leave diff unstaged | 19, (Commits section folded) | kept; commit convention/`Plan:` footer folded into one sentence |
| Approval before merge/release/deploy/external messages/destructive | 19 | kept; Slack/email/chat held until approved (task3) |
| Protect user changes; worktree per workspace policy | 19 | kept |
| Plan request needs no duplicate approval; owner decision and impl/deploy authority separate (task1) | 21 | new, one sentence |
| Selected-plan authority: name, else owned active work, else sole selectable plan; no bootstrap from inferred recommendation; one question on conflict (task1) | 21 | new, one sentence |
| Child isolation: no auto-armed ULW/pointers; scope-only evidence; no parent goal takeover/re-delegation | 23 | kept |
| Task schema, no Senpi category args, agent/outputSchema only when needed, `TASK/DELIVERABLE/SCOPE/VERIFY/STOP WHEN` | 23 | kept; role list, model fallback detail and wait/recovery detail moved to a pointer to `ulw-loop/references/omp-contract.md` |
| No Senpi goal tool/monitor/team API; host tools over shell; `ask` blocks | 25 | kept, shortened |
| Explicit-workflow gating; loop/execute state supersedes bootstrap; bare ULW grants no git authority | 27 | kept |
| Memory discipline | 29 | kept, shortened |
| Real-surface proof; TESTS ALONE NEVER PROVE DONE | 31-32 | kept |
| Core consumer proof: core behavior, real consumer/entrypoint, binary observable, revision; list/header/exit0/fixture/worker claim not enough; known-bad or mutation contrast; prose needs none (task1) | 32 | new |
| Tier triage, ratchet up only, HEAVY facts, LIGHT/HEAVY sizing | 34-35 | kept; wording compressed. Baseline: unsure -> HEAVY (as HEAD). Astra: unsure -> LIGHT (as HEAD) |
| Manual-QA channels (curl, xterm.js not tmux capture-pane, browser real page, never clear user's profile, desktop/mobile, GUI, 3D angles), literal scenario + binary observable, auxiliary surfaces, no `--dry-run`/"looks correct" | 37-38 | kept, compressed; per-channel prose and TUI-runner note condensed |
| Bootstrap 0-3 (skills, discovery wave, goal block, stop line, notepad, todo) | 40-43 | kept as three lightweight once-per-goal steps; GOOD/BAD todo examples, notepad template block, planning-child detail and "topology" paragraph dropped |
| Bare ULW lightweight; workflow detail lazy | 27, 40-43 | no plan-file/plan-topology ceremony in bare ULW; details live in the workflow skills |
| Compaction/context-loss recovery | 44 | changed: read goal, Now, open work and needed evidence; read everything only on contradiction or loss (was: unconditional whole-notepad re-read) |
| Never guess; lsp/ast-grep/find ladder; parallel eval cell; one-at-a-time for edits/side effects; render-look for visuals; Bun kernel note | 46-48 | kept, compressed |
| Disjoint write scopes; cohesive change = one owner; no task-count criteria; allowed write paths; one stage/commit owner; no `git add -A` (task2) | 49 | new/merged |
| Execution loop READ/CHANGE/RUN/CLEAN; tests are behavior of record; never edit test green; no test restating a constant; prose targets only machine-consumed pins; refresh PR/review state | 51-59 | kept; coverage-only mutation rule and per-resource teardown examples dropped except the resource list |
| Cleanup receipt required before criterion completes; leftover QA state = not done | 57, 84 | kept |
| Evidence valid until input changes; rerun what moved; full set once before final | 59 | kept |
| Async watch registered at start; no sleep/poll/watcher child | 62 | kept |
| Live pending handles; first result/message not wave end; wait only when blocked; empty set -> no wait; auto-delivery owner -> end turn; no list-jobs API (task3) | 63 | new |
| Waiting on goal is legal turn ending, `blocked` only on true impasse; user-only decision via ask | 63 | kept |
| Duration observation vs runnable same-entrypoint audit; external messages held (task3) | 64 | new |
| Child lifecycle: WORKING/BLOCKED, ack-only follow-up, inconclusive never pass, no done/dependents/final while a child owns evidence | 65 | kept, shortened; cancel/verify-terminal detail left to omp-contract |
| Risk-based review: reviewer only with plan file AND (HEAVY or strict review); else self-review; plan-reviewer/consultant plan-gated; 2 re-reviews then ask | 67-69 | kept, compressed |
| Smallest change; blast-radius defects fixed; outside defects reported; deferral never PASS | 72 | kept |
| Never suppress, never skip/delete tests; never claim done from inference | 73 | kept |
| Output: first-line marker; first-bootstrap plan summary; handoff block Ask/wanted/For you/Now/Next at events only; final message list | 75-79 | kept; same-goal follow-ups skip summary; concise Korean handoff first sentence (result, state, grounded end condition/time, next); no invented ETA/timer (task3) |
| Stop rules: answer when evidence suffices; STOP GOAL; leftover QA; 2 failures -> ask; 2 exploration waves -> act | 81-85 | kept, shortened |

## Astra differences from baseline (all from HEAD Astra)

1. Skill survey: name only skills whose declared workflow this task executes (baseline: skim and use every applicable skill).
2. Tier uncertainty: when unsure take LIGHT; HEAVY found mid-task adds what LIGHT skipped (baseline: HEAVY; redo).
3. Delegated-wave spot-check paragraph (artifact read both directions, rerun only on missing/stale/contradictory evidence, combined checks run once after integration, strict-result fields validated, dependents after all prerequisites, correct the actual agent id). Condensed from the old Astra section.

## Deliberately dropped (workflow detail or ceremony)

Notepad markdown template and GOOD/BAD todo pair; mandatory planning-child topology paragraph; "OMP task and cooperating lanes" boilerplate duplicating the task schema and `omp-contract.md`; per-resource teardown examples; coverage-only mutation procedure; separate Commits section (folded into line 19); repeated stop/handoff restatements.

## Cases read against the compact text

| Case | Judgment |
|---|---|
| Same-goal follow-up turn | no bootstrap, plan summary or handoff repeated (17, 78) PASS |
| Compaction with intact notepad | read goal/Now/open/needed evidence, no full restore (44) PASS |
| Compaction with contradiction | full restore (44) PASS |
| "plan 작성해줘" | writes plan, no generic approval, no impl authority (21) PASS |
| Execute with one selectable plan | selected, no new plan (21) PASS |
| Last child finished, nothing pending | no `wait` (63) PASS |
| One of several children done | siblings stay pending, wait only if blocked (63) PASS |
| 24h soak vs runnable cron audit | observation kept; audit run within authority (64) PASS |
| Slack send without approval | held (19, 64) PASS |
| Terminal list visible but blank / CLI fixture-only pass | not done (32) PASS |
| Quoted ULW keyword, child brief | child never armed (23); runtime gating unchanged PASS |

Limits: the byte ratio is a measurement, not a test. The two payload variants are checked structurally by existing `ulw.test.ts` equality and by the size JSON selection check, not by pinning prose.
