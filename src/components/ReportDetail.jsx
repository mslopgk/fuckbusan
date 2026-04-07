import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
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

const ReportDetail = ({ report, onBack }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [comment, setComment] = useState('');
    const [showResultModal, setShowResultModal] = useState(false);

    if (!report) return <div className="rd-error">보고서를 불러올 수 없습니다.</div>;

    const style = CATEGORY_STYLES[report.category] || { background: '#F3F4F6', color: '#666' };
    const steps = ['접수', '검토중', '검토완료', '결과안내'];

    return (
        <div className="rd-container">
            {/* Header */}
            <header className="rd-header">
                <button className="rd-back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
            </header>

            <main className="rd-content">
                {/* Badges */}
                <div className="rd-badge-row">
                    <span className="rd-badge region">{report.region}</span>
                    <span className="rd-badge category" style={{ backgroundColor: style.background, color: style.color }}>
                        {report.category}
                    </span>
                    <span className="rd-badge sub-category">{report.sub_category}</span>
                </div>

                {/* Author Info */}
                <div className="rd-author-info">
                    <h2 className="rd-author-name">{report.author}</h2>
                    <span className="rd-date">{report.location} · {report.date}</span>
                </div>

                <hr className="rd-divider" />

                {/* Title */}
                <h1 className="rd-title">{report.title}</h1>

                {/* Main Image */}
                <div className="rd-main-image-wrapper">
                    <img src={report.image} alt="Report" className="rd-main-image" />
                </div>

                {/* Map Preview */}
                <div className="rd-map-preview-card">
                    <MapContainer 
                        center={[report.lat, report.lng]} 
                        zoom={16} 
                        zoomControl={false} 
                        dragging={false} 
                        touchZoom={false} 
                        scrollWheelZoom={false}
                        className="rd-mini-map"
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <Marker position={[report.lat, report.lng]} icon={L.divIcon({
                            html: '<div class="rd-map-dot"></div>',
                            className: 'rd-map-dot-container',
                            iconSize: [20, 20]
                        })} />
                    </MapContainer>
                </div>

                {/* Stats Meta */}
                <div className="rd-meta-row">
                    <span className="rd-meta-date">{report.date} · 조회수 {report.views}</span>
                    <div className="rd-meta-stats">
                        <button className={`rd-stat-btn ${isLiked ? 'liked' : ''}`} onClick={() => setIsLiked(!isLiked)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "#E6235A" : "none"} stroke={isLiked ? "none" : "#adb5bd"} strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span className="rd-stat-count" style={{ color: isLiked ? "#E6235A" : "#adb5bd" }}>{report.likes + (isLiked ? 1 : 0)}</span>
                        </button>
                        <div className="rd-stat-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7l.9.1a8.38 8.38 0 0 1 7.6 7.8z"></path>
                            </svg>
                            <span className="rd-stat-count">{report.comments}</span>
                        </div>
                    </div>
                </div>

                {/* Comment Input */}
                <div className="rd-comment-input-wrapper">
                    <input 
                        type="text" 
                        className="rd-comment-input" 
                        placeholder="댓글을 입력해주세요" 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <button className="rd-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>

                {/* Comments List */}
                <div className="rd-comments-list">
                    {(report.comments_list || []).map(c => (
                        <div key={c.id} className="rd-comment-item">
                            <h4 className="rd-comment-author">{c.author}</h4>
                            <p className="rd-comment-text">{c.content}</p>
                            <span className="rd-reply-btn">답글쓰기</span>
                        </div>
                    ))}
                </div>
            </main>

            {/* Sticky Stepper */}
            <div className="rd-stepper-wrapper">
                <div className="rd-stepper">
                    <div className="rd-stepper-line"></div>
                    {steps.map((step, idx) => {
                        const currentStep = report.progress_step || 1;
                        const isActive = idx + 1 === currentStep;
                        const isPast = idx + 1 < currentStep;
                        return (
                            <div 
                                key={step} 
                                className={`rd-step ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                                onClick={() => {
                                    if (step === '결과안내' && isActive && report.result_details) {
                                        setShowResultModal(true);
                                    }
                                }}
                            >
                                <div className="rd-step-circle">{step}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Result Modal */}
            {showResultModal && (
                <div className="rd-modal-overlay" onClick={() => setShowResultModal(false)}>
                    <div className="rd-modal-card" onClick={(e) => e.stopPropagation()}>
                        <h2 className="rd-modal-title">{report.result_details?.title}</h2>
                        <div className="rd-modal-img-wrapper">
                            <img src={report.result_details?.image} alt="Result" className="rd-modal-img" />
                        </div>
                        <p className="rd-modal-content">
                            {report.result_details?.content}
                        </p>
                        <div className="rd-modal-footer">
                            <div className="rd-modal-manager">
                                <span className="rd-manager-label">{report.result_details?.manager}</span>
                                <span className="rd-manager-date">{report.result_details?.result_date}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDetail;
