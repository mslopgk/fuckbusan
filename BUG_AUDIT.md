# 런타임 버그 & 코드 수준 감사 (자율 루프 — 2026-06-10~)

> Figma 디자인 diff는 `FIGMA_DIFF_SPEC.md`(모바일) / `FIGMA_DIFF_SPEC_PC.md`(PC) 참조.  
> 이 파일은 **코드 버그·미구현·verify 하네스 이슈** 전용.  
> 상태: `[ ]` 미수정 / `[x]` 수정 완료 / `[?]` 확인 필요 / `[skip]` 의도적 보류

---

## 패스 1 — 2026-06-10 (모바일 실캡처 + 코드 분석)

### 🔴 B01 — mMyReportDetail / mMyReportEdit: verify seed 필드명 불일치
- **위치**: `verify/routes.json` — `mMyReportDetail` / `mMyReportEdit` sessionSeed
- **현상**: seed가 `created_at: "2026.03.13"` (snake_case) 전달 → `MMyReportDetail.jsx:25` `createdAt: report?.createdAt || report?.date` 둘 다 미매핑 → verify 캡처에서 날짜 행 비어있음
- **프로덕션 영향**: 없음. 백엔드 `_serialize_report`는 `"date"` 키로 반환 → `report?.date` 정상 매핑
- [x] **fix**: `routes.json` seed에서 `created_at` → `date` 로 변경 — 캡처에서 날짜 행 정상 표시 확인 (2026-06-10)

### 🔴 B02 — mMyReportEdit: verify 캡처 홈 리다이렉트
- **위치**: `verify/run.mjs` 하네스 타이밍, `src/App.jsx:1450`
- **현상**: verify에서 `mMyReportEdit` 요청 시 홈 화면 캡처됨. `waitFor` timeout silently eaten (`.catch(() => {})`)
- **근본**: verify 하네스가 `page.goto(baseUrl, domcontentloaded)` → seed → `page.goto(url, networkidle)` 패턴에서 간헐적으로 sessionStorage가 react mount보다 늦게 읽힘 가능성
- **프로덕션 영향**: 없음. 실제 앱에서는 `mMyReportList → 수정` 네비게이션으로 진입, report prop 정상 전달
- [x] **fix**: 진짜 원인 발견 — 이전 뷰 `page.close()` 시 abort된 fetch가 `fetchWithLogout`의 'Failed to fetch' 분기를 타서 **공유 localStorage의 access_token을 삭제** → 다음 auth 뷰가 홈으로 리다이렉트. `run.mjs`에 (1) goto 후 current_view 불일치 시 토큰 포함 재시드+리로드, (2) waitFor 타임아웃 silent-eat 제거(리포트에 `waitForTimeout` 기록) 적용. 배치 7뷰 연속 실행에서 정상 캡처 확인 (2026-06-10) → 신규 발견 B39 참조

### 🟡 B03 — mDiagnosisResult: 사진 없을 때 placeholder 행 항상 노출
- **위치**: `src/components/MDiagnosisResult.jsx:269~284`
- **현상**: `displayPhoto === null`이어도 "사진" 테이블 행이 항상 렌더됨. 사진 없는 진단 결과에서 빈 placeholder 박스 표시
- **코드**: 
  ```jsx
  <div className="m-diagres-table-row m-diagres-table-row--photo">
      ... {displayPhoto ? <img/> : <placeholder SVG/>}
  ```
- [?] Figma에서 사진 없는 케이스 레이아웃 확인 필요. 사진 없으면 행 숨기기(`displayPhoto && <row/>`) 고려

### 🟡 B04 — PCDiagnosisMap: 중/소분류 드롭다운 필터 미연결
- **위치**: `src/components/PCDiagnosisMap.jsx:244~257`
- **현상**: UI에 중분류/소분류 `<select>` 요소 존재하나 `onChange` 핸들러·옵션 데이터 없음. 대분류 `bigSel` state도 items 필터링에 미반영 (`:145~150`)
- **영향**: PC 진단 지도에서 중/소분류 필터가 시각적으로는 보이지만 동작 없음 — UX 오해 유발
- [x] **fix**: 중분류 select에 실데이터(`items`의 `mid`) 옵션 바인딩 + 필터 체인 반영. 소분류는 API에 해당 차원 없음 → disabled 처리로 의도 명시. 확인 버튼 → refreshKey 재조회 연결. **잔여**: FACILITY_BIG 체크박스(공간 및 가로 환경 등 3종)는 데이터 대분류(공공공간/교통 등 13종)와 매핑 자체가 없어 미연결 — 분류 매핑 테이블 확정 필요 (2026-06-10)

### 🔴 B05 — SurveyEditor: scale 문항이 'single'로 저장됨 → 슬라이더 미동작
- **위치**: `src/admin/pages/SurveyEditor.jsx:12`
- **현상**: `QTYPE_MAP = { ..., scale: 'single', ... }` — 어드민에서 "선형배율" 타입 문항을 만들어 저장하면 서버에 `qtype='single'`로 저장됨. MSurveyJoin/PCSurveyJoin은 `q.qtype === 'scale'` 조건으로 슬라이더를 렌더하므로 절대 슬라이더 표시 불가.
- **추가**: `SERVER_TO_EDITOR`에 `scale: 'scale'` 없어서 서버에서 qtype='scale'인 문항 로드 시 editor에서 'short'로 fallback됨
- **root cause**: 개발 시 서버 qtype 목록에 'scale'이 없다고 가정하고 'single'로 매핑
- [x] **fix** (2026-06-10):
  - `QTYPE_MAP.scale = 'scale'` / `SERVER_TO_EDITOR['scale'] = 'scale'` 적용
  - 백엔드 `qtype`은 String(20) 자유 컬럼 — 'scale' 그대로 저장/반환됨 확인. 결과 집계는 else 분기(samples)로 처리되어 에러 없음

### 🟡 B06 — MyProposals.jsx: PC 전용 리스트 컴포넌트 없음
- **위치**: 없음 — `MyProposals.jsx` 통합 컴포넌트 사용
- **현상**: PC에서 "나의 제안 목록" 화면이 모바일+PC 반응형 통합 컴포넌트로 처리됨. PC 전용 3열 그리드 레이아웃이 Figma Figma 631:15635 스펙과 다를 수 있음
- [?] `MyProposals.jsx` PC 뷰 그리드 컬럼 수 확인 필요. Figma 631:15635 프레임 미수신으로 정확한 비교 보류

### 🟢 B07 — ProposalList / ReportList 3열 그리드 — 정상 확인
- ProposalList.css: `repeat(3, 1fr)` ✅
- ReportList.css: `repeat(3, 1fr)` ✅
- PCMyReportList.css: `repeat(3, 1fr)` ✅ (캡처 2열은 데이터 2건 탓)

### 🟢 B08 — PCAICitizen: 렌더링 안전성 확인
- 모든 `.map()` 전 null 체크, `?.` 연산자 완비. 렌더링 버그 없음 확인 (`:728` 배열 `?.map`, `:843` null 체크 후 avatarUrl 접근)

### 🟢 B09 — MENU_ITEMS 삭제 영향 없음
- `src/data/constants.js` 에서 `MENU_ITEMS` 제거 (git diff). grep 결과 참조 없음 → 안전한 삭제 확인

### 🟢 B10 — backend /reports/list endpoint 삭제 영향 없음
- `report_router.py`에서 레거시 `/list` 삭제 (git diff). 프론트에서 해당 경로 호출 없음. `/surveys/list`, `/checklist/list`는 별도 라우터 → 영향 없음

---

---

## 패스 2 — 2026-06-10 (admin 영역)

### 🟡 B11 — verify 하네스: `--admin-token` / admin sub-view 캡처 불가 2종 버그
- **위치**: `verify/run.mjs:47~48`, `verify/routes.json`
- **버그 1**: `--admin-token` 플래그 → `localStorage.admin_token` 저장. 그러나 admin 페이지(`LoginNew.jsx:23`, `AdminMain.jsx:30`) 등은 전부 `localStorage.access_token` 읽음 → `--admin-token`으로 admin 캡처 불가. **`--token=<admin_jwt>` 를 써야 함.**
- **버그 2**: admin 서브뷰(adminUserList/reportManagement 등) routes.json `"path": "/admin"`. App.jsx는 `/admin` 경로에서 `current_view` sessionStorage를 무시하고 항상 `adminMain` 반환 → 서브뷰 직접 캡처 불가.
- [x] **fix (버그 1)**: `--admin-token`이 `access_token`에 저장되도록 `run.mjs` 수정 (2026-06-10)
- [ ] **fix (버그 2)**: admin 서브뷰 직접 캡처는 여전히 불가(`/admin`은 항상 adminMain) — 클릭 네비게이션 별도 스크립트 필요 (기존 `verify/admin_shots.mjs` 활용 검토)

### 🟡 B12 — admin 프론트엔드 역할(role) 체크 없음
- **위치**: `src/App.jsx:114~120`
- **현상**: `/admin` 경로 진입 시 `access_token` 존재 여부만 확인 (사용자 역할 미확인). 일반 시민 JWT로도 `/admin` URL 직접 접근 가능 → adminMain 화면 렌더됨.
- **백엔드 보호 상태**: `admin_router.py` 모든 엔드포인트에 `_require_admin(current_user)` (user.ID=='admin' 검증) → API 호출은 403으로 보호됨.
- **영향**: 일반 사용자가 `/admin` URL 직접 접근 시 admin UI가 보이지만 실제 데이터 호출은 모두 실패(403). UX적 혼란 야기.
- [x] **fix**: App.jsx에 `isAdminToken()` (JWT payload sub==='admin' 디코드) 추가 → 시민 토큰으로 `/admin` 진입 시 로그인 화면. LoginNew도 `district_code !== 'admin'`이면 "관리자 계정이 아닙니다" 거부. Playwright로 시민토큰→Login 화면 / admin→adminMain 양방향 확인 (2026-06-10)

### 🟢 B13 — admin 대시보드 레이아웃 정상
- `adminMain` 1280px 캡처: WDC 로고 + 좌 사이드바(회원관리·제안/제보관리·진단관리·설문관리 active, 나머지 회색 disabled) + 우 3×3 카드 그리드(회원관리/제보·제안/진단/설문/공공데이터/홍보/공지사항/기타+/기타+) 정상 렌더
- 진단/공공데이터관리/공지사항/홍보/기타 카드: `view: 'comingSoon'` — opacity:0.5 + pointer-events:auto로 disabled 처리 확인. 의도적 미구현.

### 🟢 B14 — admin 코드 null 안전성 확인
- `ReportManagement`: `setReports([])` 초기값, `data.items || []` 안전 언래핑 ✅
- `SurveyManagement`: `Array.isArray(data) ? data : []` 안전 처리 ✅
- `AdminUserList`: `data.map(...)` — fetchUser 에러 시 catch로 처리 ✅

---

---

## 패스 3 — 2026-06-10 (모바일 상세 뷰 + AI 가상시민)

### 🔴 B15 — "답글쓰기" 버튼 회귀 — 3개 컴포넌트 (TODO.md [x] 불일치)
- **위치**: `MReportDetail.jsx:228`, `MMyReportDetail.jsx:193`, `MProposalDetail.jsx:241`
- **현상**: `TODO.md`에 `[x] 답글쓰기 dead button 제거 (2026-05-21)` 로 완료 표시됐으나, 세 파일 모두 버튼이 실제 코드에 남아있음. 모두 onClick 핸들러 없는 dead UI.
- **MReportDetail**: `<button type="button" className="m-comment-reply">답글쓰기</button>`
- **MMyReportDetail**: `<button type="button" className="m-myrdetail-reply-link">답글쓰기</button>`
- **MProposalDetail**: `<button type="button" className="m-comment-reply">답글달기</button>`
- [x] **fix** (2026-06-10): Figma 0:12110에 답글쓰기가 스펙 요소로 존재 → 일괄 삭제가 아니라 분기 처리:
  - **MProposalDetail**: 답글 **기능 구현** — 백엔드 `ProposalComment.parent_comment_id` + nested replies 이미 완비. 답글달기 클릭 → 입력창 답글 모드(취소 가능) → `parent_comment_id` 포함 POST → 대댓글 들여쓰기 렌더
  - **MReportDetail / MMyReportDetail**: `ReportComment`에 parent 컬럼 자체가 없어 백엔드 미지원 → dead button 삭제. 제보 댓글 답글 스펙이 필요하면 DB 마이그레이션 별도 작업

### 🟡 B16 — mProposalDetail: verify/routes.json sessionSeed 없음 → 빈 데이터 렌더
- **위치**: `verify/routes.json` — `mProposalDetail` 항목
- **현상**: `sessionSeed` 없음 → `selectedProposal = null` → verify 캡처에서 제목/본문/카테고리 모두 빈 상태 렌더 (author='익명', views=0, 지도만 표시)
- **프로덕션 영향**: 없음. 실제 앱에서는 리스트 클릭 시 selectedProposal이 전달됨.
- [x] **fix**: `routes.json`에 selectedProposal seed 추가 — 캡처에서 제목/카테고리/작성자/날짜/♥12 정상 렌더 확인 (2026-06-10)

### 🟢 B17 — mDiagnosisDone: teal 컬러 ✅ 정상
- teal 원형 체크 + "일반 진단 완료" (teal) + "진단 홈으로 가기" (teal 버튼). `CheckDone color="#23BDBB"` 정상 작동 확인.

### 🟢 B18 — mDiagnosisForm: 렌더링 정상
- 사진등록/공공시설물 칩(아파트·주택가/근린·어린이공원/폐가·공가/어린이보호구역/상업가/공공시설/기타)/리뷰/임시저장·작성완료 구조 정상. 작성완료는 미충족 시 disabled(연한 teal). ✅

### 🟡 B19 — mAICitizen: 맵 말풍선 위치 — 데이터 의존 확인 필요
- 현재 캡처: 지도 위에 teal 말풍선 ("늦게까지 공부하고 집에 갈 때 골목이 어두워서...") + 카드 리스트 (이서연 22세 #대학생#키페탐방러#야간도보측, 김민준 35세 #직장인#대중교통이용자#환경관심)
- FIGMA_DIFF_SPEC.md P2 "mAICitizen 말풍선/아바타 상충" — 현재 렌더링에서 말풍선이 지도 위에 정상 표시됨
- [?] Figma에서 말풍선 정확한 위치/스타일 재확인 필요 (WDC 파일 참조)

### 🟡 B20 — mReportDetail: "답글쓰기" 외 정상 확인
- 정상: topbar 칩(동래구/주거/골목쓰레기통), 작성자+지역+날짜, 제목+본문, 지도, 날짜·조회수·좋아요·댓글 stat, 댓글 입력창, 하단 단계바(검토중 active 핑크) ✅
- 회귀: "답글쓰기" 버튼 → B15 참조

## 패스 4 — 2026-06-10 (PC 폼 + 모바일 추가 뷰 + verify 하네스)

### 🔴 B21 — verify routes.json: PC/admin 뷰 다수 viewport 미설정 → 모바일 크기(390px)로 캡처
- **위치**: `verify/routes.json`
- **현상**: `viewport` 객체 없음 → 전역 기본값 `{ width: 390, height: 844 }` 사용 → PC/admin 뷰가 모바일 폭으로 캡처됨
- **영향 뷰 (10개 이상)**:
  - `pcDiagnosisForm`, `pcDiagnosisDone`, `pcMyReportList`, `pcMyReportEdit`
  - `adminLoginNew`, `adminMain`, `adminUserList`, `adminDashboardNew`
  - `reportManagement`, `proposalManagement`, `surveyManagement`, `surveyEditor`, `surveyResults`, `expertManagement`
  - `mMyReportDetail`, `mMyReportEdit` (모바일이지만 반응형 체크 필요)
- **adminDashboardNew 캡처**: "로그아웃" 텍스트가 "로\n그\n아\n웃" 4줄로 줄바꿈 — 레이아웃 깨짐 확인
- [x] **fix**: `verify/routes.json` 14개 뷰에 `"viewport": { "width": 1280, "height": 800 }` 추가 완료

### 🔴 B22 — PCProposeForm: 첨부파일 업로드 미구현 (사일런트 소실)
- **위치**: `src/components/PCProposeForm.jsx:158`, `204~210`
- **현상**: 파일 첨부 UI (multi-select + thumbnail 미리보기) 완전 구현되어 있으나, `handleFileChange`는 `URL.createObjectURL`(blob)만 생성하고 서버 업로드 안 함. `handleSubmit`에서 `files: []` 하드코딩 → 첨부파일 모두 소실
- **비교**: `PCReportForm.jsx` 올바르게 `/api/reports/upload` 호출 후 serverUrl 수집 → payload에 포함
- **MProposalForm.jsx**도 서버 업로드 정상 처리
- [x] **fix**: `handleFileChange`에 서버 업로드 추가 (이미지 compressImage 후 `/api/reports/upload`, serverUrl 수집) + `handleSubmit` payload `files: uploadedUrls` / `image_url` 포함 + 업로드 중 제출 비활성 (2026-06-10)

### 🟡 B23 — mNotifications verify: routes.json auth:false → 토큰 미주입 → 비로그인 상태 캡처
- **위치**: `verify/routes.json` — `mNotifications` `"auth": false`
- **현상**: verify 하네스가 `v.auth` truthy일 때만 token 주입. `auth: false`라 토큰 미주입 → MNotifications가 "로그인 후 알림을 확인할 수 있습니다." 상태로 캡처됨
- **프로덕션 영향**: 없음. 실제 앱에서는 Home에서 알림 아이콘 클릭 → 로그인 상태로 진입
- [x] **fix**: 확인 결과 `routes.json`에 이미 `"auth": true` 반영되어 있음 (이전 패스에서 수정된 것으로 보임) (2026-06-10)

### 🟡 B24 — MDiagnosisList/MDiagnosisMap: DB의 null 레코드로 "진단" 표시 항목 다수
- **위치**: `src/components/MDiagnosisList.jsx:98` (`name: r.질문기준 || r.대분류 || '진단'`)
- **현상**: `/checklist/list` API 응답에 `대분류`, `중분류`, `질문기준`, `위도`, `경도` 모두 null인 레코드 다수 존재 → 리스트에 그냥 "진단"이라고만 나오는 항목 다수 노출
- **원인**: 백엔드 DB의 데이터 품질 문제 (가상시민 시드 시 일부 레코드 incomplete 저장)
- **코드 영향**: null 레코드 필터링 없음. `name: r.질문기준 || r.대분류 || '진단'` 폴백으로 "진단" 표시
- [x] **fix (옵션 2 채택)**: 백엔드 `/checklist/list`에서 대분류·중분류 모두 NULL인 레코드 제외 — 모든 소비자(M/PC 리스트·지도)에 일관 적용. API 재확인: bad rows 3→0 (2026-06-10). uvicorn이 --reload 없이 떠 있어서 --reload로 재기동함

### 🟡 B28 — SurveyResults admin: "자세히보기" 버튼 dead
- **위치**: `src/admin/pages/SurveyResults.jsx:201`
- **현상**: `<button className="btn-outline-new">자세히보기 ∨</button>` — onClick 없는 dead 버튼. compositeScores 있을 때 레이더 차트 아래 표시되지만 클릭해도 아무 동작 없음
- [x] **fix**: 토글 구현 — 클릭 시 문항별 종합점수 테이블(문항 전문 + n.n/5) 펼침/접힘 (2026-06-10)

### 🟡 B29 — mSurveyResults: 설문 3 응답 111건이지만 분포 0 (데이터 정합성)
- **위치**: 백엔드 DB - `SurveyAnswer` vs `SurveyQuestion` 간 question_id 불일치
- **현상**: `/api/surveys/3/results`에서 `response_count=3`이나 모든 질문 `total=0`. 설문 4 (111건)는 정상 분포 표시
- **원인**: 설문 3의 응답이 저장될 때의 question_id들이 관리자 편집/재생성으로 변경됨 → 현재 question_id(19,20,21)와 SurveyAnswer의 question_id 불일치
- [?] **보류 (사용자 결정 필요)**: 응답 삭제든 question_id 재매핑이든 DB 실데이터 파괴적 변경 — 어느 쪽으로 할지 확인 후 진행. 재매핑은 기존 응답의 원래 문항 매칭 근거가 없어서 사실상 추측이 됨

### 🟢 B25 — PCReportForm 파일 업로드 ✅ 정상
- `handleFileChange`: `/api/reports/upload` 호출 → serverUrl 수집 → payload에 포함 ✅
- B22 대비: PCReportForm은 올바르게 구현됨

### 🟢 B26 — MyPage.jsx `/users/me` 엔드포인트 정상
- `${API_URL}/users/me` = `http://localhost:8000/users/me` → 200 OK 응답 ✅
- (오탐 확인: `/api/users/me`는 Vite SPA fallback HTML 반환이라 HTTP 200이었지만 실제 API가 아님)

### 🟢 B27 — 삭제 CSS 파일 미사용 확인
- `src/admin/styles/components/ai-chat.css`, `sidebar.css`, `dashboard.css`, `src/admin/styles/pages/auth.css` 삭제
- import 참조 없음 확인 ✅ (sidebar 클래스는 `admin.css`에서 인라인 선언, 별도 파일 불필요)

## 패스 5 — 2026-06-10 (admin 세부 + 모바일 미완성 영역 + 추가 코드 스캔)

### 🟡 B30 — DashboardNew/ExpertManagement: admin 리스트 "삭제" 버튼 dead (2개 파일)
- **위치**: `src/admin/pages/DashboardNew.jsx:106`, `src/admin/pages/ExpertManagement.jsx:110`
- **현상**: 두 파일 모두 `<span className="btn-action-text">삭제</span>` 에 onClick 없음. "수정" 옆 "삭제" 버튼이 dead UI.
- **비교**: `AdminUserList.jsx:135` — `onClick={() => handleDelete(item)}` 정상 구현. `ProposalManagement.jsx:181` — `onClick={() => handleDelete(p.id)}` 정상 구현. DashboardNew/ExpertManagement만 미구현.
- [x] **fix**: 두 파일 모두 `handleDelete(item)` 구현 (window.confirm → DELETE `/admin/users/:id` → 목록에서 제거, AdminUserList 패턴 동일) + onClick 연결 (2026-06-10)

### [skip] B31 — ExpertDiagnosisResult/ExpertDiagnosisDetail: 전문가 진단 결과 하드코딩 모의 데이터
- **위치**: `src/components/ExpertDiagnosisResult.jsx:40`, `src/components/ExpertDiagnosisDetail.jsx:53`
- **현상**: 주소 "부산 부산진구 초연로 6" 하드코딩, 통계 "14/40" / 만족도 "2.1" 전 섹션 하드코딩. ExpertDiagnosisDetail도 addresses 배열 하드코딩 3개.
- **의도**: CLAUDE.md "진단 (전문가) — 미구현 영역 많음" — 의도적 미구현. 실제 API 연동 전까지 프로토타입 상태.
- [skip] 전문가 진단 완전 미구현 영역, 별도 스프린트 대상

### 🟡 B32 — MAICitizenDetail: 유사 시민 비율 아이콘 highlighted 하드코딩
- **위치**: `src/components/MAICitizenDetail.jsx:206`
- **현상**: `const highlighted = 1` — 하드코딩. `personTotal`은 `similar_desc` 텍스트 파싱으로 동적 계산되지만 highlighted(강조 아이콘 수)는 항상 1. 유사 비율이 20%이든 80%이든 항상 아이콘 1개만 teal 강조.
- **예상 동작**: `d.similar_ratio`(예: "18.2%") 파싱 → `Math.round(total * ratio / 100)` = highlighted 계산
- [x] **fix**: `Math.min(personTotal, Math.max(1, Math.round(personTotal * ratio / 100)))` 적용 — 캡처 검증: 12.3% × 8명 → 1개 강조 정상 (2026-06-10)

### 🟡 B33 — mAICitizenDetail: verify/routes.json에 누락
- **위치**: `verify/routes.json`
- **현상**: `mAICitizenDetail` view(`MAICitizenDetail.jsx`)가 verify 대상에 없어 캡처 불가
- [x] **fix**: `routes.json`에 항목 추가 (seed: 이서연/id 1, waitFor `.m-ai-detail`) — 캡처 정상 (아바타/태그/유사비율 12.3%/체감언어) (2026-06-10)

### 🟢 B34 — PCProposeDetail: 구현 정상 확인
- 투표/댓글/삭제 모달 — 모두 onClick 있음 ✅. API 호출: `/api/reports/proposals/:id/vote` (POST), `/comments` (GET/POST) ✅

### 🟢 B35 — PCMyProposalDetail: 구현 정상 확인
- 삭제 모달(confirm/cancel), 수정하기 (`onEdit`/`onNavigate`), 댓글, 좋아요 — 모두 정상 ✅

### 🟢 B36 — MyActivityHub: 구현 정상 확인
- "나의 제보현황" → `myReportList`, "나의 제안현황" → `myProposals`, "나의 진단내역" → `mMyActivity` — 모두 정상 라우팅 ✅

### 🟢 B37 — PCSurveyJoin: scale 문항 처리 확인 (B05 연동)
- `q.qtype === 'scale'` 조건으로 슬라이더 렌더 (line 114) — PC도 동일. B05(SurveyEditor 오저장) 해결되면 PC/모바일 양쪽 슬라이더 복구됨 ✅

### 🟢 B38 — SurveyManagement/AdminUserList: 삭제 핸들러 정상
- `SurveyManagement`: `handleDelete` 구현 + API 호출 ✅
- `AdminUserList`: `handleDelete(item)` API 호출 ✅
- `ProposalManagement`: `handleDelete(p.id)` API 호출 ✅

## 패스 5.5 — 2026-06-10 (수정 작업 중 신규 발견)

### 🟡 B39 — fetchWithLogout: 일시적 fetch 실패에도 강제 로그아웃
- **위치**: `src/utils/api.js:8~18`
- **현상**: `TypeError`/'Failed to fetch'(네트워크 순단, 요청 abort 포함)면 무조건 alert + `access_token` 삭제 + 강제 리로드. 모바일 환경에서 전파 순단 한 번에 세션이 날아감. verify 하네스에서도 page.close 시 abort된 fetch가 이 분기를 타서 공유 토큰이 지워지는 부작용 확인 (B02 근본 원인).
- **하네스 측 대응**: run.mjs 재시드 시 토큰 복구로 우회 완료.
- [?] **앱 측 fix 제안 (사용자 결정)**: 401/403 등 인증 실패에만 로그아웃하고, 네트워크 오류는 토스트/재시도 처리로 완화. 현재 동작이 의도라면 skip.

### 🟡 B40 — verify routes.json: stale waitFor 셀렉터 3건 (신규 가시화)
- **위치**: `verify/routes.json` — `pcDiagnosisForm`(.pc-diagform-page), `pcDiagnosisDone`(.check-done-container), `pcReportForm`(.pc-modal-backdrop)
- **현상**: B02 수정으로 waitFor 타임아웃이 리포트에 기록되면서 드러남. 캡처는 렌더되나 셀렉터가 현재 DOM에 없음 (컴포넌트 리팩토링으로 클래스명 변경/패널 구조 변경 추정)
- [ ] **fix**: 세 뷰의 현재 root 클래스 확인 후 waitFor 갱신

### 🟢 B41 — verify apiChecks: 삭제된 `/api/reports/list` 참조 → `/api/reports/full`로 교체 (2026-06-10)
- B10에서 삭제 확인된 레거시 endpoint를 apiChecks가 계속 호출해 422 발생 → 현행 `/full`로 교체, API 36/36 통과

## 패스 6 — 예약 (PC 진단 + AI가상시민 Figma 도착 후)

> Figma REST 레이트리밋 해소 후 13프레임 수신 → 세 번째 비교 에이전트 투입 → 결과 병합 → TODO

---

## 검증 방법론

- **verify:fe**: `npm run verify:fe -- --views=<id,...> --token=<jwt>` → `verify/screenshots/<id>.png`
- **코드 grep**: `grep -rn '<패턴>' src/components/ --include="*.jsx"`
- **git diff**: 미커밋 변경 회귀 여부 확인
- JWT (ktp1122): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJrdHAxMTIyIn0.uWy0Mvfg1MYKU9lCraMnt8jclv5B1FXL9P2_BPapjeQ`
- 검증용 시민 계정: `votetester1` / `votetest123` (2026-06-10 생성, 토큰은 `/users/login`으로 발급)
