import React, { useState, useRef } from 'react';
import './SuggestForm.css';
import LocationSelector from './common/LocationSelector';

const SuggestForm = ({ onBack, onSubmit }) => {
    const [location, setLocation] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [improvementPlan, setImprovementPlan] = useState('');
    const [expectedEffect, setExpectedEffect] = useState('');
    const [files, setFiles] = useState([]);

    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);

    const handleLocationSelect = ({ address }) => {
        setLocation(address);
    };

    // Verification state
    const isReady = location.trim().length > 0 &&
        title.trim().length > 0 &&
        description.trim().length > 0 &&
        improvementPlan.trim().length > 0 &&
        expectedEffect.trim().length > 0;
    // Files could be optional for suggestion? Assuming required for consistency unless specified.
    // User said "Based on Report Page", Report requires files. But typical suggestion might not.
    // Let's assume files are optional for suggestion unless user said strictly "same composition".
    // ReportForm check: isReady includes `files.length > 0`. 
    // Let's make files optional for suggestion as it's text heavy? 
    // Or keep it required? 
    // "Page is based on Report Page... composition same".
    // I'll make files optional for now as it makes more sense for "ideas", but keep structure.
    // Actually, let's look at the image. It has "File Upload".
    // Let's keep it optional to reduce friction, or stick to ReportForm logic?
    // ReportForm logic was strict. Let's make it strict if we want "same composition logic", 
    // but usually suggestions are text.
    // I will make files optional for Suggestion.

    const createCompressedPreview = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataUrl);
                };
            };
        });
    };

    const handleFileChange = async (e) => {
        const newFileList = Array.from(e.target.files);
        if (newFileList.length === 0) return;

        // Single file mode: Use the first file selected
        const file = newFileList[0];
        let previewUrl = null;

        if (file.type.startsWith('image/')) {
            previewUrl = await createCompressedPreview(file);
        }

        // Replace existing files with just this one
        setFiles([{
            file,
            preview: previewUrl,
            name: file.name
        }]);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index) => {
        setFiles([]); // Clear all files to show upload box again
    };

    const triggerFileUpload = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async () => {
        if (!isReady) return;
        setLoading(true);

        try {
            const payload = {
                location,
                title,
                description,
                improvement_plan: improvementPlan,
                expected_effect: expectedEffect,
                files: files.map(f => f.file.name)
            };

            const response = await fetch('/api/reports/suggest', {
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
            alert(`제안이 성공적으로 제출되었습니다! (ID: ${data.id})`);

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
        <div className="suggest-form-container">
            {/* Header */}
            <div className="suggest-form-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            {/* Title Section */}
            <div className="suggest-form-title-section">
                <div className="suggest-form-title">제안하기</div>
                <div className="suggest-form-subtitle">
                    개선 아이디어를 공유해 주세요
                </div>
                <div className="suggest-form-desc">
                    도시 서비스 개선에 도움이 될 의견을 자유롭게 작성해 주세요.<br />
                    명확한 설명은 검토에 큰 도움이 됩니다.
                </div>
            </div>

            {/* Content Form */}
            <div className="form-section">

                {/* Location */}
                <div className="form-group">
                    <label className="form-label">제안 지역</label>
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

                {/* Description */}
                <div className="form-group">
                    <textarea
                        className="form-textarea"
                        placeholder="설명해 주세요."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={1300}
                    ></textarea>
                    <div className="char-count">{description.length}/1300</div>
                </div>

                {/* Improvement Plan */}
                <div className="form-group">
                    <label className="form-label">개선 방안</label>
                    <textarea
                        className="form-textarea"
                        placeholder="어떻게 개선되면 좋을지 구체적인 방안을 작성해 주세요."
                        value={improvementPlan}
                        onChange={(e) => setImprovementPlan(e.target.value)}
                        maxLength={1300}
                    ></textarea>
                    <div className="char-count">{improvementPlan.length}/1300</div>
                </div>

                {/* Expected Effect */}
                <div className="form-group">
                    <label className="form-label">기대 효과</label>
                    <textarea
                        className="form-textarea"
                        placeholder="개선 시 기대되는 변화나 시민 혜택을 적어주세요."
                        value={expectedEffect}
                        onChange={(e) => setExpectedEffect(e.target.value)}
                        maxLength={1300}
                    ></textarea>
                    <div className="char-count">{expectedEffect.length}/1300</div>
                </div>

                {/* File Upload */}
                <div className="form-group">
                    <label className="form-label">사진 첨부</label>

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".png, .jpg, .jpeg, .pdf"
                        onChange={handleFileChange}
                    />

                    {/* Conditional Render: Single Large Preview OR Upload Box */}
                    {files.length > 0 ? (
                        <div className="preview-single-large">
                            {files[0].preview ? (
                                <img src={files[0].preview} alt="preview" className="preview-single-img" />
                            ) : (
                                <div className="file-placeholder-large">
                                    <div className="file-icon-large">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E6235A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                    </div>
                                    <span className="file-name-large">{files[0].name}</span>
                                </div>
                            )}
                            <div className="preview-delete-large" onClick={() => removeFile(0)}>
                                ×
                            </div>
                        </div>
                    ) : (
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
                    )}

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

export default SuggestForm;
