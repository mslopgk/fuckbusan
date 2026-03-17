/* ProposalDone.jsx */
import React from 'react';
import './ProposalDone.css';

const ProposalDone = ({ onHome }) => {
    return (
        <div className="proposal-done-container">
            {/* Header */}
            <header className="pd-header">
                <span className="pd-header-title">제안하기</span>
            </header>

            {/* Content Body */}
            <div className="pd-body">
                <div className="pd-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                <h1 className="pd-title-large">제안 완료</h1>
                <h2 className="pd-subtitle">신속히 검토하겠습니다</h2>
                
                <p className="pd-description">
                    도시의 불편을 알려주셔서 감사합니다.<br />
                    더 나은 생활환경 조성을 위해 소중한 의견을 활용하겠습니다.
                </p>
            </div>

            {/* Footer Button */}
            <div className="pd-footer">
                <button className="pd-btn-home" onClick={onHome}>홈으로</button>
            </div>
        </div>
    );
};

export default ProposalDone;
