import React, { useState, useEffect } from 'react';
import './Report.css';
import ReportForm from './ReportForm';
import SuggestForm from './SuggestForm';
import ReportSuccess from './ReportSuccess';
import SuggestSuccess from './SuggestSuccess';

const Report = ({ onBack, onNext }) => {
    const [selectedType, setSelectedType] = useState(null); // 'report' or 'suggest'

    // Force full width layout
    useEffect(() => {
        document.body.classList.add('layout-full-width');
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    // New State for completion view
    const [view, setView] = useState('selection'); // 'selection' | 'form' | 'success'

    // Handle initial selection next button
    const handleNext = () => {
        if (selectedType) {
            setView('form'); // Switch to form view
        }
    };

    const handleFormSubmit = () => {
        setView('success'); // Switch to success view
    };

    const handleGoHome = () => {
        onBack(); // Return to main Home
    };

    if (view === 'form') {
        if (selectedType === 'suggest') {
            return <SuggestForm onBack={() => setView('selection')} onSubmit={handleFormSubmit} />;
        }
        return <ReportForm onBack={() => setView('selection')} onSubmit={handleFormSubmit} />;
    }

    if (view === 'success') {
        if (selectedType === 'suggest') {
            return <SuggestSuccess onGoHome={handleGoHome} />;
        }
        return <ReportSuccess onGoHome={handleGoHome} />;
    }

    return (
        <div className="report-container">
            {/* Header */}
            <div className="report-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            {/* Title */}
            <div className="report-title-section">
                <div className="report-title">제보하기</div>
                <div className="report-subtitle-main">
                    더 나은 부산을 위한 참여의 시작
                </div>
                <div className="report-subtitle-desc">
                    불편한 점은 제보로, 개선 의견은 제안으로 전달해 주세요.
                </div>
            </div>

            {/* Selection Area */}
            <div>
                <div className="selection-label">제보/제안 선택</div>
                <div className="selection-group">
                    <button
                        className={`select-btn ${selectedType === 'report' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('report')}
                    >
                        제보하기
                    </button>
                    <button
                        className={`select-btn ${selectedType === 'suggest' ? 'selected' : ''}`}
                        onClick={() => setSelectedType('suggest')}
                    >
                        제안하기
                    </button>
                </div>
            </div>

            {/* Footer / Next Button */}
            <div className="report-footer">
                <button
                    className={`login-submit-btn ${selectedType ? 'active' : 'disabled'}`}
                    disabled={!selectedType}
                    onClick={() => {
                        if (selectedType) {
                            // onNext(selectedType); // Old behavior
                            setView('form');
                        }
                    }}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default Report;
