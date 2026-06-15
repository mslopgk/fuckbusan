import { useEffect, useMemo, useRef, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PersonaChat from './PersonaChat';
import { API_URL } from '../utils/api';
import './PCPublicData.css';
import './PCAICitizen.css';

/* PC AI 가상시민 — Figma 215:3802 리뉴얼 (공공데이터와 동일 셸).
   좌측 필터(구역/생활정보/AI챗봇) + 지도 + 우측 페르소나 리스트 + 하단 상세 리포트 + 챗봇. */

const ACCENT = '#23bdbb';
const GUGUN = [
    '부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구',
];
// 생활정보 카테고리 (persona.categories 라벨과 일치). icon=공용 living-icons
const CATS = [
    { key: 'all', label: '전체', icon: '/figma-assets/living-icons/all.svg' },
    { key: '안전', label: '안전', icon: '/figma-assets/living-icons/safety.svg' },
    { key: '주거', label: '주거', icon: '/figma-assets/living-icons/home.svg' },
    { key: '산업일자리', label: '산업·일자리', icon: '/figma-assets/living-icons/badge.svg' },
    { key: '교육', label: '교육', icon: '/figma-assets/living-icons/edu.svg' },
    { key: '환경', label: '환경', icon: '/figma-assets/living-icons/forest.svg' },
    { key: '문화여가', label: '문화·여가', icon: '/figma-assets/living-icons/game.svg' },
    { key: '보건', label: '보건·복지', icon: '/figma-assets/living-icons/care.svg' },
    { key: '교통', label: '교통', icon: '/figma-assets/living-icons/bus.svg' },
];
const SORTS = [
    { key: 'importance', label: '중요도순' },
    { key: 'age', label: '나이순' },
];
const DONUT_COLORS = ['#e6235a', '#5b2eab', '#3b82f6', '#23bdbb', '#9aa3ab', '#f59e0b', '#06ab69', '#ec4899'];

const avatarSrc = (url) => (url ? (url.startsWith('http') ? url : `${API_URL}${url}`) : null);

/* ── 기존 스타일라이즈드 부산 구·군 지도 (Figma 일러스트, 카카오맵 아님) ── */
const DISTRICTS_POS = [
    { name: '강서구', left: 378, top: 489.44, w: 443.53, h: 384.856, lx: 30, ly: -1.35 },
    { name: '기장군', left: 1082.54, top: 107, w: 439.552, h: 516.125, lx: -16.96, ly: -32.96 },
    { name: '금정구', left: 917.57, top: 307.78, w: 237.676, h: 244.637, lx: -2.06, ly: -10.84 },
    { name: '남구', left: 966.4, top: 676.29, w: 165.08, h: 154.141, lx: -4.38, ly: -11.29 },
    { name: '동구', left: 883.86, top: 711.99, w: 88.507, h: 75.579, lx: 2.39, ly: -12.64 },
    { name: '동래구', left: 931.59, top: 509.44, w: 154.141, h: 90.496, lx: 2.45, ly: -14.9 },
    { name: '부산진구', left: 868.06, top: 577.84, w: 153.147, h: 169.058, lx: -11.63, ly: -21.37 },
    { name: '북구', left: 818.44, top: 377.39, w: 145.191, h: 227.732, lx: -5.29, ly: 13.1 },
    { name: '사상구', left: 730.93, top: 581.82, w: 148.175, h: 200.881, lx: 5.16, ly: -14.45 },
    { name: '사하구', left: 684.19, top: 760.72, w: 185.964, h: 219.776, lx: 5.16, ly: -32.06 },
    { name: '서구', left: 825.29, top: 723.92, w: 75.579, h: 212.815, lx: -4.38, ly: -65.93 },
    { name: '수영구', left: 1047.31, top: 624.58, w: 78.989, h: 98.452, lx: -1.87, ly: -18.51 },
    { name: '연제구', left: 937.56, top: 579.94, w: 154.141, h: 94.474, lx: 18.71, ly: -23.03 },
    { name: '영도구', left: 897.57, top: 808.34, w: 157.125, h: 142.208, lx: -0.71, ly: -20.32 },
    { name: '중구', left: 879.88, top: 779.51, w: 80.551, h: 62.651, lx: -1.22, ly: -17.61 },
    { name: '해운대구', left: 1083.53, top: 457.83, w: 229.72, h: 242.648, lx: -19.16, ly: 7.22 },
];
const TEAL_FILTER = 'brightness(0) invert(67%) sepia(37%) saturate(586%) hue-rotate(136deg) brightness(0.9)';

function FigmaDistrictMap({ selectedDistrict, onDistrictClick, hoveredDistrict, onDistrictHover, onDistrictLeave, hoverCitizen, hoverAvatarUrl }) {
    const containerRef = useRef(null);
    const [layout, setLayout] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

    useEffect(() => {
        const update = () => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            const sc = Math.min(width / 1920, height / 1080);
            setLayout({ scale: sc, offsetX: (width - 1920 * sc) / 2, offsetY: (height - 1080 * sc) / 2 });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const hoverBubble = (() => {
        if (!hoveredDistrict || !hoverCitizen) return null;
        const d = DISTRICTS_POS.find((dp) => dp.name === hoveredDistrict);
        if (!d) return null;
        return { cx: d.left + d.w / 2, cy: d.top + d.h / 2, showAbove: (d.top + d.h / 2) > 420 };
    })();

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', background: '#d4e8ee', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: layout.offsetY, left: layout.offsetX, width: 1920, height: 1080, transformOrigin: 'top left', transform: `scale(${layout.scale})` }}>
                <img src="/assets/지도 배경 데스크탑.png" alt="" draggable={false}
                    style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 904, pointerEvents: 'none', userSelect: 'none' }} />
                <img src="/assets/districts/shadow.svg" alt="" draggable={false}
                    style={{ position: 'absolute', left: 382, top: 116, width: 1150, height: 880, pointerEvents: 'none', userSelect: 'none' }} />
                {DISTRICTS_POS.map((d) => (
                    <button key={d.name} type="button" title={d.name}
                        onClick={() => onDistrictClick(d.name)}
                        onMouseEnter={() => onDistrictHover && onDistrictHover(d.name)}
                        onMouseLeave={onDistrictLeave}
                        style={{ position: 'absolute', left: d.left, top: d.top, width: d.w, height: d.h, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <img src={`/assets/districts/${d.name}.svg`} alt={d.name} draggable={false}
                            style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }} />
                        {selectedDistrict === d.name && (
                            <img src={`/assets/districts/${d.name}.svg`} alt="" aria-hidden="true" draggable={false}
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: TEAL_FILTER, pointerEvents: 'none', display: 'block' }} />
                        )}
                        <span style={{
                            position: 'absolute', left: `calc(50% + ${d.lx}px)`, top: `calc(50% + ${d.ly}px)`,
                            transform: 'translate(-50%, -50%)', fontSize: '20px', fontWeight: selectedDistrict === d.name ? 700 : 500,
                            color: selectedDistrict === d.name ? '#fff' : '#242424', textAlign: 'center', whiteSpace: 'nowrap',
                            letterSpacing: '-0.8px', lineHeight: 1.4, pointerEvents: 'none', userSelect: 'none',
                            textShadow: selectedDistrict === d.name ? 'none' : '0 1px 3px rgba(255,255,255,0.7)',
                        }}>{d.name}</span>
                    </button>
                ))}
                {hoverBubble && hoverCitizen && (
                    <div style={{ position: 'absolute', left: hoverBubble.cx, top: hoverBubble.cy, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 15 }}>
                        <div style={{ position: 'absolute', [hoverBubble.showAbove ? 'bottom' : 'top']: 82, left: '50%', transform: 'translateX(-50%)', width: 320, background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.18)', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{hoverCitizen.quote}</p>
                            <div style={{ position: 'absolute', [hoverBubble.showAbove ? 'bottom' : 'top']: -10, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', [hoverBubble.showAbove ? 'borderTop' : 'borderBottom']: '10px solid #fff' }} />
                        </div>
                        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 140, height: 140, borderRadius: '50%', background: '#23bdbb', border: '6px solid rgba(35,189,187,0.35)', boxShadow: '0 6px 24px rgba(35,189,187,0.45)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                            {hoverAvatarUrl ? <img src={hoverAvatarUrl} alt="" style={{ width: 128, height: 128, borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ fontSize: 40, fontWeight: 800, color: '#fff' }}>{hoverCitizen.avatar_initial}</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── 아바타 (이미지 or 이니셜 폴백) ── */
function Avatar({ url, initial, size = 56 }) {
    return (
        <span className="aic-avatar" style={{ width: size, height: size }}>
            {url ? <img src={url} alt="" /> : <span className="aic-avatar-fb">{initial || '시'}</span>}
        </span>
    );
}

/* ── 좌측 필터 패널 ── */
function FilterPanel({ region, setRegion, cat, setCat, onChat }) {
    const [open, setOpen] = useState(false);
    return (
        <aside className="pubdata-panel pubdata-left aic-left">
            <div className="pubdata-field">
                <label className="pubdata-label">구역별</label>
                <div className={`pubdata-select${open ? ' open' : ''}`}>
                    <button type="button" className="pubdata-select-btn" onClick={() => setOpen((v) => !v)}>
                        <span>{region}</span><i className="pubdata-caret" aria-hidden="true" />
                    </button>
                    {open && (
                        <ul className="pubdata-select-menu" role="listbox">
                            {GUGUN.map((d) => (
                                <li key={d}>
                                    <button type="button" className={`pubdata-select-opt${d === region ? ' sel' : ''}`}
                                        onClick={() => { setRegion(d); setOpen(false); }}>{d}</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="pubdata-section-head">생활정보</div>
            <div className="pubdata-catgrid">
                {CATS.map((c) => {
                    const on = cat === c.key;
                    return (
                        <button key={c.key} type="button"
                            className={`pubdata-cat${on ? ' active' : ''}`}
                            style={on ? { background: ACCENT, borderColor: ACCENT } : undefined}
                            onClick={() => setCat(c.key)}>
                            <img className="pubdata-cat-ic" src={c.icon} alt="" aria-hidden="true" />
                            <span>{c.label}</span>
                        </button>
                    );
                })}
            </div>

            <button type="button" className="aic-chatbot-btn" onClick={onChat}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                AI 챗봇
            </button>
        </aside>
    );
}

/* ── 우측 페르소나 리스트 ── */
function PersonaList({ region, citizens, avatars, sort, setSort, onSelect, selectedId }) {
    const [sortOpen, setSortOpen] = useState(false);
    return (
        <aside className="pubdata-panel aic-list">
            <h2 className="aic-list-title"><span>{region}</span> AI 가상시민</h2>
            <p className="aic-list-sub">{region} 시민 의견과 데이터를 바탕으로 만든 AI 가상시민입니다. 서로 다른 삶과 시선을 통해 우리 동네의 고민과 바람을 한눈에 볼 수 있어요.</p>
            <div className="aic-list-bar">
                <span className="aic-list-count">총 {citizens.length}명</span>
                <div className={`aic-sort${sortOpen ? ' open' : ''}`}>
                    <button type="button" className="aic-sort-btn" onClick={() => setSortOpen((v) => !v)}>
                        {SORTS.find((s) => s.key === sort).label} <i className="pubdata-caret" aria-hidden="true" />
                    </button>
                    {sortOpen && (
                        <ul className="aic-sort-menu">
                            {SORTS.map((s) => (
                                <li key={s.key}><button type="button" className={s.key === sort ? 'sel' : ''}
                                    onClick={() => { setSort(s.key); setSortOpen(false); }}>{s.label}</button></li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="aic-cards">
                {citizens.length === 0 && <p className="aic-empty">해당 지역의 가상시민이 아직 없어요.</p>}
                {citizens.map((c) => (
                    <button key={c.id} type="button"
                        className={`aic-card${selectedId === c.id ? ' active' : ''}`}
                        onClick={() => onSelect(c)}>
                        <Avatar url={avatarSrc(avatars[c.id])} initial={c.avatar_initial} size={62} />
                        <div className="aic-card-body">
                            <div className="aic-card-name">{c.name} <em>{c.age}세</em></div>
                            <div className="aic-card-tags">{(c.tags || []).slice(0, 3).map((t) => <span key={t}>{t}</span>)}</div>
                            <p className="aic-card-quote">{c.quote}</p>
                        </div>
                        <span className="aic-card-arrow">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill={ACCENT} /><path d="M10 8l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                    </button>
                ))}
            </div>
        </aside>
    );
}

/* ── 페르소나 풀 상세 리포트 (Figma 215:5403 정확 재현) ── */
// 감정(레벨/색/표정) — Figma 색상값 그대로
const EMO_LEVEL = { '개쾌함': 1, '기대됨': 1, '집중함': 2, '집중됨': 2, '보통': 3, '불안함': 4, '매우불안함': 5, '매우 불안함': 5 };
const EMO_COLOR = { '개쾌함': '#0da000', '기대됨': '#0da000', '집중함': '#c8a300', '집중됨': '#c8a300', '보통': '#c8a300', '불안함': '#ff7300', '매우불안함': '#ff0000', '매우 불안함': '#ff0000' };
const EMO_FACE = { '개쾌함': '😄', '기대됨': '😄', '집중함': '😌', '집중됨': '😌', '보통': '😐', '불안함': '😟', '매우불안함': '😣', '매우 불안함': '😣' };
// 행동 키워드 → 활동 이모지 (Figma 여정 아이콘 대응)
const actionEmoji = (a = '') => {
    if (/카페/.test(a)) return '🏪';
    if (/공부|스터디|학습|독서/.test(a)) return '📚';
    if (/귀가|짐|준비|정리/.test(a)) return '🎒';
    if (/버스|대중교통|지하철|하차/.test(a)) return '🚌';
    if (/집|도착|귀택/.test(a)) return '🏠';
    if (/도보|골목|이동|걷/.test(a)) return '🛣️';
    if (/운동|산책/.test(a)) return '🏃';
    if (/시장|장보|쇼핑/.test(a)) return '🛒';
    if (/병원|진료|건강/.test(a)) return '🏥';
    return '📍';
};
const PROFILE_FIELDS_L = [['job', '직업'], ['family', '가족'], ['motto', '좌우명'], ['dream_life', '꿈꾸는 생활']];
const PROFILE_FIELDS_R = [['interests', '관심사'], ['concerns', '고민'], ['hobbies', '취미'], ['activities', '활동']];
const join = (v) => (Array.isArray(v) ? v.join(', ') : (v || '—'));

// 감정선 (행동 박스 하단을 잇는 점선 + 점)
function EmotionLine({ journey }) {
    const n = journey.length;
    if (n < 1) return null;
    const W = 1000, H = 40, padTop = 6;
    const xOf = (i) => ((i + 0.5) / n) * W;
    const yOf = (e) => padTop + ((EMO_LEVEL[e] ?? 3) - 1) / 4 * (H - padTop - 6);
    const pts = journey.map((s, i) => [xOf(i), yOf(s.emotion)]);
    const dPath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height: H }}>
            <path d={dPath} fill="none" stroke="#cfcfcf" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
            {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill={EMO_COLOR[journey[i].emotion] || '#ccc'} vectorEffect="non-scaling-stroke" />)}
        </svg>
    );
}

function PersonRatioIcons() {
    return (
        <span className="aic-pr-icons" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} width="11" height="20" viewBox="0 0 11 20" fill={i === 0 ? '#23bdbb' : '#b9d6d6'}>
                    <circle cx="5.5" cy="4" r="3.4" /><path d="M0.5 20c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5z" />
                </svg>
            ))}
        </span>
    );
}

function DetailReport({ citizen, avatarUrl, onClose, onPrev, onNext, onChat }) {
    const d = citizen.detail || {};
    const voices = (d.voices || []).slice(0, 3);
    const issues = (d.top_issues || []).slice(0, 3);
    const journey = d.journey || [];
    const sig = d.policy_signals || {};
    const policyRows = [
        ...(sig.high || []).map((t) => ({ lv: 'high', t })),
        ...(sig.medium || []).map((t) => ({ lv: 'medium', t })),
        ...(sig.low || []).map((t) => ({ lv: 'low', t })),
    ].slice(0, 3);
    const part = d.participation || {};
    const partItems = ['제안', '제보', '진단', '설문'].map((k) => [k, part[k] || 0]);
    const partMax = Math.max(...partItems.map(([, v]) => v), 1);
    const cs = d.category_scores || {};
    const CATS8 = [['안전', '안전'], ['교통', '교통'], ['주거', '주거'], ['산업• 일자리', '산업일자리'], ['교육', '교육'], ['환경', '환경'], ['문화• 여가', '문화여가'], ['보건 • 복지', '보건']];

    return (
        <div className="aic-modal-backdrop" onClick={onClose}>
            <div className="aic-modal" onClick={(e) => e.stopPropagation()}>
                <div className="aic-modal-top">
                    <div className="aic-modal-top-l">
                        <strong>페르소나 상세 리포트</strong>
                        <button type="button" onClick={onPrev} aria-label="이전">‹</button>
                        <button type="button" onClick={onNext} aria-label="다음">›</button>
                    </div>
                    <button type="button" className="aic-report-chat" onClick={() => onChat(citizen)}>+가상시민과 채팅하기</button>
                    <button type="button" className="aic-report-x" onClick={onClose} aria-label="닫기">×</button>
                </div>

                <div className="aic-modal-scroll">
                    {/* 헤더 */}
                    <div className="aic-rp-hero">
                        <div className="aic-rp-illust">
                            {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="aic-illust-fb">{citizen.avatar_initial}</span>}
                        </div>
                        <div className="aic-rp-mid">
                            <div className="aic-rp-nameline">
                                <span className="aic-rp-name">{citizen.name}</span>
                                <span className="aic-rp-age">{citizen.age}세 · {citizen.gender || ''}</span>
                            </div>
                            <div className="aic-rp-tags">{(citizen.tags || []).map((t) => <span key={t}>{t}</span>)}</div>
                            <div className="aic-rp-prof-box left">
                                {PROFILE_FIELDS_L.map(([k, l]) => <div key={k} className="aic-rp-prow"><dt>{l}</dt><dd>{join(d[k])}</dd></div>)}
                            </div>
                        </div>
                        <div className="aic-rp-right">
                            <div className="aic-rp-similar">
                                <div className="aic-rp-similar-head"><span>유사 시민 비율</span><PersonRatioIcons /></div>
                                <p>{d.similar_desc || '유사한 생활 유형'}</p>
                                <strong>{d.similar_ratio || '—'}</strong>
                            </div>
                            <div className="aic-rp-prof-box right">
                                {PROFILE_FIELDS_R.map(([k, l]) => <div key={k} className="aic-rp-prow"><dt>{l}</dt><dd>{join(d[k])}</dd></div>)}
                            </div>
                        </div>
                    </div>

                    {/* 체감언어 / 목소리 / 핵심이슈 */}
                    <div className="aic-rp-3col">
                        <div className="aic-rp-card">
                            <h4>시민 체감 언어</h4>
                            <div className="aic-rp-feel"><i className="aic-q open">❝</i><span>{d.body_language || '—'}</span><i className="aic-q close">❞</i></div>
                        </div>
                        <div className="aic-rp-card">
                            <h4>시민 목소리</h4>
                            <div className="aic-rp-pills">{voices.map((t, i) => <div key={i} className="aic-rp-pill"><b>{String(i + 1).padStart(2, '0')}</b><span>{t}</span></div>)}</div>
                        </div>
                        <div className="aic-rp-card">
                            <h4>핵심 이슈 TOP 3</h4>
                            <div className="aic-rp-pills">{issues.map((t, i) => <div key={i} className="aic-rp-pill"><b>{String(i + 1).padStart(2, '0')}</b><span>{t}</span></div>)}</div>
                        </div>
                    </div>

                    {/* 여정지도 */}
                    {journey.length > 0 && (
                        <div className="aic-rp-journey">
                            <h4>여정지도</h4>
                            <div className="aic-jr-body">
                                <div className="aic-jr-rowlabels"><span>행동</span><span>감정</span><span>감정</span></div>
                                <div className="aic-jr-grid" style={{ gridTemplateColumns: `repeat(${journey.length}, 1fr)` }}>
                                    {journey.map((s, i) => (
                                        <div key={i} className="aic-jr-step">
                                            <span className="aic-jr-num" style={{ background: EMO_COLOR[s.emotion] || '#bbb' }}>{i + 1}</span>
                                            <div className="aic-jr-emoji">{actionEmoji(s.action)}</div>
                                            <div className="aic-jr-action">{s.action}</div>
                                            <div className="aic-jr-time">{s.time}</div>
                                            <div className="aic-jr-feeling">{s.feeling}</div>
                                            <div className="aic-jr-face">{EMO_FACE[s.emotion] || '🙂'}</div>
                                            <div className="aic-jr-emotion" style={{ color: EMO_COLOR[s.emotion] }}>{s.emotion}</div>
                                        </div>
                                    ))}
                                </div>
                                <EmotionLine journey={journey} />
                            </div>
                        </div>
                    )}

                    {/* 정책신호등 / 참여현황 / 카테고리 */}
                    <div className="aic-rp-3col bottom">
                        <div className="aic-rp-card sig">
                            <h4>정책 신호등</h4>
                            <div className="aic-sig-legend"><span className="high">● 높음</span><span className="medium">● 보통</span><span className="low">● 낮음</span></div>
                            <div className="aic-sig-list">
                                {policyRows.map((p, i) => (
                                    <div key={i} className="aic-sig-row">
                                        <span className={`aic-sig-light ${p.lv}`}><i /><i /><i /></span>
                                        <span className={`aic-sig-text ${p.lv}`}>{p.t}</span>
                                    </div>
                                ))}
                                {!policyRows.length && <span className="aic-voice-empty">자료 준비 중</span>}
                            </div>
                        </div>
                        <div className="aic-rp-card">
                            <h4>공공데이터 참여 현황 <span className="aic-rp-sub8">(참여 비율)</span></h4>
                            <div className="aic-part-chart">
                                {partItems.map(([label, value]) => (
                                    <div key={label} className="aic-part-col">
                                        <span className="aic-part-val">{value}%</span>
                                        <div className="aic-part-fill" style={{ height: `${Math.max(6, (value / partMax) * 96)}px` }} />
                                        <span className="aic-part-label">{label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="aic-part-cap">제보와 설문 참여 비율이 높아 생활 불편 체감이 높은 유형입니다.</div>
                        </div>
                        <div className="aic-rp-card">
                            <div className="aic-cat-head"><h4>카테고리별 관심도 <span className="aic-rp-sub8">(8대 영역)</span></h4><span className="aic-cat-toggle" /></div>
                            <div className="aic-hbars">
                                {CATS8.map(([label, key]) => (
                                    <div key={key} className="aic-hbar-row">
                                        <span className="aic-hbar-label">{label}</span>
                                        <div className="aic-hbar-track"><div className="aic-hbar-fill" style={{ width: `${((cs[key] || 0) / 5) * 100}%` }} /></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="aic-rp-foot">
                        <span>이 리포트는 {citizen.district} 시민 의견과 공공데이터를 기반으로 AI 분석을 통해 생성된 가상 인물입니다.</span>
                        <button type="button" onClick={onNext}>다른 시민 유형 보기 ›</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PCAICitizen({ onNavigate }) {
    const [region, setRegion] = useState('부산진구');
    const [cat, setCat] = useState('all');
    const [sort, setSort] = useState('importance');
    const [all, setAll] = useState([]);
    const [avatars, setAvatars] = useState({});
    const [selected, setSelected] = useState(null);   // 리스트의 기본 정보
    const [detail, setDetail] = useState(null);        // 상세(detail 포함)
    const [chatPersona, setChatPersona] = useState(null);
    const [hovered, setHovered] = useState(null);      // 지도 hover 구·군

    // 전체 페르소나 로드
    useEffect(() => {
        fetch(`${API_URL}/api/ai-citizens?sort=${sort}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => { if (Array.isArray(rows)) setAll(rows); })
            .catch(() => {});
    }, [sort]);

    // 지역+카테고리 필터
    const citizens = useMemo(() => {
        let list = all.filter((c) => c.district === region);
        if (cat !== 'all') list = list.filter((c) => (c.categories || []).includes(cat));
        list = [...list].sort((a, b) => (sort === 'age' ? b.age - a.age : (a.importance || 99) - (b.importance || 99)));
        return list;
    }, [all, region, cat, sort]);

    // 보이는 페르소나 아바타 lazy fetch
    useEffect(() => {
        citizens.forEach((c) => {
            if (avatars[c.id] !== undefined) return;
            setAvatars((m) => ({ ...m, [c.id]: null }));
            fetch(`${API_URL}/api/ai-citizens/${c.id}/avatar`)
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => { if (d?.url) setAvatars((m) => ({ ...m, [c.id]: d.url })); })
                .catch(() => {});
        });
    }, [citizens]); // eslint-disable-line

    // 지역 바뀌면 상세 닫기
    useEffect(() => { setSelected(null); setDetail(null); }, [region]);

    const openDetail = (c) => {
        setSelected(c);
        setDetail(null);
        fetch(`${API_URL}/api/ai-citizens/${c.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d) setDetail(d); })
            .catch(() => {});
    };

    const cycle = (dir) => {
        if (!selected || citizens.length === 0) return;
        const i = citizens.findIndex((c) => c.id === selected.id);
        const next = citizens[(i + dir + citizens.length) % citizens.length];
        openDetail(next);
    };

    const startChat = (c) => {
        const base = c || detail || selected || citizens[0];
        if (base) setChatPersona({ ...base, avatarUrl: avatarSrc(avatars[base.id]) });
    };

    const reportCitizen = detail || selected;
    const hoverCitizen = hovered ? all.find((c) => c.district === hovered) : null;

    return (
        <UserPCLayout currentView="pcAICitizen" onNavigate={onNavigate}>
            <div className="pubdata aic">
                <div className="pubdata-map">
                    <FigmaDistrictMap
                        selectedDistrict={region}
                        onDistrictClick={(name) => setRegion(name)}
                        hoveredDistrict={hovered}
                        onDistrictHover={setHovered}
                        onDistrictLeave={() => setHovered(null)}
                        hoverCitizen={hoverCitizen}
                        hoverAvatarUrl={avatarSrc(hoverCitizen && avatars[hoverCitizen.id])}
                    />
                </div>

                <FilterPanel region={region} setRegion={setRegion} cat={cat} setCat={setCat} onChat={() => startChat()} />

                <PersonaList
                    region={region} citizens={citizens} avatars={avatars}
                    sort={sort} setSort={setSort}
                    onSelect={openDetail} selectedId={selected?.id}
                />

                {reportCitizen && (
                    <DetailReport
                        citizen={reportCitizen}
                        avatarUrl={avatarSrc(avatars[reportCitizen.id])}
                        onClose={() => { setSelected(null); setDetail(null); }}
                        onPrev={() => cycle(-1)} onNext={() => cycle(1)}
                        onChat={startChat}
                    />
                )}

                {chatPersona && <PersonaChat persona={chatPersona} onClose={() => setChatPersona(null)} />}
            </div>
        </UserPCLayout>
    );
}
