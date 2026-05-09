import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const CARDS = [
    { key: 'member',        label: '회원관리',   imgSrc: '/figma-assets/admin/member_icon.svg',       view: 'adminDashboardNew' },
    { key: 'reportSuggest', label: '제보/제안',  imgSrc: '/figma-assets/admin/report_propose_icon.svg', view: 'reportManagement' },
    { key: 'diagnosis',     label: '진단',       imgSrc: '/figma-assets/admin/diagnosis_icon.svg',    view: 'comingSoon' },
    { key: 'survey',        label: '설문',       imgSrc: '/figma-assets/admin/survey_icon.svg',       view: 'surveyManagement' },
    { key: 'publicData',    label: '공공데이터', imgSrc: '/figma-assets/admin/public_data_icon.svg',  view: 'comingSoon' },
    { key: 'promo',         label: '홍보',       imgSrc: '/figma-assets/admin/promo_icon.svg',        view: 'comingSoon' },
    { key: 'notice',        label: '공지사항',   imgSrc: '/figma-assets/admin/notice_icon.svg',       view: 'comingSoon' },
    { key: 'etc1',          label: '기타+',      imgSrc: null, view: 'comingSoon', empty: true },
    { key: 'etc2',          label: '기타+',      imgSrc: null, view: 'comingSoon', empty: true },
];

const STAT_KEY_BY_CARD = {
    member: 'users_count',
    reportSuggest: 'reports_count',
    diagnosis: 'diagnoses_count',
    survey: 'surveys_count',
};

export default function AdminMain({ onNavigate }) {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        fetch(`${API_URL}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setStats(d))
            .catch(() => setStats(null));
    }, []);

    const handleClick = (card, disabled) => {
        if (disabled) return;
        if (onNavigate) onNavigate(card.view);
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminMain">
            <div className="admin-card-grid">
                {CARDS.map((card) => {
                    const disabled = card.view === 'comingSoon';
                    const cls = ['admin-card'];
                    if (card.empty) cls.push('empty');
                    if (disabled) cls.push('disabled');
                    return (
                        <div
                            key={card.key}
                            className={cls.join(' ')}
                            onClick={() => handleClick(card, disabled)}
                            style={disabled ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'auto' } : undefined}
                        >
                            {card.imgSrc && (
                                <div className="admin-card-icon">
                                    <img src={card.imgSrc} alt={card.label} style={{ width: 64, height: 64, objectFit: 'contain' }} />
                                </div>
                            )}
                            <div className="admin-card-label">{card.label}</div>
                            {stats && STAT_KEY_BY_CARD[card.key] && (
                                <div style={{ fontSize: 13, color: '#5B2EAB', fontWeight: 600, marginTop: 4 }}>
                                    {stats[STAT_KEY_BY_CARD[card.key]] ?? 0}건
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </AdminLayout>
    );
}
