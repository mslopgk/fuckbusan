import { useState, useEffect } from 'react';
import { MapContainer, GeoJSON, Marker, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MobileBottomNav from './MobileBottomNav';
import './MAICitizen.css';
import { API_URL } from '../utils/api';

const LABEL_OFFSETS = {
    '강서구': [0.14, 0.15], '사하구': [0.11, -0.011], '서구': [0.07, 0],
    '영도구': [0, -0.04], '남구': [0.04, -0.02], '연제구': [0.005, 0],
    '해운대구': [-0.015, -0.005],
};

function BoundsFitter({ data }) {
    const map = useMap();
    useEffect(() => {
        if (data) {
            const layer = L.geoJSON(data);
            map.fitBounds(layer.getBounds(), { padding: [6, 6] });
        }
    }, [data, map]);
    return null;
}

function MiniMap({ geoData, selectedDistrict, onDistrictClick }) {
    // Figma 최신: 흰 구획 + 선택 구는 큰 teal 원형 하이라이트
    const districtStyle = (feature) => ({
        fillColor: '#ffffff',
        weight: 0.6, opacity: 0.7, color: '#bbb', fillOpacity: 1,
    });

    const onEachFeature = (feature, layer) => {
        layer.on({ click: () => onDistrictClick(feature.properties.name) });
    };

    const getLabelPos = (feature) => {
        const coords = feature.geometry.type === 'Polygon'
            ? feature.geometry.coordinates[0]
            : feature.geometry.coordinates[0][0];
        const latlngs = coords.map(p => [p[1], p[0]]);
        const center = L.latLngBounds(latlngs).getCenter();
        const offset = LABEL_OFFSETS[feature.properties.name] || [0, 0];
        return [center.lat + offset[0], center.lng + offset[1]];
    };

    if (!geoData) return null;

    const selectedFeature = selectedDistrict
        ? geoData.features.find(f => f.properties.name === selectedDistrict)
        : null;
    const selectedPos = selectedFeature ? getLabelPos(selectedFeature) : null;

    return (
        <MapContainer
            center={[35.1795, 129.0756]} zoom={10}
            scrollWheelZoom={false} zoomControl={false} doubleClickZoom={false}
            touchZoom={false} boxZoom={false} dragging={false} attributionControl={false}
            style={{ height: '100%', width: '100%', background: 'transparent' }}
        >
            <BoundsFitter data={geoData} />
            <GeoJSON
                key={selectedDistrict}
                data={geoData}
                style={districtStyle}
                onEachFeature={onEachFeature}
            />
            {selectedPos && (
                <CircleMarker
                    center={selectedPos}
                    radius={34}
                    pathOptions={{
                        color: '#23bdbb',
                        weight: 2,
                        fillColor: '#23bdbb',
                        fillOpacity: 0.85,
                    }}
                    eventHandlers={{ click: () => onDistrictClick(selectedDistrict) }}
                />
            )}
            {geoData.features.map(f => {
                const name = f.properties.name;
                const pos = getLabelPos(f);
                return (
                    <Marker
                        key={name}
                        position={pos}
                        icon={L.divIcon({ className: 'm-ai-invis-marker' })}
                        eventHandlers={{ click: () => onDistrictClick(name) }}
                    >
                        <Tooltip permanent direction="center" className={`m-ai-district-label${name === selectedDistrict ? ' selected' : ''}`}>
                            {name}
                        </Tooltip>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

export default function MAICitizen({ onNavigate }) {
    const [citizens, setCitizens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [geoData, setGeoData] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [sort, setSort] = useState('importance');
    const [quoteCitizen, setQuoteCitizen] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/assets/busan_districts_high.json')
            .then(r => r.json())
            .then(setGeoData)
            .catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedDistrict) params.set('district', selectedDistrict);
        params.set('sort', sort);
        fetch(`${API_URL}/api/ai-citizens?${params}`)
            .then(r => r.json())
            .then(data => {
                setCitizens(data);
                setQuoteCitizen(data[0] || null);
            })
            .catch(() => setCitizens([]))
            .finally(() => setLoading(false));
    }, [selectedDistrict, sort]);

    const handleDistrictClick = (name) => {
        setSelectedDistrict(prev => {
            const next = prev === name ? null : name;
            setSearch(next || '');
            return next;
        });
    };

    const handleClearSearch = () => {
        setSearch('');
        setSelectedDistrict(null);
    };

    const filtered = search
        ? citizens.filter(c => c.name?.includes(search) || c.district?.includes(search) || (c.tags || []).some(t => t.includes(search)))
        : citizens;

    const titleDistrict = selectedDistrict || null;

    return (
        <div className="m-ai-citizen">
            <style>{`
                .leaflet-container { background: transparent !important; touch-action: pan-y !important; }
                .m-ai-invis-marker { opacity: 0; }
                .m-ai-district-label {
                    background: transparent !important; border: none !important;
                    box-shadow: none !important; color: #555 !important;
                    font-size: 8px !important; font-weight: 500 !important;
                    white-space: nowrap !important;
                }
                .m-ai-district-label.selected { color: #fff !important; font-weight: 700 !important; }
            `}</style>

            {/* 검색바 — Figma 22:7438: 헤더 행 없이 검색바만 */}
            <div className="m-ai-search-wrap">
                <input
                    className="m-ai-search"
                    type="text"
                    placeholder="지역 검색"
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        if (!e.target.value) setSelectedDistrict(null);
                    }}
                />
                {search && (
                    <button
                        className="m-ai-search-clear"
                        type="button"
                        onClick={handleClearSearch}
                        aria-label="검색 초기화"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                )}
            </div>

            {/* Map section */}
            <div className="m-ai-map-section">
                {quoteCitizen && (
                    <div className="m-ai-quote-bubble">
                        <p>{quoteCitizen.quote.slice(0, 55)}{quoteCitizen.quote.length > 55 ? '…' : ''}</p>
                        <div className="m-ai-quote-bubble__tail" />
                    </div>
                )}
                <MiniMap
                    geoData={geoData}
                    selectedDistrict={selectedDistrict}
                    onDistrictClick={handleDistrictClick}
                />
            </div>

            {/* Bottom sheet */}
            <div className="m-ai-sheet">
                <div className="m-ai-sheet__grip" />

                <div className="m-ai-sheet__header">
                    <div className="m-ai-sheet__title">
                        {titleDistrict ? (
                            <>
                                <span className="m-ai-title-teal">{titleDistrict}</span>
                                <span className="m-ai-title-black"> AI 가상시민</span>
                            </>
                        ) : (
                            <>
                                <span className="m-ai-title-teal">부산대표</span>
                                <span className="m-ai-title-black"> AI 가상시민</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="m-ai-sheet__meta">
                    <span className="m-ai-count">총 {filtered.length}명</span>
                    <button className="m-ai-sort-btn" type="button" onClick={() => setSort(s => s === 'importance' ? 'age' : 'importance')}>
                        {sort === 'importance' ? '중요도순' : '나이순'}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                </div>

                <div className="m-ai-list">
                    {loading && <div className="m-ai-loading">불러오는 중...</div>}
                    {!loading && filtered.length === 0 && (
                        <div className="m-ai-empty">해당 조건의 가상시민이 없습니다.</div>
                    )}
                    {!loading && filtered.map(c => (
                        <div
                            key={c.id}
                            className="m-ai-card"
                            onClick={() => onNavigate?.('mAICitizenDetail', c)}
                        >
                            <div className="m-ai-card__body">
                                <div className="m-ai-card__top-row">
                                    <span className="m-ai-card__name">{c.name}</span>
                                    <span className="m-ai-card__age">{c.age}세</span>
                                    <button
                                        className="m-ai-card__arrow"
                                        type="button"
                                        onClick={e => { e.stopPropagation(); onNavigate?.('mAICitizenDetail', c); }}
                                        aria-label="자세히 보기"
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#23bdbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="m-ai-card__tags">
                                    {c.tags.slice(0, 3).map(t => (
                                        <span key={t} className="m-ai-card__tag">{t}</span>
                                    ))}
                                </div>
                                <div className="m-ai-card__divider" />
                                <p className="m-ai-card__quote">{c.quote}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <MobileBottomNav currentView="mAICitizen" onNavigate={onNavigate} />
        </div>
    );
}
