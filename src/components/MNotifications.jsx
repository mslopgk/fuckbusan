import { useEffect, useState, useCallback } from 'react';
import MobileBottomNav from './MobileBottomNav';
import { API_URL, authHeaders } from '../utils/api';
import { notifyUnreadChanged } from '../hooks/useUnreadNotifications';
import './MNotifications.css';

const KIND_LABEL = {
    like: '좋아요',
    comment: '댓글',
    vote: '투표',
    status: '상태 변경',
    mention: '멘션',
    system: '안내',
};

const KIND_ICON = {
    like: { color: '#E6235A', path: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
    comment: { color: '#5B2EAB', path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
    vote: { color: '#06AB69', path: 'M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z' },
    status: { color: '#1971c2', path: 'M3 12l3-3 3 3 3-3 3 3 3-3 3 3' },
    mention: { color: '#FF7A00', path: 'M16 8a4 4 0 1 0 0 8M16 8v6a2 2 0 0 0 4 0v-2a8 8 0 1 0-3.2 6.4' },
    system: { color: '#888', path: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
};

function formatRelative(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function NotificationIcon({ kind }) {
    const cfg = KIND_ICON[kind] || KIND_ICON.system;
    return (
        <div className="m-notif-icon" style={{ background: `${cfg.color}1a`, color: cfg.color }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={cfg.path} />
            </svg>
        </div>
    );
}

export default function MNotifications({ onNavigate }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unauth, setUnauth] = useState(false);

    const load = useCallback(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { setUnauth(true); setLoading(false); return; }
        setLoading(true);
        fetch(`${API_URL}/api/notifications`, { headers: authHeaders() })
            .then((r) => {
                if (r.status === 401) { setUnauth(true); return []; }
                return r.ok ? r.json() : [];
            })
            .then((data) => setItems(Array.isArray(data) ? data : []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleItemClick = async (n) => {
        if (!n.is_read) {
            try {
                await fetch(`${API_URL}/api/notifications/${n.id}/read`, {
                    method: 'PATCH',
                    headers: authHeaders(),
                });
                setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, is_read: true } : it)));
                notifyUnreadChanged();
            } catch {}
        }
        // 타입별 라우팅 — target_type=report/proposal → 상세로 이동
        if (n.target_type === 'report' && n.target_id) {
            onNavigate?.('mReportDetail', { id: n.target_id });
        } else if (n.target_type === 'proposal' && n.target_id) {
            onNavigate?.('mProposalDetail', { id: n.target_id });
        }
    };

    const markAllRead = async () => {
        try {
            await fetch(`${API_URL}/api/notifications/read-all`, {
                method: 'POST',
                headers: authHeaders(),
            });
            setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
            notifyUnreadChanged();
        } catch {}
    };

    const unreadCount = items.filter((i) => !i.is_read).length;

    return (
        <div className="m-notif-page">
            <header className="m-notif-topbar">
                <button type="button" className="m-notif-back" onClick={() => onNavigate?.('home')} aria-label="뒤로">
                    <svg width="7" height="13" viewBox="0 0 7 13" fill="none">
                        <path d="M6 1L1 6.5L6 12" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <h1 className="m-notif-title">알림</h1>
                {unreadCount > 0 ? (
                    <button type="button" className="m-notif-mark-all" onClick={markAllRead}>
                        모두 읽음
                    </button>
                ) : <span className="m-notif-spacer" aria-hidden="true" />}
            </header>

            <div className="m-notif-list">
                {loading && (
                    <div className="m-notif-empty">불러오는 중...</div>
                )}
                {!loading && unauth && (
                    <div className="m-notif-empty">
                        로그인 후 알림을 확인할 수 있습니다.
                        <button type="button" className="m-notif-login-btn" onClick={() => onNavigate?.('login')}>로그인</button>
                    </div>
                )}
                {!loading && !unauth && items.length === 0 && (
                    <div className="m-notif-empty">아직 알림이 없습니다.</div>
                )}
                {!loading && !unauth && items.map((n) => (
                    <button
                        key={n.id}
                        type="button"
                        className={`m-notif-item ${n.is_read ? '' : 'unread'}`}
                        onClick={() => handleItemClick(n)}
                    >
                        <NotificationIcon kind={n.kind} />
                        <div className="m-notif-text">
                            <div className="m-notif-row1">
                                <span className="m-notif-kind">{KIND_LABEL[n.kind] || n.kind}</span>
                                {!n.is_read && <span className="m-notif-dot" />}
                            </div>
                            {n.title && <div className="m-notif-line title">{n.title}</div>}
                            {n.body && <div className="m-notif-line body">{n.body}</div>}
                            <div className="m-notif-time">{formatRelative(n.created_at)}</div>
                        </div>
                    </button>
                ))}
            </div>

            <MobileBottomNav currentView="mNotifications" onNavigate={onNavigate} />
        </div>
    );
}
