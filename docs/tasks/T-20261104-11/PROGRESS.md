---
task: T-20261104-11
status: working
updated: 2026-11-04T11:31:55+09:00
current: S6
next: ompbot Outcome 판정 대기(오너 리뷰 후 personal/ulw ff 이동·push)
blocked_reason:
question:
recommend:
impact:
---
# 단계
- [x] S1: spec.md를 읽고 단계 목록을 채운다 | 완료 조건: 이 목록이 실제 작업 단계로 바뀌어 있다 | 증거: 이 목록
- [x] S2: `git merge origin/main`(0d6e010) 후 원본 2커밋·개인 14커밋 의도 파악 | 완료 조건: 충돌 16파일 목록 확인, 커밋별 의도 메모 | 증거: `git merge --no-commit origin/main` → 16파일 CONFLICT(스펙 목록과 동일), 아래 처리표
- [x] S3: 16파일 충돌 해결(원본 구조 기준, 개인 의도 재적용) | 완료 조건: 충돌 마커 0줄 | 증거: `grep -rnE '^(<<<<<<<|>>>>>>>|\|\|\|\|\|\|\|)' --include=*.ts --include=*.md --include=*.mjs --include=*.js .` → 0
- [x] S4: 검증 | 완료 조건: `bun test` 실패 0, `bun tests/ulw-host-check.ts` exit 0 | 증거: test `bun test` → `79 pass / 0 fail / Ran 79 tests across 9 files.`; test `bun tests/ulw-host-check.ts` → `exit=0`, `"status":"PASS","requests":85`, `"cleanup":{"ownedChildren":70,"childrenExited":70,"providerStopped":true,"tempRootsCreated":6,"tempRootsRemoved":6}`. 참고: `--no-prewalk` 추가 전에는 600ad5c·origin/main·병합본 모두 `error: OMP settled with requests=2/1`(카탈로그 시나리오, 호스트 `prewalk.auto: on`)로 실패
- [x] S5: merge 커밋 | 완료 조건: merge 커밋이 0d6e010·600ad5c를 조상으로 포함 | 증거: commit 3424d58; test `git merge-base --is-ancestor 0d6e010 HEAD` → 0, `git merge-base --is-ancestor 600ad5c HEAD` → 0
- [x] S6: outcome.md·spec.md AC 체크, 라이브 체크아웃 personal/ulw 불변 확인 | 완료 조건: AC-1~6 증거 기재, `git -C /home/ubuntu/work/omp-ulw rev-parse personal/ulw origin/personal/ulw` 둘 다 600ad5c | 증거: test `git -C /home/ubuntu/work/omp-ulw rev-parse personal/ulw origin/personal/ulw` → `600ad5c6015902e67f70bc37c47b6681a69aa24c` ×2; file docs/tasks/T-20261104-11/outcome.md

# 증거: 개인 커밋 처리표
원칙: 원본(73e5515 "OMP owns execution" 슬림화·0d6e010 프리셋 갱신) 구조를 기준으로, 원본이 다른 방식으로 해결하지 않은 개인 의도만 다시 얹었다.

| 커밋 | 의도 | 처리 | 근거 |
|---|---|---|---|
| `8095099` | 압축 지시문에서 빠진 완료 계약 복구 | 원본 대체 | 73e5515가 ultrawork 지시문을 "OMP owns execution … verification and reporting"으로 바꾸고 host-check의 `# Completion contract` 단언도 지웠다(`skills/ultrawork/SKILL.md` 원본 그대로, `tests/ulw-host-check.ts`의 armed 루프). 완료 계약은 OMP 기본 프롬프트가 소유 |
| `f233397` | 검증 하위 등급화(기계적=sonic, 판단=reviewer) | 원본 대체 | 원본 ulw-plan SKILL "Use fresh read-only plan assessment under current OMP, not a code-review role selected for its name", ulw-execute "Current native OMP instructions govern how work is performed" — 역할 선택을 OMP에 넘김. 오너 RULES §4에도 같은 등급화가 있음 |
| `1967dce` | host-check를 `--config` overlay로 memory backend에서 격리 | 유지 | `tests/ulw-host-check.ts` hostOverlay·`--config` 유지. 같은 의도로 `--no-prewalk` 추가(호스트 `prewalk.auto: on`이 600ad5c·origin/main 모두에서 `requests=2/1` 실패를 냄) |
| `b7157d7` | upstream 프리셋을 senpi v2026.10.15로 갱신 | 원본 대체 | 0d6e010이 `upstream/presets.js`를 senpi `9815495…`(더 새 리비전)로 재생성, 병합 결과는 원본 파일 그대로 |
| `f5114b1` | 하위 컨텍스트 예산 200k 정렬 | 유지(코드·README) / 원본 대체(지시문·omp-contract) | `ulw.ts` workerDirective "200k tokens"·README 하위 에이전트 절 유지. 지시문·omp-contract 해당 문단은 73e5515가 통째로 삭제 |
| `4551798` | 죽은 bun-1-4 스킬 포인터 제거 | 원본 대체 | 73e5515 지시문에 해당 문장 자체가 없음(`grep bun-1-4 skills/ultrawork/SKILL.md` 0건) |
| `fc404ca` | continuation 상한·워커 계약 주입·브랜치 정책 | 유지(코드) / 원본 대체(문서 정책) | `ulw.ts` MAX_CONTINUATIONS·2시간 예산·workerDirective 주입·/ulw-status 표시, `presets.ts` wait 문구·`parallel` 치환·프론트 측정 치환, README 자동 이어가기 절 유지. 브랜치·커밋 정책 문장은 원본이 "Worktree creation and delivery follow current OMP authorization and repository rules"(ulw-execute)·템플릿 "Record the user's delivery authorization"으로 대체 |
| `036ec1d` | ULW 신뢰성 최종 리뷰 기록 | 유지 | `doc/plans/ulw-session-reliability.md`·`final-review.json` 충돌 없이 그대로 |
| `3363083` | 실제 OMP 호스트에서 /ulw-status·/ulw-off 증명 | 유지 | `tests/ulw-host-check.ts` 로컬 명령 추적(pending·trace·cleanup 단언)을 원본의 messageTypes·streamingBehavior와 합침. `run()` 인자 순서는 원본 호출 위치에 맞춰 trace를 맨 뒤로 옮김. Astra 정책 바이트 측정만 폐기(Astra 지시문 삭제) |
| `425a6b6` | 주입 ULW 정책 절반 축약 | 원본 대체 | 73e5515 지시문이 더 짧음(`<ultrawork-mode>` 블록 2,266바이트). 재무장 알림 문구도 원본("Resume the existing OMP goal…")을 택함 — 개인 문구의 notepad는 원본 지시문에 더 이상 없음 |
| `b66b38f` | 로컬 /ulw-status·/ulw-off | 유지 | `ulw.ts` 두 명령·armed 3상태, `ulw.test.ts` 자동 병합 그대로 |
| `c2bd33c` | wait·한국어 handoff 명시 | 원본 대체 | 73e5515가 ulw-execute 대기 절과 omp-contract 대기·보고 문단을 지우고 "Generic testing, real-surface QA … follow OMP"로 넘김. 대기 규칙은 `presets.ts` wait 문구(fc404ca)가 계속 주입 |
| `d8b03e3` | 작업 응집·staging 소유권 | 일부 유지 / 원본 대체 | 템플릿 `What to do / Must NOT do (name the allowed write paths)` 유지(자동 병합). 위임·staging 문단은 원본이 OMP에 넘김("execution follows current native OMP instructions"); 워커 staging 금지는 `ulw.ts` workerDirective가 계속 주입 |
| `c6fc021` | 완료를 소비자 동작·선택된 계획에 묶음 | 일부 유지 / 원본 대체 | 원본이 다루지 않은 두 의도를 원본 문서 위에 다시 얹음: ① 명시적 계획 요청이면 일반 승인 질문 없이 계획 작성(`skills/ulw-plan/SKILL.md` 30행, `references/full-workflow.md` 18행, `references/intent-unclear.md` 26행, 템플릿 승인 게이트 주석 유지) ② 계획 선택 시 최신 목표와 충돌하면 한 번 질문·새 계획 요청은 새 계획·리뷰 영수증 또는 "no review receipt" 기록(`skills/ulw-execute/SKILL.md` 22행). 소비자 동작 수락 기준은 OMP 기본 프롬프트의 검증 규칙이 소유(원본 대체) |

삭제된 개인 테스트 케이스: Astra 지시문 선택 단언(host-check 5개 모델 루프의 astra 비교·`policyBytes.astra/astraFast`·senpi 미포함 단언) — 원본 73e5515가 `astra-directive.md`와 `selectUlwDirective`를 지우고 "shared directive across model families" 단언으로 대체.
