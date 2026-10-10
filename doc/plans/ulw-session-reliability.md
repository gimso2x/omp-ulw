# omp-ulw 사용 세션 신뢰성·효율 개선 계획

## TL;DR (For humans)

**대상과 결과:** 여러 ULW 작업을 동시에 쓰는 사용자가 핵심 기능이 실제로 동작하는 결과를 받고, 무엇을 기다리는지 알며, 다른 작업자의 변경이 섞이지 않도록 개선한다.

**접근:** 검증은 유지한다. 강제 작업 분할과 중복 의전을 줄이고, 완료 판정·작업 소유권·계획 선택을 먼저 정리한 뒤 세션 상태 제어와 공통 정책 축약을 적용한다.

**범위:** 기존 확장과 워크플로만 수정한다. 새 스케줄러·대시보드·데이터베이스·외부 의존성을 만들지 않는다. 기존 진행 중인 앱/위키/봇 작업을 변경하거나 종료하지 않는다.

**규모:** Medium. **위험:** Medium — 세션 활성화와 자동 continuation 회귀를 피해야 한다. 구현 tier는 HEAVY다.

이 문서는 계획이다. 구현·Git stage/commit/push·현재 OMP 재시작은 별도 실행 요청과 기존 권한 범위에 따른다.

## Scope

### Affected user and ideal state

| 기준 | 사용자가 원하는 상태 | 현재 격차 |
|---|---|---|
| IS-1 | 핵심 사용 흐름이 동작해야 완료 | Android의 목록/헤더 검증이 빈 터미널을 놓침; 소비자 대신 fixture만 검사 |
| IS-2 | 작업과 Git 변경의 소유자가 명확 | 최소 3개 작업 분할 규칙; 같은 worktree에서 다른 작업자 WIP staging |
| IS-3 | 무엇을 기다리고 어떻게 재개하는지 보임 | 예정 cron 시각을 불필요하게 기다림; 빈 wait 반복; 영어/침묵 보고 |
| IS-4 | 명시된 계획·범위로 실행/재개 | 인자 없는 execute가 검토된 계획 대신 새 계획을 선택 |
| IS-5 | ULW 상태 확인과 해제가 가능 | 로컬 전용 상태/해제 명령 없음 |
| IS-6 | 작은 요청은 가볍게, 위험한 요청은 실제 검증 | 공통 정책 약32KB, 책임 충돌과 중복 문구 |

Must have: 위 6개 기준에 대응하는 변경, 기존 false-trigger/child isolation/provider fallback/continuation guards 보존, 한국어 handoff, 사용자 변경 보존.

Must NOT have: OMP 본체 수정, 임의 job/child 상태 API, Git 명령 차단기를 새로 만드는 것, 무단 worktree/commit/배포, prose snapshot 테스트, fixture PASS로 LLM 준수나 사용자 완료를 주장하는 것.

대상 저장소: `/home/ubuntu/work/omp-ulw`, 계획 기준 HEAD `9087982`. `README.md`는 사전 수정 상태다. 해당 변경을 보존한 scoped edit만 허용한다.

## Verification strategy

- 테스트 전략: runtime은 기존 Bun 회귀를 확장하는 tests-after; prose는 QA-by-read와 독립 검토. 순수 문구를 고정하는 새 테스트를 만들지 않는다.
- 실제 runtime 표면: 기존 `bun tests/ulw-host-check.ts`가 설치된 OMP와 loopback provider를 실행한다. command-only RPC 완료 경로를 추가해 실제 등록 명령을 검사한다.
- 정량화: 실제 provider payload의 `<omo-ulw-policy>` UTF-8 byte 수를 전/후 측정한다. baseline/variant 각각 기존의50% 이하를 목표로 한다. 전체 컨텍스트·토큰 청구가 같은 비율로 감소한다고 주장하지 않는다.
- 모델이 새 prose를 준수하는지는 fixed-response host fixture로 증명할 수 없다. 구현 완료 보고에서 이 한계를 밝히고 이후 실제 작업에서 관찰한다. 별도 paid benchmark나 새 평가 프레임워크는 이 변경에 포함하지 않는다.
- 모든 evidence: `doc/evidence/ulw-session-reliability/` 아래. 소스/시험/설정 SHA와 명령, 결과, cleanup을 연결한다.
- 최종 코드와 문서가 준비된 뒤 `bun test` 및 `bun tests/ulw-host-check.ts`를 각각 한 번 실행한다. 새 변경이나 실패가 생기면 영향 경로만 재실행한다. 여러 검토자가 같은 전체 suite를 중복 실행하지 않는다.

## Execution strategy

단일 integration owner가 문서·공통 파일을 관리한다. 이 저장소에서 무권한 branch/commit 생성은 없다. 문서 작업1→2→3은 공유 파일이 있어 직렬이다. runtime4와 policy5는 write path가 달라 병렬 가능하나, 최종 검사는 통합 뒤 한 소유자가 실행한다. task6은 모두 통합된 뒤 수행한다.

| Wave | 작업 | 이유 |
|---|---|---|
| A | 1 → 2 → 3 | 완료·권한·대기 계약을 먼저 일관되게 정리. 같은 문서 충돌 방지 |
| B | 4 ∥ 5 | 세션 제어 코드와 정책 payload 축약은 독립 write scope |
| C | 6 | 실제 host 검증과 사용 문서를 최종 상태에 맞춰 마감 |

| Todo | Depends on | Blocks | Can parallelize with |
|---|---|---|---|
| 1 | 없음 | 2,3,5 | 없음 |
| 2 | 1 | 3,5 | 없음 |
| 3 | 2 | 4,5 | 없음 |
| 4 | 3 | 6 | 5 |
| 5 | 3 | 6 | 4 |
| 6 | 4,5 | F1-F4 | 없음 |

## Todos

- [x] 1. 핵심 소비자 완료 기준과 계획 선택 계약 정리
  - Closes: IS-1, IS-4.
  - Files: `skills/ulw-execute/SKILL.md`, `skills/ulw-plan/SKILL.md`, `skills/ulw-plan/references/full-workflow.md`, `skills/ulw-plan/references/intent-clear.md`, `skills/ulw-plan/references/intent-unclear.md`. 구현 중 발견된 보조 참조의 중복 승인 규칙도 동일 계약으로 맞춘다.
  - Change: acceptance에 원래 요청의 핵심 동작, 실제 전달될 consumer/entrypoint, 성공/실패의 binary observable, 해당 source revision을 명시한다. 목록·헤더·exit0·worker 주장만으로 핵심 기능을 완료 처리하지 않는다. 기존 검사로 결함이 안 잡히면 불량 이전 구현/격리된 mutation과 수정본 대조를 한다. 모든 prose 변경에 mutation을 요구하지는 않는다.
  - Change: execute 선택은 명시적 plan-name → 이 세션 소유 active/paused work → 유일한 selectable plan 순서. 선택한 plan path와 이미 있는 review digest/revision을 handoff/기존 ledger에 기록한다. selectable plan이 있는데 inferred latest recommendation을 근거로 no-plan bootstrap을 쓰지 않는다. 여러 후보 또는 기존 계획과 최신 목표가 충돌하면 한 번만 selection/scope 질문을 한다. 명시적으로 새 계획을 요청했을 때 새 계획과 그 검토 범위를 생성한다. 없는 review receipt를 있다고 꾸미지 않는다.
  - Change: 명확한 계획 작성 요청에 generic '계획을 작성해도 되나'를 반복하지 않는다. 실제 소유자 결정과 구현/배포 권한은 따로 유지한다. 이를 SKILL과 full-workflow에 일관되게 반영한다.
  - References: execute:41-59; plan full-workflow:145-148; 회고 Android 부모 `e5204c43`→`266120e9`→`91bddc83`; Slack `e503e04e`→`ca19bdb6`.
  - Acceptance/QA-by-read: `read`로 변경된 selection/acceptance 절을 읽고 ① 유일한 기존 계획+bare execute, ② 복수 계획, ③ 실제 새 목표, ④ 목록은 보이나 터미널이 빈 화면, ⑤ fixture만 통과한 CLI 사례를 표로 판정한다. PASS iff ① 임의 새 계획 금지, ② 한 질문, ③ 새 범위 명시, ④⑤ 완료 불가. 이는 문서 판정이지 live model 준수 증거가 아니다.
  - Evidence: `task-1-contract-review.md`.
  - Recommended task executor category: writing | native role: default task, agent omitted | reason: 기존 workflow 규칙의 일관성 수정.
  - Commit: N. 사용자 별도 권한이 있으면 검증된 원자 변경만 저장소 관례로 커밋.

- [ ] 2. 강제 fan-out 제거와 write/staging 소유권 명확화
  - Closes: IS-2, IS-6.
  - Files: `skills/ulw-execute/SKILL.md`, `skills/ulw-plan/references/full-workflow.md`, `skills/ulw-plan/scripts/plan-templates.mjs`, `skills/ulw-loop/references/omp-contract.md`.
  - Change: '3개 미만이면 under-split', 목표5-8개 등 개수 자체를 성공 기준으로 삼는 producer/consumer 규칙을 제거한다. 한 cohesive 변경은 worker 하나로 끝낼 수 있다. 파일/상태/검증이 독립일 때만 병렬화한다. execute의 제품 구현은 worker 소유를 유지하되 부모의 독립 real-surface 확인은 허용하여 ULW 본문과 QA 책임 충돌을 없앤다.
  - Change: dispatch에 allowed write paths와 단일 stage/commit 소유자를 명시한다. 같은 worktree에서 여러 작업자 WIP가 있는 동안 `git add -A`/무범위 stage를 금지하고 소유 경로만 stage한다. 겹치는 write scope는 직렬, 허용된 별도 worktree는 격리한다. 무권한 worktree/commit을 새로 만들지 않는다.
  - References: execute:14-16,82-98,104-106; template:139-158; full-workflow:173; omp-contract:11-15; Android TerminalBlankDebug yield `c894e367`의 commit `12c1a1a` 사고.
  - Acceptance/QA-by-read: `read`로 네 파일의 dispatch/template 조항을 대조한다. 한 파일+테스트 변경은 한 worker로 허용, 같은 파일 작업 둘은 직렬, 독립 파일 둘은 병렬 가능, 다른 worker WIP가 있으면 broad staging 불허. 기존 plan row/metadata/sentinel 구조는 보존한다.
  - Evidence: `task-2-ownership-review.md`.
  - Recommended task executor category: unspecified-high | native role: default task, agent omitted | reason: 생성 template과 소비 workflow 간 계약 정리.
  - Commit: N.

- [ ] 3. 대기 대상·관찰·한국어 진행 보고 계약 정리
  - Closes: IS-3.
  - Files: `skills/ulw-execute/SKILL.md`, `skills/ulw-loop/references/omp-contract.md`.
  - Change: live pending set을 실제 handle과 terminal 결과로 관리한다. wait는 자신의 pending 결과가 다음 행동을 막을 때만 사용한다. 메시지/첫 결과는 전체 wave 종료가 아니며, pending set이 비면 wait하지 않는다. 전부 agent auto-delivery 소유인데 wait transport가 지원하지 않는 경우 그 통지를 기다리고 빈 wait를 반복하지 않는다. imaginary filtered-wait/list-jobs API를 만들지 않는다.
  - Change: 기간 자체가 기준인 관찰과 지금 실행 가능한 same-entrypoint 검증을 분리한다. runnable cron 동일 명령은 기존 실행 권한, 중복 실행 여부, 외부 write/비용 경계를 확인한 뒤 실행하고, 관찰 기간을 임의 단축하지 않는다.
  - Change: 한국어 handoff 첫 문장에 완료된 결과, 현재 구현/CI/관찰/승인 대기, 근거가 있는 종료 조건/시각, 다음 행동을 표시한다. 이벤트/phase 기반 보고를 사용하고 타이머 daemon이나 ETA를 꾸미지 않는다. 설정 단계는 ask 패널 안에 필요한 맥락과 함께 넣는다. Boulder status enum은 변경하지 않고 설명은 기존 ledger/보고에 둔다.
  - References: execute:109-116; omp-contract:17-27; wiki `421d7739`,`538ac5d1`,`96f48898`; 부모 wait247/오류22.
  - Acceptance/QA-by-read: 완료된 마지막 child만 남았던 set은 비워지고 wait 불가, 일부 child만 끝나면 형제 유지, duration observation은 대기 유지, runnable audit는 권한 범위에서 실행 가능, 승인 없는 Slack send는 보류. PASS iff 각 경우가 새 contract에서 구별되고 Korean handoff가 필요한 정보만 제공한다.
  - Evidence: `task-3-wait-review.md`.
  - Recommended task executor category: writing | native role: default task, agent omitted | reason: native transport 한계 안의 실행 규칙 수정.
  - Commit: N.

- [ ] 4. 로컬 전용 /ulw-status와 /ulw-off 추가
  - Closes: IS-5.
  - Files: `ulw.ts`, `ulw.test.ts`. 다른 파일/worker API는 수정하지 않는다.
  - Change: 두 명령은 registerCommand handler에서 종료하고 sendUserMessage/LLM turn을 시작하지 않는다. status는 extension-owned 활성화와 disable flags만 native info notice로 표시한다. child/job 완료, 전체 진행률, 실제 service 상태를 추측하지 않는다.
  - Change: off는 memory arming/rearm을 해제하고 기존 customType에 boolean false를 저장한다. 명시적 off 이후 자동 session_stop continuation을 중지한다. 한 상태를 true=armed, false=explicitly off, undefined=never armed로 구분해 기존 'unarmed지만 active owned workflow가 있는' continuation 동작을 깨지 않는다. restore는 branch의 마지막 boolean을 읽고 초기값은 undefined다. 새 데이터 schema나 migration은 없다.
  - Change: off는 실행 중인 turn/process/child를 취소하지 않고, 다음 agent turn의 ULW policy injection 및 이후 자동 continuation에 적용된다. 현재 in-flight provider request를 철회한다고 주장하지 않는다. 다음 명시적 /ulw 호출은 정상 재활성화한다. 기본 model preset은 그대로다.
  - References: ulw.ts:74-151,154-198; ulw.test.ts Host 및 state/continuation tests; installed extension-ui-controller:1130-1137.
  - Acceptance/unit QA: 기존 Host에서 status 전후 branch/armed/LLM submission 불변, on→off→ordinary에서 policy 없음, off 저장→restore에서도 없음, /ulw 재활성화, explicit off는 active owned continuation 없음, never-armed legacy continuation 보존, 다른 session/child 격리. 매 case는 state/event 기반이며 sleep 없이 검증한다. prose message string이 아닌 실제 state/registered command/continuation 결과를 assert한다.
  - Real surface proof: task6의 command-only RPC scenario로 실제 설치 OMP의 handler와 provider 호출0을 확인한다. task4만으로 unit PASS를 사용자 surface PASS로 승격하지 않는다.
  - Evidence: `task-4-control-tests.json`, task6 host receipt.
  - Recommended task executor category: unspecified-high | native role: default task, agent omitted | reason: 좁은 session-state 변경, edge 회귀 중요.
  - Commit: N.

- [ ] 5. 공통 ULW 정책 축약과 workflow 지연 로딩
  - Closes: IS-1, IS-2, IS-3, IS-4, IS-6.
  - Files: `skills/ultrawork/SKILL.md`, `skills/ultrawork/references/astra-directive.md`.
  - Change: 두 정책에 task1-3의 계약을 짧은 공통 원칙으로 반영한다. source/marker/frontmatter/기존 모델 선택 계약은 보존한다. bare ULW는 간단한 실행·검증·handoff만 요구하고, explicit plan/execute/loop 세부 절차는 해당 workflow에 둔다. bootstrap/handoff 같은 의전은 동일 목표의 후속 턴에서 반복하지 않는다.
  - Change: 권한, 사용자 변경 보호, actual surface proof, 실패를 숨기지 않기, async lifecycle와 cleanup, 위험 기반 review, compaction 이후 durable 상태 복원은 유지한다. 전 notepad 무조건 재독 대신 현재 목표/Now/미완료/필요한 evidence를 읽고, 모순/손실 시 전량 복원한다. clear owner decision이 없는 계획 요청에는 중복 승인을 요구하지 않는다.
  - References: ulw.ts:26-35,114-151; index.ts:80-94; 기존 policy source equality 및 fallback/child isolation tests. 현재 baseline32336chars, Astra30992chars(문자 수; byte 기준선은 실행자가 전량 읽어 별도 측정).
  - Acceptance/QA-by-read: 보존해야 할 원칙을 source→compact 위치 표로 검토한다. 실제 host payload에서 exactly-one policy marker, expected model variant, quoted keyword/child 분리 유지. 각 variant의 UTF-8 byte 수가 변경 전 기준의50% 이하인지 측정하고 결과를 기록한다. byte-budget은 measurement이며 prose를 pin하는 새 테스트로 만들지 않는다.
  - Evidence: `task-5-policy-map.md`, `task-5-payload-size.json`.
  - Recommended task executor category: writing | native role: default task, agent omitted | reason: 기존 지침을 보존하면서 반복 절차 제거.
  - Commit: N.

- [ ] 6. 실제 OMP command-only proof와 사용자 문서 마감
  - Closes: IS-5, IS-6; 전체 회귀 확인.
  - Files: `tests/ulw-host-check.ts`, `README.md`, `tests/fixtures/skills/ego-browser/SKILL.md` (catalogue-only fixture). 기존 README 사용자 diff를 먼저 읽고 관련 항목만 추가한다. 기준선 호스트 검사에서 사용자 전역 ego-browser 설치를 가정해 실패한 경로를 explicit fixture로 격리하되 unrelated-skill 광고 보존 검사는 유지한다.
  - Change: host runner는 모든 prompt에 agent_end를 기다리지 않는다. 해당 id의 성공 response(success=true, data.agentInvoked=false) 또는 성공 prompt_result(agentInvoked=false, status=completed)만 명령 완료로 처리한다. 같은 id의 error/failure는 실패이며 provider delta0만으로 통과시키지 않는다. 모델 turn은 기존 agent_end/provider request 계약을 유지한다. exact event subscription을 전송 전에 등록하고 현재 bounded timeout을 유지한다.
  - Exact scenarios inside `bun tests/ulw-host-check.ts`: native RPC `{type:"prompt",id:"status-1",message:"/ulw-status"}` 후 해당 local-command 완료와 info notice, provider request delta0; `/ulw probe` 후 정책 존재; `{type:"prompt",id:"off-1",message:"/ulw-off"}` 후 local 완료/notice/request delta0; ordinary `continue` 요청의 정책 없음; 다시 `/ulw probe`의 정책 존재. status/off 때 agent_end 부재를 성공으로 기다리지 않으며 command 결과 id를 대조한다. 상태 복원과 off continuation edge는 task4 unit 증거와 연결한다.
  - Change: 기존 실제 model-routing/flags/quotes/compaction/loop/execute guards smoke를 보존하고 small payload 측정도 수행한다. fixed responder는 policy obedience나 제품 QA를 증명하지 않는다.
  - Change: README에 상태/해제의 좁은 의미, 기존 base preset 유지, workflow 선택, restart 필요 여부와 이미 열린 작업에 적용되지 않는 범위를 설명한다. 현재 OMP나 진행 중인 worker를 재시작하지 않는다.
  - Exact verification: repository cwd에서 `bun test` 및 `bun tests/ulw-host-check.ts`를 async bash로 각각 실행한다. PASS iff existing+new behavioral assertions green, real command provider delta0, subsequent payload on/off correct, source/variant count 맞음, no failures/skips/suppression.
  - Cleanup: 기존 runner finally에서 OMP child exited, local provider stopped, owned temp roots removed를 확인한다. 로그/measurement evidence에는 private tokens나 user memory를 넣지 않는다.
  - Evidence: `task-6-tests.log`, `task-6-host.json`, `task-6-cleanup.json`.
  - Recommended task executor category: unspecified-high | native role: default task, agent omitted | reason: 진짜 host와 local-only command 완료 계약 검증.
  - Commit: N.

## Final verification wave

최종 검증은 한 소유자가 suite/host를 실행하고 다른 검토자는 해당 evidence와 frozen bytes를 읽는다. 같은 전체 검사를 네 번 돌리지 않는다. 결과는 요청된 구현 범위와 미검증 모델 행동을 구분한다.

- [ ] F1. 계약·권한·기존 사용자 변경 보존 확인
  - Read-only reviewer: task1-3 scenario matrix, plan 선택/최초 요청 권한, README 사전 diff 보존, staged diff 없음 확인. Evidence `F1-contract.md`.
- [ ] F2. 세션·provider·continuation 독립 코드 검토
  - Read-only reviewer: false-trigger/child isolation/off restore/legacy continuation/flags와 control 명령 비LLM 동작을 source+task4/6 evidence로 확인. Evidence `F2-runtime.md`.
- [ ] F3. 실제 host 표면과 resource cleanup 증거 확인
  - 단일 QA 소유자의 `bun test`/host 결과, 실제 RPC id와 request count, payload byte 측정, teardown receipt를 독립 확인한다. Evidence `F3-surface.md`.
- [ ] F4. 이상 상태·정책 축약 보존과 한계 확인
  - IS1-6을 변경/증거에 매핑한다. prose 효과·비용 감소·실제 cron/Slack 동작을 미실행 상태에서 PASS라고 하지 않는다. runtime 완료와 이후 실제 세션 관찰을 구분한다. Evidence `F4-ideal-state.md`.

## Commit strategy

현재 승인 범위는 계획 작성뿐이며 stage/commit/push는 하지 않는다. 구현 요청만 받은 경우에도 기본 결과는 검증된 unstaged diff다. 사용자가 커밋까지 명시적으로 승인한 경우에만, 기존 이력을 읽어 관례를 따르고 원자 변경과 그 검증을 한 increment로 커밋한다. 다른 작업자의 파일은 stage하지 않는다.

## Success criteria

| IS | Delivering tasks | Proving scenario/evidence |
|---|---|---|
| 1 | 1,5 | 핵심 consumer/불량 terminal/fixture-only 사례는 완료 불가; task1 map, F1/F4 QA-by-read |
| 2 | 2 | cohesive one-worker 허용, overlapping writes 직렬, WIP broad staging 불허; template/consumer 일치 review |
| 3 | 3 | terminal pending 제거/형제 유지/관찰과 runnable 구별, Korean handoff; scenario matrix |
| 4 | 1 | selectable plan이 있을 때 bootstrap 덮어쓰기 금지, ambiguity 한 질문, selected plan/digest 명시 |
| 5 | 4,6 | real OMP status/off command local completion + provider delta0; off payload 없음/rearm 있음; restore/legacy edges unit |
| 6 | 2,5,6 | 강제 fan-out 제거, preserved core map, real policy bytes<=old50%, 기존 host/full tests green |

## Risks and boundaries

- 스킬 개선은 prompt-level guidance다. 자동 Git 차단, 외부 job 제어, worker 완료 검증 서비스를 구현한 것으로 표현하지 않는다.
- compact prose가 실제 장기 작업에서 얼마나 잘 준수되는지는 후속 실제 사용의 회고로 측정한다. 이 계획이 fixed-provider 테스트로 그것까지 증명한다고 주장하지 않는다.
- `/ulw-off`는 기존 실행 중 turn/jobs의 stop/kill API가 아니다. 다음 turn/automatic continuation 기준이며 model preset unload도 아니다.
- 새로운 README.md 수정은 기존 사용자 변경과 공존해야 한다. 직접 충돌 시 해당 문서 부분만 owner decision으로 남기고 다른 작업을 완료한다.
- Commit/push/deploy/worktree는 이번 계획 작성으로 승인되지 않았다. 기본 deliverable은 verified unstaged diff다.

## Planning evidence

- 전체 회고: `local://ulw-retrospective.md`, census/analysis와 메시지 ids는 planning draft에 링크돼 있다.
- Source-grounded feasibility scout: `agent://UlwPlanFeasibility` (terminal).
- Planning review receipt: `doc/drafts/ulw-session-reliability-review.md`에 해당 plan SHA와 verdict를 별도 보관한다. 구현자가 이 문서 끝에 승인 문구를 임의 추가하지 않는다.
