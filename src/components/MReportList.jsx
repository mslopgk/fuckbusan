import { useState, useEffect, useMemo } from 'react';
import MobileBottomNav from './MobileBottomNav';
import PCMapCanvas from './PCMapCanvas';
import { CAT_STYLES } from './catStyles';
import { REGIONS, SORTS, REPORT_STAGES as STAGES } from '../constants/mapConstants';
import { RegionSheet, SortSheet } from './MFilterSheets';
import './MProposalList.css';
import './MReportList.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

export default function MReportList({ onNavigate }) {
    const [region, setRegion] = useState('부산전체');
    const [regionOpen, setRegionOpen] = useState(false);
    const [regionDraft, setRegionDraft] = useState('부산전체');
    const [cat, setCat] = useState('전체');
    const [stage, setStage] = useState('inProgress');
    const [sort, setSort] = useState('최신순');
    const [sortDraft, setSortDraft] = useState('최신순');
    const [sortOpen, setSortOpen] = useState(false);
    const [listOpen, setListOpen] = useState(true);
    const [items, setItems] = useState([]);
    const [likedIds, setLikedIds] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('likedReportIds') || '[]')); } catch { return new Set(); }
    });
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        const params = new URLSearchParams();
        if (region && region !== '부산전체') params.set('region', region);
        if (cat && cat !== '전체') params.set('category', cat);
        const stageDef = STAGES.find((s) => s.key === stage);
        if (stageDef) params.set('status', stageDef.apiValue);
        setLoading(true);
        fetch(`${VITE_API_URL}/api/reports/full?${params.toString()}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setItems(Array.isArray(rows) ? rows : []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [region, cat, stage]);

    const sortedItems = useMemo(() => {
        const arr = [...items];
        if (sort === '조회수') arr.sort((a, b) => (b.views || 0) - (a.views || 0));
        else if (sort === '투표순') arr.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        return arr;
    }, [items, sort]);

    const openRegion = () => { setRegionDraft(region); setRegionOpen(true); };
    const openSort = () => { setSortDraft(sort); setSortOpen(true); };
    const confirmRegion = () => { setRegion(regionDraft); setRegionOpen(false); };
    const confirmSort = () => { setSort(sortDraft); setSortOpen(false); };

    const mapPins = useMemo(() =>
        items
            .filter((it) => it.lat && it.lng)
            .map((it) => ({ id: String(it.id), lat: it.lat, lng: it.lng, color: '#E6235A', title: it.title })),
        [items]
    );

    const toggleLike = async (e, id) => {
        e.stopPropagation();
        const token = localStorage.getItem('access_token');
        const isLiked = likedIds.has(id);
        const next = new Set(likedIds);
        if (isLiked) next.delete(id); else next.add(id);
        setLikedIds(next);
        localStorage.setItem('likedReportIds', JSON.stringify([...next]));
        setItems((prev) => prev.map((it) => it.id === id ? { ...it, likes: (it.likes ?? 0) + (isLiked ? -1 : 1) } : it));
        if (token) {
            try {
                await fetch(`${VITE_API_URL}/api/reports/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            } catch (_) {}
        }
    };

    return (
        <div className="m-prop-list-page m-report-list-page">
            <header className="m-prop-topbar">
                <button className="m-prop-back" onClick={() => onNavigate && onNavigate('home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    <span>홈으로</span>
                </button>
                <button className="m-map-btn" onClick={() => onNavigate && onNavigate('mReportMap')}>
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

            <div className="m-prop-page-body">
            {/* Map layer — always rendered, visible when list is collapsed */}
            <div className="m-prop-map-layer">
                <PCMapCanvas
                    pins={mapPins}
                    accentColor="#E6235A"
                    initialCenter={{ lat: 35.1631, lng: 129.1638 }}
                    initialLevel={8}
                    showLocateBtn
                />
            </div>

            {/* Sliding list panel */}
            <div className={`m-prop-list-panel${listOpen ? '' : ' collapsed'}`}>
                <div className="m-prop-panel-handle" onClick={() => setListOpen(!listOpen)}>
                    <div className="m-prop-handle-bar" />
                    <span className="m-prop-panel-handle-label">
                        {listOpen ? '지도만 보기' : '목록 보기'}
                    </span>
                </div>

                <div className="m-prop-list-content">
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
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                    </div>

                    <div className="m-stage-chips">
                        {STAGES.map((s) => (
                            <button
                                key={s.key}
                                className={`m-stage-chip ${stage === s.key ? 'on' : ''}`}
                                onClick={() => setStage(s.key)}
                            >{s.label}</button>
                        ))}
                    </div>

                    <ul className="m-prop-cards">
                        {loading && <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>불러오는 중...</li>}
                        {!loading && sortedItems.length === 0 && (
                            <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>조건에 맞는 제보가 없습니다.</li>
                        )}
                        {sortedItems.map((it) => {
                            const style = CAT_STYLES[it.category] || { bg: '#eee', color: '#555' };
                            return (
                                <li
                                    key={it.id}
                                    className="m-prop-card"
                                    onClick={() => onNavigate && onNavigate('mReportDetail', { ...it, cat: it.category, sub: it.sub_category })}
                                >
                                    <div className="m-prop-card-text">
                                        <div className="m-report-tags">
                                            <span className="m-prop-cat-tag" style={{ background: style.bg, color: style.color }}>{it.category}</span>
                                            {it.sub_category && <span className="m-report-sub-tag">{it.sub_category}</span>}
                                        </div>
                                        <h3 className="m-prop-title">{it.title}</h3>
                                        <div className="m-report-author-stat-row">
                                            <p className="m-prop-author">{it.author || '익명'}</p>
                                            <div className="m-prop-stats">
                                                <span
                                                    onClick={(e) => toggleLike(e, it.id)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill={likedIds.has(it.id) ? '#E6235A' : 'none'} stroke={likedIds.has(it.id) ? '#E6235A' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}>
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                                    </svg>
                                                    {it.likes ?? 0}
                                                </span>
                                                <span>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}>
                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                                    </svg>
                                                    {it.comments ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {it.image && <div className="m-prop-card-img" style={{ backgroundImage: `url(${it.image})` }} />}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            </div>{/* end m-prop-page-body */}

            <button className="m-prop-fab" onClick={() => onNavigate && onNavigate('mReportForm')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>제보하기</span>
            </button>

            {regionOpen && <RegionSheet regions={REGIONS} draft={regionDraft} onSelect={setRegionDraft} onConfirm={confirmRegion} onClose={() => setRegionOpen(false)} />}
            {sortOpen && <SortSheet sorts={SORTS} draft={sortDraft} onSelect={setSortDraft} onConfirm={confirmSort} onClose={() => setSortOpen(false)} />}

            <MobileBottomNav currentView="mReportList" onNavigate={onNavigate} />
        </div>
    );
}
