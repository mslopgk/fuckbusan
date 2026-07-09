import { useState } from 'react';
import './PCAICitizen.css';

/* 페르소나 풀 상세 리포트 본문 (Figma 215:5403).
   사용자 PC 가상시민 모달 + 어드민 '가상시민 생성 관리' 아코디언 공용.
   모달 chrome(상단바/닫기)은 호출 측에서 감싼다. */

// 감정(레벨/색/표정) — Figma 색상값 그대로
export const EMO_LEVEL = { '개쾌함': 1, '기대됨': 1, '집중함': 2, '집중됨': 2, '보통': 3, '불안함': 4, '매우불안함': 5, '매우 불안함': 5 };
export const EMO_COLOR = { '개쾌함': '#0da000', '기대됨': '#0da000', '집중함': '#c8a300', '집중됨': '#c8a300', '보통': '#c8a300', '불안함': '#ff7300', '매우불안함': '#ff0000', '매우 불안함': '#ff0000' };
export const EMO_FACE = { '개쾌함': '😄', '기대됨': '😄', '집중함': '😌', '집중됨': '😌', '보통': '😐', '불안함': '😟', '매우불안함': '😣', '매우 불안함': '😣' };
// 행동 키워드 → 활동 이모지 (Figma 여정 아이콘 대응)
export const actionEmoji = (a = '') => {
    if (/카페/.test(a)) return '🏪';
    if (/공부|스터디|학습|독서/.test(a)) return '📚';
    if (/귀가|짐|준비|정리/.test(a)) return '🎒';
    if (/버스|대중교통|지하철|하차/.test(a)) return '🚌';
    if (/집|도착|귀택/.test(a)) return '🏠';
    if (/도보|골목|이동|걷/.test(a)) return '🛣️';
    if (/운동|산책/.test(a)) return '🏃';
    if (/시장|장보|쇼핑/.test(a)) return '🛒';
    if (/병원|진료|건강/.test(a)) return '🏥';
    return '📍';
};
const PROFILE_FIELDS_L = [['job', '직업'], ['family', '가족'], ['motto', '좌우명'], ['dream_life', '꿈꾸는 생활']];
const PROFILE_FIELDS_R = [['interests', '관심사'], ['concerns', '고민'], ['hobbies', '취미'], ['activities', '활동']];
const join = (v) => (Array.isArray(v) ? v.join(', ') : (v || '—'));

/* 카테고리별 관심도 레이더(토글 ON). cats = [[label, key], ...] */
function CatRadar({ cs, cats }) {
    const SIZE = 200, cx = SIZE / 2, cy = SIZE / 2, maxR = 66;
    const n = cats.length, step = (2 * Math.PI) / n;
    const pt = (i, r) => { const a = i * step - Math.PI / 2; return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; };
    const dataPts = cats.map(([, k], i) => pt(i, ((cs[k] || 0) / 5) * maxR));
    const dPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
    return (
        <svg width="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block', maxWidth: 220, margin: '4px auto 0' }}>
            {[0.25, 0.5, 0.75, 1].map((lv, li) => {
                const g = cats.map((_, i) => pt(i, lv * maxR)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
                return <path key={li} d={g} fill="none" stroke="#e0e0e0" strokeWidth="1" />;
            })}
            {cats.map((_, i) => { const p = pt(i, maxR); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e0e0e0" strokeWidth="1" />; })}
            <path d={dPath} fill="rgba(35,189,187,0.2)" stroke="#23bdbb" strokeWidth="2" />
            {cats.map(([label], i) => { const p = pt(i, maxR + 16); return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="#555">{label}</text>; })}
        </svg>
    );
}

// 감정선 (행동 박스 하단을 잇는 점선 + 점)
export function EmotionLine({ journey }) {
    const n = journey.length;
    if (n < 1) return null;
    const W = 1000, H = 40, padTop = 6;
    const xOf = (i) => ((i + 0.5) / n) * W;
    const yOf = (e) => padTop + ((EMO_LEVEL[e] ?? 3) - 1) / 4 * (H - padTop - 6);
    const pts = journey.map((s, i) => [xOf(i), yOf(s.emotion)]);
    const dPath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height: H }}>
            <path d={dPath} fill="none" stroke="#cfcfcf" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
            {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill={EMO_COLOR[journey[i].emotion] || '#ccc'} vectorEffect="non-scaling-stroke" />)}
        </svg>
    );
}

export function PersonRatioIcons() {
    return (
        <span className="aic-pr-icons" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} width="11" height="20" viewBox="0 0 11 20" fill={i === 0 ? '#23bdbb' : '#b9d6d6'}>
                    <circle cx="5.5" cy="4" r="3.4" /><path d="M0.5 20c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5z" />
                </svg>
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
    const CATS8 = [['안전', '안전'], ['교통', '교통'], ['주거', '주거'], ['산업• 일자리', '산업일자리'], ['교육', '교육'], ['환경', '환경'], ['문화• 여가', '문화여가'], ['보건 • 복지', '보건']];

    return (
        <div className="aic-report-body">
            {/* 헤더 */}
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
                        <div className="aic-rp-similar-head"><span>유사 시민 비율</span><PersonRatioIcons /></div>
                        <p>{d.similar_desc || '유사한 생활 유형'}</p>
                        <strong>{d.similar_ratio || '—'}</strong>
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
                    <div className="aic-rp-feel"><i className="aic-q open">❝</i><span>{d.body_language || '—'}</span><i className="aic-q close">❞</i></div>
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

            {/* 여정지도 */}
            {journey.length > 0 && (
                <div className="aic-rp-journey">
                    <h4>여정지도</h4>
                    <div className="aic-jr-body">
                        <div className="aic-jr-rowlabels"><span>행동</span><span>감정</span><span>감정</span></div>
                        <div className="aic-jr-grid" style={{ gridTemplateColumns: `repeat(${journey.length}, 1fr)` }}>
                            {journey.map((s, i) => (
                                <div key={i} className="aic-jr-step">
                                    <span className="aic-jr-num" style={{ background: EMO_COLOR[s.emotion] || '#bbb' }}>{i + 1}</span>
                                    <div className="aic-jr-emoji">{actionEmoji(s.action)}</div>
                                    <div className="aic-jr-action">{s.action}</div>
                                    <div className="aic-jr-time">{s.time}</div>
                                    <div className="aic-jr-feeling">{s.feeling}</div>
                                    <div className="aic-jr-face">{EMO_FACE[s.emotion] || '🙂'}</div>
                                    <div className="aic-jr-emotion" style={{ color: EMO_COLOR[s.emotion] }}>{s.emotion}</div>
                                </div>
                            ))}
                        </div>
                        <EmotionLine journey={journey} />
                    </div>
                </div>
            )}

            {/* 정책신호등 / 참여현황 / 카테고리 */}
            <div className="aic-rp-3col bottom">
                <div className="aic-rp-card sig">
                    <h4>정책 신호등</h4>
                    <div className="aic-sig-legend"><span className="high">● 높음</span><span className="medium">● 보통</span><span className="low">● 낮음</span></div>
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
                    <div className="aic-part-chart">
                        {partItems.map(([label, value]) => (
                            <div key={label} className="aic-part-col">
                                <span className="aic-part-val">{value}%</span>
                                <div className="aic-part-fill" style={{ height: `${Math.max(6, (value / partMax) * 96)}px` }} />
                                <span className="aic-part-label">{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="aic-part-cap">제보와 설문 참여 비율이 높아 생활 불편 체감이 높은 유형입니다.</div>
                </div>
                <div className="aic-rp-card">
                    <div className="aic-cat-head">
                        <h4>카테고리별 관심도 <span className="aic-rp-sub8">(8대 영역)</span></h4>
                        <button type="button" className={`aic-cat-toggle${catRadar ? ' on' : ''}`}
                            onClick={() => setCatRadar((v) => !v)}
                            role="switch" aria-checked={catRadar} aria-label="레이더 차트로 보기" />
                    </div>
                    {catRadar ? (
                        <CatRadar cs={cs} cats={CATS8} />
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
                {onNext && <button type="button" onClick={onNext}>다른 시민 유형 보기 ›</button>}
            </div>
        </div>
    );
}
