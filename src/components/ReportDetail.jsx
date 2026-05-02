import React, { useState, useEffect } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import './ReportDetail.css';

const CATEGORY_STYLES = {
    '주거': { background: '#FFF3E0', color: '#E65100' },
    '환경': { background: '#E8F5E9', color: '#2E7D32' },
    '교통': { background: '#E3F2FD', color: '#1565C0' },
    '안전': { background: '#FCE4EC', color: '#C62828' },
    '산업·일자리': { background: '#E0F2F1', color: '#00695C' },
    '교육': { background: '#EDE7F6', color: '#4527A0' },
    '문화·여가': { background: '#FFF8E1', color: '#F57F17' },
    '보건·복지': { background: '#F3E5F5', color: '#7B1FA2' },
};

const ReportDetail = ({ report, onBack, onNavigate, onDelete, likedIds, onToggleLike, showActions }) => {
    useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services', 'clusterer'] });
    const [showResultModal, setShowResultModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [comment, setComment] = useState('');

    const isLiked = likedIds && likedIds.has(report?.id);

    // Auto-open modal if the report is in 'Result Announcement' stage
    useEffect(() => {
        if (report && report.progress_step === 4 && report.result_details) {
            setShowResultModal(true);
        }
    }, [report]);

    if (!report) {
        return (
            <div className="rd-error-container">
                <div className="rd-error-content">
                    <p>보고서 데이터를 불러올 수 없습니다.</p>
                    <button onClick={onBack} className="rd-error-back-btn">돌아가기</button>
                </div>
            </div>
        );
    }

    const style = CATEGORY_STYLES[report.category] || { background: '#F3F4F6', color: '#666' };
    const steps = ['접수', '검토중', '검토완료', '결과안내'];

    // Provide default coordinates if missing
    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const handleEdit = () => {
        onNavigate('reportPostForm', { isEdit: true, report: report });
    };

    return (
        <div className="rd-container">
            {/* Header: Back button only */}
            <header className="rd-header">
                <button className="rd-back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
            </header>

            <main className="rd-content">
                {/* 1. Top Tags: Region, Category, Sub-category */}
                <div className="rd-tags-row">
                    <span className="rd-tag bg-blue">{report.region}</span>
                    <span className="rd-tag bg-yellow">{report.category}</span>
                    <span className="rd-tag bg-pink">{report.sub_category}</span>
                </div>

                {/* 2. Author and Basic Info */}
                <div className="rd-author-info">
                    <h1 className="rd-author-name">{report.author || '동래구 우리디자이너'}</h1>
                    <div className="rd-meta-row-small">
                        <span>{report.location}</span>
                        <span className="rd-dot-divider">·</span>
                        <span>{report.date}</span>
                    </div>
                </div>

                <hr className="rd-divider" />

                {/* 3. Title and Content */}
                <section className="rd-report-body">
                    <h2 className="rd-main-title">{report.content || report.title}</h2>

                    <div className="rd-image-container">
                        <img src={report.image} alt="Report content" className="rd-main-img" />
                    </div>

                    <div className="rd-map-preview">
                        <Map
                            center={{ lat: report.lat || 35.1795, lng: report.lng || 129.0756 }}
                            level={4}
                            className="rd-leaflet-preview"
                            draggable={false}
                            zoomable={false}
                            disableDoubleClickZoom={true}
                        >
                            <MapMarker position={{ lat: report.lat || 35.1795, lng: report.lng || 129.0756 }} />
                        </Map>
                    </div>
                </section>

                {/* 4. Detailed Meta: Date, Views, Likes, Comments */}
                <div className="rd-stats-row-detailed">
                    <div className="rd-stats-left">
                        {report.date} · 조회수 {report.views || 0}
                    </div>
                    <div className="rd-stats-right">
                        <div className="rd-stat-item" onClick={() => onToggleLike && onToggleLike(report.id)} style={{ cursor: 'pointer' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "#E6235A" : "none"} stroke={isLiked ? "#E6235A" : "#adb5bd"}>
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <span>{(report.likes || 0) + (isLiked ? 1 : 0)}</span>
                        </div>
                        <div className="rd-stat-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#adb5bd">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>{report.comments || 0}</span>
                        </div>
                     </div>
                </div>

                <div className="rd-divider"></div>

                {/* 5. Comment Input Area (Restored) */}
                <div className="rd-comment-input-wrapper">
                    <div className="rd-comment-input-inner">
                        <input 
                            type="text" 
                            className="rd-comment-input" 
                            placeholder="댓글을 입력해주세요"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <button className="rd-comment-send-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Comments List */}
                <div className="rd-comments-list">
                    {(report.comments_list || []).length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', margin: '40px 0' }}>아직 댓글이 없습니다.</div>
                    ) : (
                        (report.comments_list || []).map(c => (
                            <div key={c.id} className="rd-comment-item">
                                <h4 className="rd-comment-author">{c.author}</h4>
                                <p className="rd-comment-text">{c.content}</p>
                                <span className="rd-reply-btn">답글쓰기</span>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {showActions ? (
                <div className="rd-action-footer">
                    <button className="rd-btn-delete" onClick={handleDelete}>삭제하기</button>
                    <button className="rd-btn-modify" onClick={handleEdit}>수정하기</button>
                </div>
            ) : (
                <div className="rd-stepper-wrapper-new">
                    <div className="rd-stepper-inner">
                        {steps.map((step, idx) => {
                            const currentStep = report.progress_step || 1;
                            const isActive = idx + 1 === currentStep;
                            return (
                                <React.Fragment key={step}>
                                    <div 
                                        className={`rd-step-pill ${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            if (step === '결과안내' && isActive && report.result_details) {
                                                setShowResultModal(true);
                                            }
                                        }}
                                    >
                                        {step}
                                    </div>
                                    {idx < steps.length - 1 && <div className="rd-step-connector"></div>}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Result Modal - Image Match Design */}
            {showResultModal && (
                <div className="rd-modal-overlay" onClick={() => setShowResultModal(false)}>
                    <div className="rd-modal-card" onClick={(e) => e.stopPropagation()}>
                        <h2 className="rd-modal-title">{report.result_details?.title || '개선 결과보기'}</h2>
                        <div className="rd-modal-img-wrapper">
                            <img src={report.result_details?.image} alt="Result" className="rd-modal-img" />
                        </div>
                        <p className="rd-modal-content">
                            {report.result_details?.content}
                        </p>
                        <div className="rd-modal-footer">
                            <span className="rd-manager-label">{report.result_details?.manager || '담당자 코멘트'}</span>
                            <span className="rd-manager-date">{report.result_details?.result_date}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal (Pink Theme) */}
            {showDeleteModal && (
                <div className="rd-delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="rd-delete-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="rd-delete-modal-icon-container">
                            <img src="/garbageicon.svg" alt="Remove" className="rd-delete-modal-icon" />
                        </div>
                        <h2 className="rd-delete-modal-title">제보글을 삭제하시겠습니까?</h2>
                        <div className="rd-delete-modal-btns">
                            <button className="rd-delete-btn-yes" onClick={() => {
                                setShowDeleteModal(false);
                                if (onDelete && report.id) {
                                    onDelete(report.id);
                                } else {
                                    onBack();
                                }
                            }}>
                                네
                            </button>
                            <button className="rd-delete-btn-no" onClick={() => setShowDeleteModal(false)}>
                                아니오
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDetail;
