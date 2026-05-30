import React, { useState, useEffect } from 'react';
import './Signup.css';
import './Login.css'; // Reuse common button/input styles
import { API_URL } from '../utils/api';

const Signup = ({ onBack, onNavigate }) => {
    const [userType, setUserType] = useState('general'); // 'general' | 'expert'

    // Force full width layout
    useEffect(() => {
        document.body.classList.add('layout-full-width');
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    const [formData, setFormData] = useState({
        id: '',
        password: '',
        passwordConfirm: '',
        name: '',
        nickname: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;
    const passwordValid = passwordRegex.test(formData.password);
    const passwordMatch = formData.password && formData.passwordConfirm && formData.password === formData.passwordConfirm;
    const isFormValid = formData.id && passwordValid && passwordMatch && formData.name && formData.phone;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSignup = async () => {
        if (!isFormValid || loading) return;
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ID: formData.id,
                PW: formData.password,
                name: formData.name,
                nickname: formData.nickname,
                phone_num: formData.phone,
                district_code: userType === 'expert' ? 'expert' : 'general'
            };

            const response = await fetch(`${API_URL}/users/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || '회원가입에 실패했습니다.');
            }

            // 자동 로그인: 가입 성공 직후 같은 자격증명으로 로그인 → 토큰 저장
            try {
                const loginRes = await fetch(`${API_URL}/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ID: payload.ID, PW: payload.PW }),
                });
                if (loginRes.ok) {
                    const ld = await loginRes.json();
                    if (ld.access_token) localStorage.setItem('access_token', ld.access_token);
                    if (ld.user_name) localStorage.setItem('user_name', ld.user_name);
                    if (ld.district_code) localStorage.setItem('district_code', ld.district_code);
                }
            } catch { /* 자동 로그인 실패해도 signupDone으로 진행 */ }

            // Success
            if (onNavigate) {
                onNavigate('signupDone');
            } else {
                alert('회원가입 성공');
                onBack();
            }

        } catch (err) {
            const msg = err.message || '회원가입 에러 발생';
            setError(msg);
            alert(`회원가입 오류: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    // ...

    return (
        <div className="signup-container">
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
                <div className="login-title">회원가입</div>
                <div className="login-subtitle-main">
                    더나은 부산을 위한 첫걸음
                </div>
                <div className="login-subtitle-desc">
                    아직 계정이 없다면 회원가입을 진행해주세요
                </div>
                {error && <div style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>{error}</div>}
            </div>



            {/* Form */}
            <div className="signup-form">
                {/* ID */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">아이디</label>
                        <div className="required-dot"></div>
                    </div>
                    <input
                        type="text"
                        name="id"
                        className="login-input"
                        placeholder="아이디를 입력해 주세요."
                        value={formData.id}
                        onChange={handleChange}
                    />
                </div>

                {/* Password */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">비밀번호</label>
                        <div className="required-dot"></div>
                    </div>
                    <input
                        type="password"
                        name="password"
                        className="login-input"
                        placeholder="비밀번호를 입력해 주세요."
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                    />
                    {formData.password.length > 0 && !passwordValid ? (
                        <div className="helper-text" style={{ color: '#E6235A' }}>*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.</div>
                    ) : formData.password.length > 0 && passwordValid ? (
                        <div className="helper-text" style={{ color: '#16B5B0' }}>사용 가능한 비밀번호입니다.</div>
                    ) : (
                        <div className="helper-text">*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.</div>
                    )}
                </div>

                {/* Password Confirm */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">비밀번호 확인</label>
                        <div className="required-dot"></div>
                    </div>
                    <input
                        type="password"
                        name="passwordConfirm"
                        className="login-input"
                        placeholder="비밀번호를 다시 입력해 주세요."
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        autoComplete="new-password"
                    />
                    {formData.passwordConfirm.length > 0 && (
                        <div className="helper-text" style={{ color: passwordMatch ? '#16B5B0' : '#E6235A' }}>
                            {passwordMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="form-divider"></div>

                {/* Name */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">이름</label>
                        <div className="required-dot"></div>
                    </div>
                    <input
                        type="text"
                        name="name"
                        className="login-input"
                        placeholder="이름을 입력해 주세요."
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                {/* Nickname */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">닉네임</label>
                    </div>
                    <input
                        type="text"
                        name="nickname"
                        className="login-input"
                        placeholder="닉네임을 입력해 주세요."
                        value={formData.nickname}
                        onChange={handleChange}
                    />
                    <div className="helper-text">*한글·영문·숫자로 2~12자 이내로 입력해주세요.</div>
                </div>

                {/* Phone */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">휴대폰번호</label>
                        <div className="required-dot"></div>
                    </div>
                    <input
                        type="tel"
                        name="phone"
                        className="login-input"
                        placeholder="휴대폰번호를 입력해 주세요."
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>

                {/* User Type Toggle */}
                <div className="user-type-toggle-container" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                        className={`user-type-btn ${userType === 'general' ? 'active' : ''}`}
                        onClick={() => setUserType('general')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: userType === 'general' ? '1px solid #E6235A' : '1px solid #eee',
                            backgroundColor: userType === 'general' ? '#FFF0F5' : '#fff',
                            color: userType === 'general' ? '#E6235A' : '#888',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        일반 시민
                    </button>
                    <button
                        className={`user-type-btn ${userType === 'expert' ? 'active' : ''}`}
                        onClick={() => setUserType('expert')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: userType === 'expert' ? '1px solid #542AA3' : '1px solid #eee',
                            backgroundColor: userType === 'expert' ? '#F3E5F5' : '#fff',
                            color: userType === 'expert' ? '#542AA3' : '#888',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        전문가
                    </button>
                </div>
            </div>

            {/* Submit Button */}
            <div className="signup-btn-container">
                <button
                    className={`signup-submit-btn ${isFormValid && !loading ? 'active' : 'disabled'}`}
                    disabled={!isFormValid || loading}
                    onClick={handleSignup}
                >
                    {loading ? '처리 중...' : '회원가입'}
                </button>
            </div>
        </div>
    );
};

export default Signup;
