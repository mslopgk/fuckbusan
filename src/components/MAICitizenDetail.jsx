import { useState, useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import PersonaChat from './PersonaChat';
import { API_URL } from '../utils/api';
import './MAICitizenDetail.css';

/* 모바일 AI 가상시민 상세 — Figma 302:15408 (섹션 302:14955 "가상시민_상세")
   에셋: public/figma-assets/mobile-aic (전부 Figma export) */
const A = '/figma-assets/mobile-aic';

// 감정 정규화 키 → 스타일 (Figma 여정지도 실측)
const EMO = {
    '기대됨':    { dot: '#0da000', label: '#0da000', y: 187, img: 'emo_expect.png' },
    '개쾌함':    { dot: '#0da000', label: '#0da000', y: 187, img: 'emo_expect.png' },
    '상쾌함':    { dot: '#0da000', label: '#0da000', y: 187, img: 'emo_expect.png' },
    '집중함':    { dot: '#ffdb00', label: '#c8a300', y: 174, img: 'emo_focus.png' },
    '집중됨':    { dot: '#ffdb00', label: '#c8a300', y: 174, img: 'emo_focus.png' },
    '보통':      { dot: '#ffdb00', label: '#c8a300', y: 172, img: 'emo_normal.png' },
    '불안함':    { dot: '#ff6200', label: '#ff7300', y: 166, img: 'emo_anxious.png' },
    '매우불안함': { dot: '#ff0000', label: '#ff0000', y: 158, img: 'emo_very_anxious.png' },
};
const emoOf = (emotion) => EMO[String(emotion || '').replace(/\s/g, '')] || EMO['보통'];

/* 유사 시민 비율 아이콘 (Figma: 5개, 앞에서부터 강조) */
function PersonIcons({ highlighted = 1 }) {
    return (
        <div className="mdet-persons">
            {Array.from({ length: 5 }, (_, i) => (
                <img key={i} src={`${A}/${i < highlighted ? 'person_on' : 'person_off'}.png`} alt="" />
            ))}
        </div>
    );
}

/* 여정지도 (Figma Group 923: 696x248, 가로 스크롤) */
function Journey({ journey }) {
    if (!journey || journey.length === 0) return null;
    const n = journey.length;
    const width = 36 + n * 110; // Figma: 카드 시작 36, step 110, 우측 패딩 10(=110-100) — 6스텝=696
    const pts = journey.map((s, i) => {
        const e = emoOf(s.emotion || s.feeling);
        return { x: 36 + i * 110 + 45 + 4.5, y: e.y + 3.5, e };
    });
    return (
        <div className="mdet-journey-scroll">
            <div className="mdet-journey" style={{ width }}>
                <h3 className="mdet-card-title mdet-journey__title">여정지도</h3>
                <span className="mdet-journey__lbl" style={{ top: 90 }}>행동</span>
                <span className="mdet-journey__lbl" style={{ top: 128 }}>감정</span>
                <span className="mdet-journey__lbl" style={{ top: 202 }}>감정</span>
                {journey.map((s, i) => (
                    <div key={i} className="mdet-journey__card" style={{ left: 36 + i * 110 }}>
                        <div className="mdet-journey__num">{i + 1}</div>
                        <div className="mdet-journey__action">{s.action}</div>
                        <div className="mdet-journey__time">{s.time}</div>
                    </div>
                ))}
                <svg className="mdet-journey__curve" width={width} height={248} viewBox={`0 0 ${width} 248`}>
                    <polyline
                        points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none" stroke="#000000" strokeWidth="1.2"
                        strokeDasharray="1 4" strokeLinecap="round"
                    />
                </svg>
                {pts.map((p, i) => (
                    <span key={i} className="mdet-journey__dot" style={{ left: p.x - 4.5, top: p.e.y, background: p.e.dot }} />
                ))}
                {pts.map((p, i) => (
                    <img key={i} className="mdet-journey__emo" src={`${A}/${p.e.img}`} alt="" style={{ left: p.x - 9.5, top: p.e.y - 6 }} />
                ))}
                {journey.map((s, i) => {
                    const e = emoOf(s.emotion || s.feeling);
                    return (
                        <span key={i} className="mdet-journey__emolbl" style={{ left: 36 + i * 110, color: e.label }}>
                            {s.emotion || s.feeling}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

/* 정책 신호등 줄 (Figma Group 661~663) */
function TrafficLight({ level }) {
    const active = { high: 0, medium: 1, low: 2 }[level] ?? 1;
    const color = { high: '#ff0101', medium: '#ff6200', low: '#039e50' }[level];
    return (
        <span className="mdet-light">
            {[0, 1, 2].map(i => (
                <i key={i} style={{ background: i === active ? color : '#dddddd' }} />
            ))}
        </span>
    );
}

/* 공공데이터 참여 현황 (Figma: 그리드 6줄 + teal 바, 최대 78px) */
function ParticipationChart({ data }) {
    const items = Object.entries(data);
    const max = Math.max(...items.map(([, v]) => v), 1);
    return (
        <div className="mdet-chart">
            <div className="mdet-chart__grid">
                {Array.from({ length: 6 }, (_, i) => <i key={i} />)}
            </div>
            <div className="mdet-chart__cols">
                {items.map(([label, value]) => (
                    <div key={label} className="mdet-chart__col">
                        <span className="mdet-chart__pct">{value}%</span>
                        <span className="mdet-chart__bar" style={{ height: Math.max(5, Math.round((value / max) * 78)) }} />
                        <span className="mdet-chart__cat">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* 카테고리별 관심도 (8대 영역) — Figma 8각 그리드 + teal 폴리곤 */
const RADAR_KEYS = ['안전', '주거', '산업일자리', '교육', '환경', '문화여가', '보건', '교통'];
const RADAR_LABEL_POS = [
    { left: 93, top: 0 }, { left: 161, top: 26 }, { left: 188, top: 85 }, { left: 161, top: 148 },
    { left: 95, top: 170 }, { left: 9, top: 148 }, { left: 0, top: 86 }, { left: 25, top: 26 },
];
function Radar({ scores, showData }) {
    const cx = 105.5, cy = 93.5, maxR = 75.5;
    const radii = [75.5, 62.5, 50.5, 36.5, 25.5];
    const pt = (i, r) => {
        const a = (i * Math.PI) / 4 - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    };
    const dataPts = RADAR_KEYS.map((k, i) => pt(i, ((scores?.[k] || 0) / 5) * maxR)).join(' ');
    return (
        <div className="mdet-radar">
            <svg width="238" height="187" viewBox="0 0 238 187">
                {radii.map((r, li) => (
                    <polygon key={li} points={RADAR_KEYS.map((_, i) => pt(i, r)).join(' ')}
                        fill="none" stroke="#dddddd" strokeWidth="1" />
                ))}
                {showData && scores && (
                    <polygon points={dataPts} fill="rgba(35,189,187,0.2)" stroke="#23bdbb" strokeWidth="2" strokeLinejoin="round" />
                )}
            </svg>
            {RADAR_KEYS.map((k, i) => (
                <span key={k} className="mdet-radar__lbl" style={RADAR_LABEL_POS[i]}>{k}</span>
            ))}
        </div>
    );
}

export default function MAICitizenDetail({ citizen: initialCitizen, onNavigate }) {
    const [citizen, setCitizen] = useState(initialCitizen || null);
    const [detail, setDetail] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [radarOn, setRadarOn] = useState(true);

    useEffect(() => {
        if (!initialCitizen?.id) return;
        fetch(`${API_URL}/api/ai-citizens/${initialCitizen.id}`)
            .then(r => {
                if (!r.ok) throw new Error('not found');
                return r.json();
            })
            .then(data => {
                setCitizen(data);
                setDetail(data.detail || null);
            })
            .catch(() => {
                if (!initialCitizen?.name) setNotFound(true);
            });

        fetch(`${API_URL}/api/ai-citizens/${initialCitizen.id}/avatar`)
            .then(r => r.json())
            .then(data => { if (data.url) setAvatarUrl(`${API_URL}${data.url}`); })
            .catch(() => {});
    }, [initialCitizen?.id, initialCitizen?.name]);

    if (!citizen || notFound) return (
        <>
            <div style={{ padding: '24px', textAlign: 'center', minHeight: 'calc(100vh - 76px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#888', marginBottom: 16 }}>시민 정보를 찾을 수 없습니다.</p>
                <button onClick={() => onNavigate?.('mAICitizen')} style={{ padding: '8px 20px', background: '#23bdbb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>목록으로</button>
            </div>
            <MobileBottomNav currentView="mAICitizenDetail" onNavigate={onNavigate} />
        </>
    );

    const d = detail || {};
    const participation = d.participation || {};
    const journey = d.journey || [];
    const ps = d.policy_signals || {};
    const policyItems = [
        ...(ps.high || []).map(s => ({ level: 'high', text: s })),
        ...(ps.medium || []).map(s => ({ level: 'medium', text: s })),
        ...(ps.low || []).map(s => ({ level: 'low', text: s })),
    ];
    const ratioPct = parseFloat(d.similar_ratio || '0') || 0;
    const highlighted = Math.min(5, Math.max(1, Math.round(5 * ratioPct / 100)));
    const profileRows = [
        ['직업', d.job], ['가족', d.family], ['좌우명', d.motto], ['꿈꾸는 생활', d.dream_life],
        ['관심사', d.interests], ['고민', d.concerns], ['취미', d.hobbies], ['활동', d.activities],
    ].filter(([, v]) => v);
    const cleanTag = (t) => `# ${String(t).replace(/^#\s*/, '')}`;
    const hasScores = d.category_scores && Object.values(d.category_scores).some(v => v > 0);

    return (
        <div className="mdet">
            {chatOpen && (
                <PersonaChat persona={{ ...citizen, avatarUrl }} onClose={() => setChatOpen(false)} />
            )}

            <div className="mdet-scroll">
                {/* 상단: 뒤로가기 (Figma Vector 33) + 채팅하기(기능 유지) */}
                <div className="mdet-topbar">
                    <button className="mdet-back" type="button" onClick={() => onNavigate?.('mAICitizen')} aria-label="뒤로가기">
                        <img src={`${A}/detail_back.png`} alt="" />
                    </button>
                    <button className="mdet-chat" type="button" onClick={() => setChatOpen(true)}>채팅하기</button>
                </div>

                {/* Hero */}
                <div className="mdet-hero">
                    <div className="mdet-hero__avatar">
                        {avatarUrl && <img src={avatarUrl} alt="아바타" />}
                    </div>
                    <div className="mdet-hero__info">
                        <div className="mdet-hero__name-row">
                            <span className="mdet-hero__name">{citizen.name}</span>
                            <span className="mdet-hero__age">{citizen.age}세{citizen.gender ? ` · ${citizen.gender}` : ''}</span>
                        </div>
                        <div className="mdet-hero__tags">
                            {(citizen.tags || []).slice(0, 3).map(t => (
                                <span key={t} className="mdet-tag">{cleanTag(t)}</span>
                            ))}
                        </div>
                        <div className="mdet-ratio">
                            <div className="mdet-ratio__title">유사 시민 비율</div>
                            <div className="mdet-ratio__row">
                                <span className="mdet-ratio__pct">{d.similar_ratio || '-'}</span>
                                <PersonIcons highlighted={highlighted} />
                            </div>
                            <div className="mdet-ratio__desc">
                                {d.similar_desc || `${citizen.district || ''} 유사 생활 유형`}{d.similar_desc ? '이 이와 유사한 생활 유형을 보입니다.' : ''}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 프로필 표 */}
                {profileRows.length > 0 && (
                    <div className="mdet-card mdet-profile">
                        {profileRows.map(([label, value], i) => (
                            <div key={label} className={`mdet-profile__row${i === profileRows.length - 1 ? ' last' : ''}`}>
                                <span className="mdet-profile__label">{label}</span>
                                <span className="mdet-profile__value">{value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 시민 체감 언어 */}
                {(d.body_language || citizen.quote) && (
                    <div className="mdet-card mdet-quote">
                        <h3 className="mdet-card-title">시민 체감 언어</h3>
                        <div className="mdet-quote__body">
                            <img className="mdet-quote__open" src={`${A}/quote_open.png`} alt="" />
                            <p>{d.body_language || citizen.quote}</p>
                            <img className="mdet-quote__close" src={`${A}/quote_close.png`} alt="" />
                        </div>
                    </div>
                )}

                {/* 시민 목소리 */}
                {d.voices && d.voices.length > 0 && (
                    <div className="mdet-card mdet-rows">
                        <h3 className="mdet-card-title">시민 목소리</h3>
                        {d.voices.map((v, i) => (
                            <div key={i} className="mdet-row">
                                <span className="mdet-row__num">0{i + 1}</span>
                                <span className="mdet-row__text">{v}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 핵심 이슈 TOP 3 */}
                {d.top_issues && d.top_issues.length > 0 && (
                    <div className="mdet-card mdet-rows mdet-rows--issues">
                        <h3 className="mdet-card-title">핵심 이슈 TOP 3</h3>
                        {d.top_issues.map((issue, i) => (
                            <div key={i} className="mdet-row">
                                <span className="mdet-row__num">0{i + 1}</span>
                                <span className="mdet-row__text">{issue}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 여정지도 */}
                <Journey journey={journey} />

                {/* 정책 신호등 */}
                {policyItems.length > 0 && (
                    <div className="mdet-card mdet-policy">
                        <div className="mdet-policy__head">
                            <h3 className="mdet-card-title">정책 신호등</h3>
                            <div className="mdet-policy__legend">
                                {[['높음', '#ff0000'], ['보통', '#ff6200'], ['낮음', '#039e50']].map(([t, c]) => (
                                    <span key={t} className="mdet-policy__pill">
                                        <i style={{ background: c }} />
                                        <em style={{ color: c }}>{t}</em>
                                    </span>
                                ))}
                            </div>
                        </div>
                        {policyItems.map((p, i) => (
                            <div key={i} className={`mdet-policy__row${i > 0 ? ' divided' : ''}`}>
                                <TrafficLight level={p.level} />
                                <span className={`mdet-policy__text mdet-policy__text--${p.level}`}>{p.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 공공데이터 참여 현황 */}
                {Object.keys(participation).length > 0 && (
                    <div className="mdet-card mdet-part">
                        <h3 className="mdet-card-title">공공데이터 참여 현황 (참여 비율)</h3>
                        <ParticipationChart data={participation} />
                        {d.participation_note && <p className="mdet-part__note">{d.participation_note}</p>}
                    </div>
                )}

                {/* 카테고리별 관심도 */}
                {hasScores && (
                    <div className="mdet-card mdet-radar-card">
                        <div className="mdet-radar-card__head">
                            <h3 className="mdet-card-title">카테고리별 관심도 (8대 영역)</h3>
                            <button
                                className={`mdet-toggle${radarOn ? ' on' : ''}`} type="button"
                                onClick={() => setRadarOn(v => !v)} aria-label="관심도 표시 전환"
                            >
                                <i />
                            </button>
                        </div>
                        <Radar scores={d.category_scores} showData={radarOn} />
                    </div>
                )}

                {/* Footer */}
                <p className="mdet-footer__desc">
                    이 리포트는 {citizen.district || '부산'} 시민 의견과 공공데이터를<br />
                    기반으로 AI 분석을 통해 생성된 가상 인물입니다.
                </p>
                <button className="mdet-footer__btn" type="button" onClick={() => onNavigate?.('mAICitizen')}>
                    다른 시민 유형 보기 &gt;
                </button>
            </div>

            <MobileBottomNav currentView="mAICitizenDetail" onNavigate={onNavigate} />
        </div>
    );
}
