---
name: 컴포넌트 네이밍 컨벤션
description: M*/PC* prefix는 모바일/PC 전용 컴포넌트. prefix 없는 것은 일반/공유. Figma 노드 → 컴포넌트 매핑 규칙
type: project
originSessionId: 4d61babc-b41a-4f3f-8017-939ee251c222
---
`src/components/`의 컴포넌트 prefix 규칙:

- `M*` (예: `MSurveyList`, `MSurveyDetail1`) — **MOBILE 전용** Figma 디자인을 구현한 페이지
- `PC*` (예: `PCSurveyList`, `PCProposeMap`, `PCHeader`) — **PC 전용** Figma 디자인 구현
- prefix 없는 것 (예: `Diagnosis`, `Login`, `Home`) — 공유/반응형/이전 버전

**Why:** 같은 기능(설문, 제보, 제안 등)에 대해 Mobile/PC가 디자인이 크게 달라 별도 컴포넌트로 구현. App.jsx의 view 분기에 별도 view name(`mSurveyList`, `pcSurveyList` 등)으로 등록됨.

**How to apply:** Figma에 새 화면 추가 시 — Mobile(393폭)이면 `M<Feature><Screen>.jsx`, PC(1920폭)이면 `PC<Feature><Screen>.jsx`. App.jsx에 lazy import + view 케이스 추가. CSS는 같은 이름의 `.css`로 분리.

라우팅 등록 위치: `src/App.jsx` 상단 lazy import + 하단 view 분기 + `onNavigate` 함수의 target case.
