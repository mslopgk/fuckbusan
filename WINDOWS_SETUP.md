# 윈도우 개발/배포 서버 실행 매뉴얼

부산 공공디자인 진단 플랫폼을 **Windows** 환경에서 구동할 때의 설치·실행 순서와 주의사항.
(스택: React 19 + Vite `:8501` / FastAPI `:8000` / MariaDB `:3306` / RAG = Qdrant `:6333` + ko-SBERT + Minimax)

> macOS/리눅스 기준 `package.json`의 `python3`, `npm run backend` 등이 **윈도우에선 그대로 안 먹습니다.** 아래 윈도우 전용 명령을 쓰세요.

---

## 0. 사전 설치 (Prerequisites)

| 항목 | 버전/비고 |
|---|---|
| **Python** | 3.11.x (3.12+는 torch/sentence-transformers 휠 호환 확인). 설치 시 **"Add python.exe to PATH" 체크** |
| **Node.js** | 18 LTS 이상 (`node -v`) |
| **Docker Desktop** | MariaDB·Qdrant 컨테이너용 (WSL2 백엔드 권장). 또는 네이티브 MariaDB 설치 |
| **Git for Windows** | 설치 후 UTF-8/긴 경로 설정(아래 1단계) |
| **(선택) Visual C++ Build Tools** | `bcrypt`/`argon2`/일부 휠 빌드 시 필요할 수 있음 |

---

## 1. 클론 + Git 윈도우 설정 ⚠️ 중요

지도 배경 에셋 파일명이 **한글**(`public/assets/지도 배경 데스크탑.png`)이라, 설정 안 하면 체크아웃이 깨집니다.

```powershell
git config --global core.quotepath false      # 한글 파일명 정상 처리
git config --global core.autocrlf true         # 윈도우 CRLF 자동 변환
git config --global core.longpaths true        # 긴 경로 허용

git clone https://github.com/BlueHair37/fuckbusan.git
cd fuckbusan
git checkout backend-wiring-and-mock-seed       # 작업 브랜치
```

체크아웃 후 확인: `dir "public\assets\지도 배경 데스크탑.png"` 가 보여야 함. 안 보이면
`git config core.precomposeunicode true` 후 `git checkout -- .` 재시도.

---

## 2. 환경변수 파일 (.env) — **git에 없음, 직접 생성**

`.env`는 `.gitignore` 처리되어 깃에 올라가지 않습니다. **2개 파일을 직접 만들어야** 합니다.

### 2-1. `backend\.env` (백엔드)
```env
# DB
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=busan_design_db
DB_USER=busan
DB_PASSWORD=busanpw

# 인증
SECRET_KEY=<랜덤 문자열>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI 키
OPENAI_API_KEY=sk-...            # AI 대화형 설문(필수)
GEMINI_API_KEY=...               # 가상시민 아바타 생성(선택)
MINIMAX1=eyJ...                  # AI 가상시민 RAG LLM (Minimax JWT). MINIMAX1~4 중 1개 이상
# RAG_DIAG_LIMIT=500             # 진단 데이터 인덱싱 표본 수(선택, 기본 500)
# QDRANT_HOST=localhost          # (선택) 기본 localhost:6333
# RAG_MODEL=MiniMax-M2.7         # (선택) Minimax 키면 자동 설정됨
```

### 2-2. `.env` (루트 — Vite 프론트 + docker-compose DB)
```env
# docker-compose 용
DB_ROOT_PASSWORD=rootpw
DB_NAME=busan_design_db
DB_USER=busan
DB_PASSWORD=busanpw
DB_PORT=3306
DB_HOST=127.0.0.1

# 프론트(Vite)
VITE_API_URL=                    # 비워두면 vite proxy로 8000 전달(개발). 배포 시 백엔드 URL
VITE_KAKAO_MAP_KEY=...           # 카카오맵
VITE_FIREBASE_API_KEY=...        # 로그인 SMS(Firebase)
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
> 참고: `backend\.env.production.example` 에 프로덕션 키 예시가 있습니다. macOS 원본 서버의 `.env` 값을 그대로 복사해 오는 게 가장 빠릅니다.

---

## 3. 데이터베이스 (MariaDB)

### Docker (권장)
```powershell
docker compose up -d        # mariadb:10.6, :3306
docker compose ps           # 상태 확인
```
초기 스키마는 백엔드 기동 시 `create_all`로 자동 생성됩니다. 시드/기존 데이터가 필요하면:
```powershell
docker compose exec -T db mariadb -ubusan -pbusanpw busan_design_db < database\backup.sql
```
(PowerShell에서 `<` 리다이렉트가 막히면 `Get-Content database\backup.sql | docker compose exec -T db mariadb -ubusan -pbusanpw busan_design_db`)

### 네이티브 MariaDB 사용 시
MariaDB 설치 → `busan_design_db` DB와 `busan` 유저 생성 → `backend\.env`의 DB_* 값 맞추기.

---

## 4. 백엔드 (FastAPI :8000)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate                  # (PowerShell 실행정책 막히면: Set-ExecutionPolicy -Scope Process RemoteSigned)
python -m pip install --upgrade pip
pip install -r requirements.txt
```

> ⚠️ **RAG 의존성(torch/sentence-transformers)은 용량이 큽니다(수 GB).** GPU 불필요 — CPU 휠로 충분.
> torch 설치가 느리거나 실패하면 CPU 전용으로: `pip install torch --index-url https://download.pytorch.org/whl/cpu`

실행:
```powershell
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
> 🚫 `npm run backend` 는 `python3`를 호출해서 **윈도우에서 실패**합니다. 위 명령을 직접 쓰세요.
> `uvicorn ...` 만 치면 "명령을 찾을 수 없음" → 반드시 `python -m uvicorn`.

확인: 브라우저로 `http://localhost:8000/docs` (Swagger) 열리면 OK.

---

## 5. 프론트엔드 (Vite :8501)

```powershell
cd ..            # 프로젝트 루트
npm install
npm run dev      # http://localhost:8501
```
빌드: `npm run build` → `dist/`. (Vite dev는 `/api`,`/users` 등을 `localhost:8000`으로 프록시)

---

## 6. AI 가상시민 RAG (Qdrant + Minimax)

RAG(공공데이터 취합 → 페르소나 생성/대화)는 **Qdrant 벡터DB**와 **Minimax 키**가 있어야 동작합니다. 없어도 서버는 정상 부팅되고, 어드민 대시보드가 미연결을 빨간 점으로 표시합니다.

### 6-1. Qdrant 기동 (택1)
```powershell
# (A) Docker — 권장
docker run -d --name busan-qdrant -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant

# (B) Docker 없이 — Qdrant Windows Standalone 바이너리
#     https://github.com/qdrant/qdrant/releases 에서 qdrant-x86_64-pc-windows-msvc.zip 받아 qdrant.exe 실행
```

### 6-2. 사용 흐름 (어드민)
1. 관리자 로그인 → 좌측 사이드바 **AI 가상시민 › RAG 관리**
2. 상태 카드 4개(의존성/Qdrant/LLM/인덱스)가 **전부 초록**인지 확인
3. **데이터 수집·인덱싱** 버튼 → 제보·제안·진단·설문·공공데이터를 Qdrant에 인덱싱
   - ⚠️ **최초 1회 ko-SBERT 모델(`jhgan/ko-sbert-multitask`, ~400MB) 다운로드** → 인터넷 필요, 캐시: `%USERPROFILE%\.cache\huggingface`
4. **페르소나 생성**(구·군 선택 + 인원) → 생성된 가상시민이 사용자 `AI 가상시민` 화면에 표시
   - Minimax는 reasoning 모델이라 **1명당 30~60초**. 인원이 많으면 시간 소요.

---

## 7. 포트 정리

| 서비스 | 포트 | 비고 |
|---|---|---|
| Vite (프론트) | 8501 | `npm run dev` |
| FastAPI (백엔드) | 8000 | `python -m uvicorn` |
| MariaDB | 3306 | docker compose |
| Qdrant | 6333 | RAG 벡터DB |

방화벽/다른 프로세스가 점유 시: `netstat -ano | findstr :8000` → `taskkill /PID <pid> /F`.

---

## 8. 윈도우 자주 겪는 문제 (Troubleshooting)

| 증상 | 원인/해결 |
|---|---|
| `python3` 명령 없음 / `npm run backend` 실패 | 윈도우는 `python`. `python -m uvicorn main:app --reload --port 8000` 직접 실행 |
| `uvicorn: 명령을 찾을 수 없음` | venv 활성화 후 `python -m uvicorn` 사용 (PATH 미등록) |
| 지도/배경 이미지 깨짐·404 | 1단계 `core.quotepath false` 미설정으로 한글 파일명 체크아웃 실패 → 재클론/`git checkout -- .` |
| 한글 콘솔 깨짐 | `chcp 65001` (UTF-8 코드페이지) 후 실행 |
| `.venv\Scripts\activate` 차단 | `Set-ExecutionPolicy -Scope Process RemoteSigned` |
| torch/sentence-transformers 설치 실패·느림 | CPU 휠: `pip install torch --index-url https://download.pytorch.org/whl/cpu`, 그 후 `pip install -r requirements.txt` |
| `bcrypt`/`argon2` 빌드 에러 | Visual C++ Build Tools 설치, 또는 `pip install --only-binary :all: bcrypt argon2-cffi` |
| DB 연결 실패 | docker compose 기동 확인 + `backend\.env` DB_HOST=127.0.0.1, 포트/비번 일치 |
| RAG 인덱싱이 한참 멈춤 | 최초 ko-SBERT 모델 다운로드 중(정상). 완료 후 빨라짐. 진단 표본은 `RAG_DIAG_LIMIT`로 조절 |
| 가상시민 페르소나 생성 "파싱 실패" | LLM 응답 truncation — 1명씩 생성하도록 이미 처리됨. 그래도 나면 `RAG_MODEL`을 비-reasoning 모델로 변경 검토 |
| CRLF 경고 | `core.autocrlf true`면 정상(경고 무시 가능) |

---

## 9. 빠른 점검 체크리스트

- [ ] `git config core.quotepath false` 적용 + 한글 에셋 체크아웃 OK
- [ ] `backend\.env` + 루트 `.env` 생성 (키 포함)
- [ ] `docker compose up -d` → MariaDB 3306
- [ ] `backend` venv + `pip install -r requirements.txt`
- [ ] `python -m uvicorn main:app --reload --port 8000` → `/docs` 열림
- [ ] `npm install` + `npm run dev` → 8501 화면
- [ ] (RAG) `docker run ... qdrant` 6333 + Minimax 키 → 어드민 RAG 상태 전부 초록
- [ ] 어드민 RAG 인덱싱 → 페르소나 생성 → 사용자 AI 가상시민에 표시 확인
