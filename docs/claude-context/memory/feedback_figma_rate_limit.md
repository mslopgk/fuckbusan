---
name: feedback-figma-rate-limit
description: Figma MCP 한도 초과 시 작업 중단하고 사용자에게 알릴 것
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 738e903d-6db1-4d7b-ab90-38fc0aac1f0b
---

Figma URL이 주어졌는데 MCP 한도 초과 등으로 스크린샷/디자인 컨텍스트를 가져올 수 없으면, **작업을 중단하고 사용자에게 "Figma를 볼 수 없다"고 명확히 알려야 한다.** 임의로 추측해서 작업하면 안 된다.

**Why:** 사용자가 Figma 스펙을 기준으로 작업을 요청했는데, Figma를 못 보면서 추측으로 구현하면 잘못된 결과물이 나온다.

**How to apply:** Figma MCP 도구가 rate limit 에러를 반환하면 즉시 멈추고 "Figma MCP 한도 초과로 디자인을 확인할 수 없습니다. 작업을 중단합니다."라고 보고할 것.
