import React, { useState } from 'react';
import './Login.css';


const Login = ({ onBack, onSignup }) => {
    const [inputs, setInputs] = useState({
        id: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isFormValid = inputs.id.length > 0 && inputs.password.length > 0;
    const API_URL = import.meta.env.VITE_API_URL;
    const handleLogin = async () => {
        // [DEBUG] Check API URL
        console.log("Login Attempt. API_URL:", API_URL);
        console.log("Login Inputs:", inputs);

        if (!API_URL) {
            alert("Error: VITE_API_URL is not defined in .env");
            return;
        }

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

            console.log("Login Response Status:", response.status);

            if (!response.ok) {
                const errData = await response.json();
                console.error("Login Error Data:", errData);
                throw new Error(errData.detail || 'Login failed');
            }

            const data = await response.json();
            console.log("Login Success Data:", data);

            // Store data
            localStorage.setItem('access_token', data.access_token);
            if (data.username) localStorage.setItem('username', data.username);
            // Fix: Backend sends 'user_name', but frontend code checked 'username'.
            // Let's support both or fix it. Backend: 'user_name': user.name
            if (data.user_name) localStorage.setItem('user_name', data.user_name);

            if (data.district_code) localStorage.setItem('district_code', data.district_code);

            // Go back to home (update view)
            onBack();
        } catch (err) {
            console.error(err);
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

            {/* Footer Links */}
            <div className="login-footer-links">
                <button className="text-link" onClick={onSignup}>회원가입</button>
                <button className="text-link">아이디/비밀번호 찾기</button>
            </div>
        </div>
    );
};

export default Login;
