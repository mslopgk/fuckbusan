---
name: project_membership_overhaul_regressions
description: 회원개편 후 이름/닉네임/타입값 불일치로 깨지는 소유자판정·필터 회귀 패턴
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

회원시스템 개편(가입 시 name·nickname 분리 입력, usertype→district_code 매핑 citizen=general/expert=expert/admin=admin) 이후, **문자열 기반 비교에 의존한 코드가 조용히 깨지는 회귀**가 반복 발생함. 새 화면/기능 작업 시 아래를 의심할 것:

1. **소유자 판정은 반드시 `user_id`로** — 로그인 응답 `user_name = user.name`(이름)인데, 제보 작성자는 `author_name = nickname`으로 저장됨. `author === user_name`(닉네임 vs 이름) 비교는 이름≠닉네임이면 항상 실패 → 본인 글 수정/삭제 버튼이 안 뜸. `/users/me`의 `user_id`와 `detail.user_id` 비교로 해결. (PCReportDetail 2026-06-15 수정)

2. **진단 `진단대상` 필터** — 시민/전문가 필터는 `진단대상 === '시민'/'전문가'` 문자열 비교. PC 진단 폼(PCDiagPanelForm)이 제출 시 `진단대상`을 안 보내 NULL로 저장되면 필터에서 전부 제외됨. 레거시 NULL은 사용자 제출분(user_id 보유)만 '시민' 백필함.

3. **나의활동 카운트는 도메인별 전용 엔드포인트에서** — 제보=`/api/reports/mine`, 제안=`/api/reports/my-proposals`(같은 /mine에 안 섞임), 진단=`/checklist/my`, 설문=`/api/surveys/my-participations`. 한 엔드포인트에서 type 필터로 세려다 0 나오는 버그 잦음.

관련: [[report_propose_theme_colors]] [[backend_modules]]
