import React, { useState, useRef } from 'react';
import './DiagnosisStep1.css';

const DiagnosisStep1 = ({ onBack, onNext, color = '#E6235A', progressBarColor }) => {
    const [files, setFiles] = useState([]); // Technically array but max length 1
    const fileInputRef = useRef(null);

    const handleBoxClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const createCompressedPreview = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Resize for thumbnail - use larger size for single view
                    const MAX_WIDTH = 800; // Increased for better single view quality
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

                    // Compress quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataUrl);
                };
            };
        });
    };

    const handleFileChange = async (e) => {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length === 0) return;

        // Only take the first file
        const file = newFiles[0];
        let previewUrl = null;

        // Generate preview only if it is an image
        if (file.type.startsWith('image/')) {
            previewUrl = await createCompressedPreview(file);
        }

        // Replace existing files with just this one
        setFiles([{
            original: file,
            preview: previewUrl,
            name: file.name,
            type: file.type
        }]);

        // Reset input
        e.target.value = '';
    };

    const removeFile = () => {
        setFiles([]); // Clear files to show upload box again
    };

    return (
        <div className="diagnosis-step-container">
            {/* Header */}
            <div className="step-header">
                <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="step-content">
                <div className="step-top-section">
                    <div className="step-main-title" style={{ color: color }}>진단하기</div>
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ backgroundColor: progressBarColor || color }}></div>
                    </div>
                </div>

                <div className="step-title">1) 사진 등록</div>
                <div className="step-description">
                    진단 할 공간의 사진을 촬영하여 첨부한 후,<br />
                    진단할 시설물 사진이 맞는지 확인해 주세요.<br />
                    *적합하지 않은 사진 등록 시 삭제될 수 있습니다.
                </div>

                <div className="photo-upload-label">사진 첨부</div>

                {/* Single Large Preview OR Upload Box */}
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
                        <div className="preview-delete-large" onClick={removeFile}>
                            ×
                        </div>
                    </div>
                ) : (
                    <div className="photo-upload-box" onClick={handleBoxClick}>
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        <div className="upload-placeholder-text">사진 촬영 또는 첨부할 파일을 선택해 주세요</div>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".png, .jpg, .jpeg, .pdf"
                    onChange={handleFileChange}
                />

                <div className="upload-note">
                    *사진, 문서 각 30MB, 동영상 각 130MB, 총 합 180MB까지 첨부 가능합니다.
                </div>
            </div>

            {/* Footer */}
            <footer className="sticky-footer">
                <button
                    className={`btn btn-next ${files.length > 0 ? 'active' : ''}`}
                    disabled={files.length === 0}
                    onClick={() => onNext && onNext()}
                    style={files.length > 0 ? { backgroundColor: color } : {}}
                >
                    다음
                </button>
            </footer>
        </div>
    );
};

export default DiagnosisStep1;
