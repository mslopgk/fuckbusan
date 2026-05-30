import { useEffect, useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import './MDiagnosisResult.css';
import { API_URL, authHeaders } from '../utils/api';

const FALLBACK_RADAR_DATA = [
    { subject: '접근성',     A: 2.0, fullMark: 5 },
    { subject: '이동성',     A: 2.0, fullMark: 5 },
    { subject: '안전성',     A: 1.8, fullMark: 5 },
    { subject: '정보제공성', A: 1.9, fullMark: 5 },
    { subject: '포용성',     A: 1.8, fullMark: 5 },
    { subject: '심미성',     A: 1.7, fullMark: 5 },
];

const FALLBACK_TOTAL_AVG = (FALLBACK_RADAR_DATA.reduce((sum, d) => sum + d.A, 0) / FALLBACK_RADAR_DATA.length).toFixed(2);
const FALLBACK_RESPONSES = 36;

const RADAR_AXES = ['접근성', '이동성', '안전성', '정보제공성', '포용성', '심미성'];

function buildRadarFromAnswers(answers) {
    if (!answers || typeof answers !== 'object') return null;
    const entries = Object.entries(answers);
    if (entries.length === 0) return null;

    const axisScores = RADAR_AXES.map(() => ({ sum: 0, count: 0 }));
    entries.forEach(([idx, score]) => {
        const numScore = Number(score);
        if (!Number.isFinite(numScore)) return;
        const axisIdx = Number(idx) % RADAR_AXES.length;
        axisScores[axisIdx].sum += numScore;
        axisScores[axisIdx].count += 1;
    });

    const totalAvg = entries.reduce((s, [, v]) => s + Number(v), 0) / entries.length;
    return RADAR_AXES.map((subject, i) => ({
        subject,
        A: axisScores[i].count > 0
            ? Number((axisScores[i].sum / axisScores[i].count).toFixed(2))
            : Number(totalAvg.toFixed(2)),
        fullMark: 5,
    }));
}

function CustomTick({ payload, x, y, textAnchor, radarData }) {
    const point = (radarData || FALLBACK_RADAR_DATA).find((d) => d.subject === payload.value);
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

function BreakdownSection({ label, title, data, count, empty }) {
    const avg = data && data.length
        ? (data.reduce((s, d) => s + (d.A || 0), 0) / data.length).toFixed(2)
        : '0.00';
    return (
        <div className="m-diagres-section-row">
            <div className="m-diagres-section-label">{label}</div>
            <div className="m-diagres-section-content">
                <div className={`m-diagres-radar-card ${empty ? 'm-diagres-radar-card--disabled' : ''}`}>
                    <p className="m-diagres-radar-card-title">{title}</p>
                    {!empty && (
                        <p className="m-diagres-card-head" style={{ fontSize: 13, color: '#777' }}>
                            <span className="m-diagres-avg">{avg}</span>
                            {count ? ` 평균 (${count})` : ' 평균'}
                        </p>
                    )}
                    <div className="m-diagres-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                                <PolarGrid stroke="#dadde2" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={(props) => <CustomTick {...props} radarData={data} />}
                                />
                                <Radar
                                    name="Score"
                                    dataKey="A"
                                    stroke="#23BDBB"
                                    strokeWidth={2}
                                    fill="#23BDBB"
                                    fillOpacity={empty ? 0.15 : 0.25}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RadarSection({ title, radarData, avg, count }) {
    return (
        <div className="m-diagres-section-row">
            <div className="m-diagres-section-label">{title}</div>
            <div className="m-diagres-section-content">
                <div className="m-diagres-radar-card">
                    <p className="m-diagres-card-head">
                        <span className="m-diagres-avg">{avg}</span> 전체 평균 ({count})
                    </p>
                    <div className="m-diagres-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                <PolarGrid stroke="#dadde2" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={(props) => <CustomTick {...props} radarData={radarData} />}
                                />
                                <Radar
                                    name="Score"
                                    dataKey="A"
                                    stroke="#23BDBB"
                                    strokeWidth={2}
                                    fill="#23BDBB"
                                    fillOpacity={0.25}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MDiagnosisResult({ onNavigate, address = '부산 부산진구 초연로 6', date = null, activeCategory = 'traffic', photo = null, district = null, resultId = null, big = null, mid = null }) {
    const [stats, setStats] = useState({ avg: FALLBACK_TOTAL_AVG, count: FALLBACK_RESPONSES });
    const [resultDetail, setResultDetail] = useState(null);
    const [photoZoomOpen, setPhotoZoomOpen] = useState(false);
    const [breakdown, setBreakdown] = useState(null);

    // Fetch 3-axis breakdown (facility/zone/person) — depends on resultId for scope
    useEffect(() => {
        const url = resultId
            ? `${API_URL}/checklist/breakdown?result_id=${resultId}`
            : `${API_URL}/checklist/breakdown`;
        fetch(url)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => { if (data) setBreakdown(data); })
            .catch(() => {});
    }, [resultId]);

    // Fetch individual result for radar data and date
    useEffect(() => {
        if (!resultId) return;
        fetch(`${API_URL}/checklist/${resultId}`, { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) setResultDetail(data);
            })
            .catch(() => {});
    }, [resultId]);

    // Derive radar data from result detail answers
    const radarData = useMemo(() => {
        if (!resultDetail?.answers) return FALLBACK_RADAR_DATA;
        try {
            const parsed = typeof resultDetail.answers === 'string'
                ? JSON.parse(resultDetail.answers)
                : resultDetail.answers;
            return buildRadarFromAnswers(parsed) || FALLBACK_RADAR_DATA;
        } catch {
            return FALLBACK_RADAR_DATA;
        }
    }, [resultDetail]);

    // Displayed date: prop → result created_at → today
    const displayDate = useMemo(() => {
        if (date && date !== '2024/05/16') return date;
        if (resultDetail?.created_at) {
            const d = new Date(resultDetail.created_at);
            if (!isNaN(d)) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (date) return date;
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }, [date, resultDetail]);

    // Radar total avg from actual data
    const radarAvg = useMemo(() => {
        if (!radarData || radarData === FALLBACK_RADAR_DATA) return stats.avg;
        const avg = radarData.reduce((s, d) => s + d.A, 0) / radarData.length;
        return avg.toFixed(2);
    }, [radarData, stats.avg]);

    const displayBig = big || resultDetail?.대분류 || '보도';
    const displayMid = mid || resultDetail?.중분류 || '보행공간';
    const displayPhoto = photo || resultDetail?.이미지경로 || null;

    useEffect(() => {
        fetch(`${API_URL}/checklist/clusters`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                if (!Array.isArray(rows) || rows.length === 0) return;
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
    }, []);

    useEffect(() => {
        if (!photoZoomOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setPhotoZoomOpen(false); };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [photoZoomOpen]);

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
                <span className="m-diagres-topbar-title">시민 진단 결과</span>
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
                {/* 테이블 스타일 정보 행 — Figma 진단결과1_시민 */}
                <div className="m-diagres-table">
                    <div className="m-diagres-table-row">
                        <div className="m-diagres-table-label">위치</div>
                        <div className="m-diagres-table-value">{address}</div>
                    </div>
                    <div className="m-diagres-table-row m-diagres-table-row--photo">
                        <div className="m-diagres-table-label">사진</div>
                        <div className="m-diagres-table-value">
                            <div className="m-diagres-thumb">
                                {displayPhoto ? (
                                    <button
                                        type="button"
                                        className="m-diagres-thumb-btn"
                                        onClick={() => setPhotoZoomOpen(true)}
                                        aria-label="사진 확대해서 보기"
                                    >
                                        <img src={displayPhoto} alt="진단 사진" />
                                    </button>
                                ) : (
                                    <div className="m-diagres-thumb-placeholder">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                            <polyline points="21 15 16 10 5 21"/>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="m-diagres-table-row">
                        <div className="m-diagres-table-label">진단일</div>
                        <div className="m-diagres-table-value">{displayDate}</div>
                    </div>
                    <div className="m-diagres-table-row">
                        <div className="m-diagres-table-label">대분류</div>
                        <div className="m-diagres-table-value">{displayBig}</div>
                    </div>
                    <div className="m-diagres-table-row">
                        <div className="m-diagres-table-label">중분류</div>
                        <div className="m-diagres-table-value">{displayMid}</div>
                    </div>

                    {/* 전체 평균 레이더 차트 */}
                    <RadarSection
                        title="전체 평균"
                        radarData={radarData}
                        avg={radarAvg}
                        count={stats.count}
                    />

                    {/* 시설물별 세부 정보 */}
                    <BreakdownSection
                        label="시설물별"
                        title={`시설물별 ${breakdown?.facility?.label || '전체'} 세부 정보`}
                        data={(breakdown?.facility?.radar?.length ? breakdown.facility.radar : FALLBACK_RADAR_DATA)}
                        count={breakdown?.facility?.count}
                        empty={!breakdown}
                    />

                    {/* 구역별 세부 정보 */}
                    <BreakdownSection
                        label="구역별"
                        title={`구역별 ${breakdown?.zone?.label || '전체'} 세부 정보`}
                        data={(breakdown?.zone?.radar?.length ? breakdown.zone.radar : FALLBACK_RADAR_DATA)}
                        count={breakdown?.zone?.count}
                        empty={!breakdown}
                    />

                    {/* 인원별 세부 정보 */}
                    <BreakdownSection
                        label="인원별"
                        title={`인원별 ${breakdown?.person?.label || '전체'} 세부 정보`}
                        data={(breakdown?.person?.radar?.length ? breakdown.person.radar : FALLBACK_RADAR_DATA)}
                        count={breakdown?.person?.count}
                        empty={!breakdown}
                    />
                </div>

                {/* 좋아요·댓글 섹션 — Figma 22:6387 */}
                <div className="m-diagres-reactions">
                    <div className="m-diagres-reaction-bar">
                        <span className="m-diagres-reaction-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>13</span>
                        </span>
                        <span className="m-diagres-reaction-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span>2</span>
                        </span>
                    </div>
                    <ul className="m-diagres-comments">
                        <li className="m-diagres-comment">
                            <div className="m-diagres-comment-head">
                                <span className="m-diagres-comment-user">citizen1024</span>
                                <span className="m-diagres-comment-date">2025.01.15</span>
                            </div>
                            <p className="m-diagres-comment-text">횡단보도 주변에 불법 주정차 차량이 많아 보행 시 시야 확보가 어렵습니다. 특히 출퇴근 시간대에 위험하다고 느낍니다.</p>
                        </li>
                        <li className="m-diagres-comment">
                            <div className="m-diagres-comment-head">
                                <span className="m-diagres-comment-user">busan_walk</span>
                                <span className="m-diagres-comment-date">2025.01.15</span>
                            </div>
                            <p className="m-diagres-comment-text">야간에 가로등 밝기가 부족해 보행 안전이 우려됩니다. 조명 추가 설치나 점검이 필요해 보입니다.</p>
                        </li>
                    </ul>
                </div>
            </main>

            {photoZoomOpen && displayPhoto && (
                <div
                    className="m-diagres-photo-modal"
                    role="dialog"
                    aria-label="진단 사진 확대"
                    onClick={() => setPhotoZoomOpen(false)}
                >
                    <button
                        type="button"
                        className="m-diagres-photo-close"
                        onClick={(e) => { e.stopPropagation(); setPhotoZoomOpen(false); }}
                        aria-label="닫기"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                    <img
                        src={displayPhoto}
                        alt="진단 사진 확대"
                        className="m-diagres-photo-zoom"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
