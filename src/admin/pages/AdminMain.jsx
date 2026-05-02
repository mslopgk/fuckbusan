import { User, FilePen, ScanSearch, ClipboardList, Network, Target, Megaphone } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';

const CARDS = [
    { key: 'member', label: '회원관리', icon: User, view: 'adminDashboardNew' },
    { key: 'reportSuggest', label: '제보/제안', icon: FilePen, view: 'reportManagement' },
    { key: 'diagnosis', label: '진단', icon: ScanSearch, view: 'comingSoon' },
    { key: 'survey', label: '설문', icon: ClipboardList, view: 'surveyManagement' },
    { key: 'publicData', label: '공공데이터', icon: Network, view: 'comingSoon' },
    { key: 'promo', label: '홍보', icon: Target, view: 'comingSoon' },
    { key: 'notice', label: '공지사항', icon: Megaphone, view: 'comingSoon' },
    { key: 'etc1', label: '기타+', icon: null, view: 'comingSoon', empty: true },
    { key: 'etc2', label: '기타+', icon: null, view: 'comingSoon', empty: true },
];

export default function AdminMain({ onNavigate }) {
    const handleClick = (card, disabled) => {
        if (disabled) return;
        if (onNavigate) onNavigate(card.view);
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminMain">
            <div className="admin-card-grid">
                {CARDS.map((card) => {
                    const Icon = card.icon;
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
                            {Icon && (
                                <div className="admin-card-icon">
                                    <Icon size={56} strokeWidth={1.5} />
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
