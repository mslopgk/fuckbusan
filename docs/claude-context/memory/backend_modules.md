---
name: 백엔드 라우터/모델 인벤토리
description: backend/ 도메인 모델·라우터 매핑. 새 화면 작업 시 어느 endpoint가 이미 있는지 먼저 확인할 때 참조.
type: project
originSessionId: aad9db3b-8721-4000-99e8-769c2b858f56
---
`/Users/Kang/Desktop/fuckbusan/backend/` 구조 (2026-05-04 기준).

## 모델 (models.py)
- 인증: `User` (admin은 ID="admin", PW="1234" 하드코딩 단축 로그인)
- 제보: `Report`, `ReportImage`, `ReportLike`, `ReportComment`
- 제안: `NewProposal`, `ProposalLike`, `ProposalView`, `ProposalComment`
- 설문: `Survey`, `SurveyQuestion`, `SurveyResponse`, `SurveyAnswer`
- 진단: `ChecklistResult` (한글 컬럼명 — 진단지역/위도/경도/대분류/중분류/점수/리뷰)
- 통계: `DistrictAnalysis`, `DistrictInsight`, `Persona`
- 알림/감사: `Notification`, `ActivityLog`

## 라우터 (backend/routers/)
- `auth.py`, `user_router.py` — 회원가입/로그인/users/me, /api/users (admin)
- `report_router.py` — `/api/reports/*` (Report + Proposal 통합)
  - 제보: list/full/mine/create/{id}, like, comments, clusters
  - 제안: /proposals (CRUD + vote + view + comments + my-proposals + voted-proposals)
- `survey_router.py` — `/api/surveys/*` (list/detail/responses/results) + `/admin` (CRUD + close/duplicate + 개별 질문)
- `checklist_router.py` — `/checklist/*` (submit/list/my/{id} + clusters/aggregate/summary/recommendations)
- `home_router.py` — `/api/home/stats|citizens|archives`
- `admin_router.py` — `/api/admin/*` (stats/recent-activity/reports + trends/category-distribution/district-leaderboard + users/proposals + activity-logs)
- `notification_router.py` — `/api/notifications/*` (list/unread-count/read/read-all/delete)
- `search_router.py` — `/api/search` + `/suggest`
- `dashboard.py`, `ai.py` — 대시보드/AI 챗봇

## 헬퍼
- `notification_utils.py` — `push_notification()`, `log_activity()` — 라우터에서 이벤트 hook으로 호출
- 라우터 등록 순서 주의: report_router에서 `/{report_id}` 같은 int param 라우트는 `/proposals/...` 같은 정적 경로 *뒤에* 등록 (FastAPI 매칭 순서)

## 시드
- `seed_full_mock.py [--reset]` — 모든 도메인 idempotent 시드. 기준 NOW=2026-05-04.
- citizen1..8 / pw1234 (argon2)
- DISTRICT_CENTERS — 부산 16개 구·군 중심 좌표 + jitter

## verify
- `verify/routes.json` — view 정의 + apiChecks. 새 endpoint 추가 시 apiChecks에 항목 추가 (id/method/path/expectStatus/expectBody).
- `npm run verify[:fe|:api]` 으로 회귀 검증.
