import { useState, useEffect, useRef, useMemo } from 'react';
import PCMapCanvas from './PCMapCanvas';
import MobileBottomNav from './MobileBottomNav';
import './MProposalList.css';
import './MProposalMap.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const REGIONS = ['부산전체', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'];
const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '산업·일자리', '문화·여가', '보건·복지'];
const SORTS = ['조회수', '투표순', '최신순'];
const CAT_STYLES = {
    '주거':       { bg: '#E0F4F1', color: '#2C9A8F' },
    '환경':       { bg: '#E5F3DA', color: '#5B8E2E' },
    '교통':       { bg: '#E0EAF7', color: '#2D5BA1' },
    '교육':       { bg: '#FAE2E5', color: '#C24656' },
    '안전':       { bg: '#FFE0DA', color: '#C2522E' },
    '산업·일자리':  { bg: '#FAEEDA', color: '#A07321' },
    '문화·여가':    { bg: '#EBE0F7', color: '#6E3FA1' },
    '보건·복지':    { bg: '#F5DDEC', color: '#A33780' },
};

// 부산 16개 구·군 중심 좌표 (DB region 문자열 → 핀 좌표 변환용)
const DISTRICT_CENTERS = {
    '중구': [35.1064, 129.0322], '서구': [35.0976, 129.0245], '동구': [35.1295, 129.0454],
    '영도구': [35.0915, 129.0680], '부산진구': [35.1626, 129.0531], '동래구': [35.1972, 129.0786],
    '남구': [35.1366, 129.0844], '북구': [35.1972, 129.0124], '해운대구': [35.1631, 129.1635],
    '사하구': [35.1042, 128.9745], '금정구': [35.2429, 129.0926], '강서구': [35.2123, 128.9805],
    '연제구': [35.1762, 129.0796], '수영구': [35.1452, 129.1133], '사상구': [35.1525, 128.9912],
    '기장군': [35.2444, 129.2222],
};

export default function MProposalMap({ onNavigate }) {
    const [region, setRegion] = useState('부산전체');
    const [regionOpen, setRegionOpen] = useState(false);
    const [regionDraft, setRegionDraft] = useState('부산전체');
    const [cat, setCat] = useState('전체');
    const [sort, setSort] = useState('최신순');
    const [sortDraft, setSortDraft] = useState('최신순');
    const [sortOpen, setSortOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [proposals, setProposals] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${VITE_API_URL}/api/reports/proposals`, { headers })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setProposals(Array.isArray(rows) ? rows : []))
            .catch(() => setProposals([]));
    }, []);

    const filtered = useMemo(() => {
        let arr = proposals;
        if (region && region !== '부산전체') arr = arr.filter((p) => p.region === region);
        if (cat && cat !== '전체') arr = arr.filter((p) => p.category === cat);
        return arr;
    }, [proposals, region, cat]);

    const PINS = useMemo(() => filtered
        .map((p) => {
            const c = DISTRICT_CENTERS[p.region];
            if (!c) return null;
            return { id: p.id, lat: c[0] + (Math.random() - 0.5) * 0.005, lng: c[1] + (Math.random() - 0.5) * 0.005, count: 1 };
        })
        .filter(Boolean), [filtered]);

    const ITEMS = useMemo(() => filtered.map((p) => ({
        id: p.id, cat: p.category, title: p.title,
        author: p.nickname || '익명',
        votes: p.likes_count || 0,
        comments: p.comments_count || 0,
        hasImage: Array.isArray(p.files) && p.files.length > 0,
    })), [filtered]);

    const openRegion = () => { setRegionDraft(region); setRegionOpen(true); };
    const openSort = () => { setSortDraft(sort); setSortOpen(true); };
    const confirmRegion = () => { setRegion(regionDraft); setRegionOpen(false); };
    const confirmSort = () => { setSort(sortDraft); setSortOpen(false); };

    const startYRef = useRef(0);
    const startTRef = useRef(0);
    const onTouchStart = (e) => {
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        startYRef.current = y;
        startTRef.current = Date.now();
    };
    const onTouchEnd = (e) => {
        const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const dy = y - startYRef.current;
        const dt = Date.now() - startTRef.current;
        if (Math.abs(dy) < 24 && dt < 250) {
            setExpanded((v) => !v);
            return;
        }
        if (dy < -40) setExpanded(true);
        else if (dy > 40) setExpanded(false);
    };

    return (
        <div className={`m-prop-map-page ${expanded ? 'expanded' : ''}`}>
            <div className="m-map-search-bar">
                <button className="m-map-back" onClick={() => onNavigate && onNavigate('home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span className="m-map-search-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input
                    type="text"
                    className="m-map-search"
                    placeholder="검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="m-map-canvas">
                <PCMapCanvas
                    pins={PINS.map((p) => ({ ...p, color: '#E6235A', title: `${p.count}건` }))}
                    accentColor="#E6235A"
                />
            </div>

            <div className={`m-map-sheet ${expanded ? 'expanded' : ''}`}>
                <div
                    className="m-sheet-grab"
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onTouchStart}
                    onMouseUp={onTouchEnd}
                >
                    <div className="m-sheet-handle" />
                </div>

                <div className="m-sheet-region-row">
                    <button
                        className="m-sheet-region-btn"
                        onClick={openRegion}
                        type="button"
                    >
                        <span>{region}</span>
                        <span className="m-region-arrow">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </span>
                    </button>
                    {!expanded ? (
                        <button
                            className="m-sheet-list-btn"
                            onClick={() => setExpanded(true)}
                            aria-label="목록 펼치기"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        </button>
                    ) : (
                        <button
                            className="m-map-toggle-btn"
                            onClick={() => setExpanded(false)}
                            type="button"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span>지도보기</span>
                        </button>
                    )}
                </div>

                <div className="m-cat-chips m-sheet-chips">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            className={`m-cat-chip ${cat === c ? 'on' : ''}`}
                            onClick={() => setCat(c)}
                        >{c}</button>
                    ))}
                </div>

                {expanded && (
                    <div className="m-sort-row">
                        <button className="m-sort-btn" onClick={openSort} type="button">
                            <span>{sort}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                    </div>
                )}

                <ul className="m-sheet-cards">
                    {ITEMS.map((it) => {
                        const style = CAT_STYLES[it.cat] || { bg: '#eee', color: '#555' };
                        return (
                            <li
                                key={it.id}
                                className="m-prop-card"
                                onClick={() => onNavigate && onNavigate('mProposalDetail', it)}
                            >
                                <div className="m-prop-card-text">
                                    <span className="m-prop-cat-tag" style={{ background: style.bg, color: style.color }}>{it.cat}</span>
                                    <h3 className="m-prop-title">{it.title}</h3>
                                    <p className="m-prop-author">{it.author}</p>
                                    <div className="m-prop-stats">
                                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg> {it.votes}</span>
                                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {it.comments}</span>
                                    </div>
                                </div>
                                {it.hasImage && <div className="m-prop-card-img" />}
                            </li>
                        );
                    })}
                </ul>

                {expanded && (
                    <button
                        className="m-prop-fab"
                        onClick={() => onNavigate && onNavigate('mProposalForm')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>제안하기</span>
                    </button>
                )}
            </div>

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

            <MobileBottomNav currentView="mProposalMap" onNavigate={onNavigate} />
        </div>
    );
}
