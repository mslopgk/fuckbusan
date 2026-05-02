import { useEffect, useState } from 'react';

export default function AdminHeader({ onNavigate }) {
    const [username, setUsername] = useState('관리자');

    useEffect(() => {
        const stored = localStorage.getItem('user_info');
        if (stored) {
            try {
                setUsername(JSON.parse(stored).username || '관리자');
            } catch {}
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        if (onNavigate) onNavigate('adminLoginNew');
    };

    return (
        <header className="admin-header-new">
            <div className="header-user-info">
                <div className="user-avatar-circle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
                <span>{username}님</span>
            </div>
            <button className="btn-logout-new" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                로그아웃
            </button>
        </header>
    );
}
