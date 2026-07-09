import React, { useState, useEffect } from 'react';
import './Login.css';
import './PCAuth.css';
import { API_URL, safeJson } from '../utils/api';
import PCLogin from './PCLogin';
import PhoneVerify from './PhoneVerify';

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;


const Login = ({ onBack, onSignup }) => {
    const [inputs, setInputs] = useState({ id: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPC, setIsPC] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

    useEffect(() => {
        const onResize = () => setIsPC(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // 찾기 모드: null | 'id' | 'pw'
    const [findMode, setFindMode] = useState(null);
    const [findInputs, setFindInputs] = useState({ name: '', id: '', phone: '' });
    const [findVerified, setFindVerified] = useState(false);      // 휴대폰 SMS 인증 완료
    const [findResult, setFindResult] = useState(null);
    const [findError, setFindError] = useState(null);
    const [findLoading, setFindLoading] = useState(false);
    const [pwResetStep, setPwResetStep] = useState(false);        // 비번찾기 재설정 단계
    const [pwResetDone, setPwResetDone] = useState(false);        // 비번 재설정 완료 화면
    const [findMethod, setFindMethod] = useState(null);          // 본인인증 방법 선택 (Figma 302:3015)
    const [newPw, setNewPw] = useState('');
    const [newPwConfirm, setNewPwConfirm] = useState('');

    const resetFind = () => {
        setFindMode(null); setFindResult(null); setFindError(null);
        setFindInputs({ name: '', id: '', phone: '' });
        setFindVerified(false); setPwResetStep(false); setPwResetDone(false); setFindMethod(null); setNewPw(''); setNewPwConfirm('');
    };
    const switchFind = (m) => {
        setFindMode(m); setFindResult(null); setFindError(null);
        setFindInputs({ name: '', id: '', phone: '' });
        setFindVerified(false); setPwResetStep(false); setPwResetDone(false); setFindMethod(null); setNewPw(''); setNewPwConfirm('');
    };

    const isFormValid = inputs.id.length > 0 && inputs.password.length > 0;

    // Force full width layout to match other desktop pages
    React.useEffect(() => {
        document.body.classList.add('layout-full-width');
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    // 데스크탑은 Figma PC 인증 레이아웃, 모바일은 기존 마크업 유지
    if (isPC) return <PCLogin onBack={onBack} onSignup={onSignup} />;

    const handleLogin = async () => {
        if (!isFormValid || loading) return;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ID: inputs.id,
                    PW: inputs.password
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Login failed');
            }

            const data = await response.json();

            // Store data
            localStorage.setItem('access_token', data.access_token);
            if (data.user_name) {
                localStorage.setItem('user_name', data.user_name);
                localStorage.setItem('username', data.user_name);
            }

            if (data.district_code) localStorage.setItem('district_code', data.district_code);

            // Go back to home (update view)
            onBack();
        } catch (err) {
            const msg = err.message || '로그인에 실패했습니다.';
            setError(msg);
            alert(`로그인 오류: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    const handleFind = async () => {
        setFindLoading(true);
        setFindError(null);
        try {
            if (findMode === 'id') {
                const res = await fetch(`${API_URL}/users/find-id`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: findInputs.name, phone_num: findInputs.phone })
                });
                const data = await safeJson(res);
                if (!res.ok) throw new Error(data.detail || '일치하는 회원 정보가 없습니다.');
                setFindResult({ type: 'id', value: data.ID });
            } else {
                // 본인확인(ID+휴대폰) → 비밀번호 재설정 단계로
                const res = await fetch(`${API_URL}/users/verify-user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ID: findInputs.id, phone_num: findInputs.phone })
                });
                const data = await safeJson(res);
                if (!res.ok) throw new Error(data.detail || '일치하는 회원 정보가 없습니다.');
                setPwResetStep(true);
            }
        } catch (e) {
            setFindError(e.message);
        } finally {
            setFindLoading(false);
        }
    };

    const newPwValid = PASSWORD_RE.test(newPw);
    const newPwMatch = newPw && newPw === newPwConfirm;
    const handleResetPw = async () => {
        if (!newPwValid || !newPwMatch || findLoading) return;
        setFindLoading(true); setFindError(null);
        try {
            const res = await fetch(`${API_URL}/users/reset-password-by-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ID: findInputs.id, phone_num: findInputs.phone, new_pw: newPw })
            });
            const data = await safeJson(res);
            if (!res.ok) throw new Error(data.detail || '비밀번호 재설정에 실패했습니다.');
            setPwResetStep(false);
            setPwResetDone(true);
        } catch (e) {
            setFindError(e.message);
        } finally {
            setFindLoading(false);
        }
    };

    if (findMode) {
        const backHeader = (
            <div className="login-header">
                <button className="back-btn" onClick={resetFind} aria-label="뒤로">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>
        );

        // 비밀번호 재설정 완료 화면
        if (findMode === 'pw' && pwResetDone) {
            return (
                <div className="login-container">
                    {backHeader}
                    <div className="login-title-section">
                        <div className="login-title">비밀번호 재설정</div>
                    </div>
                    <div style={{ margin: '24px', padding: '28px 16px', background: '#f0fffe', border: '1px solid #16B5B0', borderRadius: '12px', textAlign: 'center', lineHeight: 1.6 }}>
                        <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#16B5B0' }}>비밀번호 변경이 완료되었습니다!</div>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>로그인 후 서비스를 이용하실 수 있습니다.</div>
                    </div>
                    <div className="login-btn-container">
                        <button className="login-submit-btn active" onClick={resetFind}>로그인 페이지로 이동</button>
                    </div>
                </div>
            );
        }

        // 비밀번호 재설정 단계
        if (findMode === 'pw' && pwResetStep) {
            return (
                <div className="login-container">
                    {backHeader}
                    <div className="login-title-section">
                        <div className="login-title">비밀번호 재설정</div>
                        <div className="login-subtitle-desc">인증되었습니다. 새 비밀번호를 입력해주세요.</div>
                    </div>
                    <div className="login-form">
                        <div className="input-group">
                            <label className="input-label">비밀번호</label>
                            <input type="password" className="login-input" placeholder="새 비밀번호" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                            <div className="helper-text" style={{ color: newPw.length === 0 ? undefined : (newPwValid ? '#16B5B0' : '#E6235A') }}>*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.</div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">비밀번호 확인</label>
                            <input type="password" className="login-input" placeholder="새 비밀번호 확인" autoComplete="new-password" value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)} />
                            {newPwConfirm.length > 0 && <div className="helper-text" style={{ color: newPwMatch ? '#16B5B0' : '#E6235A' }}>{newPwMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}</div>}
                        </div>
                    </div>
                    {findError && <div style={{ color: '#E6235A', textAlign: 'center', margin: '10px 24px', fontSize: '14px' }}>{findError}</div>}
                    <div className="login-btn-container">
                        <button className={`login-submit-btn ${newPwValid && newPwMatch && !findLoading ? 'active' : 'disabled'}`} disabled={!newPwValid || !newPwMatch || findLoading} onClick={handleResetPw}>
                            {findLoading ? '처리 중...' : '재설정 하기'}
                        </button>
                    </div>
                </div>
            );
        }

        // 아이디 찾기 결과
        if (findMode === 'id' && findResult) {
            return (
                <div className="login-container">
                    {backHeader}
                    <div className="login-title-section">
                        <div className="login-title">아이디 찾기</div>
                    </div>
                    <div style={{ margin: '24px', padding: '24px 16px', background: '#f0fffe', border: '1px solid #16B5B0', borderRadius: '12px', textAlign: 'center', lineHeight: 1.6 }}>
                        <div style={{ fontSize: '15px', color: '#444' }}>가입하신 회원님의 아이디는</div>
                        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#16B5B0', margin: '6px 0' }}>{findResult.value}</div>
                        <div style={{ fontSize: '15px', color: '#444' }}>입니다</div>
                    </div>
                    <div className="login-btn-container">
                        <button className="login-submit-btn active" onClick={resetFind}>로그인하기</button>
                    </div>
                </div>
            );
        }

        // 본인인증 방법 선택 (Figma 302:3015)
        if (!findMethod) {
            return (
                <div className="login-container">
                    {backHeader}
                    <div className="login-title-section">
                        <div className="login-title">{findMode === 'id' ? '아이디 찾기' : '비밀번호 찾기'}</div>
                        <div className="login-subtitle-desc">회원정보 확인을 위한 본인인증 단계입니다. 인증방법을 선택해주세요.</div>
                    </div>
                    <div style={{ margin: '24px', padding: '28px 16px', background: '#f8f8f8', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, marginBottom: '18px' }}>
                            휴대폰 인증 또는 아이핀 인증을 이용해서<br />{findMode === 'id' ? '아이디를 찾을' : '비밀번호를 재설정할'} 수 있습니다.
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="login-submit-btn active" style={{ flex: 1 }} onClick={() => setFindMethod('phone')}>휴대폰 인증하기</button>
                            <button className="login-submit-btn" style={{ flex: 1, background: '#5fcfcd', color: '#fff' }} onClick={() => alert('아이핀 인증은 준비 중입니다. 휴대폰 인증을 이용해주세요.')}>아이핀 인증</button>
                        </div>
                    </div>
                </div>
            );
        }

        // 입력 + 휴대폰 SMS 인증 (아이디/비번 공통)
        const ready = (findMode === 'id' ? findInputs.name : findInputs.id) && findVerified;
        return (
            <div className="login-container">
                {backHeader}
                <div className="login-title-section">
                    <div className="login-find-tabs">
                        <button className={`login-find-tab ${findMode === 'id' ? 'active' : ''}`} onClick={() => switchFind('id')}>아이디 찾기</button>
                        <button className={`login-find-tab ${findMode === 'pw' ? 'active' : ''}`} onClick={() => switchFind('pw')}>비밀번호 찾기</button>
                    </div>
                    <div className="login-subtitle-desc">
                        {findMode === 'id' ? '이름과 휴대폰 인증으로 아이디를 찾을 수 있습니다.' : '아이디와 휴대폰 인증으로 비밀번호를 재설정할 수 있습니다.'}
                    </div>
                </div>
                <div className="login-form">
                    {findMode === 'id' ? (
                        <div className="input-group">
                            <label className="input-label">이름</label>
                            <input type="text" className="login-input" placeholder="이름을 입력해 주세요." value={findInputs.name} onChange={(e) => setFindInputs({ ...findInputs, name: e.target.value })} />
                        </div>
                    ) : (
                        <div className="input-group">
                            <label className="input-label">아이디</label>
                            <input type="text" className="login-input" placeholder="아이디를 입력해 주세요." value={findInputs.id} onChange={(e) => setFindInputs({ ...findInputs, id: e.target.value })} />
                        </div>
                    )}
                    <PhoneVerify
                        phone={findInputs.phone}
                        setPhone={(v) => setFindInputs((s) => ({ ...s, phone: v }))}
                        verified={findVerified}
                        setVerified={setFindVerified}
                    />
                </div>

                {findError && <div style={{ color: '#E6235A', textAlign: 'center', margin: '10px 24px', fontSize: '14px' }}>{findError}</div>}

                <div className="login-btn-container">
                    <button className={`login-submit-btn ${ready && !findLoading ? 'active' : 'disabled'}`} disabled={!ready || findLoading} onClick={handleFind}>
                        {findLoading ? '확인 중...' : (findMode === 'id' ? '아이디 찾기' : '다음')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            {/* Header */}
            <div className="login-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            {/* Title */}
            <div className="login-title-section">
                <div className="login-title">로그인</div>
                <div className="login-subtitle-main">
                    시민과 기술이 함께 만드는<br />
                    더 나은 부산
                </div>
                <div className="login-subtitle-desc">
                    공공디자인 참여를 위해 로그인해주세요.
                </div>
            </div>

            {/* Error Message */}
            {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}

            {/* Form */}
            <div className="login-form">
                <div className="input-group">
                    <label className="input-label">아이디</label>
                    <input
                        type="text"
                        className="login-input"
                        placeholder="아이디를 입력해 주세요."
                        value={inputs.id}
                        onChange={(e) => setInputs({ ...inputs, id: e.target.value })}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">비밀번호</label>
                    <input
                        type="password"
                        className="login-input"
                        placeholder="비밀번호를 입력해 주세요."
                        value={inputs.password}
                        onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="login-btn-container">
                <button
                    className={`login-submit-btn ${isFormValid && !loading ? 'active' : 'disabled'}`}
                    disabled={!isFormValid || loading}
                    onClick={handleLogin}
                >
                    {loading ? '로그인 중...' : '로그인'}
                </button>
            </div>

            {/* Footer Links (Figma 269:20081: 회원가입 | 아이디 찾기 | 비밀번호 찾기) */}
            <div className="login-footer-links">
                <button className="text-link" onClick={onSignup}>회원가입</button>
                <span className="login-footer-sep">|</span>
                <button className="text-link" onClick={() => setFindMode('id')}>아이디 찾기</button>
                <span className="login-footer-sep">|</span>
                <button className="text-link" onClick={() => setFindMode('pw')}>비밀번호 찾기</button>
            </div>

            {/* 간편 회원가입 */}
            <button
                type="button"
                className="login-simple-btn"
                onClick={onSignup}
            >
                간편 회원가입
            </button>
        </div>
    );
};

export default Login;
