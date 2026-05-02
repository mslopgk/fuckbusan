# 검증 서브에이전트 호출 계약

메인 에이전트(피그마 보면서 코드 짜는 친구)가 이 서브에이전트(나)에게 검증을 요청할 때 사용하는 인터페이스.

## 전제

- 프론트 dev 서버가 `http://localhost:8501`에서 실행 중이어야 함 (`npm run dev`)
- 백엔드 API가 `http://localhost:8000`에서 실행 중이어야 함 (`cd backend && uvicorn main:app --reload`)
- DB(MariaDB)는 docker-compose로 띄워져 있어야 함 (`docker compose up -d`)

서브에이전트는 서버를 직접 부팅하지 않습니다 — 메인 에이전트가 책임집니다. 서버가 안 떠 있으면 리포트에 네트워크 에러로 명확히 드러납니다.

## 호출 방법 (메인 에이전트가 사용)

### 방법 1: CLI 인자

```bash
node verify/cli.mjs --views=home,login,reportList --api=dashboard-summary
```

### 방법 2: task JSON 파일

```bash
node verify/cli.mjs --task=verify/inbox/task-001.json
```

`task-001.json`:
```json
{
  "views": ["home", "myPage"],
  "apiChecks": ["dashboard-summary"],
  "token": "<JWT for auth-gated views>",
  "adminToken": "<admin JWT>"
}
```

### 옵션

- `--views=<id1,id2>` — `routes.json`의 view id 목록만 검증
- `--api=<id1,id2>` — `routes.json`의 apiChecks id 목록만 검증
- `--only=frontend` 또는 `--only=api` — 한쪽만 실행
- `--headed` — 브라우저 UI 표시 (디버깅용)
- `--token=<jwt>` — 일반 사용자 토큰 (auth: true 인 view용)
- `--admin-token=<jwt>` — 어드민 토큰 (auth: "admin" 인 view용)

## 응답 (서브에이전트 → 메인)

종료 코드:
- `0` — 모두 통과
- `1` — 하나 이상 실패
- `2` — 실행 자체가 깨짐 (예: Playwright 부팅 실패)

stdout: 요약 JSON
```json
{
  "reportPath": "verify/reports/2026-...json",
  "summary": { "fePass": 8, "feFail": 1, "apiPass": 4, "apiFail": 0, "ok": false }
}
```

상세 리포트: `verify/reports/<timestamp>.json` 및 `verify/reports/latest.json`

리포트 구조:
```json
{
  "startedAt": "...",
  "finishedAt": "...",
  "frontend": [
    {
      "id": "home",
      "view": "home",
      "url": "http://localhost:8501/",
      "ok": true,
      "screenshot": "verify/screenshots/home.png",
      "consoleErrors": [],
      "pageErrors": [],
      "networkFailures": [],
      "assertions": []
    }
  ],
  "api": [
    { "id": "dashboard-summary", "method": "GET", "url": "...", "status": 200, "ok": true, "durationMs": 42 }
  ],
  "summary": { "fePass": 1, "feFail": 0, "apiPass": 1, "apiFail": 0, "ok": true }
}
```

## 피드백 루프 패턴 (메인 에이전트가 따를 흐름)

1. 코드 변경
2. `node verify/cli.mjs --views=<영향받은 view>` 실행
3. 종료 코드 0 이면 다음 작업, 비-0 이면 `verify/reports/latest.json` 읽고 수정
4. 반복

`pageErrors`, `consoleErrors`, `networkFailures`가 가장 디버깅에 유용. 시각 확인은 `screenshot` 경로로.

## 새 view / API 추가

`verify/routes.json`의 `views` 또는 `apiChecks`에 항목 추가. 어설션 타입:

- `{ "type": "textContains", "value": "..." }`
- `{ "type": "selectorVisible", "value": "css selector" }`
- `{ "type": "selectorCount", "value": <number>, "selector": "..." }`

## 한계

- 라우팅이 sessionStorage 기반이라 모든 view는 `current_view` 시드 후 reload로 진입. 깊은 상태(예: 진단 중간 단계)는 추가 시드 로직 필요.
- 시각 회귀(픽셀 비교)는 미구현 — 현재는 스크린샷 캡처만. 필요하면 `pixelmatch`나 Figma MCP 연동 추가.
- auth-gated view는 토큰 필요. `node verify/scripts/get-token.mjs`(아직 미구현) 같은 헬퍼로 발급해 전달.
