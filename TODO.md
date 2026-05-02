# 부산 BDP 프로젝트 TODO

> **갱신**: 2026-05-02 (Figma MCP 비교 추가)
> **데이터 소스**: Figma 파일 `jWpcqQv2jhb2mkzjEs1fuI` 메타데이터 + 5개 핵심 프레임 스크린샷 + `docs/` 스펙 + `src/` 전수 + verify 런타임 + 캡처 시각 검토
> **Figma 레퍼런스 캡처**: `verify/figma-refs/` 보관

## 🗺️ Figma 구조 요약 (확인됨)

Figma는 **3개 카테고리, 59 sections**으로 구성:

- **USER: MOBILE** (16 페이지) — 시민용 모바일. 홈/로그인/회원가입/제보·제안/설문/진단(일반·전문가)/마이활동
- **USER: PC** (3 페이지) — 시민용 PC 버전. 홈/제안하기
- **ADMIN: PC** (12 페이지) — 관리자 데스크톱
  - 관리자페이지 - 제안 / 회원관리 / 회원가입
  - **AI가상시민 현황** ← 미구현 (컴포넌트는 있음)
  - **디자인생태 현황** ← 미구현
  - **공공디자인 현황** ← 미구현 (5패널 메가 대시보드)
  - **정책정보** ← 미구현
  - **진단정보** ← 미구현
  - **공공데이터** ← 미구현
  - 제보/제안 (= ReportManagement / ProposalManagement, 부분 구현)
  - 설문정보 (= SurveyManagement, 부분 구현)

→ `docs/BDP_개발명세서`의 "통합 진단 대시보드" = ADMIN 영역. 그리고 **거의 다 미구현**. 지난 TODO에서 "스펙이 outdated일 수 있다"고 추측했지만, Figma가 스펙을 그대로 반영하고 있어 **outdated 아님 — 미구현임**.

---

## 🔴 P0 — 즉시 (가장 큰 갭)

### F1. **Home view가 사실상 stub** [확정]
Figma 홈은 매우 길고 풍부한 dashboard-like 페이지인데 현재 코드는 5~10% 수준.

| Figma에 있음 | 현재 코드 (`Home.jsx`) |
|---|---|
| 헤더 (로그인/회원가입) | ✅ 있음 |
| 타이틀 + 부산 지도 | ✅ 있음 |
| 제보하기 / 제안하기 카드 | ✅ 있음 |
| **종합 진단 점수 게이지바 (보라+핑크) + 도넛 차트** | ❌ 없음 |
| **시민 OOOO명 통계 섹션** | ❌ 없음 |
| **시설물 사진 카드 3장 (가로등/벤치 등)** | ❌ 없음 |
| **다양한 진단 결과 차트들** | ❌ 없음 |
| **챗봇 / 안내 카드** | ❌ 없음 |
| **푸터** | ❌ 없음 |
| 로그인 상태용 "내 정보 + 활동 요약" 변형 | ❌ 없음 (Figma 우측 작은 화면) |

수정: `src/components/Home.jsx` + `Home.css` 대대적 보강. `recharts` 이미 설치되어 있음.
참조: `verify/figma-refs/home_mobile.png`

### F2. **AI가상시민 현황 admin 페이지 미연결** [확정]
컴포넌트는 다 만들어져 있는데 어느 페이지에서도 안 씀.

- `src/admin/components/dashboard/AIPersonaPanel.jsx` — 좌측 페르소나 메시지 흐름
- `src/admin/components/dashboard/PersonaDetailModal.jsx` — 페르소나 상세 모달
- `src/admin/components/dashboard/AIChatPanel.jsx`
- `src/admin/components/dashboard/FloatingChatWidget.jsx`
- `src/admin/components/dashboard/MapCanvas.jsx`
- `src/admin/components/dashboard/InsightDetailModal.jsx`

이들을 import하는 곳: legacy `admin/pages/Dashboard.jsx`(App.jsx에서 lazy import는 되어 있으나 라우팅 안 됨)와 deadcode `pages/Dashboard.jsx`. **연결만 하면 됨**.

수정: 새 admin 페이지 (예: `AdminAICitizen.jsx`) 만들고 위 컴포넌트들 조립 + AdminSidebar 메뉴 추가.
참조: `verify/figma-refs/admin_ai_citizen.png`

### F3. **공공디자인 현황 admin 메가 대시보드 미구현** [확정]
Figma에 5패널 통합 페이지 (공공데이터 / 일반진단 / 정책정보 / 제보·제안 / 민원정보) 각각 지도+차트. 완전 미구현.
참조: `verify/figma-refs/admin_design_status.png`

### F4. **진단정보 admin 페이지 미구현** [확정]
Admin이 진단 결과를 지도 + 점수 모달로 보는 화면. 미구현.
참조: `verify/figma-refs/admin_diagnosis_info.png`

### F5. **정책정보 / 공공데이터 / 디자인생태 현황 미구현** [확정]
Figma에 명시 — 모두 admin 페이지. 위 F2/F3/F4와 같이 admin 영역의 dashboard ecosystem 전체가 빠짐.

---

## 🐛 P0 — 시각/런타임 버그 (이전 발견 유지)

- [ ] **Home: 하단 네비바와 "나의 활동" 카드 겹침** — Figma에는 그 위치에 카드 없음 (Figma는 훨씬 길어서 자연스레 겹칠 일이 없음). F1 작업 시 자연스럽게 해소 가능성 높음.
- [ ] **ReportList: floating 카테고리 chip ("교통") 가 카드 위에 겹침** — Figma 패턴 확인 결과 floating chip은 의도된 디자인이 아닌 듯. 일반 가로 스크롤 chip row가 맞음. `src/components/ReportList.jsx` z-index/position 검토.

---

## 🚨 P0 — 스펙 위반 (Critical Rule)

- [ ] **`lucide-react` 13개 admin 파일에서 사용 중** — `docs/BDP_개발명세서_v3.0.md` §4.2가 "절대 금지". 치환 대상:
  - `src/admin/components/dashboard/AIChatPanel.jsx`
  - `src/admin/components/dashboard/FloatingChatWidget.jsx`
  - `src/admin/components/dashboard/AIPersonaPanel.jsx`
  - `src/admin/components/dashboard/PersonaDetailModal.jsx`
  - `src/admin/components/dashboard/MapCanvas.jsx`
  - `src/admin/components/dashboard/InsightDetailModal.jsx`
  - `src/admin/components/Sidebar.jsx`
  - `src/admin/components/common/MultiSelectDropdown.jsx`
  - `src/admin/pages/SurveyCreated.jsx`
- [ ] **react-router-dom 미사용 + `App.jsx` 1116줄 view state machine** — 스펙은 v6+ SPA Routing 명시. URL이 `/`와 `/admin` 둘뿐이라 딥링크/SEO/북마크 불가. **F1~F5에서 admin 페이지 다수 추가 예정이므로 이번 기회에 admin/만 라우터 도입 권장**.
- [ ] **axios + interceptors 부재** — `src/utils/api.js`의 `fetchWithLogout`이 자체 구현. 토큰 만료 처리 일관성 위해 axios 도입.
- [ ] **dummy 토큰 admin 우회** — `src/admin/pages/LoginNew.jsx:17-20`에 `admin/admin1234` 입력 시 `dummy_token` 박는 코드. 데모용이지만 환경 변수 가드 필요.

---

## 🔧 P1 — 기술부채

- [ ] **`App.jsx` 1116줄 거대화** — F1~F5 구현 시 view 더 추가될 예정. 라우터 도입 + 페이지 분리.
- [ ] **하드코딩 색상** — `App.jsx:482-484`에 `#542AA3`, `#1E0B43`, `#E6235A`, `#8B1F54`. CSS 변수 / Tailwind 토큰화.
- [ ] **VITE_API_URL 분기 30곳** — `src/utils/api.js`의 baseUrl 상수로 통합.
- [ ] **localStorage 기반 상태 (`deletedReportIds`, `likedReportIds`, `userCreatedReports`, `updatedReportsMap`)** — `backend_design.md`가 백엔드 처리 명시. F2~F4 admin 페이지 만들 때 이 데이터가 admin 측에서도 보여야 하므로 백엔드로 이전 필요.

---

## 🚧 P1 — 백엔드 (`docs/backend_design.md` 기준)

- [ ] `backend/models.py`에서 `reports`, `report_images`, `report_likes`, `improvement_results` 4개 테이블 존재 검증
- [ ] `POST /api/reports/:id/like` 토글 구현 검증
- [ ] `POST/GET /api/reports/:id/comments` 구현 검증
- [ ] `improvement_results` 테이블 + 조회 응답 포함 검증
- [ ] `ON DELETE CASCADE` 제약 검증
- [ ] 이미지: 로컬 `backend/uploads/` → S3 CDN 이전
- [ ] `/auth/signup`, `/auth/login` 응답 형식 검증 → verify에 케이스 추가

---

## 📋 P2 — 정리/삭제 후보

- [ ] **`src/pages/` 3개 파일** (`Login.jsx`, `Signup.jsx`, `Dashboard.jsx`) — react-router 사용하지만 App.jsx import 안 함. **deadcode 확정** (grep 결과 어디서도 안 씀). 삭제.
- [ ] **`src/admin/pages/Dashboard.jsx`** — App.jsx에 lazy import는 있으나 onNavigate 트리거 없음 (route='adminDashboardNew'만 사용). AI 페르소나 컴포넌트들의 유일한 사용처라 F2 구현 후 삭제.
- [ ] **`src/admin/pages/Login.jsx`** — App.jsx에 import는 있으나 트리거 없음 (`adminLoginNew`만 사용). deadcode.
- [ ] **`src/components/dashboard/`** (admin/dashboard와 동일한 4개 파일 중복) — 누구도 import 안 함. deadcode.
- [ ] **`SuggestForm.jsx`, `SuggestSuccess.jsx`, `ReportSuccess.jsx`, `NewDiagnosis.jsx`** — App.jsx에 import 안 됨 또는 dead route. deadcode.

→ deadcode 정리만 해도 약 15+ 파일 줄어듦.

---

## 🛠 P1 — 검증 시스템 자체 보강

- [ ] **auth 토큰 헬퍼** `verify/scripts/get-token.mjs` — 테스트 계정 로그인 → JWT. myPage/diagnosis/report/adminMain 등 검증 가능해짐.
- [ ] **routes.json selector 어설션** 채우기 — 현재 `body` 대기만. 핵심 요소 selector 추가.
- [ ] **시각 회귀 baseline + diff** — `verify/baselines/`에 합격 스크린샷, `pixelmatch` 비교. 임계치 5%.
- [ ] **콘솔 warn 캡처** 추가 (현재 error만)
- [ ] **API 페이로드 어설션** (status 코드 외 응답 키 검증)
- [ ] **Figma baseline 자동 동기화** — `verify/scripts/sync-figma.mjs`로 Figma 핵심 노드 PNG를 `verify/figma-refs/`에 캐시. 디자인 변경 감지 가능.

---

## 🎨 P2 — 디자인 시스템 정합성

- [ ] **컬러 토큰화** — Figma 색상 추출 (get_variable_defs는 selection 필요해서 실패. 다음에 노드 선택 후 재시도)
- [ ] **PCHeader 표시 조건** — `App.jsx:489-490`의 `pcHeaderViews`. F1 (home 보강) 후 재검토.
- [ ] **모바일/PC 반응형** — Figma의 USER:PC 영역 (3페이지) 별도 구현 필요. 현재 코드는 모바일 우선.
- [ ] **PCHeader vs 모바일 헤더** — Figma USER:MOBILE에 헤더 패턴 있음. PCHeader.jsx와 별도인지 확인.

---

## ❓ Figma 추가 확인 필요 (다음 라운드)

> 첫 라운드는 핵심 5개 프레임만 비교. 더 깊이 보려면 다음 노드들 가져오기:

- [ ] `206:2494` 로그인 — citizen Login (`src/components/Login.jsx`) vs admin LoginNew 디자인 일관성
- [ ] `206:2546` 회원가입 — Signup.jsx 비교
- [ ] `206:7745` 진단하기 + `314:16813` 일반 진단 — 6단계 흐름 (DiagnosisStep1 → BigCategory → CheckList → Satisfaction → Review → CheckDone) 정합
- [ ] `314:19544` 전문가 진단 — purple 테마 검증
- [ ] `206:12669` 나의 활동 — MyActivity / MyActivityHub 비교
- [ ] `631:11640` USER PC 홈 — F1 작업 시 PC 버전도 함께
- [ ] `723:4105` 관리자페이지 - 회원관리 — AdminUserList / MemberEdit 비교
- [ ] `723:4593` or `723:4725` 관리자페이지 - 제안 — ProposalManagement 비교
- [ ] `313:13678` 설문정보 — SurveyManagement / SurveyEditor 비교

각 호출당 메타+스크린샷이라 5~10번 추가 호출 예상.

---

## 📊 카운트

| 분류 | 항목 | 예상 효과 |
|---|---|---|
| F1~F5 (Figma 갭) | 5 | **가장 큰 미구현 — 전체 admin dashboard 영역** |
| P0 시각 버그 | 2 | F1 시 자연 해결 가능 |
| P0 스펙 위반 | 4 | lucide-react가 admin 영역에 깊이 박혀있어 F2~F5 작업과 같이 진행 |
| P1 기술부채 | 4 | |
| P1 백엔드 | 7 | |
| P2 정리 | 5 | 약 15+ 파일 삭제 |
| P1 검증 보강 | 6 | |
| P2 디자인 시스템 | 4 | |
| Figma 추가 라운드 | 9 | |

## 🔄 권장 진행 순서

1. **deadcode 정리** (P2 정리) — 작업 전 노이즈 제거 (반나절)
2. **lucide-react 치환** (P0 스펙) — admin 영역 작업 전 인프라 정리 (1~2일)
3. **react-router 도입** (admin/만) — F2~F5 추가 페이지가 필요하니 라우터 먼저 (1일)
4. **F2 AI가상시민 현황 연결** — 컴포넌트 다 있으니 가장 빠름 (반나절)
5. **F4 진단정보 admin** — 비교적 단순 (1~2일)
6. **F1 Home 보강** — 콘텐츠 풍부, 차트/통계 데이터 백엔드 의존 (2~3일)
7. **F3 공공디자인 현황 메가 대시보드** — 가장 무거움 (3~5일)
8. **F5 정책정보 / 공공데이터 / 디자인생태** — 데이터 의존 (2~3일)
9. **백엔드 보강** + **검증 시스템 보강** 병행
