import React, { useState, useEffect } from 'react';
import './HomePC.css';
import BusanMap from './BusanMap';
import BUSAN_DONG from '../data/busanDong';

/* Figma: TCuOzEqNhoLKjhF0reBDks node 215:3621 (USER: 홈, 1920×1720 desktop) */

const NEWS = [
    { date: '25.01.16', text: '2025년 1월 시민 참여 결과 리포트가 업데이트되었습니다.' },
    { date: '25.01.08', text: '도로·보행 환경 개선 의견 접수 기간 안내' },
    { date: '25.01.07', text: '서비스 정기 점검 일정 안내 (12/30 02:00–05:00)' },
    { date: '25.01.05', text: '제보된 안전 위험 요소의 조치 현황을 확인하세요' },
    { date: '24.12.30', text: '우수 사례 아카이브 신규 콘텐츠가 추가되었습니다' },
];

// 생활정보 카테고리 (Figma 3×3, 행순서)
const CATEGORIES = [
    { id: 'all', label: '전체', icon: 'apps' },
    { id: 'safety', label: '안전', icon: 'safety' },
    { id: 'housing', label: '주거', icon: 'home' },
    { id: 'jobs', label: '산업\n일자리', icon: 'badge' },
    { id: 'education', label: '교육', icon: 'school' },
    { id: 'environment', label: '환경', icon: 'forest' },
    { id: 'culture', label: '문화·여가', icon: 'esports' },
    { id: 'welfare', label: '보건·복지', icon: 'volunteer' },
    { id: 'transport', label: '교통', icon: 'bus' },
];

const CatIcon = ({ name }) => {
    const p = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (name) {
        case 'apps': return <svg {...p} fill="currentColor" stroke="none"><circle cx="6" cy="6" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="12" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/></svg>;
        case 'safety': return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M9.5 12l1.8 1.8L15 10.3"/></svg>;
        case 'home': return <svg {...p}><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>;
        case 'badge': return <svg {...p}><rect x="4" y="6" width="16" height="13" rx="2"/><path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/><circle cx="12" cy="11" r="2"/><path d="M8.5 16c.7-1.6 6.3-1.6 7 0"/></svg>;
        case 'school': return <svg {...p}><path d="M3 9l9-4 9 4-9 4z"/><path d="M7 11v4c2.5 2 7.5 2 10 0v-4"/><path d="M21 9v4"/></svg>;
        case 'forest': return <svg {...p}><path d="M12 3l4 6h-3l3 5h-8l3-5H8z"/><path d="M12 14v6"/></svg>;
        case 'esports': return <svg {...p}><rect x="3" y="8" width="18" height="9" rx="4.5"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="15.5" cy="12" r=".9" fill="currentColor"/><circle cx="17.5" cy="14" r=".9" fill="currentColor"/></svg>;
        case 'volunteer': return <svg {...p}><path d="M12 20s-6-4-8-7.5C2.4 9.8 4 7 6.8 7c1.6 0 2.7.9 3.2 1.8C10.5 7.9 11.6 7 13.2 7 16 7 17.6 9.8 16 12.5"/><path d="M14 13l3.5 3.5 4-4"/></svg>;
        case 'bus': return <svg {...p}><rect x="5" y="4" width="14" height="13" rx="2"/><path d="M5 10h14"/><path d="M8 17v2M16 17v2"/><circle cx="8.5" cy="13.5" r=".9" fill="currentColor"/><circle cx="15.5" cy="13.5" r=".9" fill="currentColor"/></svg>;
        default: return null;
    }
};

const Arrow = ({ size = 24, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h13" /><path d="M12 6l6 6-6 6" />
    </svg>
);

const HomePC = ({ onNavigate }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [selectedCat, setSelectedCat] = useState('safety');
    const [district, setDistrict] = useState(null); // 구·군 (지도 선택)
    const [dong, setDong] = useState(null);          // 읍·면·동 (드롭다운)
    const [filterOpen, setFilterOpen] = useState(false);
    const handleDistrictChange = (gu) => { setDistrict(gu); setDong(null); setFilterOpen(false); };
    const dongList = district ? (BUSAN_DONG[district] || []) : [];

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('access_token'));
    }, []);

    const go = (target) => onNavigate && onNavigate(target);
    const goAuthed = (target) => {
        if (!isLoggedIn) { alert('로그인 후 이용할 수 있습니다.'); go('login'); return; }
        go(target);
    };

    return (
        <div className="pchome">
            {/* 헤더는 App.jsx의 공용 PCHeader가 렌더 */}

            {/* ===== Hero / Map ===== */}
            <section className="pchome-hero">
                <div className="pchome-hero-inner">
                    <div className="pchome-hero-left">
                        <div className="pchome-hero-text">
                            <h1>시민과 기술이 함께 만드는<br /><span className="accent">더 나은 부산</span></h1>
                            <p>
                                시민의 목소리와 지능형 기술로<br />
                                도시를 진단하고 개선하는 참여형 플랫폼입니다.<br />
                                누구나 쉽게 의견을 제시하고,<br />
                                우리 동네 변화를 함께 만들어갈 수 있습니다.
                            </p>
                        </div>

                        {/* 구역별 필터 (지도에서 고른 구·군의 읍·면·동) */}
                        <div className="pchome-filter">
                            <span className="pchome-filter-label">구역별{district ? ` · ${district}` : ''}</span>
                            <div
                                className={`pchome-filter-select${district ? '' : ' disabled'}`}
                                onClick={() => { if (district) setFilterOpen((o) => !o); }}
                            >
                                <span className={dong ? '' : 'placeholder'}>
                                    {dong || (district ? '읍·면·동을 선택하세요' : '지도에서 구·군을 먼저 선택하세요')}
                                </span>
                                {dong && (
                                    <svg className="pchome-filter-clear" width="20" height="20" viewBox="0 0 24 24" fill="#bdbdbd"
                                        onClick={(e) => { e.stopPropagation(); setDong(null); }}>
                                        <circle cx="12" cy="12" r="10" /><path d="M9 9l6 6M15 9l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                )}
                                <svg className={`pchome-filter-arrow${filterOpen ? ' open' : ''}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={district ? '#242424' : '#bbb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                            {filterOpen && district && (
                                <ul className="pchome-filter-menu">
                                    {dongList.map((d) => (
                                        <li key={d}
                                            className={d === dong ? 'active' : ''}
                                            onClick={() => { setDong(d); setFilterOpen(false); }}>
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* 생활정보 카테고리 */}
                        <div className="pchome-cats">
                            <div className="pchome-cats-title">생활정보</div>
                            <div className="pchome-cats-grid">
                                {CATEGORIES.map((c) => (
                                    <button
                                        key={c.id}
                                        className={`pchome-cat${selectedCat === c.id ? ' selected' : ''}`}
                                        onClick={() => setSelectedCat(c.id)}
                                    >
                                        <CatIcon name={c.icon} />
                                        <span>{c.label.split('\n').map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pchome-hero-map">
                        <BusanMap selectedDistrict={district} onDistrictChange={handleDistrictChange} />
                    </div>
                </div>
            </section>

            {/* ===== Main content ===== */}
            <main className="pchome-main">
                {/* 액션 카드 3 */}
                <div className="pchome-cards">
                    <button className="pchome-card survey" onClick={() => go('pcSurveyList')}>
                        <div className="pchome-card-body">
                            <div className="pchome-card-title-row">
                                <span className="pchome-card-title">설문조사</span>
                                <Arrow size={24} color="#242424" />
                            </div>
                            <p className="pchome-card-sub">공공디자인 설문에<br />참여해주세요.</p>
                        </div>
                        <img className="pchome-card-survey-icon" src="/survey_list_icon.svg" alt="" />
                    </button>

                    <button className="pchome-card report" onClick={() => go('pcReportMap')}>
                        <div className="pchome-card-head">
                            <span className="pchome-card-title light">제보하기</span>
                            <img className="pchome-card-emoji sm" src="/pencilicon.svg" alt="" />
                        </div>
                        <p className="pchome-card-sub light">당신의 아이디어가<br />도시를 더 멋지게!</p>
                        <span className="pchome-card-arrow"><Arrow size={24} color="#fff" /></span>
                    </button>

                    <button className="pchome-card propose" onClick={() => goAuthed('pcProposeMap')}>
                        <div className="pchome-card-head">
                            <span className="pchome-card-title light">제안하기</span>
                            <img className="pchome-card-emoji" src="/lighticon.svg" alt="" />
                        </div>
                        <p className="pchome-card-sub light">우리 동네 디자인,<br />같이 점검해볼까요?</p>
                        <span className="pchome-card-arrow"><Arrow size={24} color="#fff" /></span>
                    </button>
                </div>

                {/* 소식 + 가이드 */}
                <div className="pchome-bottom">
                    <section className="pchome-news">
                        <div className="pchome-news-head">
                            <h2>플랫폼 소식</h2>
                            <button className="pchome-pill dark">더보기 <Arrow size={20} color="#1e1e1e" /></button>
                        </div>
                        <div className="pchome-news-divider" />
                        <ul className="pchome-news-list">
                            {NEWS.map((n, i) => (
                                <li key={i}>
                                    <span className="pchome-news-date">{n.date}</span>
                                    <span className="pchome-news-text">{n.text}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="pchome-guide">
                        <div className="pchome-guide-body">
                            <div className="pchome-guide-textwrap">
                                <h2>처음 방문하셨나요?</h2>
                                <p>
                                    지도를 보며 문제를 선택하고 의견을 남기면,<br />
                                    동네 개선에 직접 기여할 수 있습니다.<br />
                                    한 번의 참여로 우리 동네 변화에 함께할 수 있습니다.
                                </p>
                            </div>
                            <button className="pchome-pill red">참여가이드 <Arrow size={20} color="#e6235a" /></button>
                        </div>
                        <img className="pchome-guide-char" src="/assets/guide_character.png" alt="가이드 캐릭터" />
                    </section>
                </div>
            </main>

            {/* ===== Footer ===== */}
            <footer className="pchome-footer">
                <div className="pchome-footer-inner">
                    <div className="pchome-footer-left">
                        <div className="pchome-footer-brand">WDC</div>
                        <div className="pchome-footer-lines">
                            <span>이메일 &nbsp;|&nbsp; support@busan-design.kr</span>
                            <span>전화 &nbsp;|&nbsp; 051-XXX-XXXX</span>
                            <span>운영시간 &nbsp;|&nbsp; 평일 09:00 ~ 18:00</span>
                        </div>
                        <div className="pchome-footer-copy">© 2025 Busan Public Design Platform. All rights reserved.</div>
                    </div>
                    <div className="pchome-footer-right">
                        <div className="pchome-footer-links">
                            <a>이용약관</a><span>·</span><a>개인정보처리방침</a><span>·</span><a>문의하기</a>
                        </div>
                        <button className="pchome-pill faq">자주 묻는 질문(FAQ) <Arrow size={20} color="#fff" /></button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePC;
