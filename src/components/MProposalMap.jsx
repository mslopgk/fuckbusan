import { useState, useMemo } from 'react';
import PCMapCanvas from './PCMapCanvas';
import MobileBottomNav from './MobileBottomNav';
import { CAT_STYLES } from './catStyles';
import { DISTRICT_CENTERS, REGIONS, SORTS } from '../constants/mapConstants';
import { useProposalsData } from '../hooks/useReportsData';
import { useSwipeSheet } from '../hooks/useSwipeSheet';
import { RegionSheet, SortSheet, MMapSearchBar } from './MFilterSheets';
import { useLazyImage } from '../hooks/useLazyImage';
import './MProposalList.css';
import './MProposalMap.css';

function ProposalCard({ it, onNavigate }) {
    const style = CAT_STYLES[it.cat] || { bg: '#eee', color: '#555' };
    const { ref: imgRef, bgStyle } = useLazyImage(it.image);
    return (
        <li
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
            {it.hasImage && <div ref={imgRef} className="m-prop-card-img" style={bgStyle} />}
        </li>
    );
}

const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '산업·일자리', '문화·여가', '보건·복지'];

export default function MProposalMap({ onNavigate }) {
    const [region, setRegion] = useState('부산전체');
    const [regionOpen, setRegionOpen] = useState(false);
    const [regionDraft, setRegionDraft] = useState('부산전체');
    const [cat, setCat] = useState('전체');
    const [sort, setSort] = useState('최신순');
    const [sortDraft, setSortDraft] = useState('최신순');
    const [sortOpen, setSortOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedPinId, setSelectedPinId] = useState(null);
    const { expanded, setExpanded, onTouchStart, onTouchEnd } = useSwipeSheet();

    const { proposals } = useProposalsData();

    const filtered = useMemo(() => {
        let arr = proposals;
        if (region && region !== '부산전체') arr = arr.filter((p) => p.region === region);
        if (cat && cat !== '전체') arr = arr.filter((p) => p.category === cat);
        return arr;
    }, [proposals, region, cat]);

    const BUSAN_CENTER = [35.1796, 129.0756];
    const PINS = useMemo(() => filtered
        .map((p) => {
            if (p.lat && p.lng) return { id: p.id, lat: p.lat, lng: p.lng };
            const c = DISTRICT_CENTERS[p.region] || BUSAN_CENTER;
            const seed = typeof p.id === 'number' ? p.id : String(p.id).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
            const dlat = ((seed * 7919) % 1000 / 1000 - 0.5) * 0.005;
            const dlng = ((seed * 6271) % 1000 / 1000 - 0.5) * 0.005;
            return { id: p.id, lat: c[0] + dlat, lng: c[1] + dlng };
        })
        .filter(Boolean), [filtered]);

    const ITEMS = useMemo(() => {
        const sorted = [...filtered].sort((a, b) => {
            if (sort === '조회수') return (b.views_count || b.views || 0) - (a.views_count || a.views || 0);
            if (sort === '투표순') return (b.likes_count || b.vote_count || b.likes || 0) - (a.likes_count || a.vote_count || a.likes || 0);
            // 최신순 (default)
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
        return sorted.map((p) => ({
            id: p.id, cat: p.category, title: p.title,
            author: p.nickname || '익명',
            votes: p.likes_count || 0,
            comments: p.comments_count || 0,
            hasImage: (Array.isArray(p.files) && p.files.length > 0) || !!p.image || !!p.image_url,
            image: (Array.isArray(p.files) && p.files.length > 0) ? p.files[0] : (p.image || p.image_url || null),
        }));
    }, [filtered, sort]);

    const openRegion = () => { setRegionDraft(region); setRegionOpen(true); };
    const openSort = () => { setSortDraft(sort); setSortOpen(true); };
    const confirmRegion = () => { setRegion(regionDraft); setRegionOpen(false); };
    const confirmSort = () => { setSort(sortDraft); setSortOpen(false); };


    return (
        <div className={`m-prop-map-page ${expanded ? 'expanded' : ''}`}>
            <MMapSearchBar value={search} onChange={setSearch} onBack={() => onNavigate?.('home')} />

            <div className="m-map-canvas">
                <PCMapCanvas
                    pins={PINS.map((p) => ({ ...p, color: '#E6235A' }))}
                    accentColor="#E6235A"
                    onPinClick={(pin) => { setSelectedPinId(pin.id); setExpanded(false); }}
                    showLocateBtn
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
                    {(!expanded && selectedPinId
                        ? ITEMS.filter((it) => it.id === selectedPinId)
                        : ITEMS
                    ).map((it) => (
                        <ProposalCard key={it.id} it={it} onNavigate={onNavigate} />
                    ))}
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

            {regionOpen && <RegionSheet regions={REGIONS} draft={regionDraft} onSelect={setRegionDraft} onConfirm={confirmRegion} onClose={() => setRegionOpen(false)} />}
            {sortOpen && <SortSheet sorts={SORTS} draft={sortDraft} onSelect={setSortDraft} onConfirm={confirmSort} onClose={() => setSortOpen(false)} />}

            <MobileBottomNav currentView="mProposalMap" onNavigate={onNavigate} />
        </div>
    );
}
