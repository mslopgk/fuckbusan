# 부산 공공디자인 진단 플랫폼 (WDC)

시민 참여 데이터와 AI로 부산의 공공디자인·생활환경을 진단·개선하는 참여형 웹 플랫폼.
시민은 제보·제안·진단·설문으로 의견을 남기고, 공공데이터와 함께 분석되어 **AI 가상시민(페르소나)**·**공공데이터 대시보드**로 시각화된다.

> **인수인계 문서** — 이 README는 전체 구조·기능·실행 방법·진행 상황·인수인계 주의사항을 담고 있다.
> AI 가상시민의 알고리즘/계산식 상세는 `AI가상시민_상세설계서.docx`, 클라이언트 문의 답변은 `가상시민_플랫폼_문의사항_답변서.docx` 참조.

---

## 1. 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | React 19 + Vite (dev 포트 **8501**), plain CSS, recharts, react-kakao-maps-sdk, leaflet |
| 백엔드 | FastAPI (Python, 포트 **8000**), SQLAlchemy, pymysql |
| 데이터베이스 | MariaDB 10.6 (docker-compose) |
| AI / RAG | Qdrant(벡터DB, 6333) + ko-SBERT(dense) + BM25(sparse) + RRF 융합 + LLM(MiniMax-M2.7, Anthropic 호환) |
| 인증 | JWT + Firebase Phone Auth(SMS 회원가입/찾기) |
| 지도 | 카카오맵(제보/제안/진단) + 자체 SVG 부산 구·군 지도(홈·AI가상시민) |

---

## 2. 아키텍처 개요

### 프론트 라우팅 (중요)
- **react-router 미사용.** `src/App.jsx`의 `view` **상태머신**으로 화면 전환. URL은 `/` 와 `/admin` 둘뿐.
- 현재 view는 `sessionStorage.current_view`에 저장. (자동화/verify는 sessionStorage 시드 후 reload 패턴)
- 컴포넌트 네이밍: `M*` = 모바일 전용, `PC*` = PC 전용, prefix 없음 = 공유. `Home.jsx`가 `window.innerWidth >= 1024`로 PC/모바일 분기.
- 인증 필요 화면은 `access_token`(localStorage) 없으면 로그인 리다이렉트.

### 백엔드
- `backend/main.py`가 라우터 등록 + 시작 시 테이블 auto-create·안전 마이그레이션·공공데이터 시드.
- `backend/routers/` 도메인별 라우터, `backend/rag/` RAG 엔진(core·config·ingest·persona·chat), `backend/models.py` SQLAlchemy 모델.
- 관리자 보호: `require_admin`(JWT `sub == "admin"`).

---

## 3. 주요 기능 & 진행 상황

### 사용자 (User)
| 기능 | 화면 | 상태 |
|---|---|---|
| 홈 | HomePC / HomeMobile | ✅ **리뉴얼 완료** (참여현황·지역별 TOP5·빠른액션·소식·가상시민 배너, 실데이터 연동) |
| 제보 / 제안 | M*/PC* Report·Proposal | ✅ 운영(지도·폼·상세·임시저장) |
| 진단 | 시민/전문가 진단 | ✅ 운영 |
| 설문 | AI 대화형 설문(SurveyChat) | ✅ 운영(로그인 시 DB 기록·나의활동 연동) |
| AI 가상시민 | PCAICitizen / MAICitizen | ✅ **리뉴얼 완료** (자체 SVG 지도, 인트로 애니메이션+페르소나 오토투어, 상세 리포트, 페르소나 챗봇) |
| 공공데이터 | PCPublicData | ✅ 대시보드(실데이터) |
| 나의 활동 | MyActivityHub | ✅ 제보·제안·진단·설문 통합 |

### 관리자 (Admin, `/admin`)
| 메뉴 | 상태 |
|---|---|
| 회원관리 (시민/전문가/관리자) | ✅ 운영 |
| 제안/제보 관리 | ✅ 운영 |
| 진단관리 | ✅ **신규 구축** (목록·상세·통계·삭제) |
| 설문관리 + AI설문 분석 | ✅ 운영 (AI설문 분석=3D 클러스터링) |
| 공공데이터 관리 | ✅ **신규 구축** (테마지표 CRUD) |
| AI 가상시민 (데이터 관리·생성 관리) | ✅ **신규/RAG** (원천데이터 조회→변환, 지역 자동생성, 전 필드 편집, 시스템 상태 패널) |
| 공지사항 / 홍보 | ✅ **신규 구축** (Announcement CRUD, 게시/고정 토글) |
| 메인 대시보드 | ✅ 카드 전 활성화 |

> 디자인 accent teal `#23BDBB`(WDC), 로고는 **WDC**(Figma의 "PDDP(가안)"은 outdated).

---

## 4. AI 가상시민 (RAG) 요약

`제보·제안·진단·설문 + 공공데이터` 5종을 문서화→Qdrant 인덱싱→**하이브리드 검색(ko-SBERT + BM25, RRF 융합)**→근거를 **LLM(MiniMax-M2.7)**에 주입→가상시민 JSON(8영역 관심도·참여비율·유사시민비율·여정지도·정책신호등) 생성→저장(근거 evidence 추적).

- 8영역 관심도·참여비율·유사시민비율 등 **수치는 LLM 추론 산출**(고정 산식 아님). 결정론적 규칙식 대안은 설계서 8장 참고.
- 관리자 화면에서 인덱싱/생성/편집. **Qdrant(6333) + LLM 키 필요.**
- 상세: **`AI가상시민_상세설계서.docx`** (계산식 흐름도·알고리즘·플로우차트 그림 포함).

---

## 5. 로컬 실행 방법

### 사전 요건
Node.js, Python 3.10+, Docker(Desktop). (RAG 사용 시 Qdrant)

### ① 데이터베이스 (MariaDB / docker)
```bash
docker compose up -d            # MariaDB 기동 (컨테이너: fuckbusan-db-1)
# 초기 데이터 복원 (덤프 포함):
docker exec -i fuckbusan-db-1 mysql -uroot -p"$DB_ROOT_PASSWORD" < database/busan_design_db_dump.sql
```
- 스키마는 백엔드 시작 시 자동 생성되지만, **기존 데이터가 필요하면 위 덤프를 복원**한다. (`database/busan_design_db_dump.sql`, 28개 테이블)

### ② 백엔드 (FastAPI, 8000)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate    # (윈도우: .venv\Scripts\activate)
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000       # ⚠️ 'uvicorn' 단독 대신 python -m uvicorn 권장
```

### ③ 프론트엔드 (Vite, 8501)
```bash
npm install
npm run dev                     # http://localhost:8501
```

### ④ (선택) RAG / Qdrant
```bash
docker run -d -p 6333:6333 qdrant/qdrant
# 이후 관리자 > AI 가상시민 > 데이터 관리 > '시스템 상태'에서 인덱싱 실행
```

> 윈도우 개발/배포 서버 상세 절차는 **`docs/WINDOWS_SETUP.md`** 참고 (한글 파일명·CRLF·venv·Qdrant 주의사항 포함).

---

## 6. 환경 변수

`.env`, `backend/.env`는 **gitignore**되어 저장소에 없다. 아래 키를 채워 생성한다.

### 프론트 `.env`
```
VITE_API_URL=            # 백엔드 주소 (예: http://localhost:8000)
VITE_KAKAO_MAP_KEY=      # 카카오맵 JS 키
KAKAO_REST_API_KEY=
VITE_FIREBASE_API_KEY= / _AUTH_DOMAIN / _PROJECT_ID / _STORAGE_BUCKET / _MESSAGING_SENDER_ID / _APP_ID
```
### 백엔드 `backend/.env`
```
DB_HOST= DB_PORT= DB_NAME= DB_USER= DB_PASSWORD= DB_ROOT_PASSWORD=
SECRET_KEY= ALGORITHM= ACCESS_TOKEN_EXPIRE_MINUTES=
MINIMAX5=                # RAG LLM 최우선 키 (없으면 MINIMAX1~4 폴백)
# 선택: ANTHROPIC_API_KEY / QDRANT_HOST(기본 localhost) / QDRANT_PORT(기본 6333)
```

---

## 7. 디렉터리 구조 (요약)
```
├─ src/
│  ├─ App.jsx                 # view 상태머신 라우팅
│  ├─ components/             # 사용자 화면 (M*=모바일, PC*=PC, 공유)
│  │   ├─ HomePC/HomeMobile   # 홈(리뉴얼)
│  │   ├─ PCAICitizen/MAICitizen, PersonaReport, PersonaChat  # AI 가상시민
│  │   └─ BusanMap, PCMapCanvas, PCPublicData ...
│  └─ admin/                  # 관리자 (pages/ components/ styles/)
├─ backend/
│  ├─ main.py, models.py, database.py
│  ├─ routers/                # 도메인 API (home/ai_citizens/rag_admin/announcement/checklist_admin/public_data ...)
│  ├─ rag/                    # RAG 엔진 (core·config·ingest·persona·chat)
│  └─ requirements.txt
├─ database/busan_design_db_dump.sql   # DB 덤프(인수인계용)
├─ public/assets/             # 이미지·아이콘·폰트
├─ verify/                    # 자가검증(Playwright) 도구
├─ AI가상시민_상세설계서.docx / 가상시민_플랫폼_문의사항_답변서.docx
├─ CLAUDE.md · TODO.md · docs/ (WINDOWS_SETUP·CLAUDE_HANDOFF·FIGMA_DIFF_SPEC 등)
```

---

## 8. 자가 검증 (verify)
UI/백엔드 변경 후 `verify/` 도구로 화면 캡처·콘솔/네트워크 에러·API 상태를 자동 수집.
```bash
npm run verify -- --views=home,login --api=dashboard-summary   # 프론트+백엔드
npm run verify:fe -- --views=home        # 프론트만
npm run verify:api -- --api=dashboard-summary   # 백엔드만
```
리포트: `verify/reports/latest.json`, 캡처: `verify/screenshots/`. 새 view는 `verify/routes.json`에 추가.

---

## 9. 참고 문서 · 디자인
- **Figma**: 사용자 WDC 파일 `TCuOzEqNhoLKjhF0reBDks`, 관리자/리뉴얼 별도 프레임. (Figma가 곧 스펙)
- **CLAUDE.md**: 코드 컨벤션·디자인 토큰·페이지-노드 매핑.
- **TODO.md**: 페이지별 Figma 대비 미일치 체크리스트.
- 관리자 개발 단축 로그인: `admin` / `admin1234`.

---

## 10. 인수인계 주의사항 / 알려진 한계
- **RAG 동작 전제**: Qdrant(6333) 기동 + LLM 키(MINIMAX5 등) 필수. 없으면 가상시민 생성/챗봇만 비활성(서버는 정상 부팅).
- **가상시민 수치**는 LLM 추론값 → 감사·재현성 필요 시 결정론적 산식으로 교체 가능(설계서 8장).
- **HTTPS 필요**: 배포 시 geolocation·Firebase SMS는 평문 HTTP에서 차단됨.
- **DB 이관**: `database/sql_app.db`(SQLite)는 미사용 잔재. 실제 DB는 MariaDB → 이관은 `database/busan_design_db_dump.sql` 사용.
- **이미지 최적화 여지**: 일부 PNG가 큼(personas 1024² 등). 필요 시 리사이즈/WebP 전환 가능.
- **미완/후속**: 진단 어드민 필터 확장, AI설문 키워드/스피드버튼 설정, 공공데이터 엑셀 업로드, 대표 가상시민 고정 UI(importance 기반) 등 — 문의 답변서에 정리됨.
- **협업 주의**: 여러 개발자 병행. 작업 전 `git status`/`git log` 확인, PR 단위로 작게 유지.
