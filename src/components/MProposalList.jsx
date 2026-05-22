import { useState, useEffect, useCallback, useRef } from 'react';

const PAGE_SIZE = 25;
const SORT_API = { '최신순': 'latest', '조회수': 'views', '투표순': 'votes' };
import MobileBottomNav from './MobileBottomNav';
import PCMapCanvas from './PCMapCanvas';
import { CAT_STYLES } from './catStyles';
import { REGIONS, SORTS } from '../constants/mapConstants';
import { RegionSheet, SortSheet } from './MFilterSheets';
import { API_URL } from '../utils/api';
import { useLazyImage } from '../hooks/useLazyImage';
import './MProposalList.css';

function ProposalListCard({ it, onNavigate }) {
    const style = CAT_STYLES[it.category] || { bg: '#eee', color: '#555' };
    const nickname = it.nickname || '익명';
    const author = it.region ? `${it.region} ${nickname}` : nickname;
    const imageUrl = Array.isArray(it.files) && it.files.length > 0 ? it.files[0] : null;
    const { ref: imgRef, bgStyle } = useLazyImage(imageUrl);
    const hasImage = Array.isArray(it.files) && it.files.length > 0;
    return (
        <li
            className="m-prop-card"
            onClick={() => onNavigate && onNavigate('mProposalDetail', { ...it, cat: it.category, author, votes: it.likes_count, comments: it.comments_count })}
        >
            <div className="m-prop-card-text">
                <div className="m-report-tags">
                    <span className="m-prop-cat-tag" style={{ background: style.bg, color: style.color }}>{it.category}</span>
                    {it.sub_category && <span className="m-report-sub-tag">{it.sub_category}</span>}
                </div>
                <h3 className="m-prop-title">{it.title}</h3>
                <div className="m-report-author-stat-row">
                    <p className="m-prop-author">{author}</p>
                    <div className="m-prop-stats">
                        <span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}>
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {it.likes_count ?? 0}
                        </span>
                        <span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            {it.comments_count ?? 0}
                        </span>
                    </div>
                </div>
            </div>
            <div ref={hasImage ? imgRef : undefined} className={`m-prop-card-img${hasImage ? ' has-image' : ' no-image'}`} style={hasImage ? bgStyle : undefined} />
        </li>
    );
}

const CATEGORIES = ['전체', '주거', '환경', '교통', '산업·일자리', '교육', '안전', '문화·여가', '보건·복지'];

export default function MProposalList({ onNavigate }) {
    const [region, setRegion] = useState('부산전체');
    const [regionOpen, setRegionOpen] = useState(false);
    const [regionDraft, setRegionDraft] = useState('부산전체');
    const [cat, setCat] = useState('전체');
    const [sort, setSort] = useState('최신순');
    const [sortDraft, setSortDraft] = useState('최신순');
    const [sortOpen, setSortOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [listOpen, setListOpen] = useState(true);
    const [mapPins, setMapPins] = useState([]);
    const fetchGenRef = useRef(0);

    // 지도 핀: 전체 좌표만 별도 1회 로드
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${API_URL}/api/reports/proposal-pins`, { headers })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setMapPins(
                (Array.isArray(rows) ? rows : []).map((r) => ({
                    id: String(r.id), lat: r.lat, lng: r.lng, color: '#E6235A', title: r.category || ''
                }))
            ))
            .catch(() => {});
    }, []);

    // 목록: 필터/정렬 변경 시 page 1부터 재로드 (서버사이드 필터+정렬)
    useEffect(() => {
        const gen = ++fetchGenRef.current;
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams({ skip: 0, limit: PAGE_SIZE, sort: SORT_API[sort] || 'latest' });
        if (region && region !== '부산전체') params.set('region', region);
        if (cat && cat !== '전체') params.set('category', cat);
        setLoading(true);
        setItems([]);
        setHasMore(true);
        fetch(`${API_URL}/api/reports/proposals?${params.toString()}`, { headers })
            .then((r) => (r.ok ? r.json() : { items: [], has_more: false }))
            .then((data) => {
                if (gen !== fetchGenRef.current) return;
                setItems(Array.isArray(data) ? data : (data.items ?? []));
                setHasMore(data.has_more ?? false);
            })
            .catch(() => setItems([]))
            .finally(() => { if (gen === fetchGenRef.current) setLoading(false); });
    }, [region, cat, sort]);

    const loadMore = useCallback(() => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        setItems((prev) => {
            const params = new URLSearchParams({ skip: prev.length, limit: PAGE_SIZE, sort: SORT_API[sort] || 'latest' });
            if (region && region !== '부산전체') params.set('region', region);
            if (cat && cat !== '전체') params.set('category', cat);
            fetch(`${API_URL}/api/reports/proposals?${params.toString()}`, { headers })
                .then((r) => (r.ok ? r.json() : { items: [] }))
                .then((data) => {
                    const newItems = Array.isArray(data) ? data : (data.items ?? []);
                    setItems((p) => [...p, ...newItems]);
                    setHasMore(data.has_more ?? false);
                })
                .finally(() => setLoadingMore(false));
            return prev;
        });
    }, [hasMore, loadingMore, region, cat, sort]);

    const handleScroll = useCallback((e) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 250) loadMore();
    }, [loadMore]);

    const openRegion = () => { setRegionDraft(region); setRegionOpen(true); };
    const openSort = () => { setSortDraft(sort); setSortOpen(true); };
    const confirmRegion = () => { setRegion(regionDraft); setRegionOpen(false); };
    const confirmSort = () => { setSort(sortDraft); setSortOpen(false); };

    return (
        <div className="m-prop-list-page">
            <header className="m-prop-topbar">
                <button type="button" className="m-prop-back" onClick={() => onNavigate && onNavigate('home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    <span>홈으로</span>
                </button>
                <button type="button" className="m-map-btn" onClick={() => onNavigate && onNavigate('mProposalMap')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>지도보기</span>
                </button>
            </header>

            <div className="m-region-row">
                <button type="button" className="m-region-btn" onClick={openRegion}>
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

                <div className="m-prop-list-content" onScroll={handleScroll}>
                    <div className="m-cat-chips">
                        {CATEGORIES.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`m-cat-chip ${cat === c ? 'on' : ''}`}
                                onClick={() => setCat(c)}
                            >{c}</button>
                        ))}
                    </div>

                    <div className="m-sort-row">
                        <button type="button" className="m-sort-btn" onClick={openSort}>
                            <span>{sort}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                    </div>

                    <ul className="m-prop-cards">
                        {loading && <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>불러오는 중...</li>}
                        {!loading && items.length === 0 && (
                            <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>조건에 맞는 제안이 없습니다.</li>
                        )}
                        {items.map((it) => (
                            <ProposalListCard key={it.id} it={it} onNavigate={onNavigate} />
                        ))}
                        {loadingMore && <li style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '13px' }}>불러오는 중...</li>}
                    </ul>
                </div>
            </div>
            </div>{/* end m-prop-page-body */}

            <button type="button" className="m-prop-fab" onClick={() => onNavigate && onNavigate('mProposalForm')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>제안하기</span>
            </button>

            {regionOpen && <RegionSheet regions={REGIONS} draft={regionDraft} onSelect={setRegionDraft} onConfirm={confirmRegion} onClose={() => setRegionOpen(false)} />}
            {sortOpen && <SortSheet sorts={SORTS} draft={sortDraft} onSelect={setSortDraft} onConfirm={confirmSort} onClose={() => setSortOpen(false)} />}

            <MobileBottomNav currentView="mProposalList" onNavigate={onNavigate} />
        </div>
    );
}
