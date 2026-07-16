import { useState, useEffect } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    Cell,
    LabelList,
    ResponsiveContainer,
} from 'recharts';
import UserPCLayout from './UserPCLayout';
import './PCSurveyResults.css';
import { API_URL } from '../utils/api';
import { copyToClipboard } from '../utils/clipboard';


const BAR_COLORS = ['#fb9b00', '#680A25', '#0b9583', '#542AA3', '#777'];
const PIE_COLORS = ['#fb9b00', '#5B2EAB', '#680A25', '#0b9583', '#E6235A'];

function RadarChart({ data }) {
    const cx = 130, cy = 130, r = 88;
    const n = data.length;
    if (!n) return null;
    const points = data.map((d, i) => {
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
            {data.map((_, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
                return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="#eee" strokeWidth="1" />;
            })}
            <polygon points={polyPts} fill="rgba(91, 46, 171, 0.25)" stroke="#5B2EAB" strokeWidth="2" />
            {data.map((d, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
                const lx = cx + Math.cos(angle) * (r + 26);
                const ly = cy + Math.sin(angle) * (r + 26);
                return (
                    <g key={d.label}>
                        <text x={lx} y={ly - 5} textAnchor="middle" fontSize="12" fill="#808080" fontFamily="inherit">{d.label}</text>
                        <text x={lx} y={ly + 12} textAnchor="middle" fontSize="14" fill="#111" fontWeight="700" fontFamily="inherit">{d.value}</text>
                    </g>
                );
            })}
        </svg>
    );
}

function DonutChart({ data: chartData }) {
    const pieItems = chartData || PIE_DATA;
    const total = pieItems.reduce((s, d) => s + d.value, 0);
    const cx = 110, cy = 110;
    const outerR = 90, innerR = 55;
    let acc = 0;

    const segs = pieItems.map((d) => {
        const startAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
        acc += d.value;
        const endAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

        const ox1 = cx + Math.cos(startAngle) * outerR;
        const oy1 = cy + Math.sin(startAngle) * outerR;
        const ox2 = cx + Math.cos(endAngle) * outerR;
        const oy2 = cy + Math.sin(endAngle) * outerR;
        const ix1 = cx + Math.cos(endAngle) * innerR;
        const iy1 = cy + Math.sin(endAngle) * innerR;
        const ix2 = cx + Math.cos(startAngle) * innerR;
        const iy2 = cy + Math.sin(startAngle) * innerR;

        const path = `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
        return { path, color: d.color };
    });

    return (
        <svg width="220" height="220" viewBox="0 0 220 220">
            {segs.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        </svg>
    );
}

export default function PCSurveyResults({ onNavigate, survey }) {
    const data = {
        title: survey?.title || '—',
        period: survey?.period || '',
        responses: survey?.response_count ?? 0,
    };
    const [open, setOpen] = useState(true);
    const [resultsData, setResultsData] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const id = survey?.id;
        if (!id) return;
        fetch(`${API_URL}/api/surveys/${id}/results`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d) setResultsData(d); })
            .catch(() => {});
    }, [survey?.id]);

    const responseCount = resultsData?.response_count ?? data.responses;

    const radarData = (() => {
        const qs = (resultsData?.questions || []).filter(q => q.distribution?.length > 0).slice(0, 6);
        if (qs.length < 3) return [];
        const LABELS = ['접근성', '이동성', '안전성', '정보제공성', '포용성', '심미성'];
        return qs.map((q, idx) => {
            const total = q.distribution.reduce((s, d) => s + (d.count || 0), 0) || 1;
            const weighted = q.distribution.reduce((s, d, i) => s + (d.count || 0) * (q.distribution.length - i), 0);
            return { label: LABELS[idx] || `Q${idx + 1}`, value: parseFloat((weighted / total / q.distribution.length * 5).toFixed(1)) };
        });
    })();

    const singleQuestions = (resultsData?.questions || []).filter(q => q.qtype === 'single' || q.qtype === 'agree');

    const pieSections = singleQuestions.map((q) => {
        const qIdx = resultsData.questions.indexOf(q);
        return {
            title: `Q${qIdx + 1}. ${q.text}`,
            data: q.distribution.map((d, i) => ({
                label: d.label,
                value: d.pct ?? Math.round((d.count / (q.total || 1)) * 100),
                color: PIE_COLORS[i % PIE_COLORS.length],
            })).filter(d => d.value > 0),
        };
    }).filter(section => section.data.length > 0);

    const derivedBarData = (() => {
        const multiQ = (resultsData?.questions || []).find(q => q.qtype === 'multi');
        if (!multiQ?.distribution?.length) return [];
        const total = multiQ.total || multiQ.distribution.reduce((s, d) => s + (d.count || 0), 0) || 1;
        return multiQ.distribution.map((d, i) => ({
            label: d.label,
            value: Math.round((d.count / total) * 100),
            color: BAR_COLORS[i % BAR_COLORS.length],
        })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    })();

    const multiQ = (resultsData?.questions || []).find(q => q.qtype === 'multi');
    const multiQIdx = multiQ ? resultsData.questions.indexOf(multiQ) : -1;
    const multiQTitle = multiQ ? `Q${multiQIdx + 1}. ${multiQ.text}` : null;

    // 가장 개선 필요 항목 — 버블(워드클라우드형) 차트
    // 다중선택 응답 분포(derivedBarData)를 값 크기 = 버블 크기로 매핑.
    const bubbleData = (() => {
        if (!derivedBarData.length) return [];
        // 흩뿌리기 좌표: 값이 큰 항목을 중앙에, 작은 항목을 외곽에 배치
        const SLOTS = [
            { x: 50, y: 52 },
            { x: 26, y: 64 },
            { x: 74, y: 62 },
            { x: 34, y: 32 },
            { x: 68, y: 30 },
            { x: 50, y: 78 },
            { x: 14, y: 40 },
            { x: 86, y: 44 },
        ];
        return derivedBarData.map((d, i) => ({
            x: SLOTS[i % SLOTS.length].x,
            y: SLOTS[i % SLOTS.length].y,
            z: d.value,
            label: d.label,
            color: d.color,
        }));
    })();
    const bubbleMax = Math.max(...bubbleData.map(d => d.z), 1);

    const colData = (() => {
        const singleQ = (resultsData?.questions || []).find(q => q.qtype === 'single');
        if (!singleQ?.distribution?.length) return [];
        const total = singleQ.distribution.reduce((s, d) => s + (d.count || 0), 0) || 1;
        return singleQ.distribution.map(d => ({
            label: d.label,
            value: d.count || 0,
            caption: `${d.count || 0}(${Math.round((d.count || 0) / total * 100)}%)`,
        }));
    })();
    const colMax = Math.max(...colData.map(d => d.value), 1);

    const handleCopy = async () => {
        const lines = [`${data.title} - 설문 결과`];
        if (data.period) lines.push(`조사기간: ${data.period}`);
        lines.push(`총 응답자: ${responseCount.toLocaleString()}명`);
        if (radarData.length > 0) {
            lines.push('');
            lines.push('■ 종합결과');
            radarData.forEach(d => lines.push(`  ${d.label}: ${d.value}점`));
        }
        pieSections.forEach(s => {
            if (!s.data.length) return;
            lines.push('');
            lines.push(`■ ${s.title}`);
            s.data.forEach(d => lines.push(`  ${d.label}: ${d.value}%`));
        });
        if (derivedBarData.length > 0) {
            lines.push('');
            lines.push(`■ ${multiQTitle}`);
            derivedBarData.forEach(d => lines.push(`  ${d.label}: ${d.value}%`));
        }
        if (colData.length > 0) {
            lines.push('');
            lines.push('■ 응답 분포');
            colData.forEach(d => lines.push(`  ${d.label}: ${d.value}건`));
        }
        const text = lines.join('\n');
        await copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <UserPCLayout currentView="pcSurveyResults" onNavigate={onNavigate}>
            <div className="pc-survey-results-page">
                <div className="pc-purple-banner pc-banner-tall">
                    <h1 className="pc-banner-title">{data.title}</h1>
                    <div className="pc-banner-meta">
                        <div className="pc-banner-info-pill">
                            <span className="pc-banner-date">{data.period}</span>
                            <span className="pc-banner-divider" />
                            <span className="pc-banner-count">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                                {responseCount.toLocaleString()}
                            </span>
                        </div>
                        <button className="pc-banner-copy" onClick={handleCopy}>
                            {copied
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                            }
                            {copied ? '복사됨' : '복사하기'}
                        </button>
                    </div>
                </div>

                <div className="pc-results-card">
                    {/* 종합결과 */}
                    {radarData.length > 0 && (
                        <div className="pc-results-block">
                            <h3 className="pc-results-heading">종합결과</h3>
                            <div className="pc-radar-wrap"><RadarChart data={radarData} /></div>
                            <button className="pc-toggle-detail" onClick={() => setOpen(!open)}>
                                자세히보기
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {open && (
                                <div className="pc-radar-detail-table-wrap">
                                    <table className="pc-radar-detail-table">
                                        <thead>
                                            <tr>
                                                <th>항목</th>
                                                <th>점수 (5점 만점)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {radarData.map((d) => (
                                                <tr key={d.label}>
                                                    <td>{d.label}</td>
                                                    <td>{d.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 단일선택 질문별 도넛 */}
                    {pieSections.map((section) => (
                        <div key={section.title} className="pc-results-block">
                            <h4 className="pc-results-q-title">{section.title}</h4>
                            <div className="pc-pie-row">
                                <DonutChart data={section.data} />
                                <ul className="pc-pie-legend">
                                    {section.data.map((d) => (
                                        <li key={d.label}>
                                            <span className="pc-dot" style={{ background: d.color }} />
                                            <strong style={{ color: '#111' }}>{d.value}%</strong>
                                            <span className="pc-legend-label">{d.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}

                    {/* 다중선택 질문 가로 바 차트 */}
                    {derivedBarData.length > 0 && (
                        <div className="pc-results-block">
                            <h4 className="pc-results-q-title">{multiQTitle}</h4>
                            <div className="pc-bar-list">
                                {derivedBarData.map((d) => (
                                    <div key={d.label} className="pc-bar-row">
                                        <div
                                            className="pc-bar-fill"
                                            style={{
                                                width: `${(d.value / Math.max(...derivedBarData.map(x => x.value), 1)) * 80}%`,
                                                background: d.color,
                                                minWidth: 70,
                                            }}
                                        >
                                            <span className="pc-bar-inner-label">{d.label}</span>
                                        </div>
                                        <span className="pc-bar-pct" style={{ color: d.color }}>{d.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 가장 개선 필요 항목 — 버블(워드클라우드형) 차트 */}
                    {bubbleData.length > 0 && (
                        <div className="pc-results-block">
                            <h4 className="pc-results-q-title">가장 개선 필요 항목</h4>
                            <div className="pc-bubble-chart">
                                <ResponsiveContainer width="100%" height={260}>
                                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                        <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                                        <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                                        <ZAxis type="number" dataKey="z" domain={[0, bubbleMax]} range={[600, 6000]} />
                                        <Scatter data={bubbleData} isAnimationActive={false}>
                                            {bubbleData.map((d, i) => (
                                                <Cell key={i} fill={d.color} fillOpacity={0.85} />
                                            ))}
                                            <LabelList
                                                dataKey="label"
                                                position="center"
                                                style={{ fill: '#fff', fontSize: 12, fontWeight: 700, pointerEvents: 'none' }}
                                            />
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* 단일선택 응답 분포 세로 바 차트 */}
                    {colData.length > 0 && (
                        <div className="pc-results-block pc-results-block-last">
                            <h4 className="pc-results-q-title">응답 분포</h4>
                            <div className="pc-col-chart-wrap">
                                <div className="pc-col-y-axis">
                                    {[colMax, Math.round(colMax * 0.75), Math.round(colMax * 0.5), Math.round(colMax * 0.25), 0].map((v, i) => (
                                        <span key={i}>{v}</span>
                                    ))}
                                </div>
                                <div className="pc-col-chart-inner">
                                    <div className="pc-col-gridlines">
                                        {[1, 0.75, 0.5, 0.25, 0].map((f) => (
                                            <div key={f} className="pc-col-gridline" style={{ bottom: `${f * 100}%` }} />
                                        ))}
                                    </div>
                                    <div className="pc-col-bars">
                                        {colData.map((d) => (
                                            <div key={d.label} className="pc-col-col">
                                                <span className="pc-col-caption">{d.caption}</span>
                                                <div className="pc-col-bar" style={{ height: (d.value / colMax) * 160 }} />
                                                <span className="pc-col-xlabel">{d.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!resultsData && (
                        <div className="pc-results-block" style={{ textAlign: 'center', color: '#aaa', padding: '40px 0' }}>
                            결과를 불러오는 중...
                        </div>
                    )}
                </div>
            </div>
        </UserPCLayout>
    );
}
