/* ProposalPreview.jsx */
import React from 'react';
import './ProposalPreview.css';

const ProposalPreview = ({ data, onBack, onComplete }) => {
    if (!data) return null;

    return (
        <div className="proposal-preview-container">
            {/* Header */}
            <header className="pp-header">
                <span className="pp-header-title">제안하기</span>
            </header>

            {/* Content Body */}
            <div className="pp-body">
                <h1 className="pp-main-title">제안내용을 확인해주세요</h1>

                <div className="pp-info-card">
                    <div className="pp-info-row">
                        <span className="pp-info-label">제보유형</span>
                        <span className="pp-info-value">{data.category}</span>
                    </div>

                    <div className="pp-info-row">
                        <span className="pp-info-label">제보지역</span>
                        <span className="pp-info-value">{data.region}</span>
                    </div>

                    <div className="pp-info-row">
                        <span className="pp-info-label">제목</span>
                        <span className="pp-info-value">{data.title}</span>
                    </div>

                    <div className="pp-info-row">
                        <span className="pp-info-label">내용</span>
                        <p className="pp-info-value">{data.content}</p>
                    </div>

                    {data.preview && (
                        <div className="pp-info-row">
                            <span className="pp-info-label">이미지</span>
                            <div className="pp-preview-image-container">
                                {data.type === 'image' ? (
                                    <img src={data.preview} alt="Proposal preview" className="pp-preview-img" />
                                ) : (
                                    <video src={data.preview} className="pp-preview-img" controls />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="pp-footer">
                <button className="pp-btn-prev" onClick={onBack}>이전</button>
                <button className="pp-btn-submit" onClick={onComplete}>제안하기</button>
            </div>
        </div>
    );
};

export default ProposalPreview;
