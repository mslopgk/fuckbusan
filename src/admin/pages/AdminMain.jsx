import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';

// Figma 일치 인라인 SVG 아이콘 (lucide-react 대체) — viewBox 24×24, 56px 디스플레이
const COMMON = {
    width: 56,
    height: 56,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

function IconUser() {
    // 사람 실루엣: 머리(원) + 어깨/상체(반원)
    return (
        <svg {...COMMON}>
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
        </svg>
    );
}

function IconReportPropose() {
    // 문서 + 연필(편집) — 우상단 폴드, 우하단 연필
    return (
        <svg {...COMMON}>
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/>
            <path d="M14 3v6h6"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L13 14l-4 1 1-4 8.5-8.5z"/>
        </svg>
    );
}

function IconDiagnosis() {
    // 돋보기 + 안에 체크
    return (
        <svg {...COMMON}>
            <circle cx="11" cy="11" r="7"/>
            <path d="M8 11l2.5 2.5L14 9"/>
            <line x1="16" y1="16" x2="21" y2="21"/>
        </svg>
    );
}

function IconSurvey() {
    // 클립보드 + 표정 피드백 3개 (좋음/보통/나쁨)
    return (
        <svg {...COMMON}>
            <rect x="4" y="4" width="16" height="17" rx="2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
            <circle cx="8" cy="11.5" r="1.4"/>
            <circle cx="12" cy="11.5" r="1.4"/>
            <circle cx="16" cy="11.5" r="1.4"/>
            <path d="M7 17h10"/>
        </svg>
    );
}

function IconPublicData() {
    // 원자(분자) 구조 — 3개 회전 타원 + 중앙 점
    return (
        <svg {...COMMON}>
            <ellipse cx="12" cy="12" rx="9" ry="3"/>
            <ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(60 12 12)"/>
            <ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(120 12 12)"/>
            <circle cx="12" cy="12" r="1.4" fill="currentColor"/>
        </svg>
    );
}

function IconPromo() {
    // 과녁 + 화살
    return (
        <svg {...COMMON}>
            <circle cx="11" cy="13" r="8"/>
            <circle cx="11" cy="13" r="4.5"/>
            <circle cx="11" cy="13" r="1.5" fill="currentColor"/>
            <path d="M16 8l5-5"/>
            <path d="M21 3l-3 .5L18.5 6"/>
        </svg>
    );
}

function IconNotice() {
    // 메가폰 + 음파
    return (
        <svg {...COMMON}>
            <path d="M3 11l13-6v14L3 13z"/>
            <path d="M3 11v2"/>
            <path d="M19 8c1.5.8 2.5 2.2 2.5 4s-1 3.2-2.5 4"/>
            <path d="M9 13.5V17a2 2 0 0 0 4 0v-2"/>
        </svg>
    );
}

const CARDS = [
    { key: 'member',        label: '회원관리',   Icon: IconUser,           view: 'adminDashboardNew' },
    { key: 'reportSuggest', label: '제보/제안',  Icon: IconReportPropose,  view: 'reportManagement' },
    { key: 'diagnosis',     label: '진단',       Icon: IconDiagnosis,      view: 'comingSoon' },
    { key: 'survey',        label: '설문',       Icon: IconSurvey,         view: 'surveyManagement' },
    { key: 'publicData',    label: '공공데이터', Icon: IconPublicData,     view: 'comingSoon' },
    { key: 'promo',         label: '홍보',       Icon: IconPromo,          view: 'comingSoon' },
    { key: 'notice',        label: '공지사항',   Icon: IconNotice,         view: 'comingSoon' },
    { key: 'etc1',          label: '기타+',      Icon: null, view: 'comingSoon', empty: true },
    { key: 'etc2',          label: '기타+',      Icon: null, view: 'comingSoon', empty: true },
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
                    const Icon = card.Icon;
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
                                    <Icon />
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
