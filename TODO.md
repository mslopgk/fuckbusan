# 부산 BDP — 미완료 항목

> **갱신**: 2026-05-09 (6차 — Phase 2 진단 뷰 보강 완료)
> **Figma 파일**: `jWpcqQv2jhb2mkzjEs1fuI`
> 완료 항목은 `CHANGES_2026-05-06.md` 참조.

`[ ]` = 미완 / `[?]` = Figma 확인 필요 / 정책결정 대기

---

## 🚨 P0 — 라우팅·백엔드 버그

### R2: `newDiagnosis` dead route 🟡
- **파일**: `src/App.jsx`
- [x] dead route 분기 삭제 완료 (2026-05-06)

### R4: `mDiagnosisResult` = `mDiagnosisDetail` 동일 컴포넌트 🟡
- **파일**: `src/App.jsx:1355`
- **현상**: 두 view가 모두 `MDiagnosisResult` 렌더링 — 현재 의도적 공유이나 "상세" vs "결과" 분리 필요 여부 미결
- [?] 정책 결정 대기

### R5: `auth.py` `/auth/signup` dead code 🟡
- [x] `/auth/signup` 엔드포인트 제거 완료 (2026-05-06)

---

## 🔴 P1 — UI 기능 누락

- [ ] **검색 API 연결**: PC 헤더에 검색 UI 자체가 없음. 검색바 UI 설계 후 `GET /api/search` 연결
- [ ] **Home 통계 섹션 활성화**: `Home.jsx:186-273`의 `{false && ...}` 블록. **사용자 결정 대기**
- [x] **구형 컴포넌트 정리**: `Report.jsx`, `ReportForm.jsx` lazy import 및 view 분기 제거 완료 (2026-05-06). `Survey.jsx`/`Diagnosis.jsx`는 진입 경로 있음 — 유지

---

## 🟡 P2 — Figma diff 보류

- [ ] **MReportForm 카테고리 4 vs 8개** — Figma `848:18955`는 4개(주거/환경/교통/안전), 코드는 8개. 정책 결정 필요
- [ ] **MDiagnosisResult 레이아웃** — 데이터 표 + radar 차트 4종 리팩. 규모가 커서 별도 작업 단위 필요

---

## 🔵 제보·제안 — 미완료

### 제보 리스트 (`MReportList.jsx`)
- [x] 카드 좋아요 토글 인터랙션 (2026-05-06): 하트 클릭 시 active/inactive 아이콘 전환 + 낙관적 카운트 업데이트 + API 호출

### 제보 폼 (`MReportForm.jsx`)
- [ ] 사진 등록: 실제 파일 첨부 후 이미지 URL → 서버 업로드 미구현 (`POST /api/reports/upload`)

### 제보 상세 (`MReportDetail.jsx`)
- [ ] cat 태그 색상: Figma 상세화면 노랑, 리스트화면 청록 — 일관성 미정, **정책 결정 대기**
- [x] 이미지 hero: `report.image` → `background-image` 적용 (없으면 그라데이션 fallback 유지)
- [ ] 단계바: "결과안내" 외 단계 클릭 가능 여부 미정

### 제안 상세 (`MProposalDetail.jsx`)
- [ ] cat 태그 색상: Figma `제안상세1~4` variant마다 다름 — 현재 catStyles.js 매핑 검증 필요
- [x] 이미지 hero: `proposal.image` → `background-image` 적용 (없으면 그라데이션 fallback)
- [ ] 댓글 더 보기 페이지네이션 없음 (Figma `848:18075` long variant)

---

## 🟨 진단 — 미완료

- [x] `MDiagnosisForm` 제목 마침표 제거 "진단해보세요." → "진단해보세요" (2026-05-06)
- [ ] `MDiagnosisResult` "관련 시민 제안" 섹션: Figma에 없는 코드 전용 섹션. keep/remove **결정 대기**
- [?] 일반/전문가 분기 — 전문가 노드 `941:10356`/`941:11592`/`941:11961` 확인 필요
- [?] PC 셸 (A안 통합) Figma `941:10538`/`12315`/`12749` 재검증

---

## 🟨 설문 — Figma diff 보류

- [ ] `MSurveyJoin` 진행 표시: Figma=보라 dot indicator, 코드=linear fill bar — 스타일 통일 **정책 결정 대기** (`TCuOzEqNhoLKjhF0reBDks:0:11000`)
- [x] `MSurveyDone` bottom nav 제거 완료 (2026-05-06). `MSurveyJoin` nav는 유지 (설문 진행 중 탭 이탈 방지 불필요)
- [?] `MSurveyResults` "자세히보기" 버튼 존재 확인 (line 160). onClick 미연결 — 연결 대상 view 미구현. 별도 상세 결과 뷰 설계 필요

---

## 🟨 마이활동 — Figma 노드 미식별

- [?] `MyPage.jsx` (계정/프로필 편집) — Figma 노드 미식별
- [?] `MyActivityHub.jsx` (활동 허브) — Figma 노드 미식별
- [?] `MyProposals.jsx` (모바일 나의 제안) — PC 버전 `830:7090` 참고 가능

---

## 🟨 홈 / 로그인 / 회원가입

- [ ] `Home.jsx` 통계/차트 섹션 활성화 — **사용자 결정 대기**
- [?] Figma 모바일 홈 노드 ID 식별 필요
- [?] `Login.jsx` — Figma 로그인 화면 비교
- [?] `Signup.jsx` — Figma 회원가입 화면 비교
- [?] PC 헤더/푸터

---

## 🟦 Admin — 미구현

- [x] AI가상시민 PC (`PCAICitizen`) + 모바일 (`MAICitizen`) 구현 완료 (2026-05-08) — `backend/routers/ai_citizens.py` mock 10명
- [x] AI가상시민 Figma Diff 보강 (2026-05-09): 아바타 인물실루엣, 카테고리 active 아이콘 filter teal, "문화·여가"/"보건·복지" 라벨, district placeholder, 말풍선 흰색/2행 클램프, PC 수평 캐러셀+원형 "›" 버튼
- [x] MobileBottomNav 탭 순서 변경: 진단/제보·제안/홈/가상시민/나의 활동 (2026-05-08)
- [x] `MDiagnosisList` 지도+패널 리디자인 (2026-05-09): 검색바 플로팅, 카테고리칩 지도 위, 시민/전문가 모드탭, Figma 카드 스타일
- [x] `PCDiagnosisMap` 우측 패널 보강 (2026-05-09): 시민/전문가 탭, teal name+score 카드 스타일 — `PCDiagPanelDetail` radar chart 이미 구현됨
- [?] AI가상시민 실제 DB 연동 (현재 mock 데이터)
- [?] 공공디자인 현황 메가 대시보드 미구현
- [?] 진단정보 / 정책정보 / 공공데이터 / 디자인생태 페이지 미구현

---

## 🚨 횡단 이슈 — 미완료

- [x] **MProposalForm 제목 마침표**: "제안해보세요." → "제안해보세요" 수정 완료 (2026-05-06)
- [x] **Detail 히어로 이미지**: MReportDetail/MProposalDetail `image` 필드 → background-image 적용 (2026-05-06)
- [ ] **CAT 종류 통일**: 제보 카테고리 4개 vs 제안 카테고리 8개 vs 필터 9개 — 명세 확정 필요
- [ ] **위치 좌표 노출**: `위도/경도` 수치 노출 → 실서비스는 reverse-geocoded 주소 필요
- [ ] **인증 가드 토큰 리다이렉트**: auth-gated 뷰 미인증 시 login 리다이렉트 verify 토큰 헬퍼 미구현
- [ ] **임시저장 다중 키**: `mProposalForm:draft` 단일 키 — 사용자별 분리 미고려
- [?] **ESLint 설정 미비**: `.eslintrc` 파일 없음, `eslint` 미설치. Vite 기본 설정만 존재

---

## 🗺️ Figma 노드 인덱스 (제보·제안)

| Figma 노드 | 화면 | 컴포넌트 |
|---|---|---|
| `848:17364` | 제안 리스트 | `MProposalList.jsx` |
| `848:17890` | 제안 지도 | `MProposalMap.jsx` |
| `848:17301` | 제안하기01 | `MProposalForm.jsx` |
| `848:17812` | 제안상세1 | `MProposalDetail.jsx` |
| `848:18075` | 제안상세 전체 (long) | (variant) |
| `848:18712` | 제안완료 | `MProposalDone.jsx` |
| `848:19015` | 제보 지도 | `MReportMap.jsx` |
| `848:19157` | 제보 리스트 | `MReportList.jsx` |
| `848:18955` | 제보하기01 | `MReportForm.jsx` |
| `848:19789` | 제보상세 | `MReportDetail.jsx` |
| `848:19843` | 제보상세>좋아요 | (variant) |
| `848:19897` | 제보상세>제보결과 | (모달) |
| `848:20468` | 제보완료 | `MReportDone.jsx` |

---

## 📋 섹션3·4 전수조사 결과 신규 항목 (2026-05-06)

### 🔴 P0
- [x] **어드민 메인 카드 아이콘 404** — 실제 SVG 파일 존재 확인 (HTTP 200). 오탐이었음 (2026-05-06)

### 🔴 P1
- [x] **어드민 메인 disabled 카드 hover teal 오류** — `:not(.disabled)` CSS 추가로 comingSoon 카드 hover teal 방지 (2026-05-06)
- [x] **PC 제안/제보하기 작성완료 버튼 색** — 코드 `#E6235A`가 프로젝트 디자인 토큰. Figma 오탐 (2026-05-06)
- [x] **어드민 설문 상태 텍스트** — STATUS_LABEL 수정 완료 (2026-05-06)
- [x] **어드민 설문 액션 UI** — `···` 드롭다운 컴포넌트로 교체 완료 (2026-05-06)
- [?] **PC 제안/제보 상세 상단 카테고리 pills** — 코드에 이미 tags row 존재. Figma 재확인 필요

### 🟡 P2
- [x] **어드민 제안/제보 페이지 타이틀** — "제안현황"/"제보현황"으로 수정 완료 (2026-05-06)
- [x] **어드민 제안/제보 검색 필드** — 회원검색 필드 추가 완료 (2026-05-06)
- [x] **어드민 설문 생성 버튼** — outline 스타일 "+ 새 설문 만들기"로 변경 완료 (2026-05-06)
- [x] **PC 설문목록 배너 너비** — 코드에 이미 max-width:1080px; margin:0 auto 적용 확인. 오탐 (2026-05-06)
- [x] **PC 설문목록 날짜 포맷** — `~종료일` 형식으로 변경 완료 (2026-05-06)
- [x] **PC 제안/제보 폼 배너 너비** — 코드에 이미 max-width:700px; margin:0 auto 적용 확인. 오탐 (2026-05-06)
