/* ProposalForm.jsx */
import React, { useState, useEffect } from 'react';
import './ProposalForm.css';
import LocationSelector from './common/LocationSelector';

const ProposalForm = ({ onBack, onComplete, onNavigate, isEdit = false, initialData = null }) => {
    const categories = ['주거', '환경', '교육', '안전', '산업 및 고용', '모빌리티', '문화 및 레저', '보건 및 복지'];
    
    // 초기값 설정 (수정 모드일 경우 initialData 사용)
    const [selectedCategory, setSelectedCategory] = useState(initialData?.category || '주거');
    const [region, setRegion] = useState(initialData?.region || '');
    const [detailedAddress, setDetailedAddress] = useState(initialData?.detailed_address || initialData?.detailedAddress || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || initialData?.description || '');
    
    // 기존 파일(이미지) 처리
    const [attachedFiles, setAttachedFiles] = useState([]); // Array of { file, preview, type, isExisting }
    const [showMap, setShowMap] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedDraftData, setSavedDraftData] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const fileInputRef = React.useRef(null);

    // 수정 모드 시 기존 이미지 로드
    useEffect(() => {
        if (isEdit && initialData && initialData.files) {
            const VITE_API_URL = import.meta.env.VITE_API_URL || "https://ke7eh3ev2j33nj76skhv6n2tom0yzwim.lambda-url.ap-northeast-2.on.aws";
            const existingFiles = initialData.files.map(filename => {
                const url = filename.startsWith('http') ? filename : `${VITE_API_URL}/uploads/${filename}`;
                return {
                    file: null, // 기존 파일은 File 객체 없음
                    preview: url,
                    type: 'image',
                    isExisting: true,
                    filename: filename
                };
            });
            setAttachedFiles(existingFiles);
        } else if (!isEdit) {
            // [추가] 일반 작성 모드일 때 임시저장된 데이터가 있는지 확인
            const savedData = localStorage.getItem('proposal_draft');
            if (savedData) {
                try {
                    setSavedDraftData(JSON.parse(savedData));
                    setShowLoadModal(true);
                } catch (e) {
                    console.error("Draft parse error:", e);
                }
            }
        }
    }, [isEdit, initialData]);

    // [추가] 임시저장 실행
    const handleSaveDraft = () => {
        const draftData = {
            category: selectedCategory,
            region: region,
            detailed_address: detailedAddress,
            title: title,
            content: content,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('proposal_draft', JSON.stringify(draftData));
        setShowDraftModal(false);
        alert("임시저장 되었습니다.");
    };

    // [추가] 임시저장 불러오기 실행
    const handleLoadDraft = () => {
        if (savedDraftData) {
            setSelectedCategory(savedDraftData.category || '주거');
            setRegion(savedDraftData.region || '');
            setDetailedAddress(savedDraftData.detailed_address || '');
            setTitle(savedDraftData.title || '');
            setContent(savedDraftData.content || '');
        }
        setShowLoadModal(false);
    };

    // [추가] 임시저장 삭제 (새로 작성 선택 시)
    const handleClearDraft = () => {
        localStorage.removeItem('proposal_draft');
        setShowLoadModal(false);
    };

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
                type: file.type.startsWith('image/') ? 'image' : 'video',
                isExisting: false
            };
        }));

        setAttachedFiles(prev => [...prev, ...newFiles]);
        if (e.target) e.target.value = '';
    };

    const removeFile = (index) => {
        setAttachedFiles(prev => {
            const newArr = [...prev];
            if (!newArr[index].isExisting) {
                URL.revokeObjectURL(newArr[index].preview);
            }
            newArr.splice(index, 1);
            return newArr;
        });
    };

    const handleSubmit = async () => {
        // 기존 파일명 유지 + 신규 파일 서버 업로드 준비
        const existingFilenames = attachedFiles
            .filter(f => f.isExisting)
            .map(f => f.filename);
        
        const newFilesToUpload = attachedFiles
            .filter(f => !f.isExisting)
            .map(f => f.file);

        // API 전송 데이터 구성
        const formData = {
            id: initialData?.id,
            category: selectedCategory,
            region: region,
            detailed_address: detailedAddress,
            title: title,
            content: content,
            existingFiles: existingFilenames,
            newFiles: newFilesToUpload,
            isEdit: isEdit
        };
        
        onComplete && onComplete(formData);
    };

    const isFormValid = title.trim() && content.trim() && region.trim();

    return (
        <div className="proposal-form-container">
            {/* Header */}
            <header className="pf-header">
                <div className="pf-header-left">
                    <button className="pf-back-btn" onClick={onBack}>
                        {isEdit ? (
                            <span style={{ fontSize: '24px', color: '#333' }}>✕</span>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="15" y1="18" x2="9" y2="12"></line>
                                <line x1="9" y1="12" x2="15" y2="6"></line>
                            </svg>
                        )}
                    </button>
                    <span className="pf-header-title">{isEdit ? '제안글 수정' : '제안 현황'}</span>
                </div>
                {!isEdit && (
                    <button className="pf-my-status" onClick={() => onNavigate && onNavigate('myProposals')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                        나의 제안현황
                    </button>
                )}
            </header>

            <div className="pf-body">
                {!isEdit && <div className="pf-main-title">불편한 사항들을<br />제안해보세요</div>}

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

                <section className="pf-section" style={{ marginTop: isEdit ? '10px' : '30px' }}>
                    <h2 className="pf-section-title">제목</h2>
                    <input type="text" className="pf-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력해주세요" />
                </section>

                <section className="pf-section">
                    <h2 className="pf-section-title">자세한 설명</h2>
                    <textarea 
                        className="pf-textarea" 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                        placeholder="우리동네 현황 및 문제점, 개선방안, 기대효과 등을 자세히 작성해주세요." 
                        style={{ height: isEdit ? '200px' : '150px' }}
                    />
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
                        <input type="text" className="pf-input pf-detail-address-input" value={detailedAddress} onChange={(e) => setDetailedAddress(e.target.value)} placeholder="건물명, 동/호수 등의 상세주소 입력" />
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
                    <input type="file" ref={fileInputRef} className="pf-hidden-input" multiple accept="image/*,video/*" onChange={handleFileChange} />
                </section>
            </div>

            <div className="pf-footer">
                {!isEdit && <button className="pf-btn-draft" onClick={() => setShowDraftModal(true)}>임시저장</button>}
                <button 
                    className={`pf-btn-submit ${isEdit ? 'edit-mode' : ''}`} 
                    onClick={handleSubmit} 
                    disabled={!isFormValid}
                    style={{ width: isEdit ? '100%' : 'auto' }}
                >
                    {isEdit ? '수정완료' : '작성완료'}
                </button>
            </div>

            {/* Map Modal */}
            {showMap && (
                <div className="pf-map-modal">
                    <header className="pf-map-header">
                        <button className="pf-map-close" onClick={() => setShowMap(false)}>✕</button>
                        <h2 className="pf-map-title">장소를 선택해주세요</h2>
                    </header>
                    <div className="pf-map-content">
                        <div className="pf-map-wrapper">
                            <LocationSelector 
                                onLocationSelect={(data) => setRegion(data.address)}
                                refreshKey={refreshKey}
                            />
                        </div>
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
            {/* [추가] 임시저장 확인 모달 */}
            {showDraftModal && (
                <div className="pf-modal-overlay" onClick={() => setShowDraftModal(false)}>
                    <div className="pf-draft-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pf-draft-icon">
                            <img src="/save_draft_icon.svg" alt="Draft" style={{ width: '60px' }} />
                        </div>
                        <h2 className="pf-draft-text">작성 중인 제안글을<br/>저장할까요?</h2>
                        <div className="pf-draft-btns">
                            <button className="pf-btn-save-confirm" onClick={handleSaveDraft}>저장하기</button>
                            <button className="pf-btn-save-cancel" onClick={() => setShowDraftModal(false)}>저장안함</button>
                        </div>
                    </div>
                </div>
            )}

            {/* [추가] 초안 불러오기 모달 */}
            {showLoadModal && !isEdit && (
                <div className="pf-modal-overlay">
                    <div className="pf-load-modal">
                        <div className="pf-load-icon">
                            <img src="/save_draft_icon.svg" alt="Load" style={{ width: '60px' }} />
                        </div>
                        <h2 className="pf-load-text">이전에 작성하던<br/>내용이 있습니다</h2>
                        <p className="pf-load-subtext">이어서 작성하시겠습니까?</p>
                        <div className="pf-load-btns">
                            <button className="pf-btn-load" onClick={handleLoadDraft}>불러오기</button>
                            <button className="pf-btn-new" onClick={handleClearDraft}>새로 작성</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProposalForm;
