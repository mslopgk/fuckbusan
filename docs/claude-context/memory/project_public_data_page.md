---
name: project_public_data_page
description: "PC 공공데이터 대시보드 — 프론트 완성, 데이터는 mock(추후 RAG 백엔드 교체)"
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

PC 공공데이터 페이지 = `src/components/PCPublicData.jsx` (+ `.css`). view `pcPublicData`, PCHeader 공공데이터 nav가 여기로 연결(기존 comingSoon 비활성 → 활성), UserPCLayout 래핑(noHeaderViews 등록). Figma 215:4425(USER:공공데이터) 디자인 의도 기반 변형, teal #23BDBB 테마.

구성: 지도 기반(`PCMapCanvas`, selectedDistrict="부산진구") 위 플로팅 패널 — 좌(구역별 dropdown + 생활정보 카테고리 9 + 공공데이터 리스트 소스 토글), 중앙(핀 클릭 시 개별 데이터셋 상세카드), 우(인구와 테마 집계: recharts 인구피라미드+추이 / 통계 리스트 테이블), 우하단(부산 16개 구·군 비교: 탭 3 + CSS 트리맵 flex-grow 가중 + 순위 슬라이더).

**실데이터 백엔드 연동 완료 (2026-06-15)**: `GET /api/public-data/overview`(`backend/routers/public_data_router.py`)가 인구추이/통계리스트(테마8)/공공데이터건수/16개 구·군(인구·교통사고·도서관)을 반환. 시드=`backend/public_data/seed_data.py`(실데이터: 행안부 인구 부산진구 365,104, TAAS 교통사고 1,373건, CCTV 1,130대, PM10 31 등 출처표기), 테이블 `public_districts/public_pop_trend/public_theme_stats/public_layers`(main.py startup seed_public_data, idempotent). 프론트는 fetch해서 패널에 주입. **인구 피라미드/지도 핀/상세카드만 예시**(구 단위 연령·좌표 미수집 — '예시' 태그). `publicData.mock.js`는 카테고리/핀/피라미드 등 정적분만 잔존.

생활정보 카테고리 = 제보·제안·진단 공용 `/figma-assets/living-icons/*.svg` 재사용. 지도 툴바 = 공용 `PCMapToolbar`(+PCMap3.css) 재사용. 지도 구·군 폴리곤 클릭 → `onRegionClick`(PCMapCanvas에 추가)으로 해당 구 포커스+비교대상 변경. 공공데이터 리스트 아이콘은 Figma가 라벨박힌 raster라 미적용(컬러닷, 추후 개별 SVG export 시 끼움). 관련 [[feedback_no_handmade_svg]] [[pc_global_header]].
