import React, { useState, useRef, useEffect } from 'react';
import './ExpertDiagnosisDetail.css';

const ExpertDiagnosisDetail = ({ type, data, onBack, onHome, onDetailFacility, onDetailZone, onDetailPerson }) => {
    // type: 'facility', 'zone', 'person'
    const isFacility = type === 'facility';
    const isZone = type === 'zone';
    const isPerson = type === 'person';

    // Force full width layout
    useEffect(() => {
        document.body.classList.add('layout-full-width');
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    let themeClass = '';
    let mainTitle = '';
    let themeColor = '';
    let subTitlePart = '';

    // Color code and Title setup
    // Notes: Following IMAGE color scheme.
    if (isFacility) {
        themeClass = 'theme-pink';
        mainTitle = '시설물별 세부 정보';
        themeColor = '#E6235A';
        subTitlePart = '시설물별';
    } else if (isZone) {
        themeClass = 'theme-blue';
        mainTitle = '구역별 세부 정보';
        themeColor = '#2196F3';
        subTitlePart = '구역별';
    } else if (isPerson) {
        themeClass = 'theme-green'; // Using Green as per image logic even if text said person
        mainTitle = '인원별 세부 정보';
        // Note: Image 3 shows GREEN title "인원별 세부 정보"
        themeColor = '#009688';
        subTitlePart = '인원별';
    }

    // Data parsing
    const bigCategories = data ? ['전체(All)', ...Object.keys(data)] : ['전체(All)'];

    // State
    const [selectedBig, setSelectedBig] = useState('전체(All)');
    const [selectedSub, setSelectedSub] = useState(null);
    const [isBigDropdownOpen, setIsBigDropdownOpen] = useState(false);
    const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
    const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('부산 부산진구 초연로 6');
    const addresses = ['부산 부산진구 초연로 6', '부산 부산진구 중앙대로 1', '부산 해운대구 해운대로 100'];
    const sliderRef = useRef(null);

    // Filter Sub Categories
    const subCategories = (selectedBig !== '전체(All)' && data && data[selectedBig])
        ? Object.keys(data[selectedBig])
        : [];

    // Scroll slider active item to center
    useEffect(() => {
        if (selectedSub && sliderRef.current) {
            const activeEl = sliderRef.current.querySelector('.cat-chip.active');
            if (activeEl) {
                const container = sliderRef.current;
                const scrollLeft = activeEl.offsetLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [selectedSub]);

    // Handlers
    const handleBigClick = (big) => {
        setSelectedBig(big);
        setSelectedSub(null);
        setIsBigDropdownOpen(false);
    };

    const handleSubClick = (cat) => {
        setSelectedSub(cat);
    };

    const handlePrevSub = () => {
        if (!selectedSub || subCategories.length === 0) return;
        const currentIndex = subCategories.indexOf(selectedSub);
        const prevIndex = (currentIndex - 1 + subCategories.length) % subCategories.length;
        setSelectedSub(subCategories[prevIndex]);
    };

    const handleNextSub = () => {
        if (!selectedSub || subCategories.length === 0) return;
        const currentIndex = subCategories.indexOf(selectedSub);
        const nextIndex = (currentIndex + 1) % subCategories.length;
        setSelectedSub(subCategories[nextIndex]);
    };

    return (
        <div className={`expert-detail-container ${themeClass}`}>

            {/* Header */}
            <div className="result-header">
                <button className="icon-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'Pretendard Variable, sans-serif' }}>전문가 진단 결과</div>
                <button className="icon-btn" onClick={onHome}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </button>
            </div>

            {/* Page Title Dropdown */}
            <div className="expert-title-wrapper" style={{ position: 'relative', width: 'fit-content' }}>
                <div className="expert-page-title" onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)} style={{ marginBottom: isTitleDropdownOpen ? '0' : '1.5rem' }}>
                    {mainTitle}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                {isTitleDropdownOpen && (
                    <div style={{
                        position: 'absolute', top: '100%', left: '0', background: 'white', border: '1px solid #eee',
                        borderRadius: '8px', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, minWidth: '200px', marginBottom: '1.5rem'
                    }}>
                        <div className="dropdown-item" onClick={() => { setIsTitleDropdownOpen(false); onDetailFacility(); }}>시설물별 세부 정보</div>
                        <div className="dropdown-item" onClick={() => { setIsTitleDropdownOpen(false); onDetailZone(); }}>구역별 세부 정보</div>
                        <div className="dropdown-item" onClick={() => { setIsTitleDropdownOpen(false); onDetailPerson(); }}>인원별 세부 정보</div>
                    </div>
                )}
            </div>

            {/* Address & Big Category Selection */}
            <div className="title-block">
                <div className="main-address" onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)} style={{ cursor: 'pointer', position: 'relative' }}>
                    {selectedAddress}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    {isAddressDropdownOpen && (
                        <div className="dropdown-overlay" style={{ top: '30px', left: 0 }}>
                            {addresses.map((addr, idx) => (
                                <div key={idx} className="dropdown-item" onClick={(e) => { e.stopPropagation(); setSelectedAddress(addr); setIsAddressDropdownOpen(false); }}>{addr}</div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ position: 'relative' }}>
                    <div className="big-dropdown-trigger" onClick={() => setIsBigDropdownOpen(!isBigDropdownOpen)}>
                        {selectedBig}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    {isBigDropdownOpen && (
                        <div className="dropdown-overlay" style={{ top: '30px', left: 0 }}>
                            {bigCategories.map((big, idx) => (
                                <div key={idx} className="dropdown-item" onClick={() => handleBigClick(big)}>{big}</div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="instruction-text">카테고리를 변경해 중분류 세부 정보도 확인해 보세요.</div>
            </div>

            {/* Main Stats Card */}
            <div className="expert-stats-card">
                <div className="expert-card-title">{subTitlePart} {selectedBig} 세부 정보</div>
                <div className="stats-row">
                    <div className="detail-stat-box">
                        <div className="stat-label">적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="detail-stat-box">
                        <div className="stat-label">부적합</div>
                        <div className="stat-value">14/40</div>
                    </div>
                    <div className="detail-stat-box">
                        <div className="stat-label">만족도 평가</div>
                        <div className="stat-value">2.1</div>
                    </div>
                </div>
            </div>

            {/* Middle Category Section */}
            <div className="middle-section-title">
                {selectedBig === '전체(All)' || selectedBig === '전체' ? subTitlePart.replace('별', '') : selectedBig} 중분류
            </div>

            {/* Chips Slider */}
            <div className="category-slider" ref={sliderRef}>
                {subCategories.map((cat, idx) => (
                    <div
                        key={idx}
                        className={`cat-chip ${selectedSub === cat ? 'active' : ''}`}
                        onClick={() => handleSubClick(cat)}
                    >
                        {cat}
                    </div>
                ))}
            </div>

            {/* Sub Stats Card */}
            <div className="expert-stats-card" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {selectedSub ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                        {/* Arrows - Positioned absolutely relative to this card or inline */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div onClick={handlePrevSub} style={{ padding: '10px', cursor: 'pointer' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </div>
                            <div className="card-title" style={{ margin: 0 }}>{selectedSub} 세부 정보</div>
                            <div onClick={handleNextSub} style={{ padding: '10px', cursor: 'pointer' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="stats-row">
                            <div className="detail-stat-box">
                                <div className="stat-label">적합</div>
                                <div className="stat-value">14/40</div>
                            </div>
                            <div className="detail-stat-box">
                                <div className="stat-label">부적합</div>
                                <div className="stat-value">14/40</div>
                            </div>
                            <div className="detail-stat-box">
                                <div className="stat-label">만족도 평가</div>
                                <div className="stat-value">2.1</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="empty-state" style={{ height: '100%', border: 'none' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <div style={{ fontSize: '14px' }}>상위 카테고리를 선택해 주세요.</div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ExpertDiagnosisDetail;
