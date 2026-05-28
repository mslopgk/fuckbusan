import { useState, useEffect, useRef, useCallback } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCAICitizen.css';
import { API_URL } from '../utils/api';
import { CategoryIcon } from '../constants/mapConstants';


const ALL_DISTRICTS = [
    '전체', '강서구', '금정구', '기장군', '남구', '동구', '동래구',
    '북구', '부산진구', '사상구', '사하구', '서구', '수영구',
    '연제구', '영도구', '중구', '해운대구',
];

const CATEGORIES = [
    { key: 'all',     label: '전체',        icon: 'grid' },
    { key: 'safety',  label: '안전',        icon: 'shield' },
    { key: 'housing', label: '주거',        icon: 'home' },
    { key: 'work',    label: '산업\n일자리', icon: 'briefcase' },
    { key: 'edu',     label: '교육',        icon: 'book' },
    { key: 'env',     label: '환경',        icon: 'leaf' },
    { key: 'culture', label: '문화·여가',   icon: 'heart' },
    { key: 'health',  label: '보건·복지',   icon: 'plus' },
    { key: 'traffic', label: '교통',        icon: 'bus' },
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

// shape: 'circle' | 'rect'
function PersonAvatar({ w = 80, h = 80, avatarUrl, shape = 'rect' }) {
    const radius = shape === 'circle' ? '50%' : '8px';
    const base = { width: w, height: h, borderRadius: radius, display: 'block', flexShrink: 0 };
    if (avatarUrl === 'loading') {
        return (
            <div style={{ ...base, background: '#e8f8f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#23bdbb" strokeWidth="2" strokeLinecap="round" style={{ marginBottom: 3 }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                <span style={{ fontSize: 9, color: '#23bdbb' }}>생성중</span>
            </div>
        );
    }
    if (avatarUrl) {
        return <img src={`${API_URL}${avatarUrl}`} alt="페르소나 아바타" style={{ ...base, objectFit: 'cover' }} />;
    }
    // Placeholder person silhouette
    return (
        <svg viewBox="0 0 75 94" width={w} height={h} style={{ borderRadius: radius, display: 'block', flexShrink: 0, background: '#f0ece6' }}>
            <rect width="75" height="94" fill="#f0ece6" rx={shape === 'circle' ? '37' : '8'}/>
            <ellipse cx="37" cy="32" rx="16" ry="18" fill="#d4aa82"/>
            <path d="M5 94 C5 60 37 52 37 52 C37 52 70 60 70 94 Z" fill="#d4aa82"/>
        </svg>
    );
}

function FigmaDistrictMap({ selectedDistrict, onDistrictClick, hoveredDistrict, onDistrictHover, onDistrictLeave, hoverCitizen, hoverAvatarUrl }) {
    const containerRef = useRef(null);
    const [layout, setLayout] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const sc = Math.min(width / 1920, height / 1080);
                setLayout({
                    scale: sc,
                    offsetX: (width - 1920 * sc) / 2,
                    offsetY: (height - 1080 * sc) / 2,
                });
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const hoverBubble = (() => {
        if (!hoveredDistrict || !hoverCitizen) return null;
        const d = DISTRICTS_POS.find(dp => dp.name === hoveredDistrict);
        if (!d) return null;
        const cx = d.left + d.w / 2;
        const cy = d.top + d.h / 2;
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
                top: layout.offsetY, left: layout.offsetX,
                width: 1920, height: 1080,
                transformOrigin: 'top left',
                transform: `scale(${layout.scale})`,
            }}>
                <img src="/assets/지도 배경 데스크탑.png" alt="" draggable={false}
                    style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 904, pointerEvents: 'none', userSelect: 'none' }} />
                <img src="/assets/districts/shadow.svg" alt="" draggable={false}
                    style={{ position: 'absolute', left: 382, top: 116, width: 1150, height: 880, pointerEvents: 'none', userSelect: 'none' }} />

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
                        <img src={`/assets/districts/${d.name}.svg`} alt={d.name} draggable={false}
                            style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }} />
                        {selectedDistrict === d.name && (
                            <img src={`/assets/districts/${d.name}.svg`} alt="" aria-hidden="true" draggable={false}
                                style={{
                                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                                    filter: TEAL_FILTER, pointerEvents: 'none', display: 'block',
                                }} />
                        )}
                        {/* Label: show X icon when selected (no overlay — prevents duplicate) */}
                        <span style={{
                            position: 'absolute',
                            left: `calc(50% + ${d.lx}px)`,
                            top: `calc(50% + ${d.ly}px)`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: '20px', fontWeight: selectedDistrict === d.name ? '700' : '500',
                            color: selectedDistrict === d.name ? '#fff' : '#242424',
                            textAlign: 'center', whiteSpace: 'nowrap',
                            letterSpacing: '-0.8px', lineHeight: '1.4',
                            pointerEvents: 'none', userSelect: 'none',
                            textShadow: selectedDistrict === d.name ? 'none' : '0 1px 3px rgba(255,255,255,0.7)',
                        }}>
                            {d.name}
                            {selectedDistrict === d.name && (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"
                                    style={{ display: 'block', margin: '2px auto 0' }}>
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                                </svg>
                            )}
                        </span>
                    </button>
                ))}

                {/* Hover bubble: persona circle + speech bubble */}
                {hoverBubble && hoverCitizen && (
                    <div key="hover-bubble" style={{
                        position: 'absolute', left: hoverBubble.cx, top: hoverBubble.cy,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none', zIndex: 15,
                    }}>
                        {/* Speech bubble */}
                        <div style={{
                            position: 'absolute',
                            [hoverBubble.showAbove ? 'bottom' : 'top']: 82,
                            left: '50%', transform: 'translateX(-50%)',
                            width: 320, background: '#fff', borderRadius: 14,
                            padding: '14px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                            textAlign: 'center',
                        }}>
                            <p style={{
                                margin: 0, fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1.5,
                                display: '-webkit-box', WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {hoverCitizen.quote}
                            </p>
                            <div style={{
                                position: 'absolute',
                                [hoverBubble.showAbove ? 'bottom' : 'top']: -10,
                                left: '50%', transform: 'translateX(-50%)',
                                width: 0, height: 0,
                                borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
                                [hoverBubble.showAbove ? 'borderTop' : 'borderBottom']: '10px solid #fff',
                            }} />
                        </div>
                        {/* Teal circle with avatar */}
                        <div style={{
                            position: 'absolute', left: '50%', top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 140, height: 140, borderRadius: '50%',
                            background: '#23bdbb', border: '6px solid rgba(35,189,187,0.35)',
                            boxShadow: '0 6px 24px rgba(35,189,187,0.45)',
                            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxSizing: 'border-box',
                        }}>
                            <PersonAvatar w={128} h={128} avatarUrl={hoverAvatarUrl} shape="circle" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const EMOTION_COLORS = {
    '개쾌함': '#4ade80',
    '기대됨': '#4ade80',
    '집중됨': '#a3e635',
    '보통': '#facc15',
    '불안함': '#fb923c',
    '매우불안함': '#ef4444',
    '매우 불안함': '#ef4444',
};

const EMOTION_LEVEL = {
    '개쾌함': 1, '기대됨': 1, '집중됨': 2, '보통': 3, '불안함': 4, '매우불안함': 5, '매우 불안함': 5,
};

const EMOTION_EMOJI = {
    '개쾌함': '😊', '기대됨': '🌟', '집중됨': '😌',
    '보통': '😐', '불안함': '😟', '매우불안함': '😨', '매우 불안함': '😨',
};

function EmotionLineGraph({ journey }) {
    const n = journey.length;
    if (n < 1) return null;
    const W = 520, H = 52;
    const padX = 16, padTop = 6, padBot = 18;
    const innerW = W - padX * 2;
    const innerH = H - padTop - padBot;

    const xOf = (i) => padX + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
    const yOf = (emotion) => {
        const lv = EMOTION_LEVEL[emotion] ?? 3;
        return padTop + ((5 - lv) / 4) * innerH;
    };

    const pts = journey.map((s, i) => [xOf(i), yOf(s.emotion)]);
    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
            <path d={d} fill="none" stroke="#c8c8c8" strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={6}
                    fill={EMOTION_COLORS[journey[i].emotion] || '#ccc'}
                    stroke="#fff" strokeWidth="2" />
            ))}
            {journey.map((step, i) => (
                <text key={i} x={pts[i][0]} y={H - 1} textAnchor="middle" fontSize="9" fill="#737373">
                    {step.emotion}
                </text>
            ))}
        </svg>
    );
}

function ParticipationChart({ data }) {
    if (!data) return null;
    const items = Object.entries(data);
    const max = Math.max(...items.map(([, v]) => v));
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120, marginTop: 8 }}>
            {items.map(([label, value]) => (
                <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{value}%</span>
                    <div style={{ width: '100%', background: '#edf7f7', borderRadius: 5, height: 80, display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{
                            width: '100%', borderRadius: 5,
                            height: `${Math.max(8, (value / max) * 80)}px`,
                            background: '#23bdbb',
                        }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#555', textAlign: 'center', fontWeight: 500 }}>{label}</span>
                </div>
            ))}
        </div>
    );
}

function CategoryRadar({ scores }) {
    if (!scores) return null;
    const CATS = ['안전', '주거', '교통', '산업\n일자리', '교육', '환경', '문화\n여가', '보건'];
    const SCORE_KEYS = ['안전', '주거', '교통', '산업일자리', '교육', '환경', '문화여가', '보건'];
    const SIZE = 160;
    const cx = SIZE / 2, cy = SIZE / 2;
    const maxR = 54;
    const n = CATS.length;
    const step = (2 * Math.PI) / n;

    const pt = (i, r) => {
        const a = i * step - Math.PI / 2;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    };

    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    const dataPts = SCORE_KEYS.map((k, i) => pt(i, ((scores[k] || 0) / 5) * maxR));
    const dPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

    return (
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block', margin: '4px auto 0' }}>
            {gridLevels.map((lv, li) => {
                const gPts = CATS.map((_, i) => pt(i, lv * maxR));
                const gPath = gPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
                return <path key={li} d={gPath} fill="none" stroke="#e0e0e0" strokeWidth="1" />;
            })}
            {CATS.map((_, i) => {
                const p = pt(i, maxR);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e0e0e0" strokeWidth="1" />;
            })}
            <path d={dPath} fill="rgba(35,189,187,0.2)" stroke="#23bdbb" strokeWidth="2" />
            {CATS.map((cat, i) => {
                const p = pt(i, maxR + 20);
                return cat.includes('\n') ? (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" fontSize="9" fill="#555">
                        {cat.split('\n').map((ln, li) => (
                            <tspan key={li} x={p.x} dy={li === 0 ? '-0.5em' : '1.2em'}>{ln}</tspan>
                        ))}
                    </text>
                ) : (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#555">{cat}</text>
                );
            })}
        </svg>
    );
}

function PersonIcons({ total = 5 }) {
    return (
        <div className="person-icons-row">
            {Array.from({ length: total }, (_, i) => {
                const active = i === total - 1;
                return (
                    <svg key={i} width="16" height="20" viewBox="0 0 16 20">
                        <circle cx="8" cy="5" r="3.5" fill={active ? '#23bdbb' : '#b2dfde'} />
                        <path d="M1 19c0-3.9 3.1-7 7-7s7 3.1 7 7" fill={active ? '#23bdbb' : '#b2dfde'} />
                    </svg>
                );
            })}
        </div>
    );
}

function CategoryHBars({ scores }) {
    if (!scores) return null;
    const CATS = [
        { label: '안전', key: '안전' },
        { label: '교통', key: '교통' },
        { label: '주거', key: '주거' },
        { label: '산업·일자리', key: '산업일자리' },
        { label: '교육', key: '교육' },
        { label: '환경', key: '환경' },
        { label: '문화·여가', key: '문화여가' },
        { label: '보건·복지', key: '보건' },
    ];
    return (
        <div className="cat-hbars">
            {CATS.map(({ label, key }) => (
                <div key={key} className="cat-hbar-row">
                    <span className="cat-hbar-label">{label}</span>
                    <div className="cat-hbar-track">
                        <div className="cat-hbar-fill" style={{ width: `${((scores[key] || 0) / 5) * 100}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CitizenDetailPanel({ citizen, avatarUrl, district, onClose }) {
    const d = citizen.detail || {};
    const journey = d.journey || [];
    const ps = d.policy_signals || {};
    const [categoryView, setCategoryView] = useState('bar');

    const totalMatch = (d.similar_desc || '').match(/약?\s*(\d+)명\s*중/);
    const personTotal = totalMatch ? Math.min(parseInt(totalMatch[1]), 8) : 5;

    return (
        <div className="pc-ai-detail-panel">
            <button className="pc-ai-detail-close" onClick={onClose} type="button" aria-label="닫기">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* ── Header ── */}
            <div className="pc-ai-detail-header">
                <div className="pc-ai-detail-avatar">
                    <PersonAvatar w={120} h={150} avatarUrl={avatarUrl} />
                </div>
                <div className="pc-ai-detail-identity">
                    <div className="pc-ai-detail-name-row">
                        <span className="pc-ai-detail-name">{citizen.name}</span>
                        <span className="pc-ai-detail-age-gender">{citizen.age}세 · {citizen.gender || ''}</span>
                    </div>
                    <div className="pc-ai-detail-tags">
                        {citizen.tags.map(t => <span key={t} className="pc-ai-detail-tag">{t}</span>)}
                    </div>
                    <div className="pc-ai-detail-info-boxes">
                        <div className="pc-ai-detail-info-box">
                            {[['직업', d.job], ['가족', d.family], ['좌우명', d.motto], ['꿈꾸는생활', d.dream_life]]
                                .filter(([, v]) => v).map(([label, value]) => (
                                <div key={label} className="info-row">
                                    <span className="info-label">{label}</span>
                                    <span className="info-value">{value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pc-ai-detail-info-box">
                            {[['관심사', d.interests], ['고민', d.concerns], ['취미', d.hobbies], ['활동', d.activities]]
                                .filter(([, v]) => v).map(([label, value]) => (
                                <div key={label} className="info-row">
                                    <span className="info-label">{label}</span>
                                    <span className="info-value">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="pc-ai-detail-ratio-box">
                    <div className="ratio-title">유사 시민 비율</div>
                    <PersonIcons total={personTotal} />
                    <div className="ratio-desc">{d.similar_desc || `${district} 유사 생활 유형`}</div>
                    <div className="ratio-pct">{d.similar_ratio || '-'}</div>
                </div>
            </div>

            {/* ── Voices row ── */}
            <div className="pc-ai-detail-voices-row">
                <div className="voice-card">
                    <div className="voice-section-title">시민 체감 언어</div>
                    <div className="voice-quote-wrap">
                        <span className="voice-quote-open">❝</span>
                        <p className="voice-body-text">{d.body_language || citizen.quote}</p>
                        <span className="voice-quote-close">❞</span>
                    </div>
                </div>
                <div className="voice-card">
                    <div className="voice-section-title">시민 목소리</div>
                    <div className="voice-items-list">
                        {(d.voices || []).map((v, i) => (
                            <div key={i} className="voice-item-card">
                                <span className="voice-num">0{i + 1}</span>
                                <span className="voice-item-text">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="voice-card">
                    <div className="voice-section-title">핵심 이슈 TOP 3</div>
                    <div className="voice-items-list">
                        {(d.top_issues || []).map((issue, i) => (
                            <div key={i} className="voice-item-card">
                                <span className="voice-num">0{i + 1}</span>
                                <span className="voice-item-text">{issue}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Journey map ── */}
            {journey.length > 0 && (
                <div className="pc-ai-detail-journey">
                    <div className="journey-title">여정지도</div>
                    <div className="journey-table">
                        {/* Step number circles */}
                        <div className="journey-row-label"></div>
                        <div className="journey-cells journey-step-circles-row">
                            {journey.map((step, i) => (
                                <div key={i} className="journey-step-header-cell">
                                    <div className="journey-step-num" style={{ background: EMOTION_COLORS[step.emotion] || '#aaa' }}>{i + 1}</div>
                                </div>
                            ))}
                        </div>
                        {/* Action row */}
                        <div className="journey-row-label">행동</div>
                        <div className="journey-cells">
                            {journey.map((step, i) => (
                                <div key={i} className="journey-cell">
                                    <div className="journey-time">{step.time}</div>
                                    <div className="journey-action">{step.action}</div>
                                </div>
                            ))}
                        </div>
                        {/* Feeling row */}
                        <div className="journey-row-label">감정</div>
                        <div className="journey-cells">
                            {journey.map((step, i) => (
                                <div key={i} className="journey-cell journey-cell--feeling">
                                    <div className="journey-feeling">{step.feeling}</div>
                                </div>
                            ))}
                        </div>
                        {/* Emoji row */}
                        <div className="journey-row-label"></div>
                        <div className="journey-cells journey-emoji-row">
                            {journey.map((step, i) => (
                                <div key={i} className="journey-emoji-cell">
                                    <span className="journey-emoji">{EMOTION_EMOJI[step.emotion] || '😐'}</span>
                                </div>
                            ))}
                        </div>
                        {/* Emotion line graph */}
                        <div className="journey-row-label"></div>
                        <div className="journey-graph-cell">
                            <EmotionLineGraph journey={journey} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bottom row ── */}
            <div className="pc-ai-detail-bottom-row">
                <div className="detail-bottom-card">
                    <div className="detail-bottom-title">정책 신호등</div>
                    <div className="policy-tabs-row">
                        <span className="policy-tab-badge" style={{ background: '#ef4444' }}>높음</span>
                        <span className="policy-tab-badge" style={{ background: '#fb923c' }}>보통</span>
                        <span className="policy-tab-badge" style={{ background: '#4ade80' }}>낮음</span>
                    </div>
                    <div className="policy-items-list">
                        {[['high', '#ef4444'], ['medium', '#fb923c'], ['low', '#4ade80']].flatMap(([lvKey, color]) =>
                            (ps[lvKey] || []).map((s, i) => (
                                <div key={`${lvKey}-${i}`} className="policy-item-row">
                                    <span className="policy-item-dot" style={{ background: color }} />
                                    <span>{s}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="detail-bottom-card">
                    <div className="detail-bottom-title">공공데이터 참여 현황 (참여 비율)</div>
                    <ParticipationChart data={d.participation} />
                    {d.participation_note && (
                        <p className="participation-note">{d.participation_note}</p>
                    )}
                </div>
                <div className="detail-bottom-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <div className="detail-bottom-title" style={{ margin: 0 }}>카테고리별 관심도 (8대 영역)</div>
                        <button className="cat-view-toggle" type="button"
                            onClick={() => setCategoryView(v => v === 'bar' ? 'radar' : 'bar')}
                            title={categoryView === 'bar' ? '레이더 차트로 보기' : '막대 그래프로 보기'}>
                            {categoryView === 'bar' ? (
                                /* radar/spider chart icon */
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 19 8 17 17 7 17 5 8"/>
                                    <line x1="12" y1="2" x2="12" y2="9.5"/>
                                    <line x1="19" y1="8" x2="12" y2="9.5"/>
                                    <line x1="17" y1="17" x2="12" y2="9.5"/>
                                    <line x1="7" y1="17" x2="12" y2="9.5"/>
                                    <line x1="5" y1="8" x2="12" y2="9.5"/>
                                </svg>
                            ) : (
                                /* horizontal bars icon */
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                    <rect x="3" y="5" width="8" height="3" rx="1.5" fill="currentColor" stroke="none"/>
                                    <rect x="3" y="10.5" width="14" height="3" rx="1.5" fill="currentColor" stroke="none"/>
                                    <rect x="3" y="16" width="11" height="3" rx="1.5" fill="currentColor" stroke="none"/>
                                </svg>
                            )}
                        </button>
                    </div>
                    {categoryView === 'bar'
                        ? <CategoryHBars scores={d.category_scores} />
                        : <CategoryRadar scores={d.category_scores} />
                    }
                </div>
            </div>

            <div className="pc-ai-detail-footer">
                <p>이 리포트는 {district} 시민 의견과 공공데이터를 기반으로 AI 분석을 통해 생성된 가상 시민입니다.</p>
                <button className="pc-ai-detail-more-btn" onClick={onClose} type="button">다른 시민 유형 보기 &gt;</button>
            </div>
        </div>
    );
}

function DistrictCitizenList({ district, citizens, avatarUrls, loading, onClose, onCitizenClick }) {
    const [sort, setSort] = useState('importance');

    const sorted = sort === 'age'
        ? [...citizens].sort((a, b) => a.age - b.age)
        : citizens;

    return (
        <div className="pc-ai-district-sidebar">
            <div className="pc-ai-district-sidebar__header">
                <p className="pc-ai-district-sidebar__title">
                    <span className="pc-ai-right__title-teal">{district}</span>
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
                <button className="pc-ai-district-sidebar__sort-btn"
                    onClick={() => setSort(s => s === 'importance' ? 'age' : 'importance')} type="button">
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
                    <div key={c.id} className="pc-ai-list-card" onClick={() => onCitizenClick(c.id)}>
                        <div className="pc-ai-list-card__avatar">
                            <PersonAvatar w={80} h={80} avatarUrl={avatarUrls[c.id]} shape="circle" />
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
                        <button className="pc-ai-list-card__arrow" type="button" aria-label="자세히 보기"
                            onClick={e => { e.stopPropagation(); onCitizenClick(c.id); }}>
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
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const [mapDistrict, setMapDistrict] = useState('');
    const [hoveredDistrict, setHoveredDistrict] = useState(null);
    const [showCTA, setShowCTA] = useState(true);
    const [hidingCTA, setHidingCTA] = useState(false);
    const [avatarUrls, setAvatarUrls] = useState({});
    const [detailCitizen, setDetailCitizen] = useState(null);
    const pendingAvatars = useRef(new Set());

    // Citizens shown in the default card carousel = all citizens sorted by importance
    const citizens = allCitizens;
    // Citizens shown in the district sidebar = filtered by clicked district
    const districtCitizens = mapDistrict
        ? allCitizens.filter(c => c.district === mapDistrict)
        : [];

    const hoverCitizen = hoveredDistrict
        ? (allCitizens.find(c => c.district === hoveredDistrict) || null)
        : null;

    const fetchAvatar = useCallback(async (citizenId) => {
        if (pendingAvatars.current.has(citizenId)) return;
        pendingAvatars.current.add(citizenId);
        setAvatarUrls(prev => ({ ...prev, [citizenId]: 'loading' }));
        try {
            const res = await fetch(`${API_URL}/api/ai-citizens/${citizenId}/avatar`);
            if (!res.ok) {
                setAvatarUrls(prev => ({ ...prev, [citizenId]: null }));
                return;
            }
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
            .then(data => { setAllCitizens(data); setSelectedIdx(0); })
            .catch(() => setAllCitizens([]))
            .finally(() => setLoading(false));
    }, [category]);

    // Prefetch carousel: current + next citizen
    useEffect(() => {
        const cur = citizens[selectedIdx];
        const next = citizens[selectedIdx + 1];
        if (cur) fetchAvatar(cur.id);
        if (next) fetchAvatar(next.id);
    }, [citizens, selectedIdx, fetchAvatar]);

    // Prefetch hover citizen avatar
    useEffect(() => {
        if (hoverCitizen) fetchAvatar(hoverCitizen.id);
    }, [hoverCitizen, fetchAvatar]);

    // Prefetch district sidebar avatars
    useEffect(() => {
        districtCitizens.forEach(c => fetchAvatar(c.id));
    }, [districtCitizens, fetchAvatar]);

    // Shift+R: regenerate current carousel citizen (hidden shortcut)
    useEffect(() => {
        const cur = citizens[selectedIdx];
        const handleKey = (e) => {
            if (e.shiftKey && e.key === 'R' && cur) {
                regenerateAvatar(cur.id);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [citizens, selectedIdx, regenerateAvatar]);

    const citizen = citizens[selectedIdx] || null;

    const handleCTAClose = () => {
        setHidingCTA(true);
    };

    const handleCTAAnimEnd = () => {
        if (hidingCTA) {
            setShowCTA(false);
            setHidingCTA(false);
        }
    };

    const handleDistrictClick = (name) => {
        setDetailCitizen(null);
        setMapDistrict(prev => prev === name ? '' : name);
    };

    const handleCitizenClick = async (citizenId) => {
        try {
            const res = await fetch(`${API_URL}/api/ai-citizens/${citizenId}`);
            const data = await res.json();
            setDetailCitizen(data);
            fetchAvatar(citizenId);
        } catch {
            // ignore
        }
    };

    return (
        <UserPCLayout currentView="pcAICitizen" onNavigate={onNavigate}>
            <div className="pc-ai-citizen">

                {/* Left: filters */}
                <div className="pc-ai-left">
                    <div className="pc-ai-left-card">
                        <div className="pc-ai-left__label">구역별</div>
                        <div className="pc-ai-select-wrap">
                            <select className="pc-ai-select" value={mapDistrict}
                                onChange={e => setMapDistrict(e.target.value)}>
                                <option value="">설정해주세요</option>
                                {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {mapDistrict && (
                                <button className="pc-ai-select-clear" onClick={() => setMapDistrict('')}
                                    type="button" aria-label="선택 해제">
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
                                <button key={cat.key}
                                    className={`pc-ai-cat-btn${category === cat.key ? ' active' : ''}`}
                                    onClick={() => setCategory(cat.key)} type="button">
                                    <span className="pc-ai-cat-icon"><CategoryIcon kind={cat.icon} /></span>
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
                        <div
                            className={`pc-ai-mascot-wrap${hidingCTA ? ' pc-ai-mascot-wrap--hiding' : ''}`}
                            onAnimationEnd={handleCTAAnimEnd}
                        >
                            <img
                                className="pc-ai-mascot-img"
                                src="/police_mascot.png"
                                alt="안내 마스코트"
                                draggable={false}
                            />
                            <div className="pc-ai-mascot-bubble">
                                <div className="pc-ai-mascot-bubble__tail" />
                                <button className="pc-ai-mascot-bubble__close" onClick={handleCTAClose} type="button" aria-label="닫기">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.2" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                                <p className="pc-ai-mascot-bubble__title">우리 지역을 대표하는 '가상 시민'을 만나보세요</p>
                                <p className="pc-ai-mascot-bubble__sub">
                                    AI 가상시민은 공공데이터와 시민 의견을 분석하여 생성된 가상의 시민 페르소나입니다.<br />
                                    지역의 생활환경과 문제, 요구를 '시민의 모습'으로 이해할 수 있습니다.
                                </p>
                                <button className="pc-ai-cta__btn" onClick={handleCTAClose} type="button">
                                    우리 지역 가상 시민 보기
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Default state: 부산전체 대표 AI 가상시민 card carousel */}
                {!mapDistrict && (
                    <div className="pc-ai-right-wrap">
                        <div className="pc-ai-right">
                            <div className="pc-ai-right__header">
                                <span className="pc-ai-right__title-teal">부산대표</span>
                                <span className="pc-ai-right__title-black"> AI 가상시민</span>
                            </div>

                            {loading && <div className="pc-ai-right__loading">불러오는 중...</div>}

                            {!loading && citizens.length === 0 && (
                                <div className="pc-ai-right__empty">가상시민이 없습니다.</div>
                            )}

                            {!loading && citizen && (
                                <>
                                    <p className="pc-ai-right__sub">
                                        부산 시민 의견과 데이터를 바탕으로 만든 AI 가상시민입니다<br />
                                        우리 동네에는 어떤 사람들이 살고 있는지,<br />
                                        어떤 생각과 불편을 느끼는지 확인해보세요
                                    </p>

                                    <div className="pc-ai-cards-wrap">
                                        <div className="pc-ai-cards-row">
                                            <div className="pc-ai-card">
                                                <PersonAvatar w={100} h={100} avatarUrl={avatarUrls[citizen.id]} shape="circle" />
                                                <div className="pc-ai-card__name-row" style={{ marginTop: 12 }}>
                                                    <span className="pc-ai-card__name">{citizen.name}</span>
                                                    <span className="pc-ai-card__age">{citizen.age}세</span>
                                                </div>
                                                <div className="pc-ai-card__tags">
                                                    {citizen.tags.map(t => (
                                                        <span key={t} className="pc-ai-card__tag">{t}</span>
                                                    ))}
                                                </div>
                                                <div className="pc-ai-card__divider" />
                                                <p className="pc-ai-card__quote">{citizen.quote}</p>
                                            </div>

                                            {citizens[selectedIdx + 1] && (
                                                <div className="pc-ai-card pc-ai-card--peek">
                                                    <PersonAvatar w={64} h={64} avatarUrl={avatarUrls[citizens[selectedIdx + 1].id]} shape="circle" />
                                                    <div className="pc-ai-card__name-row" style={{ marginTop: 10 }}>
                                                        <span className="pc-ai-card__name">{citizens[selectedIdx + 1].name}</span>
                                                        <span className="pc-ai-card__age">{citizens[selectedIdx + 1].age}세</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {!loading && citizen && selectedIdx > 0 && (
                            <button className="pc-ai-nav-circle pc-ai-nav-circle--prev"
                                onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
                                type="button" aria-label="이전 시민">
                                <svg viewBox="0 0 34 34" width="34" height="34">
                                    <circle cx="17" cy="17" r="17" fill="#23bdbb"/>
                                    <polyline points="20 10 14 17 20 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        )}

                        {!loading && citizen && selectedIdx < citizens.length - 1 && (
                            <button className="pc-ai-nav-circle"
                                onClick={() => setSelectedIdx(i => Math.min(citizens.length - 1, i + 1))}
                                type="button" aria-label="다음 시민">
                                <svg viewBox="0 0 34 34" width="34" height="34">
                                    <circle cx="17" cy="17" r="17" fill="#23bdbb"/>
                                    <polyline points="14 10 20 17 14 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Citizen detail overlay (shown when a citizen card is clicked) */}
                {detailCitizen && mapDistrict && (
                    <CitizenDetailPanel
                        citizen={detailCitizen}
                        avatarUrl={avatarUrls[detailCitizen.id]}
                        district={mapDistrict}
                        onClose={() => setDetailCitizen(null)}
                    />
                )}

                {/* District selected state: filtered citizen list sidebar */}
                {mapDistrict && (
                    <DistrictCitizenList
                        district={mapDistrict}
                        citizens={districtCitizens}
                        avatarUrls={avatarUrls}
                        loading={loading}
                        onClose={() => { setMapDistrict(''); setDetailCitizen(null); }}
                        onCitizenClick={handleCitizenClick}
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
