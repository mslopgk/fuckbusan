/* ReportPostForm.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { formatDraftDate } from '../utils/format';
import './ReportPostForm.css';
import LocationSelector from './common/LocationSelector';

const LOCATIONS = ['거리', '골목쓰레기통', '공원하수구', '공공장소'];
const ISSUES = ['미끄러워요', '파손됐어요', '안전조치가 부족해요', '위험이 있어요'];

const ReportPostForm = ({ onBack, onNavigate, isEdit, initialData, onComplete }) => {
    const categories = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

    const [selectedCategory, setSelectedCategory] = useState('주거');
    const [region, setRegion] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedIssue, setSelectedIssue] = useState('');
    const [detail, setDetail] = useState('');
    const [photos, setPhotos] = useState([]); 
    const [showMap, setShowMap] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [mapInitialLocation, setMapInitialLocation] = useState(null);
    const [tempRegion, setTempRegion] = useState(''); 
    const [detailedAddress, setDetailedAddress] = useState(''); 

    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [tempLocation, setTempLocation] = useState('');
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [tempIssue, setTempIssue] = useState('');
    
    // Draft States
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedDraftData, setSavedDraftData] = useState(null);

    const fileInputRef = useRef(null);

    // Initial Data Load (Edit Mode)
    useEffect(() => {
        if (isEdit && initialData) {
            setSelectedCategory(initialData.category || '주거');
            setRegion(initialData.location || '');
            setDetailedAddress(initialData.detailed_address || '');
            setSelectedLocation(initialData.sub_category || '');
            setSelectedIssue(initialData.issue || '');
            setDetail(initialData.content || '');
            if (initialData.image) {
                setPhotos([initialData.image]);
            }
        }
    }, [isEdit, initialData]);

    // Load Draft effect
    useEffect(() => {
        if (isEdit) return; // Don't show draft modal in edit mode
        const savedData = localStorage.getItem('report_draft');
        if (savedData) {
            try {
                setSavedDraftData(JSON.parse(savedData));
                setShowLoadModal(true);
            } catch (e) {
                console.error("Draft parse error:", e);
            }
        }
    }, [isEdit]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhotos(prev => [...prev, event.target.result]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const isFormValid = region && selectedLocation && (isEdit ? true : detail && photos.length > 0);

    const handleSearchLocation = async () => {
        if (!searchInput.trim()) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setMapInitialLocation(newPos);
                setTempRegion(display_name); 
                setRefreshKey(prev => prev + 1);
            } else {
                alert('검색 결과가 없습니다.');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('검색 중 오류가 발생했습니다.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchLocation();
        }
    };

    // Draft Handlers
    const handleSaveDraft = () => {
        const draftData = {
            category: selectedCategory,
            region: region,
            detailedAddress: detailedAddress,
            location: selectedLocation,
            issue: selectedIssue,
            detail: detail,
            photos: photos, 
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('report_draft', JSON.stringify(draftData));
        setShowDraftModal(false);
        alert("임시저장 되었습니다.");
    };

    const handleLoadDraft = () => {
        if (savedDraftData) {
            setSelectedCategory(savedDraftData.category || '주거');
            setRegion(savedDraftData.region || '');
            setDetailedAddress(savedDraftData.detailedAddress || '');
            setSelectedLocation(savedDraftData.location || '');
            setSelectedIssue(savedDraftData.issue || '');
            setDetail(savedDraftData.detail || '');
            setPhotos(savedDraftData.photos || []);
        }
        setShowLoadModal(false);
    };

    const handleClearDraft = () => {
        localStorage.removeItem('report_draft');
        setSavedDraftData(null);
        setShowLoadModal(false);
    };

    const handleSubmit = () => {
        if (!isFormValid) return;
        
        const resultData = {
            category: selectedCategory,
            location: region,
            sub_category: selectedLocation,
            issue: selectedIssue,
            content: detail,
            image: photos[0],
            detailed_address: detailedAddress
        };

        if (onComplete) {
            onComplete(resultData);
        } else {
            onNavigate('reportDone');
        }
    };

    return (
        <div className="report-post-container">
            {/* Header */}
            <div className="report-post-header">
                <div className="report-post-header-left">
                    <button className="report-post-back" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="15" y1="18" x2="9" y2="12"></line>
                            <line x1="9" y1="12" x2="15" y2="6"></line>
                        </svg>
                    </button>
                    <span className="report-post-header-title">{isEdit ? '상세페이지로' : '홈으로'}</span>
                </div>
            </div>

            <h1 className="report-post-main-title">
                {isEdit ? (
                    <>문제 상황이 잘 보이도록<br />사진을 수정해 주세요</>
                ) : (
                    <>문제 상황이 잘 보이도록<br />사진을 등록해 주세요</>
                )}
            </h1>

            {/* Photo Section */}
            <section className="report-post-section">
                <h2 className="report-post-section-title">사진 등록</h2>
                <div className="report-post-photo-container">
                    {photos.length === 0 ? (
                        <div className="report-post-photo-box" onClick={() => setShowPhotoModal(true)}>
                            <img src="/camera.svg" alt="camera" />
                        </div>
                    ) : (
                        <>
                            {photos.map((p, index) => (
                                <div key={index} className="report-post-photo-box">
                                    <img src={p} className="report-post-photo-preview" alt={`preview-${index}`} />
                                    <button className="rp-photo-remove-btn" onClick={() => removePhoto(index)}>✕</button>
                                </div>
                            ))}
                            <div className="report-post-photo-add" onClick={() => setShowPhotoModal(true)}>
                                +
                            </div>
                        </>
                    )}
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="report-post-hidden-input" 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={(e) => {
                        handleFileChange(e);
                        setShowPhotoModal(false);
                    }} 
                />
            </section>

            {/* Location Section */}
            <section className="report-post-section">
                <h2 className="report-post-section-title">위치정보</h2>
                <div className="report-post-location-box" onClick={() => {
                    setTempRegion(region); 
                    setShowMap(true);
                }}>
                    <span className={`report-post-location-text ${region ? 'selected' : ''}`}>
                        {region || '지도로 위치 설정하기'}
                    </span>
                    <div className="report-post-location-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                           <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                        </svg>
                    </div>
                </div>
                {(region || isEdit) && (
                    <input 
                        type="text" 
                        className="report-post-detail-address"
                        placeholder="건물명, 동/호수 등의 상세주소 입력"
                        value={detailedAddress}
                        onChange={(e) => setDetailedAddress(e.target.value)}
                        style={{ border: isEdit ? '1px solid #E6235A' : '' }}
                    />
                )}
            </section>

            {/* Detail Section */}
            <section className="report-post-section">
                <h2 className="report-post-section-title">우리동네 불편사항을 제보해주세요</h2>
                <div className="report-post-tags">
                    {categories.map(cat => (
                        <div 
                            key={cat} 
                            className={`report-post-tag ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </div>
                    ))}
                </div>

                <div className="report-post-form-row">
                    <div className="report-post-select-wrapper">
                        <div 
                            className={`rp-custom-select ${selectedLocation ? 'selected' : ''}`}
                            onClick={() => {
                                setTempLocation(selectedLocation);
                                setIsLocationModalOpen(true);
                            }}
                        >
                            <span>{selectedLocation || '공공/시설물'}</span>
                            <div className="report-post-select-arrow">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <span className="report-post-row-label">에</span>
                </div>

                <div className="report-post-form-row">
                    <div className="report-post-select-wrapper">
                        <div 
                            className={`rp-custom-select ${selectedIssue ? 'selected' : ''}`}
                            onClick={() => {
                                setTempIssue(selectedIssue);
                                setIsIssueModalOpen(true);
                            }}
                        >
                            <span>{selectedIssue || '문제사항'}</span>
                            <div className="report-post-select-arrow">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <span className="report-post-row-label">불편해요</span>
                </div>

                <textarea 
                    className="report-post-textarea"
                    placeholder="상세설명을 작성해주세요"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                />
            </section>

            {/* Footer */}
            <div className="report-post-footer">
                {!isEdit && <button className="report-post-btn-draft" onClick={() => setShowDraftModal(true)}>임시저장</button>}
                <button 
                    className={`report-post-btn-submit ${isEdit ? 'edit-mode' : ''}`}
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    style={{ width: isEdit ? '100%' : '' }}
                >
                    {isEdit ? '수정완료' : '작성완료'}
                </button>
            </div>

            {/* Map Modal */}
            {showMap && (
                <div className="rp-map-modal">
                    <header className="rp-map-header">
                        <div className="rp-map-close-row">
                            <button className="rp-map-close" onClick={() => setShowMap(false)}>✕</button>
                        </div>
                        <h2 className="rp-map-title">장소를<br />선택해주세요</h2>
                        <div className="rp-map-search-container">
                            <div className="rp-map-search-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                className="rp-map-search-input" 
                                placeholder="주소를 입력해서 검색해보세요"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            {searchInput && (
                                <button className="rp-map-search-clear" onClick={() => setSearchInput('')}>✕</button>
                            )}
                        </div>
                    </header>
                    <div className="rp-map-content">
                        <LocationSelector 
                            onLocationSelect={(data) => setTempRegion(data.address)}
                            initialLocation={mapInitialLocation}
                            refreshKey={refreshKey}
                        />
                        <div className="rp-map-instr-overlay">
                            지도를 움직여서 선택해보세요
                        </div>
                        <button 
                            className="rp-current-loc-btn" 
                            onClick={() => {
                                setMapInitialLocation(null);
                                setRefreshKey(prev => prev + 1);
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="#E6235A">
                                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                            </svg>
                        </button>
                    </div>
                    <footer className="rp-map-footer">
                        <button className="rp-map-done-btn" onClick={() => {
                            setRegion(tempRegion); 
                            setShowMap(false);
                        }}>위치 선택완료</button>
                    </footer>
                </div>
            )}
            {/* Photo Selection Modal */}
            {showPhotoModal && (
                <div className="rp-photo-modal-overlay" onClick={() => setShowPhotoModal(false)}>
                    <div className="rp-photo-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="rp-photo-option-btn" onClick={() => fileInputRef.current.click()}>
                            <img src="/gallery.svg" alt="갤러리" className="rp-photo-option-icon" />
                            <span className="rp-photo-option-label">갤러리</span>
                        </button>
                        <button className="rp-photo-option-btn" onClick={() => fileInputRef.current.click()}>
                            <img src="/camera.svg" alt="촬영" className="rp-photo-option-icon" />
                            <span className="rp-photo-option-label">촬영</span>
                        </button>
                    </div>
                </div>
            )}
            {/* Location Selection Modal (Common/Facilities) */}
            {isLocationModalOpen && (
                <div className="rp-modal-overlay" onClick={() => setIsLocationModalOpen(false)}>
                    <div className="rp-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="rp-modal-header">
                            <h3 className="rp-modal-title">공공/시설물</h3>
                            <button className="rp-modal-close" onClick={() => setIsLocationModalOpen(false)}>✕</button>
                        </div>
                        <div className="rp-modal-content">
                            <div className="rp-modal-list">
                                {LOCATIONS.map((loc) => (
                                    <div key={loc} className={`rp-modal-item ${tempLocation === loc ? 'selected' : ''}`} onClick={() => setTempLocation(loc)}>
                                        <div className="rp-modal-indicator">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="6 10 12 16 18 10"></polyline>
                                            </svg>
                                        </div>
                                        <span className="rp-modal-name">{loc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rp-modal-footer">
                            <button className="rp-modal-select-btn" onClick={() => {
                                setSelectedLocation(tempLocation);
                                setIsLocationModalOpen(false);
                            }}>선택</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Issue Selection Modal */}
            {isIssueModalOpen && (
                <div className="rp-modal-overlay" onClick={() => setIsIssueModalOpen(false)}>
                    <div className="rp-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="rp-modal-header">
                            <h3 className="rp-modal-title">문제사항</h3>
                            <button className="rp-modal-close" onClick={() => setIsIssueModalOpen(false)}>✕</button>
                        </div>
                        <div className="rp-modal-content">
                            <div className="rp-modal-list">
                                {ISSUES.map((iss) => (
                                    <div key={iss} className={`rp-modal-item ${tempIssue === iss ? 'selected' : ''}`} onClick={() => setTempIssue(iss)}>
                                        <div className="rp-modal-indicator">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="6 10 12 16 18 10"></polyline>
                                            </svg>
                                        </div>
                                        <span className="rp-modal-name">{iss}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rp-modal-footer">
                            <button className="rp-modal-select-btn" onClick={() => {
                                setSelectedIssue(tempIssue);
                                setIsIssueModalOpen(false);
                            }}>선택</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Draft Confirm Modal */}
            {showDraftModal && (
                <div className="rp-modal-overlay" onClick={() => setShowDraftModal(false)}>
                    <div className="rp-draft-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="rp-draft-icon">
                            <img src="/save2.png" alt="Draft" style={{ width: '64px' }} />
                        </div>
                        <h2 className="rp-draft-text">작성 중인 제보글을<br/>저장할까요?</h2>
                        <div className="rp-draft-btns">
                            <button className="rp-btn-confirm" onClick={handleSaveDraft}>저장하기</button>
                            <button className="rp-btn-cancel" onClick={() => setShowDraftModal(false)}>저장안함</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Draft Load Modal */}
            {showLoadModal && (
                <div className="rp-modal-overlay">
                    <div className="rp-load-modal">
                        <div className="rp-load-icon">
                            <img src="/papertext.png" alt="Load" style={{ width: '64px' }} />
                        </div>
                        <h2 className="rp-load-text">임시저장된 내용을<br/>불러올까요?</h2>
                        <p className="rp-load-subtext">
                            {savedDraftData?.savedAt ? formatDraftDate(savedDraftData.savedAt) : ""}
                        </p>
                        <div className="rp-load-btns">
                            <button className="rp-btn-load" onClick={handleLoadDraft}>불러오기</button>
                            <button className="rp-btn-new" onClick={handleClearDraft}>새로 작성하기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportPostForm;
