/* MyActivityHub.jsx */
import React from 'react';
import './MyActivityHub.css';
import MobileBottomNav from './MobileBottomNav';

const MyActivityHub = ({ onBack, onNavigate }) => {
    return (
        <div className="ma-hub-container">
            {/* Header */}
            <header className="ma-hub-header">
                <button className="ma-hub-back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </header>

            <div className="ma-hub-body">
                <h1 className="ma-hub-title">나의 활동</h1>

                <div className="ma-hub-welcome-section">
                    <h2 className="ma-hub-welcome-text">부산과 함께한 <br />당신의 소중한 발걸음입니다.</h2>
                    <p className="ma-hub-welcome-desc">제보와 제안 내역을 한눈에 확인해 보세요.</p>
                </div>

                <div className="ma-hub-button-grid">
                    {/* My Report Button */}
                    <button
                        className="ma-hub-card report"
                        onClick={() => onNavigate('myReportList')}
                    >
                        <div className="ma-hub-card-icon">
                            <img src="/pencilicon.svg" alt="제보하기 아이콘" />
                        </div>
                        <div className="ma-hub-card-text">
                            <div className="ma-hub-card-title">나의 제보현황</div>
                            <div className="ma-hub-card-subtitle">내가 알린 부산의 이야기</div>
                        </div>
                        <div className="ma-hub-card-arrow">→</div>
                    </button>

                    {/* My Proposal Button */}
                    <button
                        className="ma-hub-card proposal"
                        onClick={() => onNavigate('myProposals')}
                    >
                        <div className="ma-hub-card-icon">
                            <img src="/lighticon.svg" alt="제안하기 아이콘" />
                        </div>
                        <div className="ma-hub-card-text">
                            <div className="ma-hub-card-title">나의 제안현황</div>
                            <div className="ma-hub-card-subtitle">내가 꿈꾼 더 나은 부산</div>
                        </div>
                        <div className="ma-hub-card-arrow">→</div>
                    </button>

                    {/* My Diagnosis Button */}
                    <button
                        className="ma-hub-card diagnosis"
                        onClick={() => onNavigate('myActivity')}
                    >
                        <div className="ma-hub-card-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06AB69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4"></path>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                        </div>
                        <div className="ma-hub-card-text">
                            <div className="ma-hub-card-title">나의 진단내역</div>
                            <div className="ma-hub-card-subtitle">내가 진단한 공공디자인 기록</div>
                        </div>
                        <div className="ma-hub-card-arrow">→</div>
                    </button>
                </div>
            </div>

            <MobileBottomNav currentView="myActivityHub" onNavigate={onNavigate} />
        </div>
    );
};

export default MyActivityHub;
