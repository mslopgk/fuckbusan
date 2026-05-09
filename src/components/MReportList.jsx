import { useState, useEffect, useMemo } from 'react';
import MobileBottomNav from './MobileBottomNav';
import { CAT_STYLES } from './catStyles';
import './MProposalList.css';
import './MReportList.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const REGIONS = ['부산전체', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'];
const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
const STAGES = [
    { key: 'inProgress', label: '개선중',   apiValue: '개선중' },
    { key: 'planned',    label: '개선예정', apiValue: '개선예정' },
    { key: 'done',       label: '개선완료', apiValue: '개선완료' },
];

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
    const [likedIds, setLikedIds] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('likedReportIds') || '[]')); } catch { return new Set(); }
    });
    const [loading, setLoading] = useState(true);

    const SORTS = ['조회수', '투표순', '최신순'];

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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
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
                                            <img
                                                src={likedIds.has(it.id) ? '/figma-assets/icons/icon_heart.svg' : '/figma-assets/icons/icon_heart_inactive.svg'}
                                                alt=""
                                                width={14}
                                                height={14}
                                                style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}
                                            />
                                            {it.likes ?? 0}
                                        </span>
                                        <span><img src="/figma-assets/icons/icon_comment.svg" alt="" width={14} height={14} style={{display:'inline-block',verticalAlign:'middle',marginRight:2}} />{it.comments ?? 0}</span>
                                    </div>
                                </div>
                            </div>
                            {it.image && <div className="m-prop-card-img" style={{ backgroundImage: `url(${it.image})` }} />}
                        </li>
                    );
                })}
            </ul>

            <button className="m-prop-fab" onClick={() => onNavigate && onNavigate('mReportForm')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>제보하기</span>
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

            <MobileBottomNav currentView="mReportList" onNavigate={onNavigate} />
        </div>
    );
}
