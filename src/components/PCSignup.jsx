import React, { useState } from 'react';
import './PCAuth.css';
import { API_URL } from '../utils/api';
import { PHONE_RE, isValidBirth } from '../utils/phoneAuth';
import { TERMS_SERVICE, TERMS_PRIVACY } from './authTerms';
import PhoneVerify from './PhoneVerify';

/* Figma: TCuOzEqNhoLKjhF0reBDks node 215:3548 (PC/USER: 회원가입)
   + 약관동의/권한선택(215:3451) + Firebase SMS 인증 */

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

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;

/* ===== 약관동의 / 가입유형(권한선택) ===== Figma 회원가입>약관동의 */
const Check = ({ on }) => (
    <span className={`pcauth-check${on ? ' on' : ''}`} aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    </span>
);

// Figma export 아이콘 (직접 그리지 않음)
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

const TermsBox = ({ title, body, agreed, onToggle }) => (
    <div className="pcauth-terms">
        <div className="pcauth-terms-title">{title} <span className="pcauth-terms-req">(필수)</span></div>
        <div className="pcauth-terms-body">{body}</div>
        <button type="button" className={`pcauth-terms-agree${agreed ? ' on' : ''}`} onClick={onToggle}>
            <Check on={agreed} /> <span>위 내용에 동의합니다.</span>
        </button>
    </div>
);

const ConsentStep = ({ onNext, onNavigate }) => {
    const [service, setService] = useState(false);
    const [privacy, setPrivacy] = useState(false);
    const [userType, setUserType] = useState(null);
    const allOn = service && privacy;
    const toggleAll = () => { const v = !allOn; setService(v); setPrivacy(v); };
    const requiredOk = service && privacy && !!userType;

    return (
        <div className="pcauth">
            <div className="pcauth-title">
                <h1>약관 동의</h1>
                <p>서비스 이용을 위해 약관에 동의하고 가입 유형을 선택해주세요.</p>
            </div>
            <div className="pcauth-card consent">
                <div className="pcauth-form wide">
                    <button type="button" className={`pcauth-agree-all${allOn ? ' on' : ''}`} onClick={toggleAll}>
                        <Check on={allOn} /> <span>모든 약관에 동의합니다</span>
                    </button>

                    <TermsBox title="이용약관" body={TERMS_SERVICE} agreed={service} onToggle={() => setService((v) => !v)} />
                    <TermsBox title="개인정보처리방침" body={TERMS_PRIVACY} agreed={privacy} onToggle={() => setPrivacy((v) => !v)} />

                    <div className="pcauth-typecards">
                        {USER_TYPES.map((t) => (
                            <button key={t.key} type="button" className={`pcauth-typecard${userType === t.key ? ' selected' : ''}`} onClick={() => setUserType(t.key)}>
                                <img className="pcauth-typeicon" src={TYPE_ICON[t.key]} alt="" />
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <button className="pcauth-submit" disabled={!requiredOk} onClick={() => onNext({ service, privacy, userType })}>다음</button>
            <div className="pcauth-links">
                <span style={{ color: '#777', fontSize: 14 }}>이미 계정이 있으신가요?</span>
                <button className="pcauth-link" onClick={() => onNavigate && onNavigate('login')}>로그인</button>
            </div>
        </div>
    );
};

/* ===== 정보 입력 폼 ===== */
const USERTYPE_TO_DISTRICT = { citizen: 'general', expert: 'expert', admin: 'admin' };

const SignupForm = ({ onNavigate, onBack, consent }) => {
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
                oncomplete: (data) => {
                    set('address', data.roadAddress || data.jibunAddress || data.address);
                },
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
                        localStorage.setItem('username', ld.user_name);
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
        <div className="pcauth">
            <div className="pcauth-title">
                <h1>더 나은 도시 환경을 위해 함께해주세요</h1>
                <p>서비스 이용을 위해 회원가입이 필요합니다.</p>
            </div>

            <div className="pcauth-card">
                <div className="pcauth-form">
                    {/* 아이디 */}
                    <div className="pcauth-field">
                        <label className="pcauth-label">아이디<span className="req">*</span></label>
                        <input className="pcauth-input" placeholder="abcdef1234" value={form.id} onChange={(e) => set('id', e.target.value)} />
                    </div>
                    {/* 비밀번호 */}
                    <div className="pcauth-field">
                        <label className="pcauth-label">비밀번호<span className="req">*</span></label>
                        <input type="password" className="pcauth-input" placeholder="비밀번호를 입력하세요" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
                        <div className={`pcauth-helper ${pwHelperClass}`}>
                            {form.password.length > 0 && pwValid ? '사용 가능한 비밀번호입니다.' : '*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.'}
                        </div>
                    </div>
                    {/* 이름 */}
                    <div className="pcauth-field">
                        <label className="pcauth-label">이름<span className="req">*</span></label>
                        <input className="pcauth-input" placeholder="이름을 입력하세요" value={form.name} onChange={(e) => set('name', e.target.value)} />
                    </div>
                    {/* 닉네임 */}
                    <div className="pcauth-field">
                        <label className="pcauth-label">닉네임</label>
                        <input className="pcauth-input" placeholder="닉네임을 입력하세요" value={form.nickname} onChange={(e) => set('nickname', e.target.value)} />
                        <div className="pcauth-helper">*한글·영문·숫자로 2~12자 이내로 입력해주세요.</div>
                    </div>
                    {/* 생년월일 */}
                    <div className="pcauth-field">
                        <label className="pcauth-label">생년월일<span className="req">*</span></label>
                        <input className="pcauth-input" placeholder="8자리 예시(19951202)" inputMode="numeric" maxLength={8}
                            value={form.birth} onChange={(e) => set('birth', e.target.value.replace(/\D/g, ''))} />
                        <div className={`pcauth-helper ${birthHelperClass}`}>
                            {form.birth.length > 0 && !birthValid ? '올바른 생년월일 8자리를 입력해주세요.' : '*예시처럼 8자리로 입력해주세요. (YYYYMMDD)'}
                        </div>
                    </div>
                    {/* 주소 */}
                    <div className="pcauth-field">
                        <label className="pcauth-label">주소<span className="req">*</span></label>
                        <div className="pcauth-row">
                            <input className="pcauth-input clickable" placeholder="주소 검색" value={form.address} readOnly onClick={openPostcode} />
                            <button type="button" className="pcauth-inline-btn" onClick={openPostcode}>검색</button>
                        </div>
                        <div className="pcauth-row" style={{ marginTop: 6 }}>
                            <input className="pcauth-input" placeholder="상세주소를 입력" value={form.detailAddress} onChange={(e) => set('detailAddress', e.target.value)} />
                        </div>
                    </div>
                    {/* 휴대폰번호 (SMS 인증 — 재전송 30초 / 인증번호 5분) */}
                    <PhoneVerify
                        phone={form.phone}
                        setPhone={(v) => set('phone', v)}
                        verified={phoneVerified}
                        setVerified={setPhoneVerified}
                        required
                    />
                </div>
            </div>

            {error && <div className="pcauth-error">{error}</div>}

            <button className="pcauth-submit" disabled={!isValid || loading} onClick={handleSignup}>
                {loading ? '처리 중...' : '회원가입'}
            </button>
        </div>
    );
};

const PCSignup = ({ onNavigate, onBack }) => {
    const [step, setStep] = useState('consent'); // consent | form
    const [consent, setConsent] = useState(null);
    if (step === 'consent') return <ConsentStep onNavigate={onNavigate} onNext={(a) => { setConsent(a); setStep('form'); }} />;
    return <SignupForm onNavigate={onNavigate} onBack={onBack} consent={consent} />;
};

export default PCSignup;
