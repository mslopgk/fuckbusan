import React, { useState } from 'react';
import './Login.css';
import { API_URL } from '../utils/api';

const ChangePassword = ({ onBack }) => {
    const [form, setForm] = useState({ next: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordMatch = form.next && form.confirm && form.next === form.confirm;

    const handleSubmit = async () => {
        if (!passwordMatch) { setError('비밀번호가 일치하지 않습니다.'); return; }
        setLoading(true); setError('');
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/users/reset-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ new_pw: form.next })
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
            sessionStorage.removeItem('pw_change_required');
            alert('비밀번호가 변경되었습니다.');
            onBack();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-title-section" style={{ marginTop: '60px' }}>
                <div className="login-title">비밀번호 변경</div>
                <div className="login-subtitle-desc">임시 비밀번호로 로그인되었습니다.<br/>새 비밀번호를 설정해주세요.</div>
            </div>
            <div className="login-form">
                <div className="input-group">
                    <label className="input-label">새 비밀번호</label>
                    <input type="password" className="login-input" placeholder="새 비밀번호를 입력해 주세요." autoComplete="new-password"
                        value={form.next} onChange={e => setForm(p => ({ ...p, next: e.target.value }))} />
                </div>
                <div className="input-group">
                    <label className="input-label">새 비밀번호 확인</label>
                    <input type="password" className="login-input" placeholder="새 비밀번호를 다시 입력해 주세요." autoComplete="new-password"
                        value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
                    {form.confirm.length > 0 && (
                        <div className="helper-text" style={{ color: passwordMatch ? '#16B5B0' : '#E6235A' }}>
                            {passwordMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                        </div>
                    )}
                </div>
            </div>
            {error && <div style={{ color: '#E6235A', textAlign: 'center', margin: '10px 24px', fontSize: '14px' }}>{error}</div>}
            <div className="login-btn-container">
                <button className={`login-submit-btn ${passwordMatch && !loading ? 'active' : 'disabled'}`}
                    disabled={!passwordMatch || loading} onClick={handleSubmit}>
                    {loading ? '변경 중...' : '변경하기'}
                </button>
            </div>
        </div>
    );
};

export default ChangePassword;
