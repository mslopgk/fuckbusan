import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
// import { Lock, Mail, User } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }
        setIsLoading(true);

        try {
            const response = await api.post('/auth/signup', {
                email,
                password,
                username,
            });
            alert('회원가입 성공! 로그인해주세요.');
            navigate('/login');
        } catch (err) {
            console.error("Signup Error:", err);
            let msg = '회원가입 실패 (콘솔 확인 필요)';
            if (err.response) {
                if (err.response.data.detail) {
                    msg = typeof err.response.data.detail === 'string'
                        ? err.response.data.detail
                        : JSON.stringify(err.response.data.detail);
                }
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-bg-card rounded-card shadow-card p-8 relative overflow-hidden"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-hover"></div>

                <div className="text-center mb-8 pt-4">
                    <h1 className="text-3xl font-bold text-primary mb-2">회원가입</h1>
                    <p className="text-text-sub text-sm">새로운 계정을 생성하세요</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg text-sm border border-red-100"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    {/* Username Input */}
                    <div>
                        <label className="block text-sm font-medium text-text-sub mb-2">Name</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">👤</span>
                            <input
                                type="text"
                                placeholder="홍길동"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-border rounded-lg py-3 pl-12 pr-4 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-sub mb-2">Email</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">✉️</span>
                            <input
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-border rounded-lg py-3 pl-12 pr-4 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-sub mb-2">Password</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔒</span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-border rounded-lg py-3 pl-12 pr-4 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-sub mb-2">Confirm Password</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔒</span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-border rounded-lg py-3 pl-12 pr-4 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-full shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-6 transition-all"
                    >
                        {isLoading ? '가입 중...' : '가입하기'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-text-sub">
                    이미 계정이 있으신가요?{' '}
                    <Link to="/login" className="text-primary hover:text-primary-hover font-semibold hover:underline">
                        로그인
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
