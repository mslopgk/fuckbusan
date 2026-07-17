import { useEffect, useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import MobileBottomNav from './MobileBottomNav';
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
            <text x={x} y={y + 9} textAnchor={textAnchor} className="m-diagres-tick-value">
                {point?.A?.toFixed(1)}
            </text>
        </g>
    );
}

// Figma 302:19985 진단결과1_시민 — 전체 핑크 / 시설물 보라 / 구역 파랑 / 인원 청록
const RADAR_COLORS = {
    total:    '#E6235A',
    facility: '#542AA3',
    zone:     '#005BE4',
    person:   '#0B9583',
};

// Figma 302:20225 진단결과2_전문가 — 섹션별 타일 틴트
const TILE_TINTS = {
    total:    '#f5f1fd',
    facility: '#fff6f9',
    zone:     '#eef5ff',
    person:   '#e7f8f5',
};

function RadarCard({ label, title, data, color }) {
    return (
        <div className="m-diagres-section-row">
            <div className="m-diagres-table-label">{label}</div>
            <div className="m-diagres-section-content">
                <div className="m-diagres-radar-card">
                    <p className="m-diagres-radar-card-title">{title}</p>
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
                                    stroke={color}
                                    strokeWidth={2}
                                    fill={color}
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

// 전문가 결과 — 적합/부적합/만족도 타일 카드 (Figma Frame 47 243x146)
function ExpertCard({ label, title, tint, stats }) {
    return (
        <div className="m-diagres-section-row m-diagres-section-row--expert">
            <div className="m-diagres-table-label">{label}</div>
            <div className="m-diagres-section-content">
                <div className="m-diagres-expert-card">
                    <p className="m-diagres-expert-card-title">{title}</p>
                    <div className="m-diagres-expert-tiles">
                        <div className="m-diagres-expert-tile" style={{ background: tint }}>
                            <span className="m-diagres-expert-tile-label">적합</span>
                            <span className="m-diagres-expert-tile-value">{stats.pass}/{stats.total}</span>
                        </div>
                        <div className="m-diagres-expert-tile" style={{ background: tint }}>
                            <span className="m-diagres-expert-tile-label">부적합</span>
                            <span className="m-diagres-expert-tile-value">{stats.fail}/{stats.total}</span>
                        </div>
                        <div className="m-diagres-expert-tile" style={{ background: tint }}>
                            <span className="m-diagres-expert-tile-label">만족도 평가</span>
                            <span className="m-diagres-expert-tile-value">{stats.avg}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MDiagnosisResult({ onNavigate, address = '부산 부산진구 초연로 6', date = null, photo = null, resultId = null, big = null, mid = null, target = null }) {
    const [stats, setStats] = useState({ avg: FALLBACK_TOTAL_AVG, count: FALLBACK_RESPONSES });
    const [resultDetail, setResultDetail] = useState(null);
    const [photoZoomOpen, setPhotoZoomOpen] = useState(false);
    const [breakdown, setBreakdown] = useState(null);
    const [comments, setComments] = useState([
        { id: 1, user: 'citizen1024', date: '2025.01.15', text: '횡단보도 주변에 불법 주정차 차량이 많아 보행 시 시야 확보가 어렵습니다. 특히 출퇴근 시간대에 위험하다고 느꼈습니다.' },
        { id: 2, user: 'busan_walk', date: '2025.01.15', text: '야간에 가로등 밝기가 부족해 보행 안전이 우려됩니다. 조명 추가 설치나 점검이 필요해 보입니다.' },
    ]);

    const isExpert = useMemo(() => {
        const t = resultDetail?.진단대상 ?? resultDetail?.target ?? target;
        return t === '전문가' || t === 'expert';
    }, [resultDetail, target]);

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

    // Parse answers once (radar + expert tiles)
    const parsedAnswers = useMemo(() => {
        if (!resultDetail?.answers) return null;
        try {
            return typeof resultDetail.answers === 'string'
                ? JSON.parse(resultDetail.answers)
                : resultDetail.answers;
        } catch {
            return null;
        }
    }, [resultDetail]);

    const radarData = useMemo(
        () => (parsedAnswers && buildRadarFromAnswers(parsedAnswers)) || FALLBACK_RADAR_DATA,
        [parsedAnswers],
    );

    // 전문가 타일 값 — 적합=5, 부적합=3(또는 2 미만 제외), 분모=전체 응답 수
    const expertStats = useMemo(() => {
        const values = parsedAnswers
            ? Object.values(parsedAnswers).map(Number).filter(Number.isFinite)
            : [];
        if (!values.length) return { pass: 14, fail: 14, total: 40, avg: '2.1' };
        const pass = values.filter((v) => v >= 4).length;
        const fail = values.filter((v) => v >= 2 && v < 4).length;
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
        return { pass, fail, total: values.length, avg };
    }, [parsedAnswers]);

    // Displayed date: prop → result created_at → today
    const displayDate = useMemo(() => {
        const norm = (s) => s.replace(/\//g, '-');
        if (date && date !== '2024/05/16') return norm(date);
        if (resultDetail?.created_at) {
            const d = new Date(resultDetail.created_at);
            if (!isNaN(d)) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (date) return norm(date);
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

    // Figma 302:19985: 전체 상태 라벨 표기는 "전체(All)" (백엔드는 "전체"로 반환)
    const asAllLabel = (l) => (!l || l === '전체' ? '전체(All)' : l);
    const facilityLabel = asAllLabel(breakdown?.facility?.label);
    const zoneLabel = asAllLabel(breakdown?.zone?.label);
    const personLabel = asAllLabel(breakdown?.person?.label);

    return (
        <div className="m-diagres-page">
            {/* 헤더 — Figma: back + teal 타이틀 (20px/700) */}
            <header className="m-diagres-topbar">
                <button
                    type="button"
                    className="m-diagres-back"
                    aria-label="뒤로"
                    onClick={() => onNavigate?.('mDiagnosisList')}
                >
                    <img src="/figma-assets/mobile-diagnosis/arrow_back.png" width="24" height="24" alt="" />
                </button>
                <span className="m-diagres-topbar-title">{isExpert ? '전문가 진단 결과' : '시민 진단 결과'}</span>
            </header>

            <main className="m-diagres-body">
                {/* 테이블 — Figma Frame 494 */}
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

                    {isExpert ? (
                        <>
                            <ExpertCard label="전체 평균" title="전체 결과" tint={TILE_TINTS.total} stats={expertStats} />
                            <ExpertCard label="시설물별" title={`시설물별 ${facilityLabel} 세부 정보`} tint={TILE_TINTS.facility} stats={expertStats} />
                            <ExpertCard label="구역별" title={`구역별 ${zoneLabel} 세부 정보`} tint={TILE_TINTS.zone} stats={expertStats} />
                            <ExpertCard label="인원별" title={`인원별 ${personLabel} 세부 정보`} tint={TILE_TINTS.person} stats={expertStats} />
                        </>
                    ) : (
                        <>
                            <RadarCard
                                label="전체 평균"
                                title={`${radarAvg} 전체 평균 (${stats.count})`}
                                data={radarData}
                                color={RADAR_COLORS.total}
                            />
                            <RadarCard
                                label="시설물별"
                                title={`시설물별 ${facilityLabel} 세부 정보`}
                                data={(breakdown?.facility?.radar?.length ? breakdown.facility.radar : FALLBACK_RADAR_DATA)}
                                color={RADAR_COLORS.facility}
                            />
                            <RadarCard
                                label="구역별"
                                title={`구역별 ${zoneLabel} 세부 정보`}
                                data={(breakdown?.zone?.radar?.length ? breakdown.zone.radar : FALLBACK_RADAR_DATA)}
                                color={RADAR_COLORS.zone}
                            />
                            <RadarCard
                                label="인원별"
                                title={`인원별 ${personLabel} 세부 정보`}
                                data={(breakdown?.person?.radar?.length ? breakdown.person.radar : FALLBACK_RADAR_DATA)}
                                color={RADAR_COLORS.person}
                            />
                        </>
                    )}
                </div>

                {/* 좋아요·댓글 — Figma Frame 502 */}
                <div className="m-diagres-reactions">
                    <div className="m-diagres-reaction-bar">
                        <span className="m-diagres-reaction-item">
                            <img src="/figma-assets/mobile-diagnosis/favorite_filled.png" width="16" height="16" alt="좋아요" />
                            <span>13</span>
                        </span>
                        <span className="m-diagres-reaction-item">
                            <img src="/figma-assets/mobile-diagnosis/comment_filled.png" width="16" height="16" alt="댓글" />
                            <span>2</span>
                        </span>
                    </div>
                    <ul className="m-diagres-comments">
                        {comments.map((c) => (
                            <li key={c.id} className="m-diagres-comment">
                                <div className="m-diagres-comment-head">
                                    <span className="m-diagres-comment-user">{c.user}</span>
                                    <span className="m-diagres-comment-date">{c.date}</span>
                                    <button
                                        type="button"
                                        className="m-diagres-comment-del"
                                        aria-label="댓글 삭제"
                                        onClick={() => setComments((prev) => prev.filter((x) => x.id !== c.id))}
                                    >
                                        <img src="/figma-assets/mobile-diagnosis/icon_delete.png" width="16" height="16" alt="" />
                                    </button>
                                </div>
                                <p className="m-diagres-comment-text">{c.text}</p>
                            </li>
                        ))}
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

            <MobileBottomNav currentView="mDiagnosisResult" onNavigate={onNavigate} />
        </div>
    );
}
