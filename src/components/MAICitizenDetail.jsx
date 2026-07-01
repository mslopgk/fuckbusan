import { useState, useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import PersonaChat from './PersonaChat';
import { API_URL } from '../utils/api';
import './MAICitizenDetail.css';

const CATEGORY_LABELS = ['안전', '주거', '교통', '산업일자리', '교육', '환경', '문화여가', '보건'];

const EMOTION_COLORS = {
    '기대됨': '#0da000',
    '개쾌함': '#0da000',
    '집중됨': '#c7a300',
    '보통': '#c7a300',
    '불안함': '#ff7200',
    '매우불안함': '#ff0000',
    '매우 불안함': '#ff0000',
};

function PersonIconsRow({ total = 5, highlighted = 1 }) {
    return (
        <div className="m-ai-detail__person-icons">
            {Array.from({ length: Math.min(total, 8) }, (_, i) => {
                const active = i >= total - highlighted;
                return (
                    <svg key={i} width="18" height="22" viewBox="0 0 16 20">
                        <circle cx="8" cy="5" r="3.5" fill={active ? '#23bdba' : '#c8e8e8'} />
                        <path d="M1 19c0-3.9 3.1-7 7-7s7 3.1 7 7" fill={active ? '#23bdba' : '#c8e8e8'} />
                    </svg>
                );
            })}
        </div>
    );
}

function CategoryRadar({ scores }) {
    if (!scores) return null;
    const CATS = ['안전', '주거', '교통', '산업\n일자리', '교육', '환경', '문화\n여가', '보건'];
    const SCORE_KEYS = ['안전', '주거', '교통', '산업일자리', '교육', '환경', '문화여가', '보건'];
    const SIZE = 200;
    const cx = SIZE / 2, cy = SIZE / 2;
    const maxR = 66;
    const n = CATS.length;
    const step = (2 * Math.PI) / n;

    const pt = (i, r) => {
        const a = i * step - Math.PI / 2;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    };

    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    const dataPts = SCORE_KEYS.map((k, i) => pt(i, ((scores[k] || 0) / 5) * maxR));
    const dPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

    return (
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block', margin: '8px auto 0' }}>
            {gridLevels.map((lv, li) => {
                const gPts = CATS.map((_, i) => pt(i, lv * maxR));
                const gPath = gPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
                return <path key={li} d={gPath} fill="none" stroke="#d9d9d9" strokeWidth="1" />;
            })}
            {CATS.map((_, i) => {
                const p = pt(i, maxR);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#d9d9d9" strokeWidth="1" />;
            })}
            <path d={dPath} fill="rgba(35,189,186,0.2)" stroke="#23bdba" strokeWidth="2" />
            {CATS.map((cat, i) => {
                const p = pt(i, maxR + 22);
                return cat.includes('\n') ? (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" fontSize="10" fill="#111111">
                        {cat.split('\n').map((ln, li) => (
                            <tspan key={li} x={p.x} dy={li === 0 ? '-0.5em' : '1.2em'}>{ln}</tspan>
                        ))}
                    </text>
                ) : (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#111111">{cat}</text>
                );
            })}
        </svg>
    );
}

function ParticipationBars({ data }) {
    if (!data) return null;
    const items = Object.entries(data);
    const max = Math.max(...items.map(([, v]) => v), 1);
    return (
        <div className="m-ai-detail__vbars">
            {items.map(([label, value]) => (
                <div key={label} className="m-ai-detail__vbar-col">
                    <span className="m-ai-detail__vbar-pct">{value}%</span>
                    <div className="m-ai-detail__vbar-track">
                        <div
                            className="m-ai-detail__vbar-fill"
                            style={{ height: `${Math.max(6, (value / max) * 90)}px` }}
                        />
                    </div>
                    <span className="m-ai-detail__vbar-label">{label}</span>
                </div>
            ))}
        </div>
    );
}

function JourneyTable({ journey }) {
    if (!journey || journey.length === 0) return null;
    const cols = journey.length;
    const gridCols = `28px repeat(${cols}, 1fr)`;
    return (
        <div className="m-ai-detail__journey-table-wrap">
            <div className="m-ai-detail__journey-table">
                {/* Step circles row */}
                <div className="m-ai-detail__journey-row m-ai-detail__journey-circles-row" style={{ gridTemplateColumns: gridCols }}>
                    <span className="m-ai-detail__journey-row-label" />
                    {journey.map((step, i) => (
                        <div key={i} className="m-ai-detail__journey-cell m-ai-detail__journey-circle-cell">
                            <div
                                className="m-ai-detail__journey-step-num"
                                style={{ background: EMOTION_COLORS[step.emotion] || '#c7a300' }}
                            >
                                {i + 1}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Action row */}
                <div className="m-ai-detail__journey-row" style={{ gridTemplateColumns: gridCols }}>
                    <span className="m-ai-detail__journey-row-label">행동</span>
                    {journey.map((step, i) => (
                        <div key={i} className="m-ai-detail__journey-cell">
                            <div className="m-ai-detail__journey-time">{step.time}</div>
                            <div className="m-ai-detail__journey-action">{step.action}</div>
                        </div>
                    ))}
                </div>
                {/* Feeling row */}
                <div className="m-ai-detail__journey-row" style={{ gridTemplateColumns: gridCols }}>
                    <span className="m-ai-detail__journey-row-label">감정</span>
                    {journey.map((step, i) => (
                        <div key={i} className="m-ai-detail__journey-cell m-ai-detail__journey-cell--feeling">
                            <span
                                className="m-ai-detail__journey-emotion"
                                style={{ color: EMOTION_COLORS[step.emotion] || '#c7a300' }}
                            >
                                {step.emotion}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function MAICitizenDetail({ citizen: initialCitizen, onNavigate }) {
    const [citizen, setCitizen] = useState(initialCitizen || null);
    const [detail, setDetail] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        if (!initialCitizen?.id) return;
        setLoading(true);
        fetch(`${API_URL}/api/ai-citizens/${initialCitizen.id}`)
            .then(r => r.json())
            .then(data => {
                setCitizen(data);
                setDetail(data.detail || null);
            })
            .catch(() => {})
            .finally(() => setLoading(false));

        fetch(`${API_URL}/api/ai-citizens/${initialCitizen.id}/avatar`)
            .then(r => r.json())
            .then(data => {
                if (data.url) setAvatarUrl(`${API_URL}${data.url}`);
            })
            .catch(() => {});
    }, [initialCitizen?.id]);

    if (!citizen) return (
        <>
            <div style={{ padding: '24px', textAlign: 'center', minHeight: 'calc(100vh - 76px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#888', marginBottom: 16 }}>시민 정보를 찾을 수 없습니다.</p>
                <button onClick={() => onNavigate?.('mAICitizen')} style={{ padding: '8px 20px', background: '#5B2EAB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>목록으로</button>
            </div>
            <MobileBottomNav currentView="mAICitizenDetail" onNavigate={onNavigate} />
        </>
    );

    const d = detail || {};
    const participation = d.participation || {};
    const journey = d.journey || [];
    const ps = d.policy_signals || {};
    const radarData = CATEGORY_LABELS.map(cat => ({
        subject: cat,
        value: d.category_scores?.[cat] ?? 1,
    }));

    const policyItems = [
        ...(ps.high || []).map(s => ({ level: 'high', text: s })),
        ...(ps.medium || []).map(s => ({ level: 'medium', text: s })),
        ...(ps.low || []).map(s => ({ level: 'low', text: s })),
    ];

    const totalMatch = (d.similar_desc || '').match(/약?\s*(\d+)명\s*중/);
    const personTotal = totalMatch ? Math.min(parseInt(totalMatch[1]), 8) : 5;
    // similar_ratio(예: "18.2%") 비율만큼 아이콘 강조 (최소 1개)
    const ratioPct = parseFloat(d.similar_ratio || '0') || 0;
    const highlighted = Math.min(personTotal, Math.max(1, Math.round(personTotal * ratioPct / 100)));

    return (
        <div className="m-ai-detail">
            {/* Top bar */}
            <div className="m-ai-detail__topbar">
                <button
                    className="m-ai-detail__back"
                    type="button"
                    onClick={() => onNavigate?.('mAICitizen')}
                    aria-label="뒤로가기"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <button className="m-ai-detail__chat" type="button" onClick={() => setChatOpen(true)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    채팅하기
                </button>
            </div>

            {chatOpen && (
                <PersonaChat
                    persona={{ ...citizen, avatarUrl }}
                    onClose={() => setChatOpen(false)}
                />
            )}

            <div className="m-ai-detail__scroll">
                {/* Hero: avatar + identity */}
                <div className="m-ai-detail__hero">
                    <div className="m-ai-detail__avatar-wrap">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="아바타" className="m-ai-detail__avatar-img" />
                        ) : (
                            <svg viewBox="0 0 75 94" width="100%" height="100%" style={{ display: 'block' }}>
                                <rect width="75" height="94" fill="#f0ece6"/>
                                <ellipse cx="37" cy="32" rx="16" ry="18" fill="#d4aa82"/>
                                <path d="M5 94 C5 60 37 52 37 52 C37 52 70 60 70 94 Z" fill="#d4aa82"/>
                            </svg>
                        )}
                    </div>
                    <div className="m-ai-detail__hero-info">
                        <div className="m-ai-detail__name-row">
                            <span className="m-ai-detail__name">{citizen.name}</span>
                            <span className="m-ai-detail__age-gender">
                                {citizen.age}세{citizen.gender ? ` · ${citizen.gender}` : ''}
                            </span>
                        </div>
                        <div className="m-ai-detail__tags">
                            {(citizen.tags || []).slice(0, 3).map(t => (
                                <span key={t} className="m-ai-detail__tag">{t}</span>
                            ))}
                        </div>
                        {/* Similarity ratio */}
                        <div className="m-ai-detail__ratio-section">
                            <div className="m-ai-detail__ratio-title">유사 시민 비율</div>
                            <div className="m-ai-detail__ratio-row">
                                <div className="m-ai-detail__ratio-pct">{d.similar_ratio || '-'}</div>
                                <PersonIconsRow total={personTotal} highlighted={highlighted} />
                            </div>
                            <div className="m-ai-detail__ratio-desc">{d.similar_desc || `${citizen.district || ''} 유사 생활 유형`}</div>
                        </div>
                    </div>
                </div>

                {/* Profile grid */}
                {(d.job || d.family || d.interests || d.hobbies || d.motto || d.dream_life || d.concerns || d.activities) && (
                    <div className="m-ai-detail__section">
                        <div className="m-ai-detail__profile-grid">
                            {[
                                ['직업', d.job],
                                ['가족', d.family],
                                ['좌우명', d.motto],
                                ['꿈꾸는 생활', d.dream_life],
                                ['관심사', d.interests],
                                ['고민', d.concerns],
                                ['취미', d.hobbies],
                                ['활동', d.activities],
                            ].filter(([, v]) => v).map(([label, value], i, arr) => (
                                <div key={label} className={`m-ai-detail__profile-row${i < arr.length - 1 ? '' : ' last'}`}>
                                    <dt className="m-ai-detail__profile-label">{label}</dt>
                                    <dd className="m-ai-detail__profile-value">{value}</dd>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quote section — 시민 체감 언어 */}
                {(d.body_language || citizen.quote) && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">시민 체감 언어</h3>
                        <div className="m-ai-detail__quote-block">
                            <span className="m-ai-detail__quote-open">❝</span>
                            <p className="m-ai-detail__quote-text">{d.body_language || citizen.quote}</p>
                            <span className="m-ai-detail__quote-close">❞</span>
                        </div>
                    </div>
                )}

                {/* 시민 목소리 */}
                {d.voices && d.voices.length > 0 && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">시민 목소리</h3>
                        <div className="m-ai-detail__voices">
                            {d.voices.map((v, i) => (
                                <div key={i} className="m-ai-detail__voice-item">
                                    <span className="m-ai-detail__voice-num">0{i + 1}</span>
                                    <span className="m-ai-detail__voice-text">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 핵심 이슈 */}
                {d.top_issues && d.top_issues.length > 0 && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">핵심 이슈 TOP 3</h3>
                        <div className="m-ai-detail__issues">
                            {d.top_issues.map((issue, i) => (
                                <div key={i} className="m-ai-detail__issue-item">
                                    <span className="m-ai-detail__issue-num">0{i + 1}</span>
                                    <span className="m-ai-detail__issue-text">{issue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 여정지도 */}
                {journey.length > 0 && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">여정지도</h3>
                        <JourneyTable journey={journey} />
                    </div>
                )}

                {/* 정책 신호등 */}
                {policyItems.length > 0 && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">정책 신호등</h3>
                        <div className="m-ai-detail__policy-legend">
                            <span className="m-ai-detail__policy-badge m-ai-detail__policy-badge--high">높음</span>
                            <span className="m-ai-detail__policy-badge m-ai-detail__policy-badge--medium">보통</span>
                            <span className="m-ai-detail__policy-badge m-ai-detail__policy-badge--low">낮음</span>
                        </div>
                        <div className="m-ai-detail__policies">
                            {policyItems.map((p, i) => (
                                <div key={i} className={`m-ai-detail__policy-row m-ai-detail__policy-row--${p.level}`}>
                                    <div className="m-ai-detail__policy-light">
                                        <span className="m-ai-detail__policy-dot" style={{
                                            background: p.level === 'high' ? '#ff0000' : p.level === 'medium' ? '#ff6100' : '#029e50'
                                        }} />
                                    </div>
                                    <span className="m-ai-detail__policy-text" style={{
                                        color: p.level === 'high' ? '#ff0000' : p.level === 'medium' ? '#df7700' : '#333',
                                        fontWeight: p.level === 'high' ? 600 : p.level === 'medium' ? 500 : 400,
                                    }}>{p.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 공공데이터 참여 현황 */}
                {Object.keys(participation).length > 0 && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">공공데이터 참여 현황 (참여 비율)</h3>
                        <ParticipationBars data={participation} />
                        {d.participation_note && (
                            <p className="m-ai-detail__participation-note">{d.participation_note}</p>
                        )}
                    </div>
                )}

                {/* 카테고리별 관심도 */}
                {radarData.some(d => d.value > 0) && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">카테고리별 관심도 (8대 영역)</h3>
                        <CategoryRadar scores={d.category_scores} />
                    </div>
                )}

                {/* Footer */}
                <div className="m-ai-detail__footer">
                    <p className="m-ai-detail__footer-desc">
                        이 리포트는 {citizen.district || '부산'} 시민 의견과 공공데이터를 기반으로 AI 분석을 통해 생성된 가상 인물입니다.
                    </p>
                    <button
                        className="m-ai-detail__footer-btn"
                        type="button"
                        onClick={() => onNavigate?.('mAICitizen')}
                    >
                        다른 시민 유형 보기 &gt;
                    </button>
                </div>

                <div style={{ height: 80 }} />
            </div>

            <MobileBottomNav currentView="mAICitizenDetail" onNavigate={onNavigate} />
        </div>
    );
}
