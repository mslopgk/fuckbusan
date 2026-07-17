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
                            <img src="/figma-assets/icons/icon_vote_check.png" alt="" width="12" height="12" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 3, opacity: 0.3 }} />
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

const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

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
    const { snap, setSnap, dragY, dragging, onTouchStart, onTouchMove, onTouchEnd } = useSwipeSheet('mid');
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
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            // 검색 대상: 제목/내용/작성자 + 주소(지역구)·항목(카테고리) — QA: 주소/항목 검색 무반응 수정
            arr = arr.filter((p) =>
                [p.title, p.content, p.body, p.nickname, p.region, p.address,
                 p.category, p.sub_category]
                    .some((v) => v && String(v).toLowerCase().includes(q))
            );
        }
        return arr;
    }, [proposals, region, cat, search]);

    // Figma 302:17609~ — 단건도 숫자 배지 핀으로 통일 (teardrop 금지, count:1)
    const PINS = useMemo(() => filtered.map((p) => {
        if (p.lat && p.lng) return { id: p.id, lat: p.lat, lng: p.lng, count: 1 };
        const c = DISTRICT_CENTERS[p.region] || [35.1796, 129.0756];
        const seed = typeof p.id === 'number' ? p.id : String(p.id).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
        const dlat = ((seed * 7919) % 1000 / 1000 - 0.5) * 0.005;
        const dlng = ((seed * 6271) % 1000 / 1000 - 0.5) * 0.005;
        return { id: p.id, lat: c[0] + dlat, lng: c[1] + dlng, count: 1 };
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
            {/* 뒤로가기는 검색바 내부 back 하나로 통일 (MReportMap과 동일 패턴, 중복 제거) */}
            <MMapSearchBar value={search} onChange={setSearch} onBack={() => onNavigate?.('mProposalList')} placeholder="검색" showBack={true} />

            <div className="m-map-canvas">
                <PCMapCanvas
                    ref={mapRef}
                    pins={PINS.map((p) => ({ ...p, color: '#f74e7e' }))}
                    accentColor="#f74e7e"
                    onPinClick={(pin) => { setSelectedPinId(pin.id); setSnap('mid'); }}
                    onMapClick={() => { if (selectedPinId) setSelectedPinId(null); }}
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
                {/* Figma 302:17598 export — 크로스헤어 서클 24x24 */}
                <img src="/figma-assets/mobile-propose/locate_circle.png" alt="" width="24" height="24" />
            </button>

            {/* 바텀시트 — 2-snap (collapsed/mid). 위로 더 펼치려면 List 페이지로 navigate */}
            <div
                className={`m-map-sheet${dragging ? ' dragging' : ''}`}
                data-snap={snap}
                style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
            >
                <div
                    className="m-sheet-grab"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={(e) => onTouchEnd(e, { onSwipeUpAtTop: goToList })}
                    onMouseDown={onTouchStart}
                    onMouseMove={onTouchMove}
                    onMouseUp={(e) => onTouchEnd(e, { onSwipeUpAtTop: goToList })}
                    onMouseLeave={(e) => dragging && onTouchEnd(e, { onSwipeUpAtTop: goToList })}
                >
                    {/* Figma 302:17629 export — 18x12 2줄 핸들 */}
                    <img className="m-sheet-handle" src="/figma-assets/mobile-propose/sheet_handle.png" alt="" width="18" height="12" draggable="false" />
                </div>

                <div className="m-sheet-scroll">
                    <div className="m-sheet-region-row">
                        {/* Figma 302:17596 — 지역명 22/700 + 핑크 원형 화살표 24 (목록 버튼 없음) */}
                        <button type="button" className="m-sheet-region-btn" onClick={openRegion}>
                            <span>{region}</span>
                            <span className="m-region-arrow">
                                <img src="/figma-assets/mobile-propose/region_chevron.png" alt="" width="7" height="10" />
                            </span>
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

            {/* 제안하기 FAB — Figma 302:17815 (pink pill 98x36, nav 위 우측) */}
            <button type="button" className="m-prop-fab" onClick={() => onNavigate?.('mProposalForm')}>
                <img src="/figma-assets/mobile-propose/fab_plus.png" alt="" width="13" height="13" />
                <span>제안하기</span>
            </button>

            {regionOpen && <RegionSheet accent="#f74e7e" regions={REGIONS} draft={regionDraft} onSelect={setRegionDraft} onConfirm={confirmRegion} onClose={() => setRegionOpen(false)} />}
            {sortOpen && <SortSheet accent="#f74e7e" sorts={SORTS} draft={sortDraft} onSelect={setSortDraft} onConfirm={() => { setSort(sortDraft); setSortOpen(false); }} onClose={() => setSortOpen(false)} />}

            <MobileBottomNav currentView="mProposalMap" onNavigate={onNavigate} />
        </div>
    );
}
