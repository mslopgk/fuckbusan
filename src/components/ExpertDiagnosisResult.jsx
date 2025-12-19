import React, { useEffect } from 'react';
import './ExpertDiagnosisResult.css';

const ExpertDiagnosisResult = ({ onBack, onHome, onDetailFacility, onDetailZone, onDetailPerson, isEmbedded }) => {

    // Scroll to top on mount only if not embedded
    useEffect(() => {
        if (!isEmbedded) {
            window.scrollTo(0, 0);
            document.body.classList.add('layout-full-width');
        }
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, [isEmbedded]);

    return (
        <div className={`expert-result-container ${isEmbedded ? 'embedded' : ''}`}>
            {/* Header */}
            {!isEmbedded && (
                <div className="result-header">
                    <button className="icon-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <button className="icon-btn" onClick={onHome}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </button>
                </div>
            )}

            <div className="expert-page-title">전문가 진단 결과</div>

            <div className="expert-address-block">
                <div className="expert-address">부산 부산진구 초연로 6</div>
                <div className="expert-desc">위 지역의 전문가 진단 결과입니다.</div>
            </div>

            {/* Overall Result */}
            <div className="overall-result-card">
                <div className="card-main-title">전체 결과</div>
                <div className="stats-row">
                    <div className="stat-box box-purple">
                        <div className="stat-label">적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="stat-box box-purple">
                        <div className="stat-label">부적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="stat-box box-purple">
                        <div className="stat-label">만족도 평가</div>
                        <div className="stat-value">2.1</div>
                    </div>
                </div>
            </div>

            {/* Detail Section Header */}
            <div className="detail-section-title">세부 정보도 확인해 보세요</div>
            <div className="detail-section-desc">
                시설물, 구역, 인원 기준으로<br />
                진단 결과를 더욱 자세히 확인할 수 있습니다.
            </div>

            {/* Facility Card */}
            <div className="expert-detail-card">
                <div className="detail-card-title">시설물별 전체(All) 세부 정보</div>
                <div className="stats-row" style={{ width: '100%' }}>
                    <div className="stat-box box-purple">
                        <div className="stat-label">적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="stat-box box-purple">
                        <div className="stat-label">부적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="stat-box box-purple">
                        <div className="stat-label">만족도 평가</div>
                        <div className="stat-value">2.1</div>
                    </div>
                </div>
                <div className="nav-button-container">
                    <button className="detail-nav-btn btn-facility" onClick={onDetailFacility}>
                        시설물별 세부 정보
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Zone Card */}
            <div className="expert-detail-card">
                <div className="detail-card-title">구역별 전체(All) 세부 정보</div>
                <div className="stats-row" style={{ width: '100%' }}>
                    <div className="stat-box box-blue">
                        <div className="stat-label">적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="stat-box box-blue">
                        <div className="stat-label">부적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="stat-box box-blue">
                        <div className="stat-label">만족도 평가</div>
                        <div className="stat-value">2.1</div>
                    </div>
                </div>
                <div className="nav-button-container">
                    <button className="detail-nav-btn btn-zone" onClick={onDetailZone}>
                        구역별 세부 정보
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Person Card */}
            <div className="expert-detail-card">
                <div className="detail-card-title">인원별 전체(All) 세부 정보</div>
                <div className="stats-row" style={{ width: '100%' }}>
                    <div className="stat-box box-green">
                        <div className="stat-label">적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="stat-box box-green">
                        <div className="stat-label">부적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="stat-box box-green">
                        <div className="stat-label">만족도 평가</div>
                        <div className="stat-value">2.1</div>
                    </div>
                </div>
                <div className="nav-button-container">
                    <button className="detail-nav-btn btn-person" onClick={onDetailPerson}>
                        인원별 세부 정보
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default ExpertDiagnosisResult;
