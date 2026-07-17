---
name: firebase-phone-auth
description: 회원가입/찾기 SMS 본인인증은 Firebase Phone Auth(프로젝트 busan-design-wdc) 사용
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

PC 회원가입·아이디/비번찾기의 휴대폰 인증은 **Firebase Phone Authentication**(SMS OTP)으로 동작한다. 별도 SMS 서버 없음 — Firebase가 백엔드.

- Firebase 프로젝트: `busan-design-wdc` (사용자 ktp051332 소유). 설정은 `.env`의 `VITE_FIREBASE_*`.
- 코드: `src/utils/firebase.js`(init), `src/utils/phoneAuth.js`(invisible reCAPTCHA + signInWithPhoneNumber + +82 변환). UI는 `PCSignup.jsx`/`PCLogin.jsx`의 `PhoneVerify`.
- Phone 제공업체는 콘솔에서 활성화됨(확인: identitytoolkit recaptchaConfig 200, operation-not-allowed 없음).

**함정(해결됨):** `operation-not-allowed` + "SMS unable to be sent until this region enabled" = **SMS 지역정책** 문제. 신규 프로젝트는 `smsRegionConfig.allowlistOnly`가 비어(=전 지역 차단) 있음. KR 허용 필요. + Phone Auth 실제 SMS는 **Blaze 결제 필수**.
- 설정은 Identity Toolkit admin API로 가능: refresh token(`~/.config/configstore/firebase-tools.json`) → access token → `PATCH admin/v2/projects/busan-design-wdc/config`. enabled/smsRegionConfig 둘 다 이 경로.
- 테스트번호 `+82 10-1111-1111 / 111111` 등록됨. DEV에서 `window.__fbAuth.settings.appVerificationDisabledForTesting=true` + 테스트번호로 헤드리스 E2E 검증 가능(reCAPTCHA 우회). `firebase.js`가 DEV에서만 `window.__fbAuth` 노출.

**함정2(해결됨):** `appVerificationDisabledForTesting=true`(우회)를 켠 채 **실제 번호**로 보내면 `CAPTCHA_CHECK_FAILED: MALFORMED` → 반복되면 `too-many-requests`. 그래서 앱에서 우회를 **완전 제거**했고, reCAPTCHA는 **size:'normal'(보이는 체크박스)** 로 전환(invisible은 신규 도메인에서 조용히 멈춤). 컨테이너 `#recaptcha-container`는 PhoneVerify 안에 위치, 언마운트 시 resetRecaptcha.

**How to apply:** 실제 폰 = 인증 클릭 → reCAPTCHA 체크박스 완료 → 실 SMS. 코드 바꾼 뒤엔 브라우저 **하드 새로고침** 필수(stale firebase.js가 우회 켠 채 남으면 MALFORMED). E2E 자동화는 테스트에서 `window.__fbAuth.settings.appVerificationDisabledForTesting=true` 직접 세팅 + 테스트번호(010-1111-1111/111111). 관련 [[feedback_no_handmade_svg]]
