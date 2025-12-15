# 🛠️ 지능형 공공디자인 통합 진단 플랫폼 개발 명세서 (Technical Specification) v3.0

본 문서는 **BDP Platform**의 신규 개발 및 고도화를 위한 통합 기술 명세서입니다. 본 프로젝트는 **MariaDB**를 메인 데이터베이스로 사용하며, 기획된 디자인 시스템과 보안 가이드라인을 엄격히 준수해야 합니다.

---

## 1. 🏗️ 시스템 아키텍처 (System Architecture)

### 1.1. 기술 스택 (Tech Stack)

| 구분 | 기술 / 라이브러리 | 버전 / 비고 |
| :--- | :--- | :--- |
| **Frontend** | React | v18.3+ (Vite Build) |
| | React Router DOM | v6+ (SPA Routing) |
| | Tailwind CSS | v3.4+ (Utility-first) |
| | Recharts | 데이터 시각화 (차트) |
| | React-Leaflet | 지도 시각화 (OpenStreetMap) |
| | Axios | HTTP Client (Interceptors 필수) |
| **Backend** | FastAPI | v0.100+ (Python 3.9+) |
| | Uvicorn | ASGI Server |
| | MariaDB | System Default DB (10.6+) |
| | SQLAlchemy | ORM (비동기 지원 권장) |
| | Pydantic | 데이터 검증 |
| **AI** | OpenAI API | GPT-4o / GPT-3.5-turbo |


```env
DB_CONNECTION=mysql+pymysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=busan_design_db
SECRET_KEY=your_jwt_secret_key
OPENAI_API_KEY=sk-...
```

### 2.2. ERD 및 스키마 상세

#### `users` (관리자 및 사용자)
| Field | Type | Options | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 고유 ID |
| `username` | VARCHAR(50) | Not Null | 사용자 실명 |
| `email` | VARCHAR(100) | Unique | 로그인 ID |
| `hashed_password` | VARCHAR(255) | Not Null | Bcrypt Hash |
| `is_active` | TINYINT(1) | Default 1 | 계정 잠금 여부 |
| `role` | VARCHAR(20) | Default 'user' | 권한 (admin, user) |

#### `district_scores` (지역 진단 데이터)
현재 데모 데이터가 반환하는 내용을 실제 테이블로 구현해야 합니다.
| Field | Type | Options | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 고유 ID |
| `year` | INT | Index | 기준 연도 (2023, 2024...) |
| `district_code` | VARCHAR(10) | Index | 행정동 코드 (예: '21050') |
| `total_score` | FLOAT | Not Null | 종합 점수 |
| `safety_grade` | CHAR(1) | Not Null | 등급 (S, A, B, C) |
| `metrics_json` | JSON | Nullable | 세부 지표 (주거, 교통, 환경 점수) |

---

## 3. 🔌 API 상세 명세 (API Specification)

### 3.1. Authentication (`/auth`)
- **POST** `/auth/signup`: 회원가입
  - Body: `{ username, email, password }`
- **POST** `/auth/login`: 로그인
  - Body: `{ email, password }`
  - Response: `{ access_token, token_type: "bearer" }`

### 3.2. Dashboard (`/dashboard`)
- **GET** `/dashboard/summary`: 종합 현황 조회
  - Param: `?year=2025`
  - Response: `{ status, trend, alerts: [] }`
- **GET** `/dashboard/chart/{district_code}`: 차트 데이터 조회 (구현 필요)
  - Param: `?year=2025`
  - Response: `{ name: "1월", housing: 80, ... }[]`

### 3.3. AI Assistant (`/ai`)
- **POST** `/ai/chat`: 챗봇 질의응답
  - Body: `{ message: "위험 요인 분석해줘", context: { district: "강서구", score: 70 } }`
  - Logic: 프론트엔드에서 현재 대시보드 상태(`context`)를 함께 보내면, 백엔드가 이를 시스템 프롬프트에 주입하여 답변 생성.

---

## 4. 🎨 디자인 시스템 (Design System)

### 4.1. 컬러 팔레트 (`variables.css` 준수)
모든 색상은 CSS 변수로 관리되어야 하며, 하드코딩을 금지합니다.

| 용도 | 변수명 | Hex Code (Dark Default) |
| :--- | :--- | :--- |
| **Main Background** | `--bg-body` | `#0f172a` (Slate-900) |
| **Card Background** | `--bg-card` | `#1e293b` (Slate-800) |
| **Primary Text** | `--text-primary` | `#f8fafc` (Slate-50) |
| **Housing (주거)** | `--cat-housing` | `#3b82f6` (Blue-500) |
| **Safety (안전)** | `--cat-safety` | `#f59e0b` (Amber-500) |
| **Transport (교통)** | `--cat-transport` | `#ef4444` (Red-500) |
| **Environment (환경)** | `--cat-env` | `#10b981` (Emerald-500) |

### 4.2. 아이콘 사용 정책 (Critical Rule) 🚨
- **`lucide-react` 패키지 사용 절대 금지**: 특정 환경에서 렌더링 충돌(Blank Screen) 이슈 확인됨.
- **대안**: SVG 코드를 직접 컴포넌트 내에 삽입(`Inline SVG`)하거나, 별도의 `Icon` 컴포넌트를 만들어 SVG를 리턴하도록 구현.

---

## 5. 🛠️ 개발 가이드 (Development Guide)

### 5.1. 사전 요구사항 (Prerequisites)
- [ ] Node.js v18+
- [ ] Python 3.9+
- [ ] MariaDB Server 설치 및 구동
