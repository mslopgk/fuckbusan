import React, { useState, useEffect, useRef } from 'react';
import { sendSms, resetRecaptcha, formatPhone, PHONE_RE } from '../utils/phoneAuth';

/* 휴대폰 SMS 본인인증 블록 (회원가입/아이디·비번찾기 공용)
   - 재전송 쿨다운: 30초
   - 인증번호 유효시간: 5분(300초) */

const RESEND_COOLDOWN = 30;
const CODE_TTL = 300;

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// reCAPTCHA 컨테이너는 절대 리렌더되면 안 됨(매초 타이머 리렌더로부터 격리). memo로 1회만 마운트.
const RecaptchaSlot = React.memo(function RecaptchaSlot() {
    return <div id="recaptcha-container" className="pcauth-recaptcha" />;
});

const PhoneVerify = ({ phone, setPhone, verified, setVerified, required = false, label = '휴대폰번호' }) => {
    const [confirmation, setConfirmation] = useState(null);
    const [code, setCode] = useState('');
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [err, setErr] = useState(null);
    const [cooldown, setCooldown] = useState(0);   // 재전송 남은 초
    const [ttl, setTtl] = useState(0);             // 인증번호 유효 남은 초
    const timerRef = useRef(null);

    const ok = PHONE_RE.test(phone);
    const expired = sent && !verified && ttl <= 0;

    // 언마운트 시 reCAPTCHA 정리 (다음 마운트에서 새 verifier 생성)
    useEffect(() => () => resetRecaptcha(), []);

    // 1초 틱: 쿨다운/유효시간 동시 감소
    useEffect(() => {
        if (cooldown <= 0 && ttl <= 0) return undefined;
        timerRef.current = setInterval(() => {
            setCooldown((c) => (c > 0 ? c - 1 : 0));
            setTtl((t) => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [cooldown, ttl]);

    const send = async () => {
        if (!ok || sending || cooldown > 0) {
            if (!ok) alert('올바른 휴대폰번호를 입력해주세요. (예: 010-1234-5678)');
            return;
        }
        setSending(true); setErr(null);
        try {
            // 무한 '발송중' 방지: 25초 내 응답 없으면 실패 처리
            const conf = await Promise.race([
                sendSms(phone),
                new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), 25000)),
            ]);
            setConfirmation(conf);
            setSent(true);
            setVerified(false);
            setCode('');
            setCooldown(RESEND_COOLDOWN);
            setTtl(CODE_TTL);
            alert('인증번호를 발송했습니다. 문자를 확인해주세요.');
        } catch (e) {
            // 주의: 여기서 resetRecaptcha() 호출 금지 — 위젯 DOM을 파괴해 다음 시도가 깨짐.
            const c = e?.code || '';
            console.error('[PhoneVerify] sendSms 실패:', c, e?.message, e);
            if (c === 'auth/operation-not-allowed') setErr('SMS 인증이 아직 활성화되지 않았습니다. 관리자에게 문의해주세요.');
            else if (c === 'auth/invalid-phone-number') setErr('휴대폰번호 형식이 올바르지 않습니다.');
            else if (c === 'auth/too-many-requests') setErr('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            else if (c === 'timeout') setErr('인증번호 발송이 지연됩니다. 페이지를 새로고침한 뒤 다시 시도해주세요.');
            else setErr(`인증번호 발송에 실패했습니다. (${c || e?.message || 'unknown'})`);
        } finally { setSending(false); }
    };

    const verify = async () => {
        if (!confirmation || code.length < 6 || verifying) return;
        if (expired) { setErr('인증시간이 만료되었습니다. 재전송 해주세요.'); return; }
        setVerifying(true); setErr(null);
        try {
            await confirmation.confirm(code);
            setVerified(true);
            setTtl(0); setCooldown(0);
        } catch {
            setErr('인증번호가 올바르지 않습니다. 다시 확인해주세요.');
        } finally { setVerifying(false); }
    };

    const btnActive = ok && !verified && cooldown === 0;
    const btnLabel = sending ? '발송중'
        : cooldown > 0 ? `재전송 ${cooldown}`
            : sent ? '재전송' : '인증';

    return (
        <div className="pcauth-field">
            <label className="pcauth-label">{label}{required && <span className="req">*</span>}</label>
            <div className="pcauth-row">
                <input className="pcauth-input" placeholder="010-1234-5678" inputMode="numeric"
                    value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} disabled={verified} />
                <button type="button" className={`pcauth-inline-btn${btnActive ? ' active' : ''}`}
                    onClick={send} disabled={sending || verified || cooldown > 0}>
                    {btnLabel}
                </button>
            </div>

            {/* invisible reCAPTCHA 앵커 (체크박스 없음). 인증 누르면 백그라운드 실행 */}
            <RecaptchaSlot />

            {sent && !verified && (
                <>
                    <div className="pcauth-row" style={{ marginTop: 6 }}>
                        <div className="pcauth-otp-wrap otp">
                            <input className="pcauth-input" placeholder="인증번호 입력" inputMode="numeric" maxLength={6}
                                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} disabled={expired} />
                            {!expired && <span className="pcauth-otp-timer">{fmt(ttl)}</span>}
                        </div>
                        <button type="button" className={`pcauth-inline-btn${code.length === 6 && !expired ? ' active' : ''}`}
                            onClick={verify} disabled={verifying || code.length < 6 || expired}>
                            {verifying ? '확인중' : '확인'}
                        </button>
                    </div>
                    {expired && <div className="pcauth-helper err">인증시간이 만료되었습니다. 재전송 해주세요.</div>}
                </>
            )}

            {verified && <div className="pcauth-verified">✓ 인증되었습니다</div>}
            {err && <div className="pcauth-helper err">{err}</div>}
        </div>
    );
};

export default PhoneVerify;
