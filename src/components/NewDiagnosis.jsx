import React, { useState, useEffect } from 'react';
import './NewDiagnosis.css';

const NewDiagnosis = ({ onBack, onNavigate }) => {
    // Force full width layout matching existing diagnosis pages
    useEffect(() => {
        document.body.classList.add('layout-full-width');
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    const categories = ['주거', '생활', '교통', '안전', '교육', '산업일자리', '문화여가'];
    const regions = [
        '부산 전 지역', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구',
        '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'
    ];

    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [selectedRegion, setSelectedRegion] = useState('부산 전체');
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [tempRegion, setTempRegion] = useState('부산 전체');

    const dummyProposals = [
        {
            id: 1,
            category: '주거',
            title: '전봇대 불이 나갔어요',
            author: '동래구 우리디자이너',
            likes: 12,
            comments: 12,
            image: '/assets/proposal_1.png',
            description: '여기 위치보내드립니다\n전봇대가 꺼졌습니다\n빨리 켜주세요',
            date: '2026.01.02',
            views: 333
        },
        {
            id: 2,
            category: '생활',
            title: '골목길 쓰레기 방치',
            author: '서구 보안관',
            likes: 8,
            comments: 5,
            image: '/assets/proposal_2.png',
            description: '집 앞 골목에 쓰레기가 일주일째 방치되어 있습니다.\n악취가 너무 심하니 조치 부탁드립니다.',
            date: '2026.01.05',
            views: 120
        },
        {
            id: 3,
            category: '교통',
            title: '신호등 고장 신고',
            author: '동래구 운전자B',
            likes: 25,
            comments: 10,
            image: '/assets/proposal_3.png',
            description: '사거리 신호등이 깜빡거리기만 하고 바뀌질 않네요.\n교통 체증이 심각하니 확인해주세요.',
            date: '2026.01.07',
            views: 450
        }
    ];

    const handleOpenModal = () => {
        setTempRegion(selectedRegion === '부산 전체' ? '부산 전 지역' : selectedRegion);
        setIsRegionModalOpen(true);
    };

    const handleSelectRegion = () => {
        setSelectedRegion(tempRegion === '부산 전 지역' ? '부산 전체' : tempRegion);
        setIsRegionModalOpen(false);
    };

    return (
        <div className="new-diagnosis-container">
            {/* Header */}
            <header className="nd-header">
                <div className="nd-header-left">
                    <button className="nd-back-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="15" y1="18" x2="9" y2="12"></line>
                            <line x1="9" y1="12" x2="15" y2="6"></line>
                        </svg>
                    </button>
                    <span className="nd-header-title">제안하기</span>
                </div>
                <div className="nd-header-right">
                    <button className="nd-my-proposal-btn" onClick={() => onNavigate && onNavigate('myProposals')}>
                        나의 제안현황
                    </button>
                    <button className="nd-icon-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </button>
                </div>
            </header>

            {/* Content Body */}
            <div className="nd-body">
                {/* Title Section */}
                <div className="nd-location-title-row" onClick={handleOpenModal} style={{ cursor: 'pointer' }}>
                    <h1 className="nd-location-title">{selectedRegion}</h1>
                    <button className="nd-location-arrow">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="9" y1="18" x2="15" y2="12"></line>
                            <line x1="15" y1="12" x2="9" y2="6"></line>
                        </svg>
                    </button>
                </div>

                {/* Categories Scroll */}
                <div className="nd-categories-wrapper">
                    <div className="nd-categories-scroll">
                        {categories.map((cat, idx) => (
                            <button
                                key={idx}
                                className={`nd-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(selectedCategory === cat ? '전체' : cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort Dropdown */}
                <div className="nd-sort-row">
                    <button className="nd-sort-btn">
                        최신순
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>

                {/* Proposal List */}
                <div className="nd-proposal-list">
                    {dummyProposals.map((item) => (
                        <div
                            key={item.id}
                            className="nd-proposal-card"
                            onClick={() => onNavigate('proposalDetail', item)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={`nd-card-badge ${item.category === '주거' ? 'bg-mint-light' : item.category === '생활' ? 'bg-green-light' : 'bg-pink-light'}`}>
                                {item.category}
                            </div>
                            <h3 className="nd-card-title">{item.title}</h3>
                            <p className="nd-card-author">{item.author}</p>

                            {item.image && (
                                <div className="nd-card-image-wrapper">
                                    <img src={item.image} alt={item.title} className="nd-card-image" onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                            )}

                            <div className="nd-card-stats">
                                <div className="nd-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ccc" stroke="none">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                    <span>{item.likes}</span>
                                </div>
                                <div className="nd-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ccc" stroke="none">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    <span>{item.comments}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Fixed Action Button */}
            <div className="nd-bottom-fixed-panel">
                <button className="nd-submit-proposal-btn" onClick={() => onNavigate && onNavigate('proposalForm')}>
                    제안하기
                </button>
            </div>

            {/* Region Selection Bottom Sheet Modal */}
            {isRegionModalOpen && (
                <div className="nd-modal-overlay" onClick={() => setIsRegionModalOpen(false)}>
                    <div className="nd-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="nd-sheet-header">
                            <button className="nd-sheet-close" onClick={() => setIsRegionModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="nd-sheet-content">
                            <div className="nd-region-list">
                                {regions.map((region) => (
                                    <div
                                        key={region}
                                        className={`nd-region-item ${tempRegion === region ? 'selected' : ''}`}
                                        onClick={() => setTempRegion(region)}
                                    >
                                        <div className="nd-region-indicator">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tempRegion === region ? '#16B5B0' : '#ddd'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                        <span className="nd-region-name">{region}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="nd-sheet-footer">
                            <button className="nd-sheet-select-btn" onClick={handleSelectRegion}>
                                선택
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewDiagnosis;
