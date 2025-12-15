import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Pane, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import L from 'leaflet';
import '../../styles/admin.css';

// 부산 중심 좌표
const BUSAN_CENTER = [35.1795543, 129.0756416];

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



// MapCanvas Component
const MapCanvas = memo(({ selectedCategories = [], userType = 'all', selectedDistricts = [], insights = [], analysisData = [], onViewDetail }) => {
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

    // 구별 위험도(핑 개수) 모의 데이터
    // Dynamic Severity Layout from Real Analysis Data
    const districtScores = useMemo(() => {
        if (!analysisData || analysisData.length === 0) return {};
        const scores = {};
        analysisData.forEach(d => {
            // Calculate an aggregate score or use Safety score as primary metric for heatmap
            // Using Safety Score as the primary indicator for "Risk" map
            scores[d.name] = d.safety;
        });
        return scores;
    }, [analysisData]);

    const getSeverityColor = (code) => {
        const score = districtScores[code];
        if (score === undefined) return '#94a3b8'; // Unknown (Slate-400)

        // Lower score = Higher Risk (Red)
        if (score < 70) return '#ef4444'; // Red (High Risk)
        if (score < 80) return '#f59e0b'; // Orange (Medium Risk)
        return '#22c5e0'; // Cyan/Blue (Low Risk / Safe)
    };

    const getSeverity = (districtCode) => {
        const score = districtScores[districtCode];
        if (score === undefined) return '정보 없음';

        if (score < 70) return '높음';
        if (score < 80) return '보통';
        return '낮음';
    };

    // Helper to map Korean category to English ID
    const mapCategory = (title) => {
        if (!title) return 'other';
        if (title.includes('보도') || title.includes('교통')) return 'transport';
        if (title.includes('위생') || title.includes('환경')) return 'environment';
        if (title.includes('안전') || title.includes('파손')) return 'safety';
        if (title.includes('문화') || title.includes('관광')) return 'culture';
        if (title.includes('주거') || title.includes('건축')) return 'housing';
        return 'other';
    };

    // Filter Logic using Real Data
    const filteredData = useMemo(() => {
        if (!insights) return [];

        const categoriesToShow = selectedCategories.length === 0
            ? ['housing', 'environment', 'transport', 'safety', 'culture', 'other']
            : selectedCategories;

        return insights.map(insight => {
            const cat = mapCategory(insight.title);
            // Map 'survey' -> 'citizen', 'diagnosis' -> 'expert'
            const type = insight.category === 'survey' ? 'citizen' : (insight.category === 'diagnosis' ? 'expert' : 'citizen');

            return {
                id: insight.id,
                lat: insight.latitude,
                lng: insight.longitude,
                label: insight.title,
                type: type,
                category: cat,
                severity: insight.severity ? insight.severity.toLowerCase() : 'medium',
                proposer: insight.proposer,
                proposerRole: type === 'expert' ? '진단 전문가' : '일반 시민',
                date: insight.date ? insight.date.split(' ')[0] : '2025-12-14',
                image: insight.image_url || "https://placehold.co/300x200?text=No+Image"
            };
        }).filter(point => {
            // Filter by Category
            if (!categoriesToShow.includes(point.category)) return false;
            // Filter by User Type (Sidebar)
            if (userType !== 'all' && point.type !== userType) return false;
            // Filter by District (if selected) is handled by Map Bounds usually, but we can filter here too
            if (selectedDistricts.length > 0) {
                // We'd need district code in the mapped object. 
                // Since insight has district_code, we can use it.
                // But the current mapping structure doesn't include it. 
                // However, the bounds logic mainly handles visibility.
                // Let's rely on the map bounds/RegionFocus for visual focus, but showing all markers is often preferred unless filtered.
            }
            return true;
        });
    }, [selectedCategories, userType, insights, selectedDistricts]);

    // Style for GeoJSON
    const districtStyle = useCallback((feature) => {
        const severity = getSeverity(feature.properties.code);
        const color = getSeverityColor(feature.properties.code);

        // Check if any districts are selected
        const hasSelection = selectedDistricts && selectedDistricts.length > 0;
        const isSelected = hasSelection && selectedDistricts.includes(feature.properties.code);
        const isHovered = hoveredDistrict === feature.properties.code;

        let fillOpacity = isHovered ? 0.6 : 0.4;
        let strokeColor = isHovered ? '#3b82f6' : '#64748b'; // Hover: Blue, Default: Slate-500
        let weight = isHovered ? 3 : 1.5;

        // If specific districts selected
        if (hasSelection) {
            if (isSelected) {
                fillOpacity = 0.2; // Highlight selected
                strokeColor = '#2563eb'; // Blue-600
                weight = 3.5;
            } else {
                fillOpacity = 0.1; // Dim unselected
                strokeColor = '#cbd5e1'; // Slate-300
                weight = 1;
            }
        }

        return {
            fillColor: color,
            weight: weight,
            opacity: 1,
            color: strokeColor,
            dashArray: isSelected ? '' : (hasSelection ? '3' : ''),
            fillOpacity: fillOpacity
        };
    }, [hoveredDistrict, selectedDistricts]);

    // Interactions for GeoJSON
    const onEachDistrict = (feature, layer) => {
        layer.on({
            mouseover: () => setHoveredDistrict(feature.properties.code),
            mouseout: () => setHoveredDistrict(null),
        });
        layer.bindTooltip(
            `<div><strong>${feature.properties.name}</strong><br/>위험도: ${getSeverity(feature.properties.code)}</div>`,
            { sticky: true, direction: "center", className: "custom-tooltip" }
        );
    };

    // --------------------------------------------------------------------------------
    // Region Focus Component
    // --------------------------------------------------------------------------------
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
                maxZoom={40}
                scrollWheelZoom={true}
                className="mapbox"
                zoomControl={false}
                preferCanvas={true}
            >
                <MapController />
                <RegionFocus selectedCodes={selectedDistricts} data={geoJsonData} />

                <TileLayer
                    attribution='&copy; VWorld'
                    url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png"
                    maxZoom={40}
                    maxNativeZoom={19}
                    keepBuffer={4}
                    updateWhenIdle={false}
                    updateWhenZooming={false}
                />

                {/* Choropleth Layer */}
                {!isLoading && geoJsonData &&
                    <GeoJSON
                        data={geoJsonData}
                        style={districtStyle}
                        onEachFeature={onEachDistrict}
                    />
                }

                {/* Custom High Z-Index Pane for Popups to avoid overlapping */}
                <Pane name="custom-popup-pane" style={{ zIndex: 1000 }} />

                {/* Data Points - Using Pane to bring them to front (z-index 500 > overlay 400) */}
                <Pane name="top-markers" style={{ zIndex: 500 }}>
                    <MarkerClusterGroup
                        chunkedLoading
                        showCoverageOnHover={false}
                        maxClusterRadius={40}
                        spiderfyOnMaxZoom={false}
                        zoomToBoundsOnClick={true}
                        disableClusteringAtZoom={15}
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
                </Pane>

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
