import { useEffect, useState } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MSurveyResults.css';
import { API_URL } from '../utils/api';

const BUBBLE_COLORS = ['#1A8870', '#0E5B82', '#A1559E', '#9D7EE4', '#5B2EAB'];
const DONUT_COLORS = ['#F4B400', '#5B2EAB', '#9D7EE4', '#3D1B7A', '#E6235A', '#16B5B0'];

function RadarHexagon({ data }) {
    const cx = 140;
    const cy = 140;
    const r = 86;
    const max = 5;
    const angles = data.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / data.length);

    const ringPoints = (ratio) =>
        angles.map((a) => `${cx + r * ratio * Math.cos(a)},${cy + r * ratio * Math.sin(a)}`).join(' ');

    const valuePoints = data
        .map((d, i) => {
            const a = angles[i];
            const k = d.value / max;
            return `${cx + r * k * Math.cos(a)},${cy + r * k * Math.sin(a)}`;
        })
        .join(' ');

    return (
        <svg viewBox="0 0 280 280" className="m-radar-svg">
            {[0.25, 0.5, 0.75, 1].map((rt) => (
                <polygon key={rt} points={ringPoints(rt)} fill="none" stroke="#e0e0e0" strokeWidth="1" />
            ))}
            {angles.map((a, i) => (
                <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#e0e0e0" strokeWidth="1" />
            ))}
            <polygon points={valuePoints} fill="rgba(91, 46, 171, 0.18)" stroke="#5B2EAB" strokeWidth="2" />
            {data.map((d, i) => {
                const a = angles[i];
                const lx = cx + (r + 22) * Math.cos(a);
                const ly = cy + (r + 22) * Math.sin(a);
                return (
                    <g key={d.key}>
                        <text x={lx} y={ly - 2} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a1a1b">{d.label}</text>
                        <text x={lx} y={ly + 12} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1a1a1b">{d.value.toFixed(1)}</text>
                    </g>
                );
            })}
        </svg>
    );
}

function Donut({ slices, size = 130 }) {
    const r = size / 2 - 14;
    const cx = size / 2;
    const cy = size / 2;
    const C = 2 * Math.PI * r;
    let offset = 0;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="m-donut">
            {slices.map((s, i) => {
                const len = (s.pct / 100) * C;
                const dasharray = `${len} ${C - len}`;
                const dashoffset = -offset;
                offset += len;
                return (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="18"
                        strokeDasharray={dasharray}
                        strokeDashoffset={dashoffset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                    />
                );
            })}
        </svg>
    );
}

export default function MSurveyResults({ onNavigate, survey }) {
    const data = {
        title: survey?.title || '2026년, 사직구장 일대 보행환경 결과는?',
        period: survey?.period || '2026.03.16 ~ 2026.04.05',
        respondents: survey?.respondents ?? survey?.response_count ?? 12453,
    };
    const [resultsData, setResultsData] = useState(null);

    useEffect(() => {
        const id = survey?.id;
        if (!id) return;
        fetch(`${API_URL}/api/surveys/${id}/results`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d) setResultsData(d); })
            .catch(() => {});
    }, [survey?.id]);

    const respondentCount = resultsData?.response_count ?? data.respondents;

    const compositeData = (() => {
        const qs = (resultsData?.questions || []).filter(q => q.distribution?.length > 0).slice(0, 6);
        if (!qs.length) return [];
        const LABELS = ['접근성', '이동성', '안전성', '정보제공성', '포용성', '심미성'];
        return qs.map((q, idx) => {
            const total = q.distribution.reduce((s, d) => s + (d.count || 0), 0) || 1;
            const weighted = q.distribution.reduce((s, d, i) => s + (d.count || 0) * (q.distribution.length - i), 0);
            return { key: `q${idx}`, label: LABELS[idx] || `Q${idx + 1}`, value: parseFloat((weighted / total / q.distribution.length * 5).toFixed(1)) };
        });
    })();

    const donutSections = (() => {
        const singleQs = (resultsData?.questions || []).filter(q => q.qtype === 'single' || q.qtype === 'agree');
        return singleQs.map((q) => {
            const qIdx = resultsData.questions.indexOf(q);
            return {
                title: `Q${qIdx + 1}. ${q.text}`,
                slices: q.distribution.map((d, i) => ({
                    label: d.label,
                    pct: d.pct ?? Math.round((d.count / (q.total || 1)) * 100),
                    color: DONUT_COLORS[i % DONUT_COLORS.length],
                })).filter(s => s.pct > 0),
            };
        });
    })();

    const multiQ = (resultsData?.questions || []).find(q => q.qtype === 'multi');
    const multiQIdx = multiQ ? resultsData.questions.indexOf(multiQ) : -1;
    const multiQTitle = multiQ ? `Q${multiQIdx + 1}. ${multiQ.text}` : null;

    const derivedBars = (() => {
        if (!multiQ?.distribution?.length) return [];
        const total = multiQ.total || multiQ.distribution.reduce((s, d) => s + (d.count || 0), 0) || 1;
        return multiQ.distribution
            .map(d => ({ label: d.label, pct: Math.round((d.count / total) * 100) }))
            .filter(d => d.pct > 0)
            .sort((a, b) => b.pct - a.pct);
    })();

    const derivedBubbles = derivedBars.slice(0, 5).map((b, i) => ({
        label: b.label,
        pct: b.pct,
        size: Math.max(32, Math.round(b.pct * 3.5)),
        color: BUBBLE_COLORS[i] || '#5B2EAB',
    }));

    const columnData = (() => {
        const singleQ = (resultsData?.questions || []).find(q => q.qtype === 'single');
        if (!singleQ?.distribution?.length) return [];
        return singleQ.distribution.map(d => ({ label: d.label, value: d.count || 0 }));
    })();
    const columnTitle = (() => {
        const singleQ = (resultsData?.questions || []).find(q => q.qtype === 'single');
        if (!singleQ) return null;
        const idx = resultsData.questions.indexOf(singleQ);
        return `Q${idx + 1}. ${singleQ.text}`;
    })();

    return (
        <div className="m-survey-results-page">
            <div className="m-results-hero">
                <button className="m-hero-back" onClick={() => onNavigate && onNavigate('mSurveyList')} aria-label="뒤로">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="m-results-title">{data.title}</h1>
                <div className="m-results-meta">
                    <span className="m-results-period">{data.period}</span>
                    <span className="m-results-count">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                        {respondentCount.toLocaleString()}
                    </span>
                </div>
            </div>

            {compositeData.length > 0 && (
                <section className="m-results-section">
                    <h3 className="m-results-section-title">종합결과</h3>
                    <div className="m-radar-wrap">
                        <RadarHexagon data={compositeData} />
                    </div>
                    <button className="m-results-detail-link" type="button">자세히보기 ▸</button>
                </section>
            )}

            {donutSections.map((d, i) => (
                <section key={i} className="m-results-section">
                    <h3 className="m-q-result-title">{d.title}</h3>
                    <div className="m-donut-row">
                        <Donut slices={d.slices} />
                        <ul className="m-legend">
                            {d.slices.map((s) => (
                                <li key={s.label}>
                                    <span className="m-legend-dot" style={{ background: s.color }} />
                                    <span className="m-legend-pct">{s.pct}%</span>
                                    <span className="m-legend-label">{s.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            ))}

            {derivedBars.length > 0 && (
                <section className="m-results-section">
                    <h3 className="m-q-result-title">{multiQTitle}</h3>
                    {derivedBars.map((b) => (
                        <div key={b.label} className="m-bar-row">
                            <span className="m-bar-label">{b.label}</span>
                            <div className="m-bar-track">
                                <div className="m-bar-fill" style={{ width: `${b.pct}%` }} />
                            </div>
                            <span className="m-bar-pct">{b.pct}%</span>
                        </div>
                    ))}
                </section>
            )}

            {derivedBubbles.length > 0 && (
                <section className="m-results-section">
                    <h3 className="m-q-result-title">키워드 분포</h3>
                    <div className="m-bubbles">
                        {derivedBubbles.map((b) => (
                            <div
                                key={b.label}
                                className="m-bubble"
                                style={{ width: b.size, height: b.size, background: b.color }}
                            >
                                <div className="m-bubble-label">{b.label}</div>
                                <div className="m-bubble-pct">{b.pct}%</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {columnData.length > 0 && (
                <section className="m-results-section">
                    <h3 className="m-q-result-title">{columnTitle}</h3>
                    <div className="m-cols">
                        {(() => {
                            const max = Math.max(...columnData.map((x) => x.value), 1);
                            return columnData.map((c, i) => (
                                <div key={i} className="m-col">
                                    <span className="m-col-val">{c.value.toLocaleString()}</span>
                                    <div className="m-col-bar" style={{ height: `${(c.value / max) * 100}%` }} />
                                    <span className="m-col-label">{c.label}</span>
                                </div>
                            ));
                        })()}
                    </div>
                </section>
            )}

            {!resultsData && (
                <section className="m-results-section" style={{ textAlign: 'center', color: '#aaa', padding: '40px 0' }}>
                    결과를 불러오는 중...
                </section>
            )}

            <MobileBottomNav currentView="mSurveyResults" onNavigate={onNavigate} />
        </div>
    );
}
