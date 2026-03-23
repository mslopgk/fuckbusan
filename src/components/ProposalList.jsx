/* ProposalList.jsx - 제안현황 페이지 (반응형: 모바일 + 데스크톱) */
import React, { useState, useEffect, useCallback } from 'react';
import './ProposalList.css';

const DISTRICTS = [
    '부산전체', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구',
    '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'
];

const REGIONS_MOBILE = [
    '부산 전 지역', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구',
    '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'
];

const CATEGORIES = ['전체', '주거', '환경', '교육', '안전', '산업 및 고용', '모빌리티', '문화 및 레저', '보건 및 복지'];

const CATEGORY_STYLES = {
    '주거': { background: '#FFF3E0', color: '#E65100' },
    '환경': { background: '#E8F5E9', color: '#2E7D32' },
    '교육': { background: '#EDE7F6', color: '#4527A0' },
    '안전': { background: '#FCE4EC', color: '#C62828' },
    '산업 및 고용': { background: '#E0F2F1', color: '#00695C' },
    '모빌리티': { background: '#E3F2FD', color: '#1565C0' },
    '문화 및 레저': { background: '#FFF8E1', color: '#F57F17' },
    '보건 및 복지': { background: '#F3E5F5', color: '#7B1FA2' },
};

const ProposalList = ({ onNavigate, onBack }) => {
    const [allProposals, setAllProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    // 공통 필터 상태
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [sortBy, setSortBy] = useState('최신순');

    // 모바일 전용 상태
    const [selectedRegion, setSelectedRegion] = useState('부산 전체');
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [tempRegion, setTempRegion] = useState('부산 전체');
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);
    const [tempSort, setTempSort] = useState('최신순');

    // 데스크톱 전용 상태
    const [selectedDistrict, setSelectedDistrict] = useState('부산전체');
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    const VITE_API_URL = import.meta.env.VITE_API_URL || 'https://ke7eh3ev2j33nj76skhv6n2tom0yzwim.lambda-url.ap-northeast-2.on.aws';

    const fetchProposals = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${VITE_API_URL}/api/reports/proposals`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                setAllProposals(Array.isArray(data) ? data : []);
            } else {
                setAllProposals([]);
            }
        } catch (error) {
            console.error('Failed to fetch proposals:', error);
            setAllProposals([]);
        } finally {
            setLoading(false);
        }
    }, [VITE_API_URL]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    const getImageUrl = (item) => {
        if (!item.files || item.files.length === 0) return null;
        const f = item.files[0];
        if (f.startsWith('http')) return f;
        if (f.startsWith('/assets/')) return f;
        if (f.startsWith('/uploads/')) return `${VITE_API_URL}${f}`;
        return `${VITE_API_URL}/uploads/${f}`;
    };

    const handleCardClick = (item) => {
        const imageUrl = getImageUrl(item);
        onNavigate('proposalDetail', {
            ...item,
            description: item.content,
            author: item.nickname,
            date: formatDate(item.created_at),
            views: item.views_count,
            likes: item.likes_count,
            image: imageUrl,
            isMine: item.is_mine,
        });
    };

    // 모바일 필터링 (지역 bottom sheet 기준)
    const mobileFiltered = React.useMemo(() => {
        let filtered = [...allProposals];
        if (selectedRegion !== '부산 전체') {
            filtered = filtered.filter(p => p.region && p.region.includes(selectedRegion));
        }
        if (selectedCategory !== '전체') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }
        if (sortBy === '최신순') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        else if (sortBy === '투표순') filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        else if (sortBy === '조회수') filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        return filtered;
    }, [allProposals, selectedRegion, selectedCategory, sortBy]);

    // 데스크톱 필터링 (탭 그리드 기준)
    const desktopFiltered = React.useMemo(() => {
        let filtered = [...allProposals];
        if (selectedDistrict !== '부산전체') {
            filtered = filtered.filter(p => p.region && p.region.includes(selectedDistrict));
        }
        if (selectedCategory !== '전체') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }
        if (appliedSearch.trim()) {
            const q = appliedSearch.trim().toLowerCase();
            filtered = filtered.filter(p =>
                (p.title && p.title.toLowerCase().includes(q)) ||
                (p.content && p.content.toLowerCase().includes(q))
            );
        }
        if (sortBy === '최신순') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        else if (sortBy === '투표순') filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        else if (sortBy === '조회수') filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        return filtered;
    }, [allProposals, selectedDistrict, selectedCategory, appliedSearch, sortBy]);

    // 모바일 지역 선택
    const handleOpenRegionModal = () => {
        setTempRegion(selectedRegion === '부산 전체' ? '부산 전 지역' : selectedRegion);
        setIsRegionModalOpen(true);
    };
    const handleSelectRegion = () => {
        setSelectedRegion(tempRegion === '부산 전 지역' ? '부산 전체' : tempRegion);
        setIsRegionModalOpen(false);
    };

    // 모바일 정렬 선택
    const handleOpenSortModal = () => {
        setTempSort(sortBy);
        setIsSortModalOpen(true);
    };
    const handleSelectSort = () => {
        setSortBy(tempSort);
        setIsSortModalOpen(false);
    };

    return (
        <div className="proposal-list-container">

            {/* ===================== 모바일 레이아웃 ===================== */}

            {/* 모바일 헤더 */}
            <header className="pl-mobile-header">
                <div className="pl-mobile-header-left">
                    <button className="pl-back-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="15" y1="18" x2="9" y2="12"></line>
                            <line x1="9" y1="12" x2="15" y2="6"></line>
                        </svg>
                    </button>
                    <span className="pl-mobile-header-title">홈으로</span>
                </div>
                <div className="pl-mobile-header-right">
                    <button className="pl-my-proposals-btn" onClick={() => onNavigate && onNavigate('myProposals')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                        나의 제안현황
                    </button>
                    <button className="pl-icon-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </button>
                </div>
            </header>

            {/* 모바일 바디 */}
            <div className="pl-mobile-body">
                {/* 지역 선택 */}
                <div className="pl-region-title-row" onClick={handleOpenRegionModal}>
                    <h1 className="pl-region-title">{selectedRegion}</h1>
                    <button className="pl-region-arrow">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="9" y1="18" x2="15" y2="12"></line>
                            <line x1="15" y1="12" x2="9" y2="6"></line>
                        </svg>
                    </button>
                </div>

                {/* 카테고리 가로 스크롤 */}
                <div className="pl-categories-wrapper">
                    <div className="pl-categories-scroll">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                className={`pl-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 정렬 */}
                <div className="pl-sort-row">
                    <button className="pl-sort-dropdown-btn" onClick={handleOpenSortModal}>
                        {sortBy}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>

                {/* 목록 */}
                <div className="pl-mobile-list">
                    {loading ? (
                        <div className="pl-loading">로딩 중...</div>
                    ) : mobileFiltered.length === 0 ? (
                        <div className="pl-empty-msg">해당하는 제안이 없습니다.</div>
                    ) : mobileFiltered.map((item) => {
                        const imageUrl = getImageUrl(item);
                        return (
                            <div key={item.id} className="pl-mobile-card" onClick={() => handleCardClick(item)}>
                                <div className="pl-mobile-card-badge" style={CATEGORY_STYLES[item.category] || { background: '#F5F5F5', color: '#616161' }}>
                                    {item.category}
                                </div>
                                <h3 className="pl-mobile-card-title">{item.title}</h3>
                                <p className="pl-mobile-card-author">{item.nickname || '익명'}</p>
                                {imageUrl && (
                                    <div className="pl-mobile-card-img-wrapper">
                                        <img src={imageUrl} alt={item.title} className="pl-mobile-card-img" loading="lazy" onError={(e) => e.target.style.display = 'none'} />
                                    </div>
                                )}
                                <div className="pl-mobile-card-stats">
                                    <div className="pl-stat">
                                        <div className={`pl-stat-icon ${item.has_voted ? 'active' : ''}`}>
                                            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                        <span>{item.likes_count || 0}</span>
                                    </div>
                                    <div className="pl-stat">
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

            {/* 모바일 하단 제안하기 버튼 */}
            <div className="pl-mobile-bottom">
                <button className="pl-mobile-submit-btn" onClick={() => onNavigate && onNavigate('proposalForm')}>
                    제안하기
                </button>
            </div>

            {/* ===================== 데스크톱 레이아웃 ===================== */}

            {/* 데스크톱 히어로 배너 */}
            <div className="pl-hero">
                <p className="pl-page-title">제안현황</p>
                <div className="pl-hero-inner">
                    <div className="pl-hero-text">
                        <p>현재 우리 동네에서 진행 중인<br />제안들입니다.</p>
                    </div>
                    <div className="pl-hero-illustration">
                        <img src="/assets/pc_hero_proposallist.png" alt="" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                </div>
            </div>

            <div className="pl-content">
                {/* 검색바 */}
                <div className="pl-search-wrapper">
                    <input
                        type="text"
                        className="pl-search-input"
                        placeholder="검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setAppliedSearch(search); }}
                    />
                    <button className="pl-search-btn" onClick={() => setAppliedSearch(search)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </div>

                {/* 구군 탭 - 두 개의 그리드를 붙여서 사용 */}
                <div className="pl-district-tabs-wrapper">
                    <div className="pl-district-tabs pl-district-tabs-row1">
                        {DISTRICTS.slice(0, 9).map((d) => (
                            <button
                                key={d}
                                className={`pl-district-tab ${selectedDistrict === d ? 'active' : ''}`}
                                onClick={() => setSelectedDistrict(d)}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    <div className="pl-district-tabs pl-district-tabs-row2">
                        {DISTRICTS.slice(9).map((d) => (
                            <button
                                key={d}
                                className={`pl-district-tab ${selectedDistrict === d ? 'active' : ''}`}
                                onClick={() => setSelectedDistrict(d)}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 카테고리 필터 + 정렬 */}
                <div className="pl-filter-row">
                    <div className="pl-category-chips">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                className={`pl-category-chip ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="pl-sort-btns">
                        <button className={`pl-sort-btn ${sortBy === '조회수' ? 'active' : ''}`} onClick={() => setSortBy('조회수')}>조회수</button>
                        <div className="pl-sort-divider"></div>
                        <button className={`pl-sort-btn ${sortBy === '투표순' ? 'active' : ''}`} onClick={() => setSortBy('투표순')}>투표순</button>
                        <div className="pl-sort-divider"></div>
                        <button className={`pl-sort-btn ${sortBy === '최신순' ? 'active' : ''}`} onClick={() => setSortBy('최신순')}>최신순</button>
                    </div>
                </div>

                {/* 데스크톱 카드 그리드 */}
                {loading ? (
                    <div className="pl-loading">로딩 중...</div>
                ) : desktopFiltered.length === 0 ? (
                    <div className="pl-empty">
                        <p>등록된 제안이 없습니다.</p>
                        <button className="pl-empty-btn" onClick={() => onNavigate('proposalForm')}>첫 제안 작성하기</button>
                    </div>
                ) : (
                    <div className="pl-grid">
                        {desktopFiltered.map((item) => {
                            const imageUrl = getImageUrl(item);
                            const catStyle = CATEGORY_STYLES[item.category] || { background: '#F5F5F5', color: '#616161' };
                            return (
                                <div key={item.id} className="pl-card" onClick={() => handleCardClick(item)}>
                                    <div className="pl-card-top">
                                        <span className="pl-card-badge" style={catStyle}>{item.category}</span>
                                        {imageUrl && (
                                            <img src={imageUrl} alt={item.title} className="pl-card-thumb" loading="lazy" onError={(e) => e.target.style.display = 'none'} />
                                        )}
                                    </div>
                                    <h3 className="pl-card-title">{item.title}</h3>
                                    <p className="pl-card-author">{item.nickname || item.author || '작성자 정보 없음'}</p>
                                    <div className="pl-card-stats">
                                        <div className="pl-stat">
                                            <div className={`pl-stat-icon ${item.has_voted ? 'active' : ''}`}>
                                                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                            <span>{item.likes_count || 0}</span>
                                        </div>
                                        <div className="pl-stat">
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
                )}
            </div>

            {/* ===================== 모바일 모달 ===================== */}

            {/* 지역 선택 Bottom Sheet */}
            {isRegionModalOpen && (
                <div className="pl-modal-overlay" onClick={() => setIsRegionModalOpen(false)}>
                    <div className="pl-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="pl-sheet-header">
                            <h3 className="pl-sheet-title">위치 설정</h3>
                            <button className="pl-sheet-close" onClick={() => setIsRegionModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="pl-sheet-content">
                            <div className="pl-region-list">
                                {REGIONS_MOBILE.map((region) => (
                                    <div key={region} className={`pl-region-item ${tempRegion === region ? 'selected' : ''}`} onClick={() => setTempRegion(region)}>
                                        <div className="pl-region-indicator">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tempRegion === region ? '#16B5B0' : '#ddd'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                        <span className="pl-region-name">{region}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pl-sheet-footer">
                            <button className="pl-sheet-select-btn" onClick={handleSelectRegion}>선택</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 정렬 선택 Bottom Sheet */}
            {isSortModalOpen && (
                <div className="pl-modal-overlay" onClick={() => setIsSortModalOpen(false)}>
                    <div className="pl-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="pl-sheet-header">
                            <h3 className="pl-sheet-title">정렬</h3>
                            <button className="pl-sheet-close" onClick={() => setIsSortModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="pl-sheet-content">
                            <div className="pl-sort-list">
                                {['조회수', '투표순', '최신순'].map((option) => (
                                    <div key={option} className={`pl-sort-item ${tempSort === option ? 'selected' : ''}`} onClick={() => setTempSort(option)}>
                                        <div className="pl-sort-indicator">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tempSort === option ? '#16B5B0' : '#ddd'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                        <span className="pl-sort-name">{option}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pl-sheet-footer">
                            <button className="pl-sheet-select-btn" onClick={handleSelectSort}>선택</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProposalList;
