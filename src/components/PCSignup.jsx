import React, { useState } from 'react';
import './PCAuth.css';
import { API_URL } from '../utils/api';
import { PHONE_RE, isValidBirth } from '../utils/phoneAuth';
import { TERMS_SERVICE, TERMS_PRIVACY } from './authTerms';
import PhoneVerify from './PhoneVerify';
import PCFooter from './PCFooter';

/* Figma: hJCPXp7YcYUL60u2NHiYrS — PC/USER: 회원가입 302:3184(입력전)·302:3272(입력후)
   + 약관동의/권한선택 302:3415 + Firebase SMS 인증 */

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

/* ===== 약관동의 / 가입유형(권한선택) ===== Figma 회원가입>약관동의 302:3415 */
/* 체크 인디케이터 — Figma 에셋.
   바(동의 줄): 흰 바탕+teal 체크(terms_check.svg) / 전체동의: teal 바탕+흰 체크(terms_check_fill.png, 302:3422)
   unchecked = 흰 바탕 + #aaa 테두리 r5 (302:3446) */
const Check = ({ on, fill = false }) => (
    on
        ? <img className="pcauth-check on" src={fill ? '/figma-assets/icons/terms_check_fill.png' : '/figma-assets/icons/terms_check.svg'} alt="" width={20} height={20} aria-hidden="true" />
        : <span className="pcauth-check" aria-hidden="true" />
);

// Figma export 아이콘 (직접 그리지 않음) — 관리자/전문가 302:3460·3461(4x), 시민 302:3462
const TYPE_ICON = {
    admin: '/figma-assets/icons/auth_type_admin.png',
    expert: '/figma-assets/icons/auth_type_expert.png',
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
            <Check on={agreed} /> <span>위 {title}에 동의합니다.</span>
        </button>
    </div>
);

const ConsentStep = ({ onNext }) => {
    const [service, setService] = useState(false);
    const [privacy, setPrivacy] = useState(false);
    const [userType, setUserType] = useState(null);
    const allOn = service && privacy;
    const toggleAll = () => { const v = !allOn; setService(v); setPrivacy(v); };
    const requiredOk = service && privacy && !!userType;

    return (
        <div className="pcauth-page-wrap">
            <div className="pcauth">
                <div className="pcauth-title consent-title">
                    <h1 className="accent signup-accent">약관 동의</h1>
                </div>

                {/* 권한선택 (Figma 302:3417·3453) */}
                <div className="pcauth-card consent roles">
                    <div className="pcauth-consent-inner">
                        <div className="pcauth-section-label">권한선택</div>
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

                {/* 약관 동의 (Figma 302:3416·3425·3437) */}
                <div className="pcauth-card consent terms">
                    <div className="pcauth-consent-inner">
                        <TermsBox title="이용약관" body={TERMS_SERVICE} agreed={service} onToggle={() => setService((v) => !v)} />
                        <TermsBox title="개인정보처리방침" body={TERMS_PRIVACY} agreed={privacy} onToggle={() => setPrivacy((v) => !v)} />
                        <div className="pcauth-agree-all-box">
                            <button type="button" className={`pcauth-agree-all${allOn ? ' on' : ''}`} onClick={toggleAll}>
                                <Check on={allOn} fill /> <span>모든 약관에 동의합니다</span>
                            </button>
                            <p className="pcauth-agree-all-sub">전체 약관에 동의해야 서비스를 이용할 수 있습니다.</p>
                        </div>
                    </div>
                </div>

                <button className="pcauth-submit consent-next" disabled={!requiredOk} onClick={() => onNext({ service, privacy, userType })}>다음</button>
            </div>
            <PCFooter tall />
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
            // 자동 로그인하지 않음 — 완료 화면에서 로그인 페이지로 이동해 직접 로그인
            if (onNavigate) onNavigate('signupDone'); else if (onBack) onBack();
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    const pwHelperClass = form.password.length === 0 ? '' : pwValid ? 'ok' : 'err';
    const birthHelperClass = form.birth.length === 0 ? '' : birthValid ? 'ok' : 'err';

    return (
        <div className="pcauth-page-wrap">
        <div className="pcauth">
            <div className="pcauth-title">
                <h1 className="accent signup-accent">회원가입</h1>
                <p className="hero">더 나은 도시 환경을 위해 함께해주세요</p>
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
                        {/* 유효한 8자리 입력 시 안내문구 숨김 — 빈 값: 안내 / 형식 오류: 에러 */}
                        {!(form.birth.length > 0 && birthValid) && (
                            <div className={`pcauth-helper ${birthHelperClass}`}>
                                {form.birth.length > 0 && !birthValid ? '올바른 생년월일 8자리를 입력해주세요.' : '*예시처럼 8자리로 입력해주세요. (YYYYMMDD)'}
                            </div>
                        )}
                    </div>
                    {/* 주소 */}
                    <div className="pcauth-field">
                        <label className="pcauth-label">주소<span className="req">*</span></label>
                        <div className="pcauth-row">
                            <input className="pcauth-input clickable" placeholder="주소 검색" value={form.address} readOnly onClick={openPostcode} />
                            <button type="button" className="pcauth-inline-btn" onClick={openPostcode}>검색</button>
                        </div>
                        <div className="pcauth-row" style={{ marginTop: 20 }}>
                            <input className="pcauth-input" placeholder="상세주소를 입력" value={form.detailAddress} onChange={(e) => set('detailAddress', e.target.value)} />
                        </div>
                    </div>
                    {/* 휴대폰번호 (SMS 인증 — 재전송 30초 / 인증번호 5분)
                        Figma 302:3247: 인증번호 행은 발송 전에도 비활성 표시 */}
                    <PhoneVerify
                        phone={form.phone}
                        setPhone={(v) => set('phone', v)}
                        verified={phoneVerified}
                        setVerified={setPhoneVerified}
                        required
                        showOtpBeforeSend
                    />
                </div>
            </div>

            {error && <div className="pcauth-error">{error}</div>}

            <button className="pcauth-submit" disabled={!isValid || loading} onClick={handleSignup}>
                {loading ? '처리 중...' : '회원가입'}
            </button>
        </div>
        <PCFooter tall />
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
