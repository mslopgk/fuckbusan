import { useEffect, useState, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { Map, Polygon, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';

const toPath = (coords) => coords.map(([lng, lat]) => ({ lat, lng }));
const featureToPaths = (feature) => {
    const g = feature.geometry;
    if (g.type === 'Polygon') return [toPath(g.coordinates[0])];
    if (g.type === 'MultiPolygon') return g.coordinates.map(p => toPath(p[0]));
    return [];
};

const BUSAN_CENTER = { lat: 35.158, lng: 129.06 };

let _geoCache = null;
let _geoPromise = null;
function loadGeo() {
    if (_geoCache) return Promise.resolve(_geoCache);
    if (_geoPromise) return _geoPromise;
    _geoPromise = fetch('/assets/busan_districts_high.json')
        .then((r) => r.json())
        .then((d) => { _geoCache = d; return d; })
        .catch(() => null);
    return _geoPromise;
}
const BUSAN_DEFAULT_LEVEL = 8;

// 줌 레벨 >= 임계치 일 때 인근 핀들을 합쳐서 클러스터로 표시.
// 카카오맵 level은 작을수록 확대(가까움). level 7부터 클러스터.
const CLUSTER_LEVEL_THRESHOLD = 7;

function buildClusters(pins, level) {
    if (level < CLUSTER_LEVEL_THRESHOLD) return pins.map((p) => ({ ...p, _isPin: true }));
    // bucket size scales with level. 더 멀수록 큰 셀.
    const cellDeg = level >= 12 ? 0.3 : level >= 10 ? 0.15 : level >= 8 ? 0.04 : 0.02;
    // 카카오맵 sdk에서 Map(컴포넌트)을 import 했기 때문에 ES Map 생성자 사용 시 이름 충돌.
    // 평범한 객체로 buckets 관리.
    const buckets = Object.create(null);
    pins.forEach((pin) => {
        if (pin.lat == null || pin.lng == null) return;
        const r = Math.round(pin.lat / cellDeg);
        const c = Math.round(pin.lng / cellDeg);
        const key = `${r}_${c}`;
        if (buckets[key]) buckets[key].items.push(pin);
        else buckets[key] = { items: [pin] };
    });
    const result = [];
    Object.entries(buckets).forEach(([key, b]) => {
        if (b.items.length === 1) {
            result.push({ ...b.items[0], _isPin: true });
        } else {
            const lat = b.items.reduce((s, p) => s + p.lat, 0) / b.items.length;
            const lng = b.items.reduce((s, p) => s + p.lng, 0) / b.items.length;
            const color = b.items[0].color;
            result.push({
                id: `cluster_${key}`,
                lat,
                lng,
                count: b.items.length,
                color,
                _items: b.items,
                _isCluster: true,
            });
        }
    });
    return result;
}

// Figma 진단 핀 paths (viewBox 0 0 54 64)
// Gray solid (imgGroup670/672): fill #777 — 일반 진단 핀
const DIAG_GRAY_PATH = 'M54 26.6667C54 41.3943 37.8 54.2222 27 64C15.3 54.2222 0 41.3943 0 26.6667C0 11.9391 12.0883 0 27 0C41.9117 0 54 11.9391 54 26.6667Z';
// Teal hollow (imgGroup669/677): fill white + stroke #25D2BC — 선택/포커스 핀
const DIAG_TEAL_PATH = 'M27 1.5C41.1009 1.5 52.5 12.7853 52.5 26.667C52.4999 33.4838 48.74 40.0256 43.4131 46.2109C38.4046 52.0265 32.23 57.2915 26.9658 62.0146C21.352 57.3161 15.1559 52.0298 10.2588 46.2227C5.05984 40.0575 1.50011 33.5078 1.5 26.667C1.5 12.7853 12.8991 1.5 27 1.5Z';

const PCMapCanvas = forwardRef(function PCMapCanvas({ pins = [], onPinClick, accentColor = '#E6235A', showRegions = true, mapType = 'roadmap', initialCenter = null, initialLevel = null, pinVariant = 'solid', showLocateBtn = false }, ref) {
    useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services'] });
    const [geo, setGeo] = useState(null);
    const [internalShowRegions, setInternalShowRegions] = useState(showRegions);
    const [internalMapType, setInternalMapType] = useState(mapType);
    const [center, setCenter] = useState(initialCenter || BUSAN_CENTER);
    const [level, setLevel] = useState(initialLevel ?? BUSAN_DEFAULT_LEVEL);
    const [myLocation, setMyLocation] = useState(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        loadGeo().then((d) => { if (d) setGeo(d); });
    }, []);

    useEffect(() => {
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {},
            { timeout: 8000 }
        );
    }, []);

    const handleLocateMe = () => {
        if (!('geolocation' in navigator)) {
            alert('이 브라우저에서는 현위치를 가져올 수 없습니다.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setMyLocation(loc);
                setCenter(loc);
                setLevel(5);
            },
            () => alert('현위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.'),
            { timeout: 8000 }
        );
    };

    useImperativeHandle(ref, () => ({
        zoomIn: () => setLevel((l) => Math.max(1, l - 1)),
        zoomOut: () => setLevel((l) => Math.min(14, l + 1)),
        recenter: () => {
            setCenter(BUSAN_CENTER);
            setLevel(BUSAN_DEFAULT_LEVEL);
        },
        locateMe: handleLocateMe,
        toggleRegions: () => setInternalShowRegions((v) => !v),
        toggleMapType: () => setInternalMapType((t) => t === 'roadmap' ? 'hybrid' : 'roadmap'),
        getMap: () => mapInstance.current,
    }), []);

    const polygons = useMemo(() => {
        if (!geo) return [];
        return geo.features.map((f) => ({
            name: f.properties.name,
            paths: featureToPaths(f),
        }));
    }, [geo]);

    const renderedPins = useMemo(() => buildClusters(pins, level), [pins, level]);

    const handleClusterClick = (cluster) => {
        // 클러스터 클릭 시 zoom in (level 1단계 줄임) + 클러스터 위치로 센터 이동.
        setCenter({ lat: cluster.lat, lng: cluster.lng });
        setLevel((l) => Math.max(1, l - 2));
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Map
            center={center}
            level={level}
            style={{ width: '100%', height: '100%' }}
            draggable
            zoomable
            mapTypeId={internalMapType === 'hybrid' ? 'HYBRID' : 'ROADMAP'}
            onCreate={(m) => { mapInstance.current = m; }}
            onZoomChanged={(m) => setLevel(m.getLevel())}
            onDragEnd={(m) => {
                const latlng = m.getCenter();
                setCenter({ lat: latlng.getLat(), lng: latlng.getLng() });
            }}
        >
            {internalShowRegions && polygons.map((p) => p.paths.map((path, i) => (
                <Polygon
                    key={`${p.name}-${i}`}
                    path={path}
                    strokeColor="#888"
                    strokeWeight={1}
                    strokeOpacity={0.6}
                    fillColor="#fff"
                    fillOpacity={0.10}
                />
            )))}

            {myLocation && (
                <CustomOverlayMap
                    position={myLocation}
                    yAnchor={0.5}
                    xAnchor={0.5}
                >
                    <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#E03030',
                        border: '3px solid #fff',
                        boxShadow: '0 0 0 2px rgba(224,48,48,0.4), 0 2px 8px rgba(0,0,0,0.25)',
                        cursor: 'default',
                        pointerEvents: 'none',
                    }} />
                </CustomOverlayMap>
            )}

            {renderedPins.map((pin) => {
                const isCluster = pin._isCluster;
                const showVotes = !isCluster && (pin.votes != null && pin.votes > 0);
                return (
                    <CustomOverlayMap
                        key={pin.id}
                        position={{ lat: pin.lat, lng: pin.lng }}
                        yAnchor={1}
                    >
                        {pinVariant === 'diagnosis' ? (
                            /* ── 진단 지도 전용 핀 렌더링 ── */
                            isCluster ? (
                                /* 클러스터: gray solid + 카운트 배지 */
                                <button
                                    type="button"
                                    onClick={() => handleClusterClick(pin)}
                                    className="pc-diag-pin"
                                    aria-label={`${pin.count}건`}
                                >
                                    <svg width="30" height="36" viewBox="0 0 54 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d={DIAG_GRAY_PATH} fill="#777777"/>
                                    </svg>
                                    <span className="pc-diag-pin-badge">{pin.count}</span>
                                </button>
                            ) : pin.focus ? (
                                /* 선택/포커스 핀: teal hollow */
                                <button
                                    type="button"
                                    onClick={() => onPinClick && onPinClick(pin)}
                                    className="pc-diag-pin pc-diag-pin--focus"
                                    aria-label={pin.title}
                                >
                                    <svg width="30" height="36" viewBox="0 0 54 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d={DIAG_TEAL_PATH} fill="white" stroke="#25D2BC" strokeWidth="4"/>
                                    </svg>
                                </button>
                            ) : (
                                /* 일반 핀: gray solid */
                                <button
                                    type="button"
                                    onClick={() => onPinClick && onPinClick(pin)}
                                    className="pc-diag-pin"
                                    aria-label={pin.title}
                                >
                                    <svg width="30" height="36" viewBox="0 0 54 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d={DIAG_GRAY_PATH} fill="#777777"/>
                                    </svg>
                                </button>
                            )
                        ) : isCluster ? (
                            /* ── 제보/제안: Figma Union 말풍선 클러스터 ── */
                            <button
                                type="button"
                                onClick={() => handleClusterClick(pin)}
                                className="pc-kakao-cluster-balloon"
                                aria-label={`${pin.count}건`}
                            >
                                <svg width="45" height="32" viewBox="0 0 45 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M31.5 0C38.9558 2.89916e-07 45 6.04416 45 13.5C45 20.9558 38.9558 27 31.5 27H25.8867L23 32L20.1133 27H13.5C6.04416 27 0 20.9558 0 13.5C0 6.04416 6.04416 2.89916e-07 13.5 0H31.5Z"
                                        fill={pin.color || accentColor}
                                    />
                                </svg>
                                <span className="pc-kakao-balloon-count">{pin.count}</span>
                            </button>
                        ) : pin.count != null ? (
                            <button
                                type="button"
                                onClick={() => onPinClick && onPinClick(pin)}
                                className="pc-kakao-pin pc-kakao-pin-count"
                                style={{ background: pin.color || accentColor, '--pin-bg': pin.color || accentColor }}
                                aria-label={pin.title || `${pin.count}건`}
                            >
                                {pin.count}
                            </button>
                        ) : (
                            <div className="pc-kakao-pin-wrap">
                                <button
                                    type="button"
                                    onClick={() => onPinClick && onPinClick(pin)}
                                    className={`pc-kakao-pin${pin.focus ? ' pc-kakao-pin--focus' : ''}`}
                                    aria-label={pin.title}
                                >
                                    <svg width="27" height="32" viewBox="0 0 27 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M13.5 0C20.956 0 27 6.044 27 13.5C27 21.3 13.5 32 13.5 32C13.5 32 0 21.3 0 13.5C0 6.044 6.044 0 13.5 0Z"
                                            fill={pin.color || accentColor}
                                        />
                                    </svg>
                                </button>
                                {showVotes && (
                                    <span
                                        className="pc-kakao-pin-vote"
                                        style={{ borderColor: pin.color || accentColor, color: pin.color || accentColor }}
                                    >
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                        {' '}{pin.votes}
                                    </span>
                                )}
                            </div>
                        )}
                    </CustomOverlayMap>
                );
            })}
        </Map>
        {showLocateBtn && (
            <button
                onClick={handleLocateMe}
                style={{
                    position: 'absolute', right: 12, bottom: 12,
                    width: 42, height: 42, borderRadius: '50%',
                    background: '#fff', border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    zIndex: 10,
                }}
                title="내 위치"
                aria-label="내 위치"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="12" y1="2" x2="12" y2="5"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="5" y2="12"/>
                    <line x1="19" y1="12" x2="22" y2="12"/>
                </svg>
            </button>
        )}
        </div>
    );
});

export default PCMapCanvas;
