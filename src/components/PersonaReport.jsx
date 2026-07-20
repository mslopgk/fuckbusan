import { useState } from 'react';
import './PCAICitizen.css';
import './PersonaReport.css';

/* 페르소나 풀 상세 리포트 본문 (Figma TCuOzEqNhoLKjhF0reBDks 302:4531 — 736x975 카드, 노드 실측 1:1).
   사용자 PC 가상시민 모달 + 어드민 '가상시민 생성 관리' 아코디언 공용.
   모달 chrome(백드롭/닫기)은 호출 측에서 감싼다. */

// 에셋: Figma 원본 export (모바일 스윕 때 동일 노드 이미지 export — 17x17 이모지/사람아이콘/인용부호)
const A = '/figma-assets/mobile-aic';

// 감정 매핑 — Figma 302:4531 실측: dot=감정선 점(302:4735~4740), label=감정 텍스트(302:4722~4731)
export const EMO = {
    '기대됨': { level: 1, dot: '#0da000', label: '#0da000', img: 'emo_expect.png' },
    '개쾌함': { level: 1, dot: '#0da000', label: '#0da000', img: 'emo_expect.png' },
    '상쾌함': { level: 1, dot: '#0da000', label: '#0da000', img: 'emo_expect.png' },
    '집중함': { level: 2, dot: '#ffdb00', label: '#c8a300', img: 'emo_focus.png' },
    '집중됨': { level: 2, dot: '#ffdb00', label: '#c8a300', img: 'emo_focus.png' },
    '보통': { level: 3, dot: '#ffdb00', label: '#c8a300', img: 'emo_normal.png' },
    '불안함': { level: 4, dot: '#ff6200', label: '#ff7300', img: 'emo_anxious.png' },
    '매우불안함': { level: 5, dot: '#ff0000', label: '#ff0000', img: 'emo_very_anxious.png' },
    '매우 불안함': { level: 5, dot: '#ff0000', label: '#ff0000', img: 'emo_very_anxious.png' },
};
const emoOf = (emotion) => EMO[emotion] || EMO['보통'];

const PROFILE_FIELDS_L = [['job', '직업'], ['family', '가족'], ['motto', '좌우명'], ['dream_life', '꿈꾸는 생활']];
const PROFILE_FIELDS_R = [['interests', '관심사'], ['concerns', '고민'], ['hobbies', '취미'], ['activities', '활동']];
const join = (v) => (Array.isArray(v) ? v.join(', ') : (v || '—'));

/* 이모지 유동 밴드 — Figma 실측: 이모지 17x17, 밴드 y593~641(h48), 레벨1(좋음)=바닥 +31 / 레벨5(나쁨)=꼭대기 0 */
const FACE_BAND_H = 48;
const FACE_SIZE = 17;
const FACE_TRAVEL = FACE_BAND_H - FACE_SIZE; // 31
const faceTop = (emotion) => ((5 - emoOf(emotion).level) / 4) * FACE_TRAVEL;

/* 카테고리별 관심도 레이더(토글 ON) — Figma 302:4747(Group 922) 실측:
   8각 링 5개 stroke #d9d9d9 (133/110/89/64/45), 스포크 없음, 라벨 11/400 #111.
   축 순서(시계방향, 위부터): 안전 주거 산업일자리 교육 환경 문화여가 보건 교통 */
const RADAR_CATS = [
    ['안전', '안전'], ['주거', '주거'], ['산업\n일자리', '산업일자리'], ['교육', '교육'],
    ['환경', '환경'], ['문화여가', '문화여가'], ['보건', '보건'], ['교통', '교통'],
];
function CatRadar({ cs }) {
    const SIZE = 200, cx = SIZE / 2, cy = SIZE / 2, maxR = 66.5;
    const n = RADAR_CATS.length, step = (2 * Math.PI) / n;
    const pt = (i, r) => { const a = i * step - Math.PI / 2; return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; };
    const dataPts = RADAR_CATS.map(([, k], i) => pt(i, ((cs[k] || 0) / 5) * maxR));
    const dPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
    const RINGS = [66.5, 55, 44.5, 32, 22.5];
    return (
        <svg width="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block', maxWidth: 200, margin: '10px auto 0' }}>
            {RINGS.map((r, ri) => {
                const g = RADAR_CATS.map((_, i) => pt(i, r)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
                return <path key={ri} d={g} fill="none" stroke="#d9d9d9" strokeWidth="1" />;
            })}
            <path d={dPath} fill="rgba(35,189,187,0.25)" stroke="#23bdbb" strokeWidth="1.5" />
            {RADAR_CATS.map(([label], i) => {
                const p = pt(i, maxR + 15);
                const lines = label.split('\n');
                return (
                    <text key={i} x={p.x} y={p.y - (lines.length - 1) * 5.5} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#111">
                        {lines.map((ln, li) => <tspan key={li} x={p.x} dy={li === 0 ? 0 : 11}>{ln}</tspan>)}
                    </text>
                );
            })}
        </svg>
    );
}

/* 감정선 — 이모지 밴드를 관통하는 점선 + 감정색 점 (Figma 302:4732: 점 9x7, 점선은 이모지 뒤) */
export function EmotionLine({ journey }) {
    const n = journey.length;
    if (n < 1) return null;
    const W = 1000, H = FACE_BAND_H;
    const pts = journey.map((s, i) => [((i + 0.5) / n) * W, faceTop(s.emotion) + FACE_SIZE / 2 + 3]);
    const dPath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return (
        <svg className="aic-jr-line" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={dPath} fill="none" stroke="#4b4b4b" strokeWidth="1.4" strokeDasharray="3 3.5" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

/* 유사 시민 비율 사람 아이콘 5개 (첫 번째만 진하게) — Figma 302:4582, 원본 export 이미지 */
export function PersonRatioIcons() {
    return (
        <span className="aic-pr-icons" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
                <img key={i} src={`${A}/${i === 0 ? 'person_on' : 'person_off'}.png`} alt="" />
            ))}
        </span>
    );
}

/* 리포트 본문. onNext 주면 푸터에 '다른 시민 유형 보기' 버튼 노출(모달 전용). */
export default function PersonaReport({ citizen, avatarUrl, onNext }) {
    const [catRadar, setCatRadar] = useState(false);   // 카테고리별 관심도: false=막대, true=레이더
    const d = citizen.detail || {};
    const voices = (d.voices || []).slice(0, 3);
    const issues = (d.top_issues || []).slice(0, 3);
    const journey = d.journey || [];
    const sig = d.policy_signals || {};
    const policyRows = [
        ...(sig.high || []).map((t) => ({ lv: 'high', t })),
        ...(sig.medium || []).map((t) => ({ lv: 'medium', t })),
        ...(sig.low || []).map((t) => ({ lv: 'low', t })),
    ].slice(0, 3);
    const part = d.participation || {};
    const partItems = ['제안', '제보', '진단', '설문'].map((k) => [k, part[k] || 0]);
    const partMax = Math.max(...partItems.map(([, v]) => v), 1);
    const cs = d.category_scores || {};
    // 막대(토글 OFF) 순서 — Figma 302:4649 라벨 순서
    const CATS8 = [['안전', '안전'], ['교통', '교통'], ['주거', '주거'], ['산업• 일자리', '산업일자리'], ['교육', '교육'], ['환경', '환경'], ['문화• 여가', '문화여가'], ['보건 • 복지', '보건']];

    return (
        <div className="aic-report-body">
            {/* 헤더 — Figma: 아바타 141x193(#d9d9d9 테두리) / 중앙 231 / 우측 289, 간격 22·11 */}
            <div className="aic-rp-hero">
                <div className="aic-rp-illust">
                    {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="aic-illust-fb">{citizen.avatar_initial}</span>}
                </div>
                <div className="aic-rp-mid">
                    <div className="aic-rp-nameline">
                        <span className="aic-rp-name">{citizen.name}</span>
                        <span className="aic-rp-age">{citizen.age}세 · {citizen.gender || ''}</span>
                    </div>
                    <div className="aic-rp-tags">{(citizen.tags || []).map((t) => <span key={t}>{t}</span>)}</div>
                    <div className="aic-rp-prof-box left">
                        {PROFILE_FIELDS_L.map(([k, l]) => <div key={k} className="aic-rp-prow"><dt>{l}</dt><dd>{join(d[k])}</dd></div>)}
                    </div>
                </div>
                <div className="aic-rp-right">
                    <div className="aic-rp-similar">
                        <div className="aic-rp-similar-l">
                            <span className="aic-rp-similar-ttl">유사 시민 비율</span>
                            <p>{d.similar_desc || '유사한 생활 유형'}</p>
                        </div>
                        <div className="aic-rp-similar-r">
                            <PersonRatioIcons />
                            <strong>{d.similar_ratio || '—'}</strong>
                        </div>
                    </div>
                    <div className="aic-rp-prof-box right">
                        {PROFILE_FIELDS_R.map(([k, l]) => <div key={k} className="aic-rp-prow"><dt>{l}</dt><dd>{join(d[k])}</dd></div>)}
                    </div>
                </div>
            </div>

            {/* 체감언어 / 목소리 / 핵심이슈 */}
            <div className="aic-rp-3col">
                <div className="aic-rp-card">
                    <h4>시민 체감 언어</h4>
                    <div className="aic-rp-feel">
                        <img className="aic-q" src={`${A}/quote_open.png`} alt="" />
                        <span>{d.body_language || '—'}</span>
                        <img className="aic-q" src={`${A}/quote_close.png`} alt="" />
                    </div>
                </div>
                <div className="aic-rp-card">
                    <h4>시민 목소리</h4>
                    <div className="aic-rp-pills">{voices.map((t, i) => <div key={i} className="aic-rp-pill"><b>{String(i + 1).padStart(2, '0')}</b><span>{t}</span></div>)}</div>
                </div>
                <div className="aic-rp-card">
                    <h4>핵심 이슈 TOP 3</h4>
                    <div className="aic-rp-pills">{issues.map((t, i) => <div key={i} className="aic-rp-pill"><b>{String(i + 1).padStart(2, '0')}</b><span>{t}</span></div>)}</div>
                </div>
            </div>

            {/* 여정지도 — Figma 302:4689: 스텝카드 100x180 white r10 gap10, 번호 19px #777 */}
            {journey.length > 0 && (
                <div className="aic-rp-journey">
                    <h4>여정지도</h4>
                    <div className="aic-jr-body">
                        <div className="aic-jr-rowlabels"><span>행동</span><span>감정</span><span>감정</span></div>
                        <div className="aic-jr-gridwrap">
                            <div className="aic-jr-grid" style={{ gridTemplateColumns: `repeat(${journey.length}, 1fr)` }}>
                                {journey.map((s, i) => (
                                    <div key={i} className="aic-jr-step">
                                        <span className="aic-jr-num">{i + 1}</span>
                                        <div className="aic-jr-action">{s.action}</div>
                                        <div className="aic-jr-time">{s.time}</div>
                                        <div className="aic-jr-feeling">{s.feeling}</div>
                                        <div className="aic-jr-faceband">
                                            <span className="aic-jr-dot" style={{ top: `${faceTop(s.emotion) + FACE_SIZE / 2 - 0.5}px`, background: emoOf(s.emotion).dot }} />
                                            <img className="aic-jr-face" src={`${A}/${emoOf(s.emotion).img}`} alt={s.emotion}
                                                style={{ top: `${faceTop(s.emotion)}px` }} />
                                        </div>
                                        <div className="aic-jr-emotion" style={{ color: emoOf(s.emotion).label }}>{s.emotion}</div>
                                    </div>
                                ))}
                            </div>
                            <EmotionLine journey={journey} />
                        </div>
                    </div>
                </div>
            )}

            {/* 정책신호등 / 참여현황 / 카테고리 */}
            <div className="aic-rp-3col bottom">
                <div className="aic-rp-card sig">
                    <h4>정책 신호등</h4>
                    <div className="aic-sig-legend">
                        <span className="high"><i />높음</span>
                        <span className="medium"><i />보통</span>
                        <span className="low"><i />낮음</span>
                    </div>
                    <div className="aic-sig-list">
                        {policyRows.map((p, i) => (
                            <div key={i} className="aic-sig-row">
                                <span className={`aic-sig-light ${p.lv}`}><i /><i /><i /></span>
                                <span className={`aic-sig-text ${p.lv}`}>{p.t}</span>
                            </div>
                        ))}
                        {!policyRows.length && <span className="aic-voice-empty">자료 준비 중</span>}
                    </div>
                </div>
                <div className="aic-rp-card">
                    <h4>공공데이터 참여 현황 <span className="aic-rp-sub8">(참여 비율)</span></h4>
                    <div className="aic-part-plot">
                        {partItems.map(([label, value]) => (
                            <div key={label} className="aic-part-col">
                                <span className="aic-part-val">{value}%</span>
                                <div className="aic-part-fill" style={{ height: `${Math.max(5, (value / partMax) * 78)}px` }} />
                            </div>
                        ))}
                    </div>
                    <div className="aic-part-labels">
                        {partItems.map(([label]) => <span key={label}>{label}</span>)}
                    </div>
                    {d.participation_note && <div className="aic-part-cap">{d.participation_note}</div>}
                </div>
                <div className="aic-rp-card">
                    <div className="aic-cat-head">
                        <h4>카테고리별 관심도 <span className="aic-rp-sub8 block">(8대 영역)</span></h4>
                        <button type="button" className={`aic-cat-toggle${catRadar ? ' on' : ''}`}
                            onClick={() => setCatRadar((v) => !v)}
                            role="switch" aria-checked={catRadar} aria-label="레이더 차트로 보기" />
                    </div>
                    {catRadar ? (
                        <CatRadar cs={cs} />
                    ) : (
                        <div className="aic-hbars">
                            {CATS8.map(([label, key]) => (
                                <div key={key} className="aic-hbar-row">
                                    <span className="aic-hbar-label">{label}</span>
                                    <div className="aic-hbar-track"><div className="aic-hbar-fill" style={{ width: `${((cs[key] || 0) / 5) * 100}%` }} /></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="aic-rp-foot">
                <span>이 리포트는 {citizen.district} 시민 의견과 공공데이터를 기반으로 AI 분석을 통해 생성된 가상 인물입니다.</span>
                {onNext && <button type="button" onClick={onNext}>다른 시민 유형 보기 &gt;</button>}
            </div>
        </div>
    );
}
