import { useState, useEffect, useRef, useCallback } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCAICitizen.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const ALL_DISTRICTS = [
    '전체', '강서구', '금정구', '기장군', '남구', '동구', '동래구',
    '북구', '부산진구', '사상구', '사하구', '서구', '수영구',
    '연제구', '영도구', '중구', '해운대구',
];

const CATEGORIES = [
    { key: 'all',     label: '전체',       icon: '/figma-assets/icons/ai-citizen/cat_all.svg' },
    { key: 'safety',  label: '안전',       icon: '/figma-assets/icons/ai-citizen/cat_safety.svg' },
    { key: 'housing', label: '주거',       icon: '/figma-assets/icons/ai-citizen/cat_housing.svg' },
    { key: 'work',    label: '산업\n일자리', icon: '/figma-assets/icons/ai-citizen/cat_work.svg' },
    { key: 'edu',     label: '교육',       icon: '/figma-assets/icons/ai-citizen/cat_edu.svg' },
    { key: 'env',     label: '환경',       icon: '/figma-assets/icons/ai-citizen/cat_env.svg' },
    { key: 'culture', label: '문화·여가',  icon: '/figma-assets/icons/ai-citizen/cat_culture.svg' },
    { key: 'health',  label: '보건·복지',  icon: '/figma-assets/icons/ai-citizen/cat_health.svg' },
    { key: 'traffic', label: '교통',       icon: '/figma-assets/icons/ai-citizen/cat_traffic.svg' },
];

const DISTRICTS_POS = [
    { name: '강서구',   left: 378,     top: 489.44, w: 443.53,  h: 384.856, lx:  30,    ly:  -1.35 },
    { name: '기장군',   left: 1082.54, top: 107,    w: 439.552, h: 516.125, lx: -16.96, ly: -32.96 },
    { name: '금정구',   left: 917.57,  top: 307.78, w: 237.676, h: 244.637, lx:  -2.06, ly: -10.84 },
    { name: '남구',     left: 966.4,   top: 676.29, w: 165.08,  h: 154.141, lx:  -4.38, ly: -11.29 },
    { name: '동구',     left: 883.86,  top: 711.99, w: 88.507,  h: 75.579,  lx:   2.39, ly: -12.64 },
    { name: '동래구',   left: 931.59,  top: 509.44, w: 154.141, h: 90.496,  lx:   2.45, ly: -14.9  },
    { name: '부산진구', left: 868.06,  top: 577.84, w: 153.147, h: 169.058, lx: -11.63, ly: -21.37 },
    { name: '북구',     left: 818.44,  top: 377.39, w: 145.191, h: 227.732, lx:  -5.29, ly:  13.1  },
    { name: '사상구',   left: 730.93,  top: 581.82, w: 148.175, h: 200.881, lx:   5.16, ly: -14.45 },
    { name: '사하구',   left: 684.19,  top: 760.72, w: 185.964, h: 219.776, lx:   5.16, ly: -32.06 },
    { name: '서구',     left: 825.29,  top: 723.92, w: 75.579,  h: 212.815, lx:  -4.38, ly: -65.93 },
    { name: '수영구',   left: 1047.31, top: 624.58, w: 78.989,  h: 98.452,  lx:  -1.87, ly: -18.51 },
    { name: '연제구',   left: 937.56,  top: 579.94, w: 154.141, h: 94.474,  lx:  18.71, ly: -23.03 },
    { name: '영도구',   left: 897.57,  top: 808.34, w: 157.125, h: 142.208, lx:  -0.71, ly: -20.32 },
    { name: '중구',     left: 879.88,  top: 779.51, w: 80.551,  h: 62.651,  lx:  -1.22, ly: -17.61 },
    { name: '해운대구', left: 1083.53, top: 457.83, w: 229.72,  h: 242.648, lx: -19.16, ly:   7.22 },
];

const TEAL_FILTER = 'brightness(0) invert(67%) sepia(37%) saturate(586%) hue-rotate(136deg) brightness(0.9)';

function PersonAvatar({ size = 80, avatarUrl }) {
    if (avatarUrl === 'loading') {
        return (
            <div style={{
                width: size, height: size, borderRadius: '50%',
                background: '#e8f8f8', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#23bdbb" strokeWidth="2" strokeLinecap="round" style={{ marginBottom: 4 }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                <span style={{ fontSize: Math.max(8, size * 0.1), color: '#23bdbb', textAlign: 'center', lineHeight: 1.3 }}>
                    생성중
                </span>
            </div>
        );
    }
    if (avatarUrl) {
        return (
            <img
                src={`${API_URL}${avatarUrl}`}
                alt="페르소나 아바타"
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }}
            />
        );
    }
    return (
        <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
            <circle cx="50" cy="50" r="50" fill="#f2dfc8"/>
            <circle cx="50" cy="36" r="17" fill="#d4aa82"/>
            <path d="M18 100 C18 70 50 65 50 65 C50 65 82 70 82 100 Z" fill="#d4aa82"/>
        </svg>
    );
}

function FigmaDistrictMap({ selectedDistrict, onDistrictClick, hoveredDistrict, onDistrictHover, onDistrictLeave, hoverCitizen, hoverAvatarUrl }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                setScale(width / 1920);
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Compute hover bubble position and direction
    const hoverBubble = (() => {
        if (!hoveredDistrict || !hoverCitizen) return null;
        const d = DISTRICTS_POS.find(dp => dp.name === hoveredDistrict);
        if (!d) return null;
        const cx = d.left + d.w / 2;
        const cy = d.top + d.h / 2;
        // Show bubble above for lower districts, below for upper districts
        const showAbove = cy > 420;
        return { cx, cy, showAbove };
    })();

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', width: '100%', height: '100%', background: '#d4e8ee', overflow: 'hidden' }}
        >
            <div style={{
                position: 'absolute',
                top: 0, left: 0,
                width: 1920,
                height: 1080,
                transformOrigin: 'top left',
                transform: `scale(${scale})`,
            }}>
                <img
                    src="/assets/지도 배경 데스크탑.png"
                    alt=""
                    draggable={false}
                    style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 904, pointerEvents: 'none', userSelect: 'none' }}
                />
                <img
                    src="/assets/districts/shadow.svg"
                    alt=""
                    draggable={false}
                    style={{ position: 'absolute', left: 382, top: 116, width: 1150, height: 880, pointerEvents: 'none', userSelect: 'none' }}
                />

                {DISTRICTS_POS.map(d => (
                    <button
                        key={d.name}
                        onClick={() => onDistrictClick(d.name)}
                        onMouseEnter={() => onDistrictHover(d.name)}
                        onMouseLeave={onDistrictLeave}
                        type="button"
                        title={d.name}
                        style={{
                            position: 'absolute', left: d.left, top: d.top, width: d.w, height: d.h,
                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        }}
                    >
                        <img
                            src={`/assets/districts/${d.name}.svg`}
                            alt={d.name}
                            draggable={false}
                            style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
                        />
                        {selectedDistrict === d.name && (
                            <img
                                src={`/assets/districts/${d.name}.svg`}
                                alt=""
                                aria-hidden="true"
                                draggable={false}
                                style={{
                                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                                    filter: TEAL_FILTER, pointerEvents: 'none', display: 'block',
                                }}
                            />
                        )}
                        <span style={{
                            position: 'absolute',
                            left: `calc(50% + ${d.lx}px)`,
                            top: `calc(50% + ${d.ly}px)`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: '20px', fontWeight: '500',
                            color: selectedDistrict === d.name ? '#fff' : '#242424',
                            textAlign: 'center', whiteSpace: 'nowrap',
                            letterSpacing: '-0.8px', lineHeight: '1.4',
                            pointerEvents: 'none', userSelect: 'none',
                            textShadow: selectedDistrict === d.name ? 'none' : '0 1px 3px rgba(255,255,255,0.7)',
                        }}>
                            {d.name}
                        </span>
                    </button>
                ))}

                {/* Selected district: name label + X button overlaid on the district */}
                {selectedDistrict && (() => {
                    const d = DISTRICTS_POS.find(dp => dp.name === selectedDistrict);
                    if (!d) return null;
                    const cx = d.left + d.w / 2 + d.lx;
                    const cy = d.top + d.h / 2 + d.ly;
                    return (
                        <div
                            key="selected-label"
                            style={{
                                position: 'absolute',
                                left: cx, top: cy,
                                transform: 'translate(-50%, -50%)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: 2,
                                pointerEvents: 'none', zIndex: 5,
                            }}
                        >
                            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.8px', lineHeight: 1.4 }}>
                                {selectedDistrict}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); /* parent handles via onDistrictClick */ }}
                                style={{ pointerEvents: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                aria-label="선택 해제"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                                </svg>
                            </button>
                        </div>
                    );
                })()}

                {/* Hover bubble: persona circle + speech bubble */}
                {hoverBubble && hoverCitizen && (
                    <div
                        key="hover-bubble"
                        style={{
                            position: 'absolute',
                            left: hoverBubble.cx,
                            top: hoverBubble.cy,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            zIndex: 15,
                        }}
                    >
                        {/* Speech bubble (above or below) */}
                        <div style={{
                            position: 'absolute',
                            [hoverBubble.showAbove ? 'bottom' : 'top']: 82,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 320,
                            background: '#fff',
                            borderRadius: 14,
                            padding: '14px 18px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                            textAlign: 'center',
                        }}>
                            <p style={{
                                margin: 0, fontSize: 15, fontWeight: 700,
                                color: '#111', lineHeight: 1.5,
                                display: '-webkit-box', WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {hoverCitizen.quote}
                            </p>
                            {/* Triangle tail */}
                            <div style={{
                                position: 'absolute',
                                [hoverBubble.showAbove ? 'bottom' : 'top']: -10,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0, height: 0,
                                borderLeft: '10px solid transparent',
                                borderRight: '10px solid transparent',
                                [hoverBubble.showAbove ? 'borderTop' : 'borderBottom']: '10px solid #fff',
                            }} />
                        </div>

                        {/* Teal circle with avatar */}
                        <div style={{
                            width: 140, height: 140,
                            borderRadius: '50%',
                            background: '#23bdbb',
                            border: '6px solid rgba(35,189,187,0.35)',
                            boxShadow: '0 6px 24px rgba(35,189,187,0.45)',
                            overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxSizing: 'border-box',
                            transform: 'translate(-50%, -50%)',
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                        }}>
                            <PersonAvatar size={128} avatarUrl={hoverAvatarUrl} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DistrictCitizenList({ district, citizens, avatarUrls, loading, onClose }) {
    const [sort, setSort] = useState('importance');

    const sorted = sort === 'age'
        ? [...citizens].sort((a, b) => a.age - b.age)
        : citizens;

    return (
        <div className="pc-ai-district-sidebar">
            <div className="pc-ai-district-sidebar__header">
                <p className="pc-ai-district-sidebar__title">
                    <span className="pc-ai-right__title-teal">부산대표</span>
                    <span className="pc-ai-right__title-black"> AI 가상시민</span>
                </p>
                <button className="pc-ai-district-sidebar__close" onClick={onClose} type="button" aria-label="닫기">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <p className="pc-ai-district-sidebar__desc">
                {district} 시민 의견과 데이터를 바탕으로 만든 AI 가상시민입니다<br />
                우리 동네에는 어떤 사람들이 살고 있는지,<br />
                어떤 생각과 불편을 느끼는지 확인해보세요
            </p>

            <div className="pc-ai-district-sidebar__meta">
                <span className="pc-ai-district-sidebar__count">총 {citizens.length}명</span>
                <button
                    className="pc-ai-district-sidebar__sort-btn"
                    onClick={() => setSort(s => s === 'importance' ? 'age' : 'importance')}
                    type="button"
                >
                    {sort === 'importance' ? '중요도순' : '나이순'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>
            </div>

            <div className="pc-ai-district-sidebar__list">
                {loading && <div className="pc-ai-right__loading">불러오는 중...</div>}
                {!loading && sorted.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#888', padding: '40px 0', fontSize: 14 }}>
                        해당 구역의 가상시민이 없습니다.
                    </div>
                )}
                {!loading && sorted.map(c => (
                    <div key={c.id} className="pc-ai-list-card">
                        <div className="pc-ai-list-card__avatar">
                            <PersonAvatar size={80} avatarUrl={avatarUrls[c.id]} />
                        </div>
                        <div className="pc-ai-list-card__body">
                            <div className="pc-ai-list-card__name-row">
                                <span className="pc-ai-list-card__name">{c.name}</span>
                                <span className="pc-ai-list-card__age">{c.age}세</span>
                            </div>
                            <div className="pc-ai-list-card__divider" />
                            <div className="pc-ai-list-card__tags">
                                {c.tags.slice(0, 3).map(t => (
                                    <span key={t} className="pc-ai-list-card__tag">{t}</span>
                                ))}
                            </div>
                            <p className="pc-ai-list-card__quote">{c.quote}</p>
                        </div>
                        <button className="pc-ai-list-card__arrow" type="button" aria-label="자세히 보기">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#23bdbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 8 16 12 12 16"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function PCAICitizen({ onNavigate }) {
    const [category, setCategory] = useState('all');
    const [allCitizens, setAllCitizens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapDistrict, setMapDistrict] = useState('');
    const [hoveredDistrict, setHoveredDistrict] = useState(null);
    const [showCTA, setShowCTA] = useState(true);
    const [avatarUrls, setAvatarUrls] = useState({});
    const pendingAvatars = useRef(new Set());

    const citizens = mapDistrict
        ? allCitizens.filter(c => c.district === mapDistrict)
        : allCitizens;

    const hoverCitizen = hoveredDistrict
        ? (allCitizens.find(c => c.district === hoveredDistrict) || null)
        : null;

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

    const regenerateAvatar = useCallback(async (citizenId) => {
        pendingAvatars.current.delete(citizenId);
        setAvatarUrls(prev => ({ ...prev, [citizenId]: 'loading' }));
        try {
            const res = await fetch(`${API_URL}/api/ai-citizens/${citizenId}/avatar/regenerate`, { method: 'POST' });
            const data = await res.json();
            setAvatarUrls(prev => ({ ...prev, [citizenId]: data.url || null }));
        } catch {
            setAvatarUrls(prev => ({ ...prev, [citizenId]: null }));
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (category !== 'all') params.set('category', category);
        fetch(`${API_URL}/api/ai-citizens?${params}`)
            .then(r => r.json())
            .then(data => { setAllCitizens(data); })
            .catch(() => setAllCitizens([]))
            .finally(() => setLoading(false));
    }, [category]);

    // Prefetch avatars for citizens in the sidebar list
    useEffect(() => {
        citizens.forEach(c => fetchAvatar(c.id));
    }, [citizens, fetchAvatar]);

    // Prefetch hover citizen avatar
    useEffect(() => {
        if (hoverCitizen) fetchAvatar(hoverCitizen.id);
    }, [hoverCitizen, fetchAvatar]);

    // Shift+R: regenerate hover citizen's avatar (hidden shortcut)
    useEffect(() => {
        const handleKey = (e) => {
            if (e.shiftKey && e.key === 'R' && hoverCitizen) {
                regenerateAvatar(hoverCitizen.id);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [hoverCitizen, regenerateAvatar]);

    const handleDistrictClick = (name) => {
        setMapDistrict(prev => prev === name ? '' : name);
    };

    return (
        <UserPCLayout currentView="pcAICitizen" onNavigate={onNavigate}>
            <div className="pc-ai-citizen">

                {/* Left: filters */}
                <div className="pc-ai-left">
                    <div className="pc-ai-left-card">
                        <div className="pc-ai-left__label">구역별</div>
                        <div className="pc-ai-select-wrap">
                            <select
                                className="pc-ai-select"
                                value={mapDistrict}
                                onChange={e => setMapDistrict(e.target.value)}
                            >
                                <option value="">설정해주세요</option>
                                {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {mapDistrict && (
                                <button
                                    className="pc-ai-select-clear"
                                    onClick={() => setMapDistrict('')}
                                    type="button"
                                    aria-label="선택 해제"
                                >
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="#888">
                                        <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm5 13.59L13.59 15 10 11.41 6.41 15 5 13.59 8.59 10 5 6.41 6.41 5 10 8.59 13.59 5 15 6.41 11.41 10 15 13.59z"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="pc-ai-left-card">
                        <div className="pc-ai-left__label">생활정보</div>
                        <div className="pc-ai-cat-grid">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.key}
                                    className={`pc-ai-cat-btn${category === cat.key ? ' active' : ''}`}
                                    onClick={() => setCategory(cat.key)}
                                    type="button"
                                >
                                    <img src={cat.icon} alt="" className="pc-ai-cat-icon" />
                                    <span className="pc-ai-cat-label">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="pc-ai-map-wrap">
                    <FigmaDistrictMap
                        selectedDistrict={mapDistrict}
                        onDistrictClick={handleDistrictClick}
                        hoveredDistrict={hoveredDistrict}
                        onDistrictHover={setHoveredDistrict}
                        onDistrictLeave={() => setHoveredDistrict(null)}
                        hoverCitizen={hoverCitizen}
                        hoverAvatarUrl={hoverCitizen ? avatarUrls[hoverCitizen.id] : null}
                    />

                    {showCTA && !mapDistrict && (
                        <div className="pc-ai-cta">
                            <button className="pc-ai-cta__close" onClick={() => setShowCTA(false)} type="button" aria-label="닫기">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                            <p className="pc-ai-cta__title">우리 지역을 대표하는 '가상 시민'을 만나보세요</p>
                            <p className="pc-ai-cta__sub">
                                AI 가상시민은 공공데이터와 시민 의견을 분석하여 생성된 가상의 시민 페르소나입니다.<br />
                                지역의 생활환경과 문제, 요구를 '시민의 모습'으로 이해할 수 있습니다.
                            </p>
                            <button className="pc-ai-cta__btn" onClick={() => setShowCTA(false)} type="button">
                                우리 지역 가상 시민 보기
                            </button>
                        </div>
                    )}
                </div>

                {/* Right sidebar: shown only when district is selected */}
                {mapDistrict && (
                    <DistrictCitizenList
                        district={mapDistrict}
                        citizens={citizens}
                        avatarUrls={avatarUrls}
                        loading={loading}
                        onClose={() => setMapDistrict('')}
                    />
                )}

                {/* Right-side icon control strip */}
                <div className="pc-ai-controls">
                    <button className="pc-ai-ctrl-ai-btn" type="button" aria-label="AI 가상시민">
                        <div style={{ position: 'relative', width: 22, height: 25, flexShrink: 0 }}>
                            <img src="/figma-assets/icons/map-controls/person.svg" alt=""
                                style={{ position: 'absolute', left: 0, top: 3.54, width: 21, height: 21 }} />
                            <img src="/figma-assets/icons/map-controls/sparkle_dot.svg" alt=""
                                style={{ position: 'absolute', left: 15.51, top: 6.46, width: 4.375, height: 4.375 }} />
                            <img src="/figma-assets/icons/map-controls/sparkle.svg" alt=""
                                style={{ position: 'absolute', left: 10.66, top: 0, width: 7.108, height: 7.108 }} />
                        </div>
                    </button>

                    <div className="pc-ai-ctrl-group">
                        <button className="pc-ai-ctrl-group-btn" type="button" aria-label="현재 위치">
                            <img src="/figma-assets/icons/map-controls/my_location.svg" alt="" width="24" height="24" />
                        </button>
                        <button className="pc-ai-ctrl-group-btn" type="button" aria-label="확대">
                            <img src="/figma-assets/icons/map-controls/add.svg" alt="" width="24" height="24" />
                        </button>
                        <button className="pc-ai-ctrl-group-btn" type="button" aria-label="축소">
                            <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src="/figma-assets/icons/map-controls/remove.svg" alt="" style={{ width: 14, height: 2 }} />
                            </div>
                        </button>
                        <button className="pc-ai-ctrl-group-btn pc-ai-ctrl-group-btn--active" type="button" aria-label="지도 보기">
                            <img src="/figma-assets/icons/map-controls/map.svg" alt="" width="24" height="24" />
                        </button>
                        <button className="pc-ai-ctrl-group-btn" type="button" aria-label="위성 보기">
                            <img src="/figma-assets/icons/map-controls/satellite_alt.svg" alt="" width="24" height="24" />
                        </button>
                    </div>
                </div>
            </div>
        </UserPCLayout>
    );
}
