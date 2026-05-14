import { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import './MDiagnosisResult.css';
import { API_URL } from '../utils/api';

const CATEGORIES = [
    { key: 'home',    label: '주거' },
    { key: 'env',     label: '환경' },
    { key: 'traffic', label: '교통' },
    { key: 'safety',  label: '안전' },
    { key: 'edu',     label: '교육' },
    { key: 'work',    label: '산업·일자리', short: '산업\n일자리' },
    { key: 'culture', label: '문화·여가',   short: '문화\n여가' },
    { key: 'health',  label: '보건·복지',   short: '보건\n복지' },
];

const CATEGORY_ICONS = {
    home: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l9-9 9 9"/>
            <path d="M5 10v10h14V10"/>
        </svg>
    ),
    env: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 13-9-1 8-5 13-9 13z"/>
            <path d="M11 20s5-7 6-13"/>
        </svg>
    ),
    traffic: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="3" width="16" height="14" rx="2"/>
            <circle cx="8" cy="20" r="1.5"/>
            <circle cx="16" cy="20" r="1.5"/>
            <line x1="4" y1="11" x2="20" y2="11"/>
        </svg>
    ),
    safety: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    ),
    edu: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/>
        </svg>
    ),
    work: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
    ),
    culture: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    ),
    health: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 8v8M8 12h8"/>
        </svg>
    ),
};

const RADAR_DATA = [
    { subject: '접근성',     A: 2.0, fullMark: 5 },
    { subject: '이동성',     A: 2.0, fullMark: 5 },
    { subject: '안전성',     A: 1.8, fullMark: 5 },
    { subject: '정보제공성', A: 1.9, fullMark: 5 },
    { subject: '포용성',     A: 1.8, fullMark: 5 },
    { subject: '심미성',     A: 1.7, fullMark: 5 },
];

const FALLBACK_TOTAL_AVG = (RADAR_DATA.reduce((sum, d) => sum + d.A, 0) / RADAR_DATA.length).toFixed(2);
const FALLBACK_RESPONSES = 36;

function CustomTick({ payload, x, y, textAnchor }) {
    const point = RADAR_DATA.find((d) => d.subject === payload.value);
    return (
        <g>
            <text x={x} y={y - 4} textAnchor={textAnchor} className="m-diagres-tick-label">
                {payload.value}
            </text>
            <text x={x} y={y + 12} textAnchor={textAnchor} className="m-diagres-tick-value">
                {point?.A?.toFixed(1)}
            </text>
        </g>
    );
}

export default function MDiagnosisResult({ onNavigate, address = '부산 부산진구 초연로 6', date = '2024/05/16', activeCategory = 'traffic', photo = null, district = null, resultId = null }) {
    const [stats, setStats] = useState({ avg: FALLBACK_TOTAL_AVG, count: FALLBACK_RESPONSES });
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        // Use /checklist/clusters for overall stats (public, accurate total avg + count)
        const params = new URLSearchParams();
        if (district) params.set('district', district);
        fetch(`${API_URL}/checklist/clusters`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                if (!Array.isArray(rows) || rows.length === 0) return;
                // Sum weighted average across clusters
                let totalScore = 0, totalCount = 0;
                for (const r of rows) {
                    if (r.avg_score && r.count) {
                        totalScore += r.avg_score * r.count;
                        totalCount += r.count;
                    }
                }
                if (totalCount > 0) {
                    setStats({
                        avg: (totalScore / totalCount).toFixed(2),
                        count: totalCount,
                    });
                }
            })
            .catch(() => {});

        const recParams = new URLSearchParams();
        if (resultId) recParams.set('result_id', String(resultId));
        if (district && !resultId) recParams.set('district', district);
        fetch(`${API_URL}/checklist/recommendations?${recParams.toString()}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data && Array.isArray(data.proposals)) setRecommendations(data.proposals.slice(0, 3));
            })
            .catch(() => {});
    }, [district, resultId]);

    return (
        <div className="m-diagres-page">
            <header className="m-diagres-topbar">
                <button
                    type="button"
                    className="m-diagres-iconbtn"
                    aria-label="뒤로"
                    onClick={() => onNavigate?.('mDiagnosisList')}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <button
                    type="button"
                    className="m-diagres-iconbtn"
                    aria-label="홈"
                    onClick={() => onNavigate?.('home')}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                </button>
            </header>

            <main className="m-diagres-body">
                <h1 className="m-diagres-title">일반 진단 결과</h1>
                <p className="m-diagres-address">{address}</p>
                <p className="m-diagres-date">진단일: {date}</p>

                {/* 카테고리 그리드 — 가운데 상단 '전체' 배지 + 4x2 카테고리 */}
                <section className="m-diagres-cats">
                    <div className="m-diagres-cats-top">
                        <span className="m-diagres-cat-all">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                            </svg>
                            전체
                        </span>
                    </div>
                    <ul className="m-diagres-cat-grid">
                        {CATEGORIES.map((c) => (
                            <li
                                key={c.key}
                                className={`m-diagres-cat-item ${c.key === activeCategory ? 'on' : ''}`}
                            >
                                <span className="m-diagres-cat-icon">{CATEGORY_ICONS[c.key]}</span>
                                <span className="m-diagres-cat-label">
                                    {c.short ? c.short.split('\n').map((s, i) => <span key={i}>{s}</span>) : c.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* 진단 사진 */}
                <div className="m-diagres-photo">
                    {photo ? (
                        <img src={photo} alt="진단 사진" />
                    ) : (
                        <div className="m-diagres-photo-placeholder">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                        </div>
                    )}
                </div>

                {/* 레이더 차트 카드 */}
                <section className="m-diagres-card">
                    <p className="m-diagres-card-head">
                        <span className="m-diagres-avg">{stats.avg}</span> 전체 평균 ({stats.count})
                    </p>
                    <div className="m-diagres-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RADAR_DATA}>
                                <PolarGrid stroke="#dadde2" />
                                <PolarAngleAxis dataKey="subject" tick={CustomTick} />
                                <Radar
                                    name="Score"
                                    dataKey="A"
                                    stroke="#06AB69"
                                    strokeWidth={2}
                                    fill="#06AB69"
                                    fillOpacity={0.25}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {recommendations.length > 0 && (
                    <section className="m-diagres-detail">
                        <h2 className="m-diagres-detail-title">관련 시민 제안</h2>
                        <p className="m-diagres-detail-desc">진단 결과와 같은 카테고리의 인기 제안입니다.</p>
                        <div className="m-diagres-detail-btns">
                            {recommendations.map((rec) => (
                                <button
                                    key={rec.id}
                                    type="button"
                                    className="m-diagres-detail-btn purple"
                                    onClick={() => onNavigate?.('mProposalDetail', rec)}
                                >
                                    <span>{rec.title} · 좋아요 {rec.likes}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* 세부 정보 */}
                <section className="m-diagres-detail">
                    <h2 className="m-diagres-detail-title">세부 정보도 확인해 보세요</h2>
                    <p className="m-diagres-detail-desc">
                        시설물, 구역, 인원 기준으로<br />
                        진단 결과를 더욱 자세히 확인할 수 있습니다.
                    </p>
                    <div className="m-diagres-detail-btns">
                        <button
                            type="button"
                            className="m-diagres-detail-btn purple"
                            onClick={() => onNavigate?.('mDiagnosisDetailFacility')}
                        >
                            <span>시설물별 세부 정보</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                        <button
                            type="button"
                            className="m-diagres-detail-btn purple"
                            onClick={() => onNavigate?.('mDiagnosisDetailZone')}
                        >
                            <span>구역별 세부 정보</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                        <button
                            type="button"
                            className="m-diagres-detail-btn green"
                            onClick={() => onNavigate?.('mDiagnosisDetailPerson')}
                        >
                            <span>인원별 세부 정보</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
