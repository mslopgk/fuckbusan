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
                    {/* Figma export 아바타 글리프 (302:28005) */}
                    <img className="avatar-person-img" src="/figma-assets/admin/rp_avatar_person.png" alt="" />
                </div>
                <span>{username}님</span>
            </div>
            <button className="btn-logout-new" onClick={handleLogout}>
                {/* Figma export 로그아웃 아이콘 (302:28009) */}
                <img src="/figma-assets/admin/rp_logout.png" alt="" />
                로그아웃
            </button>
        </header>
    );
}
