import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import '../styles/admin.css';

export default function Login({ onNavigate }) {
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
            localStorage.setItem('user_info', JSON.stringify({ username: data.user_name || 'Admin User' }));
            if (onNavigate) onNavigate('adminDashboard');
        } catch (err) {
            console.error("Login Error:", err);
            setError('로그인 실패. (admin / admin1234)');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="auth-card"
            >
                {/* Top Accent Line */}
                <div className="auth-accent"></div>

                <div className="auth-header">
                    <h1 className="auth-title">
                        BDP Login
                    </h1>
                    <p className="auth-subtitle">지능형 공공디자인 통합 진단 플랫폼</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="auth-error-msg"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="auth-form-stack">
                    <div>
                        <label className="auth-label">Email</label>
                        <div className="auth-input-wrapper">
                            <span className="auth-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                            </span>
                            <input
                                type="email"
                                placeholder="admin@busan.go.kr"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrapper">
                            <span className="auth-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </span>
                            <input
                                type="password"
                                placeholder="Busan2026!"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="auth-btn"
                    >
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="auth-footer">
                    계정이 없으신가요?{' '}
                    <button onClick={() => onNavigate && onNavigate('adminSignup')} className="auth-footer-link">
                        회원가입
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
