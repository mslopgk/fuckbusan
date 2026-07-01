import { Map, Polygon, MarkerClusterer, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { useEffect, useState, useMemo, memo, useCallback, useRef } from 'react';
import '../../styles/admin.css';

const BUSAN_CENTER = { lat: 35.1795543, lng: 129.0756416 };

const Loader2 = ({ className }) => (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const toPath = (coords) => coords.map(([lng, lat]) => ({ lat, lng }));
const featureToPaths = (feature) => {
    const g = feature.geometry;
    if (g.type === 'Polygon') return [toPath(g.coordinates[0])];
    if (g.type === 'MultiPolygon') return g.coordinates.map(poly => toPath(poly[0]));
    return [];
};

const getSeverityFill = (severity) => {
    switch (severity) {
        case 'high': return '#f87171';
        case 'medium': return '#fb923c';
        case 'low': return '#4ade80';
        default: return '#60a5fa';
    }
};
const getMarkerColor = (severity) => severity === 'high' ? '#dc2626' : (severity === 'medium' ? '#f59e0b' : '#3b82f6');

const MapCanvas = memo(({ selectedCategories = [], userType = 'all', selectedDistricts = [], onSelectDistricts, insights = [], analysisData = [], onViewDetail }) => {
    useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services', 'clusterer'] });
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [openPopupId, setOpenPopupId] = useState(null);
    const mapRef = useRef(null);

    useEffect(() => {
        setIsLoading(true);
        fetch('/assets/busan_districts_high.json')
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
            .then(data => { setGeoJsonData(data); setIsLoading(false); })
            .catch(err => { console.error('Failed to load GeoJSON:', err); setIsLoading(false); });
    }, []);

    const features = useMemo(() => {
        if (!geoJsonData) return [];
        return geoJsonData.features.map(f => ({
            code: f.properties.code,
            name: f.properties.name,
            paths: featureToPaths(f),
        }));
    }, [geoJsonData]);

    const getSeverity = useCallback((code) => {
        const analysis = analysisData.find(a => a.name === code || a.district_code === code);
        if (analysis) {
            if (analysis.safety < 75) return 'high';
            if (analysis.safety < 85) return 'medium';
            return 'low';
        }
        return 'low';
    }, [analysisData]);

    const filteredData = useMemo(() => {
        if (!insights) return [];
        return insights.filter(item => {
            if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) return false;
            if (selectedDistricts.length > 0 && !selectedDistricts.includes(item.district_code)) return false;
            return true;
        }).map(item => ({
            id: item.id,
            lat: item.latitude,
            lng: item.longitude,
            severity: item.severity,
            category: item.category,
            label: item.title,
            date: item.date,
            proposer: item.proposer,
            proposerRole: '시민',
            type: 'citizen',
            image: item.image_url || 'https://placehold.co/300x200?text=No+Image',
        }));
    }, [insights, selectedCategories, selectedDistricts]);

    // RegionFocus: when selectedDistricts change, fit bounds via mapRef
    useEffect(() => {
        if (!mapRef.current || !geoJsonData || !window.kakao?.maps) return;
        const map = mapRef.current;
        if (selectedDistricts.length === 0) {
            map.setCenter(new window.kakao.maps.LatLng(BUSAN_CENTER.lat, BUSAN_CENTER.lng));
            map.setLevel(8);
            return;
        }
        const selectedFeatures = geoJsonData.features.filter(f => selectedDistricts.includes(f.properties.code));
        if (!selectedFeatures.length) return;
        const bounds = new window.kakao.maps.LatLngBounds();
        selectedFeatures.forEach(f => featureToPaths(f).forEach(path => path.forEach(p => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)))));
        map.setBounds(bounds);
    }, [selectedDistricts, geoJsonData]);

    const handleDistrictClick = (code) => {
        if (!onSelectDistricts) return;
        if (selectedDistricts.includes(code)) onSelectDistricts(selectedDistricts.filter(c => c !== code));
        else onSelectDistricts([code]);
    };

    const handleFullscreen = () => {
        const el = mapRef.current?.getNode?.() || document.querySelector('.map-canvas-container');
        if (!document.fullscreenElement) el?.requestFullscreen?.();
        else document.exitFullscreen();
    };

    const handleReset = () => {
        if (!mapRef.current) return;
        mapRef.current.setCenter(new window.kakao.maps.LatLng(BUSAN_CENTER.lat, BUSAN_CENTER.lng));
        mapRef.current.setLevel(8);
        if (onSelectDistricts) onSelectDistricts([]);
    };

    return (
        <div className="map-canvas-container">
            {isLoading && (
                <div className="map-loader">
                    <div className="loader-content">
                        <Loader2 className="map-loader-icon" />
                        <span className="map-loader-text">지도 데이터 로딩 중...</span>
                    </div>
                </div>
            )}

            <Map
                center={BUSAN_CENTER}
                level={8}
                className="mapbox"
                style={{ width: '100%', height: '100%' }}
                onCreate={(map) => { mapRef.current = map; }}
                onClick={() => setOpenPopupId(null)}
            >
                {/* Choropleth */}
                {features.map(({ code, name, paths }) => {
                    const severity = getSeverity(code);
                    const isSelected = selectedDistricts.includes(code);
                    const isDimmed = selectedDistricts.length > 0 && !isSelected;
                    return paths.map((path, pi) => (
                        <Polygon
                            key={`${code}-${pi}-${isSelected}`}
                            path={path}
                            fillColor={getSeverityFill(severity)}
                            fillOpacity={isDimmed ? 0.1 : 0.35}
                            strokeWeight={isSelected ? 2 : 1}
                            strokeColor={isSelected ? '#334155' : '#ffffff'}
                            strokeOpacity={1}
                            onClick={() => handleDistrictClick(code)}
                        />
                    ));
                })}

                {/* Data Points with Clusterer */}
                {filteredData.length > 0 && (
                    <MarkerClusterer averageCenter minLevel={6} disableClickZoom={false}>
                        {filteredData.map((d) => (
                            <CustomOverlayMap key={d.id} position={{ lat: d.lat, lng: d.lng }} yAnchor={0.5} xAnchor={0.5}>
                                <div
                                    onClick={(e) => { e.stopPropagation(); setOpenPopupId(d.id); }}
                                    style={{
                                        width: d.severity === 'high' ? 24 : 16,
                                        height: d.severity === 'high' ? 24 : 16,
                                        borderRadius: '50%',
                                        background: getMarkerColor(d.severity),
                                        border: '2px solid white',
                                        opacity: 0.9,
                                        cursor: 'pointer',
                                    }}
                                />
                            </CustomOverlayMap>
                        ))}
                    </MarkerClusterer>
                )}

                {/* Popup */}
                {openPopupId && (() => {
                    const d = filteredData.find(x => x.id === openPopupId);
                    if (!d) return null;
                    return (
                        <CustomOverlayMap position={{ lat: d.lat, lng: d.lng }} yAnchor={1.2} xAnchor={0.5} zIndex={1000}>
                            <div className="custom-popup" onClick={(e) => e.stopPropagation()}>
                                <div className="popup-card">
                                    <div className="popup-image-area">
                                        <img src={d.image} alt="현장 사진" className="popup-img" loading="lazy" />
                                        <div className="popup-badge">
                                            <span className={`badge-text ${d.severity === 'high' ? 'severity-high' : (d.severity === 'medium' ? 'severity-medium' : 'severity-low')}`}>
                                                {d.severity === 'high' ? '위험' : (d.severity === 'medium' ? '주의' : '양호')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="popup-content">
                                        <h4 className="popup-title">{d.label}</h4>
                                        <p className="popup-category">{d.category.toUpperCase()} 이슈</p>
                                        <div className="popup-meta-row">
                                            <div className="popup-proposer">
                                                <div className="proposer-avatar">{d.type === 'expert' ? '🤖' : '🧑'}</div>
                                                <div className="proposer-info">
                                                    <span className="proposer-name">{d.proposer}</span>
                                                    <span className="proposer-role">{d.proposerRole}</span>
                                                </div>
                                            </div>
                                            <div className="popup-date">
                                                <span className="date-label">등록일</span>
                                                <span className="date-value">{d.date}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onViewDetail && onViewDetail(d); }}
                                            className="popup-btn"
                                        >
                                            자세히 보기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CustomOverlayMap>
                    );
                })()}
            </Map>

            {/* Custom Controls */}
            <div className="custom-control-wrapper" style={{ position: 'absolute', top: 12, right: 12, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={handleFullscreen} title="전체화면" className="custom-control-btn">⛶</button>
                <button onClick={handleReset} title="시점 초기화" className="custom-control-btn">⟲</button>
            </div>

            {/* Legend */}
            <div className="map-legend">
                <div className="legend-list">
                    <div className="legend-header"><span>지역 위험도 (히트맵)</span></div>
                    {selectedDistricts && selectedDistricts.length > 0 && (
                        <div className="legend-item" style={{ color: '#f43f5e' }}>
                            <span>* 선정 지역 상세 분석 중</span>
                        </div>
                    )}
                    <div className="legend-item"><div className="legend-color bg-red-500"></div><span>위험 (다수 신고)</span></div>
                    <div className="legend-item"><div className="legend-color bg-orange-500"></div><span>주의</span></div>
                    <div className="legend-item"><div className="legend-color bg-green-500"></div><span>양호</span></div>
                </div>
            </div>
        </div>
    );
});

export default MapCanvas;
