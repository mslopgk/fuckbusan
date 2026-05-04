# 부산 BDP — Figma 미일치 항목 리스트

> **갱신**: 2026-05-04 (2회차)
> **Figma 파일**: `jWpcqQv2jhb2mkzjEs1fuI`
> **목적**: 현재 코드와 Figma 디자인 간 미일치 항목 페이지별로 정리. 각 항목은 *현재 상태 → 기대 상태* 형식.

각 줄 앞 `[ ]` = 미완 / `[x]` = 완료 / `[?]` = 확인 필요 (Figma 더 봐야 함).

---

## 🟥 P0 — 제보·제안 (사용자가 "유독 많이 틀렸다"고 지적, 집중 비교 진행 중)

### 제보 리스트 (`MReportList.jsx`) — Figma `848:19157`
- [x] 위치 설정 모달: 그리드 → 세로 리스트 + chevron + 빨간 선택 + 하단 "선택" 버튼
- [x] 정렬 모달: 동일 패턴 (조회수/투표순/최신순)
- [x] 지역 헤더 큰 글씨 + 핑크 화살표 원
- [x] "지도보기" 핑크 알약 버튼 (우상단, 핀 아이콘)
- [x] 카테고리 칩 9개 (전체/주거/환경/교통/안전/교육/산업·일자리/문화·여가/보건·복지) 2줄 wrap
- [x] 정렬 드롭다운 (우측 정렬)
- [x] 상태 필터 (개선중/개선예정/개선완료) — 제보 전용
- [x] 카드: cat 태그 + sub 태그(시설물(거리/골목쓰레기통 등)) + 제목/작성자/하트·댓글 + 우측 이미지 썸네일
- [x] 제보하기 floating FAB (핑크 + 아이콘)
- [ ] 카드 좋아요 토글 인터랙션 (Figma `C4a_제보상세>좋아요` 보면 좋아요 상태 있음)

### 제보 지도 (`MReportMap.jsx`) — Figma `848:19015`
- [x] 위치/정렬 모달 (이번 라운드 추가)
- [x] 검색바 + 지도 뷰 + 바텀시트 패턴
- [x] 시트 collapsed 시 단일 카드 미리보기
- [x] 시트 expanded 시 다중 카드 + 정렬 + 단계 칩
- [x] 제보하기 FAB
- [x] 핀 클러스터 숫자 표시 (`12건` 등 배지) — `PCMapCanvas` `pin.count`로 지원
- [x] 검색바: 돋보기 아이콘 좌측 추가
- [ ] 핀 클릭 시 카드 미리보기 연동 (현재 정적)

### 제보 폼 (`MReportForm.jsx`) — Figma `848:18955`
- [x] 사진 등록 단일 카메라 버튼
- [x] 위치정보 알약 입력 + 크로스헤어 아이콘
- [x] 4개 카테고리 칩 (주거/환경/교통/안전) — **MProposalList.css 임포트로 칩 배경 복구**
- [x] "위치 ▼ 에" / "문제사항 ▼ 불편해요" select 행 — **셀렉트 폭 100%→60%, placeholder 회색**
- [x] 상세설명 input
- [x] 임시저장 / 작성완료 footer
- [x] 임시저장 → localStorage 저장 + 토스트
- [x] 임시저장 복원 모달 (문서 아이콘, 불러오기/새로작성하기)
- [ ] 위치 picker 화면 (지도로 위치 설정하기 버튼 클릭 시) — 현재 동작 안 함, 제안 폼에는 있음
- [ ] 사진 등록 다중 첨부 미지원 — Figma는 한 장만 보이지만 명세상 여러장 가능?

### 제보 상세 (`MReportDetail.jsx`) — Figma `848:19789`, `19843`(좋아요), `19897`/`20920`(결과)
- [x] 단계 라벨 `처리안내` → `결과안내`
- [x] 단계바 알약 + chevron-right 구분자
- [x] 댓글 입력 + 페이퍼플레인 전송 버튼
- [x] **개선 결과보기 모달**: `결과안내` 단계 활성 시 자동 노출 + `결과안내` pill 클릭으로 재호출
- [x] 좋아요 토글 (outline ↔ filled red, count 증감)
- [ ] cat 태그 색상: Figma 상세화면은 노랑(`주거`), 리스트화면은 청록 — 일관성 미정. 현재 청록 사용
- [ ] 본문 영역 (제목 아래 본문 텍스트가 Figma엔 "공원 쓰레기뚱이 안전조치가 필요해요" 형식 단일 문장만, 현재 코드도 단일 문장 OK)
- [ ] 이미지 hero가 Figma는 도시 풍경 placeholder, 현재 코드는 그라데이션 박스 placeholder
- [ ] 단계바: Figma는 "결과안내" active 시 모달 자동 표시. 다른 단계는 클릭 가능 여부 미정

### 제보 완료 (`MReportDone.jsx`) — Figma `848:20468`
- [x] Figma PNG 아이콘 (done_doc.png + done_check.png)
- [x] "제보 제출을 완료 하였습니다"
- [x] 나의 제보 보기 (핑크) / 다른 제보 보기 (연핑크)

### 제보 임시저장 화면 (`MReportForm` 재진입) — Figma `848:20159`
- [x] 폼 마운트 시 localStorage 검사 → 모달 자동 노출
- [x] 모달 디자인 일치

### 제안 리스트 (`MProposalList.jsx`) — Figma `848:17364`
- [x] 위치/정렬 모달 (이번 라운드)
- [x] 카테고리 9개 칩 wrap
- [x] 카드: cat 태그 + 제목 + 작성자 + ✓투표/💬댓글 + 우측 이미지
- [x] 제안하기 FAB (핑크 + 아이콘)
- [ ] cat 태그 sub-tag 미사용 (제보 리스트만 있음) — Figma 일치 OK
- [ ] 카드 클릭 시 detail 라우트 동작 (구현은 있음, 데이터 일관성 확인 필요)

### 제안 지도 (`MProposalMap.jsx`) — Figma `848:17890`
- [x] 위치/정렬 모달
- [x] 시트 패턴 (collapsed/expanded)
- [x] 제안하기 FAB
- [x] 핀 클러스터 숫자 (이번 라운드 PCMapCanvas count 지원)
- [x] 검색바 돋보기
- [x] 카드 stat 아이콘: 제안은 ✓체크인서클 / 제보는 ❤ — 일치 확인

### 제안 폼 (`MProposalForm.jsx`) — Figma `848:17301`
- [x] 8개 라디오 2-col 그리드 (주거/환경/교육/안전/산업및고용/교통/문화및레저/보건및복지)
- [x] 제목 input — **이번 라운드 풀-라운드 보더로 변경**
- [x] 자세한 설명 textarea — 동일
- [x] 위치정보 알약 + 크로스헤어
- [x] 첨부자료 + 버튼 (다중 사진/영상)
- [x] 임시저장/작성완료 footer
- [x] 임시저장 + 복원 모달
- [x] 위치 picker 오버레이 (지도+검색+선택완료)

### 제안 상세 (`MProposalDetail.jsx`) — Figma `848:17812~17849`, `848:18075`(전체)
- [x] 작성자 중복 표기 제거 (`동래구 우리디자이너` 단일)
- [x] 메타 행: `날짜·조회수` + `✓투표/💬댓글` 합치기 + 하단 구분선
- [x] 첨부 파일 칩 (`자전거 재고 불균형 제안 [hwp, 28KB]`)
- [x] 댓글 입력 + 페이퍼플레인
- [x] 투표하기 footer 버튼 (toggle)
- [ ] cat 태그 색상은 카테고리별 매핑 — Figma `제안상세1~4`마다 다른 cat 보여주는데 색상 매핑 검증 필요
- [ ] Figma `제안상세>전체` (`848:18075`) — 댓글 다수가 노출된 long 변형. 현재 댓글 더 보기 페이지네이션 없음
- [ ] 본문 bullet 렌더링: Figma는 빨간 ▸ 또는 점 스타일. 현재 `list-style: disc`. 디테일 검증
- [ ] 지도 미리보기 박스: Figma는 핀 + 작은 좌표 텍스트, 현재 핀만

### 제안 완료 (`MProposalDone.jsx`) — Figma `848:18712`
- [x] Figma PNG 아이콘 사용
- [x] 나의 제안 보기 / 다른 제안 보기 버튼

### 제안 불러오기 모달 (`MProposalForm` 재진입) — Figma `848:18277`
- [x] 세로 스택 + 문서 아이콘 + 불러오기(상단)/새로작성하기(하단) — 완료

### 위치 설정 모달 — Figma `848:17477`(제안), `848:19327`(제보)
- [x] 5개 컴포넌트 통합 (List/Map × 제보/제안/공통) — 완료

### 정렬 모달 — Figma `848:17589`(제안), `848:19455`(제보)
- [x] 옵션명: 최신순/인기순/댓글순 → 조회수/투표순/최신순
- [x] chevron + 선택+ 하단 버튼 패턴

---

## 🟧 P0 — 설문 (이전 라운드 작업, Figma 일치 확인)

> 참고: 이전 세션에서 진행도 sticky/녹색 라디오/응답시간 영역 채색 등 작업 완료. 일부 화면 재검증 필요.

### 설문 목록 (`MSurveyList.jsx`) — Figma `848:17092`
- [?] 카드 디자인 (회색 보더 알약 → 진행중 가운데 정렬) Figma 재비교 필요
- [?] 진행률 바: Figma 기준 색상/높이 검증

### 설문 상세1 (`MSurveyDetail1.jsx`) — Figma `848:16815`
- [x] 응답시간까지만 보라 채색 (hero-shrunk)
- [x] 카드 hero 박스 밖 overlap
- [x] 참여하기 버튼 작게
- [?] 보라 hero 그라디언트 / illust 일치 검증

### 설문 상세2 (`MSurveyDetail2.jsx`) — Figma `848:17185`
- [x] 위와 동일 패턴 적용
- [x] 녹색 라디오 (#06AB69)
- [?] 동의 라디오 라벨/순서

### 설문 참여 (`MSurveyJoin.jsx`) — Figma `848:17026`
- [x] 상단 sticky 진행도 + 부드러운 width 트랜지션
- [x] 미리 체크된 답변 제거 (`useState({})`)
- [?] Q1/Q2 체크박스 outline_blank vs check 차이 검증

### 설문 결과 (`MSurveyResults.jsx`) — Figma `848:16853`
- [?] 결과 차트 (도넛/막대) 종류 일치
- [?] 응답자 통계 표시

### 설문 완료 (`MSurveyDone.jsx`) — Figma `848:17129`
- [?] 완료 아이콘 / 메시지

---

## 🟨 P1 — 진단 (이전 세션 작업, Figma 비교 미수행)

진단 폴더 (`MDiagnosisList`, `MDiagnosisForm`, `MDiagnosisResult`, `MDiagnosisDone`) — Figma 노드 파악 + 비교 필요. 일반 진단(녹색 #06AB69) / 전문가 진단(보라) 변형 여부 확인.

- [?] `MDiagnosisList` — 진단 카드 디자인
- [?] `MDiagnosisForm` — 항목별 점수 입력 / 라디오 / 슬라이더?
- [?] `MDiagnosisResult` — 레이더/도넛 차트
- [?] `MDiagnosisDone` — 완료 페이지
- [?] 일반/전문가 분기

---

## 🟨 P1 — 마이활동

- [?] `MyPage.jsx` — Figma 마이페이지 헤더/메뉴
- [?] `MyActivity.jsx` / `MyActivityHub.jsx` — 활동 요약 카드
- [?] `MyReports.jsx` — 나의 제보 리스트 (이전 세션 완료, Figma 재검증)
- [?] `MyProposals.jsx` — 나의 제안 리스트

---

## 🟨 P1 — 홈 / 로그인 / 회원가입

- [?] `Home.jsx` 모바일 — Figma USER:MO 홈 노드 비교 (이전 작업했으나 차트/통계 섹션 미비)
- [?] `Login.jsx` — Figma 로그인 화면
- [?] `Signup.jsx` — Figma 회원가입 화면
- [?] PC 헤더/푸터

---

## 🟦 P2 — PC 전용 (USER:PC)

- [?] `PCProposeMap` / `PCProposeForm` / `PCProposeDetail` — Figma USER:PC 제안 노드 비교
- [?] `PCReportMap` / `PCReportForm` / `PCReportDetail`
- [?] `PCSurveyList` / `PCSurveyDetail` / `PCSurveyConsent` / `PCSurveyJoin` / `PCSurveyResults` / `PCSurveyDone`
- [?] `PCDiagnosisDetail` — 현재 CSS 파일 stub만 있음 (방금 빈 stub 생성으로 빌드만 통과)
- [?] PC 홈 (Figma `631:11640`)

---

## 🟦 P2 — Admin (ADMIN: PC)

별도 영역 — Figma의 12개 ADMIN 페이지와 비교. 이전 TODO에서 미구현 명시.

- [?] AI가상시민 현황 미연결
- [?] 공공디자인 현황 메가 대시보드 미구현
- [?] 진단정보 / 정책정보 / 공공데이터 / 디자인생태 페이지 미구현
- [?] 제보/제안 admin (`ReportManagement` / `ProposalManagement`) Figma 재검증
- [?] 설문정보 admin
- [?] 회원관리 admin

---

## 🚨 횡단 이슈

- [ ] **카테고리 색상 매핑 통일**: 리스트는 청록, 상세는 노랑 등 불일치. CAT_STYLES 토큰화
- [ ] **CAT 종류 통일**: 제보 카테고리 4개(주거/환경/교통/안전) vs 제안 카테고리 8개. 필터는 9개. 명세 명확화
- [ ] **stat 아이콘 통일**: 제안=✓체크인서클, 제보=❤ — 현재 일치하나 통일 가이드 문서화
- [ ] **위치 좌표 좌표값 노출**: `위도 35.1970, 경도 129.0630` 형식 — Figma는 placeholder만 보임. 실서비스에선 reverse-geocoded 주소가 적합
- [ ] **Kakao Map 키 / Map Provider** 검증 — `PCMapCanvas` 사용
- [ ] **모바일 하단 네비 active 컬러**: 제보=빨강, 제안=빨강, 진단=녹색 (Figma `diagnosis_design_tokens` 메모리 참조)
- [ ] **인증 가드된 페이지** 토큰 미발급 시 리다이렉트 — verify에서 `--token` 필요. 토큰 헬퍼 미구현
- [ ] **임시저장 다중 키**: 현재 `mProposalForm:draft` 단일 키. 사용자별 분리 미고려

---

## 🛠 횡단 인프라

- [ ] **`PCDiagnosisDetail.css` 비어있음** — 빌드만 통과시킨 stub. 실제 스타일 작성 필요
- [ ] **verify/routes.json 신규 view 미등록**: `mProposalForm`, `mProposalDone`, `mReportDone`, `mSurveyJoin` 등 자가검증 불가
- [ ] **dist/ 트래킹 잔재** — `dist/assets/*.css` 삭제됨 status. .gitignore 보강
- [ ] **3M+ 컴포넌트 lint 오류 미확인** — `npm run lint` 실행 + 수정

---

## ✅ 2026-05-04 라운드 완료

- **하단 네비 5탭 분리** (`MobileBottomNav`): `홈/설문/제보·제안/진단/나의활동` → `홈/설문/제보/제안/나의활동`. chooser 드롭다운 제거. 진단은 하단 네비에서 제외 (Figma 일치)
- **AdminMain 아이콘 lucide-react 제거**: 7개 카드 (회원관리/제보·제안/진단/설문/공공데이터/홍보/공지사항) 인라인 SVG로 교체
- **AdminSidebar / Management 페이지 라벨**: `제보목록/제안목록` → `제보/제안`
- **SurveyEditor Figma 일치화**: 우측 플로팅 툴바 (질문추가/질문가져오기/섹션추가/이미지/동영상), 편집 탭 질문 카드 상단 toolbar(복제/삭제/필수토글/더보기), 설정 탭 평면 form 레이아웃 (설문대상/나이선택/기간/상태/공개여부 4종), 하단 확인/저장 teal pill 버튼
- **MSurveyDetail1 hero 카드 오버랩 수정**: card margin -90px → -40px, hero padding-bottom 20px → 56px (타이틀 가려지던 버그 fix)
- **verify/routes.json**: `mSurveyList`, `mSurveyDetail1`, `mSurveyResults` 경로 추가

## 📋 다음 라운드 권장

1. 제보 상세 — **개선 결과보기 모달** 추가 (Figma `848:19897` / `20920`)
2. 제보 상세 — 좋아요 토글 (`848:19843`)
3. 핀 숫자 클러스터링 (`MReportMap`/`MProposalMap`)
4. 카테고리 색상 매핑 검증 (제안 detail 4개 변형 비교)
5. 진단 페이지 Figma 노드 파악 + 비교 시작
6. 마이활동 Figma 비교
7. 홈 화면 차트 섹션 보강

---

## 🗺️ Figma 노드 인덱스 (제보·제안만 우선 정리)

| Figma 노드 | 화면 | 컴포넌트 |
|---|---|---|
| `848:17364` | 제안 리스트 | `MProposalList.jsx` |
| `848:17890` | 제안 지도 | `MProposalMap.jsx` |
| `848:17301` | 제안하기01 | `MProposalForm.jsx` |
| `848:17812` | 제안상세1 | `MProposalDetail.jsx` |
| `848:17849` | 제안상세2 | (variant) |
| `848:17730` | 제안상세3 | (variant) |
| `848:17765` | 제안상세4 | (variant) |
| `848:18075` | 제안상세 전체 | (long variant) |
| `848:17477` | 제안 위치설정 | `MProposalForm` 오버레이 |
| `848:17589` | 제안 정렬선택 | `MProposalList`/`Map` 모달 |
| `848:18712` | 제안완료 | `MProposalDone.jsx` |
| `848:18277` | 제안 불러오기 | `MProposalForm` 모달 |
| `848:19015` | 제보 지도 | `MReportMap.jsx` |
| `848:19157` | 제보 리스트 | `MReportList.jsx` |
| `848:18955` | 제보하기01 | `MReportForm.jsx` |
| `848:19789` | 제보상세 | `MReportDetail.jsx` |
| `848:19843` | 제보상세>좋아요 | (variant, 미구현) |
| `848:19897` | 제보상세>제보결과 | (모달, 미구현) |
| `848:20920` | 제보상세>제보결과 | (variant) |
| `848:19327` | 제보 위치설정 | `MReportList`/`Map` 모달 |
| `848:19455` | 제보 정렬선택 | `MReportList`/`Map` 모달 |
| `848:20468` | 제보완료 | `MReportDone.jsx` |
| `848:20159` | 제보완료 임시저장 | `MReportForm` 모달 |
