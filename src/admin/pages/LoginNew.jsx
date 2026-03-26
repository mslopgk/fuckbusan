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
            // Simple credentials for dev convenience
            if ((email === 'admin' && password === 'admin1234')) {
                localStorage.setItem('access_token', 'dummy_token');
                localStorage.setItem('user_info', JSON.stringify({ username: '관리자' }));
                if (onNavigate) onNavigate('adminDashboardNew');
            } else {
                const response = await api.post('/auth/login', {
                    email,
                    password,
                });
                if (response.data) {
                    localStorage.setItem('access_token', response.data.access_token);
                    if (response.data.username) {
                        localStorage.setItem('user_info', JSON.stringify({ username: response.data.username }));
                    }
                    if (onNavigate) onNavigate('adminDashboard');
                } else {
                    throw new Error('Invalid credentials');
                }
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError('Login failed. (Use admin@busan.go.kr / Busan2026!)');
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
