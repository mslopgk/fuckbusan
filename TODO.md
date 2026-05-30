# 부산 BDP — 미완료 항목

> **갱신**: 2026-05-28 (13차 — TODO 최신화)
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
- [x] **MDiagnosisResult 레이아웃** — 테이블 레이아웃 + 레이더차트 4종으로 전면 재작성 완료 (2026-05-28)

---

## 🔵 제보·제안 — 미완료

### 제보 리스트 (`MReportList.jsx`)
- [x] 카드 좋아요 토글 인터랙션 (2026-05-06): 하트 클릭 시 active/inactive 아이콘 전환 + 낙관적 카운트 업데이트 + API 호출
- [x] Figma 전수조사 완료 (2026-05-28): 전체 레이아웃·카드 구조 일치 확인

### 제보 폼 (`MReportForm.jsx`)
- [x] 사진 등록: MReportForm은 이미 구현되어 있었음 확인 (2026-05-21)
- [x] 임시저장에 location/pickedLat/pickedLng 누락 → 추가 완료 (2026-05-21)
- [x] back 버튼 → `mReportList` (목록으로) 수정 (2026-05-28)

### 제보 폼 PC (`PCReportForm.jsx`)
- [x] 사진 업로드 API 연결 완료 — POST /api/reports/upload 호출 + image_url payload 포함 (2026-05-21)
- [x] 임시저장 버튼 onClick 구현 — pcReportForm:draft localStorage (2026-05-21)

### 나의 제보 수정 PC (`PCMyReportEdit.jsx`)
- [x] 사진 추가 버튼 dead → file input + POST /api/reports/upload 연결 완료 (2026-05-21)

### 제보 상세 (`MReportDetail.jsx`)
- [ ] cat 태그 색상: Figma 상세화면 노랑, 리스트화면 청록 — 일관성 미정, **정책 결정 대기**
- [x] 이미지 hero: `report.image` → `background-image` 적용 (없으면 그라데이션 fallback 유지)
- [ ] 단계바: "결과안내" 외 단계 클릭 가능 여부 미정
- [x] 답글쓰기 dead button 제거 (2026-05-21)
- [x] author 섹션 2-line 레이아웃으로 수정 — Figma 848:19789 기준 (2026-05-28)
- [x] `created_at` snake_case 필드 매핑 추가 (2026-05-28)

### 나의 제보 상세 (`MMyReportDetail.jsx`)
- [x] 댓글 작성 UI 추가 — input + 전송 버튼 + POST /api/reports/{id}/comments (2026-05-21)
- [x] 답글쓰기 dead button 제거 (2026-05-21)

### 제안 상세 (`MProposalDetail.jsx`)
- [ ] cat 태그 색상: Figma `제안상세1~4` variant마다 다름 — 현재 catStyles.js 매핑 검증 필요
- [x] 이미지 hero: `proposal.image` → `background-image` 적용 (없으면 그라데이션 fallback)
- [ ] 댓글 더 보기 페이지네이션 없음 (Figma `848:18075` long variant)
- [x] 이미지 표시 수정 — files[0] fallback 추가 (2026-05-21)
- [x] 답글쓰기 dead button 제거 (2026-05-21)

### 제안 폼 (`MProposalForm.jsx`)
- [x] 사진 업로드 API 연결 — POST /api/reports/upload 호출 + files/image_url payload (2026-05-21)
- [x] back 버튼 → `mProposalList` (목록으로) 수정 (2026-05-28)

### 제안 지도 (`MProposalMap.jsx`)
- [x] 정렬(최신/조회/투표) 실제 반영 — useMemo에 sort 로직 추가 (2026-05-21)
- [x] 카드 이미지 빈 div → backgroundImage 설정 (2026-05-21)
- [x] back 버튼 → `mProposalList` 수정 (2026-05-28)

### 나의 제안 (`MyProposals.jsx`)
- [x] 클릭 시 구버전 ProposalDetail → 기기별 pcMyProposalDetail/mProposalDetail 분기 (2026-05-21)
- [x] console.log 제거 (2026-05-21)

---

## 🟨 진단 — 미완료

- [x] `MDiagnosisForm` 제목 마침표 제거 "진단해보세요." → "진단해보세요" (2026-05-06)
- [x] `MDiagnosisList` 전문가 탭 필터 연결 — mode state → API ?target 파라미터 + filtered 로직 반영 (2026-05-21)
- [x] `MDiagnosisForm` 뒤로가기 `home` → `mDiagnosisList` 수정 (2026-05-21)
- [x] `MDiagnosisForm` submitting 중복제출 방지 (2026-05-21)
- [x] `MDiagnosisForm` FACILITY_CHIP_MAP → 표준 대분류 매핑 + QUESTIONS_BY_SUB 동적 질문 (2026-05-21)
- [x] `MDiagnosisResult` 레이더 차트 실제 데이터 — GET /checklist/{resultId} + answers 파싱 (2026-05-21)
- [x] `MDiagnosisResult` 날짜 하드코딩 제거 (2026-05-21)
- [x] `MDiagnosisResult` 세부정보 버튼 alert → disabled 처리 (2026-05-21)
- [x] `MDiagnosisResult` 레이더 차트 fill/stroke 색 `#06AB69` → `#E6235A` (Figma+token 일치) (2026-05-28)
- [x] `MDiagnosisList` 헤더 검색바 → Figma 기준 뒤로가기+모드명+구 드롭다운으로 교체 (2026-05-28)
- [x] `MDiagnosisList` 카테고리 칩 font-size 16px 수정 (2026-05-28)
- [x] `MDiagnosisResult` 세부정보 버튼 3개 모두 green 통일 (2026-05-28)
- [x] `MDiagnosisResult` title font-size 28px (2026-05-28)
- [x] `MDiagnosisForm` title "진단하기" pink #E6235A 28px, 섹션 라벨 번호 형식 추가 (2026-05-28)
- [x] `MDiagnosisForm` CTA 버튼 green→pink #E6235A, height 56px, font-size 18px (2026-05-28)
- [x] `MDiagnosisDone`/`CheckDone` 아이콘 60px→40px, 타이틀 24px→28px, 설명 16px→14px (2026-05-28)
- [x] `MDiagnosisResult` 테이블 레이아웃 + 4개 레이더차트 구조로 전면 재작성 (2026-05-28)
- [ ] `MDiagnosisResult` "관련 시민 제안" 섹션: Figma에 없는 코드 전용 섹션. keep/remove **결정 대기**
- [ ] 모바일 전문가 진단 전용 플로우 — 현재 mode 전달만, 전용 화면 없음
- [?] PC 셸 (A안 통합) Figma `941:10538`/`12315`/`12749` 재검증

---

## 🟨 설문 — Figma diff 보류

- [ ] `MSurveyJoin` 진행 표시: Figma=보라 dot indicator, 코드=linear fill bar — 스타일 통일 **정책 결정 대기** (`TCuOzEqNhoLKjhF0reBDks:0:11000`)
- [x] `MSurveyDone` MobileBottomNav 추가 + 홈 버튼 인라인 스타일 → CSS 클래스 (2026-05-21)
- [x] `MSurveyDone` 하단 여백 과다 수정 — padding 160px → 0, actions padding 조정 (2026-05-28)
- [x] `MSurveyJoin` 필수 응답 검증 추가 — 미응답 시 제출 차단 (2026-05-21)
- [x] `MSurveyJoin` submitting 중복제출 방지 + localStorage 이어하기 저장 (2026-05-21)
- [x] `MSurveyDetail2` demographics(성별/연령/기기/직업) MSurveyJoin으로 전달 → 백엔드 저장 (2026-05-21)
- [x] `MSurveyDetail2` 동의 입력 스타일 circle radio → square checkbox (Figma 스펙) (2026-05-28)
- [x] `MSurveyDetail2` 직업(소속) 2-column grid → 1-column (Figma 스펙) (2026-05-28)
- [x] 백엔드 SurveyResponse.demographics JSON 컬럼 추가 (2026-05-21)
- [x] `MSurveyResults` "자세히보기" alert → disabled 처리 (2026-05-21)
- [x] `MSurveyResults` 히어로 타이틀 raw title → "YYYY년,\n[title] 결과는?" 형식 (Figma 스펙) (2026-05-28)
- [x] `PCSurveyResults` open toggle → 실제 콘텐츠 show/hide 구현 (2026-05-21)
- [x] `MSurveyDetail1` 이용약관/개인정보처리방침 span → onClick alert + cursor:pointer (2026-05-21)
- [x] `PCSurveyJoin` submitting guard → 중복 제출 방지 (2026-05-28)
- [ ] 중복 응답 방지: 백엔드 unique constraint 미적용 — 추가 필요

---

## 🟨 마이활동 — Figma 노드 미식별

- [?] `MyPage.jsx` (계정/프로필 편집) — Figma 노드 미식별
- [x] `MyActivityHub.jsx` — 진단 내역 카드 추가 (2026-05-21)
- [x] `MyActivity.jsx` — 정렬 로직 구현 + 이메일 API 연동 + 북마크 탭 안내 메시지 + console.log 제거 (2026-05-21)
- [x] `MyActivity.jsx` + `DiagnosisCard.jsx` Figma 기준 대규모 스타일 수정 (2026-05-28):
  - 타이틀 `나의 활동` pink #E6235A
  - 카드 border 1px solid #e6e6e6, border-radius 8px, padding 12px, no shadow
  - 타입 뱃지 fill→outline border style (일반인 #E6235A, 전문가 #542AA3)
  - 이미지 100px→120px, border-radius 8px
  - 점수/결과 24px bold GmarketSans
  - 스코어 박스 #F2F2F2 bg, 6-col grid
  - 구분선 dashed #e6e6e6
  - 좌표 12px #737373
  - 탭 버튼 pill shape 36px, 14px, border-radius 9999px
  - 프로필 아바타 gray #e6e6e6, gap 20px
- [x] `MyReports.jsx` — 헤더 "홈으로" → "나의 활동" 수정 (2026-05-21)
- [?] `MyProposals.jsx` (모바일 나의 제안) — PC 버전 `830:7090` 참고 가능

---

## 🟨 홈 / 로그인 / 회원가입

- [ ] `Home.jsx` 통계/차트 섹션 활성화 — **사용자 결정 대기**
- [x] Figma 모바일 홈 노드 `575:22588` 확인 완료 (2026-05-28)
- [x] `Home.jsx` 제안하기 카드 색상 green→teal #23BDBB 수정 (2026-05-28)
- [x] `Login.jsx` console.log 제거 (2026-05-21)
- [x] `Signup.jsx` console.log 제거 (2026-05-21)
- [x] `PCHeader.jsx` — '나의 활동' 메뉴 추가 → myActivityHub (2026-05-21)
- [?] `PCHeader.jsx` 검색바 UI 설계 — `GET /api/search` 연결 필요
- [?] PC 헤더/푸터 Figma 비교

---

## 🟦 Admin — 미구현

- [x] AI가상시민 PC (`PCAICitizen`) + 모바일 (`MAICitizen`) 구현 완료 (2026-05-08) — `backend/routers/ai_citizens.py` mock 10명
- [x] AI가상시민 Figma Diff 보강 (2026-05-09): 아바타 인물실루엣, 카테고리 active 아이콘 filter teal, "문화·여가"/"보건·복지" 라벨, district placeholder, 말풍선 흰색/2행 클램프, PC 수평 캐러셀+원형 "›" 버튼
- [x] MobileBottomNav 탭 순서 변경: 진단/제보·제안/홈/가상시민/나의 활동 (2026-05-08)
- [x] `MDiagnosisList` 지도+패널 리디자인 (2026-05-09): 검색바 플로팅, 카테고리칩 지도 위, 시민/전문가 모드탭, Figma 카드 스타일
- [x] `PCDiagnosisMap` 우측 패널 보강 (2026-05-09): 시민/전문가 탭, teal name+score 카드 스타일 — `PCDiagPanelDetail` radar chart 이미 구현됨
- [x] AI가상시민 PC `FigmaDistrictMap` 하단구역 클리핑 수정 (2026-05-21): `scale(width/1920)` → `Math.min(scaleW, scaleH)` + 중앙 정렬 — 1440px~1920px 모든 뷰포트에서 영도구/사하구/서구 완전 표시
- [x] AI가상시민 모바일(`MAICitizen`) 지도 스크롤 차단 수정 (2026-05-21): `.leaflet-container`에 `touch-action: pan-y` 추가
- [x] `MAICitizenDetail` 전면 재작성 — 히어로/프로필그리드/시민목소리/핵심이슈/여정지도/정책신호등/참여현황/레이더차트 (2026-05-28)
- [x] `MAICitizen` 말풍선에 아바타 이미지 추가 (2026-05-28)
- [x] `PCAICitizen` 참여현황 차트·카드 스타일 개선 (2026-05-28)
- [x] `PCMapCanvas` 진단 핀 원형→teardrop (시민=회색 solid / 전문가=청록 outline) (2026-05-28)
- [x] `PCMapShared.css` / `PCDiagnosisMap.css` teardrop 핀 CSS + 툴바 위치 수정 (2026-05-28)
- [?] AI가상시민 실제 DB 연동 (현재 mock 데이터)
- [?] 공공디자인 현황 메가 대시보드 미구현
- [?] 진단정보 / 정책정보 / 공공데이터 / 디자인생태 페이지 미구현

---

## 🐛 신규 버그 (2026-05-30)

- [x] **PCProposeMap 제안 이미지 미표시** — `p.image` 참조 버그: `NewProposalRead`에 `image` 필드 없음 → `p.files[0]` 사용으로 수정 (2026-05-30)
- [x] **seed_full_mock 제안 lat/lng 누락** — 시드된 제안이 `proposal-pins` 엔드포인트에 미반환 → `lat/lng` 추가 (2026-05-30)

---

## 🐛 신규 버그 (2026-05-21)

- [x] **제안 지도 핀 미표시** — `MProposalForm` lat/lng 미전송 수정, `MProposalMap`/`PCProposeMap` DISTRICT_CENTERS fallback + Busan center fallback 추가, deterministic jitter (2026-05-21)
- [x] **댓글 2개씩 등록** — `MProposalDetail`/`MReportDetail`/`PCProposeDetail`/`PCReportDetail` 모두 `commenting` guard 추가 (2026-05-21)
- [x] **조회수 미연동** — `PCReportDetail` `views_count` → `views ?? views_count` 필드명 수정 (2026-05-21)
- [x] **제안 처음 진입 시 정책정보 불필요 노출** — `PCProposeMap` `policyDismissed` 기본값 `true`로 변경 (2026-05-21)
- [x] **진단 제출 후 핑 추가 안됨** — `PCDiagnosisMap` `refreshKey` state 추가, `goDone()` 시 increment → useEffect 재실행 (2026-05-21)
- [x] **제보/제안 핑 추가 안됨** — `MReportForm` lat/lng 항상 전송 수정 (2026-05-21)
- [x] **진단 만족도 2,4번 선택지 이미지 제거** — `diagnosis.js` face: null for values 2,4; `PCDiagPanelForm` 조건부 렌더 (2026-05-21)
- [x] **MSurveyResults 앱 크래시** — `respondentCount`·`compositeData` 등 `const` 선언 순서 오류(TDZ) 수정: `handleCopy` useCallback을 모든 파생값 선언 이후로 이동 (2026-05-28)
- [x] **MReportDetail author 2-line 레이아웃** — Figma 848:19789 기준 작성자/날짜 2줄 구조로 수정 (2026-05-28)
- [x] **MReportDetail created_at 필드 매핑 누락** — `report?.created_at` fallback 추가 (2026-05-28)
- [x] **MFilterSheets RegionSheet/SortSheet 아이콘** — checkmark → chevron-down (always visible, pink when active) — Figma 848:19327·848:19455 기준 (2026-05-28)
- [x] **MReportForm 카테고리 칩 스타일** — bordered white style로 수정 (Figma 848:18955 기준) (2026-05-28)

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

## ⏳ 정책·기획 결정 대기 (코드 작업 불가)

| 항목 | 파일 | 내용 |
|---|---|---|
| MReportForm 카테고리 수 | `MReportForm.jsx` | Figma=4개(주거/환경/교통/안전), 코드=8개 — 통일 여부 결정 필요 |
| CAT 종류 통일 | 전체 | 제보 4개 vs 제안 8개 vs 필터 9개 — 명세 확정 필요 |
| MReportDetail cat 태그 색상 | `MReportDetail.jsx` | Figma=노랑, 리스트=청록 — 상세화면 색 결정 |
| MProposalDetail cat 태그 색상 | `MProposalDetail.jsx` | variant마다 다름 — catStyles.js 재검증 |
| MReportDetail 단계바 클릭 | `MReportDetail.jsx` | "결과안내" 외 단계 클릭 가능 여부 |
| MProposalDetail 댓글 페이지네이션 | `MProposalDetail.jsx` | Figma long variant 기준 더보기 구현 여부 |
| MDiagnosisResult "관련 시민 제안" 섹션 | `MDiagnosisResult.jsx` | Figma에 없는 코드 전용 섹션 — keep/remove |
| MSurveyJoin 진행 표시 | `MSurveyJoin.jsx` | Figma=보라 dot indicator, 코드=linear fill bar |
| mDiagnosisResult vs mDiagnosisDetail | `App.jsx` | 두 view 동일 컴포넌트 공유 — 분리 여부 |
| Home 통계 섹션 활성화 | `Home.jsx:186-273` | `{false && ...}` 블록 활성화 여부 |

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
