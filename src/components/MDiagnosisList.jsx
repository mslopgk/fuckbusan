import { useState, useEffect, useMemo, useRef } from 'react';
import { Map, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import MobileBottomNav from './MobileBottomNav';
import {
    DISTRICT_CENTERS,
    CATEGORIES_WITH_ALL as CATEGORIES,
} from '../constants/diagnosis';
import './MDiagnosisList.css';
import { API_URL, authHeaders } from '../utils/api';

export default function MDiagnosisList({ onNavigate }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('전체');
    const [mode, setMode] = useState('citizen');
    const [district, setDistrict] = useState('부산진구');
    const [allRows, setAllRows] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [selectedPin, setSelectedPin] = useState(null);
    const mapRef = useRef(null);

    // /checklist/list requires auth; guests see empty list (by server design)
    useEffect(() => {
        fetch(`${API_URL}/checklist/list`, { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setAllRows(Array.isArray(rows) ? rows : []))
            .catch(() => setAllRows([]));
    }, []);

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
            .map((r) => ({
                id: r.result_id,
                big: r.대분류 || '주거',
                mid: r.중분류 || '',
                name: r.질문기준 || r.대분류 || '진단',
                score: r.점수 != null ? Number(r.점수).toFixed(1) : null,
                reviewText: r.리뷰 || '',
                thumb: r.이미지경로 || null,
            }));
    }, [allRows, district, category]);

    // Build map pins from clusters endpoint (public, no auth needed)
    const DIAG_PINS = useMemo(() => {
        return clusters
            .filter((c) => c.lat && c.lng)
            .map((c) => ({
                id: c.district ?? 'all',
                district: c.district ?? 'all',
                count: c.count,
                lat: parseFloat(c.lat),
                lng: parseFloat(c.lng),
                focus: (c.district ?? 'all') === district,
            }));
    }, [clusters, district]);

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
            mapRef.current.panTo(new window.kakao.maps.LatLng(districtCenter.lat, districtCenter.lng));
        }
    }, [districtCenter]);

    return (
        <div className="m-diag-list-page">
            {/* 지도 영역 */}
            <div className="m-diag-map-area">
                {/* 검색바 — 지도 위 플로팅 */}
                <div className="m-diag-search-wrap">
                    <input
                        className="m-diag-search"
                        placeholder="지역검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

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
                        }}
                        onDragEnd={(m) => {
                            const c = m.getCenter();
                            const lat = c.getLat();
                            const lng = c.getLng();
                            setCurrentCenter({ lat, lng }); // 스냅백 방지
                            if (!window.kakao?.maps?.services) return;
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
                            <CustomOverlayMap key={p.id} position={{ lat: p.lat, lng: p.lng }} yAnchor={1}>
                                <button
                                    type="button"
                                    className={`m-diag-pin${p.focus ? ' focus' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDistrict(p.district);
                                        setSelectedPin({ lat: p.lat, lng: p.lng, district: p.district });
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
                <ul className="m-diag-cards">
                    {filtered.length === 0 ? (
                        <li className="m-diag-empty">
                            <p>진단 결과가 없습니다.</p>
                            <p className="m-diag-empty-sub">로그인 후 전체 진단 내역을 볼 수 있습니다.</p>
                        </li>
                    ) : (
                        filtered.map((it) => (
                            <li
                                key={it.id}
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
                                <div
                                    className="m-diag-card-thumb"
                                    style={it.thumb ? { backgroundImage: `url(${it.thumb})` } : undefined}
                                />
                            </li>
                        ))
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
                    onClick={() => selectedPin && onNavigate?.('mDiagnosisForm', selectedPin)}
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
