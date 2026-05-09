import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const RADAR_AXES = ['접근성', '이동성', '안전성', '정보제공성', '포용성', '심미성'];

// 시민 진단: 4개 행(전체평균/시설물별/구역별/인원별) — 각 행이 레이더 차트
const CITIZEN_CHARTS = [
    { id: 'all',      label: '전체 평균', title: '1.87 전체 평균 (36)',          values: { 접근성: 2.0, 이동성: 2.0, 안전성: 1.8, 정보제공성: 1.9, 포용성: 1.8, 심미성: 1.7 }, fill: '#FFC1C1' },
    { id: 'facility', label: '시설물별',  title: '시설물별 전체(All) 세부 정보', values: { 접근성: 2.3, 이동성: 2.0, 안전성: 3.8, 정보제공성: 1.7, 포용성: 1.7, 심미성: 2.8 }, fill: '#C9B5FF' },
    { id: 'zone',     label: '구역별',    title: '구역별 전체(All) 세부 정보',   values: { 접근성: 2.3, 이동성: 2.0, 안전성: 3.8, 정보제공성: 1.7, 포용성: 1.7, 심미성: 2.8 }, fill: '#7AB8FF' },
    { id: 'person',   label: '인원별',    title: '인원별 전체(All) 세부 정보',   values: { 접근성: 2.3, 이동성: 2.0, 안전성: 3.8, 정보제공성: 1.7, 포용성: 1.7, 심미성: 2.8 }, fill: '#7DDDD0' },
];

// 전문가 진단: 4개 행 — 각 행이 3개 score 카드 (적합/부적합/만족도 평가)
const EXPERT_ROWS = [
    { id: 'all',      label: '전체 평균', title: '전체 결과',                    cards: [{ k: '적합', v: '14/40' }, { k: '부적합', v: '14/40' }, { k: '만족도 평가', v: '2.1' }] },
    { id: 'facility', label: '시설물별',  title: '시설물별 전체(All) 세부 정보', cards: [{ k: '적합', v: '14/40' }, { k: '부적합', v: '14/40' }, { k: '만족도 평가', v: '2.1' }] },
    { id: 'zone',     label: '구역별',    title: '구역별 전체(All) 세부 정보',   cards: [{ k: '적합', v: '14/40' }, { k: '부적합', v: '14/40' }, { k: '만족도 평가', v: '2.1' }] },
    { id: 'person',   label: '인원별',    title: '인원별 전체(All) 세부 정보',   cards: [{ k: '적합', v: '14/40' }, { k: '부적합', v: '14/40' }, { k: '만족도 평가', v: '2.1' }] },
];

const COMMENTS = [
    { id: 1, author: 'citizen1024', date: '2025.01.15', text: '횡단보도 주변에 불법 주정차 차량이 많아 보행 시 시야 확보가 어렵습니다. 특히 출퇴근 시간대에 위험하다고 느꼈습니다.' },
    { id: 2, author: 'busan_walk',  date: '2025.01.15', text: '야간에 가로등 밝기가 부족해 보행 안전이 우려됩니다. 조명 추가 설치나 점검이 필요해 보입니다.' },
];

function chartData(values) {
    return RADAR_AXES.map((axis) => ({ subject: axis, A: values[axis], fullMark: 5 }));
}

function CustomTick({ payload, x, y, textAnchor, data }) {
    const point = data.find((d) => d.subject === payload.value);
    return (
        <g>
            <text x={x} y={y - 2} textAnchor={textAnchor} className="pc-detail-tick-label">
                {payload.value}
            </text>
            <text x={x} y={y + 12} textAnchor={textAnchor} className="pc-detail-tick-value">
                {point?.A?.toFixed(1)}
            </text>
        </g>
    );
}

function MetaRows({ data }) {
    return (
        <>
            <tr><th>위치</th><td>{data.location}</td></tr>
            <tr><th>사진</th><td><div className="pc-detail-photo-thumb" /></td></tr>
            <tr><th>진단일</th><td>{data.date}</td></tr>
            <tr><th>대분류</th><td>{data.bigTag}</td></tr>
            <tr><th>중분류</th><td><u>{data.midTag}</u></td></tr>
        </>
    );
}

function StatBar({ likes, comments }) {
    return (
        <div className="pc-detail-stats">
            <span className="pc-detail-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#E6235A"><path d="M12 21s-6.5-4.35-9.5-8.6C0 8.5 2.5 5 6 5c1.7 0 3.3.8 4.3 2.1C11.3 5.8 12.9 5 14.6 5c3.5 0 6 3.5 3.5 7.4-3 4.25-9.5 8.6-9.5 8.6h-.6z"/></svg>
                {likes}
            </span>
            <span className="pc-detail-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#737373"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {comments}
            </span>
        </div>
    );
}

function CommentList() {
    return (
        <ul className="pc-detail-comment-list">
            {COMMENTS.map((c) => (
                <li key={c.id}>
                    <div className="pc-detail-comment-head">
                        <strong>{c.author}</strong>
                        <span>{c.date}</span>
                    </div>
                    <p>{c.text}</p>
                </li>
            ))}
        </ul>
    );
}

export default function PCDiagPanelDetail({ item, onAddDiagnosis, mode = 'citizen' }) {
    const data = item || {
        title: '전기자전거 재고 불균형 해결 제안',
        author: '동래구 우리디자이너',
        big: '주거', mid: '시설물(거리/골목쓰레기통 등)',
        likes: 13, comments: 2,
        location: '부산 부산진구 초연로 6',
        date: '2024-05-16',
        bigTag: '보도', midTag: '보행공간',
    };

    const isExpert = mode === 'expert';

    return (
        <div className="pc-detail-single">
            <section className="pc-detail-col">
                <h2 className="pc-detail-col-title">{isExpert ? '전문가 진단정보' : '시민 진단정보'}</h2>
                <table className="pc-detail-table">
                    <tbody>
                        <MetaRows data={data} />
                        {!isExpert && CITIZEN_CHARTS.map((c) => {
                            const chart = chartData(c.values);
                            return (
                                <tr key={c.id}>
                                    <th>{c.label}</th>
                                    <td>
                                        <div className="pc-detail-chart-card">
                                            <p className="pc-detail-chart-title">{c.title}</p>
                                            <div className="pc-detail-chart-canvas">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chart}>
                                                        <PolarGrid stroke="#dadde2" />
                                                        <PolarAngleAxis dataKey="subject" tick={(p) => <CustomTick {...p} data={chart} />} />
                                                        <Radar name="Score" dataKey="A" stroke={c.fill} strokeWidth={2} fill={c.fill} fillOpacity={0.4} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {isExpert && EXPERT_ROWS.map((row) => (
                            <tr key={row.id}>
                                <th>{row.label}</th>
                                <td>
                                    <div className="pc-detail-expert-card">
                                        <p className="pc-detail-chart-title">{row.title}</p>
                                        <div className="pc-detail-expert-cards">
                                            {row.cards.map((c) => (
                                                <div key={c.k} className="pc-detail-score-card">
                                                    <div className="pc-detail-score-key">{c.k}</div>
                                                    <div className="pc-detail-score-val">{c.v}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <StatBar likes={data.likes} comments={data.comments} />
                <CommentList />
            </section>

            {onAddDiagnosis && (
                <div className="pc-detail-cta-wrap">
                    <button type="button" className="pc-diag-panel-cta" onClick={onAddDiagnosis}>
                        + 진단하기
                    </button>
                </div>
            )}
        </div>
    );
}
