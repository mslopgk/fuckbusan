---
name: feedback-no-handmade-svg
description: SVG 아이콘 직접 손으로 만들지 말 것 — 무조건 Figma에서 export해서 사용
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

아이콘/일러스트 SVG를 직접 path로 그려 넣지 말 것. 반드시 Figma 노드에서 `download_assets`(format svg) 또는 `export_node_as_image`로 추출해 쓴다.

**Why:** 손으로 그린 SVG는 허접해 보이고 디자인과 안 맞는다 (약관동의 화면의 관리자/전문가/시민 아이콘을 손으로 그렸다가 지적받음).

**How to apply:** 아이콘이 필요하면 해당 Figma 노드를 찾아(없으면 사용자에게 그 프레임 선택 요청) SVG/PNG로 export → public/ 에 저장 후 `<img>`로 사용. [[figma_workflow]] 참고.
