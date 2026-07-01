# 부산 BDP — 미완료 항목

> **갱신**: 2026-06-15 (완료 항목 정리 — `[x]` 전량 제거, 미완/대기 항목만 유지)
> **Figma 파일**: 모바일 = WDC `TCuOzEqNhoLKjhF0reBDks` page 0:1 / PC = `hJCPXp7YcYUL60u2NHiYrS` page 0:1
> 모바일 전수 diff 상세 = `FIGMA_DIFF_SPEC.md`, PC = `FIGMA_DIFF_SPEC_PC.md`. 완료 이력 = `CHANGES_2026-05-06.md`.

`[ ]` = 미완 / `[?]` = Figma·디자이너 확인 또는 정책결정 대기

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
