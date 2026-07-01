import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import MobileBottomNav from './MobileBottomNav';
import { useLazyImage } from '../hooks/useLazyImage';
import {
    DISTRICT_CENTERS,
    CATEGORIES_WITH_ALL as CATEGORIES,
} from '../constants/diagnosis';
import { API_URL } from '../utils/api';
import './MDiagnosisList.css';

const DIAG_PAGE_SIZE = 50;

// Figma 22:8219 — 카테고리별 태그 배경색
const CAT_TAG_BG = {
    '주거':    '#dff8f8',
    '환경':    '#c0e6c0',
    '교통':    '#c9e0ff',
    '안전':    '#ffefc0',
    '교육':    '#ffc9c9',
    '산업·일자리': '#ffd9c9',
    '문화·여가':  '#e5c9ff',
    '보건·복지':  '#c9f0d9',
};
function getCatTagBg(cat) { return CAT_TAG_BG[cat] || '#dff8f8'; }

const DiagCard = memo(function DiagCard({ it, onNavigate }) {
    const { ref: thumbRef, bgStyle } = useLazyImage(it.thumb);
    return (
        <li className="m-diag-card" onClick={() => onNavigate?.('mDiagnosisResult', it)}>
            <div className="m-diag-card-body">
                <div className="m-diag-card-tags">
                    {/* Figma 진단 목록4: 태그는 중립 회색 배경 */}
                    <span className="m-diag-tag">{it.big}</span>
                    {it.mid && <span className="m-diag-tag">{it.mid}</span>}
                </div>
                <div className="m-diag-card-name-row">
                    <span className="m-diag-card-name">{it.name}</span>
                    {it.score != null && <span className="m-diag-card-score">{it.score}</span>}
                </div>
                <p className="m-diag-card-author">{it.reviewText || it.author || ''}</p>
            </div>
            <div className="m-diag-card-right">
                {it.thumb && <div ref={thumbRef} className="m-diag-card-thumb" style={bgStyle} />}
            </div>
        </li>
    );
});

export default function MDiagnosisList({ onNavigate }) {
    const [mode, setMode] = useState('citizen');
    const [district, setDistrict] = useState('');
    const [category, setCategory] = useState('전체');
    const [allRows, setAllRows] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [districtOpen, setDistrictOpen] = useState(false);

    useEffect(() => {
        setAllRows([]);
        setHasMore(true);
        const params = new URLSearchParams({ skip: 0, limit: DIAG_PAGE_SIZE });
        fetch(`${API_URL}/checklist/list?${params.toString()}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                const arr = Array.isArray(rows) ? rows : [];
                setAllRows(arr);
                setHasMore(arr.length === DIAG_PAGE_SIZE);
            })
            .catch(() => setAllRows([]));
    }, [mode]);

    const loadMore = useCallback(() => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        setAllRows((prev) => {
            const params = new URLSearchParams({ skip: prev.length, limit: DIAG_PAGE_SIZE });
            fetch(`${API_URL}/checklist/list?${params.toString()}`)
                .then((r) => (r.ok ? r.json() : []))
                .then((rows) => {
                    const arr = Array.isArray(rows) ? rows : [];
                    setAllRows((p) => [...p, ...arr]);
                    setHasMore(arr.length === DIAG_PAGE_SIZE);
                })
                .finally(() => setLoadingMore(false));
            return prev;
        });
    }, [hasMore, loadingMore]);

    const handleScroll = useCallback((e) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 250) loadMore();
    }, [loadMore]);

    const filtered = useMemo(() => {
        return allRows
            .filter((r) => !district || r.진단지역 === district || r.district_code === district)
            .filter((r) => category === '전체' || r.대분류 === category)
            .filter((r) => {
                const target = r.진단대상 ?? r.target ?? null;
                if (mode === 'expert') return target === '전문가' || target === 'expert';
                return target !== '전문가' && target !== 'expert';
            })
            .map((r) => ({
                id: r.result_id,
                big: r.대분류 || '주거',
                mid: r.중분류 || '',
                name: r.질문기준 || r.대분류 || '진단',
                score: r.점수 != null ? Number(r.점수).toFixed(1) : null,
                reviewText: r.리뷰 || '',
                author: r.작성자 || r.author || '',
                likes: r.likes ?? r.좋아요 ?? 0,
                comments: r.comments ?? r.댓글 ?? 0,
                thumb: r.이미지경로 || null,
            }));
    }, [allRows, district, category, mode]);

    return (
        <div className="m-diag-list-only-page">
            {/* 헤더: Figma 269:26746 — back + 타이틀 "진단 상세를 선택해주세요" */}
            <header className="m-diag-list-topbar">
                <button
                    type="button"
                    className="m-diag-list-back"
                    aria-label="뒤로"
                    onClick={() => onNavigate?.('mDiagnosisMap')}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <span className="m-diag-list-topbar-title">진단 상세를 선택해주세요</span>
            </header>

            {/* 시민/전문가 모드 탭 */}
            <div className="m-diag-list-mode-tabs">
                <button
                    type="button"
                    className={`m-diag-list-mode-tab${mode === 'citizen' ? ' active' : ''}`}
                    onClick={() => setMode('citizen')}
                >시민 진단</button>
                <button
                    type="button"
                    className={`m-diag-list-mode-tab${mode === 'expert' ? ' active' : ''}`}
                    onClick={() => setMode('expert')}
                >전문가 진단</button>
            </div>

            {/* 지역 선택 행 — Figma: bold "전체 ▶" */}
            <div className="m-diag-list-district-row">
                <button
                    type="button"
                    className="m-diag-list-district-btn"
                    onClick={() => setDistrictOpen(true)}
                >
                    <span>{district || '전체'}</span>
                    <span className="m-diag-list-district-arrow">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </span>
                </button>
            </div>

            {/* 카테고리 칩 */}
            <div className="m-diag-list-cats">
                {CATEGORIES.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`m-diag-list-cat-chip${category === c ? ' active' : ''}`}
                        onClick={() => setCategory(c)}
                    >{c}</button>
                ))}
            </div>

            {/* 카드 목록 */}
            <ul className="m-diag-list-cards" onScroll={handleScroll}>
                {filtered.length === 0 ? (
                    <li className="m-diag-list-empty">
                        {!localStorage.getItem('access_token')
                            ? '로그인 후 진단 내역을 확인할 수 있습니다.'
                            : '해당 조건의 진단 결과가 없습니다.'}
                    </li>
                ) : (
                    filtered.map((it) => (
                        <DiagCard key={it.id} it={it} onNavigate={onNavigate} />
                    ))
                )}
                {loadingMore && (
                    <li style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '13px' }}>불러오는 중...</li>
                )}
            </ul>

            {/* 진단하기 FAB */}
            <button
                type="button"
                className="m-diag-list-fab"
                onClick={() => onNavigate?.('mDiagnosisMap')}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>진단하기</span>
            </button>

            {/* 지역 선택 모달 */}
            {districtOpen && (
                <div className="m-modal-backdrop" onClick={() => setDistrictOpen(false)}>
                    <div className="m-modal-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="m-modal-head">
                            <h3 className="m-modal-title">위치 설정</h3>
                            <button className="m-modal-close" type="button" aria-label="닫기" onClick={() => setDistrictOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <ul className="m-region-list">
                            <li className={`m-region-item ${!district ? 'on' : ''}`} onClick={() => { setDistrict(''); setDistrictOpen(false); }}>
                                <span>전체</span>
                            </li>
                            {Object.keys(DISTRICT_CENTERS).map((d) => (
                                <li key={d} className={`m-region-item ${district === d ? 'on' : ''}`} onClick={() => { setDistrict(d); setDistrictOpen(false); }}>
                                    <span>{d}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <MobileBottomNav currentView="mDiagnosisList" onNavigate={onNavigate} />
        </div>
    );
}
