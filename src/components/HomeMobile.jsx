import { useState, useEffect } from 'react';
import './HomeMobile.css';
import BusanMap from './BusanMap';
import MobileBottomNav from './MobileBottomNav';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { API_URL } from '../utils/api';

/* 모바일 홈 리뉴얼 — Figma 269:19829 (가상시민 배너 + 공공데이터 + 참여현황 + 지도 + TOP5 + 액션 + 소식) */

const Arrow = ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h13" /><path d="M12 6l6 6-6 6" />
    </svg>
);

const FALLBACK_NEWS = [
    { created_at: '2025-05-16', title: '시민 참여 결과 리포트가 업데이트되었습니다.' },
    { created_at: '2025-05-16', title: '도로·보행 환경 개선 의견 점수 기간 안내' },
];
const RANK_COLORS = ['#23bdbb', '#23bdbb', '#23bdbb', '#9ad8d6', '#9ad8d6'];

const HomeMobile = ({ onNavigate }) => {
    const [region, setRegion] = useState(null);   // null = 부산전체 (기본 선택 없음)
    const [stats, setStats] = useState(null);
    const [ranking, setRanking] = useState([]);
    const [news, setNews] = useState([]);
    const { count: unreadCount } = useUnreadNotifications();
    const go = (t) => onNavigate && onNavigate(t);
    const n = (v) => (v ?? 0).toLocaleString();

    useEffect(() => {
        fetch(`${API_URL}/api/announcements?kind=notice&size=3`).then((r) => r.ok ? r.json() : null)
            .then((d) => setNews(d?.items?.length ? d.items : FALLBACK_NEWS)).catch(() => setNews(FALLBACK_NEWS));
        // 지역별 참여는 항상 구·군 랭킹(전체 기준)
        fetch(`${API_URL}/api/home/district-ranking?limit=5`)
            .then((r) => r.ok ? r.json() : []).then((d) => setRanking(Array.isArray(d) ? d : [])).catch(() => {});
    }, []);

    // 좌측 시민 참여 현황만 선택 구에 따라 갱신
    useEffect(() => {
        const q = region ? `?region=${encodeURIComponent(region)}` : '';
        fetch(`${API_URL}/api/home/stats${q}`).then((r) => r.ok ? r.json() : null).then(setStats).catch(() => {});
    }, [region]);

    const counts = [
        { key: '제보', count: stats?.reports_count }, { key: '제안', count: stats?.proposals_count },
        { key: '설문', count: stats?.surveys_count }, { key: '진단', count: stats?.diagnoses_count },
    ];
    const maxRank = Math.max(...ranking.map((r) => r.count), 1);

    return (
        <div className="hmob2">
            <header className="hmob2-header">
                <button className="hmob2-logo" onClick={() => go('home')} aria-label="홈"><img src="/WDC.svg" alt="WDC" /></button>
                <button className="hmob2-bell" aria-label="알림" onClick={() => go('mNotifications')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 && <span className="hmob2-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
            </header>

            {/* 가상시민 배너 */}
            <button className="hmob2-aic" onClick={() => go('mAICitizen')}>
                <div className="hmob2-aic-text">
                    <h2>우리 지역을 대표하는<br /><span>가상 시민</span>을 만나보세요</h2>
                    <p>지역의 생활환경과 문제, 요구를<br />‘시민의 모습’으로 이해할 수 있습니다.</p>
                </div>
                <img className="hmob2-aic-img" src="/assets/home/aic_banner.png" alt="" />
            </button>

            {/* 공공데이터 카드 */}
            <button className="hmob2-pubdata" onClick={() => go('pcPublicData')}>
                <div><span className="hmob2-pubdata-title">공공데이터</span><p>다양한 데이터를 한눈에<br />확인하고 활용해 보세요</p></div>
                <img src="/assets/home/publicdata.png" alt="" />
            </button>

            {/* 참여 현황 */}
            <section className="hmob2-stats">
                <div className="hmob2-stats-head">
                    <span className="hmob2-region">{region || '부산전체'}</span> <strong>시민 참여 현황</strong>
                    <p>시민의 참여로 만드는 더 나은 부산</p>
                </div>
                <div className="hmob2-total"><span>총 참여건수</span><strong>{n(stats?.total)}건</strong></div>
                <div className="hmob2-count-grid">
                    {counts.map((c) => (
                        <div key={c.key} className="hmob2-count"><span>{c.key}</span><b>{n(c.count)}건</b></div>
                    ))}
                </div>
            </section>

            {/* 지도 */}
            <div className="hmob2-map">
                <BusanMap selectedDistrict={region} onDistrictChange={setRegion} />
            </div>

            {/* 지역별 TOP5 */}
            <section className="hmob2-top5">
                <h3>지역별 참여 TOP 5</h3>
                <span className="hmob2-top5-sub">참여건수 기준</span>
                <ul>
                    {ranking.map((r, i) => (
                        <li key={r.region}>
                            <span className="hmob2-rank" style={{ background: RANK_COLORS[i] }}>{i + 1}</span>
                            <span className="hmob2-rank-name">{r.region}</span>
                            <div className="hmob2-rank-bar"><div style={{ width: `${(r.count / maxRank) * 100}%`, background: RANK_COLORS[i] }} /></div>
                            <span className="hmob2-rank-cnt">{n(r.count)}건</span>
                        </li>
                    ))}
                    {!ranking.length && <li className="hmob2-top5-empty">참여 데이터를 집계 중입니다.</li>}
                </ul>
            </section>

            {/* 빠른 액션 2x2 */}
            <div className="hmob2-actions">
                <button className="hmob2-act report" onClick={() => go('mReportMap')}>
                    <div><span>제보하기</span><p>우리 동네 문제점을<br />제보해 주세요.</p></div>
                    <img src="/assets/home/report.png" alt="" />
                </button>
                <button className="hmob2-act propose" onClick={() => go('mProposalMap')}>
                    <div><span>제안하기</span><p>더 나은 부산을 위한<br />아이디어를 제안해 주세요.</p></div>
                    <img src="/assets/home/propose.png" alt="" />
                </button>
                <button className="hmob2-act plain" onClick={() => go('mDiagnosisList')}>
                    <div><span>진단하기</span><p>우리 동네 상태를<br />직접 진단해 주세요.</p></div>
                    <img src="/assets/home/diagnose.png" alt="" />
                </button>
                <button className="hmob2-act plain" onClick={() => go('mSurveyList')}>
                    <div><span>설문 참여</span><p>시민의 생각을 들려주세요.<br />설문에 참여해 주세요.</p></div>
                    <img src="/assets/home/survey.png" alt="" />
                </button>
            </div>

            {/* 플랫폼 소식 */}
            <section className="hmob2-news">
                <h2>플랫폼 소식</h2>
                <ul>
                    {news.slice(0, 3).map((it, i) => (
                        <li key={it.id ?? i} onClick={() => go('mPlatformNews')}>
                            <span className="hmob2-news-text">{it.title}</span>
                            <Arrow size={16} color="#bbb" />
                        </li>
                    ))}
                </ul>
            </section>

            <MobileBottomNav currentView="home" onNavigate={onNavigate} />
        </div>
    );
};

export default HomeMobile;
