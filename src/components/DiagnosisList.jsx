import React, { useState } from 'react';
import './DiagnosisList.css';

const DiagnosisList = ({ onBack, onNavigate }) => {
    // 'all' | 'general' | 'expert'
    const [activeTab, setActiveTab] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest'); // 'latest'
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Mock Data based on images (moved outside or memoized if real)
    const [listData, setListData] = useState([
        {
            id: 1,
            type: 'general',
            date: '25.12.20',
            bookmarked: false,
            title: '보도',
            score: '2.0',
            lat: '35.1717231',
            lng: '129.1107443',
            scores: [
                { label: '접근성', val: '2.0' },
                { label: '안전성', val: '2.0' },
                { label: '정보\n제공성', val: '2.0' },
                { label: '포용성', val: '2.0' },
                { label: '이동성', val: '2.0' },
                { label: '심미성', val: '2.0' }
            ],
            desc: '시설물 전반은 잘 관리되고 있는 것으로 보이나, 일부 구간의 바닥 상태가 고르지 않아 보행 시 불편함을 느꼈습니다. 특히 노약자나 어린이가 이용할 경우 안전사고...',
            image: '/assets/diagnosis_street.png'
        },
        {
            id: 2,
            type: 'expert',
            date: '25.12.20',
            bookmarked: true,
            title: '위생공간/화장실',
            result: 'suitable', // suitable | unsuitable
            lat: '35.1717231',
            lng: '129.1107443',
            desc: '시설물 전반은 잘 관리되고 있는 것으로 보이나, 일부 구간의 바닥 상태가 고르지 않아 보행 시 불편함을 느꼈습니다. 특히 노약자나 어린이가 이용할 경우 안전사고...',
            image: '/assets/diagnosis_street.png'
        },
        {
            id: 3,
            type: 'expert',
            date: '25.12.20',
            bookmarked: false,
            title: '위생공간/화장실',
            result: 'unsuitable',
            lat: '35.1717231',
            lng: '129.1107443',
            desc: '시설물 전반은 잘 관리되고 있는 것으로 보이나, 일부 구간의 바닥 상태가 고르지 않아 보행 시 불편함을 느꼈습니다. 특히 노약자나 어린이가 이용할 경우 안전사고...',
            image: '/assets/diagnosis_street.png'
        }
    ]);

    const toggleBookmark = (id) => {
        setListData(prev => prev.map(item =>
            item.id === id ? { ...item, bookmarked: !item.bookmarked } : item
        ));
    };

    const filteredData = listData.filter(item => {
        if (activeTab === 'all') return true;
        return item.type === activeTab;
    });

    return (
        <div className="diagnosis-list-container">
            {/* Header */}
            <div className="diagnosis-list-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <div className="page-title">진단 목록</div>

            {/* Controls Row */}
            <div className="controls-row">
                <div className="tabs">
                    <button
                        className={`tab-btn all ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        전체
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        일반인
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'expert' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expert')}
                    >
                        전문가
                    </button>
                </div>

                <div className="sort-dropdown-wrapper" onClick={() => setIsSortOpen(!isSortOpen)}>
                    <span className="sort-label">최신순</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            {/* List */}
            <div className="list-content">
                {filteredData.map(item => (
                    <div key={item.id} className="diagnosis-card">
                        <div className="card-header">
                            <div className={`type-badge ${item.type}`}>
                                {item.type === 'general' ? '일반인' : '전문가'}
                            </div>
                            <div className="card-date-row">
                                <span className="card-date">{item.date}</span>
                                <svg
                                    onClick={() => toggleBookmark(item.id)}
                                    style={{ cursor: 'pointer' }}
                                    width="20" height="20" viewBox="0 0 24 24"
                                    fill={item.bookmarked ? "#242424" : "none"}
                                    stroke={item.bookmarked ? "#242424" : "#ccc"}
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                        </div>

                        {/* Main Info Row */}
                        <div className="card-main-info">
                            <div className="card-img">
                                {/* Placeholder image logic */}
                                <img src={item.image} alt="site" />
                            </div>
                            <div className="card-text-info">
                                <div className="card-title">{item.title}</div>
                                {item.type === 'general' ? (
                                    <div className="card-score-large">{item.score}</div>
                                ) : (
                                    <div className={`card-result ${item.result}`}>
                                        {item.result === 'suitable' ? '적합' : '부적합'}
                                    </div>
                                )}

                                <div className="card-coords">
                                    <div className="coord-col">
                                        <div className="coord-label">위도</div>
                                        <div className="coord-val">{item.lat}</div>
                                    </div>
                                    <div className="coord-col">
                                        <div className="coord-label">경도</div>
                                        <div className="coord-val">{item.lng}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* General Only: Score Grid */}
                        {item.type === 'general' && (
                            <div className="score-grid">
                                {item.scores.map((s, idx) => (
                                    <div key={idx} className="score-box">
                                        <div className="score-label">{s.label}</div>
                                        <div className="score-val">{s.val}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Divider */}
                        <div className="card-divider"></div>

                        {/* Description */}
                        <div className="card-desc">
                            {item.desc}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiagnosisList;
