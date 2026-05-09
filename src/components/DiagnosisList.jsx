import React, { useState } from 'react';
import './DiagnosisList.css';
import DiagnosisCard from './DiagnosisCard';

import { fetchWithLogout, API_URL } from '../utils/api';

const DiagnosisList = ({ onBack, onNavigate }) => {
    // 'all' | 'general' | 'expert'
    const [activeTab, setActiveTab] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [isSortOpen, setIsSortOpen] = useState(false);

    const [listData, setListData] = useState([]);

    React.useEffect(() => {
        const fetchList = async () => {
            try {
                // Use fetchWithLogout to handle auth automatically
                const token = localStorage.getItem('access_token');
                const res = await fetchWithLogout(`${API_URL}/checklist/list`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("Diagnosis List Loaded, count:", data.length);
                    // Map to card format
                    const mapped = data.map(item => {
                        let dateStr = '23.01.01';
                        if (item.created_at) {
                            try {
                                dateStr = new Date(item.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/ /g, '.');
                            } catch (e) { }
                        }

                        return {
                            id: item.result_id,
                            type: item.district_code === 'expert' ? 'expert' : 'general',
                            date: dateStr,
                            bookmarked: false,
                            title: item.중분류 || item.대분류 || '진단 결과',
                            score: String(item.점수 || 0),
                            result: item.만족도 || 'suitable',
                            lat: item.위도,
                            lng: item.경도,
                            address: item.진단지역 || '주소 정보 없음',
                            scores: [],
                            desc: item.리뷰,
                            image: item.이미지경로 ? (item.이미지경로.startsWith('/uploads') ? `${API_URL}${item.이미지경로}` : item.이미지경로) : '/assets/diagnosis_street.png',
                            placeName: item.장소명 || item.placeName || '',
                        };
                    });
                    setListData(mapped);
                } else {
                    console.warn("Fetch List Failed:", res.status);
                }
            } catch (e) {
                console.error("Failed to fetch diagnosis list", e);
            }
        };
        fetchList();
    }, []);

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
