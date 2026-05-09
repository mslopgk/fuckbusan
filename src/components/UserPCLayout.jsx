import { useState, useEffect } from 'react';
import './UserPCLayout.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const NAV_ITEMS = [
    { key: 'survey', label: '설문', view: 'pcSurveyList' },
    { key: 'reportSuggest', label: '제보/제안', view: 'pcProposeMap' },
    { key: 'diagnosis', label: '진단', view: 'pcDiagnosisMap' },
    { key: 'aiCitizen', label: 'AI가상시민', view: 'pcAICitizen' },
    { key: 'publicData', label: '공공데이터', view: 'comingSoon' },
];

const SURVEY_VIEWS = ['pcSurveyList', 'pcSurveyDetail', 'pcSurveyConsent', 'pcSurveyJoin', 'pcSurveyResults', 'pcSurveyDone'];
const REPORT_SUGGEST_VIEWS = ['pcProposeMap', 'pcProposeForm', 'pcProposeDone', 'pcProposeDetail', 'pcReportMap', 'pcReportForm', 'pcReportDone', 'pcReportDetail', 'pcMyReportList', 'pcMyReportEdit'];
const DIAGNOSIS_VIEWS = ['pcDiagnosisMap', 'pcDiagnosisForm', 'pcDiagnosisDetail', 'pcDiagnosisDone'];
const AI_CITIZEN_VIEWS = ['pcAICitizen'];

const disabledStyle = { color: '#9ca3af', cursor: 'not-allowed', opacity: 0.5 };

export default function UserPCLayout({ children, currentView, onNavigate }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const name = localStorage.getItem('user_name') || localStorage.getItem('username') || '';
        setIsLoggedIn(!!token);
        setUserName(name);
        if (token) {
            fetch(`${API_URL}/api/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((r) => (r.ok ? r.json() : { count: 0 }))
                .then((j) => setUnreadCount(j.count ?? 0))
                .catch(() => setUnreadCount(0));
        } else {
            setUnreadCount(0);
        }
    }, [currentView]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        localStorage.removeItem('user_name');
        setIsLoggedIn(false);
        setUserName('');
        setUnreadCount(0);
        onNavigate && onNavigate('home');
    };

    const handleNavClick = (item) => {
        if (item.view === 'comingSoon') return;
        if (onNavigate) onNavigate(item.view);
    };

    const isActive = (key) => {
        if (key === 'survey') return SURVEY_VIEWS.includes(currentView);
        if (key === 'reportSuggest') return REPORT_SUGGEST_VIEWS.includes(currentView);
        if (key === 'diagnosis') return DIAGNOSIS_VIEWS.includes(currentView);
        if (key === 'aiCitizen') return AI_CITIZEN_VIEWS.includes(currentView);
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
                        {isLoggedIn ? (
                            <>
                                <span className="user-pc-auth" style={{ cursor: 'default', color: '#1a1a1b' }}>{userName}</span>
                                <span className="user-pc-divider">|</span>
                                <button className="user-pc-auth" onClick={() => onNavigate && onNavigate('myPage')}>마이페이지</button>
                                <span className="user-pc-divider">|</span>
                                <button className="user-pc-auth" onClick={handleLogout}>로그아웃</button>
                            </>
                        ) : (
                            <>
                                <button className="user-pc-auth" onClick={() => onNavigate && onNavigate('login')}>로그인</button>
                                <span className="user-pc-divider">|</span>
                                <button className="user-pc-auth" onClick={() => onNavigate && onNavigate('signup')}>회원가입</button>
                            </>
                        )}
                        <button
                            className="user-pc-bell"
                            aria-label="알림"
                            style={{ position: 'relative' }}
                            onClick={() => isLoggedIn ? onNavigate && onNavigate('myActivityHub') : onNavigate && onNavigate('login')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: 2, right: 2,
                                    background: '#E6235A', color: '#fff',
                                    borderRadius: '50%', width: 14, height: 14,
                                    fontSize: 9, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    lineHeight: 1,
                                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
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
