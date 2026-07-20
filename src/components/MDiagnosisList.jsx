import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import MobileBottomNav from './MobileBottomNav';
import { useLazyImage } from '../hooks/useLazyImage';
import { DISTRICT_CENTERS } from '../constants/diagnosis';
import { API_URL } from '../utils/api';
import { matchDistrict } from '../utils/format';
import MDiagnosisFilterModal from './MDiagnosisFilterModal';
import './MDiagnosisList.css';

const DIAG_PAGE_SIZE = 50;

// 진단대상 필터 판정 (모달/리스트/지도 공통 규칙)
function matchTarget(rowTarget, ft) {
    if (ft === 'all') return true;
    if (ft === 'expert') return rowTarget === '전문가' || rowTarget === 'expert';
    return rowTarget !== '전문가' && rowTarget !== 'expert';
}

// Figma 302:21392 (진단 목록4 카드) — 시민=점수, 전문가=적합/부적합
const DiagCard = memo(function DiagCard({ it, onNavigate }) {
    const { ref: thumbRef, bgStyle } = useLazyImage(it.thumb);
    const isExpert = it.target === '전문가' || it.target === 'expert';
    return (
        <li className="m-diag-card" onClick={() => onNavigate?.('mDiagnosisResult', it)}>
            <div className="m-diag-card-body">
                <div className="m-diag-card-tags">
                    <span className="m-diag-tag">{it.big}</span>
                    {it.mid && <span className="m-diag-tag">{it.mid}</span>}
                </div>
                <div className="m-diag-card-name-row">
                    <span className="m-diag-card-name">{it.name}</span>
                    {isExpert ? (
                        it.score != null && (
                            <span className={`m-diag-card-status ${Number(it.score) >= 4 ? 'pass' : 'fail'}`}>
                                {Number(it.score) >= 4 ? '적합' : '부적합'}
                            </span>
                        )
                    ) : (
                        it.score != null && <span className="m-diag-card-score">{it.score}</span>
                    )}
                </div>
                <p className="m-diag-card-author">{it.reviewText || it.author || ''}</p>
            </div>
            <div className="m-diag-card-right">
                {it.thumb ? (
                    <div ref={thumbRef} className="m-diag-card-thumb" style={bgStyle} />
                ) : (
                    <div className="m-diag-card-thumb" />
                )}
            </div>
        </li>
    );
});

export default function MDiagnosisList({ onNavigate }) {
    const [district, setDistrict] = useState('');
    const [category, setCategory] = useState('전체');
    const [allRows, setAllRows] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [districtOpen, setDistrictOpen] = useState(false);
    // 필터 모달 상태 (진단대상/대분류/중분류/소분류)
    const [filterOpen, setFilterOpen] = useState(false);
    const [filter, setFilter] = useState({ target: 'citizen', bigCats: [], mid: '', sub: '' });

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
    }, []);

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
        const bigSet = new Set(filter.bigCats);
        return allRows
            .filter((r) => {
                // 지역 필터: district_code/진단지역 문자열 매칭 → 실패 시 위도/경도로 최근접 구 추정
                if (!district) return true;
                if (matchDistrict(r.district_code, district) || matchDistrict(r.진단지역, district)) return true;
                const lat = r.위도 != null ? Number(r.위도) : NaN;
                const lng = r.경도 != null ? Number(r.경도) : NaN;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
                let best = null, bestD = Infinity;
                for (const [name, c] of Object.entries(DISTRICT_CENTERS)) {
                    const d = (lat - c.lat) ** 2 + (lng - c.lng) ** 2;
                    if (d < bestD) { bestD = d; best = name; }
                }
                return matchDistrict(best, district);
            })
            .filter((r) => category === '전체' || r.대분류 === category)
            .filter((r) => !bigSet.size || bigSet.has(r.대분류))
            .filter((r) => !filter.mid || r.중분류 === filter.mid)
            .filter((r) => {
                const target = r.진단대상 ?? r.target ?? null;
                if (filter.target === 'all') return true;
                if (filter.target === 'expert') return target === '전문가' || target === 'expert';
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
                target: r.진단대상 ?? r.target ?? null,
                thumb: r.이미지경로 || null,
                answers: r.answers ?? null,
            }));
    }, [allRows, district, category, filter]);

    // 필터 모달에 넘길 정규화 rows (대분류/중분류/진단대상)
    const optionRows = useMemo(
        () => allRows.map((r) => ({ big: r.대분류, mid: r.중분류, target: r.진단대상 ?? r.target ?? null })),
        [allRows],
    );

    // 상단 카테고리 칩 = 실제 데이터의 대분류 (현재 진단대상 기준), 앞에 '전체'
    const bigOptions = useMemo(
        () => [...new Set(
            optionRows.filter((r) => matchTarget(r.target, filter.target)).map((r) => r.big).filter(Boolean),
        )].sort(),
        [optionRows, filter.target],
    );
    const chips = useMemo(() => ['전체', ...bigOptions], [bigOptions]);

    // 진단대상 전환 등으로 현재 선택 카테고리가 더 이상 옵션에 없으면 '전체'로 복귀
    useEffect(() => {
        if (category !== '전체' && !bigOptions.includes(category)) setCategory('전체');
    }, [bigOptions, category]);

    return (
        <div className="m-diag-list-only-page">
            {/* 헤더 — Figma 302:21448~21453: back + 타이틀 + expand_circle_down */}
            <header className="m-diag-list-topbar">
                <button
                    type="button"
                    className="m-diag-list-back"
                    aria-label="뒤로"
                    onClick={() => onNavigate?.('mDiagnosisMap')}
                >
                    <img src="/figma-assets/mobile-diagnosis/arrow_back.png" width="24" height="24" alt="" />
                </button>
                <span className="m-diag-list-topbar-title">진단 상세를 선택해주세요</span>
                <button
                    type="button"
                    className="m-diag-expand-btn"
                    aria-label="진단 상세 필터"
                    onClick={() => setFilterOpen(true)}
                >
                    <img src="/figma-assets/mobile-diagnosis/expand_circle_down.png" width="20" height="20" alt="" />
                </button>
            </header>

            {/* 지역 타이틀 — Figma "수영구 ▸" (302:21389/21390) */}
            <div className="m-diag-list-title-row">
                <span className="m-diag-list-title">{district || '부산전체'}</span>
                <button
                    type="button"
                    className="m-diag-list-title-btn"
                    aria-label="지역 선택"
                    onClick={() => setDistrictOpen(true)}
                >
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true">
                        <path d="M1.5 1L6.5 6L1.5 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {/* 카테고리 칩 2행 wrap — Figma rows y=131/175 */}
            <div className="m-diag-list-cats">
                {chips.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`m-diag-cat-chip${category === c ? ' active' : ''}`}
                        onClick={() => setCategory(c)}
                    >
                        {c}
                    </button>
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

            {/* 진단하기 FAB — Figma 98x36 r20 */}
            <button
                type="button"
                className="m-diag-list-fab"
                onClick={() => onNavigate?.('mDiagnosisMap')}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>진단하기</span>
            </button>

            {/* 지역 선택 모달 */}
            {districtOpen && (
                <div className="m-diag-region-backdrop" onClick={() => setDistrictOpen(false)}>
                    <div className="m-diag-region-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="m-diag-region-head">
                            <h3 className="m-diag-region-title">위치 설정</h3>
                            <button className="m-diag-region-close" type="button" aria-label="닫기" onClick={() => setDistrictOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <ul className="m-diag-region-list">
                            <li className={`m-diag-region-item ${!district ? 'on' : ''}`} onClick={() => { setDistrict(''); setDistrictOpen(false); }}>
                                <span>부산전체</span>
                            </li>
                            {Object.keys(DISTRICT_CENTERS).map((d) => (
                                <li key={d} className={`m-diag-region-item ${district === d ? 'on' : ''}`} onClick={() => { setDistrict(d); setDistrictOpen(false); }}>
                                    <span>{d}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* 진단 상세 필터 모달 */}
            <MDiagnosisFilterModal
                open={filterOpen}
                value={filter}
                rows={optionRows}
                onClose={() => setFilterOpen(false)}
                onApply={setFilter}
            />

            <MobileBottomNav currentView="mDiagnosisList" onNavigate={onNavigate} />
        </div>
    );
}
