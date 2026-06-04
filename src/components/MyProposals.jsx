/* MyProposals.jsx */
import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/format';
import { API_URL } from '../utils/api';
import './MyProposals.css';

const DISTRICTS = ['부산전체','중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'];
const CATEGORIES = ['전체','주거','환경','교육','안전','산업 및 고용','모빌리티','문화 및 레저','보건 및 복지'];

const MyProposals = ({ onBack, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('mine'); // 'mine' or 'voted'
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    // 데스크톱 필터 상태
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('부산전체');
    const [selectedCategory, setSelectedCategory] = useState('전체');

    useEffect(() => {
        const fetchProposalsData = async () => {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const endpoint = activeTab === 'mine' ? 'my-proposals' : 'voted-proposals';
                const response = await fetch(`${API_URL}/api/reports/${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setProposals(data || []);
                }
            } catch {
                // ignore fetch error
            } finally {
                setLoading(false);
            }
        };

        fetchProposalsData();
    }, [activeTab]);

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



    // 데스크톱 클라이언트 필터링
    const filteredProposals = React.useMemo(() => {
        let filtered = [...proposals];
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
        return filtered;
    }, [proposals, selectedDistrict, selectedCategory, appliedSearch]);

    return (
        <div className="my-proposals-container">
            {/* PC 히어로 배너 */}
            <div className="mp-pc-hero">
                <p className="mp-pc-page-title">나의 제안</p>
                <div className="mp-pc-hero-inner">
                    <div className="mp-pc-hero-text">
                        <p>내가 제안하고 내가 투표한<br />제안을 확인하세요</p>
                    </div>
                    <div className="mp-pc-hero-illust">
                        <img src="/assets/pc_hero_myproposals.png" alt="" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                </div>
            </div>

            {/* Header (모바일 전용) */}
            <header className="mp-header">
                <div className="mp-header-left">
                    <button className="mp-back-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="15" y1="18" x2="9" y2="12"></line>
                            <line x1="9" y1="12" x2="15" y2="6"></line>
                        </svg>
                    </button>
                    <span className="mp-header-title">나의 제안현황</span>
                </div>
            </header>

            {/* PC 검색 + 구군 + 카테고리 필터 */}
            <div className="mp-pc-filters">
                <div className="mp-search-wrapper">
                    <input
                        type="text"
                        className="mp-search-input"
                        placeholder="검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setAppliedSearch(search); }}
                    />
                    <button className="mp-search-btn" onClick={() => setAppliedSearch(search)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </div>
                <div className="mp-district-tabs">
                    {DISTRICTS.map((d) => (
                        <button key={d} className={`mp-district-tab ${selectedDistrict === d ? 'active' : ''}`} onClick={() => setSelectedDistrict(d)}>{d}</button>
                    ))}
                </div>
                <div className="mp-category-chips">
                    {CATEGORIES.map((cat) => (
                        <button key={cat} className={`mp-category-chip ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="mp-tabs-container">
                <div className="mp-tab-switcher">
                    <button
                        className={`mp-tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mine')}
                    >
                        나의 제안글
                    </button>
                    <button
                        className={`mp-tab-btn ${activeTab === 'voted' ? 'active' : ''}`}
                        onClick={() => setActiveTab('voted')}
                    >
                        투표한 제안
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="mp-content">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>로딩 중...</div>
                ) : proposals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        {activeTab === 'mine' ? '아직 작성한 제안이 없습니다.' : '투표한 제안이 없습니다.'}
                    </div>
                ) : (filteredProposals).map((item) => {
                    
                    // [수정] 이미지 경로 생성 로직 강화
                    let imageUrl = null;
                    if (item.files && item.files.length > 0) {
                        const firstFile = item.files[0];
                        if (typeof firstFile === 'string' && firstFile) {
                            if (firstFile.startsWith('http')) {
                                imageUrl = firstFile;
                            } else if (firstFile.startsWith('/assets/')) {
                                imageUrl = firstFile;
                            } else if (firstFile.startsWith('/uploads/')) {
                                imageUrl = `${API_URL}${firstFile}`;
                            } else {
                                imageUrl = `${API_URL}/uploads/${firstFile}`;
                            }
                        }
                    }
                    
                    return (
                        <div
                            key={item.id}
                            className="mp-proposal-card"
                            onClick={() => onNavigate(window.innerWidth >= 1024 ? 'pcMyProposalDetail' : 'mProposalDetail', {
                                ...item,
                                description: item.content,
                                author: item.nickname,
                                date: formatDate(item.created_at),
                                views: item.views_count,
                                likes: item.likes_count,
                                image: imageUrl,
                                isMine: item.is_mine
                            })}
                        >
                            <div className="mp-card-badge" style={getCategoryStyle(item.category)}>
                                {item.category}
                            </div>
                            <h3 className="mp-card-title">{item.title}</h3>
                            <p className="mp-card-author">{item.nickname || '나의 제안'}</p>

                            {imageUrl && (
                                <div className="mp-card-image-wrapper">
                                    <img 
                                        src={imageUrl} 
                                        alt={item.title} 
                                        className="mp-card-image" 
                                        loading="lazy"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            )}

                            <div className="mp-card-stats">
                                <div className="mp-stat">
                                    <div 
                                        className={`mp-stat-icon-circle ${item.has_voted ? 'active' : ''}`} 
                                    >
                                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span>{item.likes_count}</span>
                                </div>
                                <div className="mp-stat">
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
    );
};

export default MyProposals;
