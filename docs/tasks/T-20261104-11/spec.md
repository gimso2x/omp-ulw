---
task: T-20261104-11
title: omp-ulw personal/ulw ← main 충돌 정리
risk: L2
repo: local:/home/ubuntu/work/omp-ulw-upstream-sync
---
# 목표
personal/ulw에 포크 main(원본 73e5515·0d6e010)을 merge하고 16파일 충돌을 정리한다. 설계는 doc/plans/upstream-sync-20261104.md를 따른다
# 범위
- task 워크트리 안 merge 커밋(필요 시 수선 커밋)
- PROGRESS.md 증거
# 제외
- 라이브 체크아웃 /home/ubuntu/work/omp-ulw·설치본 편집
- personal/ulw·main 브랜치 이동, push
- OMP 본체·아침 업데이트 스크립트 수정
- 원본에 없는 새 기능 추가
# 수락기준
- [x] AC-1: AC-1: task 브랜치 HEAD가 `0d6e010`과 `600ad5c`를 모두 조상으로 포함한다(`git merge-base --is-ancestor`가 둘 다 0).
- [x] AC-2: AC-2: `git grep -nE '^(<<<<<<<|>>>>>>>)' HEAD`가 0줄이다.
- [x] AC-3: AC-3: task 워크트리에서 `bun test` 실패 0.
- [x] AC-4: AC-4: task 워크트리에서 `bun tests/ulw-host-check.ts` exit 0.
- [x] AC-5: AC-5: PROGRESS.md 증거에 설계 3의 14개 커밋 각각의 처리(유지/원본 대체/폐기)와 근거가 한 줄씩 있다.
- [x] AC-6: AC-6: `git -C /home/ubuntu/work/omp-ulw rev-parse personal/ulw origin/personal/ulw`가 둘 다 `600ad5c`로 그대로다(브랜치 이동·push 없음).
