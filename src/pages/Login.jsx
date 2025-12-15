import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
// import { Lock, Mail } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });
            localStorage.setItem('access_token', response.data.access_token);
            if (response.data.username) {
                localStorage.setItem('username', response.data.username);
            }
            navigate('/dashboard');
        } catch (err) {
            console.error("Login Error:", err);
            let msg = '로그인에 실패했습니다. (서버 연결 확인 필요)';
            if (err.response) {
                if (err.response.data.detail) {
                    msg = typeof err.response.data.detail === 'string'
                        ? err.response.data.detail
                        : JSON.stringify(err.response.data.detail);
                } else {
                    msg = `서버 오류: ${err.response.status}`;
                }
            } else if (err.request) {
                msg = '서버로부터 응답이 없습니다. 네트워크를 확인해주세요.';
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-bg-card rounded-card shadow-card p-8 relative overflow-hidden"
            >
                {/* Top Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-hover"></div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary mb-2">
                        BDP Login
                    </h1>
                    <p className="text-text-sub text-sm">지능형 공공디자인 통합 진단 플랫폼</p>
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

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-sub mb-2">Email</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">✉️</span>
                            <input
                                type="email"
                                placeholder="example@busan.go.kr"
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

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-full transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-text-sub">
                    계정이 없으신가요?{' '}
                    <Link to="/signup" className="text-primary hover:text-primary-hover font-semibold hover:underline">
                        회원가입
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
