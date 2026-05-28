import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import InteractiveMap from './InteractiveMap';
import MobileBottomNav from './MobileBottomNav';
import { API_URL } from '../utils/api';


// citizens, archives 데이터는 /api/home/citizens, /api/home/archives에서 받음.

const Home = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isPC, setIsPC] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        setIsLoggedIn(!!token);

        const onResize = () => setIsPC(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // 뷰포트 따라 PC/모바일 라우트 분기
    const goReport   = () => onNavigate && onNavigate(isPC ? 'pcReportMap'    : 'mReportMap');
    const goPropose  = () => onNavigate && onNavigate(isPC ? 'pcProposeMap'   : 'mProposalMap');
    const goSurvey   = () => onNavigate && onNavigate(isPC ? 'pcSurveyList'   : 'mSurveyList');
    const goDiagnose = () => onNavigate && onNavigate(isPC ? 'pcDiagnosisMap' : 'mDiagnosisList');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        localStorage.removeItem('district_code');
        setIsLoggedIn(false);
        alert('로그아웃 되었습니다.');
    };

    return (
        <div className="home-container">
            {/* Header (Mobile & Desktop) */}
            <header className="header mobile-header">
                <div className="logo-text">
                    <img src="/WDC.svg" alt="logo" style={{ height: '28px' }} />
                </div>
                <div className="header-actions">
                    {!isLoggedIn ? (
                        <>
                            <button className="btn-header login" onClick={() => onNavigate && onNavigate('login')}>로그인</button>
                            <button className="btn-header signup" onClick={() => onNavigate && onNavigate('signup')}>회원가입</button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button className="btn-header login" onClick={handleLogout}>로그아웃</button>
                            <button className="btn-header" style={{ padding: '8px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => alert('알림')}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <header className="header desktop-header">
                <div className="desktop-header-inner">
                    <div className="logo-text">
                        <img src="/WDC.svg" alt="logo" style={{ height: '28px' }} />
                    </div>

                    <nav className="desktop-nav">
                        <a href="#" className="nav-link">프로젝트 소개</a>
                        <a href="#" className="nav-link">시민 참여</a>
                        <a href="#" className="nav-link">제안목록 및 심사</a>
                        <a href="#" className="nav-link">동향 현황 및 분석</a>
                        <a href="#" className="nav-link">정보마당</a>
                    </nav>

                    <div className="header-actions">
                        {!isLoggedIn ? (
                            <>
                                <button className="btn-header login" onClick={() => onNavigate && onNavigate('login')}>로그인</button>
                                <button className="btn-header signup" onClick={() => onNavigate && onNavigate('signup')}>회원가입</button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button className="btn-header login" onClick={handleLogout}>로그아웃</button>
                                <button className="btn-header" style={{ padding: '8px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => alert('알림')}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero / Map Section (Moved OUTSIDE content-wrapper for full width) */}
            <div className="hero-section">
                <picture className="hero-map-bg-wrapper">
                    <source media="(min-width: 1024px)" srcSet="/assets/지도%20배경%20데스크탑.png" />
                    <img src="/assets/지도 배경.png" alt="Map Background" className="hero-map-bg" />
                </picture>

                <div className="hero-inner">
                    <div className="hero-text">
                        <h2 className="hero-title">시민과 기술이 함께 만드는 <br /><span className="highlight-red">더 나은 부산</span></h2>
                        <p className="hero-subtitle">
                            시민의 목소리와 지능형 기술로<br />
                            도시를 진단하고 개선하는 참여형 플랫폼입니다.<br />
                            누구나 쉽게 의견을 제시하고,<br />
                            우리 동네 변화를 함께 만들어갈 수 있습니다.
                        </p>
                    </div>
                    <div className="hero-map-container">
                        {/* Interactive Map Overlay */}
                        <div className="hero-map-overlay">
                            <InteractiveMap />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Wrapper */}
            <div className="content-wrapper">

                {/* Category Grid Section - Temporarily hidden per request */}
                {false && <CategoryGrid />}

                {/* Citizen Cards Section */}
                {/* <CitizenCards /> */}

                {/* Action Cards & Survey Row */}
                <div className="main-actions-container">
                    <div className="action-row">
                        <div className="action-item card report" onClick={goReport}>
                            <div className="card-top">
                                <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                                    <div className="card-title">제보하기</div>
                                    <img src="/pencilicon.svg" alt="제보하기 아이콘" className="card-icon-img" />
                                </div>
                                <div className="card-subtitle">당신의 아이디어가<br />도시를 더 멋지게!</div>
                            </div>
                            <div className="card-arrow">→</div>
                        </div>
                        <div className="action-item card diagnose" style={{ background: '#23BDBB' }} onClick={() => {
                                if (!isLoggedIn) { alert('로그인 후 이용할 수 있습니다.'); onNavigate && onNavigate('login'); return; }
                                goPropose();
                            }}>
                            <div className="card-top">
                                <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                                    <div className="card-title" style={{ color: 'white' }}>제안하기</div>
                                    <img src="/lighticon.svg" alt="제안하기 아이콘" className="card-icon-img" />
                                </div>
                                <div className="card-subtitle" style={{ color: 'white' }}>우리 동네 디자인,<br />같이 점검해볼까요?</div>
                            </div>
                            <div className="card-arrow" style={{ color: 'white' }}>→</div>
                        </div>
                    </div>
                    <div className="action-row" style={{ marginTop: '10px' }}>
                        <div className="action-item card diagnose" onClick={goDiagnose} style={{ background: 'linear-gradient(135deg, #06AB69 0%, #047a4b 100%)' }}>
                            <div className="card-top">
                                <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                                    <div className="card-title" style={{ color: 'white' }}>진단하기</div>
                                    <img src="/graph.svg" alt="진단하기 아이콘" className="card-icon-img" style={{ filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className="card-subtitle" style={{ color: 'white', opacity: 0.85 }}>우리 동네 디자인,<br />같이 점검해볼까요?</div>
                            </div>
                            <div className="card-arrow" style={{ color: 'white' }}>→</div>
                        </div>
                        <div className="action-item card activity" onClick={() => onNavigate && onNavigate('myActivityHub')} style={{ background: 'linear-gradient(135deg, #491C9C 0%, #190A36 100%)' }}>
                            <div className="card-top">
                                <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                                    <div className="card-title" style={{ color: 'white' }}>나의 활동</div>
                                    <img src="/myid.svg" alt="나의 활동 아이콘" className="card-icon-img" style={{ filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className="card-subtitle" style={{ color: 'white', opacity: 0.8 }}>내가 참여한 기록들을<br />한눈에 확인해보세요.</div>
                            </div>
                            <div className="card-arrow" style={{ color: 'white' }}>→</div>
                        </div>
                    </div>
                </div>

                {false && (
                    <>
                        <div className="stats-wrapper">
                            {/* Stats Section Title */}
                            {/* Stats Section Title */}
                            <div className="stats-header-section">
                                <div>
                                    <h2 className="section-title">내가 남긴 제보와 제안, <br /><span className="highlight">지금 어떻게 진행되고 있을까요?</span></h2>
                                    <p className="section-subtitle">등록한 내용의 검토·처리 상태를 쉽게 확인할 수 있습니다.</p>
                                </div>
                                {/* Detail Button moved below for mobile re-ordering logic */}
                                <div className="stats-detail-btn-container desktop-only">
                                    <button className="btn-detail">
                                        자세히보기 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E6235A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Stats Graphs */}
                            <div className="stats-content-row">
                                <StatsContent />
                            </div>

                            {/* Mobile Detail Button (Below Charts) */}
                            <div className="stats-detail-btn-container mobile-only">
                                <button className="btn-detail">
                                    자세히보기 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E6235A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </button>
                            </div>
                        </div>


                        <ArchiveCards />

                        {/* Bottom Row: News & Guide */}
                        <div className="bottom-row">
                            {/* News Section */}
                            <div className="news-section">
                                <div className="news-header">
                                    <h2 className="section-title-sm">플랫폼 소식</h2>
                                    <button className="btn-more-news mobile-only">
                                        더보기 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                    </button>
                                    <button className="btn-more-news desktop-only">
                                        더보기 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                    </button>
                                </div>
                                <div className="news-list">
                                    <div className="news-item">
                                        <span className="news-date">2024.12.18</span>
                                        <span className="news-content">부산공공디자인 공모전 수상작 발표 및 전시 안내</span>
                                    </div>
                                    <div className="news-item">
                                        <span className="news-date">2024.12.10</span>
                                        <span className="news-content">겨울철 도시 시설물 안전 점검 실시 결과를 알려...</span>
                                    </div>
                                    <div className="news-item">
                                        <span className="news-date">2024.11.28</span>
                                        <span className="news-content">시민 참여단 5기 모집 종료 및 선정 결과 공고</span>
                                    </div>
                                    <div className="news-item">
                                        <span className="news-date">2024.11.15</span>
                                        <span className="news-content">공공디자인 포럼 '도시를 바꾸는 힘' 개최 안내</span>
                                    </div>
                                    <div className="news-item">
                                        <span className="news-date">2024.11.02</span>
                                        <span className="news-content">2024년 하반기 우수 제보자 시상식 진행</span>
                                    </div>
                                </div>
                            </div>

                            {/* First Time Guide Section */}
                            <div className="guide-section">
                                <h2 className="guide-title">처음 방문하셨나요?</h2>
                                <p className="guide-desc">
                                    부산참여플랫폼 이용 가이드를<br />
                                    확인하고, 쉽고 편리하게<br />
                                    참여해 보세요!
                                </p>
                                <img src="/assets/first_time.png" alt="First Time Guide" className="guide-image" />

                                <button className="btn-guide">
                                    가이드 보러가기 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E6235A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </button>
                            </div>
                        </div>
                    </>
                )}

            </div>


            <MobileBottomNav currentView="home" onNavigate={onNavigate} />
        </div>
    );
};

const CategoryGrid = () => {
    const [selected, setSelected] = useState(null);

    const categories = [
        { id: 'housing', label: '주거', icon: 'home' },
        { id: 'environment', label: '환경', icon: 'tree' },
        { id: 'transport', label: '교통', icon: 'bus' },
        { id: 'safety', label: '안전', icon: 'shield' },
        { id: 'education', label: '교육', icon: 'school' },
        { id: 'jobs', label: '산업 일자리', icon: 'briefcase' },
        { id: 'culture', label: '문화 여가', icon: 'gamepad' },
        { id: 'welfare', label: '보건 복지', icon: 'heart' }
    ];

    const getIcon = (name, isSelected) => {
        const color = isSelected ? '#fff' : '#666';
        switch (name) {
            case 'home': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
            case 'tree': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.74 3.48a1 1 0 0 1 .5.87v11.96a1 1 0 0 1-.5.87l-11.48 6.96a1 1 0 0 1-1 0L.76 19.87a1 1 0 0 1-.5-.87V7.04a1 1 0 0 1 .5-.87z"></path></svg>; // Generic poly for Env
            case 'bus': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"></rect><circle cx="6" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle><path d="M1 6V4a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v2"></path></svg>;
            case 'shield': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
            case 'school': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>;
            case 'briefcase': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
            case 'gamepad': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h4m-2-2v4m10-2h.01m-2.5-3.5h.01m-2.5 3.5h.01"></path></svg>;
            case 'heart': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
            default: return null;
        }
    };

    return (
        <div className="category-grid-container">
            {/* All (전체) Button */}
            <div
                className={`category-item all-category-btn ${selected === 'all' || selected === null ? 'selected' : ''}`}
                onClick={() => setSelected('all')}
            >
                <div className="cat-icon-wrapper" style={{ width: 'auto', height: 'auto', marginRight: '4px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </div>
                <span className="cat-label" style={{ fontSize: '1rem', fontWeight: 'bold' }}>전체</span>
            </div>

            {categories.map((cat) => (
                <div
                    key={cat.id}
                    className={`category-item ${selected === cat.id ? 'selected' : ''}`}
                    onClick={() => setSelected(cat.id === selected ? null : cat.id)}
                >
                    <div className="cat-icon-wrapper">
                        {getIcon(cat.icon, selected === cat.id)}
                    </div>
                    <span className="cat-label">{cat.label}</span>
                </div>
            ))}
        </div>
    );
};

const CitizenCards = () => {
    const [citizens, setCitizens] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/home/citizens`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setCitizens(Array.isArray(rows) ? rows : []))
            .catch(() => setCitizens([]));
    }, []);

    if (citizens.length === 0) return null;

    // Double data for simple 50% scroll loop
    const displayCitizens = [...citizens, ...citizens];

    return (
        <div className="citizen-card-section">
            <div className="marquee-track">
                {displayCitizens.map((p, index) => (
                    <div className="citizen-card" key={`${p.id}-${index}`}>
                        <div className="citizen-header">
                            <div className="citizen-profile">
                                <div className="citizen-avatar">
                                    <svg viewBox="0 0 24 24" fill="#ddd" width="100%" height="100%"><circle cx="12" cy="8" r="5"></circle><path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2"></path></svg>
                                </div>
                                <div className="citizen-info">
                                    <span className="citizen-name">{p.name} <span className="citizen-age">{p.age}세</span></span>
                                </div>
                                <div className="citizen-arrow">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </div>
                            </div>
                        </div>
                        <div className="citizen-tags">
                            {p.tags.map((t, idx) => <span key={idx} className="tag">{t}</span>)}
                        </div>
                        <div className="citizen-desc">
                            {p.desc}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatsContent = () => {
    const [isBarVisible, setIsBarVisible] = useState(false);
    const [isDonutVisible, setIsDonutVisible] = useState(false);
    const [counts, setCounts] = useState({ personal: 0, report: 0, diagnose: 0 });

    // Separate refs
    const barRef = useRef(null);
    const donutRef = useRef(null);

    // Bar Chart Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsBarVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (barRef.current) observer.observe(barRef.current);
        return () => observer.disconnect();
    }, []);

    // Donut Chart Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsDonutVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (donutRef.current) observer.observe(donutRef.current);
        return () => observer.disconnect();
    }, []);

    // 백엔드에서 실제 카운트 가져오기
    const [targets, setTargets] = useState({ personal: 210, report: 330, diagnose: 72 });
    useEffect(() => {
        fetch(`${API_URL}/api/home/stats`)
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => {
                if (j) setTargets({
                    personal: j.proposals_count ?? 0,
                    report: j.reports_count ?? 0,
                    diagnose: j.diagnoses_count ?? 0,
                });
            })
            .catch(() => {});
    }, []);

    // Count Up Animation
    useEffect(() => {
        if (!isBarVisible) return;

        const duration = 1500;
        const steps = 60;
        const intervalTime = duration / steps;

        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const ease = 1 - Math.pow(1 - progress, 3);

            setCounts({
                personal: Math.round(targets.personal * ease),
                report: Math.round(targets.report * ease),
                diagnose: Math.round(targets.diagnose * ease)
            });

            if (currentStep >= steps) clearInterval(timer);
        }, intervalTime);

        return () => clearInterval(timer);
    }, [isBarVisible, targets]);

    return (
        <React.Fragment>
            <div className="stats-card" ref={barRef}>
                <div className="stats-header">전체 참여 현황</div>
                <div className="bar-chart-row">
                    <div className="bar-track">
                        <div style={{ width: isBarVisible ? '60%' : '0%' }} className="bar-fill personal">
                            <span className="bar-text-overlay">제안</span>
                        </div>
                        <div className="bar-value personal">{counts.personal}</div>
                    </div>
                </div>
                <div className="bar-chart-row">
                    <div className="bar-track">
                        <div style={{ width: isBarVisible ? '90%' : '0%' }} className="bar-fill report">
                            <span className="bar-text-overlay">제보</span>
                        </div>
                        <div className="bar-value report">{counts.report}</div>
                    </div>
                </div>
                <div className="bar-chart-row">
                    <div className="bar-track">
                        <div style={{ width: isBarVisible ? '20%' : '0%' }} className="bar-fill diagnose">
                            <span className="bar-text-overlay">진단</span>
                        </div>
                        <div className="bar-value diagnose">{counts.diagnose}</div>
                    </div>
                </div>
            </div>

            <div className="stats-card" ref={donutRef}>
                <div className="stats-header">카테고리별 신고 유형 비율</div>
                <div className="donut-container">
                    <svg width="200" height="200" viewBox="0 0 42 42">
                        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#eee" strokeWidth="10"></circle>

                        {/* 
                            Animation Logic for Continuous Smooth Draw (Slower: 3.0s Total):
                            - 32%: 0.96s
                            - 27%: 0.81s (Start 0.96s)
                            - 18%: 0.54s (Start 1.77s)
                            - 14%: 0.42s (Start 2.31s)
                            - 9%:  0.27s (Start 2.73s)
                        */}

                        {/* 32% - Delay 0s */}
                        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#E6235A" strokeWidth="10"
                            strokeDasharray={isDonutVisible ? "32 68" : "0 100"} strokeDashoffset="25"
                            style={{ transition: 'stroke-dasharray 0.96s linear', transitionDelay: '0s' }}></circle>
                        <text x="34.4" y="12.5" fill="#fff" fontSize="2.8" fontFamily="GmarketSans" fontWeight="bold" textAnchor="middle" dy=".3em">32%</text>

                        {/* 27% - Delay 0.96s */}
                        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#4A148C" strokeWidth="10"
                            strokeDasharray={isDonutVisible ? "27 73" : "0 100"} strokeDashoffset="-7"
                            style={{ transition: 'stroke-dasharray 0.81s linear', transitionDelay: '0.96s' }}></circle>
                        <text x="25.5" y="36.3" fill="#fff" fontSize="2.8" fontFamily="GmarketSans" fontWeight="bold" textAnchor="middle" dy=".3em">27%</text>

                        {/* 18% - Delay 1.77s */}
                        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#1976D2" strokeWidth="10"
                            strokeDasharray={isDonutVisible ? "18 82" : "0 100"} strokeDashoffset="-34"
                            style={{ transition: 'stroke-dasharray 0.54s linear', transitionDelay: '1.77s' }}></circle>
                        <text x="6.6" y="27.7" fill="#fff" fontSize="2.8" fontFamily="GmarketSans" fontWeight="bold" textAnchor="middle" dy=".3em">18%</text>

                        {/* 14% - Delay 2.31s */}
                        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#00897B" strokeWidth="10"
                            strokeDasharray={isDonutVisible ? "14 86" : "0 100"} strokeDashoffset="-52"
                            style={{ transition: 'stroke-dasharray 0.42s linear', transitionDelay: '2.31s' }}></circle>
                        <text x="7.5" y="12.5" fill="#fff" fontSize="2.8" fontFamily="GmarketSans" fontWeight="bold" textAnchor="middle" dy=".3em">14%</text>

                        {/* 9% - Delay 2.73s */}
                        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#333" strokeWidth="10"
                            strokeDasharray={isDonutVisible ? "9 91" : "0 100"} strokeDashoffset="-66"
                            style={{ transition: 'stroke-dasharray 0.27s linear', transitionDelay: '2.73s' }}></circle>
                        <text x="16.5" y="5.6" fill="#fff" fontSize="2.8" fontFamily="GmarketSans" fontWeight="bold" textAnchor="middle" dy=".3em">9%</text>

                        <text x="21" y="21" fill="#fff" textAnchor="middle" dy=".3em" fontSize="4" fontWeight="bold">Total</text>
                    </svg>
                </div>

                <div className="donut-legend">
                    <div className="legend-row">
                        <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: '#E6235A' }}></div>시설물 파손</div>
                        <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: '#4A148C' }}></div>불편 환경</div>
                        <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: '#1976D2' }}></div>안전 문제</div>
                    </div>
                    <div className="legend-row">
                        <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: '#00897B' }}></div>청결/위생</div>
                        <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: '#333' }}></div>기타</div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

const ArchiveCards = () => {
    const [archives, setArchives] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/home/archives`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                if (Array.isArray(rows)) {
                    // 이미지가 없으면 placeholder 순환 사용
                    const imgs = ['/assets/archieve1.png', '/assets/archieve2.png', '/assets/archieve3.png'];
                    setArchives(rows.map((r, i) => ({ ...r, img: r.img || imgs[i % imgs.length] })));
                } else {
                    setArchives([]);
                }
            })
            .catch(() => setArchives([]));
    }, []);

    if (archives.length === 0) return null;

    // Double data for simple 50% scroll loop
    const displayArchives = [...archives, ...archives];

    return (
        <div className="archive-section">
            <div className="archive-header">
                <div>
                    <h2 className="section-title">우수 사례 <span className="highlight">아카이브</span></h2>
                    <p className="section-subtitle">시민들의 참여로 만들어진 더 나은 부산의 모습입니다.</p>
                </div>
            </div>

            <div
                className="marquee-track"
            >
                {displayArchives.map((item, index) => (
                    // Use index in key because IDs are duplicated
                    <div className="archive-item" key={`${item.id}-${index}`}>
                        <img src={item.img} alt={item.title} />
                        <div className="archive-text">
                            <div className="archive-title">{item.title}</div>
                            <div className="archive-desc">{item.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
