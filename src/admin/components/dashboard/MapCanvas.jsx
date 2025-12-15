import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Pane, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import L from 'leaflet';
import '../../styles/admin.css';

// 부산 중심 좌표
const BUSAN_CENTER = [35.1795543, 129.0756416];
// 부산 경계 (Max Bounds)
const BUSAN_BOUNDS = [
    [34.8, 128.7], // SouthWest
    [35.4, 129.4]  // NorthEast
];

// 지도 컨트롤러 (크기 변경 감지 및 리렌더링)
function MapController() {
    const map = useMap();

    useEffect(() => {
        // 초기 로드 시 리사이즈
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        // ResizeObserver로 컨테이너 크기 변경 감지
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });

        resizeObserver.observe(map.getContainer());

        return () => {
            clearTimeout(timer);
            resizeObserver.disconnect();
        };
    }, [map]);

    return null;
}

// 전체화면 버튼 (오른쪽으로 이동)
function FullscreenControl() {
    const map = useMap();
    const handleFullscreen = () => {
        const mapContainer = map.getContainer();
        if (!document.fullscreenElement) {
            mapContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div className="leaflet-top leaflet-right custom-control-wrapper">
            <div className="leaflet-control leaflet-bar">
                <a role="button" title="전체화면" href="#" onClick={(e) => { e.preventDefault(); handleFullscreen(); }} className="custom-control-btn">
                    ⛶
                </a>
            </div>
        </div>
    );
}

// 줌 초기화 버튼
function ResetViewControl() {
    const map = useMap();
    const handleReset = () => {
        map.setView(BUSAN_CENTER, 11);
    };

    return (
        <div className="leaflet-top leaflet-right custom-control-wrapper" style={{ marginTop: '48px' }}>
            <div className="leaflet-control leaflet-bar">
                <a role="button" title="시점 초기화" href="#" onClick={(e) => { e.preventDefault(); handleReset(); }} className="custom-control-btn">
                    ⟲
                </a>
            </div>
        </div>
    );
}


// Mock Data Points (Detailed Rich Data)
// Adding images, proposers, dates for richer popups



// Region Focus Component
const RegionFocus = ({ selectedCodes, data }) => {
    const map = useMap();

    useEffect(() => {
        if (!data || !selectedCodes) return;

        if (selectedCodes.length === 0) {
            map.flyTo(BUSAN_CENTER, 11);
            return;
        }

        const features = data.features.filter(f => selectedCodes.includes(f.properties.code));

        if (features.length > 0) {
            // Create a temporary FeatureGroup to get bounds of all selected features
            const group = L.featureGroup(features.map(f => L.geoJSON(f)));
            try {
                map.flyToBounds(group.getBounds(), { padding: [50, 50] });
            } catch (e) {
                // Fallback to center if bounds calc fails
                console.warn("Bounds calc failed, resetting view");
                map.setView(BUSAN_CENTER, 11);
            }
        }
    }, [selectedCodes, data, map]);

    return null;
};

// Mask for Outside Busan
const OutsideMask = ({ data }) => {
    const map = useMap();

    useEffect(() => {
        if (!data) return;

        // World Bounds
        const world = [[-90, -180], [-90, 180], [90, 180], [90, -180]];

        // Extract coordinates from all districts to create holes
        const holes = [];
        data.features.forEach(feature => {
            const geometry = feature.geometry;
            if (geometry.type === 'Polygon') {
                const coords = geometry.coordinates[0].map(c => [c[1], c[0]]);
                holes.push(coords);
            } else if (geometry.type === 'MultiPolygon') {
                geometry.coordinates.forEach(poly => {
                    const coords = poly[0].map(c => [c[1], c[0]]);
                    holes.push(coords);
                });
            }
        });

        // Create Mask Polygon (World - Holes)
        const mask = L.polygon([world, ...holes], {
            color: 'transparent',
            fillColor: '#0f172a', // Slate-900
            fillOpacity: 0.6,
            interactive: false
        }).addTo(map);

        return () => {
            map.removeLayer(mask);
        }
    }, [data, map]);

    return null;
};

// Safe Pane Creation (Fix for ReferenceError)
const CustomPane = ({ name, zIndex, children }) => {
    const map = useMap();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!map.getPane(name)) {
            const pane = map.createPane(name);
            pane.style.zIndex = zIndex;
            pane.style.pointerEvents = 'none'; // Critical: Allow clicks to pass through empty pane areas
        }
        setIsReady(true);
    }, [map, name, zIndex]);

    if (!isReady) return null;

    return <>{children}</>;
};

// MapCanvas Component
const MapCanvas = memo(({ selectedCategories = [], userType = 'all', selectedDistricts = [], onSelectDistricts, insights = [], analysisData = [], onViewDetail }) => {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [hoveredDistrict, setHoveredDistrict] = useState(null);
    const [viewState, setViewState] = useState({ center: BUSAN_CENTER, zoom: 11 }); // eslint-disable-line no-unused-vars
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Correct path to Public Assets
        fetch('/assets/busan_districts_high.json')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                setGeoJsonData(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load GeoJSON:", err);
                setIsLoading(false);
            });
    }, []);

    // Helper: Determine severity color (Lighter Palette)
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return '#f87171'; // red-400 (was red-500)
            case 'medium': return '#fb923c'; // orange-400 (was orange-500)
            case 'low': return '#4ade80'; // green-400 (was green-500)
            default: return '#60a5fa'; // blue-400
        }
    };

    // Helper: Get Severity for District (Mock or Real)
    const getSeverity = useCallback((code) => {
        // Find if we have analysis data for this district
        const analysis = analysisData.find(a => a.name === code || a.district_code === code);
        if (analysis) {
            // Simple logic: Low safety score (<75) = High Severity
            if (analysis.safety < 75) return 'high';
            if (analysis.safety < 85) return 'medium';
            return 'low';
        }
        return 'low';
    }, [analysisData]);

    // Style for GeoJSON
    const districtStyle = useCallback((feature) => {
        const code = feature.properties.code;
        const severity = getSeverity(code);

        const isSelected = selectedDistricts.includes(code);
        const isDimmed = selectedDistricts.length > 0 && !isSelected;

        return {
            fillColor: getSeverityColor(severity),
            weight: isSelected ? 2 : 1, // Thinner border
            opacity: 1,
            color: isSelected ? '#334155' : 'white', // Border color
            fillOpacity: isDimmed ? 0.1 : 0.35 // Much lighter opacity (was 0.2 / 0.6)
        };
    }, [selectedDistricts, getSeverity]);

    // Filter Data Points
    const filteredData = useMemo(() => {
        if (!insights) return [];
        return insights.filter(item => {
            // Apply Category Filter
            if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) {
                return false;
            }
            // Apply District Filter (Only show points in selected districts if filtered)
            if (selectedDistricts.length > 0 && !selectedDistricts.includes(item.district_code)) {
                return false;
            }
            return true;
        }).map(item => ({
            id: item.id,
            lat: item.latitude,
            lng: item.longitude,
            severity: item.severity, // high, medium, low
            category: item.category,
            label: item.title,
            date: item.date,
            proposer: item.proposer,
            proposerRole: '시민', // Mock
            type: 'citizen',
            image: item.image_url || 'https://placehold.co/300x200?text=No+Image'
        }));
    }, [insights, selectedCategories, selectedDistricts]);

    // Interactions for GeoJSON
    const onEachDistrict = (feature, layer) => {
        layer.on({
            mouseover: () => setHoveredDistrict(feature.properties.code),
            mouseout: () => setHoveredDistrict(null),
            click: (e) => {
                L.DomEvent.stopPropagation(e); // Prevent map click
                if (onSelectDistricts) {
                    const code = feature.properties.code;
                    // Toggle selection logic:
                    // If clicked district is already selected, unselect it.
                    // Otherwise, select ONLY this district (Focus mode).
                    if (selectedDistricts.includes(code)) {
                        onSelectDistricts(selectedDistricts.filter(c => c !== code));
                    } else {
                        // Exclusive select for cleaner UX on map interactions
                        onSelectDistricts([code]);
                    }
                }
            }
        });
        layer.bindTooltip(
            `<div><strong>${feature.properties.name}</strong><br/>위험도: ${getSeverity(feature.properties.code)}</div>`,
            { sticky: true, direction: "center", className: "custom-tooltip" }
        );
    };

    // --------------------------------------------------------------------------------
    // Region Focus & Mask & CustomPane (Moved outside)
    // --------------------------------------------------------------------------------

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

            <MapContainer
                center={BUSAN_CENTER}
                zoom={11}
                maxZoom={22}
                scrollWheelZoom={true}
                className="mapbox"
                zoomControl={false}
                preferCanvas={true}
                minZoom={10}
                maxBounds={BUSAN_BOUNDS}
                maxBoundsViscosity={1.0}
            >
                <MapController />
                <RegionFocus selectedCodes={selectedDistricts} data={geoJsonData} />
                <OutsideMask data={geoJsonData} />

                <TileLayer
                    attribution='&copy; VWorld'
                    url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png"
                    maxZoom={22}
                    maxNativeZoom={18}
                />

                {/* Choropleth Layer */}
                {!isLoading && geoJsonData &&
                    <GeoJSON
                        key={`${selectedDistricts.join(',')}-${analysisData.length}`}
                        data={geoJsonData}
                        style={districtStyle}
                        onEachFeature={onEachDistrict}
                        interactive={true}
                    />
                }

                {/* Custom High Z-Index Pane for Popups to avoid overlapping */}
                <CustomPane name="custom-popup-pane" zIndex={1000} />

                {/* Data Points - Using Pane to bring them to front (z-index 500 > overlay 400) */}
                <CustomPane name="top-markers" zIndex={500}>
                    <MarkerClusterGroup
                        chunkedLoading
                        showCoverageOnHover={false}
                        maxClusterRadius={40}
                        spiderfyOnMaxZoom={false}
                        zoomToBoundsOnClick={true}
                        disableClusteringAtZoom={16}
                        // Pass pane to the cluster group so its icons rendering in this pane
                        clusterPane="top-markers"
                        iconCreateFunction={(cluster) => {
                            const count = cluster.getChildCount();
                            const sizeClass = count > 99 ? 'cluster-lg' : 'cluster-sm';

                            return L.divIcon({
                                html: `<div class="cluster-marker-inner ${sizeClass}">
                                          ${count > 99 ? '99+' : count}
                                       </div>`,
                                className: 'custom-cluster-marker',
                                iconSize: L.point(40, 40, true),
                            });
                        }}
                    >
                        {filteredData.map((data) => (
                            <CircleMarker
                                key={data.id}
                                center={[data.lat, data.lng]}
                                radius={data.severity === 'high' ? 12 : 8}
                                pane="top-markers"
                                pathOptions={{
                                    color: 'white',
                                    weight: 2,
                                    fillOpacity: 0.9,
                                    fillColor: data.severity === 'high' ? '#dc2626' : (data.severity === 'medium' ? '#f59e0b' : '#3b82f6')
                                }}
                            >
                                <Popup className="custom-popup" offset={[0, -10]} closeButton={false} pane="custom-popup-pane">
                                    <div className="popup-card">
                                        {/* Image Section */}
                                        <div className="popup-image-area">
                                            <img src={data.image} alt="현장 사진" className="popup-img" loading="lazy" />
                                            <div className="popup-badge">
                                                <span className={`badge-text ${data.severity === 'high' ? 'severity-high' : (data.severity === 'medium' ? 'severity-medium' : 'severity-low')}`}>
                                                    {data.severity === 'high' ? '위험' : (data.severity === 'medium' ? '주의' : '양호')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="popup-content">
                                            <h4 className="popup-title">{data.label}</h4>
                                            <p className="popup-category">{data.category.toUpperCase()} 이슈</p>

                                            <div className="popup-meta-row">
                                                <div className="popup-proposer">
                                                    <div className="proposer-avatar">
                                                        {data.type === 'expert' ? '🤖' : '🧑'}
                                                    </div>
                                                    <div className="proposer-info">
                                                        <span className="proposer-name">{data.proposer}</span>
                                                        <span className="proposer-role">{data.proposerRole}</span>
                                                    </div>
                                                </div>
                                                <div className="popup-date">
                                                    <span className="date-label">등록일</span>
                                                    <span className="date-value">{data.date}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewDetail && onViewDetail(data);
                                                }}
                                                className="popup-btn"
                                            >
                                                자세히 보기
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MarkerClusterGroup>
                </CustomPane>
                <FullscreenControl />
                <ResetViewControl />
            </MapContainer>

            {/* Legend Overlay */}
            <div className="map-legend">
                <div className="legend-list">
                    <div className="legend-header">
                        <span>지역 위험도 (히트맵)</span>
                    </div>
                    {selectedDistricts && selectedDistricts.length > 0 && (
                        <div className="legend-item" style={{ color: '#f43f5e' }}>
                            <span>* 선정 지역 상세 분석 중</span>
                        </div>
                    )}
                    <div className="legend-item">
                        <div className="legend-color bg-red-500"></div><span>위험 (다수 신고)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color bg-orange-500"></div><span>주의</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color bg-green-500"></div><span>양호</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default MapCanvas;
