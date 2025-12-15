import React from 'react';
import './ReportSuccess.css';

const ReportSuccess = ({ onGoHome }) => {
    return (
        <div className="report-success-container">
            <div className="success-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div className="success-title">제보 완료</div>
            <div className="success-subtitle">신속히 검토하겠습니다</div>
            <div className="success-desc">
                도시의 불편을 알려주셔서 감사합니다.<br />
                더 나은 생활환경 조성을 위해 소중한 의견을 활용하겠습니다.
            </div>

            <div className="report-success-footer">
                <button className="home-btn" onClick={onGoHome}>
                    홈으로 이동
                </button>
            </div>
        </div>
    );
};

export default ReportSuccess;
