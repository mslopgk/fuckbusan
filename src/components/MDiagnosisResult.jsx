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
                                    stroke="#E6235A"
                                    strokeWidth={2}
                                    fill="#E6235A"
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
                                    <img src={displayPhoto} alt="진단 사진" />
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
                    <div className="m-diagres-section-row">
                        <div className="m-diagres-section-label">시설물별</div>
                        <div className="m-diagres-section-content">
                            <div className="m-diagres-radar-card m-diagres-radar-card--disabled">
                                <p className="m-diagres-radar-card-title">시설물별 전체(All) 세부 정보</p>
                                <div className="m-diagres-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={FALLBACK_RADAR_DATA}>
                                            <PolarGrid stroke="#dadde2" />
                                            <PolarAngleAxis
                                                dataKey="subject"
                                                tick={(props) => <CustomTick {...props} radarData={FALLBACK_RADAR_DATA} />}
                                            />
                                            <Radar
                                                name="Score"
                                                dataKey="A"
                                                stroke="#E6235A"
                                                strokeWidth={2}
                                                fill="#E6235A"
                                                fillOpacity={0.15}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 구역별 세부 정보 */}
                    <div className="m-diagres-section-row">
                        <div className="m-diagres-section-label">구역별</div>
                        <div className="m-diagres-section-content">
                            <div className="m-diagres-radar-card m-diagres-radar-card--disabled">
                                <p className="m-diagres-radar-card-title">구역별 전체(All) 세부 정보</p>
                                <div className="m-diagres-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={FALLBACK_RADAR_DATA}>
                                            <PolarGrid stroke="#dadde2" />
                                            <PolarAngleAxis
                                                dataKey="subject"
                                                tick={(props) => <CustomTick {...props} radarData={FALLBACK_RADAR_DATA} />}
                                            />
                                            <Radar
                                                name="Score"
                                                dataKey="A"
                                                stroke="#E6235A"
                                                strokeWidth={2}
                                                fill="#E6235A"
                                                fillOpacity={0.15}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 인원별 세부 정보 */}
                    <div className="m-diagres-section-row">
                        <div className="m-diagres-section-label">인원별</div>
                        <div className="m-diagres-section-content">
                            <div className="m-diagres-radar-card m-diagres-radar-card--disabled">
                                <p className="m-diagres-radar-card-title">인원별 전체(All) 세부 정보</p>
                                <div className="m-diagres-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={FALLBACK_RADAR_DATA}>
                                            <PolarGrid stroke="#dadde2" />
                                            <PolarAngleAxis
                                                dataKey="subject"
                                                tick={(props) => <CustomTick {...props} radarData={FALLBACK_RADAR_DATA} />}
                                            />
                                            <Radar
                                                name="Score"
                                                dataKey="A"
                                                stroke="#E6235A"
                                                strokeWidth={2}
                                                fill="#E6235A"
                                                fillOpacity={0.15}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
