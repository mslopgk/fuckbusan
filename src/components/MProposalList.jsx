import { useState, useEffect, useCallback, useRef } from 'react';

const PAGE_SIZE = 25;
const SORT_API = { '최신순': 'latest', '조회수': 'views', '투표순': 'votes' };
import MobileBottomNav from './MobileBottomNav';
import { CAT_STYLES } from './catStyles';
import { REGIONS, SORTS, DISTRICT_CENTERS } from '../constants/mapConstants';
import { RegionSheet, SortSheet } from './MFilterSheets';
import { API_URL } from '../utils/api';
import { useLazyImage } from '../hooks/useLazyImage';
import { thumbUrl, matchDistrict, nearestDistrict } from '../utils/format';
import './MProposalList.css';

function VoteIcon() {
    // Figma 리스트/지도 카드 동의수 아이콘 — 체크 서클 (image 59, opacity 0.3)
    return (
        <img
            src="/figma-assets/icons/icon_vote_check.png"
            alt=""
            width="12"
            height="12"
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 3, opacity: 0.3 }}
        />
    );
}

function CommentIcon() {
    return (
        <img
            src="/figma-assets/icons/icon_comment.svg"
            alt=""
            width="13"
            height="11"
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }}
        />
    );
}

function ProposalListCard({ it, onNavigate }) {
    const style = CAT_STYLES[it.category] || { bg: '#eee', color: '#555' };
    const nickname = it.nickname || '익명';
    const author = it.region ? `${it.region} ${nickname}` : nickname;
    const imageUrl = Array.isArray(it.files) && it.files.length > 0 ? it.files[0] : null;
    const { ref: imgRef, bgStyle } = useLazyImage(imageUrl, thumbUrl(imageUrl));
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
                        <span><VoteIcon />{it.likes_count ?? 0}</span>
                        <span><CommentIcon />{it.comments_count ?? 0}</span>
                    </div>
                </div>
            </div>
            {hasImage && <div ref={imgRef} className="m-prop-card-img has-image" style={bgStyle} />}
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
    const fetchGenRef = useRef(0);

    // 목록: 필터/정렬 변경 시 page 1부터 재로드
    useEffect(() => {
        const gen = ++fetchGenRef.current;
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams({ skip: 0, limit: PAGE_SIZE, sort: SORT_API[sort] || 'latest' });
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
    }, [cat, sort]);

    const loadMore = useCallback(() => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        setItems((prev) => {
            const params = new URLSearchParams({ skip: prev.length, limit: PAGE_SIZE, sort: SORT_API[sort] || 'latest' });
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
    }, [hasMore, loadingMore, cat, sort]);

    const handleScroll = useCallback((e) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 250) loadMore();
    }, [loadMore]);

    const openRegion = () => { setRegionDraft(region); setRegionOpen(true); };
    const openSort = () => { setSortDraft(sort); setSortOpen(true); };
    const confirmRegion = () => { setRegion(regionDraft); setRegionOpen(false); };
    const confirmSort = () => { setSort(sortDraft); setSortOpen(false); };

    const regionFilter = region && region !== '부산전체' ? region : null;
    const filtered = !regionFilter ? items : items.filter((it) => {
        if (matchDistrict(it.region, regionFilter)) return true;
        const approx = nearestDistrict(it.lat, it.lng, DISTRICT_CENTERS);
        return matchDistrict(approx, regionFilter);
    });

    return (
        <div className="m-prop-list-page">
            {/* 상단 topbar: < 홈으로 + 지도보기 pill */}
            <header className="m-prop-topbar">
                <button type="button" className="m-prop-back" onClick={() => onNavigate && onNavigate('home')} aria-label="뒤로">
                    <img src="/figma-assets/icons/icon_arrow_back.svg" alt="" width="24" height="24" />
                </button>
                <button type="button" className="m-map-btn" onClick={() => onNavigate && onNavigate('mProposalMap')}>
                    <img src="/figma-assets/icons/icon_location_pin.svg" alt="" width="17" height="23" />
                    <span>지도보기</span>
                </button>
            </header>

            {/* 지역 선택 행 */}
            <div className="m-region-row">
                <button type="button" className="m-region-btn" onClick={openRegion}>
                    <span>{region}</span>
                    <span className="m-region-arrow">
                        <svg width="5" height="9" viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L4.5 4.5L1 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </span>
                </button>
            </div>

            {/* 카테고리 칩 */}
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

            {/* 정렬 */}
            <div className="m-sort-row">
                <button type="button" className="m-sort-btn" onClick={openSort}>
                    <span>{sort}</span>
                    <img src="/figma-assets/icons/icon_sort_chevron.svg" alt="" width="9" height="5" />
                </button>
            </div>

            {/* 카드 목록 */}
            <div className="m-prop-list-scroll" onScroll={handleScroll}>
                <ul className="m-prop-cards">
                    {loading && <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>불러오는 중...</li>}
                    {!loading && filtered.length === 0 && (
                        <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>조건에 맞는 제안이 없습니다.</li>
                    )}
                    {filtered.map((it) => (
                        <ProposalListCard key={it.id} it={it} onNavigate={onNavigate} />
                    ))}
                    {loadingMore && <li style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '13px' }}>불러오는 중...</li>}
                </ul>
            </div>

            {/* FAB */}
            <button type="button" className="m-prop-fab" onClick={() => onNavigate && onNavigate('mProposalForm')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>제안하기</span>
            </button>

            {regionOpen && <RegionSheet accent="#f74e7e" regions={REGIONS} draft={regionDraft} onSelect={setRegionDraft} onConfirm={confirmRegion} onClose={() => setRegionOpen(false)} />}
            {sortOpen && <SortSheet accent="#f74e7e" sorts={SORTS} draft={sortDraft} onSelect={setSortDraft} onConfirm={confirmSort} onClose={() => setSortOpen(false)} />}

            <MobileBottomNav currentView="mProposalList" onNavigate={onNavigate} />
        </div>
    );
}
