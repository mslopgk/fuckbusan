/* PCHeader.jsx - PC 전용 네비게이션 헤더 */
import React, { useState, useEffect, useRef } from 'react';
import './PCHeader.css';

const PCHeader = ({ currentView, onNavigate }) => {
    const [proposalDropdownOpen, setProposalDropdownOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [showLogoutToast, setShowLogoutToast] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const name = localStorage.getItem('user_name') || localStorage.getItem('username') || '';
        setIsLoggedIn(!!token);
        setUserName(name);
    }, [currentView]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setProposalDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const isProposalActive = ['proposalForm', 'proposalList', 'proposalDetail', 'myProposals'].includes(currentView);

    return (
        <header className="pc-header">
            <div className="pc-header-inner">
                {/* 로고 */}
                <div className="pc-logo" onClick={() => onNavigate('home')}>
                    <img src="/WDC.svg" alt="WDC 로고" style={{ height: '32px', display: 'block' }} />
                </div>

                {/* 네비게이션 */}
                <nav className="pc-nav">
                    <button
                        className={`pc-nav-link ${currentView === 'home' ? 'active' : ''}`}
                        onClick={() => onNavigate('home')}
                    >
                        홈
                    </button>

                    <div className="pc-nav-dropdown-wrapper" ref={dropdownRef}>
                        <button
                            className={`pc-nav-link ${isProposalActive ? 'active' : ''}`}
                            onClick={() => setProposalDropdownOpen(prev => !prev)}
                        >
                            제안
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', transform: proposalDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        {proposalDropdownOpen && (
                            <div className="pc-dropdown-menu">
                                <button className="pc-dropdown-item" onClick={() => { setProposalDropdownOpen(false); onNavigate('proposalForm'); }}>
                                    제안하기
                                </button>
                                <button className="pc-dropdown-item" onClick={() => { setProposalDropdownOpen(false); onNavigate('proposalList'); }}>
                                    제안현황
                                </button>
                                <button className="pc-dropdown-item" onClick={() => { setProposalDropdownOpen(false); onNavigate('myProposals'); }}>
                                    나의제안
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 제보 */}
                    <button 
                        className={`pc-nav-link ${currentView === 'reportList' ? 'active' : ''}`}
                        onClick={() => onNavigate('reportList')}
                    >
                        제보
                    </button>
                </nav>

                {/* 우측 액션 */}
                <div className="pc-header-actions">
                    {isLoggedIn ? (
                        <>
                            <span className="pc-user-name">{userName}</span>
                            <button className="pc-auth-link" onClick={handleLogout}>로그아웃</button>
                        </>
                    ) : (
                        <>
                            <button className="pc-auth-link" onClick={() => onNavigate('login')}>로그인</button>
                            <span className="pc-auth-divider"></span>
                            <button className="pc-auth-link" onClick={() => onNavigate('signup')}>회원가입</button>
                        </>
                    )}
                    <button className="pc-bell-btn" onClick={() => alert('알림 기능은 준비 중입니다.')}>
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
