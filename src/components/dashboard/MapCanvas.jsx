import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Pane, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import L from 'leaflet';

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
        <div className="leaflet-top leaflet-right mt-2 mr-2">
            <div className="leaflet-control leaflet-bar">
                <a role="button" title="전체화면" href="#" onClick={(e) => { e.preventDefault(); handleFullscreen(); }} className="flex items-center justify-center bg-white text-black w-8 h-8 font-bold text-lg hover:bg-gray-100 cursor-pointer">
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
        <div className="leaflet-top leaflet-right mt-12 mr-2">
            <div className="leaflet-control leaflet-bar">
                <a role="button" title="시점 초기화" href="#" onClick={(e) => { e.preventDefault(); handleReset(); }} className="flex items-center justify-center bg-white text-black w-8 h-8 font-bold text-lg hover:bg-gray-100 cursor-pointer">
                    ⟲
                </a>
            </div>
        </div>
    );
}


// Mock Data Points (Detailed Rich Data)
// Adding images, proposers, dates for richer popups



// MapCanvas Component
const MapCanvas = memo(({ selectedCategories = [], userType = 'all', selectedDistricts = [], onSelectDistricts, insights = [], analysisData = [], onViewDetail }) => {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [hoveredDistrict, setHoveredDistrict] = useState(null);
    const [viewState, setViewState] = useState({ center: BUSAN_CENTER, zoom: 11 }); // eslint-disable-line no-unused-vars
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetch('/busan_districts_high.json')
            .then(res => res.json())
            .then(data => {
                setGeoJsonData(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load GeoJSON:", err);
                setIsLoading(false);
            });
    }, []);

    // ... (rest of existing code) ...

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
                    // Or typically map click = select this.
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
        <div className="w-full h-full relative z-0 bg-slate-50 transition-colors duration-300">
            {isLoading && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <span className="text-sm font-bold text-slate-600">지도 데이터 로딩 중...</span>
                    </div>
                </div>
            )}

            <MapContainer
                center={BUSAN_CENTER}
                zoom={11}
                maxZoom={40}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", background: "transparent" }}
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
                            let size = 'w-9 h-9';
                            let fontSize = 'text-sm';

                            if (count > 99) {
                                size = 'w-11 h-11';
                                fontSize = 'text-base';
                            }

                            return L.divIcon({
                                html: `<div class="flex items-center justify-center ${size} bg-white rounded-full shadow-md border-2 border-slate-600 text-slate-800 font-bold ${fontSize} transition-transform hover:scale-110">
                                          ${count > 99 ? '99+' : count}
                                       </div>`,
                                className: 'custom-cluster-marker bg-transparent', // Remove default leaflet-div-icon bg
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
                                {/* Improved Rich Popup with explicit Pane */}
                                <Popup className="custom-popup" offset={[0, -10]} closeButton={false} pane="custom-popup-pane">
                                    <div className="min-w-[240px] max-w-[280px] overflow-hidden rounded-lg font-sans">
                                        {/* Image Section */}
                                        <div className="h-32 w-full relative bg-slate-100">
                                            <img src={data.image} alt="현장 사진" className="w-full h-full object-cover" loading="lazy" />
                                            <div className="absolute top-2 left-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm uppercase tracking-wide ${data.severity === 'high' ? 'bg-red-500' : (data.severity === 'medium' ? 'bg-orange-500' : 'bg-blue-500')
                                                    }`}>
                                                    {data.severity === 'high' ? '위험' : (data.severity === 'medium' ? '주의' : '양호')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="p-4 bg-white">
                                            <h4 className="font-bold text-slate-900 text-sm mb-1 leading-snug">{data.label}</h4>
                                            <p className="text-[11px] text-slate-500 mb-3">{data.category.toUpperCase()} 이슈</p>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-lg border border-slate-100 ring-2 ring-white shadow-sm">
                                                        {data.type === 'expert' ? '🤖' : '🧑'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-800">{data.proposer}</span>
                                                        <span className="text-[10px] text-slate-400">{data.proposerRole}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-400">등록일</span>
                                                    <span className="text-[10px] text-slate-600 font-medium">{data.date}</span>
                                                </div>
                                            </div>

                                            {/* View Details Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent map click
                                                    onViewDetail && onViewDetail(data);
                                                }}
                                                className="w-full mt-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-primary text-xs font-bold rounded border border-slate-200 transition-colors flex items-center justify-center gap-1"
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
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur border border-slate-300 p-3 rounded-lg z-[500] shadow-xl transition-colors duration-300">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 border-b border-slate-200 pb-1 mb-1">
                        <span>지역 위험도 (히트맵)</span>
                    </div>
                    {selectedDistricts && selectedDistricts.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-rose-500 font-medium mb-1">
                            <span>* 선정 지역 상세 분석 중</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-4 h-4 rounded bg-red-500 opacity-60"></div><span>위험 (다수 신고)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-4 h-4 rounded bg-orange-500 opacity-60"></div><span>주의</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-4 h-4 rounded bg-green-500 opacity-60"></div><span>양호</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default MapCanvas;
