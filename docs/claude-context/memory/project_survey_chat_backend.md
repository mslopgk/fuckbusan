---
name: project_survey_chat_backend
description: AI 대화형 설문 백엔드 — test4 인터뷰 엔진 이식 위치/엔드포인트/폴백
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

설문을 구글폼 → AI 대화형(챗봇)으로 리뉴얼. 원본 reference = GitHub `shain1912/test4` (Streamlit+LangGraph). Streamlit/LangGraph/chromadb(RAG) 제거하고 FastAPI 백엔드로 이식.

**백엔드** (`backend/`)
- `survey_chat/config.py` — 토픽/필드 설정(field_based 반구조화). 필수필드(7개, 2026-06-15 심화) = issue_text → location_bucket → primary_category(category) → severity_score(0-4 scale) → frequency(category) → affected_target(category) → desired_improvement(text). 문구/필드 수정은 여기만. interview_style에 "최소 2~3회 프로빙" 강제.
- `survey_chat/engine.py` — `SurveyChatEngine`: OpenAI structured output(json_schema strict, model `gpt-4o`, env `SURVEY_CHAT_MODEL`/`SURVEY_CHAT_TEMPERATURE`). **OPENAI_API_KEY 없으면 RuntimeError(폴백 없음, OpenAI 전용)**. 세션 상태는 프로세스 메모리(dict). **질문 유형 위젯(2026-06-15)**: BOT_SCHEMA에 `input_type`('text'|'single_choice'|'scale') + `choices[]` + `scale{min,max,labels}` 추가 → 엔진이 지금 던진 질문 유형을 프론트에 전달. start/message 응답에 동봉, 완료 시 input_type='text'.
- `routers/survey_chat_router.py` — prefix `/api/survey-chat`: `POST /start`, `POST /message`, `POST /finish`, `GET /results`, `GET /my`(내 참여목록), `GET /session/{session_id}`(대화내역 다시보기, 본인만). 완료 시 두 곳 저장: ① `SurveyChatInterview`(이슈당 1 row, 분석용) ② `SurveyChatSession`(세션당 1 row: title+transcript+user_id+issue_count). 둘 다 idempotent.
- main.py에 router 등록 완료.

**나의 활동 연동 (2026-06-15)**: AI 인터뷰는 익명 가능하지만 로그인 시 user_id 부착 → `/message`/`/finish`에 `get_current_user_optional` 적용, 프론트 SurveyChat.jsx가 `authHeaders()`로 토큰 전송. 완료 시 `engine.summarize_title()`(gpt-4o-mini, 18자 이내 한국어 제목 생성, 폴백 있음)로 제목 생성·저장. 나의활동 설문 목록 = `/api/surveys/my-participations`가 폼설문(SurveyResponse) + AI세션(SurveyChatSession) 통합 반환(`kind:'form'|'ai'`). AI 카드 클릭 → view `surveyChatHistory`(`SurveyChatHistory.jsx`, 읽기전용 말풍선, SurveyChat.css 재사용). `survey_chat_interviews.user_id`는 수동 ALTER + main.py 마이그레이션 블록 등록. `survey_chat_sessions`는 create_all 자동 생성.

**프론트** `src/components/SurveyChat.jsx` — `/api/survey-chat` 호출. **질문 유형별 입력 위젯(2026-06-15)**: `activeInput={type,choices,scale}` 상태로 분기 — scale→리커트 바(`.surveychat-scale` track+dot+label, 진단 만족도 바 패턴), single_choice→옵션 칩(`.surveychat-opt`), text→입력창+suggested_replies. 위젯 선택 시 라벨 텍스트를 send(). `is_complete` 시 제보/제안 CTA. (구 로컬 FALLBACK 스크립트는 제거됨 — 실패 시 안내 메시지만.) 진입: view `mSurveyList`(모바일)/`pcSurveyList`(PC). dev는 vite `/api`→8000 프록시.

Figma 노드: 모바일 215:13887 / PC 215:1980 (PC는 입력바 Figma에 없어 자체 디자인). 색상 teal #23bdbb. 관련 [[bottom_nav_locked]].

**어드민 시각화 (2026-06-15, test4 analysis.py 이식)**: 라우터에 `GET /api/survey-chat/analytics`(집계: 토픽별 건수·평균심각도·대표이슈, 심각도/위치 분포, 일자 추이) + `GET /api/survey-chat/clusters`(OpenAI text-embedding-3-small + KMeans + t-SNE 3D 좌표, 4건 미만이면 graceful, 결과 캐시). 프론트 `src/admin/pages/SurveyChatAnalytics.jsx`(+css) — 어드민 사이드바 설문관리 > "AI설문 분석"(view `surveyChatAnalytics`, App.jsx adminViews/noHeaderViews 등록). 토픽카드 + recharts(카테고리/심각도 bar, 위치 막대) + **plotly 3D 산점도**(신규 dep `react-plotly.js`+`plotly.js-gl3d-dist-min`, factory로 gl3d만 로드). 군집 색상 트레이스별 분리, 드래그 회전.
