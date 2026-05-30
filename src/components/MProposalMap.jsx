import { useState, useMemo, useRef } from 'react';
import PCMapCanvas from './PCMapCanvas';
import MobileBottomNav from './MobileBottomNav';
import { CAT_STYLES } from './catStyles';
import { DISTRICT_CENTERS, REGIONS, SORTS } from '../constants/mapConstants';
import { useProposalsData } from '../hooks/useReportsData';
import { useSwipeSheet } from '../hooks/useSwipeSheet';
import { RegionSheet, SortSheet, MMapSearchBar } from './MFilterSheets';
import { useLazyImage } from '../hooks/useLazyImage';
import { thumbUrl, matchDistrict, nearestDistrict } from '../utils/format';
import './MProposalList.css';
import './MProposalMap.css';

function ProposalCard({ it, onNavigate }) {
    const style = CAT_STYLES[it.cat] || { bg: '#eee', color: '#555' };
    const { ref: imgRef, bgStyle } = useLazyImage(it.image, thumbUrl(it.image));
    return (
        <li className="m-prop-card" onClick={() => onNavigate?.('mProposalDetail', it)}>
            <div className="m-prop-card-text">
                <div className="m-report-tags">
                    <span className="m-prop-cat-tag" style={{ background: style.bg, color: style.color }}>{it.cat}</span>
                </div>
                <h3 className="m-prop-title">{it.title}</h3>
                <div className="m-report-author-stat-row">
                    <p className="m-prop-author">{it.author}</p>
                    <div className="m-prop-stats">
                        <span>
                            <img src="/figma-assets/icons/icon_heart.svg" alt="" width="13" height="11" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }} />
                            {it.votes ?? 0}
                        </span>
                        <span>
                            <img src="/figma-assets/icons/icon_comment.svg" alt="" width="13" height="11" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }} />
                            {it.comments ?? 0}
                        </span>
                    </div>
                </div>
            </div>
            {it.hasImage && <div ref={imgRef} className="m-prop-card-img has-image" style={bgStyle} />}
        </li>
    );
}

const CATEGORIES = ['전체', '주거', '환경', '교통', '산업·일자리', '교육', '안전', '문화·여가', '보건·복지'];

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
    const { snap, setSnap, onTouchStart, onTouchEnd } = useSwipeSheet('mid');
    const mapRef = useRef(null);

    const { proposals } = useProposalsData();

    const goToList = () => onNavigate?.('mProposalList');

    const filtered = useMemo(() => {
        let arr = proposals;
        if (region && region !== '부산전체') {
            arr = arr.filter((p) => {
                if (matchDistrict(p.region, region)) return true;
                const approx = nearestDistrict(p.lat, p.lng, DISTRICT_CENTERS);
                return matchDistrict(approx, region);
            });
        }
        if (cat && cat !== '전체') arr = arr.filter((p) => p.category === cat);
        return arr;
    }, [proposals, region, cat]);

    const PINS = useMemo(() => filtered.map((p) => {
        if (p.lat && p.lng) return { id: p.id, lat: p.lat, lng: p.lng };
        const c = DISTRICT_CENTERS[p.region] || [35.1796, 129.0756];
        const seed = typeof p.id === 'number' ? p.id : String(p.id).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
        const dlat = ((seed * 7919) % 1000 / 1000 - 0.5) * 0.005;
        const dlng = ((seed * 6271) % 1000 / 1000 - 0.5) * 0.005;
        return { id: p.id, lat: c[0] + dlat, lng: c[1] + dlng };
    }).filter(Boolean), [filtered]);

    const ITEMS = useMemo(() => {
        const sorted = [...filtered].sort((a, b) => {
            if (sort === '조회수') return (b.views_count || b.views || 0) - (a.views_count || a.views || 0);
            if (sort === '투표순') return (b.likes_count || b.vote_count || b.likes || 0) - (a.likes_count || a.vote_count || a.likes || 0);
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
        return sorted.map((p) => ({
            id: p.id, cat: p.category, title: p.title,
            author: p.nickname || '익명',
            votes: p.likes_count || 0,
            comments: p.comments_count || 0,
            hasImage: (Array.isArray(p.files) && p.files.length > 0) || !!p.image || !!p.image_url,
            image: Array.isArray(p.files) && p.files.length > 0 ? p.files[0] : (p.image || p.image_url || null),
        }));
    }, [filtered, sort]);

    const openRegion = () => { setRegionDraft(region); setRegionOpen(true); };
    const confirmRegion = () => { setRegion(regionDraft); setRegionOpen(false); };

    // 핀 선택 시 해당 카드만 표시
    const sheetItems = selectedPinId ? ITEMS.filter((it) => it.id === selectedPinId) : ITEMS;

    return (
        <div className="m-prop-map-page">
            <MMapSearchBar value={search} onChange={setSearch} onBack={() => onNavigate?.('home')} placeholder="검색" showBack={false} />

            <div className="m-map-canvas">
                <PCMapCanvas
                    ref={mapRef}
                    pins={PINS.map((p) => ({ ...p, color: '#E6235A' }))}
                    accentColor="#E6235A"
                    onPinClick={(pin) => { setSelectedPinId(pin.id); setSnap('mid'); }}
                    selectedDistrict={region !== '부산전체' ? region : null}
                />
            </div>

            {/* 내 위치 FAB */}
            <button
                type="button"
                className="m-locate-fab"
                data-snap={snap}
                onClick={() => mapRef.current?.locateMe?.()}
                aria-label="내 위치"
                title="내 위치"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="12" y1="2" x2="12" y2="5"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="5" y2="12"/>
                    <line x1="19" y1="12" x2="22" y2="12"/>
                </svg>
            </button>

            {/* 바텀시트 — 2-snap (collapsed/mid). 위로 더 펼치려면 List 페이지로 navigate */}
            <div className="m-map-sheet" data-snap={snap}>
                <div
                    className="m-sheet-grab"
                    onTouchStart={onTouchStart}
                    onTouchEnd={(e) => onTouchEnd(e, { onSwipeUpAtTop: goToList })}
                    onMouseDown={onTouchStart}
                    onMouseUp={(e) => onTouchEnd(e, { onSwipeUpAtTop: goToList })}
                >
                    <div className="m-sheet-handle" />
                </div>

                <div className="m-sheet-scroll">
                    <div className="m-sheet-region-row">
                        <button type="button" className="m-sheet-region-btn" onClick={openRegion}>
                            <span>{region}</span>
                            <span className="m-region-arrow">
                                <svg width="5" height="9" viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L4.5 4.5L1 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                        </button>
                        <button type="button" className="m-sheet-list-btn" onClick={goToList} aria-label="목록 보기">
                            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="0" y1="1" x2="18" y2="1" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="0" y1="6" x2="18" y2="6" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="0" y1="11" x2="18" y2="11" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>

                    <div className="m-cat-chips m-sheet-chips">
                        {CATEGORIES.map((c) => (
                            <button key={c} type="button"
                                className={`m-cat-chip ${cat === c ? 'on' : ''}`}
                                onClick={() => setCat(c)}
                            >{c}</button>
                        ))}
                    </div>

                    <ul className="m-sheet-cards">
                        {sheetItems.map((it) => (
                            <ProposalCard key={it.id} it={it} onNavigate={onNavigate} />
                        ))}
                    </ul>
                </div>
            </div>

            {regionOpen && <RegionSheet regions={REGIONS} draft={regionDraft} onSelect={setRegionDraft} onConfirm={confirmRegion} onClose={() => setRegionOpen(false)} />}
            {sortOpen && <SortSheet sorts={SORTS} draft={sortDraft} onSelect={setSortDraft} onConfirm={() => { setSort(sortDraft); setSortOpen(false); }} onClose={() => setSortOpen(false)} />}

            <MobileBottomNav currentView="mProposalMap" onNavigate={onNavigate} />
        </div>
    );
}
