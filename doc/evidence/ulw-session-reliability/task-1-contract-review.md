# Task 1 contract review (QA-by-read)

Plan: `doc/plans/ulw-session-reliability.md` task 1 (IS-1, IS-4). Worktree: `/home/ubuntu/work/omp-ulw-wt/session-reliability`.

Limit: this is a document read. It does NOT prove any live model obeys the new prose. Tests, build, lint and format were NOT run (parent-owned, deferred). Nothing was staged or committed.

## Changed passages (line refs after edit)

- `skills/ulw-execute/SKILL.md`
  - 43-49 Phase 1 selection: strict order (a) explicit plan-name, (b) exactly one active/paused work owned by this session, (c) exactly one selectable plan; ambiguity or conflict with latest goal -> ONE selection/scope question, no bootstrap; explicit new-plan request -> new plan with own review scope; bootstrap only if none selectable; record plan path plus existing review digest/revision, else "no review receipt", never invented.
  - 53-59 No-plan bootstrap: only when no selectable plan; never from an inferred "latest" recommendation; authorizes plan writing only (implement/commit/push/deploy separate); no review receipt claimed.
  - 163 Phase 4 gate 3: Manual-QA must exercise core behavior at the real consumer/entrypoint at the revision under test with a binary observable.
  - 200 "Core-behavior acceptance" rule: header/list/fixture/exit 0/log/grep/worker claim alone is `needs-fix`; known-bad prior revision or isolated mutation contrast when existing checks miss the defect; prose-only changes need no mutation.
- `skills/ulw-plan/SKILL.md`
  - 6, 44-45, 50-51: opening pledge and preview no longer promise a generic okay before writing; the explicit plan request authorizes plan writing only.
  - 20: bootstrap only when no plan selectable or new plan requested; "no review receipt".
  - 105: per-todo acceptance names core behavior, consumer, binary observable, revision.
  - 109: "Explicit plan request (authoritative)" - no generic Approve question; one focused question only for ambiguous scope/selection or a genuine owner decision; implementation/commit/push/deploy/spend stay separate; gate (111) applies only to open items.
  - 128: stop rule aligned.
- `skills/ulw-plan/references/full-workflow.md`
  - 17 (same bootstrap text as SKILL 20), 141 (explicit plan request paragraph, supersedes generic Approve question), 148 (Approval bullet reconciled; removed "original request is not this gate's approval"), 160 (core-behavior self-review item), 199 (handoff names plan path and existing digest/round), 249 (stop rule).
  - Review/scaffold/lifecycle JSON machinery untouched.

## Scenario matrix (exact plan task1 five cases)

| # | Scenario | Contract read | Verdict |
|---|---|---|---|
| 1 | One existing plan, bare `/ulw-execute` | execute 45(c) selects it; 46/48 forbid bootstrap while selectable; 49 records path/digest | PASS - no arbitrary new plan |
| 2 | Multiple plans, no name/owned work | execute 46: ONE selection question, no silent pick, no bootstrap | PASS - one question |
| 3 | Genuinely new goal | execute 47 new plan with own review scope; plan SKILL 109 authorizes writing without generic approval; owner decisions still asked | PASS - new scope explicit |
| 4 | List shown but terminal blank | execute 200 + 163: list/header alone is `needs-fix`; core terminal behavior must be observed at real entrypoint | PASS - cannot complete |
| 5 | CLI passes only on fixture | execute 200: fixture/exit 0 alone not confirmed; real consumer + revision + bad/good contrast | PASS - cannot complete |

## Residual notes

- Closed (task-1 files extended by parent): `skills/ulw-plan/references/intent-clear.md` lines 18, 34, 38, 48 and `intent-unclear.md` line 40 no longer require a generic plan-writing okay; they defer to SKILL.md "Explicit plan request" (SKILL 109 / full-workflow 141). Gate/question remains only for a genuine owner decision or ambiguous scope/selection (clear worked example, line 45-48, keeps its owner-decision question). Both refs state plan authorization never grants implementation, commit, push or deploy; the unclear ref's bootstrap exception says the execute request authorizes the prerequisite plan only, preserving (not revoking or adding to) existing permissions. `skills/ulw-execute/SKILL.md:53` states the same.
- Still open, owned by task 2: `skills/ulw-plan/scripts/plan-templates.mjs:86` comment (`set status: awaiting-approval`); not edited here. Also `intent-unclear.md` still has a pre-plan "2-3 candidate approaches" critique round for unknown-style users (a stance choice, left intact).
- Existing `skills.test.ts` checks only SKILL name and template path targets; no prose pins were found for changed passages (grep). Not executed.
