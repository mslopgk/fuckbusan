/* MyProposals.jsx — Figma: 215:2205(PC 나의제안글), 215:2527(PC 투표한제안),
   215:14473(M 나의제안글), 215:14526(M 투표한제안) */
import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/format';
import { API_URL } from '../utils/api';
import { CAT_STYLES } from './catStyles';
import './MyProposals.css';

const DISTRICTS_ROW1 = ['부산전체','중구','서구','동구','영도구','부산진구','동래구','남구'];
const DISTRICTS_ROW2 = ['북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'];
const ALL_DISTRICTS = [...DISTRICTS_ROW1, ...DISTRICTS_ROW2];
const CATEGORIES = ['전체','주거','환경','교통','안전','교육','산업·일자리','문화·여가','보건·복지'];

/* 투표·댓글 아이콘 SVG (인라인, 아이콘 파일 없으므로) */
const VoteIcon = ({ active }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill={active ? '#23bdbb' : '#bfbfbf'} />
        <polyline points="7 12 11 16 17 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CommentIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#bfbfbf">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const MyProposals = ({ onBack, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'voted'
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    /* PC 필터 */
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('부산전체');
    const [selectedCategory, setSelectedCategory] = useState('전체');

    const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 1024;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) { setLoading(false); return; }
            try {
                const endpoint = activeTab === 'mine' ? 'my-proposals' : 'voted-proposals';
                const res = await fetch(`${API_URL}/api/reports/${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setProposals(data || []);
                }
            } catch { /* ignore */ }
            finally { setLoading(false); }
        };
        fetchData();
    }, [activeTab]);

    /* PC 필터링 */
    const filteredProposals = React.useMemo(() => {
        let list = [...proposals];
        if (selectedDistrict !== '부산전체') {
            list = list.filter(p => p.region && p.region.includes(selectedDistrict));
        }
        if (selectedCategory !== '전체') {
            const normCat = selectedCategory;
            list = list.filter(p => {
                const c = p.category || '';
                return c === normCat || c.replace('및 ', '·').replace(' 및 ', '·') === normCat;
            });
        }
        if (appliedSearch.trim()) {
            const q = appliedSearch.trim().toLowerCase();
            list = list.filter(p =>
                (p.title && p.title.toLowerCase().includes(q)) ||
                (p.content && p.content.toLowerCase().includes(q))
            );
        }
        return list;
    }, [proposals, selectedDistrict, selectedCategory, appliedSearch]);

    const getImageUrl = (item) => {
        if (!item.files || item.files.length === 0) return null;
        const f = item.files[0];
        if (!f || typeof f !== 'string') return null;
        if (f.startsWith('http') || f.startsWith('/assets/')) return f;
        if (f.startsWith('/uploads/')) return `${API_URL}${f}`;
        return `${API_URL}/uploads/${f}`;
    };

    const handleCardClick = (item) => {
        const imageUrl = getImageUrl(item);
        const payload = {
            ...item,
            description: item.content,
            author: item.nickname,
            date: formatDate(item.created_at),
            views: item.views_count,
            likes: item.likes_count,
            image: imageUrl,
            isMine: item.is_mine,
        };
        if (isMobile()) {
            onNavigate('mProposalDetail', payload);
        } else {
            onNavigate('pcMyProposalDetail', payload);
        }
    };

    const getCatStyle = (cat) => {
        const normalized = (cat || '').replace('및 ', '·').replace(' 및 ', '·').trim();
        return CAT_STYLES[normalized] || CAT_STYLES[cat] || { bg: '#eee', color: '#555' };
    };

    return (
        <div className="mp-container">
            {/* ── 모바일 헤더 ── */}
            <header className="mp-mobile-header">
                <button className="mp-back-btn" onClick={onBack} aria-label="뒤로가기">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            </header>

            {/* ── PC 페이지 제목 ── */}
            <h1 className="mp-pc-title">나의 제안</h1>

            {/* ── PC 필터 영역 ── */}
            <div className="mp-pc-filters">
                {/* 검색 */}
                <div className="mp-search-wrap">
                    <input
                        type="text"
                        className="mp-search-input"
                        placeholder="검색"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') setAppliedSearch(search); }}
                    />
                    <button className="mp-search-btn" onClick={() => setAppliedSearch(search)} aria-label="검색">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>
                </div>

                {/* 구군 필터 — 2행 pill */}
                <div className="mp-district-wrap">
                    <div className="mp-district-row">
                        {DISTRICTS_ROW1.map(d => (
                            <button
                                key={d}
                                className={`mp-district-pill${selectedDistrict === d ? ' active' : ''}`}
                                onClick={() => setSelectedDistrict(d)}
                            >{d}</button>
                        ))}
                    </div>
                    <div className="mp-district-row">
                        {DISTRICTS_ROW2.map(d => (
                            <button
                                key={d}
                                className={`mp-district-pill${selectedDistrict === d ? ' active' : ''}`}
                                onClick={() => setSelectedDistrict(d)}
                            >{d}</button>
                        ))}
                    </div>
                </div>

                {/* 카테고리 chips */}
                <div className="mp-category-row">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`mp-category-chip${selectedCategory === cat ? ' active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >{cat}</button>
                    ))}
                </div>
            </div>

            {/* ── 탭 스위처 ── */}
            <div className="mp-tabs-wrap">
                <div className="mp-tab-switcher">
                    <button
                        className={`mp-tab-btn${activeTab === 'mine' ? ' active' : ''}`}
                        onClick={() => setActiveTab('mine')}
                    >나의 제안글</button>
                    <button
                        className={`mp-tab-btn${activeTab === 'voted' ? ' active' : ''}`}
                        onClick={() => setActiveTab('voted')}
                    >투표한 제안</button>
                </div>
            </div>

            {/* ── 카드 목록 ── */}
            <div className="mp-card-list">
                {loading ? (
                    <p className="mp-empty">로딩 중...</p>
                ) : filteredProposals.length === 0 ? (
                    <p className="mp-empty">
                        {activeTab === 'mine' ? '아직 작성한 제안이 없습니다.' : '투표한 제안이 없습니다.'}
                    </p>
                ) : filteredProposals.map(item => {
                    const imageUrl = getImageUrl(item);
                    const catKey = (item.category || '').replace('및 ', '·').replace(' 및 ', '·').trim();
                    const catStyle = CAT_STYLES[catKey] || CAT_STYLES[item.category] || { bg: '#eee', color: '#555' };
                    const isActive = false; /* 현재 선택된 카드 하이라이트는 별도 상태로 관리 가능 */

                    return (
                        <div
                            key={item.id}
                            className="mp-card"
                            onClick={() => handleCardClick(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(item); }}
                        >
                            {/* 태그 행 */}
                            <div className="mp-card-tags">
                                {activeTab === 'mine' && item.region && (
                                    <span className="mp-tag-region">{item.region}</span>
                                )}
                                {item.category && (
                                    <span className="mp-tag-cat" style={{ background: catStyle.bg, color: catStyle.color }}>
                                        {item.category}
                                    </span>
                                )}
                            </div>

                            {/* 제목 */}
                            <h3 className="mp-card-title">{item.title}</h3>

                            {/* 하단: 작성자 + 썸네일 + 통계 */}
                            <div className="mp-card-bottom">
                                <span className="mp-card-author">{item.nickname || ''}</span>
                                <div className="mp-card-right">
                                    {imageUrl && (
                                        <img
                                            src={imageUrl}
                                            alt=""
                                            className="mp-card-thumb"
                                            loading="lazy"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="mp-card-stats">
                                        <span className="mp-stat">
                                            <VoteIcon active={!!item.has_voted} />
                                            <span>{item.likes_count ?? 0}</span>
                                        </span>
                                        <span className="mp-stat">
                                            <CommentIcon />
                                            <span>{item.comments_count ?? 0}</span>
                                        </span>
                                    </div>
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
