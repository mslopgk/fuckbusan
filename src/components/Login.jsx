import React, { useState } from 'react';
import './Login.css';


const Login = ({ onBack, onSignup }) => {
    const [inputs, setInputs] = useState({ id: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 찾기 모드: null | 'id' | 'pw'
    const [findMode, setFindMode] = useState(null);
    const [findInputs, setFindInputs] = useState({ name: '', id: '', phone: '' });
    const [findResult, setFindResult] = useState(null);
    const [findError, setFindError] = useState(null);
    const [findLoading, setFindLoading] = useState(false);

    const isFormValid = inputs.id.length > 0 && inputs.password.length > 0;
    const API_URL = import.meta.env.VITE_API_URL;
    console.log("Login Component API_URL:", API_URL);

    // Force full width layout to match other desktop pages
    React.useEffect(() => {
        document.body.classList.add('layout-full-width');
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    // Health Check on Mount
    React.useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch(`${API_URL}/`);
                const text = await res.json();
                console.log("Backend Health Check:", text);
            } catch (e) {
                console.error("Backend Health Check FAILED:", e);
                setError(`백엔드 연결 실패: ${e.message} (${API_URL})`);
            }
        };
        checkHealth();
    }, [API_URL]);
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
            // Updated to use consistent API endpoint and error handling
            // Assuming '/users/login' is the desired endpoint for the new system. 
            // If using LegacyUser, switch to '/auth/login'.
            // Using raw fetch here but with better error parsing to match api.js style if we want to keep it simple
            // OR better yet, import api from '../api' if possible. 
            // Let's stick to fetch but improve the error handling which was swallowing details.

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

    const handleFind = async () => {
        setFindLoading(true);
        setFindResult(null);
        setFindError(null);
        try {
            if (findMode === 'id') {
                const res = await fetch(`${API_URL}/users/find-id`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: findInputs.name, phone_num: findInputs.phone })
                });
                if (!res.ok) throw new Error((await res.json()).detail);
                const data = await res.json();
                setFindResult({ type: 'id', value: data.ID });
            } else {
                const res = await fetch(`${API_URL}/users/find-pw`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ID: findInputs.id, phone_num: findInputs.phone })
                });
                if (!res.ok) throw new Error((await res.json()).detail);
                const data = await res.json();
                setFindResult({ type: 'pw', value: data.temp_password });
            }
        } catch (e) {
            setFindError(e.message);
        } finally {
            setFindLoading(false);
        }
    };

    if (findMode) {
        return (
            <div className="login-container">
                <div className="login-header">
                    <button className="back-btn" onClick={() => { setFindMode(null); setFindResult(null); setFindError(null); setFindInputs({ name: '', id: '', phone: '' }); }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                </div>
                <div className="login-title-section">
                    <div className="login-title">{findMode === 'id' ? '아이디 찾기' : '비밀번호 찾기'}</div>
                    <div className="login-subtitle-desc">
                        {findMode === 'id' ? '가입 시 입력한 이름과 휴대폰번호를 입력해주세요.' : '가입 시 입력한 아이디와 휴대폰번호를 입력해주세요.'}
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
                    <div className="input-group">
                        <label className="input-label">휴대폰번호</label>
                        <input type="tel" className="login-input" placeholder="휴대폰번호를 입력해 주세요." value={findInputs.phone} onChange={(e) => setFindInputs({ ...findInputs, phone: e.target.value })} />
                    </div>
                </div>

                {findError && <div style={{ color: '#E6235A', textAlign: 'center', margin: '10px 24px', fontSize: '14px' }}>{findError}</div>}

                {findResult && (
                    <div style={{ margin: '16px 24px', padding: '16px', background: '#f0fffe', border: '1px solid #16B5B0', borderRadius: '12px', textAlign: 'center' }}>
                        {findResult.type === 'id' ? (
                            <>
                                <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>회원님의 아이디</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16B5B0' }}>{findResult.value}</div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>임시 비밀번호</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16B5B0', userSelect: 'text', WebkitUserSelect: 'text' }}>{findResult.value}</div>
                                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>로그인 후 비밀번호를 변경해주세요.</div>
                            </>
                        )}
                    </div>
                )}

                <div className="login-btn-container">
                    <button
                        className={`login-submit-btn ${(findMode === 'id' ? findInputs.name && findInputs.phone : findInputs.id && findInputs.phone) && !findLoading ? 'active' : 'disabled'}`}
                        disabled={(findMode === 'id' ? !findInputs.name || !findInputs.phone : !findInputs.id || !findInputs.phone) || findLoading}
                        onClick={handleFind}
                    >
                        {findLoading ? '확인 중...' : '확인'}
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

            {/* Footer Links */}
            <div className="login-footer-links">
                <button className="text-link" onClick={onSignup}>회원가입</button>
                <button className="text-link" onClick={() => setFindMode('id')}>아이디 찾기</button>
                <button className="text-link" onClick={() => setFindMode('pw')}>비밀번호 찾기</button>
            </div>
        </div>
    );
};

export default Login;
