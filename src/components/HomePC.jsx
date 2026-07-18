import { useState, useEffect } from 'react';
import './HomePC.css';
import BusanMap from './BusanMap';
import PCFooter from './PCFooter';
import { API_URL } from '../utils/api';

/* PC 홈 리뉴얼 — Figma 302:2526 "USER: 홈" (참여 현황 + 지도 + TOP5 + 빠른 액션 + 소식/가상시민) */

const FALLBACK_NEWS = [
    { created_at: '2025-05-16', title: '시민 참여 결과 리포트가 업데이트되었습니다.' },
    { created_at: '2025-05-16', title: '도로·보행 환경 개선 의견 점수 기간 안내' },
    { created_at: '2025-05-16', title: '서비스 정기 점검 일정 안내 (05/10 02:00~05:00)' },
    { created_at: '2025-05-16', title: '제보된 안전 위험 요소의 조치 현황을 확인하세요.' },
];

// Figma 302:2574 — TOP5 카드는 3행 노출, 랭크 배지/게이지 모두 teal
const TOP5_VISIBLE = 3;

/* Figma 에셋 (302:2608, 7.25x13.75) — 손그림 SVG 금지 규칙에 따라 export 사용 */
const Chevron = () => (
    <img src="/figma-assets/icons/stats_chevron.png" alt="" style={{ width: 7.25, height: 13.75, display: 'block' }} />
);

const HomePC = ({ onNavigate }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [region, setRegion] = useState(null);   // null = 부산전체 (기본 선택 없음)
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [ranking, setRanking] = useState([]);
    const [rankingLoading, setRankingLoading] = useState(true);
    const [news, setNews] = useState([]);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('access_token'));
        fetch(`${API_URL}/api/announcements?kind=notice&size=4`).then((r) => r.ok ? r.json() : null)
            .then((d) => setNews(d?.items?.length ? d.items : FALLBACK_NEWS)).catch(() => setNews(FALLBACK_NEWS));
        // 지역별 참여는 항상 구·군 랭킹(전체 기준)
        fetch(`${API_URL}/api/home/district-ranking?limit=5`)
            .then((r) => r.ok ? r.json() : []).then((d) => setRanking(Array.isArray(d) ? d : []))
            .catch(() => {}).finally(() => setRankingLoading(false));
    }, []);

    // 좌측 시민 참여 현황만 선택 구에 따라 갱신 (미선택 시 부산전체)
    useEffect(() => {
        setStatsLoading(true);
        const q = region ? `?region=${encodeURIComponent(region)}` : '';
        fetch(`${API_URL}/api/home/stats${q}`).then((r) => r.ok ? r.json() : null).then(setStats)
            .catch(() => {}).finally(() => setStatsLoading(false));
    }, [region]);

    const go = (t) => onNavigate && onNavigate(t);
    const goAuthed = (t) => { if (!isLoggedIn) { alert('로그인 후 이용할 수 있습니다.'); go('login'); return; } go(t); };
    const n = (v) => (v ?? 0).toLocaleString();

    const catRows = [
        { key: '제보', count: stats?.reports_count, view: 'pcReportMap' },
        { key: '제안', count: stats?.proposals_count, view: 'pcProposeMap', auth: true },
        { key: '진단', count: stats?.diagnoses_count, view: 'pcDiagnosisMap' },
        { key: '설문', count: stats?.surveys_count, view: 'pcSurveyList' },
    ];
    const maxRank = Math.max(...ranking.slice(0, TOP5_VISIBLE).map((r) => r.count), 1);

    return (
        <div className="pchome2">
            {/* ===== Hero: 참여 현황 + 지도 + TOP5 ===== */}
            <section className="pch2-hero">
                <div className="pch2-hero-map">
                    <BusanMap
                        selectedDistrict={region}
                        onDistrictChange={setRegion}
                        bgSrc="/assets/지도 배경 데스크탑.png"
                        showDeselectBadge
                    />
                </div>

                <div className="pch2-hero-inner">
                {/* 좌측 참여 현황 카드 */}
                <div className="pch2-stats">
                    <div className="pch2-stats-head">
                        <span className="pch2-stats-region">{region || '부산전체'}</span>
                        <h2>시민 참여 현황</h2>
                        <p>시민의 참여로 만드는 더 나은 부산</p>
                    </div>
                    <div className="pch2-stats-total">
                        <span>총 참여건수</span>
                        {statsLoading
                            ? <strong className="pch2-skel pch2-skel-total" aria-hidden="true">&nbsp;</strong>
                            : <strong>{n(stats?.total)}건</strong>}
                    </div>
                    <div className="pch2-stats-rows">
                        {catRows.map((c) => (
                            <button key={c.key} className="pch2-stats-row" onClick={() => (c.auth ? goAuthed(c.view) : go(c.view))}>
                                <span className="pch2-stats-row-k">{c.key}</span>
                                {statsLoading
                                    ? <span className="pch2-skel pch2-skel-row" aria-hidden="true">&nbsp;</span>
                                    : <span className="pch2-stats-row-v">{n(c.count)}건</span>}
                                <Chevron />
                            </button>
                        ))}
                    </div>
                </div>

                {/* 지역별 TOP5 — 지도 하단(hero 내부, 참여현황 우측 아래) 배치 */}
                <div className="pch2-top5">
                    <h3>지역별 참여 TOP 5</h3>
                    <span className="pch2-top5-sub">참여건수 기준</span>
                    <ul className="pch2-top5-list">
                        {rankingLoading && (
                            Array.from({ length: TOP5_VISIBLE }).map((_, i) => (
                                <li key={`skel-${i}`} aria-hidden="true">
                                    <div className="pch2-rank-line">
                                        <span className="pch2-skel pch2-skel-rank" />
                                        <span className="pch2-skel pch2-skel-name" />
                                        <span className="pch2-skel pch2-skel-cnt" />
                                    </div>
                                    <div className="pch2-rank-bar"><div className="pch2-skel" style={{ width: '60%', height: '100%' }} /></div>
                                </li>
                            ))
                        )}
                        {!rankingLoading && ranking.slice(0, TOP5_VISIBLE).map((r, i) => (
                            <li key={r.region}>
                                <div className="pch2-rank-line">
                                    <span className="pch2-rank">{i + 1}</span>
                                    <span className="pch2-rank-name">{r.region}</span>
                                    <span className="pch2-rank-cnt">{n(r.count)}건</span>
                                </div>
                                <div className="pch2-rank-bar"><div style={{ width: `${(r.count / maxRank) * 100}%` }} /></div>
                            </li>
                        ))}
                        {!rankingLoading && !ranking.length && <li className="pch2-top5-empty">참여 데이터를 집계 중입니다.</li>}
                    </ul>
                </div>
                </div>
            </section>

            {/* ===== 빠른 액션 4 ===== */}
            <section className="pch2-actions">
                <button className="pch2-act report" onClick={() => go('pcReportMap')}>
                    <div><span className="pch2-act-title">제보하기</span><p>우리 동네 문제점을<br />제보해 주세요.</p></div>
                    <img src="/assets/home/report.png" alt="" />
                </button>
                <button className="pch2-act propose" onClick={() => goAuthed('pcProposeMap')}>
                    <div><span className="pch2-act-title">제안하기</span><p>더 나은 부산을 위한<br />아이디어를 제안해 주세요.</p></div>
                    <img src="/assets/home/propose.png" alt="" />
                </button>
                <button className="pch2-act plain diagnose" onClick={() => go('pcDiagnosisMap')}>
                    <div><span className="pch2-act-title">진단하기</span><p>우리 동네 상태를<br />직접 진단해 주세요.</p></div>
                    <img src="/assets/home/diagnose.png" alt="" />
                </button>
                <button className="pch2-act plain survey" onClick={() => go('pcSurveyList')}>
                    <div><span className="pch2-act-title">설문 참여</span><p>시민의 생각을 들려주세요.<br />설문에 참여해 주세요.</p></div>
                    <img src="/assets/home/survey.png" alt="" />
                </button>
            </section>

            {/* ===== 소식 + 가상시민 배너 ===== */}
            <section className="pch2-bottom">
                <div className="pch2-news">
                    <h2>플랫폼 소식</h2>
                    <ul>
                        {news.slice(0, 4).map((it, i) => (
                            <li key={it.id ?? i}>
                                <span className="pch2-news-date">{(it.created_at || '').slice(0, 10).replace(/-/g, '.')}</span>
                                <span className="pch2-news-text">{it.title}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <button className="pch2-aic" onClick={() => go('pcAICitizen')}>
                    <div className="pch2-aic-text">
                        <h3>우리 지역을 대표하는<br /><span>가상 시민</span>을 만나보세요</h3>
                        <p>지역의 생활환경과 문제, 요구를<br />‘시민의 모습’으로 이해할 수 있습니다.</p>
                    </div>
                    <img className="pch2-aic-img" src="/assets/home/aic_banner.png" alt="" />
                </button>
            </section>

            {/* ===== Footer (공용 PCFooter — Figma 302:2652) ===== */}
            <PCFooter onFaq={() => go('pcAICitizen')} />
        </div>
    );
};

export default HomePC;
