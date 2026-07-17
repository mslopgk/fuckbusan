---
name: project_rag_ai_citizen
description: AI 가상시민 RAG 백엔드 + 어드민 대시보드 (shain1912/runway 이식)
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

사용자 본인 레포 `shain1912/runway`(Qdrant 하이브리드 RAG)를 백엔드에 이식해, 공공데이터+제보/제안/진단/설문을 취합→RAG 인덱싱→가상시민 페르소나 생성→대화하는 시스템 구축.

**백엔드 `backend/rag/`** (heavy deps lazy import → Qdrant/모델/키 없어도 서버 부팅)
- `core.py` = runway `rag_core.py` 그대로 이식(retrieve 하이브리드 dense ko-sbert+BM25 RRF, self-RAG gate, run_agent, answer). generic 부분만 재사용.
- `config.py` — QDRANT_HOST/PORT(6333), COLLECTION=`busan_civic`, get_qdrant()/get_llm()/status(). LLM=Anthropic(env `ANTHROPIC_API_KEY` 또는 `MINIMAX1`+`ANTHROPIC_BASE_URL`), 모델 env `RAG_MODEL`(기본 claude-sonnet-4-6).
- `ingest.py` — DB 5종(Report/NewProposal/ChecklistResult/SurveyChatInterview/PublicThemeStat) → 문서화 → ko-sbert 임베딩 → Qdrant upsert. `source_counts(db)`로 집계 건수만 조회.
- `persona.py` — 지역 RAG 검색 → Claude로 페르소나 JSON 생성 → `Persona` 저장(generation_source='rag', evidence).
- `chat.py` — 페르소나 1인칭 시스템프롬프트 + 지역 RAG 그라운딩 → Claude 답변.

**라우터**: `routers/rag_admin_router.py`(`/api/admin/rag/status|sources|ingest|generate-personas|personas`, 관리자 전용 require_admin). `ai_citizens.py`에 `POST /{id}/chat`(PersonaChat 프론트 계약, rag.chat 호출). main.py 등록.

**어드민 대시보드**: `src/admin/pages/AdminRAGDashboard.jsx`(+css). 사이드바 `AI 가상시민 > RAG 관리` → view `adminRAG`. 상태카드(deps/qdrant/llm/인덱스), 소스 건수+인덱싱 버튼, 페르소나 생성(구·군+개수), RAG 페르소나 목록. App.jsx adminViews/noHeaderViews/onNavigate 등록.

**운영 전제(미설치 시 대시보드가 graceful 안내)**: `pip install qdrant-client sentence-transformers fastembed anthropic`(backend/requirements.txt 등록됨, ko-sbert 최초 다운로드), Qdrant 6333 기동(`docker run -p 6333:6333 qdrant/qdrant`), `.env`에 `ANTHROPIC_API_KEY`(또는 MINIMAX+base_url). 현재 deps는 설치돼 있으나 Qdrant 미기동·키 미설정 상태. 관련 [[project_persona_chat]] [[project_public_data_page]].
