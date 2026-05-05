# Figma vs 코드 미일치 항목 — 전체 페이지 감사

> **Figma 파일**: `TCuOzEqNhoLKjhF0reBDks` (제목 없음)
> **로컬**: `localhost:8501` (verify/screenshots 캡처 기준 — 2026-05-05)
> **작성일**: 2026-05-05
> **방법**: Figma `mcp__figma__get_screenshot` PNG 다운로드 → 로컬 캡처(verify/screenshots)와 1:1 시각 대조

## 🛠 진행 현황 (라이브 업데이트)

세션 진입 시점부터 처리한 항목 — 표 안에 ✅ 수정완료 마킹.

| 분류 | 항목 | 상태 |
|---|---|---|
| 모바일 진단 4.1 | 진단 핀 focus 빨간색 → 녹색 통일 | ✅ 수정완료 |
| 모바일 진단 4.3 | 구역별 세부정보 버튼 blue → purple | ✅ 수정완료 |
| 모바일 제안 2.3 | 폼 타이틀 마침표, 상세위치 input, 라디오 핑크채움+체크 | ✅ 수정완료 |
| 모바일 제보 1.3 | 카테고리 칩 4 → 8개 (PC와 통일) | ✅ 수정완료 |
| 모바일 제보 1.5 / 제안 2.5 | done 일러스트 (SVG-as-png 깂김) → 인라인 SVG | ✅ 수정완료 |
| Part 13.2 | 모바일 지도 핀 클릭 → 카드 연동 (selectedPinId state, 핀 클릭 시 collapsed sheet에 해당 카드만 노출) | ✅ 수정완료 |
| Part 13.1 | PC 진단 detail 시민/전문가 동시 노출 → mode prop 분기, 좌측 진단대상 탭(전체/시민/전문가)과 연동 | ✅ 수정완료 |
| Part 12.1 | 유니코드 이모지/글리프 → 인라인 SVG (PCMapCanvas, PCDiagnosisMap, PCProposeDetail, PCReportDetail, admin/ReportDetail, admin/AdminProposalDetail, admin/Login, admin/Signup — 11개 인스턴스) | ✅ 수정완료 |
| Part 13.16 | PC 헤더 비활성 메뉴 silent → "준비중인 기능입니다" 토스트 노출 | ✅ 수정완료 |

**🤔 의견 필요 (애매한 항목 — 사용자 결정 후 진행)**:

| # | 위치 | 쟁점 |
|---|---|---|
| A | 1.3 모바일 제보 폼 카테고리 | Figma=4 / 코드=8. 8개 유지 vs 4개로 축소 |
| B | 1.1 모바일 제보 리스트 sub-tag 색상 | Figma=단일 핑크 / 코드=카테고리별 색 |
| C | 2.3 모바일 제안 폼 위치 | Figma는 변형마다 다름. 방금 추가한 상세위치 input 유지 vs 제거 |
| D | 2.4 모바일 제안 상세 bullet | Figma=numbered+빨간▸ / 코드=disc |
| E | 2.4 모바일 제안 상세 투표 버튼 | outline vs filled |
| F | 4.3 모바일 진단 결과 레이아웃 | Figma=데이터 표+radar 4종 / 코드=카테고리 그리드+radar 1종 (큰 리팩) |
| G | 6.2/6.5 PC 폼 폭 | 좁게(~700) vs 풀폭 |
| H | 6.3/6.6 PC 상세 본문 | 본문 누락 — 백엔드 데이터 연결 큰 작업 |
| I | 0.2 PC 헤더 비활성 메뉴 표기 | 회색 disabled 유지 vs 정상 표시 |
| J | Part 12.2 lucide-react 12개 파일 | Sidebar 9개 카테고리 등 점진 치환 — 어디부터? |
| K | Part 13.11 핀 클러스터 클릭 → 줌인 | PCMapCanvas는 이미 구현, 모바일에 클러스터 자체 미구현 (TODO) |
| L | Part 13.4/5 비로그인 좋아요·투표 처리 | optimistic만 vs 로그인 모달 강제 |

각 항목 형식:
- **Figma**: 디자인 시안의 상태
- **현재 코드**: 로컬에서 보이는 상태
- **수정 필요**: 무엇을 어떻게 고쳐야 하는지

---

## 📋 인덱스

- [Part 0: 횡단 / 글로벌 (로고·헤더·네비)](#part-0--횡단--글로벌)
- [Part 1: 모바일 — 제보 (5 페이지)](#part-1--모바일--제보)
- [Part 2: 모바일 — 제안 (5 페이지)](#part-2--모바일--제안)
- [Part 3: 모바일 — 설문 (6 페이지)](#part-3--모바일--설문)
- [Part 4: 모바일 — 진단 (3 페이지)](#part-4--모바일--진단)
- [Part 5: 모바일 — 마이/홈/로그인](#part-5--모바일--마이홈로그인)
- [Part 6: PC — 제보·제안 (6 페이지)](#part-6--pc--제보제안)
- [Part 7: PC — 설문 (6 페이지)](#part-7--pc--설문)
- [Part 8: PC — 진단 (4 페이지)](#part-8--pc--진단)
- [Part 9: Admin (관리자)](#part-9--admin-관리자)
- [Part 10: 에셋·로고·아이콘 감사](#part-10--에셋로고아이콘-감사)
- [Part 11: Figma 프레임 ↔ 코드 매핑](#part-11--figma-프레임--코드-매핑)
- [Part 12: 🆘 아이콘·벡터 시스템 결함 (사용자 지적)](#part-12--아이콘벡터-시스템-결함-사용자-명시-지적)
- [Part 13: 🆘 인터랙티브 요소 결함 (사용자 지적)](#part-13--인터랙티브-요소-결함-사용자-명시-지적)

---

## Part 0 — 횡단 / 글로벌

### 0.1 헤더 로고

- **Figma**: PC/Admin 모든 화면에서 좌상단 로고가 `PDDP(가안)` 워드마크 (어두운 색 텍스트)
- **현재 코드**: 좌상단 로고가 `WDC.svg` 워드마크 (청록색)
- **수정 필요**: ✅ **그대로 유지**. 사용자 지시 + 메모리(`header_logo_wdc`) 명확: PDDP는 outdated 가안이며, 코드의 WDC가 정답.
- **작용 파일**: `src/components/PCHeader.jsx:54`, `src/components/Home.jsx:43,68`, `src/components/UserPCLayout.jsx:35`, `src/admin/components/AdminSidebar.jsx:130`, `src/admin/pages/ExpertEdit.jsx:86`, `src/admin/pages/ProposalEdit.jsx:94`

### 0.2 PC 헤더 네비 — 비활성 메뉴 표기

- **Figma**: `설문 / 제보·제안 / 진단 / AI가상시민 / 공공데이터` 5개 모두 동일 텍스트 (활성 시 청록 underline 또는 색 변화)
- **현재 코드**: `AI가상시민 / 공공데이터`가 회색(disabled) 처리되어 있고 cursor:not-allowed
- **수정 필요**: 페이지가 미구현이라 비활성화는 합리적이나, **Figma는 비활성 표시가 없음**. 정책 결정 필요 — (a) Figma처럼 활성 보이고 클릭 시 "준비중" 토스트, (b) 현재처럼 disabled로 회색 처리.

### 0.3 모바일 하단 네비 — 화면별 변형

- **Figma**: 제보·제안·설문·홈·마이 5탭 (`홈/설문/제보/제안/나의활동`) — 일반 화면.
  진단 화면에서는 4탭 (`홈/설문/제보·제안/진단/나의활동`) — **제보+제안 합치고 진단 추가**.
- **현재 코드**: 동일하게 화면별로 두 변형 사용 중.
- **수정 필요**: 일치 OK. 다만 `MDiagnosisList` 캡처 보면 진단 슬롯이 녹색(#06AB69) 강조 — Figma도 녹색이라 일치.

### 0.4 메인 컬러 토큰

- **Figma**:
  - 제보·제안 = 핑크 `#E6235A`
  - 설문 = 보라 `#5B2EAB`
  - 진단(일반) = 청록/녹색 `#06AB69`
- **현재 코드**: 동일 ✅. 단 PC 진단 페이지의 헤더 active 컬러가 `진단 = 검정`으로 보이는 케이스 발견 (Part 8 참조).

---

## Part 1 — 모바일 — 제보

### 1.1 제보 리스트 (`MReportList.jsx`) — Figma `0:12290`

비교 캡처: Figma `/tmp/figma-compare-2026/mobile/mo_report_list.png` vs `verify/screenshots/mReportList.png`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 지역 헤더 | `수영구` (특정 시군구) + 핑크 화살표 원 | `부산전체` + 핑크 화살표 원 | 데이터 차이. `수영구` 같은 디폴트 구가 필요한지 정책 결정 |
| 2 | 카드 sub-tag 색상 | **모든 sub-tag가 단일 핑크 `#FCDAE3`** (`시설물(거리/골목쓰레기통 등)` 등) | sub-tag가 카테고리별 다양 색 (보라 학교시설, 보라 의료시설, 보라 버스정류장 등) | sub-tag 컬러를 단일 연핑크로 통일하거나, Figma의 `시설물(...)` 단일 라벨 패턴 도입 |
| 3 | 카드 우측 이미지 | **모든 카드에 이미지 썸네일** (도로/신호등/항만 등) | 일부 카드만 이미지, 나머지는 비어있음 | 이미지 fallback placeholder 또는 더미 데이터 모두 이미지 채우기 |
| 4 | 카드 카운트 행 | 작성자 행과 같은 줄에 우측 ❤12 💬12 (오른쪽 정렬) | 작성자 행 아래 별도 줄에 작은 카운트 | 카운트를 작성자 행과 같은 줄로 이동 (justify-between 패턴) |
| 5 | 카드 제목 두께/크기 | 제목 굵음 (font-weight 600~700, 16px) | 비교적 가늘고 작음 (15px) | 타이틀 강조 |
| 6 | 카테고리 칩 순서 | `전체/주거/환경/교통/안전/교육/산업·일자리/문화·여가/보건·복지` (2줄 wrap) | 동일 순서 (2줄 wrap) | ✅ 일치 |
| 7 | 정렬 드롭다운 | `최신순 ▼` 우측 | 동일 | ✅ 일치 |
| 8 | 상태 필터 | `개선중/개선예정/개선완료` 3개 알약 | 동일 | ✅ 일치 |
| 9 | FAB | `+ 제보하기` 핑크 알약 우하단 | 동일 | ✅ 일치 |
| 10 | 데이터 양 | 4-5개 카드 노출 후 그라데이션 fade | 더미 데이터 매우 많이 (스크롤 길게) | mock seed 줄이기 또는 페이지네이션 |
| 11 | 하단 네비 | 5탭 `홈/설문/제보/제안/나의활동` (제보 active 핑크) | 동일 | ✅ 일치 |

### 1.2 제보 지도 (`MReportMap.jsx`) — Figma `0:12148`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 검색바 | 좌상단 작은 알약 `전체 ▼` (지역 필터 셀렉트) | 풀폭 검색바 + 돋보기 + `검색` placeholder | Figma처럼 컴팩트한 셀렉트 알약으로 변경 (또는 검색 + 셀렉트 두 패턴 결정) |
| 2 | **지도 핀** | **빨간 teardrop 핀** + **숫자 배지 핀** (`12` 등 클러스터 카운트) | 빨간 teardrop만, 숫자 배지 없음 | `PCMapCanvas`의 `pin.count` 옵션 사용해서 클러스터 숫자 배지 출력 — TODO.md에도 기록되어 있던 항목 |
| 3 | 시트 헤더 | `부산전체 ▼ ☰` (지역 + 햄버거 정렬?) | `부산전체 ▼` + 카드 카운트 | 우측 햄버거(또는 정렬) 아이콘 추가 |
| 4 | 시트 collapsed | **단일 카드 미리보기** (sub-tag 핑크 + 이미지) | 카드 2-3개 보이고 빈 카드 | 시트 collapsed 시 1개만 노출, 카드 디자인 list와 통일 |
| 5 | FAB 위치 | 시트 안 카드 우측 | 시트 외부 우하단 | (현 위치 유지가 더 모던. Figma 구버전일 수 있음) |
| 6 | 카테고리 칩 | 시트 안 9개 wrap | 시트 안 9개 wrap (가로 스크롤?) | wrap으로 동일 표시 |

### 1.3 제보 폼 (`MReportForm.jsx`) — Figma `0:12713`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | **카테고리 칩 개수** | **4개** (주거/환경/교통/안전) — 1줄 | **8개** (주거/환경/교통/안전/교육/산업·일자리/문화·여가/보건·복지) — 2줄 wrap | Figma는 4개만. 사용자 정책: 제보=4개로 줄일지, 코드처럼 8개 유지할지 결정 필요. (**일관성**: 리스트 필터는 9개 — 모순) |
| 2 | 카메라 박스 | 둥근 모서리, 작은 박스 (1열) | 동일 디자인, 보더 색 약간 다름 | 미세 차이만 |
| 3 | 위치정보 알약 | placeholder + 우측 크로스헤어 아이콘 | 동일 | ✅ 일치 |
| 4 | 위치/문제사항 셀렉트 | `위치 ▼ 에` / `문제사항 ▼ 불편해요` 행 (셀렉트 폭 60% + 라벨) | 동일 | ✅ 일치 |
| 5 | 상세설명 input | 단일 input 행 | 동일 | ✅ 일치 |
| 6 | Footer | `임시저장`(회색) + `작성완료`(활성 핑크) 2버튼, 둘 다 큰 알약 | 동일 (비활성 시 light pink) | ✅ 일치. 활성/비활성 토큰 일치 검증 |

### 1.4 제보 상세 (`MReportDetail.jsx`) — Figma `0:1328`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | **헤더 라벨** | `< 동래구 > [주거] [골목쓰레기]` (구 + cat 태그 + sub-tag) | `<` 만 (라벨 없음) | 헤더에 구/cat/sub 태그 추가 |
| 2 | 작성자 줄 | `동래구 우리디자이너` 굵게 + meta `동래구 수안동 · 2026.03.13` | 작성자 자체가 안 보임 (hero placeholder 위에만 있을 수 있음) | 작성자 + 동/날짜 메타 행 추가 |
| 3 | **본문 텍스트** | `공원 쓰레기통이 안전조치가 필요해요` + 추가 설명 단락 | 본문 자체가 안 보임 (그라데이션 hero 박스 + 지도만) | **본문 노출 누락 — 가장 큰 차이**. ProposalDetail의 본문 영역 패턴 차용 필요 |
| 4 | **Hero 이미지** | **도로/도시 풍경 사진** (실제 photo) | 그라데이션 placeholder (보라→오렌지) | 실제 이미지 또는 의미있는 placeholder. (제보는 사진 없을 수도 있어서 fallback 결정) |
| 5 | 메타 카운트 | `2026.01.02 · 조회수 333` + 우측 `❤12 💬12` 같은 줄 | `· 조회수 0` + `❤0 💬0` (데이터 빔) | mock seed 강화 |
| 6 | 댓글 섹션 | 본문 아래 댓글 1-2개 미리보기 + 입력란 | 입력란만 (댓글 미리보기 없음) | 댓글 리스트 미리보기 (최근 2-3개) 추가 |
| 7 | 단계바 | `접수 > 검토중 > 검토완료 > 결과안내` chevron 알약 | 동일 | ✅ 일치 |
| 8 | 단계바 active 컬러 | 활성 알약 핑크 채움, 비활성 회색 outline | 동일 | ✅ 일치 |
| 9 | 결과안내 모달 | 단계 = `결과안내` 시 자동 노출 (Figma `0:1438`) | 코드 구현됨 (TODO.md 완료 마크) | ✅ 일치 |
| 10 | 좋아요 토글 | outline ↔ filled red, count +1 (Figma `0:1381`) | 코드 구현됨 | ✅ 일치 |

### 1.5 제보 완료 (`MReportDone.jsx`) — Figma `0:13324`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 일러스트 | 종이 + 핑크 ✓ 원 (PNG 아이콘) | 동일 PNG 사용 | ✅ 일치 |
| 2 | 일러스트 위치 | 화면 중앙 살짝 위쪽 | 좀 더 아래쪽 (40% top 정도) | 일러스트 vertical center 위로 살짝 |
| 3 | 헤드라인 | `제보 제출을 완료 하였습니다` (2줄) | 동일 | ✅ 일치 |
| 4 | 버튼 2개 | `나의 제보 보기`(핑크 채움) + `다른 제보 보기`(연핑크 채움) | 동일 | ✅ 일치 |

---

## Part 2 — 모바일 — 제안

### 2.1 제안 리스트 (`MProposalList.jsx`) — Figma `0:11429`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 지역 헤더 | `부산전체 ▶` | 동일 | ✅ 일치 |
| 2 | 카테고리 칩 | 9개 wrap (전체 active 핑크) | 9개 wrap | ✅ 일치 |
| 3 | 카드 stat | ✓체크 in circle + 💬댓글 (제보는 ❤) | 동일 ✓ + 💬 | ✅ 일치 |
| 4 | 카드 cat 색상 | Figma는 `주거`(청록) `환경`(녹색) `교육`(핑크) — 카테고리별 컬러 매핑 | 동일 매핑 (`catStyles.js`) | ✅ 일치 |
| 5 | 카드 우측 이미지 | 첫 카드만 이미지, 나머지 텍스트 only | 동일 (랜덤하게 일부) | ✅ 일치 |
| 6 | **데이터 양** | 3-4개만 노출 | 매우 많은 더미 (스크롤 매우 길어짐) | mock seed 줄이기 (UX 저해) |
| 7 | FAB | `+ 제안하기` 핑크 알약 | 동일 | ✅ 일치 |
| 8 | 하단 네비 | 5탭 (제안 active 핑크) | 동일 | ✅ 일치 |

### 2.2 제안 지도 (`MProposalMap.jsx`) — Figma `0:11757`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 검색바 | 좌상단 작은 알약 `검색` (placeholder) | 풀폭 검색바 + 돋보기 (좌측) | Figma처럼 작은 알약으로 변경 — 동일 결정 (1.2와 같은 패턴) |
| 2 | **지도 핀** | 빨간 teardrop + 숫자 배지 (`12`, `12` 등 클러스터) | 빨간 teardrop만, 숫자 없음 | `pin.count`로 클러스터 숫자 노출 (TODO 기록 항목) |
| 3 | 시트 헤더 | `부산전체 ▼` + `☰` 우측 | `부산전체 ▼` + 카드 카운트 | 우측 햄버거/정렬 아이콘 추가 |
| 4 | 시트 collapsed | 단일 카드 미리보기 (sub-tag 핑크 + 이미지) | 카드 2-3개 (제목 자르기) | 1개만 노출 |
| 5 | 카테고리 칩 | 시트 안 9개 wrap | 동일 | ✅ 일치 |
| 6 | FAB | 시트 위 `+ 제안하기` | 동일 | ✅ 일치 |

### 2.3 제안 폼 (`MProposalForm.jsx`) — Figma `0:13561`(전체) / `0:11900`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | **라디오 디자인** | **회색 채워진 작은 동그라미** (filled gray dot) | **outline 라디오** (border만) | 라디오 스타일 통일 — Figma의 filled gray로 변경 |
| 2 | 카테고리 8개 | 2-col 그리드 (주거/환경/교육/안전/산업및고용/교통/문화및레저/보건및복지) | 동일 8개 | ✅ 일치 |
| 3 | 카테고리 라벨 | `산업 및 고용`, `문화 및 레저`, `보건 및 복지` (Figma) | `산업 및 고용`, `문화 및 레저`, `보건 및 복지` (코드 동일) | ✅ 일치 |
| 4 | 제목 input | 풀라운드 알약 보더 + placeholder | 동일 | ✅ 일치 |
| 5 | 자세한 설명 textarea | 라운드 사각, 4줄 정도 | 동일 | ✅ 일치 |
| 6 | 위치정보 | 알약 + 우측 크로스헤어 (단일 행) | 알약 + 크로스헤어 + **추가로 상세주소 input 1줄** | Figma는 상세주소 행 없음. 코드에서 `상세 위치` input은 PC 패턴이며 모바일 Figma 미일치. 모바일에선 단일 알약으로 통일 |
| 7 | 첨부자료 | `+` 박스 + `* 사진 또는 동영상 첨부해주세요` 캡션 | 동일 | ✅ 일치 |
| 8 | Footer | `임시저장`(작은 회색) + `작성완료`(큰 핑크 알약 - 비활성 시 연핑크) | **footer가 sticky로 본문 일부 가림** | footer를 본문 끝으로 옮기거나 컨텐츠에 padding-bottom 충분히 |

### 2.4 제안 상세 (`MProposalDetail.jsx`) — Figma `0:12032` (variant 1~4)

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `<` + cat 태그 (`주거` 청록) | 동일 | ✅ 일치 |
| 2 | 제목 | `전기자전거 재고 불균형 해결 제안` | 동일 | ✅ 일치 |
| 3 | 작성자 | `동래구 우리디자이너` | 동일 | ✅ 일치 |
| 4 | 본문 단락 | `안녕하세요. 부산 해운대구에 거주하는 학생입니다. ...` 평문 + bullet 3개 | 동일 본문 + bullet | ✅ 일치 |
| 5 | **bullet 스타일** | **숫자 1./2./3.** + 들여쓰기 + 빨간 ▸ sub-bullet | 단순 disc bullet | bullet → numbered list로 변경 (또는 Figma 일치하게) |
| 6 | **Hero 이미지** | **자전거 사진** (실사) | 그라데이션 placeholder (보라→오렌지) | 더미 이미지 또는 placeholder 디자인 개선 |
| 7 | 첨부 파일 | `자전거 재고 불균형 제안 [hwp, 28KB]` 칩 (TODO에는 완료 표시이나 캡처에 안 보임) | 칩이 안 보임 | 첨부 칩 노출 확인 |
| 8 | 위치 박스 | 작은 카카오맵 핀 + 좌표 텍스트 | 큰 카카오맵 (스크롤 인터랙티브) | 정적 mini-map preview로 변경 (탭 시 확대) |
| 9 | 댓글 영역 | Figma 캡처에는 안 보이지만 footer 위 댓글 입력 | 댓글 입력 + 페이퍼플레인 + 댓글 0건 | ✅ 일치 |
| 10 | **Footer 버튼** | **outline 핑크 `투표하기`** | filled 핑크 `투표하기` | outline ↔ filled 결정 |

### 2.5 제안 완료 (`MProposalDone.jsx`) — Figma `0:14109`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 일러스트 + 헤드라인 | 종이 + ✓ + `제안 제출을 완료 하였습니다` | 동일 | ✅ 일치 |
| 2 | 버튼 2개 | `나의 제안 보기`(핑크) + `다른 제안 보기`(연핑크) | 동일 | ✅ 일치 |

---

## Part 3 — 모바일 — 설문

### 3.1 설문 목록 (`MSurveyList.jsx`) — Figma `0:11392`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `< 홈으로` | 동일 | ✅ 일치 |
| 2 | 탭 | `진행중인 설문`(보라 active) / `설문결과`(회색 outline) | 동일 | ✅ 일치 |
| 3 | 카드 | `소비자 인식 조사` 제목 + `응답시간 : 10분` + `조사기간 : ~2026-12-06` + 우측 보라 ▶ 원 | 동일 — `공공디자인 만족도 조사`/`소비자 인식 조사`/`사직구장 일대 보행환경 현황 조사` 3종 | ✅ 일치 (실데이터) |
| 4 | 우측 ▶ 원 컬러 | 보라 (`#5B2EAB`) | 동일 | ✅ 일치 |
| 5 | 하단 네비 | 5탭 (설문 active 보라) | 동일 | ✅ 일치 |

### 3.2 설문 상세1 (`MSurveyDetail1.jsx`) — Figma `0:11251`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `<` 좌상단 + `📑 복사하기` 우상단 알약 | 동일 | ✅ 일치 |
| 2 | Hero 보라 영역 | 보라 그라디언트 + 가운데 흰 제목 (`사직구장 일대 보행환경의 현황 조사`) | 동일 | ✅ 일치 |
| 3 | 정보 카드 | `조사명/조사기간/응답시간/내용` 4개 행, 흰 카드 hero 위로 overlap | 동일 (TODO에 overlap 수정 완료) | ✅ 일치 |
| 4 | 약관 bullet | `✓` + `설문 조사는 응답을 중단하더라도, 언제든 이어서 참여할 수 있습니다.` 등 2개 | 동일 | ✅ 일치 |
| 5 | 약관 링크 | `이용약관 및 개인정보처리방침` underline | 동일 | ✅ 일치 |
| 6 | `참여하기` 버튼 | 보라 알약 큰 버튼 (가운데 정렬) | 동일 | ✅ 일치 |
| 7 | **본문 줄 간격** | 응답시간 행과 내용 행이 동일 줄간격 | 코드는 약간 더 좁음 | 미세 차이 무시 |

### 3.3 설문 상세2 (`MSurveyDetail2.jsx`) — Figma `0:11289`

- **Figma**: 개인정보 수집·이용 안내 + 동의/비동의 라디오 + 작성자 기본정보 (성별/연령/이용기기/직업/성명/휴대폰번호) + 보라 `참여하기` footer.
- **현재 코드**: 상세 폼 동일 패턴 — Code 라우트 `mSurveyDetail2`는 verify routes에 미등록이어서 직접 캡처 미수집 (verify/routes.json 보강 필요).
- **수정 필요**: `verify/routes.json`에 `mSurveyDetail2` 등록 후 1:1 비교 재실행.

### 3.4 설문 참여 (`MSurveyJoin.jsx`) — Figma `0:11000`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 상단 sticky | `< 설문조사` + 진행도 바 (보라 부분 채움) | 동일 | ✅ 일치 |
| 2 | Q1 라디오/체크 | `없다/있다` 사각 체크박스. **있다 = 보라 채움 + 흰 ✓** | 동일 | ✅ 일치 |
| 3 | Q2 슬라이더 | 5단계 slider (전혀 아니다/보통/매우 그렇다 등 라벨 3개) — 보라 dot active | 동일 | ✅ 일치 |
| 4 | Q3 슬라이더 | 동일 패턴, dot 위치만 다름 | 동일 | ✅ 일치 |
| 5 | Q4 다중 체크 | `보행로 확장` 등 5개, 보라 채움 체크 = 선택 | 동일 (보행로 확장/차량 통제 및 동선 분리 active) | ✅ 일치 |
| 6 | Q5 textarea | `예: 야간 조명이 어두워...` placeholder + `0/1300` 우하단 카운터 | 동일 | ✅ 일치 |
| 7 | Footer | `이전`(흰 outline) + `다음`(보라 채움) 2버튼 | 동일 | ✅ 일치 |

### 3.5 설문 결과 (`MSurveyResults.jsx`) — Figma `0:11066`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | Hero 보라 | 보라 그라디언트 + `2026년, 사직구장 일대 보행환경 결과는?` 흰 제목 | 동일 | ✅ 일치 |
| 2 | 기간 알약 | `2026.03.16 ~ 2026.04.05` 연한 보라 알약 + 우측 `👤 12,453` | 동일 | ✅ 일치 |
| 3 | 종합결과 — RadarChart | 6각형 radar (`접근성/심미성/포용성/이동성/안전성/정보제공성`), 흐린 보라 폴리곤 + 점수 라벨 | 동일 (recharts) | ✅ 일치 |
| 4 | 종합결과 `자세히보기 ▶` 버튼 | radar 아래 회색 outline 알약 | 동일 | ✅ 일치 |
| 5 | Q1 도넛 | 노랑/보라/연보라 (조금만족/매우만족/보통/불만족 4구간) + 우측 라벨 | 동일 | ✅ 일치 |
| 6 | Q1 가로 막대 | 4개 막대 + 우측 % | 동일 | ✅ 일치 |
| 7 | Q1 버블 차트 | 녹색/보라/핑크 원형 % 라벨 (야간조명 32% / 브레이크 27% / 안내 18% 등) | 동일 | ✅ 일치 |
| 8 | Q1 세로 막대 | 5개 보라 막대 + 위 숫자 | 동일 | ✅ 일치 |

### 3.6 설문 완료 (`MSurveyDone.jsx`) — Figma `0:11239`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 아이콘 | 보라 ✓ 원 (작은 사이즈) | 동일 | ✅ 일치 |
| 2 | 헤드라인 | `설문 제출 완료` 보라 큰 글씨 | 동일 | ✅ 일치 |
| 3 | 서브헤드 | `참여해 주셔서 감사합니다` 굵게 | 동일 | ✅ 일치 |
| 4 | 본문 | `귀하의 의견은 지역 개선을 위한 자료로 활용됩니다. ...` 회색 작은 글 | 동일 | ✅ 일치 |
| 5 | Footer | 보라 채움 `홈으로 이동` 큰 알약 (풀폭) | 동일 | ✅ 일치 |

---

## Part 4 — 모바일 — 진단

### 4.1 진단 목록 (`MDiagnosisList.jsx`) — Figma `0:14270`(목록1) `0:14419`(목록2) `0:14575`(목록3)

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `< 일반 진단` + 우측 ⓘ 작은 아이콘 | 동일 (`< 일반 진단` + 작은 ⓘ) | ✅ 일치 |
| 2 | 지역 셀렉트 | `부산진구 ▼` 알약 (좌상단) | 동일 | ✅ 일치 |
| 3 | **지도 핀** | **녹색 teardrop 핀 + 숫자 배지** (`12`, `1` 등 클러스터) | 녹색 teardrop, 숫자 배지 1개만 (`1`) | 클러스터 카운트 다중 노출 — `pin.count` 활용 (TODO 기록) |
| 4 | 카테고리 칩 | 9개 wrap (전체/주거/환경/교통/안전/교육/산업·일자리/문화·여가/보건·복지) | 동일 (산업·일자리 active 녹색) | ✅ 일치 |
| 5 | 시트 collapsed 카드 | sub-tag 핑크 (`시설물(거리/골목쓰레기통 등)`) + 이미지 + `+ 진단하기` 녹색 FAB | sub-tag (`동학교`) + cat 청록 + 이미지 없음 + `+ 진단하기` 녹색 FAB | sub-tag 색상/라벨 정합, 이미지 채우기 |
| 6 | 카드 stat | ❤ + 👁 view 아이콘 | 동일 | ✅ 일치 |
| 7 | 진단하기 FAB | 녹색 (#06AB69) `+ 진단하기` | 동일 | ✅ 일치 |
| 8 | 하단 네비 | 4탭 (`홈/설문/제보·제안/진단/나의활동`, 진단 active 녹색) | 동일 (5탭처럼 `제보·제안 진단` 슬롯, 진단 녹색) | ✅ 일치 |

### 4.2 진단 폼 (`MDiagnosisForm.jsx`) — Figma `0:14163`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `< 홈으로` | 동일 | ✅ 일치 |
| 2 | 제목 | `우리동네 개선 아이디어를 진단해보세요.` (2줄) | 동일 | ✅ 일치 |
| 3 | 사진등록 | `+` 박스 + `* 사진을 첨부해주세요` 캡션 | 동일 | ✅ 일치 |
| 4 | **분류 셀렉트** | **placeholder만 (`주거`)** + 그 아래 sub-tag 알약 2개 (`주거1` `주거2`) | 셀렉트 `주거 ▼` + sub-tag 2개 동일 | ✅ 일치 |
| 5 | 만족도 평가 — 단계 | 4문항, 각각 **3-step 슬라이더** (😞 / 😐 / 😄) | 동일 3-step | ✅ 일치 (TODO에 5-step vs 3-step 의문 있었으나 Figma는 3-step) |
| 6 | 만족도 점 컬러 | dot 회색, 슬라이더 회색 | 동일 | ✅ 일치 |
| 7 | 리뷰 textarea | `추가 의견을 입력해 주세요.` | 동일 | ✅ 일치 |
| 8 | Footer | `임시저장`(회색) + `작성완료`(녹색 채움 #06AB69) | 동일 — 단 footer가 sticky라 본문 일부 가림 | 본문 padding-bottom 추가 |

### 4.3 진단 결과 — 시민 (`MDiagnosisResult.jsx`) — Figma `0:14779`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 위치/사진/진단일/대분류/중분류 행 | 진단 정보 7행 테이블 (위치/사진/진단일/대분류/중분류) | 코드는 다른 레이아웃: 카테고리 9칩 (전체/주거/환경/...) + 사진 placeholder | **레이아웃 다름**. Figma는 데이터 표 형식, 코드는 카테고리 그리드 형식 |
| 2 | **전체 평균 RadarChart** | 6각형 radar (접근성/심미성/포용성/이동성/안전성/정보제공성) + 점수 + `1.87 전체 평균 (36)` | 동일 6각형 radar `79.40 전체 평균 (15)` (점수 스케일 다름) | 점수 스케일 통일 (Figma 0-3 / 코드 0-100?) |
| 3 | 시설물별 radar | 보라 폴리곤 radar `2.3` 평균 | 코드는 미구현 (생략) | 시설물별/구역별/인원별 3개 radar 추가 |
| 4 | 구역별 radar | 파란 폴리곤 | 코드 미구현 | 추가 |
| 5 | 인원별 radar | 녹색 폴리곤 | 코드 미구현 | 추가 |
| 6 | 좋아요/댓글 카운트 | `❤13 💬2` 행 | 동일 패턴 (단 코드는 위쪽 헤더 영역 우측에) | ✅ 일치 |
| 7 | 댓글 미리보기 | 2개 댓글 + 작성자/날짜/휴지통 | 미구현 | 댓글 미리보기 섹션 추가 |
| 8 | **관련 시민 제안 섹션** | **Figma에 없음** | 코드에 있음 (3개 카드 + `세부 정보도 확인해 보세요` heading + 시설물별/구역별/인원별 보라 outline 알약 3개) | TODO에 의도/제거 결정 — Figma에 없으니 제거하거나 정책 문서화 |

### 4.4 진단 결과 — 전문가 (`0:14995`) — 코드 미구현

- **Figma**: 시민 진단정보와 유사하나 추가 행 (5개 더): `평가1~5` 별도 항목 + 추가 그래프
- **현재 코드**: 전문가 분기 미구현 (`ExpertDiagnosisResult.jsx`는 빈 stub 또는 미사용)
- **수정 필요**: 전문가/일반 분기 정책 결정. Figma 따라 추가 metrics 구현하거나, MVP에서 일반만 노출.

### 4.5 진단 완료 (`MDiagnosisDone.jsx`) — Figma `0:13324` (보고된 노드는 `941:12733` 기준 매핑 — 신규 파일에선 미식별)

- TODO에서 "완벽 일치" 보고됨 — verify 캡처 OK
- 신규 Figma 파일에서 진단 완료 화면 별도 노드 없음 (또는 `MO/USER: 진단하기` 안의 sub-state)

---

## Part 5 — 모바일 — 마이/홈/로그인

### 5.1 홈 (`Home.jsx`)

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `WDC` 청록 로고 좌상단 + `로그인 / 회원가입` 우상단 | 동일 | ✅ 일치 |
| 2 | Hero 텍스트 | `시민과 기술이 함께 만드는 더 나은 부산` | 동일 | ✅ 일치 |
| 3 | Hero subtitle | `시민의 목소리와 지능형 기술로...` | 동일 | ✅ 일치 |
| 4 | 부산지도 일러스트 | 부산 17구 일러스트 + 지역 라벨 | 동일 | ✅ 일치 |
| 5 | 4개 카드 그리드 | `제보하기/제안하기/나의 활동/진단하기` 2x2 그리드, 각각 색상 (`핑크/청록/핑크/녹색`) | 동일 | ✅ 일치 |
| 6 | 차트/통계 섹션 | Figma 신규 파일에 통계 섹션 노드 없음 | 코드는 hard-disable (`{false && ...}`, TODO 참조) | 정책 결정 (Figma에 없으면 제거 OK) |
| 7 | 하단 네비 | 5탭 | 동일 | ✅ 일치 |

### 5.2 로그인 (`Login.jsx`)

- **Figma**: 신규 파일에서 모바일 로그인 노드 별도 식별 안됨
- **현재 코드**: `verify/screenshots/login.png` 청록 배경 + `Login` 제목 + 아이디/비밀번호/`로그인` 버튼
- **수정 필요**: Figma에 모바일 로그인 노드 추가되면 재비교. 현 디자인은 admin 로그인과 동일 패턴이라 일관성 OK.

### 5.3 회원가입 (`Signup.jsx`)

- **Figma**: 신규 파일에 모바일 회원가입 노드 별도 식별 안됨
- **현재 코드**: `verify/screenshots/signup.png` 청록 배경 + 입력 폼
- **수정 필요**: Figma 노드 식별 후 재비교.

### 5.4 나의 제보 — Z2C (`MyReports.jsx`) — Figma `0:2543`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `<` 좌상단 | 동일 | ✅ 일치 |
| 2 | 탭 | `나의 제보글`(핑크 active) / `좋아요 제보글`(회색 outline) | 동일 | ✅ 일치 |
| 3 | 상태 chips | `접수 / 검토중 / 검토완료` (검토중 핑크 active) | 동일 (단 TODO에 따라 `결과안내`→`검토완료` 라벨 변경 완료) | ✅ 일치 |
| 4 | 카드 cat 색상 | **3개 태그 행** `[동래구][주거][거리]` (모두 노랑/연핑크 톤) | 동일 매핑 (`MY_CAT_STYLES`) | ✅ 일치 |
| 5 | 카드 stat | `❤12 💬12` 작성자 옆 | 동일 | ✅ 일치 |
| 6 | FAB | `+ 제보하기` 핑크 | 동일 (target `mReportMap`) | ✅ 일치 |
| 7 | 하단 네비 | 4탭 (`홈/제보/제안/나의활동`) — Figma는 4탭 | 5탭 (설문 추가) | TODO에 의도된 차이로 기록됨. 코드가 최신 |

### 5.5 나의 제보 상세 — Z3c (`MMyReportDetail.jsx`) — Figma `0:2756`

- TODO 기록 완료. verify 캡처 OK.
- 차이: Figma의 삭제확인 모달(`0:2798`) vs 코드 — TODO에 구현 표시됨.

### 5.6 나의 제보 수정 — Z4c (`MMyReportEdit.jsx`) — Figma `0:2497`

- TODO 기록 완료. verify 캡처 OK.

### 5.7 좋아요 제보글 — Z2C (`MyReports` 좋아요 탭) — Figma `0:2653`

- 같은 컴포넌트, 탭 전환만. Figma 보면 카드 디자인 동일.

---

## Part 6 — PC — 제보·제안

### 6.1 PC 제안 지도 (`PCProposeMap`) — Figma `0:9329`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 좌측 사이드패널 | 검색 input + 필터 카드 (`전체` 등) + 통계(46건/30건) — 핑크 `+ 제안하기` 패널 | 동일 (좌측 카드 + `+ 제안하기` 핑크 패널) | ✅ 일치 |
| 2 | 핀 | 빨간 teardrop + 숫자 배지(`12`) + 핀 드롭 그림자 | 빨간 teardrop + 숫자 배지(`12`) | ✅ 일치 |
| 3 | 핀 클릭 카드 | 카드 모달 (사진+제목+위치+장점) | 코드: `점등 (가안) ... 다양한 정보 노출` 카드 — Figma와 약간 다름 | 카드 모달 디자인 일치 (Figma는 좀 더 깔끔, 코드는 정보 더 많음) |
| 4 | 우측 카드 리스트 | 11건 카드 세로 리스트 (썸네일+제목+동) | 동일 | ✅ 일치 |
| 5 | 헤더 로고 | PDDP(가안) 워드마크 | WDC 워드마크 | **WDC 정답** ✅ |

### 6.2 PC 제안 폼 (`PCProposeForm`) — Figma `0:9118`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | Hero | 노랑 `우리동네 개선 아이디어를 제안해보세요.` + 일러스트 | 동일 | ✅ 일치 |
| 2 | 라디오 8개 | 4-col 그리드 | 동일 4-col | ✅ 일치 |
| 3 | 제목 input | **풀폭 알약 보더** (좁은 폼 폭) | **풀폭 알약 (코드는 1024+px 매우 넓음)** | Figma는 좁은 폼 (max-width ~700px). 코드 폼 폭 좁히기 |
| 4 | 자세한 설명 textarea | 좁은 폼 | 매우 넓은 textarea | 동일 폼 폭으로 |
| 5 | 위치정보 | 단일 알약 + 우측 크로스헤어 | **알약 2개 행** (지도로 위치 설정 + 상세 위치) | Figma는 단일 알약. 코드의 상세 위치 input 제거 또는 toggle |
| 6 | 첨부자료 | `+` 박스 + 캡션 | 동일 | ✅ 일치 |
| 7 | Footer | `임시저장`(회색 알약) + `작성완료`(핑크 알약) 가운데 정렬 | 동일 | ✅ 일치 |
| 8 | 헤더 로고 | PDDP | WDC | ✅ 정답 |

### 6.3 PC 제안 상세 (`PCProposeDetail` / `PCDetailShared`) — Figma `0:9914`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | breadcrumbs | `제보/제안 > 교통` (작은 회색) | 동일 | ✅ 일치 |
| 2 | 제목 + 메타 | `전기자전거 재고 불균형 해결 제안` + `2026.03.13 조회수 333` | 코드는 제목 `(제목 없음)` + ❤ icon만 — **데이터 미연결** | 백엔드 데이터 연결 |
| 3 | Hero 이미지 | 해운대 야경 사진 풀폭 | 동일 (`detail-hero-haeundae.png`) | ✅ 일치 |
| 4 | 지도 mini | 카카오맵 작은 박스 + 핀 | 동일 (큰 카카오맵) | mini 사이즈로 |
| 5 | **본문 단락** | 제목 아래 본문 텍스트 + bullet list 다수 (`수요 예측 기반 운영 시스템 도입` 등) | **본문 자체 안 보임** — 입력란 + `등록`/`목록으로` 버튼만 | **본문 누락 — 가장 큰 차이**. 데이터 연결 + 본문 영역 컴포넌트 추가 |
| 6 | 우측 ❤ 좋아요 카운트 패널 | filled red + count `❤4` 작은 floating | 동일 (우측 floating) | ✅ 일치 |
| 7 | 댓글 입력 | 본문 아래 input + 페이퍼플레인 | 동일 | ✅ 일치 |
| 8 | 댓글 리스트 | 댓글 2-3개 미리보기 (작성자/내용/`답글쓰기`) | `아직 댓글이 없습니다` | mock seed 강화 |
| 9 | Footer | (Figma) 없음 / (코드) `목록으로` outline 회색 가운데 | 코드 추가 | UX 일치를 위해 제거 검토 |

### 6.4 PC 제보 지도 (`PCReportMap`) — Figma `0:9958`

- propose map과 거의 동일 디자인. 다른 점: 우측 카드의 stat 아이콘이 ❤ (제안은 ✓체크).
- **Figma vs Code**: ✅ 일치 (좌측 패널 + 지도 + 우측 카드)

### 6.5 PC 제보 폼 (`PCReportForm`) — Figma `0:10229`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | Hero | 노랑 `문제 상황이 잘 보이도록 사진을 등록해 주세요` + 일러스트 | 동일 | ✅ 일치 |
| 2 | 사진등록 카메라 박스 | 작은 사각 박스 (1열) | 동일 | ✅ 일치 |
| 3 | 위치정보 | 단일 알약 + 크로스헤어 | **2-input** (`지도로 위치 설정하기` + `상세 위치 (예: 1층 오른쪽 표지판 앞)`) | Figma는 단일 알약. 상세주소 input 제거 또는 toggle |
| 4 | 카테고리 칩 | **8개** wrap (주거/환경/교통/안전/교육/산업·일자리/문화·여가/보건·복지) | 동일 8개 | ✅ 일치 (모바일 폼은 4개라 PC와 모순) |
| 5 | 셀렉트 행 | `공공/시설물 ▼ 에 / 문제사항 ▼ 불편해요` 2 셀렉트 | 동일 | ✅ 일치 |
| 6 | 상세설명 input | 풀폭 1줄 | 동일 | ✅ 일치 |
| 7 | Footer | `임시저장`(회색) + `작성완료`(핑크 채움) | 동일 (현재 비활성 시 light pink) | ✅ 일치 |

### 6.6 PC 제보 상세 (`PCReportDetail`) — Figma `0:2314`

- propose detail과 동일 패턴
- **본문 누락** — propose detail과 같은 문제 (`(제목 없음)` + Hero + 지도 + 댓글만, 본문 X)
- breadcrumbs: `제보/제안 > 교통` 일치
- 우측 ❤ floating 일치

---

## Part 7 — PC — 설문

### 7.1 PC 설문 목록 (`PCSurveyList`) — Figma `0:8673`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | Hero 보라 | 연보라 카드 + `우리동네 설문 참여 안전한 우리동네 만들기!` + 일러스트 | 동일 | ✅ 일치 |
| 2 | 탭 | `진행중인 설문`(보라 채움) + `설문결과`(회색 outline) | 동일 | ✅ 일치 |
| 3 | 카드 그리드 | 2-col 카드 (제목 + 응답시간 + 조사기간 + 보라 ▶ 원) | 동일 | ✅ 일치 |
| 4 | 카드 데이터 | `소비자 인식 조사` 6개 (Figma) | `공공디자인 만족도 조사`/`소비자 인식 조사`/`사직구장 일대 보행환경 현황 조사` 3개 (실제 데이터) | ✅ 일치 (실데이터 OK) |
| 5 | 헤더 로고 | PDDP | WDC | ✅ 정답 |

### 7.2 PC 설문 상세1 (`PCSurveyDetail`) — Figma `0:8721`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | Hero 보라 풀폭 | `사직구장 일대 보행환경의 현황 조사` 흰 텍스트 가운데 | 동일 | ✅ 일치 |
| 2 | 정보 카드 | hero 아래 흰 박스 (조사명/조사기간/응답시간/내용 4행) | 동일 | ✅ 일치 |
| 3 | 약관 bullet 2개 | `✓` + 텍스트 | 동일 | ✅ 일치 |
| 4 | `참여하기` 버튼 | 보라 알약 가운데 | 동일 | ✅ 일치 |

### 7.3 PC 설문 참여 (`PCSurveyJoin`) — Figma `0:9021`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | Hero 풀폭 보라 | 가운데 제목 | 동일 | ✅ 일치 |
| 2 | 폼 카드 | 흰 카드 + Q1~Q5 안에 정렬 | 동일 | ✅ 일치 |
| 3 | Q1 체크박스 | 사각 + 보라 채움 active | 동일 | ✅ 일치 |
| 4 | Q2/Q3 슬라이더 | 5단계 dot + 라벨 | 동일 | ✅ 일치 |
| 5 | Q4 다중 체크 (2-col) | `보행로 확장` 등 5개 + 활성 보라 | 동일 | ✅ 일치 |
| 6 | Q5 textarea | placeholder + 글자수 | 동일 | ✅ 일치 |
| 7 | Footer | `이전`(흰 outline) + `다음`(보라 채움) 가운데 | 동일 | ✅ 일치 |
| 8 | **카드 폭** | 폼 카드 폭 좁음 (좌우 padding 큼) | 동일 | ✅ 일치 |

### 7.4 PC 설문 결과 (`PCSurveyResults`) — Figma `0:8852`

- 모바일 결과(3.5)와 거의 동일 차트 라인업
- 풀폭 hero + 차트 4종 (radar + 도넛 + 막대 + 버블)
- ✅ 일치

### 7.5 PC 설문 완료 (`PCSurveyDone`) — Figma `0:9100`

- 보라 ✓ 원 + `설문 제출 완료` + 보라 큰 알약 `홈으로 이동`
- ✅ 일치

### 7.6 설문 동의 (Consent) — `PCSurveyConsent`

- Figma 모바일 `설문상세2` (`0:11289`) 의 PC 변형 추정
- verify 캡처 (`03-survey-consent.png`) OK

---

## Part 8 — PC — 진단

### 8.1 PC 진단 (통합 셸 — `PCDiagnosisMap`+ panels) — Figma `0:15115`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 네비 | `설문 / 제보·제안 / 진단(active) / AI가상시민 / 공공데이터` 5탭 | **헤더 깨짐** — `설문/제보/제안 진단(검정) AI가상시민 공공데이터`가 줄바꿈 + 글자가 겹쳐서 보임 | **레이아웃 z-index/positioning 버그**. PCDiagnosisMap의 헤더가 panel과 겹침 |
| 2 | 좌측 사이드패널 | 검색 + 일반/전문가 탭 + 카테고리 셀렉트 + 통계 카드 + 녹색 `+ 진단하기` 버튼 | 좁은 사이드패널 — 카드 보이지만 일부 가림 | 헤더 fix + 사이드패널 폭 조정 |
| 3 | 지도 핀 | 녹색 teardrop + 숫자 배지 (`12`, `1` 등) | 빨간/녹색 혼합 핀 + 숫자 배지 (`12` 배지 보임) — 다행히 핀 데이터는 노출 | 핀 색상을 진단 페이지에선 녹색 통일 |
| 4 | 우측 카드 리스트 | 11건 카드 (사진 + 제목 + 점수 + 동) | 동일 | ✅ 일치 |
| 5 | 우측 카드 stat | `❤ 👁` (좋아요/조회수) | 동일 | ✅ 일치 |

### 8.2 PC 진단 상세 (`PCDiagPanelDetail`) — Figma `0:15357`(상세01) `0:15726`(상세02)

- panel state machine으로 동일 셸 안에서 표시
- verify에서 별도 캡처 안됨 (`pcDiagnosisDetail.png`도 동일 깨진 이미지)
- **Figma**: 좌측 사이드패널 (필터 등) + 가운데 진단 카드 상세 (점수, radar, 댓글) + 우측 (필요 시 추가 정보)
- **수정 필요**: 코드 panel 라우팅 동작 검증 + 헤더 z-index 픽스

### 8.3 PC 진단하기 폼 (`PCDiagPanelForm`) — Figma `0:15993`

- panel로 동일 셸 안. 폼 = 사진/분류/만족도 4문항/리뷰
- **현재 코드**: 폼이 panel 안에 잘 표시되나, **헤더 z-index 충돌**로 상단 헤더가 panel을 가림 (verify 캡처 보면 `설문/제보/제안 진단` 헤더 글자가 panel 위에 겹쳐 보임)
- **수정 필요**: PC 진단 셸의 헤더 fixed/absolute 위치 + z-index 정리

### 8.4 PC 진단 완료 (`PCDiagPanelDone`) — Figma `0:16145`

- panel 안에 `진단 결과가 제출되었습니다` + 청록 `지도로 돌아가기` 알약
- 코드 동일하게 panel 안에 표시되지만 헤더 충돌 동일 발생

---

## Part 9 — Admin (관리자)

### 9.0 verify 캡처 한계

- `verify/screenshots/adminMain.png`, `adminUserList.png`, `expertManagement.png`, `surveyManagement.png`, `surveyEditor.png`, `surveyResults.png`, `reportManagement.png`, `proposalManagement.png`, `adminDashboardNew.png` 등은 모두 **로그인 화면이 캡처됨** (모바일 viewport 390x844로 admin 진입했는데 인증 가드에 막힘)
- 실제 admin 캡처는 `verify/screenshots/admin/01~15-*.png` (별도 admin_shots.mjs로 1440 viewport + 로그인 후 캡처)을 사용

### 9.1 Admin 로그인 (`admin/Login.jsx` 또는 `LoginNew.jsx`) — Figma `0:6539`

| # | 항목 | Figma | 현재 코드 (admin/01-login.png) | 수정 필요 |
|---|---|---|---|---|
| 1 | 배경 | 청록 풀스크린 | 동일 | ✅ 일치 |
| 2 | 제목 | `Login` 흰 글씨 가운데 | 동일 | ✅ 일치 |
| 3 | input 2개 | 둥근 흰 박스 (`아이디를 입력하세요.` / `비밀번호를 입력하세요.`) | 동일 | ✅ 일치 |
| 4 | 로그인 버튼 | 검정 둥근 사각 `로그인` 흰 글씨 | 동일 | ✅ 일치 |

### 9.2 Admin 메인 (`AdminMain.jsx`) — Figma `0:6549` vs `verify/screenshots/admin/02-main.png`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 좌측 사이드바 | **검정 배경** + `PDDP(가안)` 청록 로고 + 7 메뉴 (`회원관리/제안/제보 관리/진단관리/설문관리/공공데이터관리/공지사항/홍보`) | **검정 배경** + `WDC` 청록 로고 + 동일 7 메뉴 | ✅ 일치 (로고만 WDC) |
| 2 | 사이드바 active | `회원관리`(청록 underline) + sub `시민/전문가/관리자` | `회원관리`(청록 underline) + sub | ✅ 일치 |
| 3 | 사이드바 비활성 | `진단관리/공공데이터관리/공지사항/홍보` 회색 outline (TODO) | 동일 (회색 + ▼ 아이콘) | ✅ 일치 |
| 4 | 우측 헤더 | `홍길동님 / 로그아웃` (Figma) | `관리자님 / 로그아웃` (코드) | 사용자명 데이터 다르나 디자인 일치 |
| 5 | 9 카드 그리드 | `회원관리(청록 active)/제보·제안/진단/설문/공공데이터/홍보/공지사항/기타+/기타+` 3x3 | 동일 — 단 코드는 `공공데이터` 카드가 청록 active (Figma는 `회원관리`가 active) | active 상태가 다름 — 코드는 첫 진입 시 어떤 카드 active인지 정책 결정 |
| 6 | 카드 아이콘 | 인라인 SVG (회원/제보/진단/설문/공공데이터/홍보) | 동일 (lucide-react 제거 완료, TODO 기록) | ✅ 일치 |
| 7 | 카드 라벨 | 우하단 정렬 (`회원관리`, `제보/제안` 등) | 동일 | ✅ 일치 |

### 9.3 Admin 회원관리 — 시민 (`AdminUserList.jsx`) — Figma `0:7337` vs `admin/03-citizen.png`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `회원관리 - 시민` + 우측 `전체 회원 3명` | 동일 | ✅ 일치 |
| 2 | 검색 카드 | `회원검색 [input ⌕] [검색 청록 버튼]` 2단 | 동일 | ✅ 일치 |
| 3 | 표 | 회원이름/닉네임/연락처/주소/이메일/생년월일/메뉴 7컬럼 | 동일 | ✅ 일치 |
| 4 | 표 데이터 | 3 row (`강승모/박시민/이시민`) | 동일 (실데이터) | ✅ 일치 |
| 5 | 메뉴 | `수정 | 삭제` 회색 텍스트 | 동일 | ✅ 일치 |
| 6 | 페이지네이션 | `‹ 1 ›` 가운데 | 동일 | ✅ 일치 |

### 9.4 Admin 회원관리 — 전문가 (`ExpertManagement.jsx`) — Figma `0:6747`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `회원관리 - 전문가` | 동일 (verify `04-expert.png`) | ✅ 일치 |
| 2 | 표 컬럼 | 회원이름/닉네임/연락처/주소/이메일/직책/메뉴 | 코드 컬럼 검증 필요 | 컬럼 일치 확인 |
| 3 | 승인상태 chip | `승인` 연핑크 알약 | 동일 (`MemberEdit` 상세에 노출됨) | ✅ 일치 |

### 9.5 Admin 회원관리 — 관리자 (`AdminUserList.jsx` 관리자 탭) — Figma `0:6920`

- 관리자 탭. 동일 패턴 (`05-admin.png`)
- 권한 컬럼 (관리자/슈퍼관리자) 추가 — Figma 변형 확인 필요

### 9.6 Admin 회원정보 수정 (`MemberEdit.jsx`) — Figma `0:7269`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 폼 라벨 | 회원이름/회원아이디/닉네임/연락처/주소/이메일/승인상태/가입일/최근접속일/참여현황 리스트 | 동일 | ✅ 일치 |
| 2 | 입력 행 | label 좌측 + input 우측, 라벨 폭 ~80px | 동일 | ✅ 일치 |
| 3 | 승인상태 chip | `승인` 연핑크 알약 | 동일 | ✅ 일치 |
| 4 | 참여현황 | `제안 4건` 텍스트 input | 동일 | ✅ 일치 |
| 5 | Footer | (Figma 캡처에 안 보임) | (코드도 Footer 없음, scroll만) | ✅ 일치 |

### 9.7 Admin 제보 (`ReportManagement.jsx`) — Figma `0:7635` vs `admin/06-reports.png`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `제보` + 우측 `전체 제보 34건` | 동일 | ✅ 일치 |
| 2 | 검색 카드 | `제목 [input] [검색]` | 동일 | ✅ 일치 |
| 3 | 표 컬럼 | 제보 제목 / 유형 / 위치 / 작성자 ID / 메뉴 | 동일 | ✅ 일치 |
| 4 | 유형 chip | 연한 알약 (안전=연핑크, 환경=연녹, 교육=연보라, 문화·여가=연보라) | 동일 | ✅ 일치 |
| 5 | 메뉴 | `상세 | 삭제` | 동일 | ✅ 일치 |
| 6 | 사이드바 active | `제안/제보 관리` > `제보` (active 청록 underline) | 동일 | ✅ 일치 |

### 9.8 Admin 제안 (`ProposalManagement.jsx`) — Figma `0:7522`

- 같은 패턴, `제안` 헤더 + `제안 제목 / 유형 / 위치 / 작성자 ID / 메뉴` 표
- ✅ 일치 (verify `07-proposals.png`)

### 9.9 Admin 제보 상세 (`ReportDetail.jsx`) — verify `09-report-detail.png` / `10-report-detail.png`

- Figma 노드: PC `2314` 사용 (PC_제보현황>리스트>상세1), Admin 셸 안에 사용
- 본문 영역 — 사용자 PC와 동일 이슈 가능 (본문 누락 검토 필요)
- TODO에 캡처 검증 완료로 기록됨

### 9.10 Admin 제안 수정 (`ProposalEdit.jsx`) — verify `11-proposal-detail-empty.png`

- 빈 상태 캡처. 제안 ID 데이터 없음 — 백엔드/프론트 데이터 연결 필요

### 9.11 Admin 설문 관리 (`SurveyManagement.jsx`) — Figma `0:7923` vs verify `08-survey.png`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 헤더 | `설문관리` | 동일 | ✅ 일치 |
| 2 | 표/카드 | 설문 카드 그리드 (제목/상태/기간/생성자) | 동일 | ✅ 일치 |
| 3 | 액션 | `상세보기/편집/결과보기/복제/삭제` | 동일 | ✅ 일치 |

### 9.12 Admin 설문 편집 (`SurveyEditor.jsx`) — Figma `0:8099` vs verify `12-survey-editor-edit.png`

| # | 항목 | Figma | 현재 코드 | 수정 필요 |
|---|---|---|---|---|
| 1 | 우측 플로팅 툴바 | `질문 추가 / 질문 가져오기 / 섹션 추가 / 이미지 / 동영상` 5 버튼 | 동일 (TODO 완료) | ✅ 일치 |
| 2 | 편집 탭 | 질문 카드 상단 toolbar (복제/삭제/필수토글/더보기) | 동일 | ✅ 일치 |
| 3 | 설정 탭 | 평면 form (설문대상/나이선택/기간/상태/공개여부) | 동일 (verify `13-survey-editor-settings.png`) | ✅ 일치 |
| 4 | 하단 confirm 버튼 | `확인 / 저장` teal pill | 동일 | ✅ 일치 |

### 9.13 Admin 설문 완료 (`SurveyCreated.jsx`) — Figma `0:8313` vs verify `14-survey-created.png`

- ✅ 일치

### 9.14 Admin 설문 결과 (`SurveyResults.jsx`) — Figma `0:8361` vs verify `15-survey-results.png`

- 차트 4종 (radar/도넛/막대/버블) 동일
- ✅ 일치

### 9.15 ❌ Admin 미구현 페이지

다음 페이지는 **Figma에 있지만 코드에 없음** (TODO 기록):
- `진단관리` — 사이드바 비활성
- `공공데이터관리` — 사이드바 비활성
- `공지사항` — 사이드바 비활성
- `홍보` — 사이드바 비활성
- `진단정보 / 정책정보 / 공공데이터 / 디자인생태` 페이지 — 미구현
- `AI가상시민 현황` — 미구현
- `공공디자인 현황 메가 대시보드` — 미구현

---

## Part 10 — 에셋·로고·아이콘 감사

### 10.1 로고

- ✅ `public/WDC.svg` 사용 (PC 헤더, Admin 사이드바, 모바일 홈 좌상단)
- ✅ Figma에 PDDP(가안) 표기되어 있으나, **WDC가 정답** (사용자 명시 + memory `header_logo_wdc`)
- 코드 사용처 (모두 WDC):
  - `src/components/PCHeader.jsx:54`
  - `src/components/Home.jsx:43,68`
  - `src/components/UserPCLayout.jsx:35`
  - `src/admin/components/AdminSidebar.jsx:130`
  - `src/admin/pages/ExpertEdit.jsx:86`
  - `src/admin/pages/ProposalEdit.jsx:94`
- ❌ 코드에 `PDDP` 문자열 잔존 0건 (감사 완료)

### 10.2 PC Hero 일러스트 — Figma 원본 PNG로 교체 완료 (TODO 기록)

- `public/figma-assets/propose-hero.png` (제안/제보 폼 hero)
- `public/figma-assets/detail-hero-haeundae.png` (PC detail hero - 해운대 야경)
- `public/figma-assets/survey-hero.png` (PC 설문 list hero)

### 10.3 Done 아이콘 — Figma PNG 사용 완료

- `public/figma-assets/done_check.png` (✓ 마크)
- `public/figma-assets/done_doc.png` (종이 일러스트)

### 10.4 Admin 카드 아이콘 — 인라인 SVG 변환 완료 (TODO 기록)

- `public/figma-assets/admin/diagnosis.png` `member.png` `notice.png` `promo.png` `public-data.png` `report.png` `survey.png`
- AdminMain의 lucide-react import 제거 완료

### 10.5 카메라 / 첨부 / 삭제 아이콘

- `public/camera.svg` — 모바일 폼 사진등록 박스 안 카메라 아이콘 ✅ 일치
- `public/file.svg` `gallery.svg` `removeicon.svg` 등 — 코드 사용처 확인 필요

### 10.6 ❌ 누락/불일치 의심 에셋

| 에셋 | 위치 | 상태 |
|---|---|---|
| 카테고리 칩 색상 | `src/components/catStyles.js` | sub-tag가 모바일 리스트는 카테고리별, Figma는 단일 핑크 — 정책 결정 필요 |
| 제보 상세 hero 사진 | `MReportDetail.jsx` | Figma는 실사 photo, 코드는 그라데이션 placeholder |
| 제안 상세 hero 사진 | `MProposalDetail.jsx` | 동일 |
| 진단 결과 사진 | `MDiagnosisResult.jsx` | Figma는 진단 사진, 코드는 빈 placeholder |

### 10.7 폰트

- `public/assets/PretendardVariable.woff2` (본문)
- `public/assets/GmarketSansTTF{Bold,Light,Medium}.ttf` (헤딩)
- ✅ Figma의 본문 가독성 (한글 -0.02em letter-spacing) 코드에 반영됨

---

## Part 11 — Figma 프레임 ↔ 코드 매핑

### 11.1 모바일 (393×852~)

| Figma 노드 | Figma 이름 | 코드 컴포넌트 | 코드 view |
|---|---|---|---|
| `0:11392` | MO_설문>설문목록 (의외로 0:11392는 설문 list, 제안 list와 ID 우연 일치) | `MSurveyList.jsx` | `mSurveyList` |
| `0:11251` | MO_설문>설문상세1 | `MSurveyDetail1.jsx` | `mSurveyDetail1` |
| `0:11289` | MO_설문>설문상세2 | `MSurveyDetail2.jsx` | (verify 미등록) |
| `0:11000` | MO_설문>설문참여 | `MSurveyJoin.jsx` | (mSurveyJoin) |
| `0:11066` | MO_설문>설문결과 | `MSurveyResults.jsx` | `mSurveyResults` |
| `0:11239` | MO_설문>설문완료 | `MSurveyDone.jsx` | (verify 미등록) |
| `0:11429` | USER: MO_제안>리스트 | `MProposalList.jsx` | `mProposalList` |
| `0:11757` | USER: MO_제안>지도 | `MProposalMap.jsx` | `mProposalMap` |
| `0:11900` | USER: MO_제안>제안하기01 | `MProposalForm.jsx` (sub-state) | (form root) |
| `0:11542` | USER: MO_제안>위치설정 | (모달) | overlay |
| `0:11654` | USER: MO_제안>정렬선택 | (모달) | overlay |
| `0:11950/11985` | USER: MO_제안>제안상세3/4 | variants | — |
| `0:12032/12069` | USER: MO_제안>제안상세1/2 | `MProposalDetail.jsx` | `mProposalDetail` |
| `0:12110` | USER: MO_제안>제안상세>전체 (long) | (variant) | — |
| `0:12148` | USER: MO_제보>지도 | `MReportMap.jsx` | `mReportMap` |
| `0:12290` | USER: MO_제보>리스트 | `MReportList.jsx` | `mReportList` |
| `0:12460` | USER: MO_제보>위치설정 | 모달 | overlay |
| `0:12588` | USER: MO_제보>정렬선택 | 모달 | overlay |
| `0:12713` | USER: MO_제보>제보하기01 | `MReportForm.jsx` | `mReportForm` |
| `0:13015` | USER: MO_제보>제보완료>임시저장 | `MReportForm` 모달 | overlay |
| `0:13324` | USER: MO_제보>제보완료 | `MReportDone.jsx` | `mReportDone` |
| `0:1328` | C4a_제보상세 | `MReportDetail.jsx` | `mReportDetail` |
| `0:1381` | C4a_제보상세>좋아요 | (variant) | — |
| `0:1438` | C4a_제보상세>제보결과 (모달) | overlay | — |
| `0:13561` | B1_제안작성(전체 long) | `MProposalForm.jsx` | (form root) |
| `0:13616` | B1_제안작성>제안유형선택 | (sub-state) | — |
| `0:13742` | B1_제안작성>내용작성 | (sub-state) | — |
| `0:13800` | B1_제안작성>위치정보 입력 | (sub-state) | — |
| `0:13859` | B1_제안작성>작성완료 활성화 | (sub-state) | — |
| `0:13925` | B1_제안작성>오류멘트 | (sub-state) | — |
| `0:13674` | USER: MO_제안>제안불러오기 | `MProposalForm` 모달 | overlay |
| `0:14081` | B1_제안작성>이미지 선택 | (sub-state) | — |
| `0:14109` | USER: MO_제안>제안완료 | `MProposalDone.jsx` | `mProposalDone` |
| `0:14122` | B1_제안작성>위치정보 선택 | (sub-state) | — |
| `0:14163` | MO/USER: 진단하기>일반진단>진단하기 | `MDiagnosisForm.jsx` | `mDiagnosisForm` |
| `0:14270` | 진단 목록1 | `MDiagnosisList.jsx` | `mDiagnosisList` |
| `0:14419` | 진단 목록2 | (variant) | — |
| `0:14575` | 진단 목록3 | (variant) | — |
| `0:14779` | 시민 진단정보 | `MDiagnosisResult.jsx` | `mDiagnosisResult` |
| `0:14995` | 전문가 진단정보 | (전문가 분기 미구현) | — |
| `0:2543` | Z2C_나의제보 | `MyReports.jsx` | (myReports) |
| `0:2653` | Z2C_좋아요 제보 보기 | (탭) | — |
| `0:2756` | Z3c_나의제보글 보기 | `MMyReportDetail.jsx` | `mMyReportDetail` |
| `0:2798` | Z3c_나의제보글 보기>삭제하기 | (모달) | — |
| `0:2497` | Z4c_나의제보글 보기>수정하기 | `MMyReportEdit.jsx` | `mMyReportEdit` |

### 11.2 PC (1920)

| Figma 노드 | Figma 이름 | 코드 컴포넌트 | 코드 view |
|---|---|---|---|
| `0:9329` | USER: PC_제안>지도 | `PCProposeMap.jsx` | (PC propose) |
| `0:9118` | USER: PC_제안>제안하기01 | `PCProposeForm.jsx` | (PC propose) |
| `0:9145` | USER: PC_제안>제안완료 | (PC done) | — |
| `0:9914` | USER: PC_제안>제안상세1 | `PCProposeDetail` | — |
| `0:9223` | USER: PC_제안>제안상세2>투표완료 | (variant) | — |
| `0:9846/9880` | USER: PC_제안>제안상세3/4>투표팝업 | 모달 | — |
| `0:9796` | USER: PC_제안>제안상세5>투표완료 | (variant) | — |
| `0:9193/9267` | USER: PC_제안>제안하기02/03>주소검색 | 모달 | — |
| `0:9690` | USER: PC_제안>제안하기04>상세주소입력 | (sub-state) | — |
| `0:9721/9754` | USER: PC_제안>제안하기05/06>첨부파일 | 모달/완료 | — |
| `0:9958` | USER: PC_제보>지도 | `PCReportMap.jsx` | (PC report) |
| `0:10229` | USER: PC_제보>제보하기01 | `PCReportForm.jsx` | (PC report) |
| `0:10527` | USER: PC_제보>제보하기03>사진등록완료 | (sub-state) | — |
| `0:10587` | USER: PC_제보>제보하기05>상세주소입력 | (sub-state) | — |
| `0:10650/10715/10781` | 제보하기06/07/08>불편사항 | (sub-state) | — |
| `0:10847` | USER: PC_제보>제보하기04>위치등록 | (sub-state) | — |
| `0:10930` | USER: PC_제보>제보하기02>파일첨부 | 모달 | — |
| `0:2135` | PC_제보현황>리스트 | (검토 필요) | — |
| `0:2314/10479` | PC_제보현황>리스트>상세1/2 | `PCReportDetail` (PCDetailShared) | — |
| `0:3055/6411` | PC_나의제보>리스트01 / 좋아요 제보글 | `PCMyReportList.jsx` | `pcMyReportList` |
| `0:3187` | PC_나의제보>수정 | `PCMyReportEdit.jsx` | `pcMyReportEdit` |
| `0:2912/6079/6158` | PC_Z3b_나의제안글 보기>삭제하기 | `PCMyProposalDetail.jsx` | `pcMyProposalDetail` |
| `0:8673` | PC_설문>설문목록 | `PCSurveyList.jsx` | (PC survey) |
| `0:8721/8751` | PC_설문>설문상세1/2 | `PCSurveyDetail.jsx` | — |
| `0:9021` | PC_설문>설문참여 | `PCSurveyJoin.jsx` | — |
| `0:8852` | PC_설문>설문결과 | `PCSurveyResults.jsx` | — |
| `0:9100` | PC_설문>설문완료 | `PCSurveyDone.jsx` | — |
| `0:15115` | USER: 지도(대시보드)_목록 | `PCDiagnosisMap.jsx` | `pcDiagnosisMap` |
| `0:15357/15726` | 진단상세01/02 | `PCDiagPanelDetail.jsx` | (panel) |
| `0:15993` | 진단하기 (PC form) | `PCDiagPanelForm.jsx` | `pcDiagnosisForm` |
| `0:16145` | 진단완료 (PC done) | `PCDiagPanelDone.jsx` | `pcDiagnosisDone` |

### 11.3 Admin (1920)

| Figma 노드 | Figma 이름 | 코드 컴포넌트 | 코드 view |
|---|---|---|---|
| `0:6539` | PC/ADMIN:로그인 | `admin/Login.jsx` 또는 `LoginNew.jsx` | `adminLoginNew` |
| `0:6549` | PC/ADMIN:관리자메인 | `AdminMain.jsx` | `adminMain` |
| `0:6676` | PC/ADMIN:회원관리>회원관리 (인덱스 페이지) | (탭 진입점) | — |
| `0:6747` | PC/ADMIN:회원관리>전문가 | `ExpertManagement.jsx` | `expertManagement` |
| `0:6920` | PC/ADMIN:회원관리>관리자 | (관리자 탭) | — |
| `0:7093` | 회원관리 - 관리자01 | (variant) | — |
| `0:7269` | PC/ADMIN:회원관리>회원정보 | `MemberEdit.jsx` | (modal route) |
| `0:7337` | PC/ADMIN:회원관리>시민리스트 | `AdminUserList.jsx` (citizen tab) | `adminUserList` |
| `0:7522/7748` | 제안 / 제안2 | `ProposalManagement.jsx` | `proposalManagement` |
| `0:7635/7816` | 제보 (variants) | `ReportManagement.jsx` | `reportManagement` |
| `0:7923` | 설문 > 통합관리자 | `SurveyManagement.jsx` | `surveyManagement` |
| `0:8099` | 설문 > 통합관리자 > 편집 | `SurveyEditor.jsx` | `surveyEditor` |
| `0:8313` | 설문 > 통합관리자 > 완료 | `SurveyCreated.jsx` | — |
| `0:8361` | 설문 > 통합관리자 > 결과 | `SurveyResults.jsx` (admin) | `surveyResults` |
| `0:8459` | 설문 > 통합관리자 > 편집/설정/결과 통합 | (탭 통합) | — |

---

---

## Part 12 — 🆘 아이콘·벡터 시스템 결함 (사용자 명시 지적)

> **원칙**: Figma는 모든 아이콘을 **자체 SVG 벡터**로 디자인. 코드에서 **유니코드 이모지**나 **외부 아이콘 라이브러리(lucide-react)**를 쓰면 OS·폰트·브라우저에 따라 모양이 달라져 절대 Figma와 일치하지 않음.

### 12.1 ❌ 유니코드 이모지/글리프 잔존 — 시스템 폰트 의존 (Figma와 모양 다름)

**3가지 다른 하트 글리프가 혼재** — 코드 내부 일관성도 깨짐:

| 글리프 | 유니코드 | 의미 | 사용처 (라인) | 문제 |
|---|---|---|---|---|
| `❤️` | U+2764 U+FE0F | red heart emoji (컬러) | `admin/ReportDetail.jsx:218` `admin/AdminProposalDetail.jsx:171` `PCProposeDetail.jsx:115` `PCReportDetail.jsx:108` | OS 이모지 폰트(애플/구글/MS)에 따라 모양·색 다름. Figma는 vector outline/filled 구분 |
| `❤` | U+2764 (variation 없음) | heavy black heart (텍스트) | `PCReportDetail.jsx:134` | 폰트 fallback에 따라 검정/빨강 무작위. CSS color 통제 불완전 |
| `♥` | U+2665 | black heart suit (카드 슈트) | `PCMapCanvas.jsx:179` `PCDiagnosisMap.jsx:367` | 트럼프카드 글리프 — 의미상 부적합. 모양도 Figma와 완전 다름 |
| `👁` `👁️` | U+1F441 (+FE0F) | eye emoji | `admin/AdminProposalDetail.jsx:171` `admin/ReportDetail.jsx:218` `PCDiagnosisMap.jsx:368` | OS별 모양 천차만별 (애플은 사실적, 구글은 단순). Figma는 단일 outline eye SVG |
| `🗳` | U+1F5F3 | ballot box emoji | `PCProposeDetail.jsx:138` (투표 toggle 시) | 투표함 그림 — Figma의 단순 ✓ 체크 SVG와 완전 다름. 매우 부적절 |
| `✓` | U+2713 | check mark | `PCProposeDetail.jsx:138` (toggle 미투표 상태) | 텍스트 글리프. Figma는 stroke 굵기 통제된 SVG |
| `✉️` | U+2709 U+FE0F | envelope emoji | `admin/Login.jsx:82` `admin/Signup.jsx:85` (auth-icon) | 메일 아이콘이 OS별 컬러 이모지로 깨짐 |

**총 9개 파일에서 유니코드 이모지/글리프 사용 → 전부 Figma SVG와 미일치**.

**수정 방안**:
- 모바일 리스트/상세는 이미 인라인 SVG 사용 중 (lucide-react path 복사) — PC/Admin도 동일 패턴으로 통일
- Figma의 좋아요/조회수/댓글 아이콘 SVG를 추출해서 `src/assets/icons/` 또는 인라인으로 사용
- 권장 컴포넌트화: `<HeartIcon filled={liked} />`, `<EyeIcon />`, `<CommentIcon />`

### 12.2 ❌ lucide-react 잔존 12개 파일 — 프로젝트 정책 위반

**TODO.md 명시**: "❌ lucide-react 신규 사용 (스펙 위반)" / **CLAUDE.md**: "lucide-react는 **금지** (관리자 영역 위반 다수, 치환 TODO)"

| 파일 | 사용 아이콘 | 영향 |
|---|---|---|
| `src/components/Sidebar.jsx` | Home, Leaf, Car, Shield, GraduationCap, Factory, Palette, Heart, RotateCcw | **사용자 페이지** 사이드바 — 카테고리 9개 모두 lucide. Figma 카테고리 아이콘과 모양 다를 가능성 100% |
| `src/components/common/MultiSelectDropdown.jsx` | ChevronDown, Check | 사용자 드롭다운 컴포넌트 |
| `src/admin/components/Sidebar.jsx` | Home, Leaf, Car, Shield, GraduationCap, Factory, Palette, Heart, RotateCcw, Footprints, Bike, Building, Trees, Info, Coffee, Siren, Lightbulb, User, Box, MapPin | Admin 사이드바 — 21개 lucide 아이콘 |
| `src/admin/components/common/MultiSelectDropdown.jsx` | ChevronDown, Check | Admin 드롭다운 |
| `src/admin/components/dashboard/AIChatPanel.jsx` | Bot, Send, Loader2 | AI 가상시민 챗 |
| `src/admin/components/dashboard/AIPersonaPanel.jsx` | ChevronRight, MessageCircle | AI 페르소나 패널 |
| `src/admin/components/dashboard/FloatingChatWidget.jsx` | Bot, X | 챗 위젯 |
| `src/admin/components/dashboard/PersonaDetailModal.jsx` | X, MapPin, Activity, Heart, Quote, PieIcon, ChevronDown, ChevronUp | 페르소나 모달 |
| `src/admin/components/dashboard/InsightDetailModal.jsx` | X, Calendar, User, AlertTriangle, MapPin | 인사이트 모달 |
| `src/admin/pages/Dashboard.jsx` | LogOut, User, Loader2, Home | Admin 대시보드 |
| `src/admin/pages/SurveyCreated.jsx` | Check | 설문 완료 ✓ |
| `src/admin/pages/SurveyResults.jsx` | Download | 결과 다운로드 |

**총 12개 파일, 약 50개 lucide 아이콘 인스턴스**. 각각 Figma SVG로 치환 필요.

### 12.3 ⚠️ 인라인 SVG도 Figma vs 미세 차이 (lucide-react path 복사)

**모바일 카드 stat (`MProposalList`/`MReportList`/`MProposalDetail`/`MReportDetail`)**: 인라인 SVG를 사용하고 있으나 **path가 lucide-react 라이브러리 path를 그대로 복사**한 것:

| 컴포넌트 | 아이콘 | Path 출처 | Figma와 비교 |
|---|---|---|---|
| `MProposalList.jsx:110` | ✓체크 in 원 (투표 카운트) | lucide `CheckCircle` 패턴 (`circle cx=12 cy=12 r=10` + `polyline 9 12 11 14 15 10`) | Figma의 ✓체크인서클 stroke weight·코너 비교 필요 |
| `MProposalList.jsx:111` | 댓글 말풍선 | lucide `MessageSquare` 패턴 (`M21 15a2 2 0 0 1-2 2H7l-4 4V5...`) | Figma 댓글 아이콘 모양 (사각 vs 둥근, 꼬리 위치) 비교 필요 |
| `MReportList.jsx:127` | 하트 | lucide `Heart` outline 패턴 (`M20.84 4.61a5.5 5.5 0 0 0-7.78 0...`) | Figma 하트 outline weight·곡률 비교 필요 |
| `MReportList.jsx:128` | 댓글 말풍선 | 동일 lucide MessageSquare | 동일 |
| `MProposalDetail.jsx:125-126` | ✓체크인원 + 댓글 | 동일 lucide path | 동일 |
| `MReportDetail.jsx:159` | 댓글 말풍선 | 동일 lucide MessageSquare | 동일 |
| `MReportDetail.jsx` (좋아요) | 별도 SVG (likedReportIds 토글) | filled vs outline 두 SVG | Figma `0:1381` (좋아요 variant)와 1:1 비교 필요 |

**리스크**: lucide path는 stroke-width 2, 24x24 viewBox 기반 표준 디자인. **Figma의 자체 디자인은 stroke 1.5 또는 2.5 등 다를 수 있고, corner radius·끝맺음 스타일도 다를 수 있음**. 1:1 비교 후 path 교체 필요.

### 12.4 ❌ 카드 stat 아이콘 일관성 — 페이지 간 미통일

| 화면 | 좋아요/투표 | 조회수 | 댓글 |
|---|---|---|---|
| 모바일 제안 리스트 | ✓체크인서클 (lucide) | (없음) | 말풍선 (lucide) |
| 모바일 제보 리스트 | 하트 outline (lucide) | (없음) | 말풍선 (lucide) |
| 모바일 진단 리스트 | (없음) | 눈 SVG (확인 필요) | (없음) |
| 모바일 제안 상세 | ✓체크인서클 (lucide) | "조회수 N" 텍스트만 | 말풍선 (lucide) |
| 모바일 제보 상세 | filled/outline 하트 SVG | "조회수 N" 텍스트만 | 말풍선 (lucide) |
| **PC 제안 상세** | **❤️ 이모지** | (없음) | (확인 필요) |
| **PC 제보 상세** | **❤️ 이모지** + floating `❤` 글리프 | (없음) | (확인 필요) |
| **PC 진단 지도 카드** | **♥ 카드슈트 글리프** | **👁 이모지** | (없음) |
| **PC 지도 핀 모달** | **♥ 카드슈트 글리프** | (없음) | (없음) |
| **Admin 제보 상세** | **❤️ 이모지** | **👁 이모지** | (없음) |
| **Admin 제안 상세** | **❤️ 이모지** | **👁️ 이모지** | (없음) |

**문제**:
- 모바일은 인라인 SVG (lucide path 복사) — 일관됨
- PC/Admin은 **유니코드 이모지** — OS·브라우저별로 모양이 다르게 렌더링됨
- 같은 좋아요 카운트인데 모바일=하트 SVG, PC=빨간 이모지, PC지도=카드슈트 ♥, Admin=빨간 이모지 — **4가지 다른 그래픽**

### 12.5 🛠 권장 수정 작업

1. **단일 `<Icon />` 컴포넌트 시스템 도입** — Figma의 SVG path를 토큰화
   - `src/components/icons/{HeartIcon,EyeIcon,CommentIcon,CheckCircleIcon,...}.jsx`
   - filled/outline variant 지원
2. **유니코드 이모지 9개 모두 SVG로 교체** (10분 작업, 위 표 참조)
3. **lucide-react 12개 파일 점진 치환** — Sidebar 9 카테고리 아이콘부터 (가장 노출 많음)
4. **Figma 아이콘 추출** — `mcp__figma__get_design_context`로 카드 stat 영역 노드 호출 → SVG 또는 PNG 다운로드 → 토큰화

### 12.6 📍 위치 아이콘·기타 작은 그래픽도 점검 필요

- FAB `+` 아이콘 — 텍스트 vs SVG?
- 핀 (`📍` 이모지 vs Figma teardrop SVG)
- 검색 돋보기 — `public/Vector.svg` 사용 추정, Figma와 비교 미실시
- 헤더 종 알림 아이콘 (PC 헤더 우상단)
- 화살표 (chevron-right ▶) — 카드 우측 알약 안 화살표가 SVG인지 글리프인지
- 카메라 아이콘 — `public/camera.svg` 사용, Figma와 1:1 비교 미실시

위 항목들은 **별도 라운드로 SVG 추출 + 시각 대조** 필요.

---

---

## Part 13 — 🆘 인터랙티브 요소 결함 (사용자 명시 지적)

> **원칙**: 정적 비교만으로는 부족. 클릭/토글/모달/네비게이션 등 **상태 전이 인터랙션**도 Figma 스펙과 1:1 일치해야 함.

### 13.1 ❌ PC 진단 핀 클릭 → 시민/전문가 동시 노출 (사용자 직접 지적)

- **Figma**: 핀 클릭 시 우측 사이드 패널에 **단일 진단정보** (좌측 사이드패널의 "일반"/"전문가" 탭에 따라 한 쪽만 표시). 즉 일반 탭이면 시민 진단정보만, 전문가 탭이면 전문가 진단정보만.
- **현재 코드** (`PCDiagPanelDetail.jsx:99-162`):
  ```
  <div className="pc-detail-split">
    <section className="pc-detail-col"><h2>시민 진단정보</h2> ...</section>   ← 항상 노출
    <section className="pc-detail-col"><h2>전문가 진단정보</h2> ...</section>  ← 동시에 노출
  </div>
  ```
  좌우 split 레이아웃으로 **두 섹션이 항상 동시 렌더**됨.
- **추가 결함**: `PCDiagnosisMap.jsx`의 좌측 사이드패널에 **"일반/전문가" 탭 자체가 존재하지 않음** (구역별/생활정보/공공시설물 필터만 있음).
- **수정 필요**:
  1. `PCDiagnosisMap.jsx` 좌측 사이드패널 상단에 `[일반] [전문가]` 탭 segment 추가
  2. `PCDiagPanelDetail`에 `mode: 'citizen' | 'expert'` prop 추가
  3. mode 따라 한 section만 렌더 (`.pc-detail-split` → `.pc-detail-single`로 단일 column 변경)
  4. 핀 클릭 시 현재 탭 mode를 `goDetail(item, mode)`로 전달

### 13.2 ❌ 모바일 지도 핀 클릭 → 카드 미연동 (TODO에도 기록)

- **Figma**: 핀 클릭 시 시트 안 카드 미리보기가 해당 핀 데이터로 변경
- **현재 코드** (`MReportMap.jsx:97-99` / `MProposalMap.jsx:111-113`):
  ```jsx
  <PCMapCanvas
    pins={PINS.map((p) => ({ ...p, color: '#E6235A', title: `${p.count}건` }))}
    accentColor="#E6235A"
  />
  // ❌ onPinClick prop 전달 안 함 — 핀 클릭해도 아무 동작 안 함
  ```
- **수정 필요**: `onPinClick={(pin) => setSelectedPin(pin)}` 핸들러 추가 + 시트 카드를 selectedPin 데이터로 변경

### 13.3 ⚠️ 모바일 임시저장 모달 — 자동 노출 vs 수동 트리거

- **Figma** `0:574`/`0:13251` (제보 임시저장 여부 확인) `0:13999`(제안): 폼 진입 시 localStorage에 draft 있으면 **자동으로 모달 노출**
- **현재 코드** (`MProposalForm.jsx:28-38`): draft를 useState로 읽지만 모달 자동 노출 트리거 코드는 별도 검증 필요. `draftMeta` state는 set되지만 modal show 트리거가 명시 안 보임 — 동작 검증 필요
- **수정 필요**: 컴포넌트 마운트 시 useEffect에서 `if (draftMeta) setShowRestoreModal(true)` 호출 확인

### 13.4 ⚠️ 모바일 좋아요 토글 — 비로그인 시 동작 (UX 결함)

- **Figma**: 비로그인 시 좋아요 클릭 → 로그인 유도 모달 추정 (Figma 별도 노드 미식별)
- **현재 코드** (`MReportDetail.jsx:57-76`):
  ```jsx
  const toggleLike = async () => {
    setLiked((prev) => { ... return !prev; });  // optimistic update
    if (!token) return;                          // 토큰 없으면 그냥 종료, UI는 토글됨
    const res = await fetch(...);                // 토큰 있으면 API 호출
  }
  ```
  **문제**: 비로그인 사용자도 좋아요 토글이 시각적으로 작동 (optimistic update만), 새로고침하면 사라짐. Figma 패턴 (로그인 유도) 미구현.
- **수정 필요**: 비로그인 시 로그인 모달 노출하거나 toast 알림

### 13.5 ⚠️ 모바일 투표 토글 (제안 상세) — 동일 패턴

- **현재 코드** (`MProposalDetail.jsx:25-76`): `toggleVote` 동일 패턴
- 비로그인 시 optimistic update만 하고 종료
- **Figma**: 투표 footer 버튼 `투표하기` ↔ `투표 완료` 텍스트 변경 + outline ↔ filled 스타일 전환 — 코드는 OK
- **수정 필요**: 비로그인 처리 동일

### 13.6 ✅ 결과안내 모달 — 동작 OK

- `MReportDetail.jsx:44`에서 `data.currentStage === 'notice'`일 때 자동 모달 노출 (`useEffect`)
- 단계바 `notice` 클릭으로 재호출 (line 106) ✅
- 디자인 일치 (Figma `0:1438`)

### 13.7 ✅ Sort/Location 모달 toggle — 동작 OK

- `MReportList.jsx`/`MProposalList.jsx`: `sortOpen` `locationOpen` state로 모달 toggle ✅
- 백드롭 클릭으로 닫기 ✅
- chevron + 선택 + 하단 "선택" 버튼 패턴 (Figma 일치)

### 13.8 ⚠️ PC 헤더 "제보·제안" 클릭 → chooser 모달 (모바일과 다른 UX)

- **현재 코드** (`PCHeader.jsx:13,129-148`): `chooserOpen` state, 모달 노출 (`어떤 활동을 하시겠어요?` + 제보/제안 카드 선택)
- **Figma**: PC 헤더 `제보·제안` 클릭 시 동작 노드 미식별. 직접 제안하기 폼으로 이동 vs chooser 모달인지 결정 필요
- **모바일 vs PC 일관성**: 모바일은 5탭으로 chooser 제거 완료, PC는 chooser 잔존 — UX 일관성 정책 결정

### 13.9 ❌ 진단 폼 만족도 슬라이더 — 인터랙션 미연결

- **Figma** `0:14163`: 4문항 각 3-step 슬라이더 (😞/😐/😄), dot 클릭으로 선택 → 색상/위치 변화
- **현재 코드** (`MDiagnosisForm.jsx`): 슬라이더 보이긴 하지만 dot 클릭 핸들러 검증 필요. 정적 vs interactive — 캡처상 dot 위치가 default 상태로만 보임

### 13.10 ❌ 댓글 입력 → submit 후 리스트 갱신 (제보·제안 상세)

- **현재 코드** (`MProposalDetail.jsx`/`MReportDetail.jsx`): 댓글 input + 페이퍼플레인 버튼. submit 시 fetch POST → 댓글 리스트 refresh
- **검증 필요**:
  - submit 후 input clear 되는지
  - 댓글 카운트 +1 즉시 반영되는지 (optimistic vs refetch)
  - 토큰 없을 때 처리

### 13.11 ❌ 핀 클러스터 클릭 → 줌인 (Figma 추정)

- **Figma**: 숫자 배지 핀(`12건`)은 클러스터로 추정 — 클릭 시 줌인 또는 카드 펼침
- **현재 코드**: 클러스터 자체 미구현 (Part 1.2 참조)
- **수정 필요**: `pin.count` 패턴 + 클러스터 클릭 핸들러

### 13.12 ❌ 폼 작성완료 활성화 조건 — Figma 미일치 가능성

- **현재 코드** (`MProposalForm.jsx:46`): `canSubmit = type && title.trim() && body.trim()` — 위치/첨부 필수 아님
- **현재 코드** (`MReportForm.jsx:43`): `canSubmit = cat && position && issue && body.trim()` — 위치/카테고리 필수
- **Figma** `0:13859`/`0:454` (작성완료 활성화 상태): 어느 필드가 채워질 때 활성되는지 명시 노드 — 검증 필요
- **불일치 의심**: 제안 폼 위치 입력 없이도 제출 가능 vs 제보 폼은 위치 필수 — 정책 명확화

### 13.13 ⚠️ 임시저장 → 토스트 vs 모달

- **Figma**: 임시저장 클릭 → 토스트 노출 (TODO에 완료 표시)
- **현재 코드**: localStorage 저장 + 토스트 (`handleSaveDraft`)
- **검증 필요**: 토스트 디자인 (위치, 색상, 사라지는 시간) Figma 일치

### 13.14 ❌ Admin 회원관리 — 수정/삭제 액션 인터랙션

- **Figma** `0:7269`: 회원 row의 `수정` 클릭 → `MemberEdit` 페이지/모달 진입
- **현재 코드**: 동작 OK (TODO 검증 완료)
- **검증 필요**: `삭제` 클릭 시 confirm modal 노출 여부 — 삭제 확인 모달 디자인 Figma vs 코드 비교

### 13.15 ❌ Admin 설문 편집 — 질문 추가/복제/삭제 인터랙션

- **Figma** `0:8099`: 우측 플로팅 툴바 5버튼 (질문추가/질문가져오기/섹션추가/이미지/동영상)
- **현재 코드**: 버튼 노출 OK (TODO 완료)
- **검증 필요**:
  - `질문 추가` 클릭 → 새 질문 카드 즉시 추가
  - 질문 카드 toolbar 4 액션 (복제/삭제/필수토글/더보기) 각각 동작
  - `이미지/동영상` 클릭 → 파일 업로드 picker

### 13.16 ❌ PC 헤더 비활성 메뉴 클릭 — UX 결함

- **현재 코드** (`PCHeader.jsx:73`): `target === 'comingSoon'` 체크 후 return — **클릭해도 아무 반응 없음** (silent)
- **수정 필요**: "준비중입니다" toast 또는 cursor:not-allowed (현재) — 사용자 피드백 부재

### 13.17 ⚠️ Hero 카드 클릭 가능 영역 — 홈 4개 카드

- **Figma**: 홈 4개 카드 (`제보하기/제안하기/나의 활동/진단하기`) 각각 해당 화면 진입
- **현재 코드** (`Home.jsx`): onClick 핸들러 4개 모두 정의됨 ✅

### 13.18 ❌ 모바일 하단 네비 active 상태 자동 감지

- **Figma**: 현재 화면에 따라 active 슬롯 자동 변경 (제보 화면 = 제보 슬롯 active)
- **현재 코드** (`MobileBottomNav.jsx`): `activeKey` prop 받아 active 표시 ✅
- **검증 필요**:
  - 진단 화면에서 `진단` 슬롯 active (녹색) — `MDiagnosisList.png` 캡처 OK
  - 제보 상세에서 `제보` slot active 유지

### 13.19 인터랙션 결함 종합 표

| # | 화면 | 인터랙션 | 결함 | 우선순위 |
|---|---|---|---|---|
| 1 | PC 진단 detail | 시민/전문가 동시 노출 | **사용자 지적**. 일반/전문가 탭 분리 필요 | 🔴 P0 |
| 2 | 모바일 지도 (제보·제안) | 핀 클릭 → 카드 변경 | onPinClick 미전달, 정적 카드 | 🔴 P0 |
| 3 | 좋아요/투표 토글 | 비로그인 시 처리 | optimistic만, 새로고침 사라짐 | 🟧 P1 |
| 4 | 진단 폼 슬라이더 | dot 클릭 → 만족도 변경 | 동작 검증 필요 | 🟧 P1 |
| 5 | 임시저장 모달 자동 노출 | 폼 진입 시 draft 있으면 모달 | 트리거 코드 검증 필요 | 🟧 P1 |
| 6 | 핀 클러스터 클릭 | 줌인/카드 펼침 | 미구현 | 🟧 P1 |
| 7 | PC 헤더 비활성 메뉴 클릭 | 피드백 (toast/tooltip) | silent return | 🟨 P2 |
| 8 | Admin 삭제 confirm | 삭제 확인 모달 | 디자인 검증 필요 | 🟨 P2 |
| 9 | Admin 설문 편집 toolbar | 질문 추가/복제/삭제 | 인터랙션 검증 필요 | 🟨 P2 |
| 10 | 댓글 submit 후 갱신 | input clear + 카운트 +1 | 검증 필요 | 🟨 P2 |
| 11 | 폼 작성완료 활성화 | 필수 필드 정의 | 제보/제안 정책 모순 | 🟦 P3 |
| 12 | PC chooser 모달 | 제보/제안 선택 | 모바일은 제거, PC만 잔존 | 🟦 P3 |

---

## 🚨 우선순위별 액션 요약

### 🔴 P0 (UX 명백한 결함)

1. **PC 진단 셸 헤더 z-index 충돌** — 헤더가 panel을 가려 글자 겹침. PCDiagnosisMap.css 헤더 위치/z-index 픽스
2. **PC 제안 상세 / 제보 상세 본문 누락** — `(제목 없음)` + Hero + 지도 + 댓글만 표시. 본문 단락 컴포넌트 추가 + 백엔드 데이터 연결
3. **모바일 제보 상세 본문/작성자/Hero 누락** — Figma 대비 데이터 + 본문 영역 모두 미노출
4. **모바일/PC 지도 핀 클러스터 숫자 배지** — Figma는 핀에 카운트 배지(`12` 등) 노출, 코드는 핀만. `pin.count` 패턴 사용 (TODO 기록)
5. **유니코드 이모지·글리프 9개 사용처 → SVG 교체** — `❤️` `❤` `♥` `👁` `🗳` `✉️` 등 OS·폰트 의존. Figma 벡터와 절대 미일치. (Part 12.1)
6. **lucide-react 12개 파일 잔존** — 프로젝트 정책 명시 금지. Sidebar 9 카테고리 아이콘부터 Figma SVG로 치환 (Part 12.2)
7. **카드 stat 아이콘 4가지 그래픽 혼재** — 같은 좋아요 카운트인데 모바일=lucide SVG path, PC=빨간 이모지, PC지도=카드슈트 ♥, Admin=빨간 이모지. 단일 `<HeartIcon />` 컴포넌트로 통합 (Part 12.4)
8. **PC 진단 detail 시민/전문가 동시 노출** — `pc-detail-split`이 두 column 항상 렌더. 일반/전문가 탭 분기 + 단일 column 표시 (Part 13.1)
9. **모바일 지도 핀 클릭 → 카드 미연동** — `MReportMap`/`MProposalMap`에서 `onPinClick` 미전달, 핀 눌러도 무반응 (Part 13.2)

### 🟧 P1 (디자인 일치)

5. **모바일 폼 카메라/위치/카테고리 칩 일관성** — 제보 폼 카테고리 4개(Figma) vs 8개(코드), PC 폼은 8개 동일
6. **제안 폼 라디오 디자인** — Figma는 filled gray dot, 코드는 outline radio
7. **제보 리스트 카드 sub-tag 색상** — Figma는 단일 핑크, 코드는 카테고리별 다양 색
8. **제보 상세 단계 모달 자동 노출** — 결과안내 step 진입 시 modal 자동 (TODO에선 완료 표시 — 재검증 필요)
9. **모바일 지도 검색바** — Figma는 좌상단 작은 알약, 코드는 풀폭 검색 input
10. **진단 결과 (시민)** — Figma 데이터 표 + radar 4종 vs 코드 카테고리 그리드 + radar 1종

### 🟨 P2 (디테일 / 미구현)

11. **PC 제안/제보 폼 폭** — Figma는 좁은 폼 (max-width ~700), 코드는 1024+ 풀폭
12. **PC 제안/제보 폼 위치 input 2개 vs 1개** — Figma는 단일 알약, 코드는 알약 + 상세주소 input 2-input
13. **데이터 mock seed** — 모바일 제안 리스트 더미가 너무 많음 (UX 저해), Figma는 4-5개만
14. **전문가 진단 분기** — 코드 미구현 (`ExpertDiagnosisResult.jsx` stub)
15. **Admin 미구현 페이지** — 진단관리/공공데이터관리/공지사항/홍보/AI가상시민 현황 — Figma에는 일부 있음 (TODO 기록)
16. **verify/routes.json 누락 view** — `mProposalForm/mProposalDone/mReportDone/mSurveyJoin/mSurveyDetail2/mSurveyDone` 등록 필요 (자가검증 불가)

### 🟦 P3 (정책 결정)

17. **카테고리 분류 통일** — 제보 4개(Figma 모바일) / 제보 8개(코드 PC + Figma PC) / 제안 8개 / 필터 9개 — 명세 정리 필요
18. **본문 bullet 스타일** — Figma는 numbered + 빨간 ▸, 코드는 disc — 통일
19. **PC 제안/제보 상세 footer `목록으로` 버튼** — Figma 없음, 코드만 있음
20. **PC 헤더 비활성 메뉴 표기** — `AI가상시민/공공데이터` 회색 처리 vs Figma 활성 표시 — 정책 결정

---

## 📎 캡처 파일 위치

- **Figma 원본**: `/tmp/figma-compare-2026/{mobile,pc,admin}/*.png`
- **로컬 캡처**: `verify/screenshots/*.png` + `verify/screenshots/{admin,pc-propose-report,pc-survey,pc-diagnosis-flow}/*.png`
- **Figma 참조 사본**: `verify/figma-refs/{,mobile/}*.png` (이전 라운드 보존본)

## 🧪 검증 방법 (재현)

```bash
# 1. dev 서버 기동 (kill 금지 — memory `feedback_keep_servers_running`)
npm run dev                         # Vite, port 8501
cd backend && python3 -m uvicorn main:app --reload  # FastAPI, port 8000
docker compose up -d                # MariaDB

# 2. 로컬 캡처 갱신
npm run verify:fe                   # 42 routes 자동 캡처
node verify/admin_shots.mjs         # admin 14 화면 (PC 1440 viewport + 로그인)
node verify/pc_propose_report_shots.mjs   # PC 8 화면
node verify/pc_survey_shots.mjs           # PC 6 화면
node verify/pc_diagnosis_shots.mjs        # PC 진단

# 3. Figma 캡처 (필요 시)
# mcp__figma__get_screenshot 호출 → curl로 다운로드
```
