---
name: 동료 개발자 분담 (2026-05-04 기준)
description: 다른 개발자가 설문/제안/제보 부분 담당, 사용자(나)는 다른 영역. 작업 충돌 방지용 분담 메모
type: project
originSessionId: 4d61babc-b41a-4f3f-8017-939ee251c222
---
2026-05-04 시점, 동료 개발자가 **설문(survey) / 제안(propose) / 제보(report)** Figma 화면을 PC + Mobile 양쪽에서 작업 중.

**Why:** 사용자가 직접 명시함 — "다른 친구가 설문, 제안, 제보 부분 개발 중". 같은 파일을 동시에 건드리면 충돌 가능.

**How to apply:** 
- 사용자가 따로 지시하지 않는 한, `MSurvey*.jsx/css`, `PCSurvey*`, `PCPropose*`, `PCReport*`, `MobileBottomNav*` 등 동료 작업 영역은 건드리지 않음
- 사용자가 요청하는 신규 영역(예: 진단 04/23 업데이트 = Figma 941:5782 = `Diagnosis*`, `MDiagnosis*`)에 집중
- 새 컴포넌트 추가 시 App.jsx의 view 라우팅에 등록은 충돌 가능하므로 작업 전후로 git status 확인
