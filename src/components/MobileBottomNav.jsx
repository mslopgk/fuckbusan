import './MobileBottomNav.css';

const ITEMS = [
    { key: 'home',     label: '홈',        activeColor: '#5B2EAB' },
    { key: 'survey',   label: '설문',      activeColor: '#5B2EAB' },
    { key: 'report',   label: '제보',      activeColor: '#5B2EAB' },
    { key: 'propose',  label: '제안',      activeColor: '#5B2EAB' },
    { key: 'activity', label: '나의 활동', activeColor: '#5B2EAB' },
];

const SURVEY_VIEWS    = ['mSurveyList', 'mSurveyDetail1', 'mSurveyDetail2', 'mSurveyJoin', 'mSurveyDone', 'mSurveyResults', 'survey', 'surveyDone'];
const REPORT_VIEWS    = ['mReportList', 'mReportMap', 'mReportForm', 'mReportDetail', 'mReportDone', 'reportList', 'reportForm', 'reportDetail', 'reportDone', 'report'];
const PROPOSE_VIEWS   = ['mProposalList', 'mProposalMap', 'mProposalForm', 'mProposalDetail', 'mProposalDone', 'proposalList', 'proposalForm', 'proposalDetail', 'proposalDone'];
const ACTIVITY_VIEWS  = ['myPage', 'myActivity', 'myActivityHub', 'myReports', 'myProposals'];

function NavIcon({ name }) {
    const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (name) {
        case 'home':
            return (
                <svg {...props}>
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z"/>
                </svg>
            );
        case 'survey':
            return (
                <svg {...props}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                    <path d="M9 13h6M9 17h6M9 9h2"/>
                </svg>
            );
        case 'report':
            // 메가폰(campaign) — 제보 슬롯
            return (
                <svg {...props}>
                    <path d="M3 11l15-7v16l-15-7z"/>
                    <path d="M3 11v3a3 3 0 0 0 3 3l1 4h2l-1-4"/>
                </svg>
            );
        case 'propose':
            // 막대그래프(bar_chart) — 제안 슬롯
            return (
                <svg {...props}>
                    <line x1="6" y1="20" x2="6" y2="13"/>
                    <line x1="12" y1="20" x2="12" y2="6"/>
                    <line x1="18" y1="20" x2="18" y2="10"/>
                </svg>
            );
        case 'activity':
            return (
                <svg {...props}>
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 21a8 8 0 0 1 16 0"/>
                </svg>
            );
        default:
            return null;
    }
}

export default function MobileBottomNav({ currentView, onNavigate }) {
    const isActive = (key) => {
        if (key === 'home')     return currentView === 'home';
        if (key === 'survey')   return SURVEY_VIEWS.includes(currentView);
        if (key === 'report')   return REPORT_VIEWS.includes(currentView);
        if (key === 'propose')  return PROPOSE_VIEWS.includes(currentView);
        if (key === 'activity') return ACTIVITY_VIEWS.includes(currentView);
        return false;
    };

    const handleClick = (key) => {
        if (key === 'home')          onNavigate?.('home');
        else if (key === 'survey')   onNavigate?.('mSurveyList');
        else if (key === 'report')   onNavigate?.('mReportMap');
        else if (key === 'propose')  onNavigate?.('mProposalMap');
        else if (key === 'activity') onNavigate?.('myPage');
    };

    return (
        <nav className="m-bottom-nav">
            {ITEMS.map((it) => {
                const active = isActive(it.key);
                const style = active ? { color: it.activeColor } : undefined;
                return (
                    <button
                        key={it.key}
                        className={`m-bnav-item ${active ? 'active' : ''}`}
                        onClick={() => handleClick(it.key)}
                        type="button"
                        style={style}
                    >
                        <span className="m-bnav-icon" aria-hidden="true">
                            <NavIcon name={it.key} />
                        </span>
                        <span className="m-bnav-label">{it.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
