# 부산 공공디자인 진단 플랫폼

React 19 + Vite 프론트(8501), FastAPI 백엔드(8000), MariaDB(docker-compose).

## 자가 검증 (피드백 루프)

UI/백엔드를 변경했으면 **반드시** `verify/` 도구로 자가 검증 후 사용자에게 보고한다. 화면 캡처, 콘솔/페이지 에러, 네트워크 4xx/5xx, API 상태 코드를 자동 수집한다.

```bash
# 프론트 + 백엔드 한 번에
npm run verify -- --views=home,login,reportList --api=dashboard-summary

# 프론트만
npm run verify:fe -- --views=home,reportList

# 백엔드만
npm run verify:api -- --api=dashboard-summary,checklist-categories
```

리포트는 `verify/reports/latest.json` (스크린샷 경로 포함). 종료 코드 0 = 통과, 1 = 검증 실패, 2 = 실행 자체 실패.

전제 조건: `npm run dev` (8501) + `cd backend && uvicorn main:app --reload` (8000) + `docker compose up -d` (DB).

새 view나 API 추가 시 `verify/routes.json`에 항목 추가. 자세한 사용법: `verify/CONTRACT.md`.

## 프론트 라우팅 특이점

react-router 대신 `App.jsx`의 `view` state machine으로 동작. URL은 `/`와 `/admin` 두 개뿐. view는 `sessionStorage.current_view`에 저장되므로 Playwright/테스트에서 임의 화면 진입 시 sessionStorage 시드 후 reload 패턴을 쓴다 (verify 도구가 이미 그렇게 처리).

## auth-gated view

`access_token` (localStorage)이 없으면 로그인 페이지로 리다이렉트. 검증 시 토큰을 `--token=<jwt>`로 넘겨야 한다. (토큰 발급 헬퍼는 아직 미구현)
