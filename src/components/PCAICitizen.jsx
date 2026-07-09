import { useEffect, useMemo, useRef, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PersonaChat from './PersonaChat';
import PersonaReport from './PersonaReport';
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
// 순서는 Figma 302:3872 세로 레일(Group 968) 기준.
const CATS = [
    { key: 'all', label: '전체', icon: '/figma-assets/living-icons/all.svg' },
    { key: '산업일자리', label: '산업 일자리', icon: '/figma-assets/living-icons/badge.svg' },
    { key: '문화여가', label: '문화·여가', icon: '/figma-assets/living-icons/game.svg' },
    { key: '안전', label: '안전', icon: '/figma-assets/living-icons/safety.svg' },
    { key: '교육', label: '교육', icon: '/figma-assets/living-icons/edu.svg' },
    { key: '보건', label: '보건·복지', icon: '/figma-assets/living-icons/care.svg' },
    { key: '주거', label: '주거', icon: '/figma-assets/living-icons/home.svg' },
    { key: '환경', label: '환경', icon: '/figma-assets/living-icons/forest.svg' },
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

function FigmaDistrictMap({ selectedDistrict, onDistrictClick, onDeselect, hoveredDistrict, onDistrictHover, onDistrictLeave, hoverCitizen, hoverAvatarUrl }) {
    const selPos = selectedDistrict ? DISTRICTS_POS.find((d) => d.name === selectedDistrict) : null;
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
                {selPos && onDeselect && (
                    <button type="button" className="aic-deselect-chip" aria-label={`${selectedDistrict} 선택 해제`}
                        onClick={onDeselect}
                        style={{
                            position: 'absolute',
                            left: selPos.left + selPos.w / 2 + selPos.lx,
                            top: selPos.top + selPos.h / 2 + selPos.ly + 30,
                            transform: 'translate(-50%, 0)', zIndex: 13,
                        }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#23bdbb" strokeWidth="2.6" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
                    </button>
                )}
                {hoverBubble && hoverCitizen && (
                    <div key={hoveredDistrict} className="aic-hovwrap" style={{ position: 'absolute', left: hoverBubble.cx, top: hoverBubble.cy, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 15 }}>
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

/* ── 좌측 필터 (구역별 카드 + 생활정보 세로 레일 + AI 챗봇) — Figma 302:3872 ── */
function FilterPanel({ region, setRegion, cat, setCat, onChat }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="aic-leftcol">
            {/* 구역별 카드 */}
            <div className="aic-region-card">
                <label className="pubdata-label">구역별</label>
                <div className={`pubdata-select${open ? ' open' : ''}`}>
                    <button type="button" className="pubdata-select-btn" onClick={() => setOpen((v) => !v)}>
                        <span className={region ? undefined : 'aic-select-ph'}>{region || '설정해주세요'}</span>
                        {region && (
                            <i className="aic-select-clear" role="button" aria-label="선택 해제"
                                onClick={(e) => { e.stopPropagation(); setRegion(null); setOpen(false); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
                            </i>
                        )}
                        <i className="pubdata-caret" aria-hidden="true" />
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

            {/* 생활정보 세로 레일 */}
            <nav className="aic-liferail" aria-label="생활정보 카테고리">
                <div className="aic-liferail-head">생활정보</div>
                <ul className="aic-liferail-list">
                    {CATS.map((c) => {
                        const on = cat === c.key;
                        return (
                            <li key={c.key} className="aic-liferail-item">
                                <button type="button"
                                    className={`aic-liferail-btn${on ? ' active' : ''}`}
                                    aria-pressed={on}
                                    onClick={() => setCat(c.key)}>
                                    <img className="aic-liferail-ic" src={c.icon} alt="" aria-hidden="true" />
                                    <span>{c.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* AI 챗봇 */}
            <button type="button" className="aic-chatbot-btn aic-chatbot-btn--rail" onClick={onChat}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                AI 챗봇
            </button>
        </div>
    );
}

/* ── 우측 페르소나 리스트 ── */
function PersonaList({ region, citizens, avatars, sort, setSort, onSelect, selectedId }) {
    const [sortOpen, setSortOpen] = useState(false);
    return (
        <aside className="pubdata-panel aic-list">
            <h2 className="aic-list-title"><span>{region || '부산대표'}</span> AI 가상시민</h2>
            <p className="aic-list-sub">{region || '부산'} 시민 의견과 데이터를 바탕으로 만든 AI 가상시민입니다. 서로 다른 삶과 시선을 통해 우리 동네의 고민과 바람을 한눈에 볼 수 있어요.</p>
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

/* ── 페르소나 풀 상세 리포트 모달 (본문은 공용 PersonaReport, Figma 215:5403) ── */
function DetailReport({ citizen, avatarUrl, onClose, onPrev, onNext, onChat }) {
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
                    <PersonaReport citizen={citizen} avatarUrl={avatarUrl} onNext={onNext} />
                </div>
            </div>
        </div>
    );
}

export default function PCAICitizen({ onNavigate }) {
    const [region, setRegion] = useState(null);   // null = 미선택(부산대표)
    const [cat, setCat] = useState('all');
    const [sort, setSort] = useState('importance');
    const [all, setAll] = useState([]);
    const [avatars, setAvatars] = useState({});
    const [selected, setSelected] = useState(null);   // 리스트의 기본 정보
    const [detail, setDetail] = useState(null);        // 상세(detail 포함)
    const [chatPersona, setChatPersona] = useState(null);
    const [hovered, setHovered] = useState(null);      // 지도 hover 구·군
    const [showMapIntro, setShowMapIntro] = useState(true); // 진입 인트로(여성 페르소나+말풍선, 닫으면 사라짐)

    // 전체 페르소나 로드
    useEffect(() => {
        fetch(`${API_URL}/api/ai-citizens?sort=${sort}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => { if (Array.isArray(rows)) setAll(rows); })
            .catch(() => {});
    }, [sort]);

    // 지역+카테고리 필터 (region null = 부산 전체 = 부산대표)
    const citizens = useMemo(() => {
        let list = region ? all.filter((c) => c.district === region) : [...all];
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
        setShowMapIntro(false);
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
        setShowMapIntro(false);
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
                        onDistrictClick={(name) => { setRegion(name); setShowMapIntro(false); }}
                        onDeselect={() => setRegion(null)}
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

                {showMapIntro && (
                    <div className="aic-intro">
                        <img className="aic-intro-persona" src="/assets/aicitizen/intro_persona.png" alt="" draggable={false} />
                        <div className="aic-intro-bubble">
                            <button type="button" className="aic-intro-close" aria-label="닫기" onClick={() => setShowMapIntro(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
                            </button>
                            <strong className="aic-intro-title">우리 지역을 대표하는 ‘가상 시민’을 만나보세요</strong>
                            <p className="aic-intro-desc">AI 가상시민은 공공데이터와 시민 의견을 분석하여 생성된 가상의 시민 페르소나입니다. 지역의 생활환경과 문제, 요구를 ‘시민의 모습’으로 이해할 수 있습니다.</p>
                            <button type="button" className="aic-intro-cta" onClick={() => setShowMapIntro(false)}>우리 지역 가상 시민 보기</button>
                        </div>
                    </div>
                )}

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
