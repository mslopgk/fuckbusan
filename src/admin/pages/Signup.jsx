import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import '../styles/admin.css';

export default function Signup({ onNavigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }
        setIsLoading(true);

        try {
            // Mock signup or api call
            // const response = await api.post('/auth/signup', {
            //     email,
            //     password,
            //     username,
            // });
            alert('회원가입 성공! 로그인해주세요.');
            if (onNavigate) onNavigate('adminLogin');
        } catch (err) {
            console.error("Signup Error:", err);
            setError('회원가입 실패 (Local mock only)');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="auth-card"
            >
                {/* Visual Accent */}
                <div className="auth-accent"></div>

                <div className="auth-header">
                    <h1 className="auth-title">회원가입</h1>
                    <p className="auth-subtitle">새로운 계정을 생성하세요</p>
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

                <form onSubmit={handleSignup} className="auth-form-stack">
                    {/* Username Input */}
                    <div>
                        <label className="auth-label">Name</label>
                        <div className="auth-input-wrapper">
                            <span className="auth-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="홍길동"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="auth-label">Email</label>
                        <div className="auth-input-wrapper">
                            <span className="auth-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                            </span>
                            <input
                                type="email"
                                placeholder="user@example.com"
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
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="auth-label">Confirm Password</label>
                        <div className="auth-input-wrapper">
                            <span className="auth-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="auth-btn"
                        style={{ marginTop: '24px' }}
                    >
                        {isLoading ? '가입 중...' : '가입하기'}
                    </button>
                </form>

                <div className="auth-footer">
                    이미 계정이 있으신가요?{' '}
                    <button onClick={() => onNavigate && onNavigate('adminLogin')} className="auth-footer-link">
                        로그인
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
