import React from 'react';
import './ReportSuccess.css'; // Reuse styles

const SuggestSuccess = ({ onGoHome }) => {
    return (
        <div className="report-success-container">
            <div className="success-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div className="success-title">제안 완료</div>
            <div className="success-subtitle">귀중한 의견 감사합니다</div>
            <div className="success-desc">
                보내주신 제안은 검토 후 서비스 개선에 적극 반영하겠습니다.<br />
                참여해 주셔서 감사합니다.
            </div>

            <div className="report-success-footer">
                <button className="home-btn" onClick={onGoHome}>
                    홈으로 이동
                </button>
            </div>
        </div>
    );
};

export default SuggestSuccess;
