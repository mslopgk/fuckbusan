---
name: project_persona_chat
description: "AI 가상시민 페르소나 챗봇 — 프론트 완성, 백엔드는 사용자 RAG 연결 예정"
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

AI 가상시민과 1인칭 대화하는 챗봇. **프론트만 구현**(`src/components/PersonaChat.jsx` + `.css`). **백엔드는 사용자가 만든 RAG 시스템을 연결할 예정 — 백엔드 만들지 말 것**(사용자 명시).

PersonaChat가 호출하는 **API 계약**(이대로 RAG 구현하면 자동 동작):
- `POST {API_URL}/api/ai-citizens/{id}/chat`
- body: `{ message: string, history: [{role:'user'|'assistant', content:string}] }`
- res: `{ reply: string, suggested?: string[] }`
- 엔드포인트 미구현(404 등) 시 "준비중" 폴백 메시지로 graceful 동작. 시작 인사·추천질문은 페르소나 데이터로 클라에서 생성(받침 로/으로 처리 포함).

진입점: PC `PCAICitizen` 상세패널 "가상시민과 채팅하기" 버튼(teal) → `chatPersona` state → PersonaChat 모달. 모바일 `MAICitizenDetail` topbar "채팅하기" 버튼 → 전체화면 모달. props: `persona={{id,name,age,gender,district,detail,avatarUrl,...}}`.

**PC 리뉴얼 완료 (2026-06-15)**: `PCAICitizen.jsx` 전면 재작성(Figma 215:3802). 셸=공공데이터 스타일(PCPublicData.css 재사용, 좌측 구역dropdown+생활정보 living-icons 9그리드+AI챗봇 버튼). **지도는 카카오맵 금지 — 기존 스타일라이즈드 SVG 지도(`FigmaDistrictMap`: /assets/지도 배경 데스크탑.png + /assets/districts/{구}.svg, DISTRICTS_POS 좌표, hover 페르소나 버블) 사용**(사용자 명시). 우측 페르소나 리스트(`.aic-list`: 부산진구 AI 가상시민 + 카드), 하단 상세리포트(`.aic-report`: 프로필그리드+quote+공공데이터통계 recharts bar+donut+시민목소리 탭). 데이터=기존 `/api/ai-citizens`(구당 2명), 상세 detail에 participation/category_scores/voices/top_issues/policy_signals. CSS는 PCAICitizen.css에 aic-* 추가(구 pc-ai-* 미사용 잔존). 줌 툴바는 정적 SVG라 제외.

**미완**: 모바일 가상시민 리뉴얼(215:16031, 현 MAICitizen/MAICitizenDetail). 관련 [[project_public_data_page]] [[project_survey_chat_backend]].
