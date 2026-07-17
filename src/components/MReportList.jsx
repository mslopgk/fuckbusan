import { useState, useEffect, useCallback, useRef } from 'react';

const PAGE_SIZE = 25;
const SORT_API = { '최신순': 'latest', '조회수': 'views', '투표순': 'votes' };
import MobileBottomNav from './MobileBottomNav';
import { CAT_STYLES } from './catStyles';
import { REGIONS, SORTS, REPORT_STAGES as STAGES, DISTRICT_CENTERS } from '../constants/mapConstants';
import { RegionSheet, SortSheet } from './MFilterSheets';
import { API_URL } from '../utils/api';
import { useLazyImage } from '../hooks/useLazyImage';
import { thumbUrl, matchDistrict, nearestDistrict } from '../utils/format';
import './MProposalList.css';
import './MReportList.css';

function ReportListCard({ it, likedIds, onNavigate, onToggleLike }) {
    const style = CAT_STYLES[it.category] || { bg: '#eee', color: '#555' };
    const { ref: imgRef, bgStyle } = useLazyImage(it.image, thumbUrl(it.image));
    return (
        <li
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
                            onClick={(e) => onToggleLike(e, it.id)}
                            style={{ cursor: 'pointer', color: likedIds.has(it.id) ? '#542aa3' : '#bfbfbf' }}
                        >
                            {/* Figma heart icon (Union path) */}
                            <svg width="15" height="12" viewBox="0 0 15.3587 12.2297" fill="currentColor" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}>
                                <path d="M9.0568 1.0811C10.4983 -0.360439 12.8359 -0.360292 14.2775 1.0811C15.7191 2.52272 15.7191 4.86019 14.2775 6.30181L8.78141 11.7989C8.47833 12.102 8.07586 12.2441 7.67887 12.2286C7.2822 12.2438 6.88013 12.1017 6.57731 11.7989L1.08121 6.30181C-0.360404 4.86019 -0.360404 2.52272 1.08121 1.0811C2.52285 -0.360296 4.86037 -0.36044 6.30192 1.0811L7.67887 2.45806L9.0568 1.0811Z"/>
                            </svg>
                            {it.likes ?? 0}
                        </span>
                        <span>
                            {/* Figma comment bubble icon (Union path) */}
                            <svg width="14" height="12" viewBox="0 0 14 11.8457" fill="currentColor" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}>
                                <path d="M9.1543 0C11.8305 0.000244114 14 2.1694 14 4.8457C14 7.52201 11.8305 9.69116 9.1543 9.69141H6.5127L3.23047 11.8457V9.41406C1.34871 8.74853 4.44368e-08 6.95541 0 4.8457C0 2.1694 2.16945 0.000244114 4.8457 0H9.1543Z"/>
                            </svg>
                            {it.comments ?? 0}
                        </span>
                    </div>
                </div>
            </div>
            {it.image && <div ref={imgRef} className="m-prop-card-img" style={bgStyle} />}
        </li>
    );
}

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
    const [items, setItems] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [likedIds, setLikedIds] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('likedReportIds') || '[]')); } catch { return new Set(); }
    });
    const [loading, setLoading] = useState(true);
    const fetchGenRef = useRef(0);

    // 목록: 필터/정렬 변경 시 page 1부터 재로드. region은 클라이언트에서 매칭 (DB region 일관성 부족).
    useEffect(() => {
        const gen = ++fetchGenRef.current;
        const stageDef = STAGES.find((s) => s.key === stage);
        const params = new URLSearchParams({ page: 1, size: PAGE_SIZE, sort: SORT_API[sort] || 'latest' });
        if (cat && cat !== '전체') params.set('category', cat);
        if (stageDef) params.set('status', stageDef.apiValue);
        setLoading(true);
        setItems([]);
        setHasMore(true);
        fetch(`${API_URL}/api/reports/full?${params.toString()}`)
            .then((r) => (r.ok ? r.json() : { items: [], has_more: false }))
            .then((data) => {
                if (gen !== fetchGenRef.current) return;
                const list = data.items ?? data;
                setItems(Array.isArray(list) ? list : []);
                setHasMore(data.has_more ?? false);
            })
            .catch(() => setItems([]))
            .finally(() => { if (gen === fetchGenRef.current) setLoading(false); });
    }, [cat, stage, sort]);

    const loadMore = useCallback(() => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        setItems((prev) => {
            const nextPage = Math.floor(prev.length / PAGE_SIZE) + 1;
            const stageDef = STAGES.find((s) => s.key === stage);
            const params = new URLSearchParams({ page: nextPage, size: PAGE_SIZE, sort: SORT_API[sort] || 'latest' });
            if (cat && cat !== '전체') params.set('category', cat);
            if (stageDef) params.set('status', stageDef.apiValue);
            fetch(`${API_URL}/api/reports/full?${params.toString()}`)
                .then((r) => (r.ok ? r.json() : { items: [] }))
                .then((data) => {
                    const newItems = data.items ?? data;
                    setItems((p) => [...p, ...(Array.isArray(newItems) ? newItems : [])]);
                    setHasMore(data.has_more ?? false);
                })
                .finally(() => setLoadingMore(false));
            return prev;
        });
    }, [hasMore, loadingMore, cat, stage, sort]);

    const handleScroll = useCallback((e) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 250) loadMore();
    }, [loadMore]);

    const openRegion = () => { setRegionDraft(region); setRegionOpen(true); };
    const openSort = () => { setSortDraft(sort); setSortOpen(true); };
    const confirmRegion = () => { setRegion(regionDraft); setRegionOpen(false); };
    const confirmSort = () => { setSort(sortDraft); setSortOpen(false); };

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
                await fetch(`${API_URL}/api/reports/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            } catch (_) {}
        }
    };

    return (
        <div className="m-report-list-page">
            <header className="m-prop-topbar">
                <button className="m-prop-back m-rlist-back" onClick={() => onNavigate && onNavigate('home')} aria-label="뒤로">
                    <img src="/figma-assets/icons/icon_arrow_back.svg" alt="" width="24" height="24" />
                </button>
                <button className="m-map-btn" onClick={() => onNavigate && onNavigate('mReportMap')}>
                    <img src="/figma-assets/icons/icon_location_pin.svg" alt="" width="17" height="23" />
                    <span>지도보기</span>
                </button>
            </header>

            {/* 지역 선택 행 — 지역명 + 보라 원형 화살표 (Figma 302:15921) */}
            <div className="m-region-row">
                <button type="button" className="m-region-btn" onClick={openRegion}>
                    <span>{region}</span>
                    <span className="m-region-arrow">
                        <img src="/figma-assets/mobile-report/region_chevron.png" alt="" width="7" height="10" />
                    </span>
                </button>
            </div>

            <div className="m-rlist-scroll" onScroll={handleScroll}>
                {/* 카테고리 칩 — 2행 wrap (Figma 302:15921) */}
                <div className="m-cat-chips">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={`m-cat-chip${cat === c ? ' on' : ''}`}
                            onClick={() => setCat(c)}
                        >{c}</button>
                    ))}
                </div>

                <div className="m-sort-row">
                    <button className="m-sort-btn" onClick={openSort}>
                        <span>{sort}</span>
                        <img src="/figma-assets/icons/icon_sort_chevron.svg" alt="" width="9" height="5" />
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

                <ul className="m-prop-cards m-rlist-cards">
                    {(() => {
                        const regionFilter = region && region !== '부산전체' ? region : null;
                        const filtered = !regionFilter ? items : items.filter((it) => {
                            if (matchDistrict(it.region, regionFilter)) return true;
                            const approx = nearestDistrict(it.lat, it.lng, DISTRICT_CENTERS);
                            return matchDistrict(approx, regionFilter);
                        });
                        return (
                            <>
                                {loading && <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>불러오는 중...</li>}
                                {!loading && filtered.length === 0 && (
                                    <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>조건에 맞는 제보가 없습니다.</li>
                                )}
                                {filtered.map((it) => (
                                    <ReportListCard
                                        key={it.id}
                                        it={it}
                                        likedIds={likedIds}
                                        onNavigate={onNavigate}
                                        onToggleLike={toggleLike}
                                    />
                                ))}
                                {loadingMore && <li style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '13px' }}>불러오는 중...</li>}
                            </>
                        );
                    })()}
                </ul>
            </div>

            <button className="m-prop-fab m-rlist-fab" onClick={() => onNavigate && onNavigate('mReportForm')}>
                <img src="/figma-assets/mobile-report/fab_plus.png" alt="" width="13" height="13" />
                <span>제보하기</span>
            </button>

            {regionOpen && <RegionSheet accent="#542aa3" regions={REGIONS} draft={regionDraft} onSelect={setRegionDraft} onConfirm={confirmRegion} onClose={() => setRegionOpen(false)} />}
            {sortOpen && <SortSheet accent="#542aa3" sorts={SORTS} draft={sortDraft} onSelect={setSortDraft} onConfirm={confirmSort} onClose={() => setSortOpen(false)} />}

            <MobileBottomNav currentView="mReportList" onNavigate={onNavigate} />
        </div>
    );
}
