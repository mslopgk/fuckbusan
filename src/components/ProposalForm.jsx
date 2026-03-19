/* ProposalForm.jsx */
import React, { useState } from 'react';
import './ProposalForm.css';
import LocationSelector from './common/LocationSelector';

const ProposalForm = ({ onBack, onComplete, onNavigate }) => {
    const categories = ['주거', '환경', '교육', '안전', '산업 및 고용', '모빌리티', '문화 및 레저', '보건 및 복지'];
    const [selectedCategory, setSelectedCategory] = useState('주거');
    const [region, setRegion] = useState('');
    const [detailedAddress, setDetailedAddress] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]); // Array of { file, preview, type }
    const [showMap, setShowMap] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedDraftData, setSavedDraftData] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

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
                    
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    }, 'image/jpeg', 0.7);
                };
            };
        });
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newFiles = await Promise.all(files.map(async (file) => {
            let processedFile = file;
            if (file.type.startsWith('image/')) {
                processedFile = await compressImage(file);
            }
            return {
                file: processedFile,
                preview: URL.createObjectURL(processedFile),
                type: file.type.startsWith('image/') ? 'image' : 'video'
            };
        }));

        setAttachedFiles(prev => [...prev, ...newFiles]);
        if (e.target) e.target.value = '';
    };

    const removeFile = (index) => {
        setAttachedFiles(prev => {
            const newArr = [...prev];
            URL.revokeObjectURL(newArr[index].preview);
            newArr.splice(index, 1);
            return newArr;
        });
    };

    const handleSubmit = () => {
        const formData = {
            category: selectedCategory,
            region: region,
            detailedAddress: detailedAddress,
            title: title,
            content: content,
            previews: attachedFiles.map(f => f.preview),
            files: attachedFiles.map(f => f.file),
            attachedFilesData: attachedFiles // For previewing elsewhere if needed
        };
        onComplete && onComplete(formData);
    };

    const isFormValid = title.trim() && content.trim() && region.trim();

    const getDraftKey = () => `proposal_draft_${localStorage.getItem('user_name') || 'guest'}`;

    // Check for draft on mount
    React.useEffect(() => {
        const savedDraft = localStorage.getItem(getDraftKey());
        const userSuffix = localStorage.getItem('user_name') || 'guest';
        const isDeclined = sessionStorage.getItem(`declined_load_${userSuffix}`);

        if (savedDraft && isDeclined !== 'true') {
            try {
                const parsed = JSON.parse(savedDraft);
                setSavedDraftData(parsed);
                setShowLoadModal(true);
            } catch (e) {
                console.error("Failed to check draft:", e);
            }
        }
    }, []);

    const handleSaveDraft = () => {
        const now = new Date();
        const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
        const draftData = {
            category: selectedCategory,
            region: region,
            detailedAddress: detailedAddress,
            title: title,
            content: content,
            savedAt: dateStr
        };
        localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
        
        // Clear the declined flag since we have a NEW draft to prompt about next time
        const userSuffix = localStorage.getItem('user_name') || 'guest';
        sessionStorage.removeItem(`declined_load_${userSuffix}`);
        
        setShowDraftModal(false);
    };

    const handleLoadDraft = () => {
        if (savedDraftData) {
            setSelectedCategory(savedDraftData.category || '주거');
            setRegion(savedDraftData.region || '');
            setDetailedAddress(savedDraftData.detailedAddress || '');
            setTitle(savedDraftData.title || '');
            setContent(savedDraftData.content || '');
        }
        setShowLoadModal(false);
    };

    const handleDiscardDraft = () => {
        setShowDraftModal(false);
    };

    const handleSkipLoad = () => {
        // Remember that we declined this draft for the current session
        const userSuffix = localStorage.getItem('user_name') || 'guest';
        sessionStorage.setItem(`declined_load_${userSuffix}`, 'true');
        setShowLoadModal(false);
    };

    return (
        <div className="proposal-form-container">
            {/* Load Draft Modal */}
            {showLoadModal && (
                <div className="pf-modal-overlay">
                    <div className="pf-load-modal">
                        <div className="pf-load-icon">
                            <img src="/file.svg" alt="file icon" width="60" height="75" />
                        </div>
                        <h2 className="pf-load-text">임시 저장된 내용을 불러올까요?</h2>
                        <p className="pf-load-subtext">· {savedDraftData?.savedAt || '최근'} 작성됨</p>
                        <div className="pf-load-btns">
                            <button className="pf-btn-load" onClick={handleLoadDraft}>불러오기</button>
                            <button className="pf-btn-new" onClick={handleSkipLoad}>새로 작성하기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Modal */}
            {showMap && (
                <div className="pf-map-modal">
                    <header className="pf-map-header">
                        <button className="pf-map-close" onClick={() => setShowMap(false)}>✕</button>
                        <h2 className="pf-map-title">
                            우리동네 공공디자인을<br />
                            제안하고 싶은 장소를 선택해주세요.
                        </h2>
                    </header>
                    <div className="pf-map-content">
                        <div className="pf-map-wrapper">
                            <LocationSelector 
                                onLocationSelect={(data) => setRegion(data.address)}
                                refreshKey={refreshKey}
                            />
                        </div>
                        <div className="pf-map-floating-label">지도를 움직여서 선택해보세요</div>
                        <button className="pf-current-loc-btn" onClick={() => setRefreshKey(prev => prev + 1)}>
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="#16B5B0">
                                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                            </svg>
                        </button>
                    </div>
                    <footer className="pf-map-footer">
                        <button className="pf-map-done-btn" onClick={() => setShowMap(false)}>위치 선택완료</button>
                    </footer>
                </div>
            )}

            {/* Draft Confirmation Modal */}
            {showDraftModal && (
                <div className="pf-modal-overlay" onClick={() => setShowDraftModal(false)}>
                    <div className="pf-draft-modal" onClick={e => e.stopPropagation()}>
                        <div className="pf-draft-icon">
                            <img src="/save_draft_icon.svg" alt="save draft" width="80" height="80" />
                        </div>
                        <h2 className="pf-draft-text">작성중인 제안글을 저장할까요?</h2>
                        <div className="pf-draft-btns">
                            <button className="pf-btn-save-confirm" onClick={handleSaveDraft}>저장하기</button>
                            <button className="pf-btn-save-cancel" onClick={handleDiscardDraft}>저장안함</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="pf-header">
                <div className="pf-header-left">
                    <button className="pf-back-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="15" y1="18" x2="9" y2="12"></line>
                            <line x1="9" y1="12" x2="15" y2="6"></line>
                        </svg>
                    </button>
                    <span className="pf-header-title">제안 현황</span>
                </div>
                <button className="pf-my-status" onClick={() => onNavigate && onNavigate('myProposals')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                    나의 제안현황
                </button>
            </header>

            <div className="pf-body">
                <div className="pf-main-title">불편한 사항들을<br />제안해보세요</div>

                <section className="pf-section">
                    <h2 className="pf-section-title">제안 유형은 무엇인가요?</h2>
                    <div className="pf-category-grid">
                        {categories.map((cat) => (
                            <div key={cat} className={`pf-category-item ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                                <div className="pf-category-icon">
                                    {selectedCategory === cat && (
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                        </svg>
                                    )}
                                </div>
                                <span className="pf-category-name">{cat}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="pf-section">
                    <h2 className="pf-section-title">제목</h2>
                    <input type="text" className="pf-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력해주세요" />
                </section>

                <section className="pf-section">
                    <h2 className="pf-section-title">자세한 설명</h2>
                    <textarea className="pf-textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="우리동네 현황 및 문제점, 개선방안, 기대효과 등을 자세히 작성해주세요." />
                </section>

                <section className="pf-section">
                    <h2 className="pf-section-title">위치정보</h2>
                    <div className="pf-location-group">
                        <div className="pf-location-input-wrapper" onClick={() => setShowMap(true)}>
                            <input type="text" className="pf-input pf-location-input" value={region} readOnly placeholder="지도로 위치 설정하기" />
                            <div className="pf-location-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="2" fill="currentColor" />
                                    <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" />
                                    <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" /><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </div>
                        </div>
                        {region && <input type="text" className="pf-input pf-detail-address-input" value={detailedAddress} onChange={(e) => setDetailedAddress(e.target.value)} placeholder="건물명, 동/호수 등의 상세주소 입력" />}
                    </div>
                </section>

                <section className="pf-section">
                    <h2 className="pf-section-title">첨부자료 (선택)</h2>
                    <div className="pf-upload-container">
                        {attachedFiles.map((img, idx) => (
                            <div key={idx} className="pf-upload-box">
                                <div className="pf-preview-container">
                                    <img src={img.preview} className="pf-preview-content" alt="preview" />
                                    <button className="pf-remove-btn" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}>×</button>
                                </div>
                            </div>
                        ))}
                        <div className="pf-upload-box" onClick={() => fileInputRef.current.click()}>
                            <span className="pf-upload-plus">+</span>
                        </div>
                    </div>
                    <span className="pf-upload-help">* 사진 또는 동영상 첨부해주세요</span>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="pf-hidden-input" 
                        multiple 
                        accept="image/*,video/*" 
                        onChange={handleFileChange} 
                    />
                </section>
            </div>

            <div className="pf-footer">
                <button className="pf-btn-draft" onClick={() => setShowDraftModal(true)}>임시저장</button>
                <button className="pf-btn-submit" onClick={handleSubmit} disabled={!isFormValid}>작성완료</button>
            </div>
        </div>
    );
};

export default ProposalForm;
