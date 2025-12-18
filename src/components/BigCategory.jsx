import React, { useState, useEffect } from 'react';
import './BigCategory.css';

const BigCategory = ({ data, onNext, initialBig, initialMid, onBack, color = '#E6235A', progressBarColor }) => {
    // If we have initial props, use them. 
    // Note: if user changes 'Big', 'Mid' should reset.
    const [bigCategory, setBigCategory] = useState(initialBig || '');
    const [selectedMid, setSelectedMid] = useState(initialMid || null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Derived from data keys
    const bigCategories = Object.keys(data || {});
    // If bigCategory is selected, get its mid categories (keys of the inner object)
    const midCategories = bigCategory ? Object.keys(data[bigCategory] || {}) : [];

    // Map names to existing images if possible, else placeholder
    // Map names to existing images
    const getImageForMid = (name) => {
        // [Logic Refinement]
        // If Big Category is '보도' (Sidewalk), use original legacy images.
        if (bigCategory === '보도') {
            if (name === '보행공간') return '/assets/categories/pedestrian_space.png';
            if (name === '차량진입구역') return '/assets/categories/vehicle_entry.png';
            if (name === '자전거도로') return '/assets/categories/bicycle_path.png';
            if (name === '건물 앞 열린 광장, 쉼터(공개공지)') return '/assets/categories/public_road.png'; // Using public_road as per original mapping
            if (name === '시설물구역') return '/assets/categories/facility_zone.png';
            // Fallback for '보도' items just in case
            return '/assets/categories/facility_zone.png';
        }

        // For all other categories, use the new specific images in 'middle' folder
        const map = {
            "생활도로(국지도로, 동네에서 차가 다니는 길)": "생활도로.png",
            "횡단보도": "횡단보도.png",
            "속도저감장치": "속도저감장치.png",
            "진입공간(보행 접근로)": "진입공간(보행 접근로).png",
            "산책로": "산책로.png",
            "위생공간(화장실)": "위생공간(화장실).png",
            "편의공간(편의시설, 안내시설)": "편의공간(편의시설).png",
            "휴게공간": "휴게공간.png",
            "안내시설": "안내 시설.png",
            "가로등(보행등)": "가로등(보행등).png",
            "신호등": "신호등.png",
            "버스승차대": "버스승차대.png",
            "택시승차대": "택시승차대.png",
            "두리발승차대": "두리발승차대.png",
            "지하철출입구": "지하철출입구.png",
            "휴게(벤치)": "휴게(벤치).png",
            "휴게(파고라)": "휴게(파고라).png",
            "휴지통": "휴지통.png",
            "음수대": "음수대.png",
            "기타지원시설": "기타지원시설.png",
            "접근공간": "접근공간.png",
            "진입공간": "진입공간(진입).png",
            "이동공간": "이동공간.png",
            "위생공간": "위생공간.png"
        };

        if (map[name]) {
            return `/assets/categories/middle/${map[name]}`;
        }

        // Fallback heuristics
        if (name.includes('시설')) return '/assets/categories/middle/기타지원시설.png';
        if (name.includes('위생') || name.includes('화장실')) return '/assets/categories/middle/위생공간(화장실).png';

        // Default
        return '/assets/categories/facility_zone.png';
    };

    return (
        <div className="container">
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
            <main className="step-content">
                <div className="step-top-section">
                    <div className="step-main-title" style={{ color: color }}>진단하기</div>
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: '50%', backgroundColor: progressBarColor || color }}></div>
                    </div>
                </div>
                <div className="step-title">2) 시설 선택</div>
                <p className="description">
                    첨부한 사진은 어떤 시설에 해당하나요?<br />
                    대분류, 중분류 카테고리에서 선택해 주세요.
                </p>

                <div className="form-group">
                    <label className="label">대분류</label>
                    <div className="select-wrapper">
                        <select
                            className={`select-box ${bigCategory === '' ? 'placeholder' : ''}`}
                            value={bigCategory}
                            onChange={(e) => {
                                setBigCategory(e.target.value);
                                setSelectedMid(null); // Reset mid when big changes
                            }}
                        >
                            <option value="" disabled>카테고리를 선택해주세요</option>
                            {bigCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <span className="select-arrow">
                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1.5L6 6.5L11 1.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </div>
                </div>

                {/* Show Grid only if Big Category is selected */}
                {bigCategory && (
                    <div className="form-group midi-group">
                        <label className="label">중분류</label>
                        <div className="grid-container">
                            {midCategories.map((midName) => {
                                const imgPath = getImageForMid(midName);
                                return (
                                    <div
                                        key={midName}
                                        className={`card ${selectedMid === midName ? 'selected' : ''}`}
                                        onClick={() => setSelectedMid(midName)}
                                    >
                                        <div className="card-image-box">
                                            {imgPath ? (
                                                <img src={imgPath} alt={midName} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.75rem' }}>
                                                    No Image
                                                </div>
                                            )}
                                            {selectedMid === midName && (
                                                <div className="check-icon">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="12" cy="12" r="10" fill="#000000" />
                                                        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-name" style={selectedMid === midName ? { color: color, fontWeight: 'bold' } : {}}>{midName}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="sticky-footer">
                <button className="btn btn-prev" onClick={onBack}>이전</button>
                <button
                    className={`btn btn-next ${selectedMid ? 'active' : ''}`}
                    disabled={!selectedMid}
                    onClick={() => onNext(bigCategory, selectedMid)}
                    style={selectedMid ? { backgroundColor: color } : {}}
                >
                    다음
                </button>
            </footer>
        </div>
    );
};

export default BigCategory;
