import React, { useState, useRef, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import './DiagnosisDetail.css';

const DiagnosisDetail = ({ type, data, onBack, onHome, onDetailFacility, onDetailZone, onDetailPerson }) => {
    // type: 'facility' (Purple), 'zone' (Blue), 'person' (Green)
    const isFacility = type === 'facility';
    const isZone = type === 'zone';
    const isPerson = type === 'person';

    let themeClass = '';
    let mainTitle = '';
    let subTitlePart = '';
    let themeColor = '';

    // Only general mode data structure is used for now as per request (Big -> Mid)
    // Assume data passed is similar to general_diagnosis.json structure
    const bigCategories = data ? ['전체(All)', ...Object.keys(data)] : ['전체(All)'];

    if (isFacility) {
        themeClass = 'theme-purple';
        mainTitle = '시설물별 세부 정보';
        subTitlePart = '시설물';
        themeColor = '#542AA3';
    } else if (isZone) {
        themeClass = 'theme-blue';
        mainTitle = '구역별 세부 정보';
        subTitlePart = '구역';
        themeColor = '#2196F3';
    } else if (isPerson) {
        themeClass = 'theme-green';
        mainTitle = '인원별 세부 정보';
        subTitlePart = '인원';
        themeColor = '#009688';
    }

    // Mock Chart Data
    const dataChart = [
        { subject: '접근성', A: 2.3, fullMark: 5 },
        { subject: '이동성', A: 2.0, fullMark: 5 },
        { subject: '안전성', A: 3.8, fullMark: 5 },
        { subject: '정비와 조성', A: 1.7, fullMark: 5 },
        { subject: '포용성', A: 1.7, fullMark: 5 },
        { subject: '심미성', A: 2.8, fullMark: 5 },
    ];

    const [selectedBig, setSelectedBig] = useState('전체(All)');
    const [selectedSub, setSelectedSub] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
    const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('부산 부산진구 초연로 6');
    const addresses = ['부산 부산진구 초연로 6'];
    const sliderRef = useRef(null);

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

    // Filter Middle Categories based on Big Category
    const subCategories = (selectedBig !== '전체(All)' && data && data[selectedBig])
        ? Object.keys(data[selectedBig])
        : [];

    const handleBigClick = (big) => {
        setSelectedBig(big);
        setSelectedSub(null); // Reset sub selection
        setIsDropdownOpen(false);
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

    // Helper for labels
    const CustomTick = ({ payload, x, y, textAnchor }) => {
        const { value } = payload;
        const dataPoint = dataChart.find(d => d.subject === value);
        return (
            <g>
                <text x={x} y={y - 5} textAnchor={textAnchor} fill="#666" fontSize="10px" fontWeight="bold">{value}</text>
                <text x={x} y={y + 10} textAnchor={textAnchor} fill="#333" fontSize="12px" fontWeight="bold">{dataPoint?.A}</text>
            </g>
        );
    };

    return (
        <div className={`detail-container ${themeClass}`}>
            {/* Header */}
            <div className="detail-header">
                <button className="icon-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div className="header-title">일반 진단 결과</div>
                <button className="icon-btn" onClick={onHome}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </button>
            </div>

            <div className="detail-title-dropdown">
                <div className="detail-title-header" onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}>
                    {mainTitle}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                {isTitleDropdownOpen && (
                    <div className="title-dropdown-list">
                        <div className="title-dropdown-item" onClick={() => { setIsTitleDropdownOpen(false); onDetailFacility(); }}>시설물별 세부 정보</div>
                        <div className="title-dropdown-item" onClick={() => { setIsTitleDropdownOpen(false); onDetailZone(); }}>구역별 세부 정보</div>
                        <div className="title-dropdown-item" onClick={() => { setIsTitleDropdownOpen(false); onDetailPerson(); }}>인원별 세부 정보</div>
                    </div>
                )}
            </div>

            {/* Address Dropdown */}
            <div className="detail-address-dropdown">
                <div className="address-dropdown-header" onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}>
                    {selectedAddress}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                {isAddressDropdownOpen && (
                    <div className="address-dropdown-list">
                        {addresses.map((addr, idx) => (
                            <div key={idx} className="address-dropdown-item" onClick={() => { setSelectedAddress(addr); setIsAddressDropdownOpen(false); }}>{addr}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dropdown Title */}
            <div className="detail-dropdown">
                <div className="dropdown-header" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    {selectedBig}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                {isDropdownOpen && (
                    <div className="dropdown-list">
                        {bigCategories.map((big, idx) => (
                            <div key={idx} className="dropdown-item" onClick={() => handleBigClick(big)}>{big}</div>
                        ))}
                    </div>
                )}
            </div>

            <div className="detail-desc">카테고리를 변경해 중분류 세부 정보도 확인해 보세요.</div>

            {/* Main Chart Card */}
            <div className="detail-card">
                <div className="detail-card-title">
                    {subTitlePart}별 {selectedBig} 세부 정보
                </div>
                <div style={{ width: '100%', height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dataChart}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={CustomTick} />
                            <Radar
                                name="Score"
                                dataKey="A"
                                stroke={themeColor}
                                strokeWidth={2}
                                fill={themeColor}
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Middle Category Section */}
            <div className="middle-category-section">
                <div className="middle-cat-header">{selectedBig === '전체(All)' ? '전체' : selectedBig} 중분류</div>

                {/* Horizontal Slider */}
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

                {/* Bottom Card */}
                <div className="detail-sub-card">
                    {selectedSub ? (
                        <>
                            {/* Arrows */}
                            <div className="nav-arrow left" onClick={handlePrevSub}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </div>
                            <div className="nav-arrow right" onClick={handleNextSub}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>

                            <div className="detail-card-title" style={{ marginTop: '10px' }}>
                                {selectedSub}
                            </div>

                            <div style={{ width: '100%', height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={dataChart}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={CustomTick} />
                                        <Radar
                                            name="Score"
                                            dataKey="A"
                                            stroke={themeColor}
                                            strokeWidth={2}
                                            fill={themeColor}
                                            fillOpacity={0.3}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <div>상위 카테고리를 선택해 주세요.</div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DiagnosisDetail;
