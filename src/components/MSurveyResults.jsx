import { useEffect, useRef, useState, useCallback, Fragment } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MSurveyResults.css';
import { API_URL } from '../utils/api';

// ── InView hook: element가 viewport에 들어오면 true ──────────────────────────
function useInView(threshold = 0.15) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || !('IntersectionObserver' in window)) { setInView(true); return; }
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, inView };
}

// ── 색상 팔레트 ──────────────────────────────────────────────────────────────
const DONUT_COLORS  = ['#542AA3', '#F4B400', '#9D7EE4', '#3D1B7A', '#E6235A', '#16B5B0'];
const BAR_COLORS    = ['#FB9B00', '#680A25', '#0B9583', '#542AA3', '#777777'];
const BUBBLE_COLORS = ['#0B9583', '#FB9B00', '#542AA3', '#680A25', '#9D7EE4', '#5B2EAB', '#1A8870'];

// ── 레이더 차트 ──────────────────────────────────────────────────────────────
function RadarHexagon({ data }) {
    const { ref, inView } = useInView(0.1);
    const cx = 140, cy = 140, r = 86, max = 5;
    const angles = data.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / data.length);
    const ringPoints = (ratio) =>
        angles.map((a) => `${cx + r * ratio * Math.cos(a)},${cy + r * ratio * Math.sin(a)}`).join(' ');
    const valuePoints = data.map((d, i) => {
        const a = angles[i];
        const k = d.value / max;
        return `${cx + r * k * Math.cos(a)},${cy + r * k * Math.sin(a)}`;
    }).join(' ');

    return (
        <svg ref={ref} viewBox="0 0 280 280" className={`m-radar-svg ${inView ? 'animated' : ''}`}>
            {[0.25, 0.5, 0.75, 1].map((rt) => (
                <polygon key={rt} points={ringPoints(rt)} fill="none" stroke="#e8e8e8" strokeWidth="1" />
            ))}
            {angles.map((a, i) => (
                <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#e8e8e8" strokeWidth="1" />
            ))}
            <polygon
                className={`m-radar-polygon ${inView ? 'animated' : ''}`}
                points={valuePoints}
                fill="rgba(84,42,163,0.13)"
                stroke="#542AA3"
                strokeWidth="2"
            />
            {data.map((d, i) => {
                const a = angles[i];
                const lx = cx + (r + 24) * Math.cos(a);
                const ly = cy + (r + 24) * Math.sin(a);
                return (
                    <g key={d.key}>
                        <text x={lx} y={ly - 2}  textAnchor="middle" fontSize="11" fill="#808080">{d.label}</text>
                        <text x={lx} y={ly + 13} textAnchor="middle" fontSize="12" fontWeight="700" fill="#111">{d.value.toFixed(1)}</text>
                    </g>
                );
            })}
        </svg>
    );
}

// ── 도넛 차트 ────────────────────────────────────────────────────────────────
function Donut({ slices, size = 150 }) {
    const { ref, inView } = useInView(0.1);
    const r = size / 2 - 18;
    const cx = size / 2, cy = size / 2;
    const C = 2 * Math.PI * r;
    let offset = 0;
    return (
        <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}
            className={`m-donut ${inView ? 'animated' : ''}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth="20" />
            {slices.map((s, i) => {
                const len = (s.pct / 100) * C;
                const dasharray = `${len} ${C - len}`;
                const dashoffset = -offset;
                offset += len;
                return (
                    <circle key={i} cx={cx} cy={cy} r={r}
                        fill="none" stroke={s.color} strokeWidth="20"
                        strokeDasharray={dasharray} strokeDashoffset={dashoffset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                    />
                );
            })}
        </svg>
    );
}

// ── 가로 바 차트 (Figma 컬러드) ──────────────────────────────────────────────
function HorizontalBars({ items }) {
    const { ref, inView } = useInView(0.15);
    return (
        <div ref={ref} className="m-hbars">
            {items.map((b, i) => (
                <div key={b.label} className="m-hbar-row">
                    <div className="m-hbar-track">
                        <div
                            className={`m-hbar-fill ${inView ? 'animated' : ''}`}
                            style={{
                                width: `${b.pct}%`,
                                background: BAR_COLORS[i] || '#777',
                                animationDelay: `${i * 0.12}s`,
                            }}
                        >
                            <span className="m-hbar-inner-label">{b.label}</span>
                        </div>
                    </div>
                    <span className="m-hbar-pct" style={{ color: BAR_COLORS[i] || '#777' }}>{b.pct}%</span>
                </div>
            ))}
        </div>
    );
}

// ── 버블 클라우드 ─────────────────────────────────────────────────────────────
function BubbleCloud({ bubbles }) {
    const { ref, inView } = useInView(0.1);
    return (
        <div ref={ref} className="m-bubble-cloud">
            {bubbles.map((b, i) => (
                <div
                    key={b.label}
                    className={`m-bubble-item ${inView ? 'animated' : ''}`}
                    style={{
                        width: b.size, height: b.size,
                        background: b.color,
                        animationDelay: `${i * 0.07}s`,
                    }}
                >
                    <span className="m-bubble-text">{b.label}</span>
                    <span className="m-bubble-pct">{b.pct}%</span>
                </div>
            ))}
        </div>
    );
}

// ── 세로 바 차트 ────────────────────────────────────────────────────────────
function ColumnChart({ data }) {
    const { ref, inView } = useInView(0.15);
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div ref={ref} className="m-col-chart">
            <div className="m-col-chart-inner">
                {data.map((c, i) => {
                    const pct = (c.value / max) * 100;
                    return (
                        <div key={i} className="m-col-item">
                            <div className="m-col-bar-area">
                                <span className="m-col-val">{c.value.toLocaleString()}</span>
                                <div
                                    className={`m-col-bar ${inView ? 'animated' : ''}`}
                                    style={{ height: `${pct}%`, animationDelay: `${i * 0.09}s` }}
                                />
                            </div>
                            <span className="m-col-x-label">{c.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function MSurveyResults({ onNavigate, survey }) {
    const meta = {
        title: survey?.title || '',
        period: survey?.period || '',
        respondents: survey?.respondents ?? survey?.response_count ?? 0,
    };
    const [resultsData, setResultsData]     = useState(null);
    const [radarExpanded, setRadarExpanded] = useState(false);
    const [copied, setCopied]               = useState(false);

    useEffect(() => {
        const id = survey?.id;
        if (!id) return;
        fetch(`${API_URL}/api/surveys/${id}/results`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d) setResultsData(d); })
            .catch(() => {});
    }, [survey?.id]);

    const respondentCount = resultsData?.response_count ?? meta.respondents;

    // Figma 스타일 히어로 타이틀: "YYYY년,\n[제목] 결과는?"
    const heroYear = (() => {
        if (!meta.period) return null;
        const m = meta.period.match(/(\d{4})/);
        return m ? m[1] : null;
    })();
    const heroTitle = heroYear
        ? `${heroYear}년,\n${meta.title} 결과는?`
        : meta.title;

    // 종합결과 — 레이더 데이터
    const compositeData = (() => {
        const qs = (resultsData?.questions || [])
            .filter(q => q.distribution?.length > 0 && q.distribution.some(d => (d.count || 0) > 0))
            .slice(0, 6);
        if (qs.length < 3) return [];
        const LABELS = ['접근성', '이동성', '안전성', '정보제공성', '포용성', '심미성'];
        return qs.map((q, idx) => {
            const total    = q.distribution.reduce((s, d) => s + (d.count || 0), 0) || 1;
            const weighted = q.distribution.reduce((s, d, i) => s + (d.count || 0) * (q.distribution.length - i), 0);
            return {
                key: `q${idx}`,
                label: LABELS[idx] || `Q${idx + 1}`,
                value: parseFloat((weighted / total / q.distribution.length * 5).toFixed(1)),
            };
        });
    })();

    // 도넛 섹션
    const donutSections = (() => {
        if (!resultsData) return [];
        return resultsData.questions
            .filter(q => q.qtype === 'single' || q.qtype === 'agree')
            .map((q) => {
                const qIdx  = resultsData.questions.indexOf(q);
                const total = q.total || q.distribution.reduce((s, d) => s + (d.count || 0), 0) || 1;
                return {
                    title: `Q${qIdx + 1}. ${q.text}`,
                    slices: q.distribution
                        .map((d, i) => ({
                            label: d.label,
                            pct: d.pct ?? Math.round((d.count / total) * 100),
                            color: DONUT_COLORS[i % DONUT_COLORS.length],
                        }))
                        .filter(s => s.pct > 0),
                };
            });
    })();

    // 복수선택 → 가로 바 + 버블
    const multiQ    = (resultsData?.questions || []).find(q => q.qtype === 'multi');
    const multiQIdx = multiQ ? resultsData.questions.indexOf(multiQ) : -1;
    const multiQTitle = multiQ ? `Q${multiQIdx + 1}. ${multiQ.text}` : null;

    const derivedBars = (() => {
        if (!multiQ?.distribution?.length) return [];
        const total = multiQ.total || multiQ.distribution.reduce((s, d) => s + (d.count || 0), 0) || 1;
        return multiQ.distribution
            .map(d => ({ label: d.label, pct: Math.round((d.count / total) * 100) }))
            .filter(d => d.pct > 0)
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 5);
    })();

    const derivedBubbles = derivedBars.map((b, i) => ({
        label: b.label,
        pct: b.pct,
        size: Math.max(52, Math.min(96, Math.round(b.pct * 3.2))),
        color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
    }));

    // 세로 바 차트 (첫 번째 single 질문)
    const columnData = (() => {
        const q = (resultsData?.questions || []).find(q => q.qtype === 'single');
        if (!q?.distribution?.length) return [];
        const items = q.distribution.map(d => ({ label: d.label, value: d.count || 0 }));
        return items.some(d => d.value > 0) ? items : [];
    })();
    const columnTitle = (() => {
        if (!resultsData) return null;
        const q = resultsData.questions.find(q => q.qtype === 'single');
        if (!q) return null;
        return `Q${resultsData.questions.indexOf(q) + 1}. ${q.text}`;
    })();

    const hasSections =
        compositeData.length > 0 ||
        donutSections.some(d => d.slices.length > 0) ||
        derivedBars.length > 0 ||
        columnData.length > 0;

    const handleCopy = useCallback(async () => {
        const lines = [`${meta.title} - 설문 결과`];
        if (meta.period) lines.push(`조사기간: ${meta.period}`);
        lines.push(`총 응답자: ${respondentCount.toLocaleString()}명`);
        if (compositeData.length > 0) {
            lines.push('');
            lines.push('■ 종합결과');
            compositeData.forEach(d => lines.push(`  ${d.label}: ${d.value}점`));
        }
        donutSections.filter(d => d.slices.length > 0).forEach(d => {
            lines.push('');
            lines.push(`■ ${d.title}`);
            d.slices.forEach(s => lines.push(`  ${s.label}: ${s.pct}%`));
        });
        if (derivedBars.length > 0) {
            lines.push('');
            lines.push(`■ ${multiQTitle}`);
            derivedBars.forEach(b => lines.push(`  ${b.label}: ${b.pct}%`));
        }
        if (columnData.length > 0) {
            lines.push('');
            lines.push(`■ ${columnTitle}`);
            columnData.forEach(c => lines.push(`  ${c.label}: ${c.value}건`));
        }
        const text = lines.join('\n');
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0.01;pointer-events:none;';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try { document.execCommand('copy'); } catch {}
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [meta, respondentCount, compositeData, donutSections, multiQTitle, derivedBars, columnData, columnTitle]);

    return (
        <div className="m-survey-results-page">

            {/* ── 히어로 ── */}
            <div className="m-results-hero">
                <div className="m-hero-top">
                    <button className="m-hero-back" onClick={() => onNavigate?.('mSurveyList')} aria-label="뒤로">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button className="m-hero-copy" onClick={handleCopy}>
                        {copied
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        }
                        <span>{copied ? '복사됨' : '복사하기'}</span>
                    </button>
                </div>
                <h1 className="m-results-title">{heroTitle}</h1>
                <div className="m-results-meta-pill">
                    <span className="m-results-period">{meta.period}</span>
                    {meta.period && <span className="m-results-sep" />}
                    <span className="m-results-count">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                        {respondentCount.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* ── 콘텐츠 ── */}
            <div className="m-results-content">

                {/* 종합결과 */}
                {compositeData.length > 0 && (
                    <section className="m-results-section">
                        <h3 className="m-results-section-title">종합결과</h3>
                        <div className="m-radar-wrap">
                            <RadarHexagon data={compositeData} />
                        </div>
                        <button
                            className={`m-results-detail-btn ${radarExpanded ? 'expanded' : ''}`}
                            onClick={() => setRadarExpanded(v => !v)}
                        >
                            자세히보기
                            <svg
                                width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transition: 'transform 0.3s', transform: radarExpanded ? 'rotate(180deg)' : 'none' }}
                            >
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                        {radarExpanded && (
                            <ul className="m-radar-detail-list">
                                {compositeData.map((d) => (
                                    <li key={d.key}>
                                        <span>{d.label}</span>
                                        <div className="m-radar-detail-bar">
                                            <div className="m-radar-detail-fill" style={{ width: `${(d.value / 5) * 100}%` }} />
                                        </div>
                                        <strong>{d.value.toFixed(1)}</strong>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                {/* 도넛 섹션 */}
                {donutSections.filter(d => d.slices.length > 0).map((d, i) => (
                    <Fragment key={i}>
                        <div className="m-section-divider" />
                        <section className="m-results-section">
                            <h3 className="m-q-result-title">{d.title}</h3>
                            <div className="m-donut-row">
                                <Donut slices={d.slices} size={150} />
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
                    </Fragment>
                ))}

                {/* 가로 바 차트 */}
                {derivedBars.length > 0 && (
                    <>
                        <div className="m-section-divider" />
                        <section className="m-results-section">
                            <h3 className="m-q-result-title">{multiQTitle}</h3>
                            <HorizontalBars items={derivedBars} />
                        </section>
                    </>
                )}

                {/* 버블 클라우드 */}
                {derivedBubbles.length > 0 && (
                    <>
                        <div className="m-section-divider" />
                        <section className="m-results-section">
                            <h3 className="m-q-result-title">키워드 분포</h3>
                            <BubbleCloud bubbles={derivedBubbles} />
                        </section>
                    </>
                )}

                {/* 세로 바 차트 */}
                {columnData.length > 0 && (
                    <>
                        <div className="m-section-divider" />
                        <section className="m-results-section">
                            <h3 className="m-q-result-title">{columnTitle}</h3>
                            <ColumnChart data={columnData} />
                        </section>
                    </>
                )}

                {/* 로딩 / 빈 상태 */}
                {!resultsData && (
                    <section className="m-results-section m-results-empty">
                        <div className="m-results-spinner" />
                        결과를 불러오는 중...
                    </section>
                )}
                {resultsData && !hasSections && (
                    <section className="m-results-section m-results-empty">
                        아직 집계된 응답 데이터가 없습니다.
                    </section>
                )}
            </div>

            <MobileBottomNav currentView="mSurveyResults" onNavigate={onNavigate} />
        </div>
    );
}
