# CLAUDE_HANDOFF — 다음 작업자(사람/AI) 인수인계

> 이 문서는 **Claude Code 세션에서만 축적돼 있던 컨텍스트**(user-local 메모리 30건 + 세션 함정/해결책)를 레포에 옮긴 것이다.
> `CLAUDE.md`(컨벤션)와 중복되는 부분은 최소화하고, **CLAUDE.md에 없는 실전 지식**만 담았다.
> 새 세션 시작 시 `CLAUDE.md` → 이 문서 → `TODO.md` 순서로 읽으면 바로 작업 가능.
>
> 최초 작성: 2026-07-15 (승모 브랜치)

---

## 0. 한 줄 요약

React 19 + Vite(:8501) 프론트 / FastAPI(:8000) 백엔드 / MariaDB(docker-compose). 라우팅은 react-router 없이 `App.jsx`의 `view` state machine. Figma가 곧 스펙. 모바일=`M*`, PC=`PC*`, 공유=prefix 없음.

---

## 1. 서버 기동 (실전 명령)

```bash
# 프론트 (포트 8501)
npm run dev

# 백엔드 (포트 8000) — ⚠️ uvicorn 단독은 PATH 미등록. 반드시 python3 -m 사용
cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# DB
docker compose up -d
```

- 백엔드 의존성 누락 가능: `boto3`(S3 업로드), `mangum`(Lambda 어댑터). 안 뜨면 `pip3 install boto3 mangum`.
- RAG 기능 쓰려면: `pip install qdrant-client sentence-transformers fastembed anthropic` + Qdrant 6333 기동(`docker run -p 6333:6333 qdrant/qdrant`) + `.env`에 `ANTHROPIC_API_KEY`.
- **⚠️ dev 서버를 작업 끝났다고 임의로 kill하지 말 것** (사용자가 검증 후 직접 만짐). 명시적 종료 요청 있을 때만.

### 로그인 계정
| 용도 | 계정 |
|---|---|
| Admin 단축(dev, 백엔드 우회) | `admin` / `admin1234` → 즉시 adminMain (`LoginNew.jsx` 하드코딩) |
| Admin 실계정 | `admin@test.com` / `adminpassword123` |
| 테스트 일반사용자 | ID `ktp1122` / PW `kang1122@@#` (강승모, district general) |
| 테스트 시드 시민 | citizen1..8 / pw1234 |

인증 가드 view를 verify/Playwright로 열 땐 위 토큰을 localStorage `access_token`에 시드 후 reload.

---

## 2. 라우팅 구조 (react-router 없음)

- `src/App.jsx`의 `view` state로 화면 전환. URL은 `/`(사용자)와 `/admin` 둘뿐.
- view는 `sessionStorage.current_view`에 저장 → Playwright/verify는 sessionStorage 시드 후 reload 패턴.
- 새 화면 추가 = App.jsx 상단 lazy import + 하단 view 분기 + `onNavigate` case 추가 + (필요시) `adminViews`/`noHeaderViews` 등록.
- **PC 공용 헤더는 `PCHeader` 하나뿐.** PC 페이지 컴포넌트에 자체 `<header>` 만들지 말 것 (WDC 로고 2줄 중복됨). 헤더 nav 바꾸려면 PCHeader.jsx만 수정. 자체 헤더 보유 뷰는 `noHeaderViews`에 추가.

---

## 3. Figma 작업 필수 규칙 (실수 다발 지점)

- **파일키가 3개다. 헷갈리지 말 것:**
  | 대상 | fileKey | page |
  |---|---|---|
  | 모바일 스펙(사용자 확정) | `TCuOzEqNhoLKjhF0reBDks` (WDC) | `0:1` |
  | PC 스펙 | `hJCPXp7YcYUL60u2NHiYrS` | `0:1` |
  | CLAUDE.md 표기 구파일(참고용) | `jWpcqQv2jhb2mkzjEs1fuI` | — |
- **⚠️ 프레임 버전 규칙: 캔버스 위쪽=구버전, 아래쪽일수록 최신.** 화면 찾으면 반드시 더 아래쪽에 최신 버전 있는지 확인하고 최신 기준으로 작업. (`get_metadata`로 자식 y좌표 확인)
- **⚠️ WDC Figma 파일이 2026-07-10 재구축됨.** 구 노드ID(`0:xxxxx`)는 전부 무효 → `302:xxxx`로 재발급. `FIGMA_DIFF_SPEC.md`/`FIGMA_DIFF_SPEC_PC.md`의 노드ID는 stale, 재매핑 필요. 신규 매핑 일부:
  - 홈 `302:14384`, 설문메인 `302:14614`, 로그인 `302:14636`, 진단폼 `302:19676`, 진단결과 `302:19985`, 가상시민 `302:15079/15172/15408`, 제안리스트 `302:17284`, 제보리스트 `302:15921`.
  - 리스트류 카테고리 아이콘 rail + 구역 드롭다운은 `302:5940` 실물 컴포넌트의 의도적 통일(제보/제안/진단 공통).
- 큰 노드는 `get_design_context`/`get_metadata`가 토큰 초과 → 파일로 저장됨. 먼저 `get_screenshot`으로 파악 후 자식 frame(모바일 width=393, PC≥1200) 개별 호출.
- Figma MCP가 반환하는 코드는 **React+Tailwind 레퍼런스**. 이 프로젝트는 **plain CSS**. 클래스명/구조 복붙 금지, 디자인 의도만 추출.
- **⚠️ SVG 아이콘 손으로 그리지 말 것.** 무조건 Figma `download_assets`(svg) 또는 `export_node_as_image`로 export해서 `public/`에 저장 후 `<img>`. (손그림 지적받은 적 있음)
- **Figma MCP 한도 초과 시**: 추측 작업 금지. "Figma 못 봄" 명확히 알리고 중단.
- 헤더 로고는 **WDC가 정답**. Figma의 "PDDP(가안)"은 outdated → mismatch로 보고하지 말 것.

### Talk to Figma (직접 편집) 브리지
공식 figma MCP(읽기)와 별개. `~/cursor-talk-to-figma-mcp`에서 `bun socket`(포트 3055) 기동 → Figma 플러그인 Connect로 채널명 확인 → `mcp__TalkToFigma__join_channel({channel})`. 브리지 재시작하면 플러그인 재Connect 필요.

---

## 4. 디자인 토큰 (Figma 실측 — CLAUDE.md 표보다 이게 최신)

| 영역 | 색 | 비고 |
|---|---|---|
| **제보(report)** | 보라 `#542aa3` | ⚠️ CLAUDE.md의 핑크 `#E6235A`는 **outdated** |
| **제안(propose)** | 핑크 `#f74e7e` | |
| 설문 | 보라 `#5B2EAB` | hero/primary CTA |
| 진단(모바일) | 그린 `#06AB69` | |
| 진단(PC) | 틸 `#23BDBB` | 모바일과 다름. PC nav active/CTA/핀/체크박스 |
| 공공데이터/AI가상시민 | 틸 `#23BDBB` | |
| 홈 카드 | 제보 `#242424` / 제안 `#23bdbb` | 위 제보/제안 테마색과 별개 |

- 공유 컴포넌트 `MFilterSheets`(RegionSheet/SortSheet)는 `accent` prop으로 컨텍스트색 전달.
- `-0.02em` letter-spacing = 헤딩 표준(한글 가독성).
- 진단 카테고리 칩 배경: 주거 `#DFF8F8`, 환경 `#C0E6C0`, 교육 `#FFC9C9`.

---

## 5. 모바일 하단 네비 — 🔒 절대 변경 금지

`MobileBottomNav`: **홈 / 설문 / 제보·제안 / 진단 / 나의 활동** (5탭, 순서·아이콘·색상 고정).
- 확정 Figma: `TCuOzEqNhoLKjhF0reBDks` node `22:6021`.
- 설문 탭 → `mSurveyList`(가상시민 아님), 아이콘 `nav_survey.svg`.
- 제보·제안 = chooser dropdown(제보하기→`mReportMap`, 제안하기→`mProposalMap`).
- active 색: 진단=`#23bdbb`(청록), 나머지=`#5B2EAB`(보라). PC에선 hidden.
- **디자인 변경 요청 와도 사용자에게 이 잠금 언급하고 확인받을 것.** (탭 순서 여러 번 바뀌어 사용자가 잠금 지시함)

---

## 6. 회원개편 이후 회귀 패턴 (조용히 깨지는 곳 — 새 화면 작업 시 의심)

가입 시 name·nickname 분리, usertype→district_code 매핑(citizen=general/expert=expert/admin=admin) 이후:

1. **소유자 판정은 반드시 `user_id`로.** 로그인 응답 `user_name = user.name`(이름)인데 작성자는 `author_name = nickname`으로 저장 → `author === user_name`(닉네임 vs 이름) 비교는 항상 실패해서 본인 글 수정/삭제 버튼 안 뜸. `/users/me`의 `user_id` ↔ `detail.user_id` 비교로 해결.
2. **진단 `진단대상` 필터**: `진단대상 === '시민'/'전문가'` 문자열 비교. PC 진단폼이 `진단대상`을 안 보내 NULL 저장되면 필터에서 전부 제외. 레거시 NULL은 user_id 보유분만 '시민' 백필.
3. **나의활동 카운트는 도메인별 전용 엔드포인트에서**: 제보=`/api/reports/mine`, 제안=`/api/reports/my-proposals`, 진단=`/checklist/my`, 설문=`/api/surveys/my-participations`. 한 엔드포인트에서 type 필터로 세려다 0 나오는 버그 잦음.

---

## 7. 백엔드 인벤토리 (새 화면 전 endpoint 존재 확인용)

`backend/` 구조:
- **모델**(`models.py`): `User` / `Report,ReportImage,ReportLike,ReportComment` / `NewProposal,ProposalLike,ProposalView,ProposalComment` / `Survey,SurveyQuestion,SurveyResponse,SurveyAnswer` / `ChecklistResult`(한글 컬럼: 진단지역/위도/경도/대분류/중분류/점수/리뷰) / `DistrictAnalysis,DistrictInsight,Persona` / `Notification,ActivityLog`.
- **라우터**(`backend/routers/`):
  - `auth.py`, `user_router.py` — 회원가입/로그인/users/me, /api/users(admin)
  - `report_router.py` — `/api/reports/*`(제보 list/full/mine/create/{id}/like/comments/clusters + 제안 `/proposals` CRUD+vote+view+comments+my-proposals+voted-proposals). ⚠️ `/{id}` int 라우트는 `/proposals/...` 정적 경로 **뒤**에 등록(FastAPI 매칭 순서)
  - `survey_router.py` — `/api/surveys/*` + `/admin`
  - `checklist_router.py` — `/checklist/*`(submit/list/my/{id}/clusters/aggregate/summary/recommendations)
  - `home_router.py` — `/api/home/stats|citizens|archives`
  - `admin_router.py` — `/api/admin/*`
  - `notification_router.py`, `search_router.py`(`/api/search`+`/suggest`)
  - `survey_chat_router.py` — `/api/survey-chat/*` (AI 대화형 설문, 아래 §8)
  - `public_data_router.py` — `/api/public-data/overview`
  - `rag_admin_router.py` — `/api/admin/rag/*`, `ai_citizens.py` — `/{id}/chat`
- **시드**: `seed_full_mock.py [--reset]`(전 도메인 idempotent, 기준 NOW=2026-05-04). `public_data/seed_data.py`(실데이터).
- 헬퍼: `notification_utils.py`의 `push_notification()`, `log_activity()`.

---

## 8. 주요 신규 서브시스템 (프론트/백엔드 위치)

### AI 대화형 설문 (구글폼 → 챗봇)
- 원본 ref: `shain1912/test4`(Streamlit+LangGraph → FastAPI 이식).
- 백엔드: `backend/survey_chat/`(config.py=필드설정, engine.py=**OpenAI 전용, OPENAI_API_KEY 없으면 RuntimeError**, gpt-4o). 필수필드 7개.
- 프론트: `src/components/SurveyChat.jsx`. 질문유형별 위젯(text/single_choice/scale). 진입: `mSurveyList`(모바일)/`pcSurveyList`(PC). teal `#23bdbb`.
- 어드민 분석: `src/admin/pages/SurveyChatAnalytics.jsx`(recharts + plotly 3D 산점도, `/api/survey-chat/analytics|clusters`).

### 공공데이터 (PC)
- `src/components/PCPublicData.jsx`(+css). view `pcPublicData`. teal.
- 백엔드 `public_data_router.py` 실데이터 연동됨(인구/교통사고/CCTV/PM10 등 출처표기). **단 인구피라미드/지도핀/상세카드는 예시(mock) — '예시' 태그.**
- ⚠️ **모바일 공공데이터는 미구현** (코드코리아 요청사항 §TODO).

### AI 가상시민 (페르소나 챗 + RAG)
- 프론트: `PersonaChat.jsx`(PC `PCAICitizen` 상세패널 버튼 / 모바일 `MAICitizenDetail` topbar 버튼). **백엔드는 사용자 RAG 연결 — 임의로 백엔드 만들지 말 것.**
  - API 계약: `POST /api/ai-citizens/{id}/chat`, body `{message, history:[{role,content}]}`, res `{reply, suggested?}`. 404 시 "준비중" 폴백.
- RAG 백엔드: `backend/rag/`(원본 `shain1912/runway`, Qdrant 하이브리드). heavy deps lazy import(키/Qdrant 없어도 부팅). LLM=Anthropic(`ANTHROPIC_API_KEY` 또는 `MINIMAX1`+`ANTHROPIC_BASE_URL`), 모델 env `RAG_MODEL`.
  - 어드민: `src/admin/pages/AdminRAGDashboard.jsx`, view `adminRAG`.
  - ⚠️ MiniMax는 한국어 품질 한계 → `ANTHROPIC_API_KEY` 넣으면 Claude 1순위로 품질 개선.
- PC `PCAICitizen`은 **카카오맵 금지 — 스타일라이즈드 SVG 지도(`FigmaDistrictMap`) 사용**(사용자 명시).
- 모바일 대시보드(`MAICitizen`, Figma 269:26854): 60여 지표 대형화면인데 백엔드 데이터 없어 **상단 산업·일자리 섹션만** 구현, 나머지는 '데이터 준비중'. **가짜 % 금지(정부 플랫폼).**

---

## 9. Firebase Phone Auth (SMS 본인인증)

- 회원가입·아이디/비번찾기 SMS = Firebase Phone Auth(프로젝트 `busan-design-wdc`, 사용자 ktp051332 소유). 설정 `.env`의 `VITE_FIREBASE_*`.
- 코드: `src/utils/firebase.js`, `src/utils/phoneAuth.js`(invisible reCAPTCHA 싱글톤 + 재전송 시 `grecaptcha.reset`), UI는 `PCSignup.jsx`/`PCLogin.jsx`의 `PhoneVerify`.
- **⚠️ localhost는 실 reCAPTCHA 토큰이 `invalid-app-credential`(firebase-js-sdk 알려진 한계).** → DEV 테스트번호 `010-0000-0000` / 코드 `123456`(mock, `import.meta.env.DEV`에서만). 실 SMS는 테스트 배포서버 `39.113.9.190:8501`(Firebase authorizedDomains 등록됨).
- ⚠️ authorizedDomains PATCH 시 GET 응답 sendSms 템플릿에 제어문자 있어 JSON 파싱 깨짐 → **목록 하드코딩해서 PATCH**(GET 파싱 후 append 금지, 안 그러면 도메인 전체 삭제).

---

## 10. 카카오맵

- `react-kakao-maps-sdk`. 키 `VITE_KAKAO_MAP_KEY`. 래퍼 `PCMapCanvas`(forwardRef+useImperativeHandle, 모바일/PC 공용).
- 핀: `[{id,lat,lng,color?,title?,count?}]` — `count` 있으면 숫자배지 핀, 없으면 teardrop.
- **⚠️ 키 2개 주의**: Default JS 키(48733958…)는 도메인 미등록으로 localhost 차단. `busan_promotion` 키(75d889cc…)가 등록돼 있어 `.env`를 이걸로 교체(2026-07-10). 배포 시 배포 도메인 등록 필수.
- Vite 504 'Outdated Optimize Dep'(신규 lazy-import 패키지): `touch vite.config.js`로 Vite 재시작(dev 세션 안 끊고 복구). 강제: `rm -rf node_modules/.vite/deps && touch vite.config.js`.

---

## 11. 자가 검증 (verify 도구)

빌드 통과 ≠ 동작 확인. **UI/백엔드 변경 후 반드시 verify 또는 Playwright로 실동작 확인 후 보고.**

```bash
npm run verify -- --views=home,login,reportList --api=dashboard-summary  # 프론트+백엔드
npm run verify:fe -- --views=home,reportList                              # 프론트만
npm run verify:api -- --api=dashboard-summary,checklist-categories        # 백엔드만
```

- 리포트 `verify/reports/latest.json`, 캡처 `verify/screenshots/<view>.png`. 종료코드 0=통과/1=검증실패/2=실행실패.
- 새 view → `verify/routes.json`에 항목 추가(id/view/path/auth/waitFor selector). PC 뷰는 `"viewport":{"width":1280,"height":900}` 넣어야 PC폭 렌더(없으면 모바일폭으로 깨짐).
- 새 endpoint → routes.json `apiChecks`에 추가.
- **사용자가 자리 비움/"오래 걸려도 됨" 신호 시**: 구현→verify→에러/시각 mismatch 수정→재verify를 **클린될 때까지 자동 반복**. (단 destructive 작업은 확인 필요)

---

## 12. localStorage 키

| 키 | 용도 |
|---|---|
| `access_token` | 인증 JWT |
| `mProposalForm:draft` / `mReportForm:draft` / `pcReportForm:draft` | 폼 임시저장 |
| `deletedReportIds`/`likedReportIds`/`userCreatedReports`/`updatedReportsMap` | 백엔드 미구현 우회 (TODO: 백엔드 이전) |

⚠️ draft 키가 단일이라 동일 브라우저 다중 사용자 시 충돌(사용자별 분리 미고려).

---

## 13. 협업 / 작업 방식

- **다른 개발자가 설문/제안/제보 일부 담당.** 작업 전 `git status`+`git log`로 미머지 변경 확인. `MSurvey*`, `PCSurvey*`, `PCPropose*`, `PCReport*`, `MobileBottomNav*` 등은 지시 없으면 건드리지 않음.
- 작업 단위 = 페이지 단위(한 PR/커밋에 한 페이지). 여러 페이지 동시 변경 지양.
- 사용자는 Figma 노드 URL + 한 줄 지시로 수정 요청을 **연속 투척**한다 → 하나도 빼먹지 말 것(전부 Task 등록). 소=직접 처리, 대작업/큐적체=서브에이전트(파일 겹치면 worktree). 확인 필요 시 `/grill-me`.
- **⚠️ 서브에이전트 계정 세션 한도**: 매일 오전 2시 KST 리셋. 대규모 병렬은 리셋 후에만.

---

## 14. DON'T (금지)

- ❌ Figma 코드(Tailwind) 그대로 복붙 (plain CSS 프로젝트)
- ❌ react-router 도입 (view state machine 유지)
- ❌ lucide-react 신규 사용 (스펙 위반, 치환 TODO)
- ❌ 손으로 SVG 아이콘 그리기 (Figma export만)
- ❌ MobileBottomNav 탭 변경
- ❌ 다른 개발자 영역 임의 변경
- ❌ TODO.md 미반영 작업
- ❌ 빌드/verify 안 돌려보고 "완료" 보고
- ❌ dev 서버 임의 kill
- ❌ 정부 플랫폼에 가짜 % / 조작 데이터 넣기

---

## 15. 현재 미완/대기 (상세는 TODO.md)

- **🆕 코드코리아 수정요청사항(2026-07-13, 김유리)** — TODO.md 최상단. 홈/설문/AI가상시민/진단/공공데이터/제보·제안(PC+모바일)/관리자(회원·제보제안설문·진단관리·공공데이터·가상시민) 다수. docx 스크린샷 28장 근거 반영됨.
- 디자이너 확인 필요 P1: ①회원가입 약관동의 가입유형 레이아웃, ②진단결과 레이더 축(시설 8축 vs 품질 6축), ③mAICitizen 검색바 부재, ④pcDiagnosisMap 우측패널 구조, ⑤pcSurveyList AI 인트로 교체, ⑥pcSurveyResults 종합 레이더 미구현.
- FIGMA_DIFF_SPEC.md / _PC.md 노드ID 재매핑(파일 재구축으로 stale) — 비긴급.
- 설문3 "햄버거" 테스트 문항(id 22) DB 잔존 — admin 설문편집에서 제거 권고(동료 데이터라 임의 삭제 안 함).

---

## 16. 문서/자료 원본 위치 (git 미추적)

프로젝트 루트:
- `260713_코드코리아 수정요청사항.docx` — 최신 디자인 수정요청(스크린샷 근거). TODO.md 반영됨.
- `26.06.10_...오류사항...xlsx`(박환수 기획부) — 모바일 QA, 반영 완료.
- `가상시민_플랫폼_문의사항_답변서.docx`, `AI가상시민_상세설계서.docx` — 반영 완료.
- `WDC_Busan_AI_Chatbot_Dev_Plan.docx`, `WDC_..._답변서.pdf` — 별도 WDC 챗봇 RAG 구축 제안서(즉시 UI 작업 아님).
- `부산공공디자인플랫폼_시스템아키텍처.pdf` — 시스템 아키텍처 문서.
