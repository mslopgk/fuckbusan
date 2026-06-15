import React, { useState, useEffect } from 'react';
import './Signup.css';
import './Login.css'; // 공통 input/button 스타일 재사용
import './PCAuth.css';
import { API_URL } from '../utils/api';
import { formatPhone, PHONE_RE, isValidBirth } from '../utils/phoneAuth';
import { TERMS_SERVICE, TERMS_PRIVACY } from './authTerms';
import PCSignup from './PCSignup';
import PhoneVerify from './PhoneVerify';

/* 모바일 회원가입 — Figma 215:12408(약관동의) + 215:12454(정보입력)
   로직은 PCSignup과 동일 (Firebase SMS / Daum 주소 / 약관) */

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;
const USERTYPE_TO_DISTRICT = { citizen: 'general', expert: 'expert', admin: 'admin' };

const TYPE_ICON = {
    admin: '/assets/auth/type_admin.png',
    expert: '/assets/auth/type_expert.png',
    citizen: '/assets/auth/type_citizen.svg',
};
const USER_TYPES = [
    { key: 'admin', label: '관리자' },
    { key: 'expert', label: '전문가' },
    { key: 'citizen', label: '시민' },
];

const DAUM_POSTCODE_SRC = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
const loadDaumPostcode = () =>
    new Promise((resolve, reject) => {
        if (window.daum && window.daum.Postcode) return resolve();
        const existing = document.querySelector(`script[src="${DAUM_POSTCODE_SRC}"]`);
        if (existing) { existing.addEventListener('load', () => resolve()); existing.addEventListener('error', reject); return; }
        const s = document.createElement('script');
        s.src = DAUM_POSTCODE_SRC; s.onload = () => resolve(); s.onerror = reject;
        document.head.appendChild(s);
    });

const BackHeader = ({ onBack }) => (
    <div className="msignup-topbar">
        <button type="button" className="back-btn" onClick={onBack} aria-label="뒤로">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
        </button>
    </div>
);

const Check = ({ on }) => (
    <span className={`msignup-check${on ? ' on' : ''}`} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    </span>
);

/* ===== 1단계: 약관동의 + 가입유형 ===== */
const ConsentStep = ({ onBack, onNext }) => {
    const [service, setService] = useState(false);
    const [privacy, setPrivacy] = useState(false);
    const [hint, setHint] = useState(false);
    const allOn = service && privacy;
    const toggleAll = () => { const v = !allOn; setService(v); setPrivacy(v); if (v) setHint(false); };

    // 가입유형 선택 시 자동으로 다음 단계로 (약관 동의 필요)
    const pickType = (key) => {
        if (!allOn) { setHint(true); return; }
        onNext({ service, privacy, userType: key });
    };

    return (
        <div className="msignup">
            <BackHeader onBack={onBack} />
            <div className="msignup-body">
                <button type="button" className={`msignup-all${allOn ? ' on' : ''}`} onClick={toggleAll}>
                    <Check on={allOn} /> <span>모든 약관에 동의합니다</span>
                </button>

                <div className="msignup-terms-block">
                    <div className="msignup-terms-title">이용약관 <span className="req">(필수)</span></div>
                    <div className="msignup-terms-box">{TERMS_SERVICE}</div>
                    <button type="button" className={`msignup-agree${service ? ' on' : ''}`} onClick={() => setService((v) => !v)}>
                        <Check on={service} /> <span>위 이용약관에 동의합니다.</span>
                    </button>
                </div>

                <div className="msignup-terms-block">
                    <div className="msignup-terms-title">개인정보처리방침 <span className="req">(필수)</span></div>
                    <div className="msignup-terms-box">{TERMS_PRIVACY}</div>
                    <button type="button" className={`msignup-agree${privacy ? ' on' : ''}`} onClick={() => setPrivacy((v) => !v)}>
                        <Check on={privacy} /> <span>위 약관에 동의합니다.</span>
                    </button>
                </div>

                <div className="msignup-pick-label">가입 유형을 선택하면 다음 단계로 이동합니다.</div>
                <div className="msignup-typecards">
                    {USER_TYPES.map((t) => (
                        <button key={t.key} type="button" className="msignup-typecard" onClick={() => pickType(t.key)}>
                            <img className="msignup-typeicon" src={TYPE_ICON[t.key]} alt="" />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
                {hint && !allOn && <div className="msignup-typehint">약관에 모두 동의해주세요.</div>}
            </div>
        </div>
    );
};

/* ===== 2단계: 정보 입력 ===== */
const SignupForm = ({ onBack, onNavigate, consent }) => {
    const [form, setForm] = useState({ id: '', password: '', name: '', nickname: '', birth: '', address: '', detailAddress: '', phone: '' });
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const pwValid = PASSWORD_RE.test(form.password);
    const birthValid = isValidBirth(form.birth);
    const phoneFormatOk = PHONE_RE.test(form.phone);
    const isValid = form.id.length >= 4 && pwValid && form.name && birthValid && form.address && phoneFormatOk && phoneVerified;

    const openPostcode = async () => {
        try {
            await loadDaumPostcode();
            new window.daum.Postcode({
                oncomplete: (data) => set('address', data.roadAddress || data.jibunAddress || data.address),
            }).open();
        } catch { alert('주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'); }
    };

    const handleSignup = async () => {
        if (!isValid || loading) return;
        setLoading(true); setError(null);
        try {
            const payload = {
                ID: form.id, PW: form.password, name: form.name, nickname: form.nickname,
                phone_num: form.phone, district_code: USERTYPE_TO_DISTRICT[consent?.userType] || 'general',
                birth_date: form.birth, address: form.address, detailed_address: form.detailAddress,
            };
            const res = await fetch(`${API_URL}/users/signup`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.json()).detail || '회원가입에 실패했습니다.');
            try {
                const lr = await fetch(`${API_URL}/users/login`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ID: payload.ID, PW: payload.PW }),
                });
                if (lr.ok) {
                    const ld = await lr.json();
                    if (ld.access_token) localStorage.setItem('access_token', ld.access_token);
                    if (ld.user_name) {
                        localStorage.setItem('user_name', ld.user_name);
                        localStorage.setItem('username', ld.user_name); // username 키도 동기화
                    }
                    if (ld.district_code) localStorage.setItem('district_code', ld.district_code);
                }
            } catch { /* 자동 로그인 실패해도 진행 */ }
            if (onNavigate) onNavigate('signupDone'); else if (onBack) onBack();
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    const pwHelperClass = form.password.length === 0 ? '' : pwValid ? 'ok' : 'err';
    const birthHelperClass = form.birth.length === 0 ? '' : birthValid ? 'ok' : 'err';

    return (
        <div className="msignup">
            <BackHeader onBack={onBack} />
            <div className="msignup-body">
                <div className="msignup-intro">
                    <h1>더 나은 도시 환경을 위해 함께해주세요</h1>
                    <p>서비스 이용을 위해 회원가입이 필요합니다.</p>
                </div>

                <div className="msignup-form">
                    <div className="input-group">
                        <label className="input-label">아이디<i className="req-dot" /></label>
                        <input className="login-input" placeholder="abcdef1234" value={form.id} onChange={(e) => set('id', e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">비밀번호<i className="req-dot" /></label>
                        <input type="password" className="login-input" placeholder="비밀번호를 입력하세요" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
                        <div className={`msignup-helper ${pwHelperClass}`}>
                            {form.password.length > 0 && pwValid ? '사용 가능한 비밀번호입니다.' : '*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.'}
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">이름<i className="req-dot" /></label>
                        <input className="login-input" placeholder="이름을 입력하세요" value={form.name} onChange={(e) => set('name', e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">닉네임</label>
                        <input className="login-input" placeholder="닉네임을 입력하세요" value={form.nickname} onChange={(e) => set('nickname', e.target.value)} />
                        <div className="msignup-helper">*한글·영문·숫자로 2~12자 이내로 입력해주세요.</div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">생년월일<i className="req-dot" /></label>
                        <input className="login-input" placeholder="8자리 예시(19951202)" inputMode="numeric" maxLength={8} value={form.birth} onChange={(e) => set('birth', e.target.value.replace(/\D/g, ''))} />
                        <div className={`msignup-helper ${birthHelperClass}`}>
                            {form.birth.length > 0 && !birthValid ? '올바른 생년월일 8자리를 입력해주세요.' : '*예시처럼 8자리로 입력해주세요. (YYYYMMDD)'}
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">주소<i className="req-dot" /></label>
                        <div className="msignup-row">
                            <input className="login-input clickable" placeholder="주소 검색" value={form.address} readOnly onClick={openPostcode} />
                            <button type="button" className="msignup-inline-btn" onClick={openPostcode}>검색</button>
                        </div>
                        <input className="login-input" style={{ marginTop: 6 }} placeholder="상세주소를 입력" value={form.detailAddress} onChange={(e) => set('detailAddress', e.target.value)} />
                    </div>
                    <PhoneVerify
                        phone={form.phone}
                        setPhone={(v) => set('phone', v)}
                        verified={phoneVerified}
                        setVerified={setPhoneVerified}
                        required
                    />
                </div>

                {error && <div className="msignup-error">{error}</div>}
            </div>

            <div className="msignup-foot">
                <button className={`login-submit-btn ${isValid && !loading ? 'active' : 'disabled'}`} disabled={!isValid || loading} onClick={handleSignup}>
                    {loading ? '처리 중...' : '회원가입'}
                </button>
            </div>
        </div>
    );
};

const Signup = ({ onBack, onNavigate }) => {
    const [isPC, setIsPC] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    const [step, setStep] = useState('consent');
    const [consent, setConsent] = useState(null);

    useEffect(() => {
        const onResize = () => setIsPC(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (isPC) return <PCSignup onNavigate={onNavigate} onBack={onBack} />;

    if (step === 'consent') {
        return <ConsentStep onBack={onBack} onNavigate={onNavigate} onNext={(a) => { setConsent(a); setStep('form'); window.scrollTo(0, 0); }} />;
    }
    return <SignupForm onBack={() => setStep('consent')} onNavigate={onNavigate} consent={consent} />;
};

export default Signup;
