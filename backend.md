# 백엔드 작업 계획서

> **갱신**: 2026-05-04 (3차 라운드 — notification·search·activity 추가)
> **목적**: 프론트의 하드코딩 목업 데이터를 DB로 옮기고, 누락된 API를 채워서 화면이 실제 DB에서 데이터를 받게 함.
> **스택**: FastAPI + SQLAlchemy + MariaDB(docker-compose) / 프론트는 React 19 + Vite

---

## 0. 현재 상태 한눈에

| 영역 | 모델 | API | 프론트 와이어링 | 비고 |
|------|------|-----|---------------|------|
| 인증/유저 | ✅ User | ✅ 가입/로그인/me/관리자 CRUD | ✅ | admin 하드코딩 (admin/1234) |
| 제보 (Report) | ✅ Report/Like/Comment/Image | ⚠️ list/full/mine/create만, **상세·수정·삭제·좋아요·댓글 누락** | ❌ 모두 하드코딩 | 본 라운드 핵심 |
| 제안 (NewProposal) | ✅ 완전 | ✅ 완전 (CRUD + vote + view + comments) | ⚠️ 리스트/지도만 하드코딩 | 거의 완성, 와이어링만 |
| 설문 (Survey) | ❌ 모델 없음 | ❌ 스텁 (in-memory) | ❌ 하드코딩 | **모델·API 신규 구축 필요** |
| 진단 (Checklist) | ✅ ChecklistResult | ✅ list/my/detail/submit/update | ❌ MDiagnosisList 하드코딩 | 와이어링만 |
| 홈/통계 | ✅ DistrictAnalysis/Insight/Persona | ✅ /api/dashboard/* | ❌ Home.jsx 하드코딩 | citizens/archives 시드 |
| 마이페이지 | - | ✅ /reports/mine, /my-proposals, /voted-proposals, /checklist/my | ⚠️ 부분 | |

---

## 1. DB 시드 (mock data)

### 시드 스크립트 — `backend/seed_full_mock.py`
- 멱등 (`--reset` 옵션 시 기존 mock 행 삭제 후 재삽입)
- 비밀번호: argon2 해시 (`citizen1`, `pw1234`)
- 좌표: 부산시 16개 구·군 중심에서 약간 랜덤 흩뿌림
- 기준 날짜: `created_at`을 최근 1~30일 사이 분산

### 시드 데이터 분량
| 테이블 | 행 수 | 비고 |
|-------|------|------|
| users | 8 | 동래구 우리디자이너, 수영구 시민 ... + admin |
| reports | 12 | 카테고리·구 골고루, status 3종 (개선예정/개선중/개선완료) |
| report_comments | 24 | 제보당 평균 2개 |
| report_likes | 30 | random fan-out |
| new_proposals | 10 | 카테고리 8종 + 동·서·북·해운대 |
| proposal_comments | 18 | |
| proposal_likes | 20 | |
| surveys | 5 | 진행중 3 + 완료 2 |
| survey_questions | 25 | 설문당 5문항 (단/복/객/주관식 mix) |
| checklist_result | 15 | 대분류·중분류·점수 다양 |
| district_analysis | 17 (구별) × 2년 | 2025/2026 |
| district_insights | 30 | type/severity 다양 |
| personas | 8 | 구별 |

### 실행 방법
```bash
docker compose up -d
cd backend && python seed_full_mock.py            # 추가 모드
cd backend && python seed_full_mock.py --reset    # 초기화 후 재삽입
```

---

## 2. 모델 추가/변경

### 2.1 신규 — `Survey` 도메인
```python
class Survey(Base):
    __tablename__ = "surveys"
    id, title, description, minutes (응답시간),
    period_start, period_end, status (active/result/closed),
    response_count, author_id, created_at

class SurveyQuestion(Base):
    __tablename__ = "survey_questions"
    id, survey_id (FK), order_no, qtype (single/multi/text/agree),
    text, options (JSON list)

class SurveyResponse(Base):
    __tablename__ = "survey_responses"
    id, survey_id (FK), user_id (FK, nullable for anon),
    submitted_at

class SurveyAnswer(Base):
    __tablename__ = "survey_answers"
    id, response_id (FK), question_id (FK),
    value (Text/JSON)
```

### 2.2 변경 — `Report` 보강
- 이미 충분. `progress_step`, `result_details`, `image_url`, `lat/lng` OK.
- 단, `category` 정규화 (현재 free string) — 시드에서 enum-like 값으로 통일.

---

## 3. API 추가/보강

### 3.1 제보 (Report) 라우터 — **최우선 추가 필요**

| Method | Path | 설명 | 현재 |
|--------|------|------|------|
| GET | `/api/reports/{id}` | 단건 상세 (조회수+, 댓글 포함) | ❌ 추가 |
| PUT | `/api/reports/{id}` | 수정 (작성자/admin) | ❌ 추가 |
| DELETE | `/api/reports/{id}` | 삭제 (작성자/admin) | ❌ 추가 |
| POST | `/api/reports/{id}/like` | 좋아요 토글 | ❌ 추가 |
| GET | `/api/reports/{id}/comments` | 댓글 목록 | ❌ 추가 |
| POST | `/api/reports/{id}/comments` | 댓글 생성 | ❌ 추가 |
| DELETE | `/api/reports/{id}/comments/{cid}` | 댓글 삭제 | ❌ 추가 |
| GET | `/api/reports/clusters` | 지도 클러스터 (lat/lng/count by region) | ❌ 추가 |

> 본 라운드에서 모두 구현 완료.

### 3.2 설문 (Survey) 라우터 — **신설**

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/surveys/list` | 진행중/결과 탭 (status filter) |
| GET | `/api/surveys/{id}` | 설문 상세 + 질문지 |
| POST | `/api/surveys/{id}/responses` | 응답 제출 |
| GET | `/api/surveys/{id}/results` | 집계 결과 |
| POST | `/api/surveys` (admin) | 설문 생성 |

> 본 라운드: list/detail/responses/results 구현 (admin 생성은 후순위).

### 3.3 홈/통계 API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/home/stats` | 홈 KPI (제보·제안·진단 카운트) |
| GET | `/api/home/citizens` | AI 가상시민 카드 (persona 기반) |
| GET | `/api/home/archives` | 우수사례 카드 |

### 3.4 진단 (Checklist) — 보강
- `GET /checklist/clusters` (지도용 lat/lng/count) 추가.

---

## 4. 프론트 와이어링 (목업 → API)

`fetch('/api/...')` 패턴으로 교체. 라이프사이클은 `useEffect` + `useState`.

| 파일 | 현재 (하드코딩) | 교체 후 |
|------|----------------|--------|
| `MReportList.jsx` | `ITEMS` 4개 | `GET /api/reports/full?region&category&status` |
| `MReportMap.jsx` | `ITEMS` 3개 | `GET /api/reports/full` |
| `MProposalList.jsx` | `ITEMS` 3개 | `GET /api/reports/proposals` |
| `MProposalMap.jsx` | `ITEMS` 3개 | `GET /api/reports/proposals` |
| `MProposalDetail.jsx` | `SAMPLE_COMMENTS` | `GET /api/reports/proposals/{id}` + `comments` |
| `MReportDetail.jsx` | `SAMPLE_COMMENTS` + DEFAULT_RESULT | `GET /api/reports/{id}` |
| `MSurveyList.jsx` | `ITEMS`, `RESULTS` | `GET /api/surveys/list?tab=` |
| `MDiagnosisList.jsx` | `DIAG_PINS`, `CARDS` | `GET /checklist/list` + `clusters` |
| `PCReportMap.jsx` | `ITEMS` 8 | `GET /api/reports/full` |
| `PCProposeMap.jsx` | `ITEMS` 8 | `GET /api/reports/proposals` |
| `Home.jsx` | `citizens`, `archives` | `GET /api/home/citizens` + `/archives` |
| `ReportList.jsx` | `MOCK_CLUSTERS` | `GET /api/reports/clusters` |

> **유지**: `CATEGORIES`, `REGIONS`, `CAT_STYLES`, `STAGES` 등은 도메인 상수라 프론트 보관.

---

## 5. 검증 (verify 도구)

```bash
npm run verify -- --views=mReportList,mProposalList,mSurveyList,home --api=dashboard-summary
```
- 추가 라우트 `verify/routes.json`에 등록.
- API 헬스체크: 새로 추가한 엔드포인트 200 응답 확인.

---

## 6. 작업 우선순위

- ✅ **P0 — 1차 완료**:
  - 시드 스크립트 (users / reports / proposals / surveys / checklists / dashboard)
  - Report 라우터 보강 (상세/수정/삭제/좋아요/댓글/clusters)
  - Survey 모델·API 신설 (list/detail/respond/results)
  - 프론트 7개 핵심 화면 와이어링 (MReport*, MProposal*, MSurvey*, MDiagnosisList)

- ✅ **P1 — 2차 완료**:
  - PC 대형 화면 (`PCReportMap`, `PCProposeMap`) 와이어링 — `/api/reports/full` + `/proposals` 호출, 카테고리 필터·정렬 클라이언트 처리
  - Home `citizens` / `archives` / `stats` 차트 카운터 API 연결 — `/api/home/*`
  - 관리자 통계 페이지 — `/api/admin/stats`, `/recent-activity`, `/reports`, `/reports/{id}/status` 추가, `ReportManagement.jsx` 와이어링
  - 진단 결과 차트 데이터 집계 — `/checklist/clusters`, `/checklist/aggregate`
  - 설문 admin CRUD — `/api/surveys/admin` POST/PUT/DELETE

- ✅ **P2 — 3차 완료 (2026-05-04)**:
  - **알림 시스템** — `Notification` 모델 + `/api/notifications` 라우터
    - GET /api/notifications, /unread-count
    - PATCH /api/notifications/{id}/read, POST /read-all, DELETE /{id}
    - 이벤트 hook: report `/like` `/comments`, proposal `/vote` `/comments`, admin status 변경 시 자동 push
  - **활동 로그(Audit)** — `ActivityLog` 모델 + `/api/admin/activity-logs`
    - 좋아요/댓글/투표/관리자 상태변경 등에서 자동 기록
  - **통합 검색** — `/api/search` 라우터
    - GET /api/search?q=&type=all|report|proposal|survey&region=
    - GET /api/search/suggest?q= (제목 prefix 매칭)
  - **통계 트렌드** — `/api/admin/trends`, `/category-distribution`, `/district-leaderboard`
  - **관리자 사용자/제안 관리** — `/api/admin/users`, `/api/admin/users/{id}` PATCH, `/api/admin/proposals`, `/api/admin/proposals/{id}` DELETE
  - **진단 집계/추천** — `/checklist/summary` (avg/min/max/std), `/checklist/recommendations` (저점 카테고리 자동 추천)
  - **설문 admin 보강** — `/api/surveys/admin/{id}/close`, `/duplicate`, 개별 질문 CRUD
  - **댓글 수정** — `PUT /api/reports/{id}/comments/{cid}` (Report)
  - **Pagination 표준화** — `/api/reports/full?page=&size=` envelope 응답 (옵션, 하위호환 유지)
  - **프론트 와이어링** — `ProposalManagement.jsx`, `AdminUserList.jsx` admin endpoint 사용, `MDiagnosisResult.jsx` aggregate+recommendations 호출
  - **시드 보강** — notifications 66개, activity_logs 60개

- 🟨 **P3 — 차후 (보류)**:
  - AI 시민 페르소나 자동 생성 파이프라인 (현재는 시드 페르소나로 충분)
  - 대시보드 주요 KPI 캐싱 (현재 직접 집계)
  - 설문 admin 화면 풀 와이어링 — `SurveyEditor.jsx`의 개별 질문 CRUD UI 연결
  - admin 토큰 만료/리프레시 처리
  - 헤더 알림 종 컴포넌트 (PCHeader/모바일 헤더 통합 변경 필요)
  - 통합 검색 헤더 UI 컴포넌트
  - 이미지 업로드 표준화 (현재 S3 직접 업로드)

---

## 7. 환경 변수 / 실행 가이드

`.env` (already exists)
```
DB_NAME=busan
DB_USER=busan
DB_PASSWORD=...
DB_ROOT_PASSWORD=...
DB_PORT=3306
DB_HOST=localhost
```

```bash
docker compose up -d                                     # MariaDB
cd backend && uvicorn main:app --reload --port 8000     # API
npm run dev                                              # 프론트 8501

# 시드
cd backend && python seed_full_mock.py --reset
```
