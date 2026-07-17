---
name: pc-global-header
description: PC 페이지 공용 헤더는 PCHeader 하나뿐 — 페이지 컴포넌트에 자체 헤더 만들지 말 것
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

App.jsx가 모든 PC 뷰에 `PCHeader`(src/components/PCHeader.jsx)를 렌더한다 (`showPCHeader = !noHeaderViews.includes(view)`). PCHeader는 이미 Figma 5-nav(설문/제보·제안/진단/AI가상시민/공공데이터, active 상태, 제보·제안 chooser 모달, 로그인/회원가입/알림)를 완비하고 WDC 로고를 쓴다.

**Why:** 새 PC 페이지/홈 리뉴얼 시 자체 `<header>`를 만들면 PCHeader와 겹쳐 WDC 로고·nav가 2줄로 중복 렌더된다 (HomePC 작업 중 실제로 발생).

**How to apply:** PC 페이지 컴포넌트는 헤더를 만들지 말고 본문만 작성. 헤더가 필요 없는(자체 헤더 보유) PC 뷰는 App.jsx `noHeaderViews`에 추가. 헤더 nav를 바꿔야 하면 PCHeader.jsx만 수정. 관련: [[header_logo_wdc]]
