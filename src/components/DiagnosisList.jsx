import React, { useState } from 'react';
import './DiagnosisList.css';
import DiagnosisCard from './DiagnosisCard';

const DiagnosisList = ({ onBack, onNavigate }) => {
    // 'all' | 'general' | 'expert'
    const [activeTab, setActiveTab] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest'); // 'latest'
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Mock Data based on images (moved outside or memoized if real)
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

                <div className="sort-wrapper" style={{ position: 'relative' }}>
                    <div
                        className="sort-dropdown-wrapper"
                        onClick={(e) => { e.stopPropagation(); setIsSortOpen(!isSortOpen); }}
                        style={{ minWidth: '80px', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                        <span className="sort-label">
                            {sortOrder === 'latest' ? '최신순' : '점수순'}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    {isSortOpen && (
                        <div className="sort-menu" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            zIndex: 100,
                            background: 'white',
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            width: '100px', // Fixed width to ensure it doesn't squish
                            overflow: 'hidden'
                        }}>
                            <div
                                className={`sort-option ${sortOrder === 'latest' ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setSortOrder('latest'); setIsSortOpen(false); }}
                                style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', color: sortOrder === 'latest' ? '#E6235A' : '#333', background: sortOrder === 'latest' ? '#fff0f5' : 'white' }}
                            >
                                최신순
                            </div>
                            <div
                                className={`sort-option ${sortOrder === 'score' ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setSortOrder('score'); setIsSortOpen(false); }}
                                style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', color: sortOrder === 'score' ? '#E6235A' : '#333', background: sortOrder === 'score' ? '#fff0f5' : 'white' }}
                            >
                                점수순
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="list-content">
                {listData
                    .filter(item => activeTab === 'all' || item.type === activeTab)
                    .sort((a, b) => {
                        if (sortOrder === 'latest') {
                            // Date desc (String comparison for YY.MM.DD works)
                            return b.date.localeCompare(a.date);
                        } else {
                            // Score desc
                            // Expert items might not have score, treat as -1 to put at bottom or top?
                            // Let's assume user wants to see high scores.
                            const scoreA = parseFloat(a.score || 0);
                            const scoreB = parseFloat(b.score || 0);
                            return scoreB - scoreA;
                        }
                    })
                    .map(item => (
                        <DiagnosisCard
                            key={item.id}
                            item={item}
                            onBookmark={toggleBookmark}
                            onClick={() => console.log('Card clicked', item.id)}
                        />
                    ))}
            </div>
        </div>
    );
};

export default DiagnosisList;
