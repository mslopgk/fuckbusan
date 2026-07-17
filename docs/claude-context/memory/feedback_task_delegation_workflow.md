---
name: feedback_task_delegation_workflow
description: "사용자가 Figma 수정건을 연속 투척하는 작업 방식 — 소규모=메인, 대규모/큐적체=서브에이전트, 확인필요=grill-me"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

사용자는 Figma 노드 URL + 한 줄 지시로 수정 요청을 **연속으로 투척**한다. 이때 원칙:

- **하나도 빼먹지 말 것** — 턴 중간에 들어온 요청도 전부 TaskCreate로 등록하고 완수.
- **사소한 수정 = 메인이 직접** 처리.
- **큐가 너무 쌓이거나 대작업 = 서브에이전트로 분리**. (예: 페이지 전체 리디자인)
- **작업자 확인 필요 시 언제든 `/grill-me` 호출**.

**Why:** 요청이 병렬로 쏟아져 누락·충돌 위험이 큼. 규모별 라우팅으로 처리량 확보.
**How to apply:** 요청 도착 즉시 Task 등록 → 규모 판단 → 소=메인 / 대=서브에이전트(파일 겹치면 worktree) → 완료 후 Figma 대조 검증. 서브에이전트끼리 같은 컴포넌트 편집 충돌 주의.

관련: [[figma_workflow]] [[collaboration_split]] [[feedback_verify_not_just_build]]
