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
const BUSAN_DEFAULT_LEVEL = 8;

const PCMapCanvas = forwardRef(function PCMapCanvas({ pins = [], onPinClick, accentColor = '#E6235A', showRegions = true, mapType = 'roadmap' }, ref) {
    useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services'] });
    const [geo, setGeo] = useState(null);
    const [internalShowRegions, setInternalShowRegions] = useState(showRegions);
    const [internalMapType, setInternalMapType] = useState(mapType);
    const [center, setCenter] = useState(BUSAN_CENTER);
    const [level, setLevel] = useState(BUSAN_DEFAULT_LEVEL);
    const mapInstance = useRef(null);

    useEffect(() => {
        fetch('/assets/busan_districts_high.json').then((r) => r.json()).then(setGeo).catch(() => {});
    }, []);

    useImperativeHandle(ref, () => ({
        zoomIn: () => setLevel((l) => Math.max(1, l - 1)),
        zoomOut: () => setLevel((l) => Math.min(14, l + 1)),
        recenter: () => {
            setCenter(BUSAN_CENTER);
            setLevel(BUSAN_DEFAULT_LEVEL);
        },
        locateMe: () => {
            if (!('geolocation' in navigator)) {
                alert('이 브라우저에서는 현위치를 가져올 수 없습니다.');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLevel(5);
                },
                () => alert('현위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.'),
                { timeout: 8000 }
            );
        },
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

    return (
        <Map
            center={center}
            level={level}
            style={{ width: '100%', height: '100%' }}
            draggable
            zoomable
            mapTypeId={internalMapType === 'hybrid' ? 'HYBRID' : 'ROADMAP'}
            onCreate={(m) => { mapInstance.current = m; }}
            onZoomChanged={(m) => setLevel(m.getLevel())}
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

            {pins.map((pin) => (
                <CustomOverlayMap
                    key={pin.id}
                    position={{ lat: pin.lat, lng: pin.lng }}
                    yAnchor={1}
                >
                    {pin.count != null ? (
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
                        <button
                            type="button"
                            onClick={() => onPinClick && onPinClick(pin)}
                            className="pc-kakao-pin"
                            style={{ background: pin.color || accentColor }}
                            aria-label={pin.title}
                        >
                            <span></span>
                        </button>
                    )}
                </CustomOverlayMap>
            ))}
        </Map>
    );
});

export default PCMapCanvas;
