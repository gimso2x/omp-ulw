# Task 2 - fan-out removal and write/staging ownership (QA-by-read)

Scope: `skills/ulw-execute/SKILL.md`, `skills/ulw-plan/references/full-workflow.md`, `skills/ulw-plan/scripts/plan-templates.mjs`, `skills/ulw-loop/references/omp-contract.md`. Prose/template change; not executed. Tests, build and host check not run (parent runs later). No Git operations. Backups of the four originals were diffed in /tmp/t2bak (scratch, removable).

This is a document judgment, not evidence that a live model obeys the new prose.

## Edits (post-edit line refs)

- execute/SKILL.md: 16 (absolute rule: implementation/test authoring/sub-task QA delegated; parent MAY run independent real-surface QA and integration checks, read-only for product files); 105 (cohesive change = one worker; count-based "under-split" removed; concurrency only for disjoint paths/state/proof; overlap serial); 106 (delegate implementation; serialize overlapping writes; parent verification allowed); 124 (quick row "default for mechanical pieces"); 136-137 (swarm preference removed; cohesive work stays whole); 141 (allowed write paths per dispatch); 155-159 (new "Write scope and stage/commit ownership"); 221 (final verification by fresh workers or parent); 231 (rewritten "NO DIRECT PRODUCT IMPLEMENTATION" rule, parent QA allowed); 233 (single named owner, owned paths only).
- full-workflow.md: 176 (count targets removed; cohesive one todo/one worker; same wave only if disjoint; allowed write paths in todo; Commit strategy owner/owned-path staging; "prefer many small quick todos" removed).
- plan-templates.mjs: 86-87 (awaiting-approval only for a genuine owner decision/ambiguous scope; explicit plan request already authorizes the plan; implementation/commit/push/deploy never authorized), 115 (next-move boilerplate no longer says "approve"), 141 (wave count rule replaced), 151 (todo line names allowed write paths), 165 (Commit strategy owner note).
- omp-contract.md: 13 (one worker per cohesive change, disjoint-only parallelism, allowed write paths, serial overlap, worktree only if authorised, lead may run independent QA, one stage/commit owner, no broad `git add -A` with WIP).

## Preserved machine-consumed structure (checked)

- `node --check plan-templates.mjs`: OK. `buildPlanSkeleton` section headers equal `PLAN_SECTION_HEADERS` (8, same order). Task row `- [ ] 1. <title>`, F-row emission via `FINAL_VERIFICATION_ITEMS`, `status: drafting`, `Your next move:` prefix, `pending-action`/review-state block unchanged. Only comment/prose lines and one added quoted line under `## Commit strategy` differ. No backtick or `${` introduced into the template literal.
- No test/script in repo references the changed template text (grep of skills.test.ts, ulw.test.ts, tests/, scaffold-plan.mjs for `Commit strategy`, `Parallel execution waves`, `What to do`: none).

## Four-case source matrix (read of the four files)

| Case | Source expectation | Where | Verdict |
| --- | --- | --- | --- |
| one-worker: one file plus its test, one cohesive change | ONE sub-task/ONE worker; no count target | execute 105, 137; full-workflow 176; template 141; contract 13 | PASS - no "<3 under-split" or "5-8" remains in these four files |
| overlap: two units writing the same file/state | serialized; earlier result read back first; worktree only if authorised | execute 105, 106, 157; template 141; contract 13 | PASS |
| disjoint: two units with independent files/state/proof | may run in parallel in one burst | execute 106, 136; full-workflow 176; contract 13 | PASS |
| foreignWIP: other workers' or user WIP in same worktree | one named stage/commit owner; no `git add -A`/`git add .`/`commit -a`; stage explicit owned paths; no unauthorised worktree/commit | execute 157-159, 233; template 165; full-workflow 176; contract 13 | PASS |

Parent QA conflict: the only prior "no QA yourself" sentences (execute 16, 225 originally; 221 final-verification delegation) are rewritten; grep for `QA yourself|runs QA itself|never.*QA` in execute finds none contradicting. Implementation delegation is retained.

## Authorization reconciliation

Template 86-87 and 115 now match task1 ("Explicit plan request" in full-workflow 141, SKILL.md): no generic approval question when no genuine owner decision/ambiguous selection remains; owner decisions still use `awaiting-approval` and one question. Closes the task-1 open item (old template line 86).

## Residual count rules - CLOSED (task2 Files extended by parent)

- `skills/ulw-loop/references/full-workflow.md:79` closed: "Target 5-8 ... <3 ... under-splitting" replaced by "counts are not goals; one cohesive change is one task/one worker; parallelize only disjoint write paths/state/proof; overlap serialized via dependency edges"; final sentence requires disjointness for same-wave dispatch. Heading now "maximum useful parallelism". Implementation+Test=ONE task, dependency matrix, critical path, tier/QA/evidence recording preserved.
- `skills/mass-ulw/references/planning.md:27` closed: "Fewer than 3 means under-splitting" removed; one node per independent chunk (disjoint writes/state/proof), "one, five or sixty", single cohesive node is a valid wave, overlap serialized; the twelve-quick-vs-three-deep remark now conditional on true independence. Slot limiter, fan-in above ~10, and axis list preserved.
- Grep of skills/ for `under-split|Fewer than 3|<3 per wave|Target 5` now finds no count mandate in the six task2 sources (init-deep `Target 50-150 lines` is unrelated).

- `execute/SKILL.md` line 177 (worker DoneClaim then fresh `AdversarialVerify`) is a verification-independence rule, left as is.

## Not run

`bun test`, `bun tests/ulw-host-check.ts`, any live-model compliance observation.
