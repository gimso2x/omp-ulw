# T-20261104-11 Outcome 증거
## 요약
원본 최신판(슬림해진 ULW 지시문·새 프리셋)을 받으면서 개인 기능(자동 이어가기 상한, 하위 에이전트 계약, /ulw-status·/ulw-off, 계획 요청 시 불필요한 승인 질문 생략)은 그대로 살린 병합본을 task 브랜치에 만들었습니다. 이 브랜치로 옮기면 아침 자동 merge가 다시 충돌 없이 돕니다.
단위 테스트 79개 통과·실패 0, 실제 OMP 호스트 검증 PASS(요청 85건, 자식 70개 모두 종료)입니다. 개인 커밋 14개 중 지시문 문구 수정 위주 커밋은 원본이 "실행 정책은 OMP가 맡는다"로 대체해 버렸습니다.
스펙 밖 예외: 호스트 설정의 prewalk.auto 때문에 기존 두 브랜치에서도 호스트 검증이 실패하던 것을 막으려고 검증 스크립트에 `--no-prewalk`를 더했습니다. 타입 검사(tsc)는 typescript가 설치돼 있지 않아 돌리지 못했습니다.

## AC-1
- commit: 3424d58 Merge origin/main (0d6e010) into personal/ulw line
- test: `git merge-base --is-ancestor 0d6e010 HEAD; echo $?` → `0`
- test: `git merge-base --is-ancestor 600ad5c HEAD; echo $?` → `0`

## AC-2
- commit: 3424d58 Merge origin/main (0d6e010) into personal/ulw line
- test: `git grep -nE '^(<<<<<<<|>>>>>>>)' HEAD | wc -l` → `0`

## AC-3
- commit: 3424d58 Merge origin/main (0d6e010) into personal/ulw line
- test: `bun test` → `79 pass` / `0 fail` / `Ran 79 tests across 9 files.`

## AC-4
- commit: 3424d58 Merge origin/main (0d6e010) into personal/ulw line
- test: `bun tests/ulw-host-check.ts; echo exit=$?` → `exit=0`, `"status":"PASS","requests":85`, `"cleanup":{"ownedChildren":70,"childrenExited":70,"providerStopped":true,"tempRootsCreated":6,"tempRootsRemoved":6}`
- file: tests/ulw-host-check.ts (`--no-prewalk` 추가: 600ad5c·origin/main에서도 `error: OMP settled with requests=2/1`로 실패하던 호스트 설정 간섭 격리)

## AC-5
- file: docs/tasks/T-20261104-11/PROGRESS.md (`# 증거: 개인 커밋 처리표` 14행: 유지 4, 원본 대체 6, 일부 유지 4)

## AC-6
- test: `git -C /home/ubuntu/work/omp-ulw rev-parse personal/ulw origin/personal/ulw` → `600ad5c6015902e67f70bc37c47b6681a69aa24c` ×2
