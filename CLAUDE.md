# 부산 공공디자인 진단 플랫폼

React 19 + Vite 프론트(8501), FastAPI 백엔드(8000), MariaDB(docker-compose).

## ⭐ AI 작업 시 가장 먼저 읽을 것

1. **`TODO.md`** — Figma vs 코드 미일치 항목 페이지별 체크리스트. 작업 시작 전 현재 상태 파악, 작업 후 [x] 마크.
2. **이 파일 (CLAUDE.md)** — 전반 컨벤션
3. **Figma fileKey**: `jWpcqQv2jhb2mkzjEs1fuI` — 모든 화면 디자인 원본. `mcp__figma__get_design_context` / `get_screenshot` 사용.

## 작업 원칙

- **Figma가 곧 스펙이다**. 코드와 Figma가 다르면 Figma 기준으로 코드를 고친다 (디자이너 의도 우선).
- 화면 작업 전 해당 노드 스크린샷 받아서 시각 비교, 작업 후 `verify:fe`로 회귀 캡처. 두 이미지 비교로 검증.
- 작업 단위는 페이지 단위 (한 PR/한 커밋에 한 페이지). 여러 페이지 동시 변경 지양.
- TODO.md는 **항상 최신화**. 항목 완료 시 `[ ]` → `[x]`.

## 자가 검증 (피드백 루프)

UI/백엔드를 변경했으면 **반드시** `verify/` 도구로 자가 검증 후 사용자에게 보고한다. 화면 캡처, 콘솔/페이지 에러, 네트워크 4xx/5xx, API 상태 코드를 자동 수집한다.

```bash
# 프론트 + 백엔드 한 번에
npm run verify -- --views=home,login,reportList --api=dashboard-summary

# 프론트만
npm run verify:fe -- --views=home,reportList

# 백엔드만
npm run verify:api -- --api=dashboard-summary,checklist-categories
```

리포트: `verify/reports/latest.json`, 캡처: `verify/screenshots/<view>.png`. 종료 코드 0=통과 / 1=검증 실패 / 2=실행 실패.

전제: `npm run dev` (8501) + `cd backend && uvicorn main:app --reload` (8000) + `docker compose up -d` (DB).

**새 view 추가 → `verify/routes.json`에 항목 추가** (id/view/path/auth/waitFor selector). 자세한 건 `verify/CONTRACT.md`.

## 프론트 라우팅 특이점

react-router **미사용**. `App.jsx`의 `view` state machine으로 동작. URL은 `/`와 `/admin` 둘뿐. view는 `sessionStorage.current_view`에 저장 → Playwright/verify는 sessionStorage 시드 후 reload 패턴 사용.

## auth-gated view

`access_token` (localStorage) 없으면 로그인 리다이렉트. verify 시 `--token=<jwt>` 필요. 토큰 헬퍼 미구현.

## 컴포넌트 네이밍 컨벤션

- `M*` prefix: 모바일 전용 (예: `MProposalForm`, `MReportDetail`, `MSurveyJoin`)
- `PC*` prefix: PC 전용 (예: `PCProposeForm`, `PCMapCanvas`)
- prefix 없음: 공유 (예: `Home`, `MyPage`, `MobileBottomNav`)

`Home.jsx`는 viewport 감지 (`window.innerWidth >= 1024`)로 PC/모바일 분기. PC에서 모바일 화면 진입 막혀 있음.

## 디자인 시스템 토큰

| 영역 | 컬러 | 비고 |
|---|---|---|
| 제보·제안 | `#E6235A` (핑크) | active/CTA, FAB, FAB shadow `rgba(230,35,90,0.25)` |
| 제보·제안 sub bg | `#FCDAE3` (연핑크) | secondary 버튼 / sub-tag |
| 설문 | `#5B2EAB` (보라) | hero/primary CTA |
| 진단 (일반) | `#06AB69` (녹색) | primary, 라디오 selected |
| 진단 (전문가) | 보라 (TBD) | 미구현 영역 많음 |
| 카테고리 칩 색상 | 카테고리별 매핑 | `MProposalList`/`MReportList`의 `CAT_STYLES` 참조. 단, **리스트는 청록(주거) / 상세는 노랑** 등 Figma 자체가 일관성 없음 — 현재 코드는 리스트 컬러 일관 유지 |

`-0.02em` letter-spacing은 헤딩의 표준 (한글 가독성).

## 모바일 하단 네비 (`MobileBottomNav`)

5탭: 홈 / 설문 / 제보·제안 / 진단 / 나의 활동.
- 제보·제안은 chooser dropdown (제보하기 → `mReportMap`, 제안하기 → `mProposalMap`)
- active 컬러: 홈/설문/제보·제안/나의활동=`#5B2EAB`(보라), 진단=`#06AB69`(녹색)
- PC에선 hidden (`@media (min-width: 1024px) { display: none }`)

## 핵심 페이지 (제보·제안) — Figma 노드 매핑

| 코드 | Figma 노드 |
|---|---|
| `MProposalList` | `848:17364` |
| `MProposalMap` | `848:17890` |
| `MProposalForm` | `848:17301` |
| `MProposalDetail` | `848:17812~17849`, `18075`(전체) |
| `MProposalDone` | `848:18712` |
| 제안 임시저장 모달 | `848:18277` |
| `MReportList` | `848:19157` |
| `MReportMap` | `848:19015` |
| `MReportForm` | `848:18955` |
| `MReportDetail` | `848:19789` (좋아요 `19843`, 결과 `19897`/`20920`) |
| `MReportDone` | `848:20468` |
| 제보 임시저장 모달 | `848:20159` |
| 위치설정 모달 | `848:17477`(제안), `848:19327`(제보) |
| 정렬 모달 | `848:17589`(제안), `848:19455`(제보) |

**전체 인덱스는 `TODO.md` 하단 표 참조**.

## localStorage 키 (현재)

| 키 | 용도 |
|---|---|
| `access_token` | 인증 JWT |
| `mProposalForm:draft` | 제안 폼 임시저장 (type/title/body/location/좌표/savedAt) |
| `mReportForm:draft` | 제보 폼 임시저장 (cat/position/issue/body/savedAt) |
| `deletedReportIds` / `likedReportIds` / `userCreatedReports` / `updatedReportsMap` | 백엔드 미구현 우회 (TODO: 백엔드 이전) |

## 주요 외부 의존

- **Kakao Maps**: `react-kakao-maps-sdk`. 키: `VITE_KAKAO_MAP_KEY`. 래퍼 `PCMapCanvas` (forwardRef + useImperativeHandle, 모바일/PC 공용).
  - 핀 데이터: `[{ id, lat, lng, color?, title?, count? }]`
  - `count` 있으면 숫자 배지 핀, 없으면 일반 teardrop 핀
- **차트**: `recharts` 설치되어 있음 (RadarChart/PolarChart 등). lucide-react는 **금지** (관리자 영역 위반 다수, 치환 TODO).

## Figma 디자인-투-코드 워크플로

1. URL → fileKey + nodeId 추출 (예: `848-17301` → `848:17301`)
2. `mcp__figma__get_design_context` 호출 (코드+스크린샷)
3. **큰 노드는 토큰 초과**. 부모 메타로 자식 frame 파악 → 개별 frame씩 청크 처리
4. 스크린샷은 `/tmp/figma-compare/` 등에 저장 후 `Read` 툴로 시각 확인
5. 코드 적용 → `verify:fe`로 회귀 캡처 → Figma vs 캡처 시각 대조
6. TODO.md 항목 [x] 마크

## Figma 코드 출력 주의

Figma MCP가 반환하는 코드는 **React+Tailwind 레퍼런스**. 이 프로젝트는 plain CSS 사용. 클래스명/구조 그대로 복붙 금지, 디자인 의도만 추출해서 프로젝트 컨벤션으로 작성.

## 다른 동료 작업 영역 (충돌 방지)

다른 개발자가 설문/제안/제보 일부 페이지 담당. 작업 전 `git status` + `git log`로 미머지 변경 확인. PR 단위 작은 단위로 유지.

## 모르는 화면을 만났을 때

1. `TODO.md`에서 해당 페이지 항목 찾기 → 미일치 항목 우선
2. Figma 노드 ID 매핑 표 → 스크린샷 받기
3. 현재 코드 (M*/PC* 컴포넌트) 읽기
4. 시각 비교 후 diff 적용
5. verify로 회귀 캡처 → 시각 재확인

## DON'T

- ❌ Figma 코드 (Tailwind) 그대로 복붙
- ❌ react-router 도입 (현재 view state machine 유지, admin만 라우터 도입 검토 중)
- ❌ lucide-react 신규 사용 (스펙 위반)
- ❌ 다른 개발자 영역 임의 변경
- ❌ TODO.md 미반영 작업
- ❌ 빌드/verify 안 돌려보고 "완료" 보고
