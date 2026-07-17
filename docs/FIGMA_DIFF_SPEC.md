# 모바일 전수 Figma diff 명세 (2026-06-10)

> 기준: WDC Figma `TCuOzEqNhoLKjhF0reBDks` page `0:1` (모바일 전용 큐레이션, 최신=캔버스 아래쪽 프레임).
> 앱 캡처: 390×844 fullPage (`/tmp/figma-compare/app/`), Figma 캡처: `/tmp/figma-compare/figma/`.
> 공통 주의: **하단 네비는 잠금 스펙** (홈/설문/제보·제안/진단/나의활동, 노드 22:6021) — Figma 구프레임의 "제보/제안 분리 5탭" 네비 차이는 전부 **무시** 대상이며 본 문서에서 제외.
> fullPage 캡처에서 fixed 요소(하단네비/푸터버튼)가 본문 중간에 찍히는 것은 캡처 아티팩트로, diff 아님.
>
> **2026-06-10 적용 현황**: P0/P1/P2 항목을 영역별 서브에이전트로 일괄 적용 후 빌드 통과 + verify 시각 검증 완료. `[x]`=적용·검증, `[ ]`=보류/데이터대기(사유 인라인).

## 설문 (보라 #5B2EAB)

### mSurveyList — Figma 0:11392 ✅ 사실상 일치
- 카드 구조/타이포/chevron 원형 버튼/탭 pill 모두 일치. 수정 불요.

### mSurveyDetail1 — Figma 0:11251
- [x] **복사하기 버튼 스타일**: 테두리 제거 (`.m-hero-copy` 투명 bg·무테).
- [x] **안내 불릿 아이콘**: ›→∨ (보라) 방향 교체.
- [x] **정보 카드 '내용' 행 line-height 과다**: 2.1→1.5 축소.
- [x] **히어로 타이틀 상단 여백**: padding-top 12→44px, 2줄 래핑 허용.

### mSurveyDetail2 (개인정보 동의+응답자 정보) — Figma 0:11289
- [x] **약관 불릿 그룹 박스**: `.m-consent-box` 둥근 테두리 박스로 래핑.
- [x] **체크박스/라디오 색상**: 보라→teal (`#23bdbb`) 교체 (Figma 우선 결정).
- [x] **작성자 기본정보 레이아웃**: 흰 카드 + 라벨 좌측 열 + 옵션 우측 2열 + 행 divider로 재구성.
- [x] **'이용 기기'·'직업' 기타 자유입력 input**: `deviceOther`/`jobOther` 추가.
- [x] **성명/휴대폰번호 행**: 라벨 좌 + input 우(인라인, max-width 234px).
- [x] mSurveyDetail1과 동일한 복사하기/히어로 여백 diff 적용 (공용 CSS).

### mSurveyJoin — Figma 0:11000
- [x] **헤더 구조**: back 단독 행 + "설문조사"(보라)+진행바 2행 구조.
- [x] **진행 표시**: 트랙+보라 dot+짧은 fill.
- [x] **5점 척도(Likert) 문항 UI**: `qtype==='scale'|'likert'` 렌더러 이미 구현 확인(가로 트랙+5원형+라벨).
- [x] **선택된 객관식 카드**: `.m-q-option.on` 보라 채움+흰 텍스트/체크 이미 일치.
- [x] **이전/다음 버튼 위치**: fixed 푸터 → in-flow(문항 아래)로 이동.
- [x] **하단 네비 노출**: 참여 중 `MobileBottomNav` 제거(노출 안 함).

### mSurveyResults — Figma 0:11066 ⚠️ 데이터 부재로 부분 비교
- [x] **복사하기 버튼**: 히어로 copy 버튼 제거(뒤로가기만).
- [x] **기간 pill 포맷**: `2026.03.16 - 2026.04.05`(점 표기, 세로 구분선 제거, 인원 우측 정렬).
- [ ] **차트 섹션 비교**: 레이더/도넛/가로막대 랭킹/버블/세로막대 5종 모두 **코드 구현 확인됨**. 단 응답 데이터 0건이라 빈 상태 — **응답 데이터 시드 후 픽셀 재비교 대기**(신규 차트 추가 불요).

### mSurveyDone — Figma 0:11239 ✅ 일치
- 픽셀 수준 일치. 수정 불요.

## 제안 (핑크 #E6235A/#f74e7e)

### mProposalList — Figma 0:11429 — 거의 일치
- [x] **이미지 없는 카드의 썸네일 영역**: 이미지 있을 때만 썸네일 렌더(없으면 텍스트 풀폭).
- [x] (검증) 카드 meta 아이콘 색: 현재 `#f74e7e`(2026-06-04 디자이너 최신 의도) 유지 — 회색 회귀 안 함.

### mProposalMap — Figma 0:11757 ✅ 사실상 일치
- [x] 시트 카드 썸네일도 이미지 없을 때 숨김(`it.hasImage &&`) 이미 적용 확인.

### mProposalForm — Figma 0:13561 (B1_제안작성 신버전)
- [x] **back 버튼 텍스트**: "뒤로" → "홈으로".
- [ ] **카테고리 라벨 3종**: **보류** — PC(`ProposalList`/`ProposalForm`="및" vs `PCProposeForm`="·")가 내부 불일치이고 DB 실데이터·`catStyles`는 "·"를 씀. canonical 통일 결정 대기. 현상태 무손상 위해 모바일 폼 라벨은 "·"(산업·일자리 등) 유지.
- [x] **첨부자료 add 박스 테두리**: dashed → solid 연회색.
- 나머지(타이틀/input/crosshair/임시저장+작성완료 flex/안내문구)는 일치.

### mProposalDetail — Figma 0:12110 (제안상세 전체)
- [x] **이미지 없을 때 히어로 placeholder**: `{imageUrl && ...}`로 없으면 숨김.
- [x] **댓글 입력창 위치**: divider 바로 아래(댓글 리스트 위)로 이동.
- [x] **답글달기 링크**: 각 댓글 하단 "답글달기" UI 추가.
- [x] **첨부파일 다운로드 행**: 파일명 행 렌더 이미 존재(`proposal.files`). 단 `[hwp, 328KB]` 확장자·용량 메타는 데이터에 없어 미표기 → **백엔드 파일 메타 필요**.
- [x] **좋아요/댓글 카운트 위치**: `m-detail-meta-row` space-between 우측 정렬 이미 일치.
- [x] 날짜 포맷: `formatDate`로 `YYYY.MM.DD` 통일.
- cat 태그 색상 variant는 기존 유지.

### mProposalDone — Figma 0:14109 ✅ 일치
- 구조/일러스트/버튼 일치. (font-weight 미세 차이 우선순위 낮음)

## 제보 (핑크)

### mReportList — Figma 0:12290 ✅ 사실상 일치
- 카드/sub-tag/상태탭/FAB/meta 핑크 아이콘 모두 일치. 수정 불요.

### mReportMap — Figma 0:12148
- [x] **검색바**: back 제거 + placeholder 단축(`showBack={false}` `placeholder="검색"`).
- [x] **개별 핀 모양**: 단건도 `count:1` 부여 → 숫자 배지 핀으로 통일(`PCMapCanvas` 규약 활용, 공유파일 무수정).
- [ ] (검증) 시트 "부산전체 >" 지역 헤더: 시트 스냅 상태 차이로 판단, 제안지도와 동일 구조 → **보류**(현행 유지).

### mReportForm — Figma 0:12713 (제보하기01 최신)
- [x] **카테고리 칩 개수**: 8→4개(주거/환경/교통/안전). [삭제: 교육, 산업·일자리, 문화·여가, 보건·복지]
- [x] **상세설명 placeholder**: "상세설명을 작성해주세요"로 환원.
- [x] **카테고리 칩 스타일**: 회색 채움(#eee, 무테)로.
- 사진등록/위치정보/드롭다운+"에"/"불편해요" 구조는 일치.

### mReportDetail — Figma 0:12760
- [x] **답글쓰기 링크**: 각 댓글 하단 "답글쓰기" UI 추가.
- 그 외 topbar 태그/작성자 2줄/divider/미니맵/날짜·조회수/진행단계 pill 모두 일치.
- 결과안내 모달(0:12866)은 기존 수정 완료 이력 있어 보류.

### mReportDone — Figma 0:13324 ✅ 일치
- 수정 불요.

## 나의 활동

### mMyReportDetail — Figma 0:5923 (Z3c_나의제보글 보기)
- [x] **상태 배지 위치**: topbar 우측 → 작성자 행 우측 이동 + 단계별 색상 변형(접수=민트/검토중=노랑/검토완료=블루/결과안내=핑크).
- [x] **작성자 행 2줄 구조**: 이름(1줄)/지역·날짜(2줄) + 날짜 복원.
- [x] **본문 위치**: 제목 바로 아래(이미지 위)로 이동.
- [x] **날짜·조회수 행 날짜 복원**: `YYYY.MM.DD · 조회수 N`(날짜 없으면 · 생략).
- [x] **답글쓰기 링크** 추가.
- [x] (검증) 댓글 입력창: 명세 불확실 → 기존 동작(노출) 유지.
- 하단 삭제/수정 버튼 일치.

### mMyReportEdit — Figma 0:5664 (Z4c_수정하기)
- [x] **사진 등록 add 박스**: 88px 둥근 연회색 테두리 박스 복원(신규 `MMyReportEdit.css` 생성).
- [x] **위치정보 crosshair 아이콘**: input 내부 우측 오버레이로 이동.
- [x] **카테고리 칩 4 vs 8**: 4개로.
- 상세위치/드롭다운+"에"/"불편해요"/수정완료 버튼 구조 일치.

## 진단 (청록 #23BDBB)

### mDiagnosisList — Figma 22:6281 (최신 섹션 y60255)
- [x] **헤더**: "일반 진단" 타이틀 행 제거 → "시민/전문가" 모드탭(active teal).
- [x] **카드 내용 구성**: 좋아요/댓글 제거, 점수 표기(검정 bold) 도입, 한줄평 1줄 ellipsis, 우측 썸네일.
- [x] **카테고리 칩**: 2행 래핑 → 1행 가로 스크롤.
- [x] **accent green 잔존**: 헤더/active 칩 green → teal `#23BDBB` 전치환.

### mDiagnosisForm — Figma 22:6734 (진단하기_시민)
- [x] **back 버튼 텍스트**: "뒤로" → "홈으로".
- [x] **사진등록 add 박스**: 거대 + → 둥근 테두리 박스 + 작은 + 아이콘(`object-fit:contain`).
- [x] **만족도 평가(5점 face 슬라이더)**: 트랙+5dot+얼굴 1·3·5 이미 구현, dot active green→teal.
- 작성완료 teal/임시저장 구조 일치.
- (전문가 변형 22:6901도 teal 공통 적용됨.)

### mDiagnosisResult — Figma 22:6387 (시민)
- [x] **헤더 타이틀**: "일반 진단 결과"(green) → "시민 진단 결과"(teal).
- [x] **레이더 차트 컬러 섹션별**: 전체평균 핑크/시설물별 보라/구역별 파랑/인원별 teal.
- [x] **댓글 스타일**: 연회색 버블 카드 + 작성자 bold + 날짜 우측 + 휴지통(삭제) 아이콘.
- [x] 차트 섹션 타이틀: breakdown "n.nn 평균(count)" 행 제거, 타이틀 한 줄.
- [x] 진단일 포맷: `2024/05/16` → `2024-05-16`(슬래시→하이픈 정규화).
- (전문가 결과 22:6608 별도.)

### mDiagnosisDone — Figma 22:7205
- [x] **컬러**: green `#06AB69` → teal `#23BDBB` 재적용(`MDiagnosisDone.jsx` + `CheckDone.jsx` btnLabel prop).
- [x] **버튼 텍스트**: "홈으로 이동" → "진단 홈으로 가기"(+`mDiagnosisList`로 이동).

## AI 가상시민

### mAICitizen — Figma 22:7220/22:7438/22:7564
- [x] **상단 헤더 행**: "< AI 가상시민" 헤더 제거(검색바만).
- [x] **말풍선**: 흰색+아바타 → 민트(teal) bg 말풍선 + 아바타 제거.
- [x] **지도**: 구획 흰색 + 선택 구 teal `CircleMarker` 원형 하이라이트 추가.
- [x] **시민 카드**: 아바타 제거 + teal 테두리 카드 + 점선 divider + teal chevron.
- 시트 타이틀/해시태그 칩/중요도순 정렬은 일치.
- (부수: 미사용 avatar state/fetch 정리.)

## Figma 프레임 부재로 비교 불가 (WDC page 0:1에 없음)
- `home`, `login`, `signup`, `mNotifications`, `mDiagnosisMap`, `MyPage`/`myActivity` 허브 — 디자이너 프레임 위치 확인 필요.
- 하단 네비는 잠금 스펙(22:6021) 유지.

---

## 총평 / 우선순위 — 적용 완료 (2026-06-10)

- **P0 (깨짐/회귀)**: 진단 green→teal 전치환, mMyReportEdit 사진박스·crosshair, mMyReportDetail 날짜·본문·배지, mProposalForm back 텍스트 — **완료** (카테고리 라벨만 보류).
- **P1 (구조)**: mSurveyDetail2 작성자 레이아웃, mDiagnosisList 점수 카드, mSurveyJoin 헤더/버튼, mProposalDetail 댓글/답글/날짜, mDiagnosisResult 헤더/차트/댓글 — **완료**.
- **P2 (정책/확인)**: 제보 카테고리 4, mReportForm placeholder·칩, mAICitizen 말풍선/카드, 설문 teal — **적용**(사용자 "전부 적용" 결정). 단 **제안 카테고리 라벨 canonical**·**mSurveyResults 차트 데이터 재비교**·**mProposalDetail 파일 메타(백엔드)**는 후속.

> 검증: 빌드 통과 + verify 시각 캡처 대조 완료(설문 모바일/AI가상시민은 verify route 미등록분 다수 — 빌드·코드 검증). 진단/제보/제안/나의활동 핵심 화면은 토큰+시드로 실화면 캡처 확인.
