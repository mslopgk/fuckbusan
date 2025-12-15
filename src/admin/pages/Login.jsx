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
            // Mock login check or use dummy API
            // For now, allow any login or check specific
            // Simple credentials for dev convenience
            if ((email === 'admin@busan.go.kr' && password === 'Busan2026!') ||
                (email === 'admin' && password === 'password')) {
                // Success
                localStorage.setItem('access_token', 'dummy_token');
                localStorage.setItem('user_info', JSON.stringify({ username: 'Admin User' }));
                if (onNavigate) onNavigate('adminDashboard');
            } else {
                // Try mock API
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
                            <span className="auth-icon">✉️</span>
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
                            <span className="auth-icon">🔒</span>
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
