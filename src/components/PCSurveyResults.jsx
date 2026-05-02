import { useState } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCSurveyResults.css';

const RADAR = [
    { label: '접근성', value: 2.3 },
    { label: '이동성', value: 4.2 },
    { label: '안전성', value: 3.8 },
    { label: '정보제공성', value: 1.7 },
    { label: '포용성', value: 3.8 },
    { label: '심미성', value: 3.5 },
];

const PIE_DATA = [
    { label: '조혼인족', value: 55, color: '#FF7A00' },
    { label: '매우만족', value: 37, color: '#5B2EAB' },
    { label: '보통', value: 6, color: '#8B1F54' },
    { label: '불만족', value: 2, color: '#16B5B0' },
];

const BAR_DATA = [
    { label: '대낮 모행 개선', value: 32, color: '#FF7A00' },
    { label: '쓰레기 문제', value: 27, color: '#E6235A' },
    { label: '길 안내 시스템', value: 18, color: '#5B2EAB' },
    { label: '보행로 확장', value: 14, color: '#16B5B0' },
    { label: '기타', value: 2, color: '#999' },
];

const BUBBLE_DATA = [
    { label: '편의도', size: 88, color: '#16B5B0', x: 24, y: 50 },
    { label: '주거환경', size: 70, color: '#5B2EAB', x: 36, y: 30 },
    { label: '주택가격', size: 60, color: '#FF7A00', x: 48, y: 50 },
    { label: '대중교통', size: 56, color: '#8B1F54', x: 56, y: 30 },
    { label: '문화시설', size: 64, color: '#FF6F2C', x: 64, y: 56 },
    { label: '스트레스', size: 54, color: '#E6235A', x: 72, y: 36 },
    { label: '치안', size: 50, color: '#0E8C88', x: 78, y: 60 },
    { label: '생활', size: 36, color: '#A33', x: 80, y: 24 },
    { label: '여가', size: 32, color: '#222', x: 84, y: 50 },
];

const COL_DATA = [
    { label: '1', value: 480, percent: '4.80%' },
    { label: '2', value: 1610, percent: '16.10%' },
    { label: '3', value: 6483, percent: '64.83%' },
    { label: '4', value: 7600, percent: '76.00%' },
    { label: '5', value: 5610, percent: '56.10%' },
];

function RadarChart() {
    const cx = 130, cy = 130, r = 88;
    const n = RADAR.length;
    const points = RADAR.map((d, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const dist = (d.value / 5) * r;
        return [cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist];
    });
    const polyPts = points.map((p) => p.join(',')).join(' ');

    const ringPath = (frac) => {
        const pts = Array.from({ length: n }, (_, i) => {
            const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            return [cx + Math.cos(angle) * r * frac, cy + Math.sin(angle) * r * frac];
        });
        return pts.map((p) => p.join(',')).join(' ');
    };

    return (
        <svg width="260" height="260" viewBox="0 0 260 260">
            {[0.25, 0.5, 0.75, 1].map((f) => (
                <polygon key={f} points={ringPath(f)} fill="none" stroke="#e3e3e3" strokeWidth="1" />
            ))}
            {RADAR.map((_, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
                return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="#eee" strokeWidth="1"/>;
            })}
            <polygon points={polyPts} fill="rgba(91, 46, 171, 0.30)" stroke="#5B2EAB" strokeWidth="2" />
            {RADAR.map((d, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
                const lx = cx + Math.cos(angle) * (r + 24);
                const ly = cy + Math.sin(angle) * (r + 24);
                return (
                    <g key={d.label}>
                        <text x={lx} y={ly - 6} textAnchor="middle" fontSize="11" fill="#555" fontWeight="600">{d.label}</text>
                        <text x={lx} y={ly + 8} textAnchor="middle" fontSize="11" fill="#1a1a1b" fontWeight="700">{d.value}</text>
                    </g>
                );
            })}
        </svg>
    );
}

function DonutChart() {
    const total = PIE_DATA.reduce((s, d) => s + d.value, 0);
    let acc = 0;
    const r = 50, c = 70;
    const segs = PIE_DATA.map((d) => {
        const frac = d.value / total;
        const start = (acc / total) * 2 * Math.PI - Math.PI / 2;
        acc += d.value;
        const end = (acc / total) * 2 * Math.PI - Math.PI / 2;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = c + Math.cos(start) * r;
        const y1 = c + Math.sin(start) * r;
        const x2 = c + Math.cos(end) * r;
        const y2 = c + Math.sin(end) * r;
        return { d: `M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: d.color };
    });
    return (
        <svg width="140" height="140" viewBox="0 0 140 140">
            {segs.map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
            <circle cx={c} cy={c} r="22" fill="#fff" />
        </svg>
    );
}

export default function PCSurveyResults({ onNavigate, survey }) {
    const data = survey || { title: '사직구장 일대 보행환경 결과는?', period: '2026.03.16 ~ 2026.04.05', responses: 12453 };
    const [open, setOpen] = useState(true);

    const handleCopy = () => {
        try { navigator.clipboard.writeText(window.location.href); } catch (_) {}
    };

    return (
        <UserPCLayout currentView="pcSurveyResults" onNavigate={onNavigate}>
            <div className="pc-survey-results-page">
                <div className="pc-purple-banner pc-banner-tall">
                    <h1 className="pc-banner-title">2026년,<br/>사직구장 일대 보행환경 결과는?</h1>
                    <div className="pc-banner-meta">
                        <span className="pc-banner-pill">{data.period}</span>
                        <span className="pc-banner-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            {data.responses.toLocaleString()}
                        </span>
                        <button className="pc-banner-copy" onClick={handleCopy}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            복사하기
                        </button>
                    </div>
                </div>

                <div className="pc-results-card">
                    <div className="pc-results-block">
                        <h3>종합결과</h3>
                        <div className="pc-radar-wrap"><RadarChart /></div>
                        <button className="pc-toggle-detail" onClick={() => setOpen(!open)}>
                            자세히보기 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: open ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                    </div>

                    <div className="pc-results-block">
                        <h4>Q1. 사직구장 주변 보행로 만족</h4>
                        <div className="pc-pie-row">
                            <DonutChart />
                            <ul className="pc-pie-legend">
                                {PIE_DATA.map((d) => (
                                    <li key={d.label}>
                                        <span className="pc-dot" style={{ background: d.color }}></span>
                                        <strong>{d.value}%</strong> {d.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pc-results-block">
                        <h4>Q1. 사직구장 주변 차량과 보행자도로의 분리</h4>
                        <div className="pc-pie-row">
                            <DonutChart />
                            <ul className="pc-pie-legend">
                                {PIE_DATA.map((d) => (
                                    <li key={d.label}>
                                        <span className="pc-dot" style={{ background: d.color }}></span>
                                        <strong>{d.value}%</strong> {d.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pc-results-block">
                        <h4>Q1. 가장 개선이 필요한 항목</h4>
                        <div className="pc-bar-list">
                            {BAR_DATA.map((d) => (
                                <div key={d.label} className="pc-bar-row">
                                    <span className="pc-bar-label">{d.label}</span>
                                    <div className="pc-bar-track">
                                        <div className="pc-bar-fill" style={{ width: `${d.value}%`, background: d.color }}>
                                            <span>{d.value}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pc-results-block">
                        <h4>Q1. 가장 개선이 필요한 항목</h4>
                        <div className="pc-bubble-wrap">
                            {BUBBLE_DATA.map((b, i) => (
                                <div
                                    key={i}
                                    className="pc-bubble"
                                    style={{ width: b.size, height: b.size, background: b.color, left: `${b.x}%`, top: `${b.y}%` }}
                                >
                                    {b.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pc-results-block">
                        <h4>Q1. 가장 개선이 필요한 항목</h4>
                        <div className="pc-col-chart">
                            {COL_DATA.map((d) => {
                                const max = 7700;
                                const h = (d.value / max) * 160;
                                return (
                                    <div key={d.label} className="pc-col-row">
                                        <span className="pc-col-percent">{d.percent}</span>
                                        <div className="pc-col-bar" style={{ height: h }} />
                                        <span className="pc-col-label">{d.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </UserPCLayout>
    );
}
