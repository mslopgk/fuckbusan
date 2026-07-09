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

// 생활정보 카테고리 칩 (val = persona.categories 라벨과 일치, backend CATEGORY_MAP 값)
const CATS = [
    { label: '전체', val: null },
    { label: '주거', val: '주거' },
    { label: '환경', val: '환경' },
    { label: '교통', val: '교통' },
    { label: '안전', val: '안전' },
    { label: '교육', val: '교육' },
    { label: '산업·일자리', val: '산업일자리' },
    { label: '문화·여가', val: '문화여가' },
    { label: '보건·복지', val: '보건복지' },
];

// 지역 지표 카드 (Figma 269:26854 상단 산업·일자리 섹션). 값은 공공데이터 백엔드 연동 전까지 준비중 표시.
const STAT_CARDS = [
    { label: '청년층 순 이동율', icon: '/assets/aicitizen/stat_move.png' },
    { label: '고용율', icon: '/assets/aicitizen/stat_employ.png' },
    { label: '실업율', icon: '/assets/aicitizen/stat_jobless.png' },
];

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
    const [cat, setCat] = useState(null);
    const [expanded, setExpanded] = useState(false); // [1-5] 더보기

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

    const byCat = cat ? citizens.filter(c => (c.categories || []).includes(cat)) : citizens;
    const filtered = search
        ? byCat.filter(c => c.name?.includes(search) || c.district?.includes(search) || (c.tags || []).some(t => t.includes(search)))
        : byCat;

    // [2-5] 안내문구: 가장 문제로 꼽힌 영역 = 카테고리 최빈값
    const REP_VISIBLE = 6;
    const LIFE_AREAS = ['안전', '교통', '주거', '산업·일자리', '교육', '환경', '문화·여가', '보건·복지'];
    const topArea = (() => {
        const tally = {};
        filtered.forEach(c => (c.categories || []).forEach(k => { tally[k] = (tally[k] || 0) + 1; }));
        const s = Object.entries(tally).sort((a, b) => b[1] - a[1]);
        return s.length ? s[0][0] : null;
    })();
    const visible = expanded ? filtered : filtered.slice(0, REP_VISIBLE);
    const hiddenCount = filtered.length - visible.length;
    useEffect(() => { setExpanded(false); }, [selectedDistrict, cat, search]);

    const titleDistrict = selectedDistrict || null;
    const catLabel = CATS.find(c => c.val === cat)?.label || '전체';

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

            {/* 뒤로가기 — Figma 269:27184 */}
            <button className="m-ai-back" type="button" onClick={() => onNavigate?.('home')} aria-label="뒤로">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            {/* Map section */}
            <div className="m-ai-map-section">
                <MiniMap
                    geoData={geoData}
                    selectedDistrict={selectedDistrict}
                    onDistrictClick={handleDistrictClick}
                />
            </div>

            {/* Bottom sheet */}
            <div className="m-ai-sheet">
                <div className="m-ai-sheet__grip" />

                {/* 지역 타이틀 + 부산전체 초기화 */}
                <div className="m-ai-region-row">
                    <button className="m-ai-region-title" type="button" onClick={handleClearSearch}>
                        <span>{titleDistrict || '부산전체'}</span>
                        <span className="m-ai-region-chevron" aria-hidden="true">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </span>
                    </button>
                    <button className="m-ai-region-reset" type="button" onClick={handleClearSearch} aria-label="부산전체 보기">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="1.6"><circle cx="12" cy="12" r="6.5"/><line x1="12" y1="1.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22.5" y2="12"/></svg>
                    </button>
                </div>

                {/* 생활정보 카테고리 칩 */}
                <div className="m-ai-chips">
                    {CATS.map(c => (
                        <button
                            key={c.label}
                            type="button"
                            className={`m-ai-chip${cat === c.val ? ' active' : ''}`}
                            onClick={() => setCat(c.val)}
                        >{c.label}</button>
                    ))}
                </div>

                <div className="m-ai-scroll">
                    {/* 지역 지표 (Figma 상단 산업·일자리 섹션 — 공공데이터 연동 전 준비중) */}
                    <div className="m-ai-section-head">
                        <span className="m-ai-section-title">{catLabel}</span>
                    </div>
                    <div className="m-ai-stat-grid">
                        {STAT_CARDS.map(s => (
                            <div className="m-ai-stat-card" key={s.label}>
                                <span className="m-ai-stat-label">{s.label}</span>
                                <img className="m-ai-stat-icon" src={s.icon} alt="" />
                                <span className="m-ai-stat-value">데이터 준비중</span>
                            </div>
                        ))}
                    </div>

                    {/* 가상시민 목록 */}
                    <div className="m-ai-section-head m-ai-section-head--persona">
                        <span className="m-ai-section-title">
                            <span className="m-ai-title-teal">{titleDistrict || '부산대표'}</span> AI 가상시민
                        </span>
                        <button className="m-ai-sort-btn" type="button" onClick={() => setSort(s => s === 'importance' ? 'age' : 'importance')}>
                            {sort === 'importance' ? '중요도순' : '나이순'}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                    </div>

                    {!loading && filtered.length > 0 && (
                        <p className="m-ai-guide">
                            {titleDistrict || '부산'}에서 {LIFE_AREAS.length}개 생활영역 중
                            {topArea ? <> 가장 문제로 꼽힌 <b>‘{topArea}’</b> 등을</> : ' 주요 이슈를'} 대표하는
                            가상시민 <b>{filtered.length}명</b>이에요.
                        </p>
                    )}
                    <div className="m-ai-list">
                    {loading && <div className="m-ai-loading">불러오는 중...</div>}
                    {!loading && filtered.length === 0 && (
                        <div className="m-ai-empty">해당 조건의 가상시민이 없습니다.</div>
                    )}
                    {!loading && visible.map(c => (
                        <div
                            key={c.id}
                            className="m-ai-card"
                            onClick={() => onNavigate?.('mAICitizenDetail', c)}
                        >
                            <div className="m-ai-card__body">
                                <div className="m-ai-card__top-row">
                                    {(c.importance ?? 100) === 0 && <span className="m-ai-card__rep">대표</span>}
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
                    {!loading && hiddenCount > 0 && (
                        <button type="button" className="m-ai-more-btn" onClick={() => setExpanded(true)}>
                            가상시민 {hiddenCount}명 더보기
                        </button>
                    )}
                    </div>
                </div>
            </div>

            <MobileBottomNav currentView="mAICitizen" onNavigate={onNavigate} />
        </div>
    );
}
