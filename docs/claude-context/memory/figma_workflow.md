---
name: Figma 디자인-투-코드 워크플로
description: Figma 노드가 큰 프레임이면 metadata/design_context가 토큰 초과 — 청크 처리 패턴
type: feedback
originSessionId: 4d61babc-b41a-4f3f-8017-939ee251c222
---
Figma MCP에서 큰 페이지(노드 941:5782 같은 섹션) 호출 시 결과가 토큰 한도 초과로 파일에 저장됨.

**Why:** USER:MOBILE/USER:PC 같은 섹션은 수십 개 화면을 포함하므로 한 번에 디자인 컨텍스트를 가져올 수 없음. 직접 큰 노드에 `get_design_context`/`get_metadata` 호출하면 실패.

**How to apply:**
1. 큰 섹션은 먼저 `get_screenshot`으로 시각적으로 파악
2. 저장된 metadata 파일에서 `python3 + json.load + regex`로 child frame 목록 추출 (mobile은 width=393, PC는 width>=1200으로 필터)
3. 각 sub-screen 노드 ID로 개별 `get_design_context` 호출하여 페이지별로 코드 받기
4. Figma 코드는 React+Tailwind 참고용 — 프로젝트 컨벤션(M*/PC* + 별도 CSS 파일)에 맞게 변환

`verify/figma-refs/` 폴더에 화면별 png 캡처가 보관됨. mobile/ 서브폴더에 모바일 캡처.

**최신 프레임 우선 원칙 (2026-05-28 추가):**
Figma 파일에서 **위쪽 프레임은 구버전 디자인, 아래쪽 프레임일수록 최신 디자인**.
화면 찾을 때 반드시 **가장 아래쪽(최신)** 프레임을 기준으로 삼아야 함.
이미 찾은 노드가 위쪽에 위치한다면 같은 화면의 더 아래쪽 버전이 있는지 추가 탐색 후 최신 버전으로 작업할 것.

**Vite dev 서버 504 'Outdated Optimize Dep' 대응:**
- 새 컴포넌트가 신규 패키지(예: recharts, react-kakao-maps-sdk)를 lazy-import할 때 Vite의 `?v=<hash>`가 stale이면 504 발생
- `_metadata.json`의 hash와 페이지 요청의 v 파라미터가 다르면 캐시 corrupt 상태
- 해결: `touch vite.config.js` — Vite가 config 변경 감지하여 자동 재시작 → 새 hash로 deps 재최적화. 사용자 dev 세션 끊지 않고 복구 가능
- 더 강제적: `rm -rf node_modules/.vite/deps && touch vite.config.js`
