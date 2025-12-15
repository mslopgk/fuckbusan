import React, { useState } from 'react';
import './Login.css';

const Login = ({ onBack, onSignup }) => {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');

    const isFormValid = id.length > 0 && password.length > 0;

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

            {/* Form */}
            <div className="login-form">
                <div className="input-group">
                    <label className="input-label">아이디</label>
                    <input
                        type="text"
                        className="login-input"
                        placeholder="아이디를 입력해 주세요."
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">비밀번호</label>
                    <input
                        type="password"
                        className="login-input"
                        placeholder="비밀번호를 입력해 주세요."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="login-btn-container">
                <button
                    className={`login-submit-btn ${isFormValid ? 'active' : 'disabled'}`}
                    disabled={!isFormValid}
                >
                    로그인
                </button>
            </div>

            {/* Footer Links */}
            <div className="login-footer-links">
                <button className="text-link" onClick={onSignup}>회원가입</button>
                <button className="text-link">아이디/비밀번호 찾기</button>
            </div>
        </div>
    );
};

export default Login;
