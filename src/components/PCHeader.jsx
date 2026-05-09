/* PCHeader.jsx - PC 전용 네비게이션 헤더 */
import React, { useState, useEffect } from 'react';
import './PCHeader.css';

const SURVEY_VIEWS = ['pcSurveyList', 'pcSurveyDetail', 'pcSurveyConsent', 'pcSurveyJoin', 'pcSurveyResults', 'pcSurveyDone'];
const REPORT_SUGGEST_VIEWS = ['pcProposeMap', 'pcProposeForm', 'pcProposeDone', 'pcProposeDetail', 'pcReportMap', 'pcReportForm', 'pcReportDone', 'pcReportDetail', 'pcMyReportList', 'pcMyReportEdit', 'proposalForm', 'proposalList', 'proposalDetail', 'myProposals', 'reportList', 'reportDetail', 'reportPostForm'];
const DIAGNOSIS_VIEWS = ['diagnosis', 'diagnosisStep1', 'bigCategory', 'checkList', 'satisfaction', 'review', 'checkDone', 'diagnosisResult', 'diagnosisList', 'diagnosisEdit', 'expertDiagnosisResult', 'pcDiagnosisMap', 'pcDiagnosisForm', 'pcDiagnosisDetail', 'pcDiagnosisDone'];
const AI_CITIZEN_VIEWS = ['pcAICitizen'];

const PCHeader = ({ currentView, onNavigate }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [showLogoutToast, setShowLogoutToast] = useState(false);
    const [chooserOpen, setChooserOpen] = useState(false);
    const [comingSoonToast, setComingSoonToast] = useState(false);

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
        if (target === 'comingSoon') {
            setComingSoonToast(true);
            setTimeout(() => setComingSoonToast(false), 1800);
            return;
        }
        onNavigate(target);
    };

    const disabledStyle = { color: '#9ca3af', cursor: 'not-allowed', opacity: 0.5 };

    const isActive = (key) => {
        if (key === 'survey') return SURVEY_VIEWS.includes(currentView);
        if (key === 'reportSuggest') return REPORT_SUGGEST_VIEWS.includes(currentView);
        if (key === 'diagnosis') return DIAGNOSIS_VIEWS.includes(currentView);
        if (key === 'aiCitizen') return AI_CITIZEN_VIEWS.includes(currentView);
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
                        onClick={() => setChooserOpen(true)}
                    >
                        제보·제안
                    </button>
                    <button
                        className={`pc-nav-link ${isActive('diagnosis') ? 'active' : ''}`}
                        onClick={() => handleNav('pcDiagnosisMap')}
                    >
                        진단
                    </button>
                    <button
                        className={`pc-nav-link ${isActive('aiCitizen') ? 'active' : ''}`}
                        onClick={() => handleNav('pcAICitizen')}
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

            {/* 준비중 토스트 */}
            {comingSoonToast && (
                <div className="pc-logout-toast">
                    준비중인 기능입니다
                </div>
            )}

            {/* 제보·제안 분기 chooser 모달 */}
            {chooserOpen && (
                <div
                    className="pc-rp-chooser-backdrop"
                    onClick={() => setChooserOpen(false)}
                >
                    <div
                        className="pc-rp-chooser-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="pc-rp-chooser-title">어떤 활동을 하시겠어요?</h3>
                        <p className="pc-rp-chooser-sub">제보 또는 제안 중 하나를 선택해주세요</p>
                        <div className="pc-rp-chooser-row">
                            <button
                                type="button"
                                className="pc-rp-chooser-card"
                                onClick={() => { setChooserOpen(false); onNavigate('pcReportMap'); }}
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
                                onClick={() => { setChooserOpen(false); onNavigate('pcProposeMap'); }}
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
        </header>
    );
};

export default PCHeader;
