import { useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import MapToolbar from './PCMapToolbar';
import './PCMapShared.css';
import './PCDiagnosisDetail.css';

const RADAR_AXES = ['접근성', '이동성', '안전성', '정보제공성', '포용성', '심미성'];

// 4개 차트의 더미 데이터 (Figma 941:11592 값)
const CHARTS = [
    { id: 'all',      title: '1.87 전체 평균 (36)',          values: { 접근성: 2.0, 이동성: 2.0, 안전성: 1.8, 정보제공성: 1.9, 포용성: 1.8, 심미성: 1.7 } },
    { id: 'facility', title: '시설물별 전체(All) 세부 정보', values: { 접근성: 2.3, 이동성: 2.0, 안전성: 3.8, 정보제공성: 1.7, 포용성: 1.7, 심미성: 2.8 } },
    { id: 'zone',     title: '구역별 전체(All) 세부 정보',   values: { 접근성: 2.3, 이동성: 2.0, 안전성: 3.8, 정보제공성: 1.7, 포용성: 1.7, 심미성: 2.8 } },
    { id: 'person',   title: '인원별 전체(All) 세부 정보',   values: { 접근성: 2.3, 이동성: 2.0, 안전성: 3.8, 정보제공성: 1.7, 포용성: 1.7, 심미성: 2.8 } },
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

// Figma 941:11961(진단상세02): 동일 레이아웃 + 하단 CTA 버튼. variant prop으로 분기
export default function PCDiagnosisDetail({ onNavigate, item, variant = '01' }) {
    const data = item || {
        title: '전기자전거 재고 불균형 해결 제안',
        author: '동래구 우리디자이너',
        big: '주거', mid: '시설물(거리/골목쓰레기통 등)',
        likes: 13, comments: 2,
        location: '부산 부산진구 초연로 6',
        date: '2024-05-16',
        bigTag: '보도', midTag: '보행공간',
    };
    const mapRef = useRef(null);

    return (
        <UserPCLayout currentView="pcDiagnosisDetail" onNavigate={onNavigate}>
            <div className="pc-detail-page">
                {/* CENTER MAP */}
                <div className="pc-detail-canvas">
                    <PCMapCanvas
                        ref={mapRef}
                        pins={[]}
                        accentColor="#23BDBB"
                    />
                    <MapToolbar mapRef={mapRef} />
                    {variant === '02' && (
                        <button
                            type="button"
                            className="pc-detail-bottom-cta"
                            onClick={() => onNavigate?.('pcDiagnosisDone')}
                        >완료</button>
                    )}
                </div>

                {/* LEFT FILTER PANEL (간소화) */}
                <aside className="pc-detail-filter">
                    <div className="pc-detail-section">
                        <div className="pc-detail-section-label">구역별</div>
                        <div className="pc-detail-dropdown">
                            <span>중구</span>
                            <button type="button" className="pc-detail-dropdown-x" aria-label="초기화">×</button>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="pc-detail-back"
                        onClick={() => onNavigate?.('pcDiagnosisMap')}
                    >← 지도로 돌아가기</button>
                </aside>

                {/* RIGHT DETAIL PANEL — 진단 분석 + 댓글 */}
                <aside className="pc-detail-right">
                    <h2 className="pc-detail-title">시민 진단정보</h2>

                    <dl className="pc-detail-meta">
                        <div className="pc-detail-meta-row"><dt>위치</dt><dd>{data.location}</dd></div>
                        <div className="pc-detail-meta-row pc-detail-meta-photo">
                            <dt>사진</dt>
                            <dd><div className="pc-detail-photo-thumb" /></dd>
                        </div>
                        <div className="pc-detail-meta-row"><dt>진단일</dt><dd>{data.date}</dd></div>
                        <div className="pc-detail-meta-row"><dt>대분류</dt><dd>{data.bigTag}</dd></div>
                        <div className="pc-detail-meta-row"><dt>중분류</dt><dd>{data.midTag}</dd></div>
                    </dl>

                    {CHARTS.map((c) => {
                        const chart = chartData(c.values);
                        return (
                            <section key={c.id} className="pc-detail-chart-row">
                                <div className="pc-detail-chart-label">
                                    {c.id === 'all'      ? '전체 평균'
                                     : c.id === 'facility' ? '시설물별'
                                     : c.id === 'zone'     ? '구역별' : '인원별'}
                                </div>
                                <div className="pc-detail-chart-card">
                                    <p className="pc-detail-chart-title">{c.title}</p>
                                    <div className="pc-detail-chart-canvas">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="68%" data={chart}>
                                                <PolarGrid stroke="#dadde2" />
                                                <PolarAngleAxis dataKey="subject" tick={(props) => <CustomTick {...props} data={chart} />} />
                                                <Radar name="Score" dataKey="A" stroke="#E6235A" strokeWidth={2} fill="#E6235A" fillOpacity={0.25} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </section>
                        );
                    })}

                    {/* 댓글 */}
                    <section className="pc-detail-comments">
                        <div className="pc-detail-comments-head">
                            <span className="pc-detail-stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#E6235A"><path d="M12 21s-6.5-4.35-9.5-8.6C0 8.5 2.5 5 6 5c1.7 0 3.3.8 4.3 2.1C11.3 5.8 12.9 5 14.6 5c3.5 0 6 3.5 3.5 7.4-3 4.25-9.5 8.6-9.5 8.6h-.6z"/></svg>
                                {data.likes}
                            </span>
                            <span className="pc-detail-stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#737373"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                {data.comments}
                            </span>
                        </div>
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
                    </section>
                </aside>
            </div>
        </UserPCLayout>
    );
}
