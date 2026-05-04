import { useState, useEffect, useMemo } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MProposalList.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const REGIONS = ['부산전체', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'];
const CATEGORIES = ['전체', '주거', '환경', '교통', '산업·일자리', '교육', '안전', '문화·여가', '보건·복지'];
const CAT_STYLES = {
    '주거':       { bg: '#E0F4F1', color: '#2C9A8F' },
    '환경':       { bg: '#E5F3DA', color: '#5B8E2E' },
    '교통':       { bg: '#E0EAF7', color: '#2D5BA1' },
    '산업·일자리':  { bg: '#FAEEDA', color: '#A07321' },
    '교육':       { bg: '#FAE2E5', color: '#C24656' },
    '안전':       { bg: '#FFE0DA', color: '#C2522E' },
    '문화·여가':    { bg: '#EBE0F7', color: '#6E3FA1' },
    '보건·복지':    { bg: '#F5DDEC', color: '#A33780' },
};

export default function MProposalList({ onNavigate }) {
    const [region, setRegion] = useState('부산전체');
    const [regionOpen, setRegionOpen] = useState(false);
    const [regionDraft, setRegionDraft] = useState('부산전체');
    const [cat, setCat] = useState('전체');
    const [sort, setSort] = useState('최신순');
    const [sortDraft, setSortDraft] = useState('최신순');
    const [sortOpen, setSortOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const SORTS = ['조회수', '투표순', '최신순'];

    useEffect(() => {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${VITE_API_URL}/api/reports/proposals`, { headers })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setItems(Array.isArray(rows) ? rows : []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    const visibleItems = useMemo(() => {
        let arr = items;
        if (region && region !== '부산전체') arr = arr.filter((p) => p.region === region);
        if (cat && cat !== '전체') arr = arr.filter((p) => p.category === cat);
        arr = [...arr];
        if (sort === '조회수') arr.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        else if (sort === '투표순') arr.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        else arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return arr;
    }, [items, region, cat, sort]);

    const openRegion = () => { setRegionDraft(region); setRegionOpen(true); };
    const openSort = () => { setSortDraft(sort); setSortOpen(true); };
    const confirmRegion = () => { setRegion(regionDraft); setRegionOpen(false); };
    const confirmSort = () => { setSort(sortDraft); setSortOpen(false); };

    return (
        <div className="m-prop-list-page">
            <header className="m-prop-topbar">
                <button className="m-prop-back" onClick={() => onNavigate && onNavigate('home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    <span>홈으로</span>
                </button>
                <button className="m-map-btn" onClick={() => onNavigate && onNavigate('mProposalMap')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>지도보기</span>
                </button>
            </header>

            <div className="m-region-row">
                <button className="m-region-btn" onClick={openRegion}>
                    <span>{region}</span>
                    <span className="m-region-arrow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </span>
                </button>
            </div>

            <div className="m-cat-chips">
                {CATEGORIES.map((c) => (
                    <button
                        key={c}
                        className={`m-cat-chip ${cat === c ? 'on' : ''}`}
                        onClick={() => setCat(c)}
                    >{c}</button>
                ))}
            </div>

            <div className="m-sort-row">
                <button className="m-sort-btn" onClick={openSort}>
                    <span>{sort}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
            </div>

            <ul className="m-prop-cards">
                {loading && <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>불러오는 중...</li>}
                {!loading && visibleItems.length === 0 && (
                    <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>조건에 맞는 제안이 없습니다.</li>
                )}
                {visibleItems.map((it) => {
                    const style = CAT_STYLES[it.category] || { bg: '#eee', color: '#555' };
                    const author = it.nickname || '익명';
                    const hasImage = Array.isArray(it.files) && it.files.length > 0;
                    return (
                        <li
                            key={it.id}
                            className="m-prop-card"
                            onClick={() => onNavigate && onNavigate('mProposalDetail', { ...it, cat: it.category, author, votes: it.likes_count, comments: it.comments_count })}
                        >
                            <div className="m-prop-card-text">
                                <span className="m-prop-cat-tag" style={{ background: style.bg, color: style.color }}>{it.category}</span>
                                <h3 className="m-prop-title">{it.title}</h3>
                                <p className="m-prop-author">{author}</p>
                                <div className="m-prop-stats">
                                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg> {it.likes_count ?? 0}</span>
                                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {it.comments_count ?? 0}</span>
                                </div>
                            </div>
                            {hasImage && <div className="m-prop-card-img" />}
                        </li>
                    );
                })}
            </ul>

            <button className="m-prop-fab" onClick={() => onNavigate && onNavigate('mProposalForm')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>제안하기</span>
            </button>

            {regionOpen && (
                <div className="m-modal-backdrop" onClick={() => setRegionOpen(false)}>
                    <div className="m-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="m-modal-head">
                            <h3 className="m-modal-title">위치 설정</h3>
                            <button className="m-modal-close" type="button" aria-label="닫기" onClick={() => setRegionOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <ul className="m-region-list">
                            {REGIONS.map((r) => (
                                <li key={r} className={`m-region-item ${regionDraft === r ? 'on' : ''}`} onClick={() => setRegionDraft(r)}>
                                    <span className="m-modal-chevron">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                    </span>
                                    <span>{r}</span>
                                </li>
                            ))}
                        </ul>
                        <button type="button" className="m-modal-confirm" onClick={confirmRegion}>선택</button>
                    </div>
                </div>
            )}

            {sortOpen && (
                <div className="m-modal-backdrop" onClick={() => setSortOpen(false)}>
                    <div className="m-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="m-modal-head">
                            <h3 className="m-modal-title">정렬</h3>
                            <button className="m-modal-close" type="button" aria-label="닫기" onClick={() => setSortOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <ul className="m-sort-list">
                            {SORTS.map((s) => (
                                <li key={s} className={`m-sort-item ${sortDraft === s ? 'on' : ''}`} onClick={() => setSortDraft(s)}>
                                    <span className="m-modal-chevron">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                    </span>
                                    <span>{s}</span>
                                </li>
                            ))}
                        </ul>
                        <button type="button" className="m-modal-confirm" onClick={confirmSort}>선택</button>
                    </div>
                </div>
            )}

            <MobileBottomNav currentView="mProposalList" onNavigate={onNavigate} />
        </div>
    );
}
