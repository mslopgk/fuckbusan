// Firebase Phone Auth (SMS OTP) 헬퍼
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth, firebaseEnabled } from './firebase';

// 010-1234-5678 → +821012345678
export const toE164KR = (phone) => {
    const d = (phone || '').replace(/\D/g, '');
    if (d.startsWith('82')) return '+' + d;
    if (d.startsWith('0')) return '+82' + d.slice(1);
    return '+82' + d;
};

// 휴대폰번호 하이픈 자동 포맷 (입력 중)
export const formatPhone = (value) => {
    const d = (value || '').replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
};

export const PHONE_RE = /^01[0-9]-\d{3,4}-\d{4}$/;

// 생년월일 8자리 유효성 (실제 날짜인지)
export const isValidBirth = (v) => {
    if (!/^\d{8}$/.test(v)) return false;
    const y = +v.slice(0, 4), m = +v.slice(4, 6), d = +v.slice(6, 8);
    const now = new Date().getFullYear();
    if (y < 1900 || y > now) return false;
    if (m < 1 || m > 12) return false;
    const days = [31, (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return d >= 1 && d <= days[m - 1];
};

let verifier = null;
let widgetId = null;
export const resetRecaptcha = () => {
    try { if (verifier) verifier.clear(); } catch { /* noop */ }
    verifier = null;
    widgetId = null;
};

// DEV 전용 테스트 번호: 실제 SMS·reCAPTCHA·요청한도 없이 OTP 플로우 검증/데모용.
// (Firebase 콘솔 "테스트 전화번호"의 클라이언트 대체물. 프로덕션 빌드에선 무시됨)
const DEV_TEST_CODES = { '010-0000-0000': '123456' };
const devTestCode = (phone) =>
    import.meta.env.DEV ? DEV_TEST_CODES[(phone || '').trim()] : undefined;

// SMS 발송 → confirmationResult 반환 (이후 .confirm(code))
export const sendSms = async (phone, containerId = 'recaptcha-container') => {
    // DEV 테스트 번호면 Firebase를 거치지 않고 가짜 confirmationResult 즉시 반환
    const testCode = devTestCode(phone);
    if (testCode) {
        return {
            __devMock: true,
            confirm: async (code) => {
                if (String(code) === testCode) return { user: { phoneNumber: toE164KR(phone) } };
                const err = new Error('invalid-verification-code');
                err.code = 'auth/invalid-verification-code';
                throw err;
            },
        };
    }
    if (!firebaseEnabled) throw new Error('SMS 인증이 설정되지 않았습니다. (Firebase 미설정)');
    // invisible reCAPTCHA: 체크박스를 DOM에 그리지 않아 React 리렌더로 위젯이 깨지지 않는다.
    // verifier는 1회만 생성해 재사용한다.
    if (!verifier) {
        verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
        widgetId = await verifier.render();
    } else {
        // 재전송: 직전 reCAPTCHA 토큰은 1회용이므로 반드시 리셋해야 새 토큰으로 재검증된다.
        // (리셋 없이 재사용하면 소비된 토큰 → auth/invalid-app-credential)
        try {
            const g = typeof window !== 'undefined' && (window.grecaptcha?.enterprise || window.grecaptcha);
            if (g && widgetId != null) g.reset(widgetId);
        } catch { /* noop */ }
    }
    return signInWithPhoneNumber(auth, toE164KR(phone), verifier);
};
