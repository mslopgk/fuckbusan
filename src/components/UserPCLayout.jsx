import { useState, useEffect } from 'react';
import './UserPCLayout.css';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';


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
    const [chooserOpen, setChooserOpen] = useState(false);
    const { count: unreadCount } = useUnreadNotifications();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const name = localStorage.getItem('user_name') || localStorage.getItem('username') || '';
        setIsLoggedIn(!!token);
        setUserName(name);
    }, [currentView]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        localStorage.removeItem('user_name');
        setIsLoggedIn(false);
        setUserName('');
        onNavigate && onNavigate('home');
    };

    const handleNavClick = (item) => {
        if (item.view === 'comingSoon') return;
        if (item.key === 'reportSuggest') { setChooserOpen(true); return; }
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
                            aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : '알림'}
                            style={{ position: 'relative' }}
                            onClick={() => isLoggedIn ? onNavigate && onNavigate('mNotifications') : onNavigate && onNavigate('login')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            {unreadCount > 0 && (
                                <span aria-hidden="true" style={{
                                    position: 'absolute', top: 2, right: 2,
                                    background: '#E6235A', color: '#fff',
                                    borderRadius: 8, minWidth: 16, height: 16, padding: '0 4px',
                                    fontSize: 10, fontWeight: 700, lineHeight: '16px',
                                    textAlign: 'center', boxSizing: 'border-box',
                                }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                            )}
                        </button>
                    </div>
                </div>
            </header>
            <main className="user-pc-main">
                {children}
            </main>

            {chooserOpen && (
                <div className="pc-rp-chooser-backdrop" onClick={() => setChooserOpen(false)}>
                    <div className="pc-rp-chooser-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="pc-rp-chooser-title">어떤 활동을 하시겠어요?</h3>
                        <p className="pc-rp-chooser-sub">제보 또는 제안 중 하나를 선택해주세요</p>
                        <div className="pc-rp-chooser-row">
                            <button
                                type="button"
                                className="pc-rp-chooser-card"
                                onClick={() => { setChooserOpen(false); onNavigate && onNavigate('pcReportMap'); }}
                            >
                                <span className="pc-rp-chooser-icon" aria-hidden="true">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 11l15-7v16l-15-7z"/>
                                        <path d="M3 11v3a3 3 0 0 0 3 3l1 4h2l-1-4"/>
                                    </svg>
                                </span>
                                <strong>제보하기</strong>
                                <span className="pc-rp-chooser-desc">우리 동네 불편사항을<br/>알려주세요</span>
                            </button>
                            <button
                                type="button"
                                className="pc-rp-chooser-card"
                                onClick={() => { setChooserOpen(false); onNavigate && onNavigate('pcProposeMap'); }}
                            >
                                <span className="pc-rp-chooser-icon" aria-hidden="true">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="6" y1="20" x2="6" y2="13"/>
                                        <line x1="12" y1="20" x2="12" y2="6"/>
                                        <line x1="18" y1="20" x2="18" y2="10"/>
                                    </svg>
                                </span>
                                <strong>제안하기</strong>
                                <span className="pc-rp-chooser-desc">새로운 정책 아이디어를<br/>제안해주세요</span>
                            </button>
                        </div>
                        <button
                            type="button"
                            className="pc-rp-chooser-cancel"
                            onClick={() => setChooserOpen(false)}
                        >취소</button>
                    </div>
                </div>
            )}
        </div>
    );
}
