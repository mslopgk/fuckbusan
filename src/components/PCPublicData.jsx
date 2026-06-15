import { useEffect, useMemo, useRef, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Treemap,
} from 'recharts';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import PCMapToolbar from './PCMapToolbar';
import { API_URL } from '../utils/api';
import './PCMap3.css';
import './PCPublicData.css';
import {
    DONGS, LIFE_CATEGORIES, DATA_SOURCES, PINS, getDetail, POP_PYRAMID,
} from './publicData.mock';

/* PC 공공데이터 대시보드 — Figma 215:4425 (USER:공공데이터) 디자인 의도 기반 변형.
   지도 위 플로팅 패널: 좌(필터) / 중앙(개별 데이터셋 상세) / 우(인구·통계) / 우하단(부산 비교).
   인구추이·통계리스트·공공데이터 건수·구·군 비교 = 백엔드 실데이터(/api/public-data/overview).
   인구 피라미드·지도 핀·상세카드는 예시(구 단위 좌표/연령데이터 미수집). */

const ACCENT = '#23bdbb';
const catColor = (key) => (LIFE_CATEGORIES.find((c) => c.key === key)?.color) || ACCENT;
const themeColor = (label) => (LIFE_CATEGORIES.find((c) => c.label === label)?.color) || '#888';
// 비교 지표 (실데이터 구·군 전수 확보분)
const COMPARE_METRICS = [
    { key: 'population', label: '인구', unit: '명', fmt: (v) => v.toLocaleString() },
    { key: 'accidents', label: '교통사고', unit: '건', fmt: (v) => v.toLocaleString() },
    { key: 'libraries', label: '도서관', unit: '개', fmt: (v) => v + '개' },
];
const TILE_COLORS = ['#1f9e8f', '#37b3a1', '#54c2b0', '#73cfc0', '#93dccf', '#aee4da', '#c7ece5', '#ddf3ef'];

/* ── 좌측 필터 패널 ── */
function FilterPanel({ dong, setDong, activeCat, setActiveCat, sources, toggleSource, layerCounts }) {
    const [open, setOpen] = useState(false);
    return (
        <aside className="pubdata-panel pubdata-left">
            <div className="pubdata-field">
                <label className="pubdata-label">구역별</label>
                <div className={`pubdata-select${open ? ' open' : ''}`}>
                    <button type="button" className="pubdata-select-btn" onClick={() => setOpen((v) => !v)}>
                        <span>{dong}</span>
                        <i className="pubdata-caret" aria-hidden="true" />
                    </button>
                    {open && (
                        <ul className="pubdata-select-menu" role="listbox">
                            {DONGS.map((d) => (
                                <li key={d}>
                                    <button
                                        type="button"
                                        className={`pubdata-select-opt${d === dong ? ' sel' : ''}`}
                                        onClick={() => { setDong(d); setOpen(false); }}
                                    >{d}</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="pubdata-section-head">생활정보</div>
            <div className="pubdata-catgrid">
                {LIFE_CATEGORIES.map((c) => {
                    const on = activeCat === c.key;
                    return (
                        <button
                            key={c.key}
                            type="button"
                            className={`pubdata-cat${on ? ' active' : ''}`}
                            style={on ? { background: c.color, borderColor: c.color } : undefined}
                            onClick={() => setActiveCat(c.key)}
                        >
                            <img className="pubdata-cat-ic" src={c.icon} alt="" aria-hidden="true" />
                            <span>{c.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="pubdata-section-head">공공데이터 리스트</div>
            <div className="pubdata-srcgrid">
                {DATA_SOURCES.map((s) => {
                    const cnt = layerCounts && (s.key in layerCounts) ? layerCounts[s.key] : s.count;
                    return (
                    <button
                        key={s.key}
                        type="button"
                        className={`pubdata-src${sources.has(s.key) ? ' on' : ''}`}
                        onClick={() => toggleSource(s.key)}
                    >
                        <span className="pubdata-src-ic" style={{ background: s.color }}>
                            {s.icon ? <img src={s.icon} alt="" /> : null}
                        </span>
                        <span className="pubdata-src-name">{s.label}</span>
                        <span className="pubdata-src-count">{cnt == null ? '–' : cnt.toLocaleString()}</span>
                    </button>
                    );
                })}
            </div>
        </aside>
    );
}

/* ── 중앙: 개별 데이터셋 상세 카드 ── */
function DetailCard({ pin, onClose }) {
    const d = getDetail(pin);
    if (!d) return null;
    return (
        <div className="pubdata-panel pubdata-detail">
            <div className="pubdata-detail-head">
                <span className="pubdata-detail-tag" style={{ color: catColor(pin.category) }}>개별 데이터셋</span>
                <button type="button" className="pubdata-x" onClick={onClose} aria-label="닫기">×</button>
            </div>
            <h3 className="pubdata-detail-title">{d.title}</h3>
            <div className="pubdata-detail-photo">
                {d.image ? <img src={d.image} alt="" /> : <span>업장 사진</span>}
            </div>
            <dl className="pubdata-detail-fields">
                {d.fields.map((f) => (
                    <div key={f.label} className="pubdata-detail-row">
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

/* ── 우측 상단: 인구와 테마 집계 ── */
function PopulationPanel({ trend }) {
    const pyramid = useMemo(
        () => POP_PYRAMID.map((r) => ({ age: r.age, 남성: -r.male, 여성: r.female })),
        [],
    );
    // 실데이터(명) → 만 명 단위
    const trendData = useMemo(
        () => (trend || []).map((t) => ({ year: `'${String(t.year).slice(2)}`, pop: Math.round(t.value / 10000 * 10) / 10 })),
        [trend],
    );
    return (
        <div className="pubdata-panel pubdata-pop">
            <div className="pubdata-card-head">인구와 테마 집계</div>

            <div className="pubdata-chart-sub">
                <span>연령대별 인구 <span className="pubdata-tag-eg">예시</span></span>
                <span className="pubdata-legend">
                    <span><i style={{ background: '#3b82f6' }} />남</span>
                    <span><i style={{ background: '#ec4899' }} />여</span>
                </span>
            </div>
            <div className="pubdata-chart" style={{ height: 178 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={pyramid} stackOffset="sign" barCategoryGap={2}
                        margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                        <XAxis type="number" tickFormatter={(v) => Math.abs(v).toLocaleString()} tick={{ fontSize: 10, fill: '#999' }} />
                        <YAxis type="category" dataKey="age" tick={{ fontSize: 10, fill: '#666' }} width={36} />
                        <Tooltip formatter={(v) => Math.abs(v).toLocaleString() + '명'} cursor={{ fill: 'rgba(35,189,187,0.06)' }} />
                        <Bar dataKey="남성" fill="#3b82f6" stackId="s" radius={[2, 0, 0, 2]} />
                        <Bar dataKey="여성" fill="#ec4899" stackId="s" radius={[0, 2, 2, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="pubdata-chart-sub">부산 인구 추이 (만 명)</div>
            <div className="pubdata-chart" style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#999' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#999' }} domain={['dataMin - 3', 'dataMax + 3']} tickFormatter={(v) => Math.round(v)} />
                        <Tooltip formatter={(v) => v + '만 명'} cursor={{ fill: 'rgba(35,189,187,0.06)' }} />
                        <Bar dataKey="pop" fill={ACCENT} radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

/* ── 우측 중단: 통계 리스트 (실데이터) ── */
function StatList({ stats }) {
    return (
        <div className="pubdata-panel pubdata-stats">
            <div className="pubdata-card-head">통계 리스트</div>
            <table className="pubdata-table">
                <thead>
                    <tr><th>테마</th><th>지표</th><th>값</th><th>기준</th></tr>
                </thead>
                <tbody>
                    {(stats || []).map((s) => (
                        <tr key={s.theme} title={s.source || ''}>
                            <td><span className="pubdata-chip" style={{ background: themeColor(s.theme) }}>{s.theme}</span></td>
                            <td className="pubdata-metric">{s.metric}{s.note ? <em className="pubdata-metric-note">{s.note}</em> : null}</td>
                            <td className="pubdata-value">{s.value_text}</td>
                            <td className="pubdata-basis">{s.region}<br /><span>{s.year}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* 트리맵 타일 (recharts custom content) — 16개 구·군, 값 비례(크기순), 부산진구 강조 */
function TreemapTile(props) {
    const { x, y, width, height, name, vlabel, color, isTarget } = props;
    if (width <= 1 || height <= 1) return null;
    const showName = width > 40 && height > 26;
    const showVal = width > 52 && height > 42;
    return (
        <g>
            <rect x={x + 2} y={y + 2} width={width - 4} height={height - 4} rx={8}
                fill={color || '#54c2b0'} stroke={isTarget ? '#0f6b61' : 'none'} strokeWidth={isTarget ? 2.5 : 0} />
            {showName && <text x={x + 9} y={y + 18} fill="#fff" fontSize={11.5} fontWeight={isTarget ? 800 : 700}>{name}</text>}
            {showVal && <text x={x + 9} y={y + 35} fill="#fff" fillOpacity={0.95} fontSize={12} fontWeight={700}>{vlabel}</text>}
        </g>
    );
}

/* ── 우하단: 부산 16개 구·군 비교 (실데이터 트리맵 + 순위 슬라이더) ── */
function ComparePanel({ districts, target = '부산진구' }) {
    const [metricKey, setMetricKey] = useState('population');
    const metric = COMPARE_METRICS.find((m) => m.key === metricKey);

    const { blocks, rank, targetVal } = useMemo(() => {
        const rows = (districts || []).filter((d) => d[metricKey] != null);
        const sorted = [...rows].sort((a, b) => b[metricKey] - a[metricKey]); // 값 큰 순
        const rankIdx = sorted.findIndex((d) => d.region === target) + 1;
        const tVal = sorted.find((d) => d.region === target)?.[metricKey];
        const blk = sorted.map((d, i) => ({
            name: d.region,
            size: d[metricKey],
            vlabel: metric.fmt(d[metricKey]),
            isTarget: d.region === target,
            color: d.region === target ? '#0f9b8c' : TILE_COLORS[Math.min(i, TILE_COLORS.length - 1)],
        }));
        return { blocks: blk, rank: rankIdx || '-', targetVal: tVal };
    }, [districts, metricKey, metric, target]);

    const total = districts?.length || 16;

    return (
        <div className="pubdata-panel pubdata-compare">
            <div className="pubdata-compare-head">
                <span className="pubdata-compare-title"><i className="pubdata-pin-dot" />{target}</span>
                <button type="button" className="pubdata-download">다운로드</button>
            </div>
            <div className="pubdata-tabs">
                {COMPARE_METRICS.map((m) => (
                    <button key={m.key} type="button"
                        className={`pubdata-tab${metricKey === m.key ? ' active' : ''}`}
                        onClick={() => setMetricKey(m.key)}>{m.label}</button>
                ))}
            </div>
            <div className="pubdata-treemap">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap data={blocks} dataKey="size" nameKey="name" stroke="#fff"
                        isAnimationActive={false} content={<TreemapTile />}>
                        <Tooltip formatter={(v) => metric.fmt(v)} />
                    </Treemap>
                </ResponsiveContainer>
            </div>
            <div className="pubdata-slider-wrap">
                <div className="pubdata-slider-top">
                    <span>{total}개 구·군 중</span>
                    <strong>{rank}번째</strong>
                    {targetVal != null && <span className="pubdata-slider-val">({metric.fmt(targetVal)})</span>}
                </div>
                <input type="range" min="1" max={total} value={typeof rank === 'number' ? rank : 1} readOnly
                    className="pubdata-slider"
                    style={{ '--pct': `${(((typeof rank === 'number' ? rank : 1) - 1) / (total - 1)) * 100}%` }} />
                <div className="pubdata-slider-scale"><span>1위</span><span>{total}위</span></div>
            </div>
            <div className="pubdata-compare-foot">부산 {total}개 구·군 · {metric.label} 기준 (실데이터)</div>
        </div>
    );
}

export default function PCPublicData({ onNavigate }) {
    const mapRef = useRef(null);
    const [dong, setDong] = useState('부전2동');
    const [activeCat, setActiveCat] = useState('all');
    const [sources, setSources] = useState(new Set(['cctv']));
    const [selectedPin, setSelectedPin] = useState(null);
    const [region, setRegion] = useState('부산진구');   // 지도에서 클릭한 구·군
    const [pd, setPd] = useState(null);                  // /api/public-data/overview
    const [leftOpen, setLeftOpen] = useState(true);      // 좌측 필터 패널(목록) 토글

    // 실데이터 로드 (실패 시 패널은 빈 상태로 graceful)
    useEffect(() => {
        let alive = true;
        fetch(`${API_URL}/api/public-data/overview`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (alive && d) setPd(d); })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    const layerCounts = useMemo(() => {
        const m = {};
        (pd?.layers || []).forEach((l) => { m[l.key] = l.count; });
        return m;
    }, [pd]);

    const toggleSource = (key) => setSources((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    });

    const pins = useMemo(() => {
        const list = activeCat === 'all' ? PINS : PINS.filter((p) => p.category === activeCat);
        return list.map((p) => ({ ...p, color: catColor(p.category) }));
    }, [activeCat]);

    // 지도에서 구·군 클릭 → 해당 구로 이동(포커스 + 비교 대상 변경)
    const handleRegionClick = (name) => {
        setRegion(name);
        setSelectedPin(null);
    };

    return (
        <UserPCLayout currentView="pcPublicData" onNavigate={onNavigate}>
            <div className="pubdata">
                <div className="pubdata-map">
                    <PCMapCanvas
                        ref={mapRef}
                        pins={pins}
                        accentColor={ACCENT}
                        selectedPoint={selectedPin ? { lat: selectedPin.lat, lng: selectedPin.lng } : null}
                        onPinClick={(pin) => setSelectedPin(PINS.find((p) => p.id === pin.id) || pin)}
                        onMapClick={() => setSelectedPin(null)}
                        onRegionClick={handleRegionClick}
                        selectedDistrict={region}
                    />
                </div>

                {/* 지도 툴바 — 제보·제안·진단 공용 PCMapToolbar 재사용 */}
                <PCMapToolbar
                    mapRef={mapRef}
                    onToggleSidebar={() => setLeftOpen((v) => !v)}
                    sidebarOpen={leftOpen}
                />

                {leftOpen && (
                    <FilterPanel
                        dong={dong} setDong={setDong}
                        activeCat={activeCat} setActiveCat={setActiveCat}
                        sources={sources} toggleSource={toggleSource}
                        layerCounts={layerCounts}
                    />
                )}

                {selectedPin && <DetailCard pin={selectedPin} onClose={() => setSelectedPin(null)} />}

                <div className="pubdata-rightcol">
                    <div className="pubdata-right-scroll">
                        <PopulationPanel trend={pd?.pop_trend} />
                        <StatList stats={pd?.theme_stats} />
                    </div>
                    <ComparePanel districts={pd?.districts} target={region} />
                </div>
            </div>
        </UserPCLayout>
    );
}
