import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';

const DIAG_PAGE_SIZE = 50;
import { Map, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { useLazyImage } from '../hooks/useLazyImage';
import MobileBottomNav from './MobileBottomNav';
import {
    DISTRICT_CENTERS,
    CATEGORIES_WITH_ALL as CATEGORIES,
} from '../constants/diagnosis';
import './MDiagnosisList.css';
import './MDiagnosisMap.css';
import MDiagnosisFilterModal from './MDiagnosisFilterModal';
import { API_URL, authHeaders } from '../utils/api';

const TARGET_LABEL = { all: '전체 진단', citizen: '시민 진단', expert: '전문가 진단' };

// 줌 레벨 → 클러스터 합치기 반경 (위경도 도 단위)
// Kakao level 1=가장 가까이, 14=가장 멀리
const CLUSTER_RADIUS = {
    1: 0.0008, 2: 0.0015, 3: 0.003, 4: 0.006, 5: 0.02,
    6: 0.04,   7: 0.08,   8: 0.15,  9: 0.3,   10: 0.6,
};

function buildClusterPins(rawPins, level, activeDistrict) {
    if (!rawPins.length) return [];
    const r = CLUSTER_RADIUS[level] ?? CLUSTER_RADIUS[5];
    const taken = new Array(rawPins.length).fill(false);
    const result = [];

    for (let i = 0; i < rawPins.length; i++) {
        if (taken[i]) continue;
        const p = rawPins[i];
        let wLat = p.lat * p.count, wLng = p.lng * p.count, total = p.count;
        let dist = p.district ?? null;
        taken[i] = true;

        for (let j = i + 1; j < rawPins.length; j++) {
            if (taken[j]) continue;
            const q = rawPins[j];
            // 유클리드 거리 체크 (작은 범위에서는 도 단위 근사 충분)
            const dlat = Math.abs(q.lat - p.lat);
            const dlng = Math.abs(q.lng - p.lng);
            if (dlat <= r && dlng <= r) {
                wLat += q.lat * q.count;
                wLng += q.lng * q.count;
                total += q.count;
                // district: 명시적 값 있는 것 우선
                if (!dist && q.district) dist = q.district;
                taken[j] = true;
            }
        }

        result.push({
            id: dist ?? `geo_${i}`,
            district: dist,
            count: total,
            lat: wLat / total,
            lng: wLng / total,
            focus: dist != null && dist === activeDistrict,
        });
    }
    return result;
}

// Figma 카테고리별 태그 배경색
const CAT_TAG_BG = {
    '주거': '#dff8f8', '환경': '#c0e6c0', '교통': '#c9e0ff',
    '안전': '#ffefc0', '교육': '#ffc9c9', '산업·일자리': '#ffd9c9',
    '문화·여가': '#e5c9ff', '보건·복지': '#c9f0d9',
};

const DiagCard = memo(function DiagCard({ it, onNavigate }) {
    const { ref: thumbRef, bgStyle } = useLazyImage(it.thumb);
    return (
        <li
            className="m-diag-card"
            onClick={() => onNavigate?.('mDiagnosisResult', it)}
        >
            <div className="m-diag-card-body">
                <div className="m-diag-card-tags">
                    <span className="m-diag-tag" style={{ background: CAT_TAG_BG[it.big] || '#dff8f8' }}>{it.big}</span>
                    {it.mid && <span className="m-diag-tag" style={{ background: CAT_TAG_BG[it.big] || '#dff8f8' }}>{it.mid}</span>}
                </div>
                <div className="m-diag-card-name-row">
                    <span className="m-diag-card-name">{it.name}</span>
                </div>
                <p className="m-diag-card-author">{it.author || it.reviewText || ''}</p>
            </div>
            <div className="m-diag-card-right">
                {it.thumb && <div ref={thumbRef} className="m-diag-card-thumb" style={bgStyle} />}
                <div className="m-diag-card-stats">
                    <span className="m-diag-stat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#bfbfbf"/></svg>
                        {it.likes ?? 0}
                    </span>
                    <span className="m-diag-stat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#bfbfbf"/></svg>
                        {it.comments ?? 0}
                    </span>
                </div>
            </div>
        </li>
    );
});

export default function MDiagnosisMap({ onNavigate }) {
    const [category, setCategory] = useState('전체');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filter, setFilter] = useState({ target: 'citizen', bigCats: [], mid: '', sub: '' });
    const [district, setDistrict] = useState('');
    const [allRows, setAllRows] = useState([]);
    const [diagHasMore, setDiagHasMore] = useState(true);
    const [diagLoadingMore, setDiagLoadingMore] = useState(false);
    const [clusters, setClusters] = useState([]);
    const [selectedPin, setSelectedPin] = useState(null);
    const [mapLevel, setMapLevel] = useState(5);
    const mapRef = useRef(null);
    // panTo 중 onDragEnd 이벤트가 발생해 selectedPin을 덮어쓰는 것을 방지
    const isPanningRef = useRef(false);

    useEffect(() => {
        setAllRows([]);
        setDiagHasMore(true);
        const params = new URLSearchParams({ skip: 0, limit: DIAG_PAGE_SIZE });
        fetch(`${API_URL}/checklist/list?${params.toString()}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                const arr = Array.isArray(rows) ? rows : [];
                setAllRows(arr);
                setDiagHasMore(arr.length === DIAG_PAGE_SIZE);
            })
            .catch(() => setAllRows([]));
    }, []);

    const loadMoreDiag = useCallback(() => {
        if (!diagHasMore || diagLoadingMore) return;
        setDiagLoadingMore(true);
        setAllRows((prev) => {
            const params = new URLSearchParams({ skip: prev.length, limit: DIAG_PAGE_SIZE });
            fetch(`${API_URL}/checklist/list?${params.toString()}`)
                .then((r) => (r.ok ? r.json() : []))
                .then((rows) => {
                    const arr = Array.isArray(rows) ? rows : [];
                    setAllRows((p) => [...p, ...arr]);
                    setDiagHasMore(arr.length === DIAG_PAGE_SIZE);
                })
                .finally(() => setDiagLoadingMore(false));
            return prev;
        });
    }, [diagHasMore, diagLoadingMore]);

    const handleDiagScroll = useCallback((e) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 250) loadMoreDiag();
    }, [loadMoreDiag]);

    // /checklist/clusters is public — use it for map pins
    useEffect(() => {
        fetch(`${API_URL}/checklist/clusters`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setClusters(Array.isArray(data) ? data : []))
            .catch(() => setClusters([]));
    }, []);

    const filtered = useMemo(() => {
        const bigSet = new Set(filter.bigCats);
        return allRows
            .filter((r) => !district || r.진단지역 === district || r.district_code === district)
            .filter((r) => category === '전체' || r.대분류 === category)
            .filter((r) => !bigSet.size || bigSet.has(r.대분류))
            .filter((r) => !filter.mid || r.중분류 === filter.mid)
            .filter((r) => {
                // 진단대상 필터 (필터 모달에서 선택)
                const target = r.진단대상 ?? r.target ?? null;
                if (filter.target === 'all') return true;
                if (filter.target === 'expert') return target === '전문가' || target === 'expert';
                // citizen: 전문가 제외 (미설정 포함)
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
    }, [allRows, district, category, filter]);

    // 지도 핀: 서버 clusters를 줌 레벨 기반 지리 클러스터링으로 표시
    // allRows 개별 좌표는 리스트 카드 필터에만 사용
    const DIAG_PINS = useMemo(() => {
        const rawPins = clusters
            .filter((c) => c.lat && c.lng)
            .map((c) => ({
                lat: parseFloat(c.lat),
                lng: parseFloat(c.lng),
                count: c.count,
                district: c.district ?? null,
            }));
        return buildClusterPins(rawPins, mapLevel, district);
    }, [clusters, mapLevel, district]);

    const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    const [kakaoLoading, kakaoError] = useKakaoLoader({ appkey: kakaoKey, libraries: ['services'] });
    const kakaoReady = !!kakaoKey && !kakaoLoading && !kakaoError;
    const districtCenter = useMemo(() => DISTRICT_CENTERS[district] ?? { lat: 35.158, lng: 129.06 }, [district]);
    // 현재 지도 중심 — 드래그 후 스냅백 방지를 위해 별도 state로 관리
    const [currentCenter, setCurrentCenter] = useState(districtCenter);

    useEffect(() => {
        // district가 바뀔 때만 지도 중심 이동 (panTo) + currentCenter 갱신
        setCurrentCenter(districtCenter);
        if (mapRef.current && window.kakao) {
            isPanningRef.current = true;
            mapRef.current.panTo(new window.kakao.maps.LatLng(districtCenter.lat, districtCenter.lng));
            // panTo 애니메이션 완료 후 플래그 해제 (카카오맵 panTo는 약 500ms)
            setTimeout(() => { isPanningRef.current = false; }, 800);
        }
    }, [districtCenter]);

    // 진입 시(구 미선택) 진단 데이터가 화면에 보이도록 클러스터 가중 중심으로 1회 이동
    const didAutoCenterRef = useRef(false);
    useEffect(() => {
        if (didAutoCenterRef.current || district || !clusters.length) return;
        const valid = clusters.filter((c) => c.lat && c.lng);
        if (!valid.length) return;
        let wLat = 0, wLng = 0, tot = 0;
        for (const c of valid) {
            const n = c.count || 1;
            wLat += parseFloat(c.lat) * n;
            wLng += parseFloat(c.lng) * n;
            tot += n;
        }
        if (!tot) return;
        const center = { lat: wLat / tot, lng: wLng / tot };
        didAutoCenterRef.current = true;
        setCurrentCenter(center);
        if (mapRef.current && window.kakao) {
            isPanningRef.current = true;
            mapRef.current.panTo(new window.kakao.maps.LatLng(center.lat, center.lng));
            setTimeout(() => { isPanningRef.current = false; }, 800);
        }
    }, [clusters, district]);

    return (
        <div className="m-diag-list-page">
            {/* 헤더 — Figma 22:7914: "← 일반 진단 ⊙" + 지역 드롭다운 */}
            <header className="m-diag-map-header">
                <button
                    type="button"
                    className="m-diag-map-back"
                    aria-label="뒤로"
                    onClick={() => onNavigate?.('home')}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <div className="m-diag-map-header-title">
                    <span className="m-diag-map-header-label">{TARGET_LABEL[filter.target] || '진단'}</span>
                </div>
                <button
                    type="button"
                    className="m-diag-filter-btn m-diag-map-filter-btn"
                    aria-label="필터"
                    onClick={() => setFilterOpen(true)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M6 15l6-6 6 6" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </header>

            {/* 지역 드롭다운 — Figma: 흰 라운드 박스 + 지역명 + 아래 화살표 */}
            <div className="m-diag-district-row-map">
                <div className="m-diag-district-select-wrap">
                    <select
                        className="m-diag-district-select"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                    >
                        <option value="">지역검색</option>
                        {Object.keys(DISTRICT_CENTERS).map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <svg className="m-diag-district-chevron-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>

            {/* 지도 영역 */}
            <div className="m-diag-map-area">
                {/* 카테고리 칩 바 — 지도 위 플로팅, 수평 스크롤 */}
                <div className="m-diag-cats-bar">
                    {CATEGORIES.map((c) => (
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

                {/* 지도 */}
                {kakaoReady ? (
                    <Map
                        center={currentCenter}
                        level={5}
                        style={{ width: '100%', height: '100%' }}
                        draggable
                        zoomable
                        onCreate={(m) => {
                            mapRef.current = m;
                            setMapLevel(m.getLevel());
                        }}
                        onZoomChanged={(m) => setMapLevel(m.getLevel())}
                        onDragStart={() => {
                            // 드래그 시작 시 기존 핀 해제 → crosshair 복귀 (순간이동 방지)
                            if (!isPanningRef.current) setSelectedPin(null);
                        }}
                        onDragEnd={(m) => {
                            // panTo 중 발생한 이벤트는 무시 (기존 핀 클릭 덮어쓰기 방지)
                            if (isPanningRef.current) return;
                            const c = m.getCenter();
                            const lat = c.getLat();
                            const lng = c.getLng();
                            setCurrentCenter({ lat, lng }); // 스냅백 방지
                            if (!window.kakao?.maps?.services) {
                                setSelectedPin({ lat, lng, address: '선택된 위치' });
                                return;
                            }
                            const geocoder = new window.kakao.maps.services.Geocoder();
                            geocoder.coord2Address(lng, lat, (result, status) => {
                                const addr = status === window.kakao.maps.services.Status.OK
                                    ? (result[0]?.road_address?.address_name || result[0]?.address?.address_name || '선택된 위치')
                                    : '선택된 위치';
                                setSelectedPin({ lat, lng, address: addr });
                            });
                        }}
                    >
                        {DIAG_PINS.map((p) => (
                            <CustomOverlayMap key={p.id} position={{ lat: p.lat, lng: p.lng }} yAnchor={1} clickable>
                                <button
                                    type="button"
                                    className={`m-diag-pin${p.focus ? ' focus' : ''}`}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        isPanningRef.current = true;
                                        const addr = p.district && p.district !== 'all'
                                            ? `${p.district} (${p.count}건)` : '진단 위치';
                                        setSelectedPin({ lat: p.lat, lng: p.lng, district: p.district, address: addr });
                                        setCurrentCenter({ lat: p.lat, lng: p.lng });
                                        if (mapRef.current && window.kakao) {
                                            mapRef.current.panTo(new window.kakao.maps.LatLng(p.lat, p.lng));
                                            if (mapLevel > 5) mapRef.current.setLevel(5);
                                        }
                                        if (p.district && p.district !== 'all') setDistrict(p.district);
                                        setTimeout(() => { isPanningRef.current = false; }, 800);
                                    }}
                                >
                                    <span className="m-diag-pin-count">{p.count}</span>
                                </button>
                            </CustomOverlayMap>
                        ))}
                    </Map>
                ) : (
                    <div className="m-diag-map-bg" />
                )}

                {/* 중앙 고정 십자선 — 위치 미선택 시만 표시 */}
                {kakaoReady && !selectedPin && (
                    <div className="m-diag-crosshair" aria-hidden="true">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <line x1="14" y1="3" x2="14" y2="25" stroke="#23BDBB" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
                            <line x1="3" y1="14" x2="25" y2="14" stroke="#23BDBB" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
                            <circle cx="14" cy="14" r="3" stroke="#23BDBB" strokeWidth="2" fill="none"/>
                        </svg>
                    </div>
                )}

                {/* 선택된 위치 핀 — CSS 절대 포지션 (crosshair보다 높은 z-index) */}
                {kakaoReady && selectedPin && (
                    <div className="m-diag-selected-marker" aria-hidden="true">
                        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
                            <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 36 14 36s14-26.375 14-36C28 6.268 21.732 0 14 0z" fill="#23BDBB"/>
                            <circle cx="14" cy="14" r="6" fill="#fff"/>
                        </svg>
                    </div>
                )}

                {/* 현위치 버튼 */}
                <button
                    type="button"
                    className="m-diag-locate"
                    aria-label="현위치"
                    onClick={() => {
                        if (!('geolocation' in navigator)) return;
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                if (mapRef.current && window.kakao) {
                                    mapRef.current.panTo(new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                                }
                            },
                            () => {},
                            { timeout: 8000 },
                        );
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <line x1="12" y1="2" x2="12" y2="5" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="5" y2="12" />
                        <line x1="19" y1="12" x2="22" y2="12" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </button>
            </div>

            {/* 하단 시트 */}
            <div className="m-diag-sheet">
                <div className="m-diag-sheet-handle" />

                {/* 진단대상 표시 + 목록 보기 햄버거 (진단대상 선택은 필터 모달) */}
                <div className="m-diag-mode-tabs-row">
                    <div className="m-diag-mode-tabs">
                        <span className="m-diag-mode-tab active">{TARGET_LABEL[filter.target] || '진단'}</span>
                    </div>
                    <button
                        type="button"
                        className="m-diag-list-btn"
                        onClick={() => onNavigate?.('mDiagnosisList')}
                        aria-label="목록 보기"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"/>
                            <line x1="8" y1="12" x2="21" y2="12"/>
                            <line x1="8" y1="18" x2="21" y2="18"/>
                            <line x1="3" y1="6" x2="3.01" y2="6"/>
                            <line x1="3" y1="12" x2="3.01" y2="12"/>
                            <line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* 카드 리스트 */}
                <ul className="m-diag-cards" onScroll={handleDiagScroll}>
                    {filtered.length === 0 ? (
                        <li className="m-diag-empty">
                            {!localStorage.getItem('access_token') ? (
                                <>
                                    <p>진단 결과가 없습니다.</p>
                                    <p className="m-diag-empty-sub">로그인 후 전체 진단 내역을 볼 수 있습니다.</p>
                                </>
                            ) : (
                                <p>해당 구역의 진단 결과가 없습니다.</p>
                            )}
                        </li>
                    ) : (
                        filtered.map((it) => (
                            <DiagCard key={it.id} it={it} onNavigate={onNavigate} />
                        ))
                    )}
                    {diagLoadingMore && (
                        <li style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '13px' }}>불러오는 중...</li>
                    )}
                </ul>

                {/* 진단하기 FAB */}
                {!selectedPin && (
                    <div className="m-diag-fab-hint">지도를 움직여 진단할 위치를 선택하세요</div>
                )}
                {selectedPin && (
                    <div className="m-diag-fab-addr">{selectedPin.address}</div>
                )}
                <button
                    type="button"
                    className={`m-diag-fab${!selectedPin ? ' disabled' : ''}`}
                    disabled={!selectedPin}
                    onClick={() => selectedPin && onNavigate?.('mDiagnosisForm', { ...selectedPin, mode: filter.target })}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>진단하기</span>
                </button>
            </div>

            {/* 진단 상세 필터 모달 */}
            <MDiagnosisFilterModal
                open={filterOpen}
                value={filter}
                onClose={() => setFilterOpen(false)}
                onApply={setFilter}
            />

            <MobileBottomNav currentView="mDiagnosisMap" onNavigate={onNavigate} />
        </div>
    );
}
