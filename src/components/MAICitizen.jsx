import { useState, useEffect, useRef, useMemo } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MAICitizen.css';
import { API_URL } from '../utils/api';

/* Figma 302:14955 (모바일 AI 가상시민 섹션)
   - 메인1(인트로)  302:15079
   - 메인2(둘러보기) 302:15313
   - 지도클릭시(리스트) 302:14960
   - 전체리스트     302:15172
   에셋: public/figma-assets/mobile-aic (전부 Figma export) */
const A = '/figma-assets/mobile-aic';

const LABEL_OFFSETS = {
    '강서구': [0.14, 0.15], '사하구': [0.11, -0.011], '서구': [0.07, 0],
    '영도구': [0, -0.04], '남구': [0.04, -0.02], '연제구': [0.005, 0],
    '해운대구': [-0.015, -0.005],
};

/* Figma 지도 (421x321): 흰 구획 + #1f1f1f 윤곽, 선택 구 #23bdbb, 버블 페르소나 구 연한 teal 틴트.
   GeoJSON을 421x321 박스에 축별 독립 스케일로 투영(Figma 아트처럼 가로로 채움). */
const MAP_W = 421;
const MAP_H = 321;
function SvgMap({ geoData, selectedDistrict, tintDistricts, onDistrictClick }) {
    const projected = useMemo(() => {
        if (!geoData) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const eachRing = (geom, cb) => {
            const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
            polys.forEach(rings => rings.forEach(cb));
        };
        geoData.features.forEach(f => eachRing(f.geometry, ring => ring.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        })));
        const P = 4;
        const sx = (MAP_W - P * 2) / (maxX - minX);
        const sy = (MAP_H - P * 2) / (maxY - minY);
        const px = (x) => P + (x - minX) * sx;
        const py = (y) => MAP_H - P - (y - minY) * sy;
        const feats = geoData.features.map(f => {
            let d = '';
            eachRing(f.geometry, ring => {
                d += ring.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join('') + 'Z';
            });
            // 라벨: bounds 중심 + 오프셋 (기존 MiniMap과 동일 규칙)
            let bMinX = Infinity, bMinY = Infinity, bMaxX = -Infinity, bMaxY = -Infinity;
            const ring0 = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
            ring0.forEach(([x, y]) => {
                if (x < bMinX) bMinX = x;
                if (x > bMaxX) bMaxX = x;
                if (y < bMinY) bMinY = y;
                if (y > bMaxY) bMaxY = y;
            });
            const name = f.properties.name;
            const [latOff, lngOff] = LABEL_OFFSETS[name] || [0, 0];
            return {
                name, d,
                lx: px((bMinX + bMaxX) / 2 + lngOff),
                ly: py((bMinY + bMaxY) / 2 + latOff),
            };
        });
        return feats;
    }, [geoData]);

    if (!projected) return null;

    return (
        <svg className="maic-svgmap" width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
            {projected.map(f => {
                let fill = '#ffffff';
                if (f.name === selectedDistrict) fill = '#23bdbb';
                else if (tintDistricts?.includes(f.name)) fill = '#dff8f8';
                return (
                    <path
                        key={f.name} d={f.d} fill={fill} data-name={f.name}
                        stroke="#1f1f1f" strokeWidth="1" strokeLinejoin="round"
                        onClick={() => onDistrictClick(f.name)}
                    />
                );
            })}
            {projected.map(f => (
                <text
                    key={`t-${f.name}`} x={f.lx} y={f.ly}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="7.5" fontWeight={f.name === selectedDistrict ? 700 : 500}
                    fill={f.name === selectedDistrict ? '#ffffff' : '#111111'}
                    style={{ pointerEvents: 'none' }}
                >{f.name}</text>
            ))}
        </svg>
    );
}

/* 지도 위 말풍선 (Figma Union: rgba(35,189,187,0.30) r50 + 꼬리) */
function QuoteBubble({ text, className }) {
    if (!text) return null;
    return (
        <div className={`maic-bubble ${className || ''}`}>
            <p>{text}</p>
        </div>
    );
}

export default function MAICitizen({ onNavigate }) {
    const [citizens, setCitizens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [geoData, setGeoData] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [sort, setSort] = useState('importance');
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState('intro'); // intro | browse | list | full
    const [avatars, setAvatars] = useState({}); // id -> url
    const touchRef = useRef(null);

    useEffect(() => {
        fetch('/assets/busan_districts_high.json')
            .then(r => r.json())
            .then(setGeoData)
            .catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/api/ai-citizens?sort=importance`)
            .then(r => r.json())
            .then(data => setCitizens(Array.isArray(data) ? data : []))
            .catch(() => setCitizens([]))
            .finally(() => setLoading(false));
    }, []);

    // 아바타 URL 로드 (백엔드 캐시)
    useEffect(() => {
        citizens.forEach(c => {
            if (avatars[c.id] !== undefined) return;
            setAvatars(prev => ({ ...prev, [c.id]: null }));
            fetch(`${API_URL}/api/ai-citizens/${c.id}/avatar`)
                .then(r => r.json())
                .then(d => { if (d.url) setAvatars(prev => ({ ...prev, [c.id]: `${API_URL}${d.url}` })); })
                .catch(() => {});
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [citizens]);

    const handleDistrictClick = (name) => {
        if (selectedDistrict === name && (stage === 'list' || stage === 'full')) {
            setSelectedDistrict(null);
            setStage('browse');
            return;
        }
        setSelectedDistrict(name);
        setSearch('');
        setStage('list');
    };

    const handleClear = () => {
        setSelectedDistrict(null);
        setSearch('');
        setStage('browse');
    };

    const handleSearch = (v) => {
        setSearch(v);
        if (v.trim()) { setSelectedDistrict(null); setStage('list'); }
    };

    // 정렬 (클라이언트)
    const sorted = [...citizens].sort((a, b) => sort === 'age'
        ? a.age - b.age
        : (a.importance ?? 100) - (b.importance ?? 100) || a.id - b.id);
    const byDistrict = selectedDistrict ? sorted.filter(c => c.district === selectedDistrict) : sorted;
    const filtered = search.trim()
        ? byDistrict.filter(c => c.name?.includes(search) || c.district?.includes(search) || (c.tags || []).some(t => t.includes(search)))
        : byDistrict;

    // 둘러보기 말풍선: 중요도 상위 2명
    const bubble1 = sorted[0] || null;
    const bubble2 = sorted[1] || null;
    const tintDistricts = stage === 'browse'
        ? [...new Set([bubble1?.district, bubble2?.district].filter(Boolean))]
        : [];

    const title = selectedDistrict || '부산전체';
    const sheetOpen = stage === 'list' || stage === 'full';

    // 시트 스와이프 (위: 전체, 아래: 축소)
    const onTouchStart = (e) => { touchRef.current = e.touches[0].clientY; };
    const onTouchEnd = (e) => {
        if (touchRef.current == null) return;
        const dy = e.changedTouches[0].clientY - touchRef.current;
        touchRef.current = null;
        if (dy < -40 && stage === 'list') setStage('full');
        else if (dy > 40) {
            if (stage === 'full') setStage('list');
            else if (stage === 'list') handleClear();
        }
    };

    const cleanTag = (t) => `# ${String(t).replace(/^#\s*/, '')}`;

    const renderCard = (c) => (
        <div key={c.id} className="maic-card" onClick={() => onNavigate?.('mAICitizenDetail', c)}>
            <div className="maic-card__avatar">
                {avatars[c.id] ? <img src={avatars[c.id]} alt="" /> : <span className="maic-card__avatar-fb">{c.avatar_initial || c.name?.[0]}</span>}
            </div>
            <div className="maic-card__head">
                <span className="maic-card__name">{c.name}</span>
                <span className="maic-card__age">{c.age}세</span>
            </div>
            <button
                className="maic-card__arrow" type="button" aria-label="자세히 보기"
                onClick={e => { e.stopPropagation(); onNavigate?.('mAICitizenDetail', c); }}
            >
                <img src={`${A}/expand_circle.png`} alt="" />
            </button>
            <div className="maic-card__tags">
                {(c.tags || []).slice(0, 3).map(t => (
                    <span key={t} className="maic-card__tag">{cleanTag(t)}</span>
                ))}
            </div>
            <div className="maic-card__divider" />
            <p className="maic-card__quote">{c.quote}</p>
        </div>
    );

    return (
        <div className="m-ai-citizen">
            {/* 지도 배경 (Figma 지도 배경 group) */}
            <div className="maic-bg" aria-hidden="true">
                <img className="maic-bg__img24" src={`${A}/bg_image24.png`} alt="" />
                <img className="maic-bg__img23" src={`${A}/bg_image23.png`} alt="" />
            </div>

            {/* 지도 + 말풍선 오버레이 (메인2는 Figma 확대맵 626x478) */}
            <div className={`maic-map${stage === 'browse' ? ' maic-map--lg' : ''}`}>
                <SvgMap
                    geoData={geoData}
                    selectedDistrict={sheetOpen ? selectedDistrict : null}
                    tintDistricts={tintDistricts}
                    onDistrictClick={handleDistrictClick}
                />
                {stage === 'intro' && bubble1 && (
                    <>
                        <QuoteBubble text={bubble1.quote} className="maic-bubble--intro" />
                        <div className="maic-map-avatar maic-map-avatar--intro">
                            {avatars[bubble1.id] && <img src={avatars[bubble1.id]} alt="" />}
                        </div>
                    </>
                )}
                {stage === 'browse' && (
                    <>
                        {bubble1 && (
                            <>
                                <QuoteBubble text={bubble1.quote} className="maic-bubble--b1" />
                                <div className="maic-map-avatar maic-map-avatar--b1">
                                    {avatars[bubble1.id] && <img src={avatars[bubble1.id]} alt="" />}
                                </div>
                            </>
                        )}
                        {bubble2 && (
                            <>
                                <QuoteBubble text={bubble2.quote} className="maic-bubble--b2" />
                                <div className="maic-map-avatar maic-map-avatar--b2">
                                    {avatars[bubble2.id] && <img src={avatars[bubble2.id]} alt="" />}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* 상단 바 */}
            {(stage === 'intro' || stage === 'browse') && (
                <div className="maic-topbar">
                    <button className="maic-back" type="button" onClick={() => onNavigate?.('home')} aria-label="뒤로">
                        <img src={`${A}/back_arrow.png`} alt="" />
                    </button>
                    <div className="maic-search">
                        <input
                            type="text" placeholder="검색" value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                </div>
            )}
            {stage === 'list' && (
                <div className="maic-topbar maic-topbar--full">
                    <div className="maic-search maic-search--label">
                        <span>{search.trim() || title}</span>
                        <button type="button" onClick={handleClear} aria-label="초기화">
                            <img src={`${A}/search_clear.png`} alt="" />
                        </button>
                    </div>
                </div>
            )}

            {/* 인트로 카드 (Figma 302:15132) */}
            {stage === 'intro' && (
                <div className="maic-intro">
                    <button className="maic-intro__close" type="button" onClick={() => setStage('browse')} aria-label="닫기">
                        <img src={`${A}/intro_close.png`} alt="" />
                    </button>
                    <img className="maic-intro__persona" src={`${A}/intro_persona.png`} alt="" />
                    <h2 className="maic-intro__title">우리 지역을 대표하는 &lsquo;가상 시민&rsquo;을 만나보세요</h2>
                    <p className="maic-intro__desc">
                        AI 가상시민은 공공데이터와 시민 의견을<br />
                        분석하여 생성된 가상의 시민 페르소나입니다.<br />
                        지역의 생활환경과 문제, 요구를<br />
                        &lsquo;시민의 모습&rsquo;으로  이해할 수 있습니다.
                    </p>
                    <button className="maic-intro__cta" type="button" onClick={() => { setSelectedDistrict(null); setStage('list'); }}>
                        우리 지역 가상 시민 보기
                    </button>
                </div>
            )}

            {/* 바텀 시트 (list) / 전체 리스트 (full) */}
            {sheetOpen && (
                <div className={`maic-sheet${stage === 'full' ? ' maic-sheet--full' : ''}`}>
                    <div className="maic-sheet__head" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                        {stage === 'list' && (
                            <div className="maic-grip" aria-hidden="true"><i /><i /><i /></div>
                        )}
                        <div className="maic-title-row">
                            <span className="maic-title">{title}</span>
                            <button
                                className="maic-title__btn" type="button"
                                aria-label={stage === 'full' ? '지도 보기' : '전체 리스트'}
                                onClick={() => setStage(stage === 'full' ? 'list' : 'full')}
                            >
                                <img src={`${A}/expand_circle.png`} alt="" />
                            </button>
                        </div>
                        <div className="maic-count-row">
                            <span className="maic-count">총 {filtered.length}명</span>
                            <button className="maic-sort" type="button" onClick={() => setSort(s => s === 'importance' ? 'age' : 'importance')}>
                                {sort === 'importance' ? '중요도순' : '나이순'}
                                <img src={`${A}/arrow_down.png`} alt="" />
                            </button>
                        </div>
                    </div>
                    <div className="maic-list">
                        {loading && <div className="maic-msg">불러오는 중...</div>}
                        {!loading && filtered.length === 0 && <div className="maic-msg">해당 조건의 가상시민이 없습니다.</div>}
                        {!loading && filtered.map(renderCard)}
                    </div>
                </div>
            )}

            <MobileBottomNav currentView="mAICitizen" onNavigate={onNavigate} />
        </div>
    );
}
