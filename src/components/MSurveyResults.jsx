import { useEffect, useRef, useState, Fragment } from 'react';
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

// ── 색상 팔레트 (Figma) ──────────────────────────────────────────────────────
const SURVEY_PURPLE = '#5B2EAB';
const DONUT_COLORS  = ['#5B2EAB', '#7A1230', '#E6235A', '#1FA89A', '#9D7EE4', '#F5A623'];
const BAR_COLORS    = ['#F5A623', '#7A1230', '#1FA89A', '#5B2EAB', '#9AA0A6'];
const BUBBLE_COLORS = ['#F5A623', '#7A1230', '#1FA89A', '#5B2EAB', '#C9B6E8'];
// 연한 배경(밝은 버블)에서는 진한 글자, 진한 배경에서는 흰 글자
const LIGHT_BUBBLE_BG = ['#C9B6E8', '#9D7EE4'];

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
            {/* 동심 육각형 그리드 (연회색 3겹) */}
            {[0.34, 0.67, 1].map((rt) => (
                <polygon key={rt} points={ringPoints(rt)} fill="none" stroke="#e4e4e8" strokeWidth="1" />
            ))}
            {/* 축선 */}
            {angles.map((a, i) => (
                <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#e4e4e8" strokeWidth="1" />
            ))}
            {/* 데이터 폴리곤: 보라 반투명 채움 + 외곽선 */}
            <polygon
                className={`m-radar-polygon ${inView ? 'animated' : ''}`}
                points={valuePoints}
                fill="rgba(91,46,171,0.22)"
                stroke={SURVEY_PURPLE}
                strokeWidth="2"
                strokeLinejoin="round"
            />
            {/* 꼭짓점 점 */}
            {data.map((d, i) => {
                const a = angles[i];
                const k = d.value / max;
                const px = cx + r * k * Math.cos(a);
                const py = cy + r * k * Math.sin(a);
                return (
                    <circle key={`pt-${d.key}`} className={`m-radar-dot ${inView ? 'animated' : ''}`}
                        cx={px} cy={py} r="3" fill={SURVEY_PURPLE} />
                );
            })}
            {/* 축 라벨(회색) + 값(굵은 검정) */}
            {data.map((d, i) => {
                const a = angles[i];
                const lx = cx + (r + 26) * Math.cos(a);
                const ly = cy + (r + 26) * Math.sin(a);
                return (
                    <g key={d.key}>
                        <text x={lx} y={ly - 3}  textAnchor="middle" fontSize="13" fill="#9aa0a6" letterSpacing="-0.3">{d.label}</text>
                        <text x={lx} y={ly + 14} textAnchor="middle" fontSize="16" fontWeight="800" fill="#1a1a1a">{d.value.toFixed(1)}</text>
                    </g>
                );
            })}
        </svg>
    );
}

// ── 도넛 차트 (두꺼운 링 + 둥근 캡 + gap, 범례 가운데) ───────────────────────
function Donut({ slices, size = 220 }) {
    const { ref, inView } = useInView(0.1);
    const stroke = 26;
    const r = size / 2 - stroke / 2 - 2;
    const cx = size / 2, cy = size / 2;
    const C = 2 * Math.PI * r;
    const GAP = 3; // 세그먼트 사이 간격(px on circumference)
    let offset = 0;
    return (
        <div ref={ref} className={`m-donut-chart ${inView ? 'animated' : ''}`}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="m-donut-svg">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f0f5" strokeWidth={stroke} />
                {slices.map((s, i) => {
                    const len = Math.max((s.pct / 100) * C - GAP, 0);
                    const dasharray = `${len} ${C - len}`;
                    const dashoffset = -offset;
                    offset += (s.pct / 100) * C;
                    return (
                        <circle key={i} cx={cx} cy={cy} r={r}
                            fill="none" stroke={s.color} strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={dasharray} strokeDashoffset={dashoffset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                        />
                    );
                })}
            </svg>
            {/* 도넛 가운데 범례 */}
            <ul className="m-donut-legend">
                {slices.map((s) => (
                    <li key={s.label}>
                        <span className="m-legend-dot" style={{ background: s.color }} />
                        <span className="m-legend-pct">{s.pct}%</span>
                        <span className="m-legend-label">{s.label}</span>
                    </li>
                ))}
            </ul>
        </div>
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
            {bubbles.map((b, i) => {
                const darkText = LIGHT_BUBBLE_BG.includes(b.color);
                return (
                    <div
                        key={b.label}
                        className={`m-bubble-item ${darkText ? 'is-light' : ''} ${inView ? 'animated' : ''}`}
                        style={{
                            width: b.size, height: b.size,
                            background: b.color,
                            animationDelay: `${i * 0.07}s`,
                        }}
                    >
                        <span className="m-bubble-text">{b.label}</span>
                        <span className="m-bubble-pct">({b.pct})</span>
                    </div>
                );
            })}
        </div>
    );
}

// ── 세로 바 히스토그램 (Y축 눈금 + 격자 + 값(%) 라벨) ─────────────────────────
function ColumnChart({ data }) {
    const { ref, inView } = useInView(0.15);
    const total   = data.reduce((s, d) => s + d.value, 0) || 1;
    const rawMax  = Math.max(...data.map((d) => d.value), 1);
    // Y축 눈금: 0/20/40/60/80… 20 단위로 rawMax 넘는 첫 배수까지
    const step    = 20;
    const axisMax = Math.max(Math.ceil(rawMax / step) * step, step);
    const ticks   = [];
    for (let t = axisMax; t >= 0; t -= step) ticks.push(t);
    return (
        <div ref={ref} className="m-col-chart">
            <div className="m-col-grid">
                {/* Y축 눈금 + 격자선 */}
                <div className="m-col-yaxis">
                    {ticks.map((t) => <span key={t} className="m-col-ytick">{t}</span>)}
                </div>
                <div className="m-col-plot">
                    {ticks.map((t) => (
                        <div key={t} className="m-col-gridline" style={{ bottom: `${(t / axisMax) * 100}%` }} />
                    ))}
                    <div className="m-col-bars">
                        {data.map((c, i) => {
                            const h   = (c.value / axisMax) * 100;
                            const pct = ((c.value / total) * 100).toFixed(1);
                            return (
                                <div key={i} className="m-col-item">
                                    <div className="m-col-bar-area">
                                        <span className="m-col-val">{c.value.toLocaleString()}({pct}%)</span>
                                        <div
                                            className={`m-col-bar ${inView ? 'animated' : ''}`}
                                            style={{ height: `${h}%`, animationDelay: `${i * 0.09}s` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="m-col-xaxis">
                {data.map((c, i) => <span key={i} className="m-col-x-label">{i + 1}</span>)}
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

    const [resultsLoading, setResultsLoading] = useState(true);

    useEffect(() => {
        const id = survey?.id;
        if (!id) { setResultsLoading(false); return; }
        setResultsLoading(true);
        fetch(`${API_URL}/api/surveys/${id}/results`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d) setResultsData(d); })
            .catch(() => {})
            .finally(() => setResultsLoading(false));
    }, [survey?.id]);

    const respondentCount = resultsData?.response_count ?? meta.respondents;

    // Figma: 기간 포맷 "2026.03.16 - 2026.04.05" (점 표기, 시작-끝)
    const formatPeriodDots = (period) => {
        if (!period) return '';
        const toDots = (s) => s.trim().replace(/-/g, '.');
        const parts = period.split(/~|–|—/);
        if (parts.length >= 2) return `${toDots(parts[0])} - ${toDots(parts[1])}`;
        return toDots(period);
    };
    const periodLabel = formatPeriodDots(meta.period);

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
                    qIdx,
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

    // 이미 도넛 섹션으로 렌더링된 질문 인덱스 (중복 렌더 방지)
    const renderedDonutQIdx = new Set(
        donutSections.filter(d => d.slices.length > 0).map(d => d.qIdx)
    );

    // 세로 바 차트 (도넛에 쓰이지 않은 첫 번째 single 질문)
    const columnQuestion = (resultsData?.questions || []).find(
        (q, idx) => q.qtype === 'single' && !renderedDonutQIdx.has(idx)
    );
    const columnData = (() => {
        const q = columnQuestion;
        if (!q?.distribution?.length) return [];
        const items = q.distribution.map(d => ({ label: d.label, value: d.count || 0 }));
        return items.some(d => d.value > 0) ? items : [];
    })();
    const columnTitle = (() => {
        if (!resultsData || !columnQuestion) return null;
        return `Q${resultsData.questions.indexOf(columnQuestion) + 1}. ${columnQuestion.text}`;
    })();

    const hasSections =
        compositeData.length > 0 ||
        donutSections.some(d => d.slices.length > 0) ||
        derivedBars.length > 0 ||
        columnData.length > 0;

    return (
        <div className="m-survey-results-page">

            {/* ── 히어로 ── */}
            <div className="m-results-hero">
                <div className="m-hero-top">
                    <button className="m-hero-back" onClick={() => onNavigate?.('mSurveyList')} aria-label="뒤로">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                </div>
                <h1 className="m-results-title">{heroTitle}</h1>
                <div className="m-results-meta-pill">
                    <span className="m-results-period">{periodLabel}</span>
                    <span className="m-results-count">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                        {respondentCount.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* ── 콘텐츠 ── */}
            <div className="m-results-content">

                {resultsLoading && !resultsData && (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#888', fontSize: 14 }}>
                        결과를 불러오는 중입니다…
                    </div>
                )}

                {!resultsLoading && !resultsData && (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#888', fontSize: 14 }}>
                        설문 결과 데이터가 아직 없습니다.
                    </div>
                )}

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
                                <Donut slices={d.slices} size={220} />
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

                {/* 빈 상태 — 데이터 있는데 차트 섹션 없을 때만 */}
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
