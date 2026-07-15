# 부산 BDP — 미완료 항목

> **갱신**: 2026-07-15 (코드코리아 수정요청사항 260713 반영)
> **Figma 파일**: 모바일 = WDC `TCuOzEqNhoLKjhF0reBDks` page 0:1 / PC = `hJCPXp7YcYUL60u2NHiYrS` page 0:1
> 모바일 전수 diff 상세 = `FIGMA_DIFF_SPEC.md`, PC = `FIGMA_DIFF_SPEC_PC.md`. 완료 이력 = `CHANGES_2026-05-06.md`.
> **다음 세션/다른 개발자 인수인계**: `CLAUDE_HANDOFF.md` 필독 (컨벤션 외 세션에서만 축적된 함정·해결책·프로젝트 상태).

`[ ]` = 미완 / `[?]` = Figma·디자이너 확인 또는 정책결정 대기

---

## 🆕 코드코리아 수정요청사항 (2026-07-13, 김유리 — 원본 `260713_코드코리아 수정요청사항.docx`)

> 스크린샷 비교(현재화면 vs 피그마화면) 기반 요청. 대상 컴포넌트는 추정 매핑 — 착수 전 Figma 최신 프레임([[figma_frame_version]] 원칙, 아래쪽=최신) 재확인 필수.

> **2026-07-15 업데이트**: docx 내 스크린샷 28장 전수 확인(`textutil` unzip → media 추출) 완료. 아래는 이미지 근거로 구체화한 내용.

### 메인화면 (Home)
- [x] 메인 지도 뒷 배경 — 이미 구현됨(`.pch2-hero::before` 지도배경 데스크탑.png opacity 0.3). 클라 "누락"은 구버전 빌드 기준. 무변경
- [x] 지도 hero 수직 중앙 정렬 — `HomePC.css .pch2-hero-map` top:24px/flex-start → top:0 bottom:0/center (`06b866c`, 실브라우저 검증)
- [~] 지역별 TOP 5 — 이미 구현·실데이터 연동됨(우측상단, `/api/home/district-ranking`, 동래구 5건 등). ⚠️ **상충**: 요청 텍스트는 "하단에 붙여주세요"인데 목표 image1은 **우측 상단**. 현재 image1 기준(우측상단) 유지. 디자이너 확인 필요 — 진짜 하단 이동이면 hero에서 분리해 별도 섹션 재배치 추가작업

### 설문화면 (PC — 스피드 버튼 영역, 설문 진입 카드)
- [x] "무엇을 도와드릴까요?" 카드에서 우측 스피드 버튼 3개를 같은 div 안에서 full-width로 분리 (SurveyChat.css `.surveychat-intro.pc` stretch + flex 240px, 칩 width:100% — 2026-07-15 검증)

### AI 가상시민 (`MAICitizen.jsx` 모바일 / PC 리스트 공통)
- [ ] 스크롤 없도록 사이즈 조정
- [ ] 지도의 구 영역을 **클릭하지 않은 상태**(부산대표 AI 가상시민, 총 11명 등 전체 리스트)의 리스트 디자인이 Figma와 다름 — Figma 참조: 좌측 구역별 드롭다운+생활정보 9그리드 지도, 우측 "부산대표 AI 가상시민" 카드 리스트(이름/나이/해시태그 3개/한줄 코멘트, 중요도순 정렬)

### AI 가상시민 상세 (`PersonaReport.jsx` 여정지도 / PCAICitizen)
- [x] 상단 이모지 겹침 — 실제는 여정지도(`PersonaReport`)의 하단 감정선 SVG 점이 상단 카드/이모지와 어긋난 것. 원인: 그리드 gap 8px vs SVG 점 균등분할 불일치. `PCAICitizen.css` gap:0+카드 margin:0 4px로 카드중심=(i+0.5)/n 일치시켜 정렬 (`bf5dd72`, Playwright 6스텝 diff 전부 0px 검증)

### 진단하기 (PC — `PCDiagnosisMap.jsx`/`PCDiagnosisDetail.jsx`)
- [?] 좌측 대시보드 디자인이 Figma와 다름 — Figma 참조: 구역별 드롭다운 + 생활정보 9그리드 + **진단대상(전체/시민/전문가) 세그먼트 토글** + 공공/시설물 대분류·중분류·소분류 폼(취소/확인 버튼). **기존 TODO "🔴 PC Figma diff" `pcDiagnosisMap 우측패널 구조` 항목과 동일 사안으로 추정** — 디자이너 컨펌 시 함께 처리

### 공공데이터 (PC — `PCPublicData.jsx`)
- [x] 우측 지표 카드 클릭 시 데이터값 미표시 — 근본원인: `!isAll` 게이트로 **전체 모드에서 카드 클릭 자체가 무반응**이었고 상세는 하드코딩 placeholder. 수정: 전체/카테고리 공통 클릭 + 상세에 백엔드 실값(값/연도/비고/출처) 렌더, 없으면 '준비중'. `hitFor()` 추가 (2026-07-15 Playwright 검증: 공공도서관 클릭→"4개관/2024년 기준/출처")
- [x] "전체" 버튼 아이콘 흰색 유지 버그 — 근본원인: `all.svg`만 `fill=white`(형제 8개는 `#737373`)라 inactive 시 흰배경에 안 보임. `all.svg`를 `#737373`으로 통일 (2026-07-15 Playwright 검증, 안전 active 시 전체 아이콘 정상 표시)
- [x] 특정 구 클릭 시 %값 미표시 — **답: 데이터 부재가 맞음**. `/api/public-data/overview` 실데이터는 4종(공공도서관 4개관/CCTV 1,130대/미세먼지 31㎍/교통사고 1,373건)만 시드. 나머지 60여 지표는 백엔드 미연동('준비중' 정상). 위 클릭 수정으로 실데이터 지표는 값 노출됨. 나머지는 공공데이터 백엔드 확장 필요(코드 아님, 데이터 수급 이슈)

### 제보/제안 (PC — 지도 화면)
- [ ] 좌측 대시보드 디자인이 Figma와 다름 (제보/제안 동일) — Figma 참조: 구역별 드롭다운 + 생활정보 9그리드 + **유형 카드**(제보 29건/제안 22건, 보라 액티브 강조)
- [ ] 핀 클릭 시 디자인 변경 — Figma 참조: "정책 정보" 팝업(시도/시군구/사업명/위치/면적/선정년도 + "자세히 보기"/"상세보기" 버튼, 보라 테마)
- [ ] 좋아요(하트) 팝업 내용 **중앙 정렬** (제보/제안 동일)

### 진단하기 (모바일 — `MDiagnosisList.jsx`/`MDiagnosisMap.jsx`)
- [?] 카테고리 위치 및 리스트 디자인이 Figma와 다름 — **디자이너 확인 필요(공유 컴포넌트 이슈)**. 현재 mDiagnosisList는 **아이콘 rail**(CategoryRail = Figma 302:5940 통일 실물컴포넌트, 제보·제안·진단 **공유**), image13 목표는 **pill 칩**(둥근 알약형). 진단만 pill로 바꾸면 3개 도메인 디자인이 갈라짐 → 셋 다 pill로 통일할지 vs 진단만 예외로 할지 디자이너 결정 필요. [[project_docs_backlog]]에 이미 기록된 알려진 충돌. 임의 변경 안 함
  - 참고: image13은 지도+시트 뷰(mDiagnosisMap 계열)로 보이고, 현재 mDiagnosisList는 순수 리스트 — 뷰 구조 차이도 함께 확인 필요

### 공공데이터 (모바일)
- [ ] **미구현** — 모바일 공공데이터 화면 신규 작업 필요 (PC `PCPublicData.jsx` 상당의 모바일 버전 부재). 우선순위/스코프는 정책 결정 필요 (PC와 동일 정보 밀도로는 모바일에 안 맞을 가능성 — 별도 레이아웃 설계 권장)

### 제보/제안 (모바일 — `MReportMap.jsx`/`MProposalMap.jsx`)
- [x] 뒤로가기 버튼 누락 — `MProposalMap`이 `showBack={false}`였음(제보맵은 true). `showBack={true}` + onBack→mProposalList로 통일 (2026-07-15 verify 캡처 확인)
- [?] 좌측 대시보드 디자인이 Figma와 다름 (제보/제안 동일) — **위 모바일 진단과 동일한 공유 CategoryRail(302:5940) 디자이너-확인 이슈**. 3개 도메인 리스트가 아이콘 rail로 통일돼 있고 리스트전용 프레임은 pill 칩 — 셋 다 바꿀지 결정 필요. 임의 변경 안 함

### 관리자 — 회원정보 수정 (전문가)  ✅ `9505027`
- [x] 승인 상태 버튼 형태 — ExpertEdit에 이미 승인/미승인 토글(teal) 구현돼 있었음(백엔드 `PATCH /api/admin/users/{id}` is_approved 지원). 일반회원은 승인개념 없어 전문가 전용(정상)
- [x] 참여현황 펼침 리스트 — 일반회원(MemberEdit)도 제안/제보/설문 펼침(chevron 토글) 리스트로 통일. 데이터 `GET /api/admin/users/{id}/activity` 연동

### 관리자 — 제보/제안/설문  ✅ `9505027`
- [x] 상태 탭 제거 + 검색 통일 — 3화면 모두 드롭다운(제보/제안=카테고리, 설문=지역)+통합검색으로 일치. 상태탭 완전 제거. (Playwright 검증: 교통 선택→30→8건 서버필터 정상)

### 관리자 — 진단관리  ✅ (이미 구현)
- [x] 수정 버튼 — `AdminDiagnosisList`가 이미 image24의 진단 지역 단위 화면(진단지역/진단수/진단인원/등록일+수정|삭제+진단지역추가하기)이고 수정 버튼(RegionModal) 존재. 코드 변경 불필요

### 관리자 — 공공데이터  ✅ (이미 구현)
- [x] 신규 페이지 — `AdminPublicData`가 이미 팝업 아닌 전체 페이지(mode list|form: 데이터명/영역/기간/파일 + 엑셀 업로드·양식다운로드 + 등록/삭제)로 구성됨. 코드 변경 불필요

### 관리자 — 가상시민  ✅ `9505027`
- [x] 편집 탭화 + 가로스크롤 제거 — EditModal을 기본정보/데이터통계/여정지도/정책신호등 4탭+세로 단일컬럼(560px)으로 개편. (Playwright 검증: 4탭 전부 scrollWidth===clientWidth, 가로스크롤 0)

---

## 🔴 PC Figma diff — 남은 작업

- [ ] **PC home 대시보드 스코프 결정**: Figma가 사실상 신규 대시보드 스펙(차트/캐러셀/통계카드/아카이브/소식/다크푸터 7+섹션) — 구현 여부 정책 결정
- [ ] **개선완료 status 데이터(admin)**: 관리자가 제보 status를 `개선완료`로 바꾸고 `result_details`(결과사진/코멘트) 입력하는 admin UI — 상세화면 결과배너는 이미 구현, 입력 경로 미구현
- [ ] **진단/AI가상시민/나의제안 PC 비교 미완**: Figma REST 레이트리밋으로 13프레임 미수신 — 재시도 필요 (디자인 변경 반영해 재대조 권장)
- [?] **디자이너 확인**: USER PC 로그인 admin 스타일 통일, 지도 정렬 라벨, 카테고리 칩 canonical

---

## 🔴 P1 — UI 기능 누락

- [?] **PC 헤더 검색 UI**: 백엔드 `GET /api/search`(+`/suggest`)는 이미 존재·동작. PC 사용자 헤더에 검색바를 넣을지/위치/형태는 디자인 결정 필요 (admin 검색은 이미 구현됨)
- [ ] **Home 통계 섹션 활성화**: `Home.jsx:186-273` `{false && ...}` 블록 — 사용자 결정 대기

---

## 🔵 제보·제안

- [?] `PCMyReportList`/`MyReports` 기본 상태필터가 `개선중`(PC)/`검토중`(모바일)이라 신규 `개선예정/접수` 제보가 첫 화면에서 숨음 — 기본값 재검토(전체 or 접수)
- [ ] `MProposalDetail` 댓글 더보기 페이지네이션 없음 (Figma `848:18075` long variant) — 정책 결정

---

## 🟨 진단

- [ ] `MDiagnosisResult` "관련 시민 제안" 섹션: Figma에 없는 코드 전용 섹션 — keep/remove 결정
- [ ] 모바일 전문가 진단 전용 플로우 — 현재 mode 전달만, 전용 화면 없음
- [ ] `MDiagnosisList` 지도 없는 순수 리스트 뷰 (Figma 22:6281) — 현재 map+sheet 구조, 아키텍처 변경 결정
- [?] PC 셸 (A안 통합) Figma `941:10538`/`12315`/`12749` 재검증

---

## 🟨 마이활동

- [?] 색상 미일치 후보 — `MyActivityHub` 진단 수치 `#dd5b1b`, `MyProposals` 탭 active `#23bdbb`(코드 주석 "Figma 캡처 기준"), `MyActivity` 헤더 `#E6235A`(2026-05-28 Figma 기준 기록). 코드에 Figma 근거가 있어 임의 변경 보류 — 디자이너 최신 프레임 확인 후 일괄 결정
- [?] 모바일 `MyActivityHub` 탭(관심목록/최근본글/자주본글) 후속 구현 — PC에 만든 `utils/viewHistory.js` 재사용 가능

---

## 🟨 홈 / 로그인 / 회원가입

- [?] PC 헤더/푸터 Figma 비교

---

## 🟦 Admin / 미구현

- [?] AI가상시민 실제 DB 연동 (현재 mock 데이터)
- [?] 공공디자인 현황 메가 대시보드 미구현
- [?] 진단정보 / 정책정보 / 공공데이터 / 디자인생태 페이지 미구현

---

## 🚨 횡단 이슈

- [ ] **CAT 종류 통일**: 제보 8개 / 필터 9개 — 코드 일치 상태이나 명세 최종 확정 필요
- [ ] **인증 가드 토큰 리다이렉트**: auth-gated 뷰 verify 토큰 헬퍼 미구현 (verify/ 도구)
- [ ] **임시저장 다중 키**: `mProposalForm:draft`/`mReportForm:draft`/`pcReportForm:draft` 단일 키 — 동일 브라우저 다중 사용자 시 draft 충돌 (사용자별 분리 미고려)
- [?] **ESLint 설정 미비**: `.eslintrc` 없음, `eslint` 미설치
- [?] **PC 제안/제보 상세 상단 카테고리 pills**: 코드에 tags row 존재 — Figma 재확인

---

## 📋 기획부 모바일 오류사항 재검수 (원본 `26.06.10_..._박환수.xlsx`, 재검수 2026-06-15)

> 리뉴얼 전 검수 13항목을 현행 코드로 재검증. 아래는 **여전히 유효한 것만**.

- [?] **#10 진단 지역 필터 결과 안 뜸**: `MDiagnosisList`/`MDiagnosisMap` 지역 필터는 코드상 연결됨(`진단지역===district || district_code===district`). 단 `checklist_result`의 district 값 불일치(NULL/부산역 다수)로 특정 구(예: 부산진구) 선택 시 결과가 거의 없음 → 데이터 정합 또는 매칭 로직 보완
- [?] **#12 모바일 AI가상시민 진입 경로 없음**: 하단 네비 5탭(잠금, AI가상시민 제외) + 모바일 홈에도 링크 없음 → `mAICitizen` 화면 접근 불가. 진입점 추가 여부 결정
- [?] **#2 설문 복사 동작 불일치**: `MSurveyDetail1`=정보 텍스트(제목/기간/내용) 복사 / `MSurveyDetail2`(참여 중)=URL 복사 → 두 경로가 다른 것을 복사. 일관성 정책 확인
- [?] **#15 진단 지역선택 탭 위치 UX**: 카테고리 선택 후 지역 선택 시 위치설정 탭이 목록 아래로 노출 — 실기기 재확인
- [?] **#9 제안 목록 '투표완료' 표기(개선)**: 상세 투표 stale은 수정됨(06-10). 목록 카드에서 이미 투표한 항목을 '투표완료'로 표기하는 건 미구현 — 개선 제안(선택)
- [ ] **#7 현재위치(geolocation) 실패**: "현위치를 가져올 수 없습니다" — 브라우저 geolocation은 HTTPS(또는 localhost)에서만 동작. 운영 `http://39.113.9.190:8501`는 평문 HTTP라 실패 → 배포 HTTPS 필요 (코드 외 인프라)

> ✅ **수정 완료(2026-06-15)**: #4 "불편 불편해요" 중복 — `MReportForm` '불편' 선택 시 접미사 `해요`/제목 `…에 불편해요`로 처리(옵션 보존). ktp1122로 접미사 `["에","해요"]` 검증
> ✅ 재검수상 **해결 확인(기록 제외)**: #1 홈 가로잘림(390px 오버플로 없음), #3/#8 댓글 전송버튼(정상 렌더), #5 제안 검색(필터 작동 확인), #6 지도 핀·숫자(정상 렌더), #9 상세 투표 stale(06-10 수정), #16 진단 사진필수 비활성(정상 동작), #13 나의활동 북마크(상단 "마이활동" `[?]`에 기재됨)

---

## ⏳ 정책·기획 결정 대기 (코드 작업 불가)

| 항목 | 파일 | 내용 |
|---|---|---|
| MReportDetail cat 태그 색상 | `MReportDetail.jsx` | Figma=노랑(#ffef8a), 리스트=청록(CAT_STYLES) — 현재 리스트 컬러 유지 |
| MProposalDetail cat 태그 색상 | `MProposalDetail.jsx` | variant마다 다름 — catStyles.js 재검증 |
| MReportDetail 단계바 클릭 | `MReportDetail.jsx` | "결과안내" 외 단계 클릭 가능 여부 |
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
| `848:20468` | 제보완료 | `MReportDone.jsx` |
