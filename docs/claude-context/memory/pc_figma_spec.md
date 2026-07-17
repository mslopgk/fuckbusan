---
name: pc-figma-spec
description: PC 전수 Figma diff 스펙 문서·파일키 위치 (모바일과 별도 Figma 파일)
metadata: 
  node_type: memory
  type: reference
  originSessionId: f36af0c1-1756-4b9e-a800-dd0c6bf7e092
---

PC 화면 Figma 원본은 모바일(`TCuOzEqNhoLKjhF0reBDks`)과 **다른 파일**: `hJCPXp7YcYUL60u2NHiYrS` ("디자인 자료 공유_인터넷방송국") page `0:1`. 최신=캔버스 아래쪽 프레임 규칙 동일 적용.

PC 전수 diff 체크리스트는 `FIGMA_DIFF_SPEC_PC.md`(모바일은 `FIGMA_DIFF_SPEC.md`). verify에서 pc* 뷰는 routes.json 항목에 `"viewport": {"width":1280,"height":900}`를 넣어야 PC 폭으로 렌더됨(없으면 모바일 폭으로 깨짐). PC 상세(`pcReportDetail` 등)는 selectedReport를 시드해도 API에서 리포트를 새로 fetch하므로 status 의존 UI(개선완료 배너 등)는 실데이터 상태가 필요.

PC home(Figma 389:4023)은 풀 대시보드 신규 페이지 스펙 — 픽셀 diff가 아니라 구현 스코프 결정 사안이라 보류 중. login/signup은 USER용 PC 프레임 부재로 현행 유지. 관련 [[wdc_mobile_spec]].
