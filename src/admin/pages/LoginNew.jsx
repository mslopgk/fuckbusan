import { useState } from 'react';
import api from '../api';
import '../styles/login_new.css';

export default function LoginNew({ onNavigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await fetch('/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ID: email, PW: password }),
            });
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_info', JSON.stringify({ username: data.user_name || '관리자' }));
            if (onNavigate) onNavigate('adminMain');
        } catch (err) {
            console.error("Login Error:", err);
            setError('로그인 실패. 아이디/비밀번호를 확인하세요. (admin / admin1234)');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-screen">
            <div className="admin-login-content">
                <h1 className="admin-login-title">Login</h1>
                
                <form onSubmit={handleLogin} className="admin-login-form">
                    <input
                        type="text"
                        placeholder="아이디를 입력하세요."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="admin-login-input"
                        required
                    />

                    <input
                        type="password"
                        placeholder="비밀번호를 입력하세요."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="admin-login-input"
                        required
                    />

                    {error && <div className="admin-login-error">{error}</div>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="admin-login-btn"
                    >
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>
            </div>
        </div>
    );
}
