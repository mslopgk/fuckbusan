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
    const getImageForMid = (name) => {
        // Excel Data Mapping
        if (name.includes('보도') || name.includes('보행')) return '/assets/categories/pedestrian_space.png';
        if (name.includes('차량') || name.includes('차도') || name.includes('진출입') || name.includes('진입구역')) return '/assets/categories/vehicle_entry.png';
        if (name.includes('자전거')) return '/assets/categories/bicycle_path.png';
        if (name.includes('광장') || name.includes('쉼터') || name.includes('공개공지')) return '/assets/categories/public_road.png';
        // Note: Using public_road for Plaza/Shelter as placeholder logic, can be facility_zone too.
        if (name.includes('시설')) return '/assets/categories/facility_zone.png';

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
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '12px' }}>
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
