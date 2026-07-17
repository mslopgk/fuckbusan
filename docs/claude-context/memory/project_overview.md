---
name: 부산 공공디자인 진단 플랫폼 개요
description: React 19 + Vite 프론트(8501) + FastAPI(8000) + MariaDB. 라우팅은 react-router 대신 App.jsx의 view state machine 사용
type: project
originSessionId: 4d61babc-b41a-4f3f-8017-939ee251c222
---
부산 공공디자인 진단 플랫폼이라는 프로젝트.

스택: React 19 + Vite 프론트(:8501) / FastAPI 백엔드(:8000) / MariaDB(docker-compose).

**Why:** CLAUDE.md에 명시된 표준 환경. 검증과 빌드 전제는 이 세 컴포넌트가 모두 떠 있어야 한다는 것을 의미.

**How to apply:** UI/API 변경 시 `npm run verify -- --views=...` 로 자가검증 후 사용자에게 보고. 백엔드/프론트 모두 직접 띄워야 함.

라우팅: react-router 미사용. `src/App.jsx`의 `view` state로 화면 전환. URL은 `/`와 `/admin` 두 종류. `sessionStorage.current_view`에 view 저장. Playwright/테스트에서 임의 화면 진입 시 sessionStorage 시드 후 reload 필요(verify 도구가 처리).

auth-gated view는 `localStorage.access_token` 없으면 로그인으로 리다이렉트. 검증 시 `--token=<jwt>` 필요(헬퍼 미구현).
