---
name: firebase_sms_recaptcha
description: Firebase SMS(OTP) 인증 근본원인·수정·DEV 테스트번호. 문자인증 깨질 때 먼저 볼 것
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

Firebase Phone Auth(SMS) 인증 = 핑크빛 에러 캐스케이드의 근본원인은 **visible reCAPTCHA(`size:'normal'`)** 였다.

**원인 체인:**
- reCAPTCHA 토큰은 1회용 → 재전송 시 소비된 토큰 재사용 → `auth/invalid-app-credential`.
- 토큰 회피용으로 verifier를 매번 destroy/recreate → visible 체크박스 DOM 파괴 → `recaptcha__ko.js: Cannot read properties of null (reading 'style')` TypeError.
- 실패 재시도 누적 → `auth/too-many-requests` (시간기반, 코드로 못 품).

**수정 (src/utils/phoneAuth.js):**
- `size:'invisible'` 로 전환 — 체크박스를 React 트리에 안 그려 DOM-null 버그 원천 제거.
- verifier는 싱글톤 1회 생성, 재전송 시 `grecaptcha.reset(widgetId)` 로 새 토큰 발급(=invalid-app-credential 해결).

**검증 한계:** 실 reCAPTCHA는 사람만 통과 가능. Playwright(`navigator.webdriver`)는 invisible reCAPTCHA 토큰을 못 받아 hang → 자동화로 실 SMS 경로 검증 불가. `appVerificationDisabledForTesting=true`로 네트워크 경로만 격리검증 가능(비테스트번호는 `CAPTCHA_CHECK_FAILED MALFORMED`가 정상응답).

**DEV 테스트번호 (콘솔 테스트번호의 클라이언트 대체):** `010-0000-0000` / 코드 `123456`. `import.meta.env.DEV`에서만 동작, Firebase 안 거치고 가짜 confirmationResult 반환. 실번호는 실 Firebase로 감. 프로덕션 빌드 무시. → localhost 실사용 경로는 이 mock이 유일.

**확정 진단(2026-06-15):** 백엔드/설정 전부 정상 — 등록 테스트번호 `010-1111-1111`/`111111`로 sendVerificationCode 200 + signInWithPhoneNumber 200(실 idToken 발급) 확인. App Check/MFA/blockingFunctions/Enterprise enforcement 전부 OFF. **유일한 실패 = localhost에서 생성된 실 reCAPTCHA 토큰만 `invalid-app-credential`** (Firebase 알려진 localhost 한계, firebase-js-sdk #8387. 배포 도메인에선 정상). 실 reCAPTCHA는 사람만 통과 → Playwright(webdriver) 검증 불가.

**사용자 결정:** localhost는 mock 유지, 실 SMS는 **테스트 배포서버 `39.113.9.190:8501`**. 이 IP를 Firebase authorizedDomains에 등록함(admin v2 config PATCH, updateMask=authorizedDomains). 현재 목록: localhost, *.firebaseapp.com, *.web.app, 127.0.0.1, 39.113.9.190.
⚠️ authorizedDomains PATCH 시 GET응답의 sendSms 템플릿에 제어문자 있어 JSON파싱 깨짐 → 빈 body로 덮어쓰면 도메인 전체 삭제됨. **목록을 코드에 명시(하드코딩)해서 PATCH할 것** (GET 파싱 후 append 금지).
⚠️ 미검증 리스크: reCAPTCHA가 **bare IP**를 도메인으로 인정 안 할 수 있음 → 그래도 invalid-app-credential 나면 호스트명 필요(예: `39-113-9-190.nip.io`). HTTP/비보안컨텍스트는 reCAPTCHA v2엔 대체로 OK.

관련: [[firebase_phone_auth]] [[dev_servers]]
