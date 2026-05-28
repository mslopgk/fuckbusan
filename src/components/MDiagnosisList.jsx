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
import { API_URL, authHeaders } from '../utils/api';

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

const DiagCard = memo(function DiagCard({ it, onNavigate }) {
    const { ref: thumbRef, bgStyle } = useLazyImage(it.thumb);
    return (
        <li
            className="m-diag-card"
            onClick={() => onNavigate?.('mDiagnosisResult', it)}
        >
            <div className="m-diag-card-body">
                <div className="m-diag-card-tags">
                    <span className="m-diag-tag">{it.big}</span>
                    {it.mid && <span className="m-diag-tag">{it.mid}</span>}
                </div>
                <div className="m-diag-card-name-row">
                    <span className="m-diag-card-name">{it.name}</span>
                    {it.score != null && <span className="m-diag-card-score">{it.score}</span>}
                </div>
                {it.reviewText && <p className="m-diag-card-review">{it.reviewText}</p>}
            </div>
            <div ref={thumbRef} className="m-diag-card-thumb" style={bgStyle} />
        </li>
    );
});

export default function MDiagnosisList({ onNavigate }) {
    const [category, setCategory] = useState('전체');
    const [mode, setMode] = useState('citizen');
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

    // mode 변경 시 page 1부터 재로드
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
    }, [mode]);

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
        return allRows
            .filter((r) => !district || r.진단지역 === district || r.district_code === district)
            .filter((r) => category === '전체' || r.대분류 === category)
            .filter((r) => {
                // 시민/전문가 탭 필터
                const target = r.진단대상 ?? r.target ?? null;
                if (mode === 'expert') return target === '전문가' || target === 'expert';
                // citizen 모드: 전문가 제외 (미설정 포함)
                return target !== '전문가' && target !== 'expert';
            })
            .map((r) => ({
                id: r.result_id,
                big: r.대분류 || '주거',
                mid: r.중분류 || '',
                name: r.질문기준 || r.대분류 || '진단',
                score: r.점수 != null ? Number(r.점수).toFixed(1) : null,
                reviewText: r.리뷰 || '',
                thumb: r.이미지경로 || null,
            }));
    }, [allRows, district, category, mode]);

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

    return (
        <div className="m-diag-list-page">
            {/* 헤더 — 흰 배경, 뒤로가기 + 모드명 + 구 드롭다운 */}
            <div className="m-diag-header">
                <div className="m-diag-header-top">
                    <button
                        type="button"
                        className="m-diag-back-btn"
                        aria-label="뒤로"
                        onClick={() => onNavigate?.('home')}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <span className="m-diag-header-title">
                        {mode === 'expert' ? '전문가 진단' : '일반 진단'}
                    </span>
                </div>
                <div className="m-diag-district-row">
                    <select
                        className="m-diag-district-select"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                    >
                        <option value="">전체</option>
                        {Object.keys(DISTRICT_CENTERS).map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
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
                            <line x1="14" y1="3" x2="14" y2="25" stroke="#06AB69" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
                            <line x1="3" y1="14" x2="25" y2="14" stroke="#06AB69" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
                            <circle cx="14" cy="14" r="3" stroke="#06AB69" strokeWidth="2" fill="none"/>
                        </svg>
                    </div>
                )}

                {/* 선택된 위치 핀 — CSS 절대 포지션 (crosshair보다 높은 z-index) */}
                {kakaoReady && selectedPin && (
                    <div className="m-diag-selected-marker" aria-hidden="true">
                        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
                            <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 36 14 36s14-26.375 14-36C28 6.268 21.732 0 14 0z" fill="#06AB69"/>
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

                {/* 시민 / 전문가 탭 */}
                <div className="m-diag-mode-tabs">
                    <button
                        type="button"
                        className={`m-diag-mode-tab${mode === 'citizen' ? ' active' : ''}`}
                        onClick={() => setMode('citizen')}
                    >시민 진단</button>
                    <button
                        type="button"
                        className={`m-diag-mode-tab${mode === 'expert' ? ' active' : ''}`}
                        onClick={() => setMode('expert')}
                    >전문가 진단</button>
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
                    onClick={() => selectedPin && onNavigate?.('mDiagnosisForm', { ...selectedPin, mode })}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>진단하기</span>
                </button>
            </div>

            <MobileBottomNav currentView="mDiagnosisList" onNavigate={onNavigate} />
        </div>
    );
}
