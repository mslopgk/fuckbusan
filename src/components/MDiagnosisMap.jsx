import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';

const DIAG_PAGE_SIZE = 50;
const MAX_PINS = 300;
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { useLazyImage } from '../hooks/useLazyImage';
import MobileBottomNav from './MobileBottomNav';
import {
    DISTRICT_CENTERS,
    CATEGORIES_WITH_ALL as CATEGORIES,
} from '../constants/diagnosis';
import './MDiagnosisList.css';
import './MDiagnosisMap.css';
import MDiagnosisFilterModal from './MDiagnosisFilterModal';
import { API_URL } from '../utils/api';

// Figma 302:21087 (진단 목록5) — 카테고리 → 핀 아이콘 매핑 (building/park/info 3종)
const PIN_ICON_BY_CAT = {
    '주거': 'building',
    '산업·일자리': 'building',
    '환경': 'park',
    '문화·여가': 'park',
    '교통': 'info',
    '안전': 'info',
    '교육': 'info',
    '보건·복지': 'info',
};
function pinAsset(cat, target) {
    const icon = PIN_ICON_BY_CAT[cat] || 'info';
    const tone = (target === '전문가' || target === 'expert') ? 'gray' : 'teal';
    return `/figma-assets/mobile-diagnosis/pin_${icon}_${tone}.png`;
}

// Figma 302:21392 (진단 목록4 카드) — 시민=점수, 전문가=적합/부적합
const DiagCard = memo(function DiagCard({ it, onNavigate }) {
    const { ref: thumbRef, bgStyle } = useLazyImage(it.thumb);
    const isExpert = it.target === '전문가' || it.target === 'expert';
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

export default function MDiagnosisMap({ onNavigate }) {
    const [category, setCategory] = useState('전체');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filter, setFilter] = useState({ target: 'citizen', bigCats: [], mid: '', sub: '' });
    const [district, setDistrict] = useState('');
    const [districtOpen, setDistrictOpen] = useState(false);
    const [allRows, setAllRows] = useState([]);
    const [diagHasMore, setDiagHasMore] = useState(true);
    const [diagLoadingMore, setDiagLoadingMore] = useState(false);
    const [geoPos, setGeoPos] = useState(null); // 현위치 빨간 점 (Figma Ellipse 17/18)
    const mapRef = useRef(null);

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
                target: r.진단대상 ?? r.target ?? null,
                thumb: r.이미지경로 || null,
                lat: r.위도 != null ? Number(r.위도) : null,
                lng: r.경도 != null ? Number(r.경도) : null,
            }));
    }, [allRows, district, category, filter]);

    // 지도 핀 — Figma 진단 목록5: 개별 진단 teardrop 핀 (카테고리 아이콘 + 시민 teal/전문가 gray)
    const DIAG_PINS = useMemo(
        () => filtered
            .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
            .slice(0, MAX_PINS),
        [filtered],
    );

    // 핀이 비동기로 늦게 채워질 때 카카오 SDK가 오버레이 일부만 붙이는 현상 우회
    // (PCMapCanvas와 동일 워크어라운드: 지도 준비 후 relayout + center 미세 이동)
    const hadPinsRef = useRef(false);
    useEffect(() => {
        if (DIAG_PINS.length === 0 || hadPinsRef.current) return;
        hadPinsRef.current = true;
        let tries = 0;
        const timer = setInterval(() => {
            const m = mapRef.current;
            tries += 1;
            if (!m || !window.kakao?.maps) {
                if (tries >= 30) clearInterval(timer);
                return;
            }
            clearInterval(timer);
            if (typeof m.relayout === 'function') m.relayout();
            const c = m.getCenter();
            m.setCenter(new window.kakao.maps.LatLng(c.getLat() + 0.000001, c.getLng()));
            m.setCenter(c);
        }, 200);
        return () => clearInterval(timer);
    }, [DIAG_PINS.length]);

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

    // 진입 시(구 미선택) 진단 데이터가 화면에 보이도록 핀 가중 중심으로 1회 이동
    const didAutoCenterRef = useRef(false);
    useEffect(() => {
        if (didAutoCenterRef.current || district || !DIAG_PINS.length) return;
        let wLat = 0, wLng = 0;
        for (const p of DIAG_PINS) { wLat += p.lat; wLng += p.lng; }
        const center = { lat: wLat / DIAG_PINS.length, lng: wLng / DIAG_PINS.length };
        didAutoCenterRef.current = true;
        setCurrentCenter(center);
        if (mapRef.current && window.kakao) {
            mapRef.current.panTo(new window.kakao.maps.LatLng(center.lat, center.lng));
        }
    }, [DIAG_PINS, district]);

    // 진단하기 — 지도 중심 좌표를 역지오코딩해 폼으로 이동
    const handleDiagnose = useCallback(() => {
        const goForm = (lat, lng, address) => {
            onNavigate?.('mDiagnosisForm', { lat, lng, address, district: district || null, mode: filter.target });
        };
        const m = mapRef.current;
        if (!m || !window.kakao) {
            goForm(currentCenter.lat, currentCenter.lng, '선택된 위치');
            return;
        }
        const c = m.getCenter();
        const lat = c.getLat();
        const lng = c.getLng();
        if (!window.kakao?.maps?.services) {
            goForm(lat, lng, '선택된 위치');
            return;
        }
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, (result, status) => {
            const addr = status === window.kakao.maps.services.Status.OK
                ? (result[0]?.road_address?.address_name || result[0]?.address?.address_name || '선택된 위치')
                : '선택된 위치';
            goForm(lat, lng, addr);
        });
    }, [onNavigate, district, filter.target, currentCenter]);

    return (
        <div className="m-diag-list-page">
            {/* 헤더 — Figma 302:21255~21260: "← 진단 상세를 선택해주세요  ⌄" */}
            <header className="m-diag-map-header">
                <button
                    type="button"
                    className="m-diag-map-back"
                    aria-label="뒤로"
                    onClick={() => onNavigate?.('home')}
                >
                    <img src="/figma-assets/mobile-diagnosis/arrow_back.png" width="24" height="24" alt="" />
                </button>
                <span className="m-diag-map-header-title-text">진단 상세를 선택해주세요</span>
                <button
                    type="button"
                    className="m-diag-expand-btn"
                    aria-label="진단 상세 필터"
                    onClick={() => setFilterOpen(true)}
                >
                    <img src="/figma-assets/mobile-diagnosis/expand_circle_down.png" width="20" height="20" alt="" />
                </button>
            </header>

            {/* 지도 영역 */}
            <div className="m-diag-map-area">
                {kakaoReady ? (
                    <Map
                        center={currentCenter}
                        level={5}
                        style={{ width: '100%', height: '100%' }}
                        draggable
                        zoomable
                        onCreate={(m) => { mapRef.current = m; }}
                        onDragEnd={(m) => {
                            const c = m.getCenter();
                            setCurrentCenter({ lat: c.getLat(), lng: c.getLng() }); // 스냅백 방지
                        }}
                    >
                        {DIAG_PINS.map((p) => (
                            <MapMarker
                                key={p.id}
                                position={{ lat: p.lat, lng: p.lng }}
                                image={{
                                    src: pinAsset(p.big, p.target),
                                    size: { width: 54, height: 64 },
                                    options: { offset: { x: 27, y: 64 } },
                                }}
                                title={`${p.big} 진단 결과 보기`}
                                onClick={() => onNavigate?.('mDiagnosisResult', p)}
                            />
                        ))}
                        {/* 현위치 빨간 점 — Figma Ellipse 18/17 */}
                        {geoPos && (
                            <CustomOverlayMap position={geoPos} yAnchor={0.5}>
                                <span className="m-diag-geo-dot" aria-hidden="true" />
                            </CustomOverlayMap>
                        )}
                    </Map>
                ) : (
                    <div className="m-diag-map-bg" />
                )}

                {/* 현위치 버튼 — Figma Group 274 */}
                <button
                    type="button"
                    className="m-diag-locate"
                    aria-label="현위치"
                    onClick={() => {
                        if (!('geolocation' in navigator)) return;
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                                setGeoPos(p);
                                if (mapRef.current && window.kakao) {
                                    mapRef.current.panTo(new window.kakao.maps.LatLng(p.lat, p.lng));
                                }
                            },
                            () => {},
                            { timeout: 8000 },
                        );
                    }}
                >
                    <img src="/figma-assets/mobile-diagnosis/map_locate.png" width="24" height="24" alt="" />
                </button>
            </div>

            {/* 하단 시트 — Figma Rectangle 11 + Group 373 핸들 */}
            <div className="m-diag-sheet">
                <button
                    type="button"
                    className="m-diag-sheet-list-btn"
                    aria-label="목록 보기"
                    onClick={() => onNavigate?.('mDiagnosisList')}
                >
                    <img src="/figma-assets/mobile-diagnosis/sheet_handle.png" width="18" height="12" alt="" />
                </button>

                {/* 지역 타이틀 — "부산전체 ▸" */}
                <div className="m-diag-sheet-title-row">
                    <span className="m-diag-sheet-title">{district || '부산전체'}</span>
                    <button
                        type="button"
                        className="m-diag-sheet-title-btn"
                        aria-label="지역 선택"
                        onClick={() => setDistrictOpen(true)}
                    >
                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true">
                            <path d="M1.5 1L6.5 6L1.5 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* 카테고리 칩 — Figma: 시트 내부 2행 wrap */}
                <div className="m-diag-sheet-cats">
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

                {/* 진단하기 FAB — Figma 98x36 r20 */}
                <button type="button" className="m-diag-fab" onClick={handleDiagnose}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>진단하기</span>
                </button>
            </div>

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

            {/* 진단 상세 필터 */}
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
