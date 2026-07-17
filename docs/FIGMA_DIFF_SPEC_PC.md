# PC 전수 Figma diff 명세 (2026-06-10)

> 기준: Figma `hJCPXp7YcYUL60u2NHiYrS` ("디자인 자료 공유_인터넷방송국") page `0:1` — 사용자 지정 PC 스펙 파일. 최신=캔버스 아래쪽 프레임 규칙 적용 (스킵한 구버전 섹션: 759:4729 제보 old, 631:3558 제안폼 old 등).
> 앱 캡처: 1280폭 fullPage 26종 (`/tmp/figma-compare-pc/app/`), Figma 캡처: 53프레임 (`/tmp/figma-compare-pc/figma/`, REST API).
> 공통: Figma 헤더 로고 "PDDP(가안)"는 outdated — 코드 "WDC" 유지 (확정). Figma=1920 디자인, 앱=1280 캡처라 절대 px가 아닌 구조/스타일 기준으로 비교.
>
> **2026-06-10 적용 현황**: 설문/제안/제보 영역 `[ ]` 항목을 서브에이전트로 적용 후 빌드 통과 + verify(1280 viewport) 시각 검증. `home`(신규 대시보드 풀구현)·`login/signup`은 스코프/정책 사안이라 **미적용·플래그**. `[x]`=적용·검증, `[ ]`=미적용/데이터·스코프 대기(사유 인라인).

## 홈/인증

### home (PC) — Figma 389:4023 (USER: 홈) ⚠️ 대규모 미구현 — **스코프 결정 대기 (미적용)**
Figma 홈은 풀 대시보드형 — 앱은 히어로+액션카드 4종뿐. 아래는 전부 **신규 구현 스코프** 사안으로 이번 자동 적용에서 제외:
- [ ] **카테고리 아이콘 탭 스트립** (8종 아이콘 행) — 미적용(스코프)
- [ ] **가상시민 아바타 카드 캐러셀** (6카드) — 미적용(스코프)
- [ ] **통계 카드 3종** — 미적용(스코프)
- [ ] **차트 섹션** (가로막대+도넛+라인, 자세히보기) — `Home.jsx` `{false &&}` 비활성 블록 연관, **사용자 결정 대기**
- [ ] **우수 사례 아카이브** (사진 카드 캐러셀) — 미적용(스코프)
- [ ] **플랫폼 소식 리스트 + "처음 방문하셨나요?" 카드** — 미적용(스코프)
- [ ] **다크 푸터** — 미적용(스코프)
- [ ] **히어로**: Figma=일러스트 지도 vs 코드=카카오 라이브 지도 — 의도 확인 필요
- [ ] **브랜드 컬러** 레드/핑크 vs teal/보라 — 홈 리뉴얼 정책 결정 사안
> **요약: 이 Figma 홈은 사실상 신규 페이지 스펙. 픽셀 diff가 아니라 구현 스코프 결정이 선행돼야 함 → 미착수.**

### login — Figma 833:13334 ⚠️ admin 로그인 프레임 (USER용 아님)
- [?] USER PC 로그인을 admin 스타일로 통일할지 디자이너 확인 필요. **현행 유지** (회원가입/찾기 링크 보존).

### signup — Figma 프레임 없음 → 비교 불가, 현행 유지.

## 설문 (보라 #5B2EAB)

### pcSurveyList — Figma 846:7221 ✅ 사실상 일치
- 수정 불요.
- [?] 헤더 "공공데이터" 메뉴 활성화 정책 확인.

### pcSurveyDetail — Figma 846:7269
- [x] **조사기간 표기**: 전체 범위 → `~종료일`(`~2026-05-24`) 형식(`formatEndDate`).
- [x] 히어로 아래 페이지 배경: 연회색 → 흰색.
- 정보 카드/안내 불릿(∨)/이용약관/참여하기 일치.

### pcSurveyConsent — Figma 846:8030
- [x] 수집항목/동의서 안내 박스: 연회색 채움(fill) → 흰 배경 1px 보더 박스(stroke).
- [?] 연령 라디오 줄바꿈 — 1280 캡처 폭 영향, 불확실.

### pcSurveyJoin — Figma 846:7306
- [x] **Likert 슬라이더 문항 타입 구현**: `q.qtype==='scale'|'likert'` 분기 추가(트랙+5원형 노브+"전혀 아니다/보통/매우 그렇다" 라벨, 1-5 값). 단 현재 시드 설문에 scale 문항 없어 시각 트리거는 데이터 대기.
- [x] 옵션 카드 컴팩트: padding/font/gap 축소(2열 유지).
- [?] 선택 시 카드 보라 솔리드 채움 — 미선택 캡처라 미검증.

### pcSurveyResults — Figma 846:7385
- [x] **버블(워드클라우드형) "가장 개선 필요 항목" 차트 구현**: recharts `ScatterChart`+`ZAxis`(z=값)+`LabelList`. 단 응답 0건이라 빈 상태 — 데이터 시드 후 픽셀 재비교 대기.
- RadarChart/Donut/종합결과는 기존 존재. 빈 카드/0데이터는 응답 0건 탓(차트 정상).

### pcSurveyDone — Figma 846:7554
- [x] **버튼 구성**: "결과 보기"+"홈으로 이동" 2개 → "홈으로 이동" 단일 보라 솔리드 중앙 버튼.
- 체크 아이콘/타이틀/문구 일치.

## 제안 (핑크 #E6235A)

### pcProposeMap — Figma 847:9583 ✅ 사실상 일치
- [?] 핀 스타일 count 배지 여부(데이터 의존). 코드상 CTA/지역 드롭다운 존재 확인.

### pcProposeForm — Figma 847:9457 ✅ 일치 / pcProposeDone 847:9486 ✅ 모달 구현 확인
- 수정 불요. 위치설정·임시저장·완료 모달 모두 코드 존재 확인.

### pcProposeDetail — Figma 848:12844
- [x] **투표 버튼 아이콘**: 체크마크 polyline → 하트 path(미투표=핑크 아웃라인, voted=채움, `currentColor` 상속).
- 사진 슬롯/투표 모달 코드 존재 확인.
- [?] 하트 색 정확히 `#E6235A` 통일 시 공유 `PCDetailShared.css`(`#f74e7e`) 변경 필요 — 공유파일이라 미적용(보고).

### proposalList — Figma 631:15160 — 거의 일치
- [?] 카테고리 칩 라벨 세트 canonical 재확인(모바일 스펙 카테고리 결합 이슈와 연동 — 보류).

### pcMyProposalDetail — Figma 830:7090 — 거의 일치
- 삭제 확인 모달 구현 확인. 디테일만 시각 대조 잔여.

## 제보 (핑크 #E6235A)

### pcReportMap — Figma 848:12900 ✅ 거의 일치
- 카운트/정렬/구 칩 코드 존재 확인.
- [?] 정렬 라벨(추천순/필터/최신순 vs 조회수/투표순/최신순) 디자이너 확인.
- [?] 우측 세로 컨트롤 스택/좌측 듀얼 카드 미세 확인.

### pcReportForm — Figma 848:13217 (01)
- [x] **위치정보 2분할 입력**: `detailAddress`(detailed_address) 필드 추가, [지도주소]+[상세주소 "예: 1층 오른쪽 표지판 앞"] 가로 2분할. draft/submit payload 포함.
- [x] **사진 다중 등록**: `photo`(단일) → `photos`(배열) + `<input multiple>` + 썸네일 그리드 + "+" 추가 + 개별 삭제. **단 백엔드 `ReportCreate`가 `image_url` 단일만 영속 → 2번째 이후 사진 드롭(백엔드 멀티 이미지 저장 후속 필요).**
- [?] 헤더 드롭다운/문제사항 옵션셋 정합 — 변경 없음(확인만).

### pcReportDone — Figma 848:13272 ✅ 모달 구현 확인
- 디테일만 시각 대조 잔여.

### pcReportDetail — Figma 848:13347 (Detail1)
- [x] **개선완료 결과 배너**(Detail1b): `status==='개선완료'||'결과안내'`일 때 본문 아래 핑크 배너("답변이 등록되었습니다/개선완료"+결과사진+결과보기) 조건부 렌더 구현. *상세는 API에서 리포트를 fetch하므로 시각 트리거는 status=개선완료 데이터 필요.*
- [x] **개선 결과보기 모달**(Detail1b): 결과 사진+닫기/확인 모달(`pcd-result-*`) 구현.
- [x] **본인 글 "수정하기" 버튼**: 소유자(`user_name===author`)일 때 타이틀 우측 핑크 버튼 → `pcMyReportEdit`로. *동명이인 오탐 한계: 정확히는 `user_id` 비교 권장(컴포넌트에 /users/me 미호출).*
- [x] **좋아요 버튼 활성 스타일**: `.pcd-vote-circle.voted` 솔리드 핑크+채운 하트 이미 일치 확인.

## 나의 활동 (제보)

### pcMyReportList — Figma 830:7233 ✅ 거의 일치 (3열 CSS 확인, 캡처 2열은 데이터 탓)
- [?] 서브탭 기본 active(개선중 핑크 채움 vs 전체 outline) 확인.

### pcMyReportEdit — Figma 830:7365 ✅ 일치
- [?] "수정완료" 버튼 폼 충족 시 솔리드 핑크 활성화 확인.

### myPage — 대응 Figma 없음 → 현행 유지.

## 나의 활동 (제안)

### pcMyProposalList — Figma 631:15635 ⚠️ PC 전용 컴포넌트 없음
- 코드 확인: `MyProposals.jsx` (모바일+데스크톱 반응형 통합) 사용 중. PC 전용 리스트 컴포넌트 분리 없음.
- [?] Figma 프레임 미수신(레이트리밋) — 구조 상세 비교 보류. Figma 확보 후 재비교 필요.

### pcMyProposalVoted — Figma 631:15828
- [?] Figma 프레임 미수신 — 비교 보류. 앱에서 "투표한 제안" 탭 구현은 `MyProposals.jsx`에 포함 여부 확인 필요.

### pcMyProposalEdit — Figma 631:16075 ✅ 구현 확인
- 코드 확인: `ProposalForm.jsx`의 `isEdit=true` 모드로 재사용. 수정 기능 구현돼 있음.
- [?] Figma 프레임 미수신 — 시각 대조 보류.

## 진단 (청록 #23BDBB)

### pcDiagnosisMap — Figma 941:9763 — 코드 분석 (Figma 미수신)
- 구조: `PCDiagnosisMap.jsx` (397줄), 4개 뷰(`pcDiagnosisMap/Detail/Form/Done`)를 `panel` state로 통합 관리
- [ ] **중분류/소분류 드롭다운 필터 미연결**: 셀렉트 UI는 존재(`PCDiagnosisMap.jsx:244~257`)하나 onChange 핸들러·옵션·필터링 로직 없음 → 미구현 확정
- [ ] **대분류 체크박스 필터 미연결**: `bigSel` state 있으나 `items` 필터링에 미반영(`PCDiagnosisMap.jsx:145~150`)
- [?] Figma 프레임 미수신 — 전체 레이아웃 대조 보류

### pcDiagnosisList — Figma 1004:9003 — Figma 미수신
- [?] 비교 보류

### pcDiagnosisFormCitizen — Figma 1004:10854 / pcDiagnosisFormExpert — Figma 1004:11116
- `panel='form'` 진입 시 `PCDiagPanelForm` 컴포넌트 렌더. 시민/전문가 분기 코드 내부 처리.
- [?] Figma 프레임 미수신 — 세부 필드 비교 보류

### pcDiagnosisResultCitizen — Figma 1004:9789 / pcDiagnosisResultExpert — Figma 1004:10157
- [?] Figma 프레임 미수신 — 비교 보류

### pcDiagnosisDone — Figma 1004:11550
- [?] Figma 프레임 미수신 — 비교 보류

## AI 가상시민

### pcAICitizen01 — Figma 1001:9563 / pcAICitizenDetail — Figma 1003:6742 — 코드 분석 (Figma 미수신)
- 구조: `PCAICitizen.jsx` (1015줄), 리스트+상세 통합
- API: `GET /api/ai-citizens` (카테고리 필터), `GET /api/ai-citizens/{id}/avatar` (아바타 이미지), `POST /.../avatar/regenerate`
- 기능: 구역 필터 칩, 생활정보 카테고리 칩, 호버 버블(아바타+말풍선), 상세 패널(여정지도/감정라인/정책신호등/레이더·막대 차트 토글) 모두 구현됨
- null 안전성: 모든 `.map()` 전 null 체크·`?.` 연산자 완비 — 렌더링 버그 없음 확인
- [?] Figma 프레임 미수신 — 레이아웃/컬러 상세 비교 보류

> **진단/AI가상시민/나의제안 PC Figma 13프레임**: REST API 레이트리밋(429) 6회 이상 실패, 현재 미수신. 코드 분석 기반 부분 기술. Figma 쿼터 리셋 후 재비교 필요.

---

## 총평 — 적용 완료 (2026-06-10)

- **설문**: pcSurveyDetail(기간/배경), pcSurveyConsent(보더박스), pcSurveyJoin(Likert 슬라이더+컴팩트), pcSurveyResults(버블차트), pcSurveyDone(단일버튼) — **완료**.
- **제안**: pcProposeDetail(투표 하트) — **완료**.
- **제보**: pcReportForm(위치 2분할+다중사진), pcReportDetail(개선완료 배너+결과모달+수정버튼+좋아요) — **완료**.
- **후속**: ① home 대시보드 = 신규 페이지 스코프 결정 대기(미착수) ② 다중사진/개선완료 status = 백엔드 데이터·영속 필요 ③ 제안 카테고리 라벨 canonical(모바일 스펙과 연동) ④ 데이터 0건 차트 재비교 ⑤ `[?]` 디자이너 확인 항목들.

> 검증: 빌드 통과 + verify 1280 viewport 캡처 대조(설문 5뷰·제안상세·제보폼/상세). 상세/폼의 조건부·데이터 의존 UI는 코드+빌드 검증, 시각 트리거는 데이터 상태 대기.
