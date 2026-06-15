// Firebase 초기화 (Phone Auth / SMS 인증용)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = !!cfg.apiKey;

let app = null;
let auth = null;
if (firebaseEnabled) {
    app = initializeApp(cfg);
    auth = getAuth(app);
    auth.languageCode = 'ko'; // SMS 문구 한국어

    // 항상 실제 reCAPTCHA(보이는 체크박스) + 실제 SMS.
    // (자동화 E2E에서만 window.__fbAuth.settings.appVerificationDisabledForTesting=true 로 우회)
    if (import.meta.env.DEV && typeof window !== 'undefined') {
        window.__fbAuth = auth;
    }
}

export { app, auth };
