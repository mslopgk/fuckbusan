import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const RADAR_AXES = ['접근성', '이동성', '안전성', '정보제공성', '포용성', '심미성'];

// ⚠️ 임시(대표 지시 2026-07-21): 진단폼 만족도 답변으로 6각형 "억지" 산출.
// answers(문항 순서)를 앞 축부터 채우고 남는 축은 답변 평균. 축 라벨=문항 의미 아님(보여주기용).
// 상세: docs/진단-육각형-임시산출.md
function radarFromAnswers(raw) {
    let parsed = raw;
    if (typeof raw === 'string') { try { parsed = JSON.parse(raw); } catch { return []; } }
    if (!parsed || typeof parsed !== 'object') return [];
    const vals = Object.keys(parsed)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => Number(parsed[k]))
        .filter(Number.isFinite);
    if (vals.length === 0) return [];
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return RADAR_AXES.map((subject, i) => ({
        subject,
        A: i < vals.length ? vals[i] : Number(avg.toFixed(2)),
        fullMark: 5,
    }));
}

function CustomTick({ payload, x, y, textAnchor, data }) {
    const point = data.find((d) => d.subject === payload.value);
    return (
        <g>
            <text
                x={x}
                y={y - 2}
                textAnchor={textAnchor}
                style={{ fill: '#808080', fontSize: 8.739, fontFamily: 'inherit' }}
            >
                {payload.value}
            </text>
            <text
                x={x}
                y={y + 11}
                textAnchor={textAnchor}
                style={{ fill: '#000', fontSize: 10.196, fontWeight: 700, fontFamily: 'inherit' }}
            >
                {point?.A > 0 ? point.A.toFixed(1) : '—'}
            </text>
        </g>
    );
}

export default function PCDiagPanelDetail({ item, onAddDiagnosis, onBack, mode = 'citizen' }) {
    const [lightbox, setLightbox] = useState(false);
    const data = item || {};
    const location = data.location || data.region || null;
    const imageUrl = data.imageUrl || data.thumb || null;
    const date = data.date || null;
    const bigTag = data.bigTag || data.big || null;
    const midTag = data.midTag || data.mid || null;

    const isExpert = mode === 'expert';
    const peers = item?.sessionPeers || [];

    // 시민 6각형 — 이 진단의 만족도 답변으로 산출(임시). 답변 없으면 빈 배열 → "데이터 준비중".
    const citizenChart = radarFromAnswers(item?.answers);
    const citizenAvg = citizenChart.length
        ? (citizenChart.reduce((s, d) => s + d.A, 0) / citizenChart.length).toFixed(2)
        : null;

    // 전문가: sessionPeers 실점수로 적합/부적합/만족도 집계 (점수 3 이상=적합, 만족도=평균)
    const expScored = peers.filter((p) => p.score != null);
    const expTotal = expScored.length;
    const expPass = expScored.filter((p) => p.score >= 3).length;
    const expAvg = expTotal
        ? (expScored.reduce((s, p) => s + p.score, 0) / expTotal).toFixed(1)
        : null;
    const expertCards = expTotal
        ? [
            { k: '적합', v: `${expPass}/${expTotal}` },
            { k: '부적합', v: `${expTotal - expPass}/${expTotal}` },
            { k: '만족도 평가', v: expAvg },
        ]
        : [
            { k: '적합', v: '—' },
            { k: '부적합', v: '—' },
            { k: '만족도 평가', v: '—' },
        ];

    return (
        <div className="pc-diagpanel-detail">
            {/* Figma 302:6380/6381 — back chevron 위, 타이틀 아래 (18px w500 teal) */}
            {onBack && (
                <button
                    type="button"
                    className="pc-diagpanel-back"
                    onClick={onBack}
                    aria-label="목록으로"
                >
                    <img src="/figma-assets/icons/icon_back_arrow.svg" alt="" width="8" height="14" />
                </button>
            )}
            <h2 className="pc-diagpanel-title">
                {isExpert ? '전문가 진단정보' : '시민 진단정보'}
            </h2>

            <table className={`pc-diagpanel-table${isExpert ? ' pc-diagpanel-table--expert' : ''}`}>
                <tbody>
                    <tr>
                        <th>위치</th>
                        <td>{location || '—'}</td>
                    </tr>
                    <tr>
                        <th>사진</th>
                        <td>
                            <div
                                className="pc-diagpanel-photo"
                                style={{
                                    ...(imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}),
                                    cursor: imageUrl ? 'zoom-in' : 'default',
                                }}
                                onClick={() => imageUrl && setLightbox(true)}
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>진단일</th>
                        <td>{date || '—'}</td>
                    </tr>
                    <tr>
                        <th>대분류</th>
                        <td>{bigTag || '—'}</td>
                    </tr>
                    <tr>
                        <th>중분류</th>
                        <td>{midTag || '—'}</td>
                    </tr>

                    {!isExpert && (
                        <tr>
                            <th>전체 평균</th>
                            <td>
                                <div className="pc-diagpanel-chart-card">
                                    <p className="pc-diagpanel-chart-title">
                                        {citizenAvg
                                            ? <><strong>{citizenAvg}</strong> 전체 평균</>
                                            : '전체 평균'}
                                    </p>
                                    {citizenChart.length >= 3 ? (
                                        <div className="pc-diagpanel-chart-canvas">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="58%" data={citizenChart}>
                                                    <PolarGrid stroke="#e6e6e6" />
                                                    <PolarAngleAxis
                                                        dataKey="subject"
                                                        tick={(p) => <CustomTick {...p} data={citizenChart} />}
                                                    />
                                                    <Radar
                                                        name="Score"
                                                        dataKey="A"
                                                        stroke="#f4879e"
                                                        strokeWidth={1.5}
                                                        fill="#FFC1C1"
                                                        fillOpacity={0.5}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="pc-diagpanel-chart-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
                                            데이터 준비중
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )}

                    {isExpert && (
                        <tr>
                            <th>전체 평균</th>
                            <td>
                                {/* Figma 302:7220 — 218x146 r8 stroke #e6e6e6 카드. sessionPeers 실집계. */}
                                <div className="pc-diagpanel-expert-card">
                                    <p className="pc-diagpanel-expert-title">
                                        전체 결과{expTotal ? ` (${expTotal})` : ''}
                                    </p>
                                    <div className="pc-diagpanel-expert-cards">
                                        {expertCards.map((c) => (
                                            <div key={c.k} className="pc-diagpanel-score-card">
                                                <div className="pc-diagpanel-score-key">{c.k}</div>
                                                <div className="pc-diagpanel-score-val">{c.v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {onAddDiagnosis && (
                <div className="pc-diagpanel-cta-wrap">
                    <button
                        type="button"
                        className="pc-diagpanel-cta-btn"
                        onClick={onAddDiagnosis}
                    >
                        진단하기
                    </button>
                </div>
            )}

            {lightbox && imageUrl && createPortal(
                <div
                    onClick={() => setLightbox(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 99999,
                        background: 'rgba(0,0,0,0.88)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'zoom-out',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setLightbox(false)}
                        style={{
                            position: 'fixed', top: 20, right: 24,
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            borderRadius: '50%', width: 44, height: 44,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        aria-label="닫기"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                    <img
                        src={imageUrl}
                        alt="진단 사진"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '92vw', maxHeight: '92vh',
                            borderRadius: 10, boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
                            objectFit: 'contain', cursor: 'default',
                        }}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}
