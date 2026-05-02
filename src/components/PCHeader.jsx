/* PCHeader.jsx - PC 전용 네비게이션 헤더 */
import React, { useState, useEffect } from 'react';
import './PCHeader.css';

const SURVEY_VIEWS = ['pcSurveyList', 'pcSurveyDetail', 'pcSurveyConsent', 'pcSurveyJoin', 'pcSurveyResults', 'pcSurveyDone'];
const REPORT_SUGGEST_VIEWS = ['pcProposeMap', 'pcProposeForm', 'pcProposeDone', 'pcProposeDetail', 'pcReportMap', 'pcReportForm', 'pcReportDone', 'pcReportDetail', 'proposalForm', 'proposalList', 'proposalDetail', 'myProposals', 'reportList', 'reportDetail', 'reportPostForm'];
const DIAGNOSIS_VIEWS = ['diagnosis', 'diagnosisStep1', 'bigCategory', 'checkList', 'satisfaction', 'review', 'checkDone', 'diagnosisResult', 'diagnosisList', 'diagnosisEdit', 'expertDiagnosisResult'];

const PCHeader = ({ currentView, onNavigate }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [showLogoutToast, setShowLogoutToast] = useState(false);

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
        localStorage.removeItem('district_code');
        setIsLoggedIn(false);
        setShowLogoutToast(true);
        setTimeout(() => {
            setShowLogoutToast(false);
            onNavigate('home');
        }, 1800);
    };

    const handleNav = (target) => {
        if (target === 'comingSoon') return;
        onNavigate(target);
    };

    const disabledStyle = { color: '#9ca3af', cursor: 'not-allowed', opacity: 0.5 };

    const isActive = (key) => {
        if (key === 'survey') return SURVEY_VIEWS.includes(currentView);
        if (key === 'reportSuggest') return REPORT_SUGGEST_VIEWS.includes(currentView);
        if (key === 'diagnosis') return DIAGNOSIS_VIEWS.includes(currentView);
        return false;
    };

    return (
        <header className="pc-header">
            <div className="pc-header-inner">
                {/* 로고 */}
                <div className="pc-logo" onClick={() => onNavigate('home')}>
                    <img src="/WDC.svg" alt="WDC 로고" style={{ height: '32px', display: 'block' }} />
                </div>

                {/* 네비게이션 (Figma 5-nav) */}
                <nav className="pc-nav">
                    <button
                        className={`pc-nav-link ${isActive('survey') ? 'active' : ''}`}
                        onClick={() => handleNav('pcSurveyList')}
                    >
                        설문
                    </button>
                    <button
                        className={`pc-nav-link ${isActive('reportSuggest') ? 'active' : ''}`}
                        onClick={() => handleNav('pcProposeMap')}
                    >
                        제보/제안
                    </button>
                    <button
                        className={`pc-nav-link ${isActive('diagnosis') ? 'active' : ''}`}
                        onClick={() => handleNav('diagnosis')}
                    >
                        진단
                    </button>
                    <button
                        className="pc-nav-link disabled"
                        style={disabledStyle}
                        onClick={() => handleNav('comingSoon')}
                    >
                        AI가상시민
                    </button>
                    <button
                        className="pc-nav-link disabled"
                        style={disabledStyle}
                        onClick={() => handleNav('comingSoon')}
                    >
                        공공데이터
                    </button>
                </nav>

                {/* 우측 액션 */}
                <div className="pc-header-actions">
                    {isLoggedIn ? (
                        <>
                            <span className="pc-user-name" onClick={() => onNavigate('myPage')} style={{ cursor: 'pointer' }}>{userName}</span>
                            <button className="pc-auth-link" onClick={() => onNavigate('myPage')}>마이페이지</button>
                            <span className="pc-auth-divider"></span>
                            <button className="pc-auth-link" onClick={handleLogout}>로그아웃</button>
                        </>
                    ) : (
                        <>
                            <button className="pc-auth-link" onClick={() => onNavigate('login')}>로그인</button>
                            <span className="pc-auth-divider"></span>
                            <button className="pc-auth-link" onClick={() => onNavigate('signup')}>회원가입</button>
                        </>
                    )}
                    <button
                        className="pc-bell-btn disabled"
                        style={disabledStyle}
                        onClick={() => {}}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* 로그아웃 토스트 */}
            {showLogoutToast && (
                <div className="pc-logout-toast">
                    로그아웃 되었습니다
                </div>
            )}
        </header>
    );
};

export default PCHeader;
