/* ProposalForm.jsx */
import React, { useState } from 'react';
import './ProposalForm.css';

const ProposalForm = ({ onBack, onComplete }) => {
    const categories = ['주거', '생활', '교통', '안전', '교육', '산업일자리', '문화여가'];
    const [selectedCategory, setSelectedCategory] = useState('산업일자리');
    const [region, setRegion] = useState('연제구');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]); // Array of { file, preview, type }

    const fileInputRef = React.useRef(null);

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1000;
                    const MAX_HEIGHT = 1000;
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
                    
                    // Compress to JPEG with 0.7 quality
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    }, 'image/jpeg', 0.7);
                };
            };
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        let processedFile = file;
        if (file.type.startsWith('image/')) {
            processedFile = await compressImage(file);
        }
        
        const newFile = {
            file: processedFile,
            preview: URL.createObjectURL(processedFile),
            type: file.type.startsWith('image/') ? 'image' : 'video'
        };

        // Replace existing file
        if (attachedFiles.length > 0) {
            URL.revokeObjectURL(attachedFiles[0].preview);
        }
        setAttachedFiles([newFile]);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index) => {
        setAttachedFiles(prev => {
            URL.revokeObjectURL(prev[0].preview);
            return [];
        });
    };

    const handleSubmit = () => {
        const formData = {
            category: selectedCategory,
            region: region,
            title: title,
            content: content,
            preview: attachedFiles.length > 0 ? attachedFiles[0].preview : null,
            type: attachedFiles.length > 0 ? attachedFiles[0].type : null
        };
        onComplete && onComplete(formData);
    };

    const isFormValid = title.trim() && content.trim() && region.trim();

    return (
        <div className="proposal-form-container">
            {/* Header */}
            <header className="pf-header">
                <span className="pf-header-title">제안하기</span>
            </header>

            {/* Form Body */}
            <div className="pf-body">
                {/* 1. Category */}
                <section className="pf-section">
                    <h2 className="pf-section-title">제안유형</h2>
                    <div className="pf-categories">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`pf-category-pill ${selectedCategory === cat ? 'active' : 'inactive'}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2. Region */}
                <section className="pf-section">
                    <h2 className="pf-section-title">제안 지역</h2>
                    <div className="pf-region-row">
                        <div className="pf-input-wrapper">
                            <input 
                                type="text" 
                                className="pf-input" 
                                value={region} 
                                onChange={(e) => setRegion(e.target.value)}
                                placeholder="제안 지역을 입력해주세요 (예: 부산 연제구)"
                            />
                        </div>
                        <button className="pf-search-btn">검색</button>
                    </div>
                </section>

                {/* 3. Title */}
                <section className="pf-section">
                    <h2 className="pf-section-title">제목</h2>
                    <input 
                        type="text" 
                        className="pf-input" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력해주세요"
                    />
                </section>

                {/* 4. Content */}
                <section className="pf-section">
                    <h2 className="pf-section-title">내용</h2>
                    <textarea 
                        className="pf-textarea" 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="내용을 입력해주세요"
                    />
                </section>

                {/* 5. Attachments */}
                <section className="pf-section">
                    <h2 className="pf-section-title">이미지, 동영상 첨부 (최대 1개)</h2>
                    <div className="pf-upload-area">
                        {attachedFiles.length > 0 ? (
                            <div className="pf-preview-item">
                                {attachedFiles[0].type === 'image' ? (
                                    <img src={attachedFiles[0].preview} className="pf-preview-img" alt="preview" />
                                ) : (
                                    <video src={attachedFiles[0].preview} className="pf-preview-video" controls />
                                )}
                                <button className="pf-remove-preview" onClick={() => removeFile(0)}>×</button>
                            </div>
                        ) : (
                            <div className="pf-upload-box" onClick={() => fileInputRef.current.click()}>
                                <span>+</span>
                                <div className="pf-upload-count">파일 선택</div>
                            </div>
                        )}
                        
                        <input 
                            type="file" 
                            className="pf-hidden-input" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,video/*"
                        />
                    </div>
                </section>
            </div>

            {/* Footer Buttons */}
            <div className="pf-footer">
                <button className="pf-btn-prev" onClick={onBack}>이전</button>
                <button 
                    className="pf-btn-submit" 
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    style={{ opacity: isFormValid ? 1 : 0.5, cursor: isFormValid ? 'pointer' : 'not-allowed' }}
                >
                    제안하기
                </button>
            </div>
        </div>
    );
};

export default ProposalForm;
