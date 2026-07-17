---
name: project_aic_mobile_dashboard
description: "AI 가상시민 모바일 대시보드(269:26854)는 상단 섹션만 구현, 나머지 60여 지표는 백엔드 대기"
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

Figma 269:26854 (WDC file `TCuOzEqNhoLKjhF0reBDks`)는 지표 60여 개짜리 대형 구·군 통계 대시보드다. 백엔드 데이터가 전혀 없어서 사용자 결정으로 **상단 산업·일자리 섹션만** 구현했다 (MAICitizen.jsx).

구현된 것: 뒤로가기 + 부산 지도 + 지역타이틀(부산전체)+teal셰브런+크로스헤어(초기화) + 생활정보 카테고리 칩 9종(페르소나 categories 필터) + 지역지표 카드 3종(청년층 순 이동율/고용율/실업율, 아이콘 `public/assets/aicitizen/stat_*.png`) + 기존 페르소나 목록/정렬 유지.

지표 값은 데이터가 없어 **'데이터 준비중' placeholder**로 표기(가짜 % 금지 — 정부 플랫폼). 공공데이터 백엔드가 이 지표들을 제공하면 나머지 카테고리(안전/환경/교통/문화여가/보건복지/교육) 카드로 확장. 이 지표군은 [[project_public_data_page]] 도메인과 겹침.

관련: [[project_persona_chat]] [[project_rag_ai_citizen]]
