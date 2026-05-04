import MobileBottomNav from './MobileBottomNav';
import './MSurveyResults.css';

const COMPOSITE = [
    { key: 'info',     label: '정보제공성', value: 1.7 },
    { key: 'safety',   label: '안전성',   value: 3.8 },
    { key: 'inclusion',label: '포용성',   value: 3.8 },
    { key: 'mobility', label: '이동성',   value: 4.2 },
    { key: 'aesthetic',label: '심미성',   value: 3.5 },
    { key: 'access',   label: '접근성',   value: 2.3 },
];

const DONUTS = [
    {
        title: 'Q1. 사직구장 주변 보행로 안전',
        slices: [
            { label: '매우만족', pct: 55, color: '#F4B400' },
            { label: '조금만족', pct: 37, color: '#5B2EAB' },
            { label: '보통',    pct: 6,  color: '#9D7EE4' },
            { label: '불만족',   pct: 2,  color: '#3D1B7A' },
        ],
    },
    {
        title: 'Q1. 사직구장 주변 차량과 보행자도로의 분리',
        slices: [
            { label: '매우만족', pct: 55, color: '#F4B400' },
            { label: '조금만족', pct: 37, color: '#5B2EAB' },
            { label: '보통',    pct: 6,  color: '#9D7EE4' },
            { label: '불만족',   pct: 2,  color: '#3D1B7A' },
        ],
    },
];

const BARS = [
    { label: '야간 조명 개선',     pct: 32 },
    { label: '브레이크 문제',     pct: 27 },
    { label: '길 안내 시스템',     pct: 18 },
    { label: '보행로 확장',       pct: 14 },
    { label: '기타',           pct: 2 },
];

const BUBBLES = [
    { label: '야간 조명', pct: 32, size: 110, color: '#1A8870' },
    { label: '브레이크 문제', pct: 27, size: 96, color: '#0E5B82' },
    { label: '안내', pct: 18, size: 70, color: '#A1559E' },
    { label: '확장', pct: 14, size: 60, color: '#9D7EE4' },
    { label: '기타', pct: 2, size: 32, color: '#5B2EAB' },
];

const COLUMNS = [
    { label: '1', value: 4854 },
    { label: '2', value: 76235 },
    { label: '3', value: 7621 },
    { label: '4', value: 78235 },
    { label: '5', value: 78235 },
];

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
        respondents: survey?.respondents ?? 12453,
    };

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
                        {data.respondents.toLocaleString()}
                    </span>
                </div>
            </div>

            <section className="m-results-section">
                <h3 className="m-results-section-title">종합결과</h3>
                <div className="m-radar-wrap">
                    <RadarHexagon data={COMPOSITE} />
                </div>
                <button className="m-results-detail-link" type="button">자세히보기 ▸</button>
            </section>

            {DONUTS.map((d, i) => (
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

            <section className="m-results-section">
                <h3 className="m-q-result-title">Q1. 가장 개선이 필요한 항목</h3>
                {BARS.map((b) => (
                    <div key={b.label} className="m-bar-row">
                        <span className="m-bar-label">{b.label}</span>
                        <div className="m-bar-track">
                            <div className="m-bar-fill" style={{ width: `${b.pct}%` }} />
                        </div>
                        <span className="m-bar-pct">{b.pct}%</span>
                    </div>
                ))}
            </section>

            <section className="m-results-section">
                <h3 className="m-q-result-title">Q1. 가장 개선이 필요한 항목</h3>
                <div className="m-bubbles">
                    {BUBBLES.map((b) => (
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

            <section className="m-results-section">
                <h3 className="m-q-result-title">Q1. 가장 개선이 필요한 항목</h3>
                <div className="m-cols">
                    {COLUMNS.map((c, i) => {
                        const max = Math.max(...COLUMNS.map((x) => x.value));
                        const h = (c.value / max) * 100;
                        return (
                            <div key={i} className="m-col">
                                <span className="m-col-val">{c.value.toLocaleString()}</span>
                                <div className="m-col-bar" style={{ height: `${h}%` }} />
                                <span className="m-col-label">{c.label}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            <MobileBottomNav currentView="mSurveyResults" onNavigate={onNavigate} />
        </div>
    );
}
