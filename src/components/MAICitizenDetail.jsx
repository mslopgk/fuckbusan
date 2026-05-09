import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import MobileBottomNav from './MobileBottomNav';
import { API_URL } from '../utils/api';
import './MAICitizenDetail.css';

const EMOTION_COLORS = {
    '개쾌함': '#23bdbb',
    '집중됨': '#5B2EAB',
    '보통': '#888',
    '불안함': '#E6235A',
    '매우불안함': '#c00',
};

const CATEGORY_LABELS = ['안전', '주거', '교통', '산업일자리', '교육', '환경', '문화여가', '보건'];

export default function MAICitizenDetail({ citizen: initialCitizen, onNavigate }) {
    const [citizen, setCitizen] = useState(initialCitizen || null);
    const [detail, setDetail] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(false);

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

    if (!citizen) return null;

    const d = detail || {};
    const participation = d.participation || {};
    const maxParticipation = Math.max(...Object.values(participation), 1);
    const radarData = CATEGORY_LABELS.map(cat => ({
        subject: cat,
        value: d.category_scores?.[cat] ?? 1,
        fullMark: 5,
    }));

    const policyPriorities = [
        ...(d.policy_signals?.high || []).map(s => ({ level: 'high', text: s })),
        ...(d.policy_signals?.medium || []).map(s => ({ level: 'medium', text: s })),
        ...(d.policy_signals?.low || []).map(s => ({ level: 'low', text: s })),
    ];

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
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="m-ai-detail__header-name">
                    <span className="m-ai-detail__name">{citizen.name}</span>
                    <span className="m-ai-detail__age">{citizen.age}세</span>
                    {citizen.gender && <span className="m-ai-detail__gender">{citizen.gender}</span>}
                </div>
                {d.similar_ratio && (
                    <div className="m-ai-detail__ratio-badge">{d.similar_ratio}</div>
                )}
            </div>

            <div className="m-ai-detail__scroll">
                {/* Avatar + similar ratio */}
                <div className="m-ai-detail__hero">
                    <div className="m-ai-detail__avatar-wrap">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="아바타" className="m-ai-detail__avatar-img" />
                        ) : (
                            <svg viewBox="0 0 100 100" width="96" height="96" style={{ display: 'block' }}>
                                <circle cx="50" cy="50" r="50" fill="#f2dfc8"/>
                                <circle cx="50" cy="36" r="17" fill="#d4aa82"/>
                                <path d="M18 100 C18 70 50 65 50 65 C50 65 82 70 82 100 Z" fill="#d4aa82"/>
                            </svg>
                        )}
                    </div>
                    <div className="m-ai-detail__hero-info">
                        <div className="m-ai-detail__tags">
                            {(citizen.tags || []).slice(0, 3).map(t => (
                                <span key={t} className="m-ai-detail__tag">{t}</span>
                            ))}
                        </div>
                        {d.similar_ratio && (
                            <div className="m-ai-detail__similar">
                                <span className="m-ai-detail__similar-ratio">{d.similar_ratio}</span>
                                <span className="m-ai-detail__similar-desc">{d.similar_desc}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile info grid */}
                {(d.job || d.family || d.interests || d.hobbies) && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">시민 정보</h3>
                        <div className="m-ai-detail__info-grid">
                            {d.job && <><dt>직업</dt><dd>{d.job}</dd></>}
                            {citizen.district && <><dt>거주지역</dt><dd>{citizen.district}</dd></>}
                            {d.interests && <><dt>관심사</dt><dd>{d.interests}</dd></>}
                            {d.hobbies && <><dt>취미</dt><dd>{d.hobbies}</dd></>}
                            {d.concerns && <><dt>주요관심</dt><dd>{d.concerns}</dd></>}
                            {d.dream_life && <><dt>희망사항</dt><dd>{d.dream_life}</dd></>}
                        </div>
                    </div>
                )}

                {/* Key quote */}
                {(d.body_language || citizen.quote) && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">시민 발언</h3>
                        <div className="m-ai-detail__quote-bubble">
                            <p>{d.body_language || citizen.quote}</p>
                        </div>
                        {d.voices && d.voices.length > 0 && (
                            <ul className="m-ai-detail__voices">
                                {d.voices.map((v, i) => (
                                    <li key={i}>{v}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Top issues */}
                {d.top_issues && d.top_issues.length > 0 && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">주요 이슈</h3>
                        <div className="m-ai-detail__issues">
                            {d.top_issues.map((issue, i) => (
                                <div key={i} className="m-ai-detail__issue-card">
                                    <span className="m-ai-detail__issue-num">0{i + 1}</span>
                                    <span className="m-ai-detail__issue-text">{issue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Journey timeline */}
                {d.journey && d.journey.length > 0 && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">행동 시나리오</h3>
                        <div className="m-ai-detail__journey">
                            {d.journey.map((step, i) => (
                                <div key={i} className="m-ai-detail__journey-step">
                                    <div className="m-ai-detail__journey-dot" style={{ background: EMOTION_COLORS[step.emotion] || '#888' }} />
                                    <div className="m-ai-detail__journey-content">
                                        <div className="m-ai-detail__journey-time">{step.time}</div>
                                        <div className="m-ai-detail__journey-action">{step.action}</div>
                                        <div className="m-ai-detail__journey-feeling">{step.feeling}</div>
                                        <span className="m-ai-detail__journey-emotion" style={{ background: EMOTION_COLORS[step.emotion] || '#888' }}>
                                            {step.emotion}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Policy priorities */}
                {policyPriorities.length > 0 && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">정책 선호도</h3>
                        <div className="m-ai-detail__policies">
                            {policyPriorities.map((p, i) => (
                                <div key={i} className={`m-ai-detail__policy-item m-ai-detail__policy--${p.level}`}>
                                    <span className="m-ai-detail__policy-badge">
                                        {p.level === 'high' ? '높음' : p.level === 'medium' ? '중간' : '낮음'}
                                    </span>
                                    <span className="m-ai-detail__policy-text">{p.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Participation bar chart */}
                {Object.keys(participation).length > 0 && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">공공서비스 실천 현황</h3>
                        <div className="m-ai-detail__bars">
                            {Object.entries(participation).map(([label, val]) => (
                                <div key={label} className="m-ai-detail__bar-row">
                                    <span className="m-ai-detail__bar-label">{label}</span>
                                    <div className="m-ai-detail__bar-track">
                                        <div
                                            className="m-ai-detail__bar-fill"
                                            style={{ width: `${(val / maxParticipation) * 100}%` }}
                                        />
                                    </div>
                                    <span className="m-ai-detail__bar-val">{val}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Radar chart */}
                {radarData.some(d => d.value > 0) && (
                    <div className="m-ai-detail__section">
                        <h3 className="m-ai-detail__section-title">카테고리별 관심도</h3>
                        <div className="m-ai-detail__radar-wrap">
                            <ResponsiveContainer width="100%" height={240}>
                                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                                    <PolarGrid stroke="#e0e0e0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#555' }} />
                                    <Radar
                                        name="관심도"
                                        dataKey="value"
                                        stroke="#23bdbb"
                                        fill="#23bdbb"
                                        fillOpacity={0.3}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div style={{ height: 100 }} />
            </div>

            <MobileBottomNav currentView="mAICitizenDetail" onNavigate={onNavigate} />
        </div>
    );
}
