import { useEffect, useState, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { Map, Polygon, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { CategoryIcon } from '../constants/mapConstants.jsx';
import './PCMapCanvas.css';

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
    // 최대 확대(레벨 1~2)에서는 클러스터를 만들지 않는다 — 더 확대할 수 없는 상태에서
    // 뭉탱이 핀이 남으면 풀 방법이 없기 때문. 같은 건물 등 좌표가 사실상 동일한 핀들은
    // 부채꼴로 미세하게 펼쳐 각각 보이고 클릭도 가능하게 처리.
    if (level <= 2) {
        const seen = Object.create(null);
        return pins.map((p) => {
            if (p.lat == null || p.lng == null) return { ...p, _isPin: true };
            const key = `${p.lat.toFixed(5)}_${p.lng.toFixed(5)}`;
            const n = (seen[key] = (seen[key] ?? -1) + 1);
            if (n === 0) return { ...p, _isPin: true };
            // 두 번째 핀부터 시계방향 부채꼴 오프셋 (레벨1 기준 ~15px 간격)
            const angle = (n - 1) * (Math.PI / 3);
            const r = 0.00012 * Math.ceil(n / 6);
            return { ...p, _isPin: true, lat: p.lat + r * Math.cos(angle), lng: p.lng + r * Math.sin(angle) };
        });
    }
    // 확대된 상태에서도 핀들이 화면상 서로 겹칠 만큼 가까우면(예: 같은 블록) 뭉쳐 보이는
    // 문제가 있어, 임계치 이하에서도 줌에 비례한 촘촘한 격자로 클러스터링을 계속 적용한다.
    const cellDeg = level >= 12 ? 0.3 : level >= 10 ? 0.15 : level >= 8 ? 0.04 : level >= 7 ? 0.02
        : level >= 6 ? 0.01 : level >= 5 ? 0.005 : level >= 4 ? 0.0025 : 0.0012;
    const buckets = Object.create(null);
    pins.forEach((pin) => {
        if (pin.lat == null || pin.lng == null) return;
        const r = Math.round(pin.lat / cellDeg);
        const c = Math.round(pin.lng / cellDeg);
        const key = `${r}_${c}`;
        // r, c를 저장해 격자 셀 중심 계산에 사용
        if (buckets[key]) buckets[key].items.push(pin);
        else buckets[key] = { r, c, items: [pin] };
    });
    const result = [];
    Object.entries(buckets).forEach(([key, b]) => {
        if (b.items.length === 1) {
            result.push({ ...b.items[0], _isPin: true });
        } else {
            // 격자 셀 중심 대신 실제 멤버 centroid 사용
            // → 줌 변화/패널 전환 시 클러스터가 실제 핀 위치에서 크게 벗어나지 않아 순간이동 최소화
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
// Gray solid: fill #777 — 시민 진단 핀
const DIAG_GRAY_PATH = 'M54 26.6667C54 41.3943 37.8 54.2222 27 64C15.3 54.2222 0 41.3943 0 26.6667C0 11.9391 12.0883 0 27 0C41.9117 0 54 11.9391 54 26.6667Z';
// Teal hollow: fill white + stroke #23BDBB — 전문가 진단 핀
const DIAG_TEAL_PATH = 'M27 1.5C41.1009 1.5 52.5 12.7853 52.5 26.667C52.4999 33.4838 48.74 40.0256 43.4131 46.2109C38.4046 52.0265 32.23 57.2915 26.9658 62.0146C21.352 57.3161 15.1559 52.0298 10.2588 46.2227C5.05984 40.0575 1.50011 33.5078 1.5 26.667C1.5 12.7853 12.8991 1.5 27 1.5Z';

// 대분류 → CategoryIcon kind 매핑
const BIG_TO_ICON = {
    '주거': 'home', '환경': 'leaf', '교통': 'bus', '안전': 'shield',
    '교육': 'book', '산업·일자리': 'briefcase', '문화·여가': 'heart', '보건·복지': 'plus',
};

const PCMapCanvas = forwardRef(function PCMapCanvas({ pins = [], onPinClick, onMapClick, onRegionClick, selectedPoint = null, accentColor = '#E6235A', showRegions = true, mapType = 'roadmap', initialCenter = null, initialLevel = null, pinVariant = 'solid', showLocateBtn = false, selectedDistrict = null }, ref) {
    useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services'] });
    const [geo, setGeo] = useState(null);
    const [internalShowRegions, setInternalShowRegions] = useState(showRegions);
    const [internalMapType, setInternalMapType] = useState(mapType);
    const [center, setCenter] = useState(initialCenter || BUSAN_CENTER);
    const [level, setLevel] = useState(initialLevel ?? BUSAN_DEFAULT_LEVEL);
    const [myLocation, setMyLocation] = useState(null);
    const mapInstance = useRef(null);
    const containerRef = useRef(null);
    const geoRef = useRef(null);
    const isFirstDistrictRun = useRef(true);
    const listenerAttachedMapsRef = useRef(new WeakSet());

    useEffect(() => {
        loadGeo().then((d) => { if (d) { setGeo(d); geoRef.current = d; } });
    }, []);

    // 컨테이너 크기 변경(사이드바 토글 등) 시 카카오맵 relayout 호출 → 핀 위치 틀어짐 방지
    useEffect(() => {
        const el = containerRef.current;
        if (!el || !('ResizeObserver' in window)) return;
        const ro = new ResizeObserver(() => {
            const map = mapInstance.current;
            if (map && typeof map.relayout === 'function') map.relayout();
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // pins가 비어있다가 뒤늦게(비동기 fetch) 채워지는 경우, 카카오맵 SDK가 대량의
    // CustomOverlayMap을 한 번에 붙일 때 일부만 렌더하고 멈추는 현상이 있어(드래그해야
    // 나머지가 나타남) — center를 미세하게 흔들어 강제로 오버레이 재배치를 트리거한다.
    const hadPins = useRef(false);
    useEffect(() => {
        if (pins.length === 0 || hadPins.current) return;
        hadPins.current = true;
        // fetch가 지도 인스턴스 생성보다 먼저 끝나면 1회성 setTimeout이 no-op이 되어
        // 핀이 안 그려지는 레이스가 있었음 — 지도가 준비될 때까지 재시도(최대 ~6초)
        let tries = 0;
        const timer = setInterval(() => {
            const map = mapInstance.current;
            tries += 1;
            if (!map || !window.kakao?.maps) {
                if (tries >= 30) clearInterval(timer);
                return;
            }
            clearInterval(timer);
            if (typeof map.relayout === 'function') map.relayout();
            const c = map.getCenter();
            map.setCenter(new window.kakao.maps.LatLng(c.getLat() + 0.000001, c.getLng()));
            map.setCenter(c);
        }, 200);
        return () => clearInterval(timer);
    }, [pins.length]);

    // Fly to selected district (only on user-triggered changes, not on initial mount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (isFirstDistrictRun.current) {
            isFirstDistrictRun.current = false;
            return;
        }
        const currentGeo = geoRef.current;
        if (!selectedDistrict || !currentGeo) return;
        const feature = currentGeo.features.find(f => f.properties.name === selectedDistrict);
        if (!feature) return;
        const g = feature.geometry;
        const allCoords = [];
        if (g.type === 'Polygon') g.coordinates[0].forEach(([lng, lat]) => allCoords.push({ lat, lng }));
        else if (g.type === 'MultiPolygon') g.coordinates.forEach(poly => poly[0].forEach(([lng, lat]) => allCoords.push({ lat, lng })));
        if (!allCoords.length) return;
        const lats = allCoords.map(c => c.lat);
        const lngs = allCoords.map(c => c.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const maxSpan = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
        const zoomLevel = maxSpan < 0.03 ? 6 : maxSpan < 0.06 ? 7 : maxSpan < 0.1 ? 8 : 9;
        setCenter({ lat: centerLat, lng: centerLng });
        setLevel(zoomLevel);
    }, [selectedDistrict]);

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

    // 카카오맵 SDK의 'click' 이벤트는 자체 히트테스트로 발생해 React 합성 이벤트의
    // e.stopPropagation()으로는 막히지 않는다(핀/클러스터를 눌러도 지도 클릭이 같이 발생해
    // 위치선택 CTA가 함께 뜨는 버그) — ref 플래그로 핀 클릭 직후의 지도 클릭 1회를 무시.
    const suppressMapClickRef = useRef(false);
    const suppressNextMapClick = () => {
        suppressMapClickRef.current = true;
        // 클러스터 클릭은 급격한 zoom/center 변경을 유발해 카카오맵 내부 클릭 처리가
        // 지연될 수 있어 여유있게 잡는다(소비되면 지도 클릭 리스너에서 즉시 false로 리셋).
        setTimeout(() => { suppressMapClickRef.current = false; }, 500);
    };

    const handleClusterClick = (cluster) => {
        suppressNextMapClick();
        // zoom/center 변경으로 클러스터 버튼 DOM이 즉시 사라지면, 진행 중이던 네이티브
        // 클릭 제스처(mousedown→mouseup)의 나머지가 그 자리의 지도 자체로 떨어져 카카오맵이
        // 별도 지도 클릭으로 인식하는 경우가 있어, 한 프레임 지연시켜 제스처가 먼저 끝나게 한다.
        requestAnimationFrame(() => {
            // 기존엔 레벨을 무조건 -4(최대 1까지) 확대해, 클러스터 멤버가 넓게 퍼져있으면
            // 화면 밖으로 나가버렸다(78건 클러스터 확대 시 세부 핀들이 화면 밖에 위치하던 버그).
            // 멤버들의 실제 bounding box를 계산해 중심/레벨을 span에 맞춰 산정한다 —
            // "구역별 이동" 로직(아래 selectedDistrict useEffect)과 동일한 계산 방식.
            const items = (cluster._items && cluster._items.length > 0) ? cluster._items : [cluster];
            const lats = items.map((p) => p.lat);
            const lngs = items.map((p) => p.lng);
            const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
            const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
            const maxSpan = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
            const fitLevel = maxSpan < 0.002 ? 2 : maxSpan < 0.005 ? 3 : maxSpan < 0.01 ? 4
                : maxSpan < 0.02 ? 5 : maxSpan < 0.04 ? 6 : CLUSTER_LEVEL_THRESHOLD - 1;
            const nextLevel = Math.max(1, Math.min(fitLevel, level - 1, CLUSTER_LEVEL_THRESHOLD - 1));
            // 이미 최대 확대 상태라 더 zoom-in해도 멤버들이 여전히 뭉쳐있는 경우(같은 건물 등,
            // 최소 격자 셀보다도 가까운 경우) — 줌으로는 절대 안 풀리므로 첫 항목을 바로 열어준다.
            // (제보맵에서 "2건" 클러스터를 최대확대 상태로 눌러도 아무 반응 없던 버그)
            if (nextLevel >= level && onPinClick) {
                onPinClick(items[0]);
                return;
            }
            setCenter({ lat: centerLat, lng: centerLng });
            setLevel(nextLevel);
        });
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Map
            center={center}
            level={level}
            style={{ width: '100%', height: '100%' }}
            draggable
            zoomable
            mapTypeId={internalMapType === 'hybrid' ? 'HYBRID' : 'ROADMAP'}
            onCreate={(m) => {
                mapInstance.current = m;
                // React.StrictMode(개발모드)는 onCreate를 두 번 호출할 수 있어, 가드 없이
                // addListener하면 같은 지도 인스턴스에 'click' 리스너가 중복 등록된다.
                // 실제 클릭 시 첫 리스너가 suppress 플래그를 정상 소비(reset)한 뒤 두 번째
                // 리스너가 이미 false가 된 플래그를 보고 오작동(지도 클릭 재발생)하는 게
                // "클러스터 클릭 시 위치선택 CTA가 가끔씩 같이 뜨는" 간헐적 버그의 원인이었다.
                if (onMapClick && !listenerAttachedMapsRef.current.has(m)) {
                    listenerAttachedMapsRef.current.add(m);
                    window.kakao.maps.event.addListener(m, 'click', (mouseEvent) => {
                        if (suppressMapClickRef.current) { suppressMapClickRef.current = false; return; }
                        const lat = mouseEvent.latLng.getLat();
                        const lng = mouseEvent.latLng.getLng();
                        onMapClick({ lat, lng });
                    });
                }
            }}
            onZoomChanged={(m) => setLevel(m.getLevel())}
            onDragEnd={(m) => {
                const latlng = m.getCenter();
                setCenter({ lat: latlng.getLat(), lng: latlng.getLng() });
            }}
        >
            {internalShowRegions && polygons.map((p) => {
                const isSelected = selectedDistrict && p.name === selectedDistrict;
                return p.paths.map((path, i) => (
                    <Polygon
                        key={`${p.name}-${i}`}
                        path={path}
                        strokeColor={isSelected ? accentColor : "#888"}
                        strokeWeight={isSelected ? 3 : 1}
                        strokeOpacity={isSelected ? 1 : 0.6}
                        fillColor={isSelected ? accentColor : "#fff"}
                        fillOpacity={isSelected ? 0.12 : 0.10}
                        zIndex={isSelected ? 1 : 0}
                        onClick={onRegionClick ? () => onRegionClick(p.name) : undefined}
                    />
                ));
            })}

            {selectedPoint && (
                <CustomOverlayMap position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }} yAnchor={1} xAnchor={0.5}>
                    <div style={{ pointerEvents: 'none', filter: 'drop-shadow(0 2px 6px rgba(6,171,105,0.5))' }}>
                        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
                            <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 36 14 36s14-26.375 14-36C28 6.268 21.732 0 14 0z" fill="#06AB69"/>
                            <circle cx="14" cy="14" r="6" fill="#fff"/>
                        </svg>
                    </div>
                </CustomOverlayMap>
            )}

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
                        xAnchor={0.5}
                    >
                        {pinVariant === 'diagnosis' ? (
                            /* ── 진단 핀: 시민=회색 teardrop / 전문가=청록 테두리 teardrop + 카테고리 아이콘 ── */
                            isCluster ? (
                                <button
                                    type="button"
                                    onMouseDown={suppressNextMapClick}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); handleClusterClick(pin); }}
                                    className="pc-diag-tdrop-btn pc-diag-tdrop-btn--cluster"
                                    aria-label={`${pin.count}건`}
                                >
                                    <svg width="44" height="52" viewBox="0 0 54 64" fill="none">
                                        <path d={DIAG_GRAY_PATH} fill="#555" />
                                        <text x="27" y="29" textAnchor="middle" dominantBaseline="middle"
                                            fill="white" fontSize="17" fontWeight="800" fontFamily="inherit">
                                            {pin.count}
                                        </text>
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onMouseDown={suppressNextMapClick}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); suppressNextMapClick(); onPinClick && onPinClick(pin); }}
                                    className={`pc-diag-tdrop-btn${pin.focus ? ' pc-diag-tdrop-btn--focus' : ''}`}
                                    aria-label={pin.title || '진단'}
                                >
                                    <svg width="40" height="47" viewBox="0 0 54 64" fill="none">
                                        {pin.targetType === '전문가' ? (
                                            <path d={DIAG_TEAL_PATH} fill="#fff" stroke="#23BDBB" strokeWidth="3" />
                                        ) : (
                                            <path d={DIAG_GRAY_PATH} fill="#777" />
                                        )}
                                    </svg>
                                    <span
                                        className="pc-diag-tdrop-icon"
                                        style={{ color: pin.targetType === '전문가' ? '#23BDBB' : '#fff' }}
                                    >
                                        <CategoryIcon kind={BIG_TO_ICON[pin.big] || 'grid'} />
                                    </span>
                                </button>
                            )
                        ) : isCluster ? (
                            /* ── 제보/제안: Figma Union 말풍선 클러스터 ── */
                            <button
                                type="button"
                                onMouseDown={suppressNextMapClick}
                                onClick={(e) => { e.stopPropagation(); handleClusterClick(pin); }}
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
                                onMouseDown={suppressNextMapClick}
                                onClick={(e) => { e.stopPropagation(); suppressNextMapClick(); onPinClick && onPinClick(pin); }}
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
                                    onMouseDown={suppressNextMapClick}
                                    onClick={(e) => { e.stopPropagation(); suppressNextMapClick(); onPinClick && onPinClick(pin); }}
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
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                        <span>{pin.votes}</span>
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
