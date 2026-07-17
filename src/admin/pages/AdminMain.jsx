import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

/* Figma 302:26530 실측 — 카드 순서/아이콘 크기·오프셋(px).
   AI 가상시민은 Figma의 '기타+' 슬롯을 대체하는 기능 추가 카드 (기존 기능 유지). */
const CARDS = [
    { key: 'member',        label: '회원관리',     imgSrc: '/figma-assets/admin/card_member.png',     icon: { w: 62, h: 75, l: 36, t: 37 }, view: 'adminDashboardNew' },
    { key: 'reportSuggest', label: '제보/제안',    imgSrc: '/figma-assets/admin/card_report.png',     icon: { w: 74, h: 74, l: 42, t: 41 }, view: 'reportManagement' },
    { key: 'diagnosis',     label: '진단',         imgSrc: '/figma-assets/admin/card_diagnosis.png',  icon: { w: 71, h: 71, l: 29, t: 41 }, view: 'adminDiagnosis' },
    { key: 'survey',        label: '설문',         imgSrc: '/figma-assets/admin/card_survey.png',     icon: { w: 61, h: 77, l: 36, t: 27 }, view: 'surveyManagement' },
    { key: 'publicData',    label: '공공데이터',   imgSrc: '/figma-assets/admin/card_publicdata.png', icon: { w: 77, h: 72, l: 22, t: 20 }, view: 'adminPublicData' },
    { key: 'promo',         label: '홍보',         imgSrc: '/figma-assets/admin/card_promo.png',      icon: { w: 110, h: 110, l: 6, t: 1 }, view: 'adminPromos' },
    { key: 'notice',        label: '공지사항',     imgSrc: '/figma-assets/admin/card_notice.png',     icon: { w: 73, h: 49, l: 26, t: 30 }, view: 'adminNotices' },
    { key: 'aiCitizen',     label: 'AI 가상시민',  imgSrc: '/figma-assets/icons/nav_ai_citizen.svg',  icon: { w: 64, h: 64, l: 36, t: 37 }, view: 'adminCitizenData' },
    { key: 'etc1',          label: '기타+',        imgSrc: null, view: 'comingSoon', empty: true },
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
        fetch(`${API_BASE}/admin/stats`, {
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
                                <div
                                    className="admin-card-icon"
                                    style={{
                                        width: card.icon.w,
                                        height: card.icon.h,
                                        left: card.icon.l,
                                        top: card.icon.t,
                                    }}
                                >
                                    <img src={card.imgSrc} alt={card.label} />
                                </div>
                            )}
                            {STAT_KEY_BY_CARD[card.key] && (
                                <div className="admin-card-stat">
                                    {stats?.[STAT_KEY_BY_CARD[card.key]]?.toLocaleString?.() ?? '—'}
                                </div>
                            )}
                            <div className="admin-card-label">{card.label}</div>
                        </div>
                    );
                })}
            </div>
        </AdminLayout>
    );
}
