import React, { useState } from 'react';
import './PCAuth.css';
import { API_URL, safeJson } from '../utils/api';
import PhoneVerify from './PhoneVerify';
import PCFooter from './PCFooter';

/* Figma: hJCPXp7YcYUL60u2NHiYrS 302:3010 (로그인/회원가입 섹션)
   로그인(302:3491) + 아이디찾기(302:3015~3066) + 비밀번호찾기/재설정(302:3094~3145).
   본인인증은 페이지 내 SMS(OTP) 1회. */

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;
/* 완료 화면 카드 (아이디/비밀번호 재설정 완료) — Figma 302:3357 / 302:3386 */
const AuthDoneCard = ({ title, lead, onGo }) => (
    <>
        <div className="pcauth-card done">
            <h1 className="pcauth-done-title">{title}</h1>
            <strong className="pcauth-done-lead">{lead}</strong>
            <p className="pcauth-done-desc">
                로그인 후 서비스를 이용하실 수 있습니다.<br />
                로그인 페이지로 이동하시겠습니까?
            </p>
        </div>
        <button className="pcauth-submit" onClick={onGo}>로그인 페이지로 이동</button>
    </>
);

const PCLogin = ({ onBack, onSignup }) => {
    const [mode, setMode] = useState('login'); // login | findChoose | findId | findPw
    return (
        <div className="pcauth-page-wrap">
            <div className={`pcauth${mode === 'login' ? ' login-page' : ''}`}>
                {mode === 'login' && <LoginCard onBack={onBack} onSignup={onSignup} setMode={setMode} />}
                {mode === 'findChoose' && <FindChoose setMode={setMode} onClose={() => setMode('login')} />}
                {mode === 'findId' && <FindIdFlow onClose={() => setMode('login')} />}
                {mode === 'findPw' && <FindPwFlow onClose={() => setMode('login')} />}
            </div>
            <PCFooter tall />
        </div>
    );
};

/* ===== 로그인 (Figma 302:3491) ===== */
const LoginCard = ({ onBack, onSignup, setMode }) => {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const valid = id.length > 0 && pw.length > 0;

    const login = async () => {
        if (!valid || loading) return;
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_URL}/users/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ID: id, PW: pw }),
            });
            const d = await safeJson(res);
            if (!res.ok) throw new Error(d.detail || '로그인에 실패했습니다.');
            localStorage.setItem('access_token', d.access_token);
            if (d.user_name) {
                localStorage.setItem('user_name', d.user_name);
                localStorage.setItem('username', d.user_name);
            }
            if (d.district_code) localStorage.setItem('district_code', d.district_code);
            onBack && onBack();
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };
    const onKey = (e) => { if (e.key === 'Enter') login(); };

    return (
        <>
            <div className="pcauth-title login">
                <h1 className="accent">로그인</h1>
                <p className="hero">시민과 기술이 함께 만드는 더 나은 부산</p>
                <p>공공디자인 참여를 위해 로그인해주세요.</p>
            </div>
            <div className="pcauth-card compact">
                <div className="pcauth-form login">
                    <div className="pcauth-field">
                        <label className="pcauth-label">아이디</label>
                        <input className="pcauth-input" placeholder="아이디를 입력해 주세요." value={id} onChange={(e) => setId(e.target.value)} onKeyDown={onKey} />
                    </div>
                    <div className="pcauth-field">
                        <label className="pcauth-label">비밀번호</label>
                        <input type="password" className="pcauth-input" placeholder="비밀번호를 입력해 주세요." value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={onKey} />
                    </div>
                    {error && <div className="pcauth-error" style={{ width: '100%', textAlign: 'left' }}>{error}</div>}
                    <button className="pcauth-submit" style={{ width: '100%' }} disabled={!valid || loading} onClick={login}>
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                    <div className="pcauth-loginlinks">
                        <button className="pcauth-link" onClick={onSignup}>회원가입</button>
                        <span className="pcauth-link-sep" />
                        <button className="pcauth-link" onClick={() => setMode('findId')}>아이디 찾기</button>
                        <span className="pcauth-link-sep" />
                        <button className="pcauth-link" onClick={() => setMode('findPw')}>비밀번호 찾기</button>
                    </div>
                    <button className="pcauth-simple" onClick={onSignup}>간편 회원가입</button>
                </div>
            </div>
        </>
    );
};

/* ===== 아이디/비밀번호 찾기 선택 ===== */
const FindChoose = ({ setMode, onClose }) => (
    <>
        <div className="pcauth-title find"><h1 className="accent signup-accent">아이디 / 비밀번호 찾기</h1><p className="find-sub">찾으실 항목을 선택해주세요.</p></div>
        <div className="pcauth-card find">
            <div className="pcauth-form" style={{ width: 380 }}>
                <div className="pcauth-method-row">
                    <button className="pcauth-method-btn" onClick={() => setMode('findId')}>아이디 찾기</button>
                    <button className="pcauth-method-btn ghost" onClick={() => setMode('findPw')}>비밀번호 찾기</button>
                </div>
            </div>
        </div>
        <div className="pcauth-links"><button className="pcauth-link" onClick={onClose}>로그인으로 돌아가기</button></div>
    </>
);

/* ===== 아이디 찾기 (Figma 302:3015 선택 → 이름+SMS → 302:3066 결과) ===== */
const FindIdFlow = ({ onClose }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [verified, setVerified] = useState(false);
    const [foundId, setFoundId] = useState('');
    const [method, setMethod] = useState(null); // 본인인증 방법 선택 (Figma 302:3015)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const submit = async () => {
        if (!name || !verified || loading) return;
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_URL}/users/find-id`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone_num: phone }),
            });
            const d = await safeJson(res);
            if (!res.ok) throw new Error(d.detail || '일치하는 회원 정보가 없습니다.');
            setFoundId(d.ID);
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    if (foundId) return (
        <>
            <div className="pcauth-title find-result"><h1 className="accent signup-accent">아이디 찾기</h1></div>
            <div className="pcauth-card find-result">
                <div className="pcauth-result">가입하신 회원님의 아이디는 <strong>{foundId}</strong>입니다</div>
                <button className="pcauth-result-btn" onClick={onClose}>로그인하기</button>
            </div>
        </>
    );

    if (!method) return (
        <>
            <div className="pcauth-title find"><h1 className="accent signup-accent">아이디 찾기</h1><p className="find-sub">회원정보 확인을 위한 본인인증 단계입니다.<br />인증방법을 선택해주세요.</p></div>
            <div className="pcauth-card find">
                <p className="pcauth-center-text">휴대폰 인증 또는 아이핀 인증을 이용해서<br />아이디를 찾을 수 있습니다.</p>
                <div className="pcauth-method-row">
                    <button type="button" className="pcauth-method-btn" onClick={() => setMethod('phone')}>휴대폰 인증하기</button>
                    <button type="button" className="pcauth-method-btn ghost" onClick={() => alert('아이핀 인증은 준비 중입니다. 휴대폰 인증을 이용해주세요.')}>아이핀 인증</button>
                </div>
            </div>
            <div className="pcauth-links"><button className="pcauth-link" onClick={onClose}>로그인으로 돌아가기</button></div>
        </>
    );

    return (
        <>
            <div className="pcauth-title find"><h1 className="accent signup-accent">아이디 찾기</h1><p className="find-sub">이름과 휴대폰 인증으로 아이디를 찾을 수 있습니다.</p></div>
            <div className="pcauth-card find">
                <div className="pcauth-form">
                    <div className="pcauth-field">
                        <label className="pcauth-label">이름</label>
                        <input className="pcauth-input" placeholder="이름을 입력하세요" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <PhoneVerify phone={phone} setPhone={setPhone} verified={verified} setVerified={setVerified} />
                    {error && <div className="pcauth-error" style={{ width: '100%', textAlign: 'left' }}>{error}</div>}
                    <button className="pcauth-submit" style={{ width: '100%' }} disabled={!name || !verified || loading} onClick={submit}>
                        {loading ? '확인 중...' : '아이디 찾기'}
                    </button>
                </div>
            </div>
            <div className="pcauth-links"><button className="pcauth-link" onClick={onClose}>로그인으로 돌아가기</button></div>
        </>
    );
};

/* ===== 비밀번호 찾기 (Figma 302:3094 선택 → 아이디+SMS → 302:3145 재설정 → 302:3386 완료) ===== */
const FindPwFlow = ({ onClose }) => {
    const [id, setId] = useState('');
    const [phone, setPhone] = useState('');
    const [verified, setVerified] = useState(false);
    const [stepReset, setStepReset] = useState(false);
    const [done, setDone] = useState(false);
    const [method, setMethod] = useState(null); // 본인인증 방법 선택 (Figma 302:3094)
    const [pw, setPw] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const goReset = async () => {
        if (!id || !verified || loading) return;
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_URL}/users/verify-user`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ID: id, phone_num: phone }),
            });
            const d = await safeJson(res);
            if (!res.ok) throw new Error(d.detail || '일치하는 회원 정보가 없습니다.');
            setStepReset(true);
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    const pwValid = PASSWORD_RE.test(pw);
    const pwMatch = pw && pw === pwConfirm;
    const reset = async () => {
        if (!pwValid || !pwMatch || loading) return;
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_URL}/users/reset-password-by-phone`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ID: id, phone_num: phone, new_pw: pw }),
            });
            const d = await safeJson(res);
            if (!res.ok) throw new Error(d.detail || '비밀번호 재설정에 실패했습니다.');
            setDone(true);
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    if (done) return <AuthDoneCard title="비밀번호 재설정" lead="비밀번호 변경이 완료되었습니다!" onGo={onClose} />;

    if (stepReset) return (
        <>
            <div className="pcauth-title reset">
                <h1 className="accent signup-accent">비밀번호 재설정</h1>
                <p className="reset-sub">인증되었습니다<br />비밀번호 재설정 해주세요</p>
            </div>
            <div className="pcauth-card reset">
                <div className="pcauth-form">
                    <div className="pcauth-field">
                        <label className="pcauth-label">비밀번호<span className="req">*</span></label>
                        <input type="password" className="pcauth-input" placeholder="새 비밀번호" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
                        <div className={`pcauth-helper ${pw.length === 0 ? '' : pwValid ? 'ok' : 'err'}`}>*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.</div>
                    </div>
                    <div className="pcauth-field">
                        <label className="pcauth-label">비밀번호 확인<span className="req">*</span></label>
                        <input type="password" className="pcauth-input" placeholder="새 비밀번호 확인" autoComplete="new-password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
                        {/* Figma 302:3159: 확인 칸에도 안내문구 상시 노출 (입력 시 일치 여부로 대체) */}
                        <div className={`pcauth-helper ${pwConfirm.length === 0 ? '' : pwMatch ? 'ok' : 'err'}`}>
                            {pwConfirm.length === 0 ? '*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.' : pwMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                        </div>
                    </div>
                    {error && <div className="pcauth-error" style={{ width: '100%', textAlign: 'left' }}>{error}</div>}
                </div>
            </div>
            <button className="pcauth-submit reset-submit" disabled={!pwValid || !pwMatch || loading} onClick={reset}>
                {loading ? '처리 중...' : '재설정 하기'}
            </button>
        </>
    );

    if (!method) return (
        <>
            <div className="pcauth-title find"><h1 className="accent signup-accent">비밀번호 재설정</h1><p className="find-sub">회원정보 확인을 위한 본인인증 단계입니다.<br />인증방법을 선택해주세요.</p></div>
            <div className="pcauth-card find">
                <p className="pcauth-center-text">휴대폰 인증 또는 아이핀 인증을 이용해서<br />비밀번호를 재설정할 수 있습니다.</p>
                <div className="pcauth-method-row">
                    <button type="button" className="pcauth-method-btn" onClick={() => setMethod('phone')}>휴대폰 인증하기</button>
                    <button type="button" className="pcauth-method-btn ghost" onClick={() => alert('아이핀 인증은 준비 중입니다. 휴대폰 인증을 이용해주세요.')}>아이핀 인증</button>
                </div>
            </div>
            <div className="pcauth-links"><button className="pcauth-link" onClick={onClose}>로그인으로 돌아가기</button></div>
        </>
    );

    return (
        <>
            <div className="pcauth-title find"><h1 className="accent signup-accent">비밀번호 재설정</h1><p className="find-sub">아이디와 휴대폰 인증으로 비밀번호를 재설정할 수 있습니다.</p></div>
            <div className="pcauth-card find">
                <div className="pcauth-form">
                    <div className="pcauth-field">
                        <label className="pcauth-label">아이디</label>
                        <input className="pcauth-input" placeholder="아이디를 입력하세요" value={id} onChange={(e) => setId(e.target.value)} />
                    </div>
                    <PhoneVerify phone={phone} setPhone={setPhone} verified={verified} setVerified={setVerified} />
                    {error && <div className="pcauth-error" style={{ width: '100%', textAlign: 'left' }}>{error}</div>}
                    <button className="pcauth-submit" style={{ width: '100%' }} disabled={!id || !verified || loading} onClick={goReset}>
                        {loading ? '확인 중...' : '다음'}
                    </button>
                </div>
            </div>
            <div className="pcauth-links"><button className="pcauth-link" onClick={onClose}>로그인으로 돌아가기</button></div>
        </>
    );
};

export default PCLogin;
