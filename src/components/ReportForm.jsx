import React, { useState, useRef } from 'react';
import './ReportForm.css';
import LocationSelector from './common/LocationSelector';

const ReportForm = ({ onBack, onSubmit }) => {
    // Intentionally empty string to show placeholder
    const [type, setType] = useState('');
    const [location, setLocation] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [files, setFiles] = useState([]);

    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);

    // Verification state
    const isReady = type !== '' && location.trim().length > 0 && title.trim().length > 0 && content.trim().length > 0;

    const handleLocationSelect = ({ address }) => {
        setLocation(address);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles([...files, ...newFiles]);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const triggerFileUpload = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async () => {
        if (!isReady) return;
        setLoading(true);

        try {
            const payload = {
                type,
                location,
                title,
                content,
                files: files.map(f => f.name) // Sending filenames for now
            };

            const response = await fetch('/api/reports/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('전송에 실패했습니다.');
            }

            const data = await response.json();
            alert(`제보가 성공적으로 제출되었습니다! (ID: ${data.id})`);

            if (onSubmit) {
                onSubmit();
            } else {
                onBack();
            }
        } catch (error) {
            console.error(error);
            alert('오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-form-container">
            {/* Header */}
            <div className="report-form-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            {/* Title Section */}
            <div className="report-form-title-section">
                <div className="report-form-title">제보하기</div>
                <div className="report-form-subtitle">
                    불편 사항을 자세히 알려주세요
                </div>
                <div className="report-form-desc">
                    발생한 문제와 상황을 구체적으로 작성해 주시면<br />
                    더 정확한 개선과 처리가 가능합니다.
                </div>
            </div>

            {/* Content Form */}
            <div className="form-section">
                {/* Type */}
                <div className="form-group">
                    <label className="form-label">제보 유형</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            className={`form-select ${type === '' ? 'placeholder' : ''}`}
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            {/* Hidden disabled option acts as placeholder */}
                            <option value="" disabled hidden>제보 유형을 선택해 주세요.</option>
                            <option value="facility">공공시설 파손</option>
                            <option value="safety">안전 위험</option>
                            <option value="traffic">교통 불편</option>
                        </select>
                        <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#666' }}>
                            <svg width="12" height="12" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 1 6 6 11 1"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="form-group">
                    <label className="form-label">제보 지역</label>
                    <div className="location-row">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="검색 또는 지도에서 선택해 주세요."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                        <button className={`search-btn ${location.length > 0 ? 'active' : ''}`}>
                            검색
                        </button>
                    </div>
                    {/* Map Selector */}
                    <div className="map-selector-wrapper" style={{ marginTop: '12px' }}>
                        <LocationSelector onLocationSelect={handleLocationSelect} />
                    </div>
                </div>

                <div className="section-divider"></div>

                {/* Report Title */}
                <div className="form-group">
                    <label className="form-label">제목</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="제목을 입력해 주세요."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Report Content */}
                <div className="form-group">
                    <label className="form-label">제보 내용</label>
                    <textarea
                        className="form-textarea"
                        placeholder="생활 속 불편 사항이나 개선이 필요한 문제를 제보해주세요."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        maxLength={1600}
                    ></textarea>
                    <div className="char-count">{content.length}/1600</div>
                </div>

                {/* File Upload */}
                <div className="form-group">
                    <label className="form-label">파일 첨부</label>

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        multiple
                        onChange={handleFileChange}
                    />

                    {files.length > 0 && (
                        <div className="file-list">
                            {files.map((file, index) => (
                                <div key={index} className="file-item">
                                    <div className="file-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E6235A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                        </svg>
                                    </div>
                                    <div className="file-name">{file.name}</div>
                                    <button className="file-delete-btn" onClick={() => removeFile(index)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="file-upload-box" onClick={triggerFileUpload}>
                        <div className="upload-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </div>
                        <div className="upload-text">첨부할 파일을 선택해 주세요</div>
                    </div>
                    <div className="upload-info">
                        *사진, 문서 각 30MB, 동영상 각 130MB, 총 합 180MB까지 첨부 가능합니다.
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Button - Unified Design */}
            <footer className="footer-bar">
                <button className="btn-prev" onClick={onBack}>이전</button>
                <button
                    className={`btn-next ${isReady ? 'ready' : ''}`}
                    disabled={!isReady || loading}
                    onClick={handleSubmit}
                >
                    {loading ? '전송 중...' : '제출하기'}
                </button>
            </footer>
        </div>
    );
};

export default ReportForm;
