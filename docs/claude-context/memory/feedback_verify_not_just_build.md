---
name: feedback-verify-not-just-build
description: 작업 끝나면 빌드 성공만 보고하지 말고 실제 동작 검증(Playwright/verify) 거칠 것
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 738e903d-6db1-4d7b-ab90-38fc0aac1f0b
---

작업이 끝났을 때 `npm run build` 통과만 보고하면 안 된다. **반드시 실제 동작 검증 과정을 거쳐야 한다.**

**Why:** 빌드는 문법/타입만 보장한다. UI 인터랙션, API 연동, 백엔드 응답, 사진 모달 열림/닫힘 등 실제 동작은 빌드로 확인 불가. 빌드 통과해도 클릭 안 되거나 빈 화면 나오는 경우 다수 있었음. 사용자가 "백엔드 연동 안 되는 거 많다", "실제로 인터렉션 확인하셈" 등으로 명시적 요청한 적 있음.

**How to apply:**
- UI/백엔드 변경 후 `npm run build` 외에 추가로:
  1. `verify/` 도구 (`npm run verify:fe`, `npm run verify:api`) 사용, 또는
  2. Playwright MCP로 실제 클릭/입력/네트워크 응답 확인, 또는
  3. 둘 다 어렵다면 사용자에게 "실 검증 못함, 수동 확인 부탁드립니다" 명시
- 새 기능(모달/버튼/API)이면 최소한 해당 view를 sessionStorage 시드 + reload로 열어서 렌더되는지, 콘솔 에러 없는지 캡처
- 단순 텍스트/스타일 수정은 `verify:fe`로 회귀 캡처면 충분
- 백엔드 라우터/스키마 수정은 실제 endpoint 호출(curl 또는 Playwright)로 응답 확인
