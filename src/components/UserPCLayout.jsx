import './UserPCLayout.css';

const NAV_ITEMS = [
    { key: 'survey', label: '설문', view: 'pcSurveyList' },
    { key: 'reportSuggest', label: '제보/제안', view: 'pcProposeMap' },
    { key: 'diagnosis', label: '진단', view: 'comingSoon' },
    { key: 'aiCitizen', label: 'AI가상시민', view: 'comingSoon' },
    { key: 'publicData', label: '공공데이터', view: 'comingSoon' },
];

const SURVEY_VIEWS = ['pcSurveyList', 'pcSurveyDetail', 'pcSurveyConsent', 'pcSurveyJoin', 'pcSurveyResults', 'pcSurveyDone'];
const REPORT_SUGGEST_VIEWS = ['pcProposeMap', 'pcProposeForm', 'pcProposeDone', 'pcProposeDetail', 'pcReportMap', 'pcReportForm', 'pcReportDone', 'pcReportDetail'];

const disabledStyle = { color: '#9ca3af', cursor: 'not-allowed', opacity: 0.5 };

export default function UserPCLayout({ children, currentView, onNavigate }) {
    const handleNavClick = (item) => {
        if (item.view === 'comingSoon') return;
        if (onNavigate) onNavigate(item.view);
    };

    const isActive = (key) => {
        if (key === 'survey') return SURVEY_VIEWS.includes(currentView);
        if (key === 'reportSuggest') return REPORT_SUGGEST_VIEWS.includes(currentView);
        return false;
    };

    return (
        <div className="user-pc-shell">
            <header className="user-pc-header">
                <div className="user-pc-header-inner">
                    <div className="user-pc-logo" onClick={() => onNavigate && onNavigate('home')}>
                        <img src="/WDC.svg" alt="WDC" style={{ height: '32px', display: 'block' }} />
                    </div>
                    <nav className="user-pc-nav">
                        {NAV_ITEMS.map((item) => {
                            const disabled = item.view === 'comingSoon';
                            return (
                                <button
                                    key={item.key}
                                    className={`user-pc-nav-link ${isActive(item.key) ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                    style={disabled ? disabledStyle : undefined}
                                    onClick={() => handleNavClick(item)}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                    <div className="user-pc-header-actions">
                        <button className="user-pc-auth" onClick={() => onNavigate && onNavigate('login')}>로그인</button>
                        <span className="user-pc-divider">|</span>
                        <button className="user-pc-auth" onClick={() => onNavigate && onNavigate('signup')}>회원가입</button>
                        <button className="user-pc-bell disabled" aria-label="알림" style={disabledStyle} onClick={() => {}}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>
            <main className="user-pc-main">
                {children}
            </main>
        </div>
    );
}
