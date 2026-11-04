# personal/ulw ← 포크 main(원본 73e5515·0d6e010) 충돌 정리

상태: 계획 (2026-11-04, 오너 승인으로 herdr 워커에 위임)

## 배경

- 설치본(WSL·OCI `~/.omp/agent/extensions/omp-ulw`)은 포크 `gimso2x/omp-ulw`의 `personal/ulw` 브랜치를 쓴다. 포크 `main`은 원본 `dbc-hbin/omp-ulw` `main`을 그대로 따라간다.
- 11-04부터 평일 아침 자동 업데이트(WSL `~/bin/omp-morning-update.sh` → OCI `~/.local/bin/omp-morning-update-oci.sh`)가 `personal/ulw`에 `origin/main`을 merge하고 `bun test`가 통과할 때만 push한다. 충돌이 나면 `merge --abort` 후 #alert로 알린다.
- 11-04 11:13 첫 실행에서 `personal/ulw`(`600ad5c`)에 `origin/main`(`0d6e010`) 2커밋을 merge하자 16파일이 충돌했다. 정리 전까지 매일 같은 알림이 온다.

## 원인

원본의 두 커밋이 개인 커밋이 고친 파일들을 크게 바꿨다.
- `73e5515 feat: slim ULW workflows and connect native OMP modes` — 39파일, +930/−3372. 워크플로 스킬을 줄이고 OMP native 모드에 연결.
- `0d6e010 feat: refresh upstream presets and align OMP prompt adapters` — 5파일, +378/−171.

충돌 파일(16): `README.md`, `index.test.ts`, `presets.ts`, `ulw.ts`, `tests/ulw-host-check.ts`, `skills/mass-ulw/references/planning.md`, `skills/ultrawork/SKILL.md`, `skills/ultrawork/references/astra-directive.md`(원본 삭제·개인 수정), `skills/ulw-execute/SKILL.md`, `skills/ulw-loop/references/full-workflow.md`, `skills/ulw-loop/references/omp-contract.md`, `skills/ulw-plan/SKILL.md`, `skills/ulw-plan/references/full-workflow.md`, `skills/ulw-plan/references/intent-clear.md`, `skills/ulw-plan/references/intent-unclear.md`, `skills/ulw-plan/scripts/plan-templates.mjs`.

## 목표

`personal/ulw`가 원본 최신(`0d6e010`)을 포함하면서, 개인 커밋의 의도 가운데 원본이 대체하지 않은 것은 그대로 살아 있는 merge 커밋을 task 브랜치에 만든다. 랜딩 뒤 아침 자동 merge가 다시 깨끗하게(충돌 0) 돈다.

## 설계

1. task 워크트리에서 `git merge origin/main`(= `0d6e010`, 원본 `upstream/main`과 같음)을 한다.
2. 충돌 해결 원칙: **원본 구조를 기준**으로 삼고, 아래 개인 커밋의 의도를 원본의 새 구조 위에 다시 얹는다. 원본이 같은 목적을 이미 다른 방식으로 해결했으면 원본 쪽을 택하고 개인 변경은 버린다. 원본이 삭제한 파일(`astra-directive.md`)은 삭제를 따르되, 개인 수정 내용이 여전히 필요하면 원본이 내용을 옮긴 새 위치에 넣는다.
3. 보존 대상(개인 커밋, `git log --no-merges origin/main..600ad5c`):

| 커밋 | 의도 |
|---|---|
| `8095099` | ultrawork 압축 지시문에서 빠진 완료 계약 복구 |
| `f233397` | 검증 하위를 과업 모양으로 등급화(기계적=sonic, 판단=reviewer) |
| `1967dce` | ulw host-check를 `--config` overlay로 memory backend에서 격리 |
| `b7157d7` | upstream 프리셋을 senpi v2026.10.15로 갱신(원본 0d6e010이 더 새로우면 원본 우선) |
| `f5114b1` | 하위 컨텍스트 예산 200k로 워커 계약·문서 정렬 |
| `4551798` | ULW 지시문의 죽은 bun-1-4 스킬 포인터 제거 |
| `fc404ca` | ULW continuation 상한, 워커 계약 주입, 브랜치 정책 정렬 |
| `036ec1d` | ULW 신뢰성 최종 리뷰 기록(doc) |
| `3363083` | 실제 OMP 호스트에서 ULW 제어 증명 테스트 |
| `425a6b6` | 주입 ULW 정책 절반 축약 |
| `b66b38f` | 로컬 ULW status·off 제어 |
| `c2bd33c` | ULW wait·한국어 handoff 명시 |
| `d8b03e3` | ULW 작업 응집·staging 소유권 |
| `c6fc021` | 완료를 소비자 동작과 선택된 계획에 묶음 |

4. 각 행의 처리(유지 / 원본이 대체 / 폐기)와 근거(파일·줄 또는 원본 커밋)를 PROGRESS.md 증거에 표로 남긴다. 개인 테스트 케이스를 지우면 그 케이스마다 원본 대체 근거를 적는다.

## 범위와 제외

- 범위: task 워크트리 안의 merge 커밋 하나(필요하면 뒤따르는 수선 커밋)와 PROGRESS.md.
- 제외: 라이브 체크아웃 `/home/ubuntu/work/omp-ulw`·설치본 편집, `personal/ulw`·`main` 브랜치 이동, push, OMP 본체 수정, 아침 업데이트 스크립트 수정, 원본에 없는 새 기능 추가.

## 수락기준

- AC-1: task 브랜치 HEAD가 `0d6e010`과 `600ad5c`를 모두 조상으로 포함한다(`git merge-base --is-ancestor`가 둘 다 0).
- AC-2: `git grep -nE '^(<<<<<<<|>>>>>>>)' HEAD`가 0줄이다.
- AC-3: task 워크트리에서 `bun test` 실패 0.
- AC-4: task 워크트리에서 `bun tests/ulw-host-check.ts` exit 0.
- AC-5: PROGRESS.md 증거에 설계 3의 14개 커밋 각각의 처리(유지/원본 대체/폐기)와 근거가 한 줄씩 있다.
- AC-6: `git -C /home/ubuntu/work/omp-ulw rev-parse personal/ulw origin/personal/ulw`가 둘 다 `600ad5c`로 그대로다(브랜치 이동·push 없음).

## 반영

오너가 리뷰 뒤 `personal/ulw`를 task 브랜치로 ff 이동하고 `origin/personal/ulw`에 push한다. 그러면 설치본은 다음 아침 업데이트에서 `pull --ff-only`로 받는다(OCI 설치본은 라이브 체크아웃이 곧 설치본이라 ff 이동 즉시 반영). plan 워크트리 `/home/ubuntu/work/omp-ulw-upstream-sync`는 TASK를 닫은 뒤 지운다.
