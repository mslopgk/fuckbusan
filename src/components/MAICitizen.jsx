import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, GeoJSON, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MobileBottomNav from './MobileBottomNav';
import './MAICitizen.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

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
    const districtStyle = (feature) => ({
        fillColor: feature.properties.name === selectedDistrict ? '#23bdbb' : '#f0fafa',
        weight: 0.6, opacity: 0.7, color: '#888', fillOpacity: 1,
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
    const [avatarUrls, setAvatarUrls] = useState({});
    const pendingAvatars = useRef(new Set());

    const fetchAvatar = useCallback(async (citizenId) => {
        if (pendingAvatars.current.has(citizenId)) return;
        pendingAvatars.current.add(citizenId);
        setAvatarUrls(prev => ({ ...prev, [citizenId]: 'loading' }));
        try {
            const res = await fetch(`${API_URL}/api/ai-citizens/${citizenId}/avatar`);
            const data = await res.json();
            setAvatarUrls(prev => ({ ...prev, [citizenId]: data.url || null }));
        } catch {
            setAvatarUrls(prev => ({ ...prev, [citizenId]: null }));
        }
    }, []);

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
                data.forEach(c => fetchAvatar(c.id));
            })
            .catch(() => setCitizens([]))
            .finally(() => setLoading(false));
    }, [selectedDistrict, sort, fetchAvatar]);

    const handleDistrictClick = (name) => {
        setSelectedDistrict(prev => prev === name ? null : name);
    };

    const filtered = search
        ? citizens.filter(c => c.name.includes(search) || c.district.includes(search) || c.tags.some(t => t.includes(search)))
        : citizens;

    return (
        <div className="m-ai-citizen">
            <style>{`
                .leaflet-container { background: transparent !important; }
                .m-ai-invis-marker { opacity: 0; }
                .m-ai-district-label {
                    background: transparent !important; border: none !important;
                    box-shadow: none !important; color: #555 !important;
                    font-size: 8px !important; font-weight: 500 !important;
                    white-space: nowrap !important;
                }
                .m-ai-district-label.selected { color: #fff !important; font-weight: 700 !important; }
            `}</style>

            {/* Search bar */}
            <div className="m-ai-search-wrap">
                <input
                    className="m-ai-search"
                    type="text"
                    placeholder="지역 검색"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Map section */}
            <div className="m-ai-map-section">
                {quoteCitizen && (
                    <div className="m-ai-quote-bubble">
                        <p>{quoteCitizen.quote.slice(0, 60)}{quoteCitizen.quote.length > 60 ? '…' : ''}</p>
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
                        <span className="m-ai-title-teal">부산대표</span>
                        <span className="m-ai-title-black"> AI 가상시민</span>
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
                            onClick={() => setQuoteCitizen(c)}
                        >
                            <div className="m-ai-card__avatar">
                                {avatarUrls[c.id] === 'loading' ? (
                                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e8f8f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#23bdbb" strokeWidth="2" strokeLinecap="round">
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                        </svg>
                                        <span style={{ fontSize: 8, color: '#23bdbb', marginTop: 2, lineHeight: 1.2, textAlign: 'center' }}>생성중</span>
                                    </div>
                                ) : avatarUrls[c.id] ? (
                                    <img src={`${API_URL}${avatarUrls[c.id]}`} alt="아바타" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                                ) : (
                                    <svg viewBox="0 0 100 100" width="72" height="72" style={{ display: 'block' }}>
                                        <circle cx="50" cy="50" r="50" fill="#f2dfc8"/>
                                        <circle cx="50" cy="36" r="17" fill="#d4aa82"/>
                                        <path d="M18 100 C18 70 50 65 50 65 C50 65 82 70 82 100 Z" fill="#d4aa82"/>
                                    </svg>
                                )}
                            </div>
                            <div className="m-ai-card__body">
                                <div className="m-ai-card__top-row">
                                    <span className="m-ai-card__name">{c.name}</span>
                                    <span className="m-ai-card__age">{c.age}세</span>
                                    <button
                                        className="m-ai-card__arrow"
                                        type="button"
                                        onClick={e => { e.stopPropagation(); setQuoteCitizen(c); }}
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
