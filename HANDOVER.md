# 인수인계 — 부산 시민참여 공공디자인 진단 플랫폼

작성 2026-09-07 · 대상: 후임 개발자 · 작성자: 전임 개발자(코드코리아)

> 이 문서는 **코드만 봐서는 알 수 없는 맥락**을 담습니다. 코드 구조·컨벤션은 루트 `CLAUDE.md`, 기능/기획은 `docs/` 를 함께 보세요.
> 확실하지 않은 항목은 **(추정)** 으로 표시했습니다. 자격증명(키·비밀번호)은 **값 대신 위치만** 적었습니다.

---

## 0. 한눈에

- **무엇**: 부산 시민이 동네 공공디자인을 진단·제보·제안·설문하고, 공공데이터/AI 가상시민으로 현황을 보는 웹 플랫폼.
- **누가 쓰나(4주체)**: 시민 / 전문가 / 부산시·구군 / 부산디자인진흥원.
- **스택**: React 19 + Vite (프론트, dev 8501) · FastAPI (백엔드, 8000) · MariaDB 10.6 (docker) · Qdrant (벡터DB, RAG).
- **운영 사이트**: https://design.kodekorea.kr
- **현재 브랜치**: `handover/20260907`, HEAD `377a297 (퇴사 전 미커밋 작업 보존)` — 미커밋 작업물이 이 커밋에 보존돼 있음.

---

## 1. 어디까지 됐나 (동작 / 미동작)

### 동작하는 것 (운영 반영됨)
- 회원가입/로그인, 홈, 제보(reports), 제안(new_proposals), 설문(일반+AI 대화형), 진단(checklist), 공공데이터 대시보드, 마이페이지(나의 활동), 관리자(admin) 영역.
- 공공데이터: 테마별 지표 약 2,562건 등 실데이터 시드 반영.
- AI 가상시민(RAG): 구·군별 페르소나 생성/조회/대화. 운영 DB에 31명 존재.

### 코드 완료·미배포 (운영엔 아직 없음) — 아래 "9. 다음 할 일"과 연결
- **싱크피드백 프론트 수정(25p·28p·86p 등)**: 코드 완료·빌드 검증됨. **prod 미배포**. (HEAD 377a297에 포함)
- **DB 계획정합(신규 31테이블, `backend/models_plan.py`)**: **로컬 스테이징에만 적용**, prod 미반영.

### 알려진 미완/불완전
- AI 가상시민의 **8개 영역 점수·참여 수치·유사시민 비율**은 실제 산식이 아니라 **임시/LLM 생성값** (docs/`진단-육각형-임시산출.md`, docs/`AI가상시민-생성근거-상세-2026-08-21.md`).
- **Self-RAG 신뢰도 게이트**는 계산만 하고 생성·대화 경로에 **연결 안 됨** (환각 억제는 프롬프트 지시 수준).
- 싱크피드백 **#5(가상시민 없는 구 빈 원형 표시), #9(PC 상세화면 위치/크기)**: 미착수.
- 진단 홈 **33→34p 종합현황형 개편**: 개발 검토만 회신, 미착수(대규모).

---

## 2. 파일·폴더 지도

정리 원칙: 핵심 소스/설정/문서는 루트에 노출, 빌드산출물·임시·중복본은 `_보관/`, 대외 산출물 문서는 `산출물_문서/` 로 모음.

| 위치 | 내용 | 비고 |
|---|---|---|
| `src/` | 프론트 소스 (React) | `M*`=모바일, `PC*`=PC, prefix없음=공용. 라우팅은 `App.jsx`의 view state machine (react-router 실사용 안 함) |
| `backend/` | FastAPI 백엔드 | `main.py`(진입), `models.py`(운영 30테이블), `models_plan.py`(계획정합 신규 31테이블·스테이징용), `routers/`, `rag/`(RAG), `seed_*.py`(시드), `apply_plan_schema.py`(스테이징 스키마 적용) |
| `backend/rag/` | AI 가상시민 RAG | `ingest.py`(집계·색인), `core.py`(검색), `persona.py`(생성), `chat.py`(대화), `config.py`(LLM 키·모델) |
| `docs/` | 기획·명세·기술문서(마크다운) | `BDP_*`(기획/명세), `PT-*`(발표), `AI가상시민-생성근거-상세-*`, `DB-계획정합-매핑-*`, `진단-육각형-임시산출.md`, 이전 인수인계 `CLAUDE_HANDOFF.md`·`인수인계서_2026-07-18.docx` |
| `산출물_문서/` | 발주처 제출/보고용 문서 (docx·pptx·pdf·ERD) | 정리 시 루트에서 이곳으로 이동. `대외회신_초안/`에 이종희 이사 회신 초안 |
| `verify/` | 자가검증 도구(Playwright) | `npm run verify` 계열. 상세 `verify/CONTRACT.md`, 라우트 `verify/routes.json` |
| `database/`, `busan_data/`, `scripts/`, `public/` | DB 초기화·데이터·유틸·정적자원 | |
| `docker-compose.yml` | 로컬 MariaDB | 서비스 `db` (mariadb:10.6) |
| `.env`, `backend/.env` | 환경변수·키 | 값은 **6. 자격증명 위치** 참조 |
| `CLAUDE.md` | 코드 컨벤션·디자인토큰·작업원칙 | **필독** |
| `TODO.md` | Figma vs 코드 미일치 페이지별 체크리스트 | |
| `_보관/빌드산출물/` | `dist/`(빌드결과), `lambda.zip`(구 AWS 배포본, 미사용 추정) | 지우지 말고 보관만 함 |
| `_보관/임시/` | `_verx*.cjs`, `image*.png` 임시파일 | |
| `_보관/구버전_ERD_2026-08-06/` | 08-06 ERD 세트(09-03본으로 대체됨) | 최신 ERD는 `산출물_문서/ERD_*_2026-09-03` |

---

## 3. 실행 / 빌드 / 배포

### 로컬 개발 (Windows)
```
# 1) DB (docker) — 로컬 MariaDB
docker compose up -d db          # .env의 DB_* 사용, host 127.0.0.1:3306

# 2) 백엔드 (FastAPI)
cd backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
#  ⚠ Windows에서 8000~8270 포트가 예약(제외)되어 bind 실패(WinError 10013)할 수 있음.
#    그럴 땐 8300 등 제외범위 밖 포트 사용. 확인: netsh interface ipv4 show excludedportrange protocol=tcp

# 3) 프론트 (Vite) — 포트 8501
npm run dev                      # http://localhost:8501

# 자가검증 (프론트+백엔드 캡처/에러/API 상태 수집)
npm run verify -- --views=home,reportList --api=dashboard-summary
npm run verify:fe -- --views=home
npm run verify:api -- --api=dashboard-summary
```
- 의존성: `npm install` (Node), `pip install -r backend/requirements.txt` (Python). 프론트 dev/deps는 `package.json` 참조.
- 스키마: **Alembic 없음**. `main.py` 시작 시 `models.Base.metadata.create_all` 이 **없는 테이블만 생성**(기존 ALTER/DROP 안 함).

### 스테이징(로컬)에서 계획정합 스키마 적용 (참고)
```
cd backend && python apply_plan_schema.py   # 127.0.0.1 가드 내장, 신규 31테이블만 create
```

### 프론트 배포 (운영) — 실제 쓰던 방식
1. 로컬 `npm run build` → `dist/` 생성
2. `dist/` tar 압축 → `scp` 로 서버 전송
3. 서버에서 기존 dist 백업(`dist.bak-<날짜>`) 후 교체: `/home/ubuntu/render-apps/design/dist`
4. Caddy가 정적 서빙(재시작 불필요, 정적 파일 교체)
- **롤백**: 서버의 `dist.bak-*` 를 다시 `dist` 로 복원.
- **격리 배포(중요)**: 관련 없는 미커밋 변경이 섞이면 `git stash` 로 빼고 대상 변경만 빌드→배포. (아래 "8. 함정" 참조)

### 서버 구성 (SSH: `design.kodekorea.kr`, user `ubuntu`)
- 다중 앱 공용 서버(hostname `general-server-1`, IP 156.228.4.156).
- 프론트: Caddy 정적서빙, `/home/ubuntu/render-apps/design/dist`
- 백엔드: `/home/ubuntu/render-apps/design/backend`, uvicorn (관찰상 `main:app --host 127.0.0.1 --port 10004`). Caddy가 `/api/* /users/* /uploads/* /checklist/*` 를 백엔드로 프록시. Caddyfile: `/etc/caddy/Caddyfile` (백업 `.bak-20260806`).
- DB: docker 컨테이너 **`design-db`** (mariadb:10.6, host 127.0.0.1:**3307**), DB명 `busan_design_db` (운영 30테이블).
- 벡터DB: docker **`design-qdrant`** (127.0.0.1:6333), 컬렉션 `busan_civic`.

---

## 4. AI / RAG 파이프라인 (핵심 특수기능)

- 흐름: 실데이터(제보/제안/진단/설문/공공데이터) 집계 → Qdrant 색인 → 하이브리드 검색(ko-sbert 임베딩 + BM25, RRF 융합) → LLM 생성.
- 임베딩 `jhgan/ko-sbert-multitask`(로컬), 스파스 `Qdrant/bm25`, 컬렉션 `busan_civic`.
- LLM: 키 우선순위 **ANTHROPIC > MINIMAX**(둘 다 있으면 Claude `claude-sonnet-4-6` 우선, MiniMax-M2.7 폴백), `RAG_MODEL`로 오버라이드. `backend/rag/config.py`.
- **정직 고지(발주처 방어자료와 일치)**: 페르소나의 인적사항·8영역 점수·참여수치·유사시민%는 LLM 생성/임시값이고, 신뢰도 게이트는 생성경로에 미연결. 근거는 `산출물_문서/AI가상시민_생성근거_상세_*` 및 `docs/AI가상시민-생성근거-상세-2026-08-21.md`(코덱스 교차검증 정정본 v2).

---

## 5. 상대 기관 · 담당자 · 약속

| 구분 | 내용 |
|---|---|
| 개발 협력사 | **코드코리아**(후임 소속). 원청/기획: **싱크앤두랩**, **부산인터넷방송국** |
| 발주/검수 | **부산디자인진흥원**(진흥원) — UX/정책 결정 다수 협의 필요 |
| 클라이언트 담당 | **이종희 이사** — 데이터 수치·ERD 문의. 회신 초안: `산출물_문서/대외회신_초안/` |
| Figma 원본 | fileKey `jWpcqQv2jhb2mkzjEs1fuI` (CLAUDE.md 참조). 화면 스펙의 기준 |
| 약속/기한 | 싱크피드백 25/28/86p 수정(당초 8/29~30 기한, **지연**). 진단 홈 33~34p는 개발검토 회신 완료(정식개편은 기준확정 후 별도일정) |
| 데이터 수치 주의 | 대외보고 시 "회원 237"은 **가입회원(테스트계정 포함)**, 진단 **실참여자는 고유 31명 수준**. 공공데이터 2,562건은 실데이터 맞음 |

---

## 6. 자격증명 위치 (값은 기재하지 않음 — 별도 인계 필요)

- 로컬 환경변수: 루트 `.env`, `backend/.env`
  - DB_*(로컬 DB), RAG LLM 키(`ANTHROPIC_API_KEY`, `MINIMAX1~5`), `VITE_KAKAO_MAP_KEY`(카카오맵).
  - `DATABASE_URL` 은 **주석 처리**된 프로드 RDS 자리표시자(현재 로컬은 DB_* 사용).
- **운영 DB 접속정보**: 서버 `/home/ubuntu/render-apps/design-secrets/db.env` (DB_ROOT_PASSWORD 등).
- **SSH 접속**: 로컬 `~/.ssh/config` 의 host `design.kodekorea.kr` (IdentityFile 경로 그 안에 명시).
- **메일 발송 계정**: `jiho.lee@kodekorea.kr` (SMTP `mail.kodekorea.kr:465` SSL). 비밀번호는 파일에 저장돼 있지 않음 → **담당자에게 별도 인계 필요**.
- GitHub 원격: `github.com/cherryrenee/design` (package.json). 접근권한 인계 확인 필요.

---

## 7. 함정과 주의사항 (삽질 기록)

1. **관련 없는 미커밋 변경을 함께 배포 → 운영 장애("이상해짐") → 롤백** 경험 있음. 프론트 배포는 반드시 **대상 변경만 격리**해서(빌드 전 `git stash` 로 무관 파일 제외) 진행.
2. **Alembic 없음**: `create_all` 은 없는 테이블만 만듦. 운영 스키마 변경은 **수동 DDL + 백필**이 필요. (계획정합 61테이블용 DDL/롤백/백업 스크립트는 전임 PC의 작업폴더 `D:\busan-staging\` 에 있었음 — **추정**, 후임 PC엔 없을 수 있으니 `backend/models_plan.py` 기준으로 재생성 가능)
3. **진단 API 프록시 누락 사고**: 과거 Caddy가 `/checklist/*` 를 백엔드로 프록시하지 않아 진단이 안 뜬 적 있음 → Caddyfile `@backend` 에 경로 추가로 해결. 라우터 prefix 추가 시 Caddy 프록시 경로도 함께 확인.
4. **Windows 예약 포트**: 8000~8270 대역이 예약되어 로컬 uvicorn bind 실패 가능. 8300 등 사용.
5. **lucide-react 신규 사용 금지**(스펙 위반, 치환 TODO), **react-router 도입 금지**(현재 view state machine 유지). CLAUDE.md의 DON'T 절 준수.
6. **가상시민 수치의 임시성**: 8영역/참여/유사시민% 를 "정식 지표"로 대외 표기하면 안 됨(임시 산출). 정식화는 진흥원 산식 기준 확정 선행.
7. **localStorage 우회 키**: `deletedReportIds`/`likedReportIds`/`userCreatedReports`/`updatedReportsMap` 등 백엔드 미구현 우회용. 백엔드 이전 TODO (CLAUDE.md).
8. **멀티워커 RAM 주의**(운영): 백엔드 워커 과다 시 서버 RAM 문제 이력 있음 — 워커 수 조정 신중.

---

## 8. 다음에 해야 할 일 (우선순위 순)

1. **싱크피드백 프론트 수정 운영 배포** (25/28/86p: 화살표·닫기X 삭제·뒤로가기·상단메뉴 오류·구군명 표기). 코드 완료 상태 → **격리 배포**만 하면 됨.
2. **싱크피드백 #5, #9 처리**: #5 가상시민 없는 구 빈 원형 표시 + 첫 화면 마우스오버 / #9 PC 상세화면 위치·크기(피그마 기준 필요).
3. **DB 계획정합(61테이블) 운영 반영 여부 결정**: `models_plan.py` 기준. 운영 반영 시 백업→수동 DDL→검증→롤백 대비. Alembic 도입 권장.
4. **진단 홈 33→34p 정식 개편**: 진흥원의 8영역 산식 기준 + 34p 피그마 확정 후 착수(백엔드 포함 대규모, 검토서는 `산출물_문서/대외회신_초안/회신_기능수정_진단홈검토_2026-09-03.txt`).
5. **가상시민 신뢰도 개선**: 8영역 점수 결정론적 산식화, 참여수치 실집계 연결, Self-RAG 게이트를 생성경로에 연결.
6. **회원/역할 정규화**(계획정합): UserRole/Permission/Expert 등 신규 테이블을 실제 앱 로직과 연결(현재는 구조만 존재).
7. **TODO.md 미일치 항목**: Figma vs 코드 잔여 페이지 계속 정리.

---

## 9. 참고 문서 바로가기

- 코드 컨벤션·디자인토큰·DON'T: `CLAUDE.md`
- 화면 미일치 체크리스트: `TODO.md`
- 기획/명세: `docs/BDP_기획제안서.md`, `docs/BDP_기능명세서_v1.0.md`, `docs/BDP_개발명세서_v3.0.md`
- AI 가상시민 근거(방어자료): `docs/AI가상시민-생성근거-상세-2026-08-21.md`, `산출물_문서/AI가상시민_생성근거_상세_2026-08-21.(docx|pdf)`
- DB 계획정합 매핑: `docs/DB-계획정합-매핑-2026-09-03.md`, 최신 ERD: `산출물_문서/ERD_*_2026-09-03`
- 이전 인수인계: `docs/CLAUDE_HANDOFF.md`, `docs/인수인계서_2026-07-18.docx`
- 발표/시연: `docs/PT-01~04-*.md`, `산출물_문서/부산시보고_*.pptx`

> 미기재/불확실 항목은 전임자 또는 진흥원·싱크앤두랩 담당자에게 확인 바랍니다.
