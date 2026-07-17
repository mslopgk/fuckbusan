---
name: 진단(Diagnosis) 04/23 업데이트 디자인 토큰
description: Figma 941:5782의 진단 영역 색상/폰트 토큰 — 기존 핑크/퍼플 테마와 다른 그린 테마
type: project
originSessionId: 4d61babc-b41a-4f3f-8017-939ee251c222
---
진단 04/23 업데이트(Figma 941:5782)는 새로운 **그린 테마**를 사용. 기존 코드의 진단 모드별 색(핑크 #E6235A, 퍼플 #542AA3)과 다름.

**색 토큰:**
- Primary green: `#06AB69`
- 카테고리 칩 배경: 주거 `#DFF8F8`, 환경 `#C0E6C0`, 교육 `#FFC9C9`
- 텍스트: 메인 `#242424`, 보조 `#737373`, 비활성 `#BFBFBF`
- 흰 배경 카드 위 그림자: `0 0 10px rgba(0,0,0,0.1)`

**Why:** Figma에 명시된 새 디자인. 기존 `App.jsx`의 `theme` 객체 (line 568-570)는 일반/전문가 진단 모드에 따라 핑크/퍼플로 분기하지만, 새 모바일 진단 화면은 그 분기와 무관하게 그린 단색.

**How to apply:** 새 `M*Diagnosis*` 컴포넌트는 그린(#06AB69) 단일 테마로 만들고, App.jsx의 기존 `theme.primary`/`progressBarColor` 분기에 의존하지 않음. CSS에서 `--diag-green: #06AB69;` 변수로 정의하면 차용 시 일관성 ↑.

**진단 04/23 PC 색 테마:**
- Primary: `#23BDBB` (teal) — 모바일의 그린 #06AB69와 다름. PC nav active, CTA, 핀, 카테고리 active, 체크박스 모두 이 색
- 모바일=그린, PC=틸 별도 운영. 같은 진단 도메인이지만 디바이스별 다른 브랜드 톤 사용

**진단 컴포넌트 매핑:**
- Mobile: `MDiagnosisList`, `MDiagnosisForm`, `MDiagnosisResult`, `MDiagnosisDone` — view name `mDiagnosis*`
- PC: `PCDiagnosisMap`, `PCDiagnosisForm`, `PCDiagnosisDetail`, `PCDiagnosisDone` — view name `pcDiagnosis*`
- PC Detail (`PCDiagnosisDetail`)은 placeholder. Figma 941:11592/11961 디자인 미분석. 카드 클릭 시 진입하는 상세 페이지. 현재 임시 디자인.
- `UserPCLayout`/`PCHeader`의 진단 nav가 `pcDiagnosisMap`으로 향함. PCHeader의 `DIAGNOSIS_VIEWS` 배열에 `pcDiagnosis*` 추가됨

**지도:**
- 모바일/PC 모두 카카오맵(`react-kakao-maps-sdk`) 사용. 키: `VITE_KAKAO_MAP_KEY` (.env에 이미 있음)
- 핀은 `CustomOverlayMap` + 커스텀 DOM 버튼으로 렌더 (배경색=초록 #06AB69, focus 핀=#d0021b, count 텍스트 흰색)
- `useKakaoLoader({ libraries: ['services'] })` — services 모듈 필요 시
- district 변경 시 `mapRef.current.panTo(new window.kakao.maps.LatLng(...))`로 중심 이동
- 키 미설정 환경 fallback: 그라데이션 placeholder + 가짜 도로 (CSS만)

**모바일 하단 네비 현황 (2026-05-04, 사용자 합의 후 통합 완료):**
- `MobileBottomNav` 슬롯: 홈/설문/제보·제안/진단/나의 활동 (5칸, Figma 디자인 준수)
- active 색상: 진단=#06AB69(녹색), 그 외=#5B2EAB(보라)
- 제보·제안 슬롯 클릭 시 chooser 팝업(제보하기/제안하기) 표시 후 선택해서 진입. 외부 클릭/ESC로 dismiss
- chooser 열림 상태는 `.pressed` 클래스로 구분(active와 분리)
