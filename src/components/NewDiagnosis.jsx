import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/format';
import './NewDiagnosis.css';

const NewDiagnosis = ({ onBack, onNavigate }) => {
    // Force full width layout matching existing diagnosis pages
    useEffect(() => {
        document.body.classList.add('layout-full-width');
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    const categories = ['전체', '주거', '환경', '교육', '안전', '산업 및 고용', '모빌리티', '문화 및 레저', '보건 및 복지'];
    const regions = [
        '부산 전 지역', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구',
        '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'
    ];

    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [selectedRegion, setSelectedRegion] = useState('부산 전체');
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [tempRegion, setTempRegion] = useState('부산 전체');

    const [isSortModalOpen, setIsSortModalOpen] = useState(false);
    const [selectedSort, setSelectedSort] = useState('최신순');
    const [tempSort, setTempSort] = useState('최신순');

    const sortOptions = ['조회수', '투표순', '최신순'];

    const [proposals, setProposals] = useState([]); // Real data from backend
    const [loading, setLoading] = useState(true);

    const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${VITE_API_URL}/api/reports/proposals`, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setProposals(data || []);
                }
            } catch (error) {
                console.error("Failed to fetch proposals:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProposals();
    }, [VITE_API_URL]);


    // 카테고리별 배지 색상 정의
    const getCategoryStyle = (category) => {
        const styles = {
            '주거': { background: '#FFF3E0', color: '#E65100' },
            '환경': { background: '#E8F5E9', color: '#2E7D32' },
            '교육': { background: '#EDE7F6', color: '#4527A0' },
            '안전': { background: '#FCE4EC', color: '#C62828' },
            '산업 및 고용': { background: '#E0F2F1', color: '#00695C' },
            '모빌리티': { background: '#E3F2FD', color: '#1565C0' },
            '문화 및 레저': { background: '#FFF8E1', color: '#F57F17' },
            '보건 및 복지': { background: '#F3E5F5', color: '#7B1FA2' },
        };
        return styles[category] || { background: '#F5F5F5', color: '#616161' };
    };

    // Filtered and Sorted Proposals
    const filteredProposals = proposals.filter(p => {
        const matchesCategory = selectedCategory === '전체' || p.category === selectedCategory;
        // region 필드에서 '~구' 포함 여부로 매칭 (예: "부산 해운대구" → "해운대구" 선택 시 매칭)
        const matchesRegion = selectedRegion === '부산 전체' || (p.region && p.region.includes(selectedRegion));
        return matchesCategory && matchesRegion;
    }).sort((a, b) => {
        if (selectedSort === '최신순') {
            return new Date(b.created_at) - new Date(a.created_at);
        } else if (selectedSort === '투표순') {
            return (b.likes_count || 0) - (a.likes_count || 0);
        } else if (selectedSort === '조회수') {
            return (b.views_count || 0) - (a.views_count || 0);
        }
        return 0;
    });

    // Dummy data for original items if needed, but primarily use real data.
    // If real data is empty, we show a message.

    const handleOpenModal = () => {
        setTempRegion(selectedRegion === '부산 전체' ? '부산 전 지역' : selectedRegion);
        setIsRegionModalOpen(true);
    };

    const handleSelectRegion = () => {
        setSelectedRegion(tempRegion === '부산 전 지역' ? '부산 전체' : tempRegion);
        setIsRegionModalOpen(false);
    };

    const handleOpenSortModal = () => {
        setTempSort(selectedSort);
        setIsSortModalOpen(true);
    };

    const handleSelectSort = () => {
        setSelectedSort(tempSort);
        setIsSortModalOpen(false);
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
                    <span className="nd-header-title">홈으로</span>
                </div>
                <div className="nd-header-right">
                    <button className="nd-my-proposal-btn" onClick={() => onNavigate && onNavigate('myProposals')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
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
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort Dropdown */}
                <div className="nd-sort-row">
                    <button className="nd-sort-btn" onClick={handleOpenSortModal}>
                        {selectedSort}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>

                {/* Proposal List */}
                {/* Proposal List */}
                <div className="nd-proposal-list">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>로딩 중...</div>
                    ) : filteredProposals.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>해당하는 제안이 없습니다.</div>
                    ) : filteredProposals.map((item) => {
                        // 이미지 경로 처리
                        let imageUrl = null;
                        if (item.files && item.files.length > 0) {
                            const firstFile = item.files[0];
                            if (firstFile.startsWith('http')) {
                                imageUrl = firstFile;
                            } else if (firstFile.startsWith('/assets/')) {
                                imageUrl = firstFile;
                            } else {
                                imageUrl = `${VITE_API_URL}/uploads/${firstFile}`;
                            }
                        }

                        return (
                            <div
                                key={item.id}
                                className="nd-proposal-card"
                                onClick={() => onNavigate('proposalDetail', {
                                    ...item,
                                    description: item.content,
                                    author: item.nickname, // [수정] 닉네임 사용
                                    date: formatDate(item.created_at),
                                    views: item.views_count,
                                    likes: item.likes_count,
                                    image: imageUrl,
                                    isMine: item.is_mine // [수정] 백엔드 기반 본인 판별
                                })}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="nd-card-badge" style={getCategoryStyle(item.category)}>
                                    {item.category}
                                </div>
                                <h3 className="nd-card-title">{item.title}</h3>
                                <p className="nd-card-author">{item.nickname || '익명'}</p>

                                {imageUrl && (
                                    <div className="nd-card-image-wrapper">
                                        <img 
                                            src={imageUrl} 
                                            alt={item.title} 
                                            className="nd-card-image" 
                                            loading="lazy"
                                            onError={(e) => { e.target.style.display = 'none'; }} 
                                        />
                                    </div>
                                )}

                                <div className="nd-card-stats">
                                    <div className="nd-stat">
                                        <div className={`nd-stat-icon-circle ${item.has_voted ? 'active' : ''}`}>
                                            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                        <span>{item.likes_count}</span>
                                    </div>
                                    <div className="nd-stat">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#adb5bd" stroke="none">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <span>{item.comments_count ?? 0}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                            <h3 className="nd-sheet-title">위치 설정</h3>
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

            {/* Sort Selection Bottom Sheet Modal */}
            {isSortModalOpen && (
                <div className="nd-modal-overlay" onClick={() => setIsSortModalOpen(false)}>
                    <div className="nd-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="nd-sheet-header nd-sort-header">
                            <h3 className="nd-sheet-title">정렬</h3>
                            <button className="nd-sheet-close" onClick={() => setIsSortModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="nd-sheet-content">
                            <div className="nd-sort-list">
                                {sortOptions.map((option) => (
                                    <div 
                                        key={option}
                                        className={`nd-sort-item ${tempSort === option ? 'selected' : ''}`}
                                        onClick={() => setTempSort(option)}
                                    >
                                        <div className="nd-sort-indicator">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tempSort === option ? '#16B5B0' : '#ddd'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                        <span className="nd-sort-name">{option}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="nd-sheet-footer">
                            <button className="nd-sheet-select-btn" onClick={handleSelectSort}>
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
