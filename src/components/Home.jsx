import React, { useState, useEffect, useRef } from 'react';
import './Home.css';

const Home = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState('home');

    return (
        <div className="home-container">
            {/* Header (Mobile & Desktop) */}
            <header className="header mobile-header">
                <div className="logo-text">
                    <img src="/assets/logopic.png" alt="logo" style={{ height: '40px', marginRight: '10px' }} />
                    <div>
                        <div style={{ lineHeight: '1' }}>부산참여플랫폼</div>
                        <div style={{ fontSize: '10px', color: '#888', fontWeight: 'normal' }}>Busan Citizen-driven design</div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-header login" onClick={() => onNavigate && onNavigate('login')}>로그인</button>
                    <button className="btn-header signup" onClick={() => onNavigate && onNavigate('signup')}>회원가입</button>
                </div>
            </header>

            <header className="header desktop-header">
                <div className="desktop-header-inner">
                    <div className="logo-text">
                        <img src="/assets/logopic.png" alt="logo" style={{ height: '40px', marginRight: '10px' }} />
                        <div>
                            <div style={{ lineHeight: '1' }}>부산참여플랫폼</div>
                            <div style={{ fontSize: '10px', color: '#888', fontWeight: 'normal' }}>Busan Citizen-driven design</div>
                        </div>
                    </div>

                    <nav className="desktop-nav">
                        <a href="#" className="nav-link">프로젝트 소개</a>
                        <a href="#" className="nav-link">시민 참여</a>
                        <a href="#" className="nav-link">제안목록 및 심사</a>
                        <a href="#" className="nav-link">동향 현황 및 분석</a>
                        <a href="#" className="nav-link">정보마당</a>
                    </nav>

                    <div className="header-actions">
                        <button className="btn-header login" onClick={() => onNavigate && onNavigate('login')}>로그인</button>
                        <button className="btn-header signup" onClick={() => onNavigate && onNavigate('signup')}>회원가입</button>
                    </div>
                </div>
            </header>

            {/* Hero / Map Section (Moved OUTSIDE content-wrapper for full width) */}
            <div className="hero-section">
                <picture className="hero-map-bg-wrapper">
                    <source media="(min-width: 1024px)" srcSet="/assets/지도 배경 데스크탑.png" />
                    <img src="/assets/지도 배경.png" alt="Map Background" className="hero-map-bg" />
                </picture>

                <div className="hero-inner">
                    <div className="hero-text">
                        <h2 className="hero-title">시민과 기술이 함께 만드는 <br className="mobile-only" /><span className="highlight-red">더 나은 부산</span></h2>
                        <p className="hero-subtitle">
                            시민의 목소리와 지능형 기술로<br />
                            도시를 진단하고 개선하는 참여형 플랫폼입니다.<br />
                            누구나 쉽게 의견을 제시하고,<br />
                            우리 동네 변화를 함께 만들어갈 수 있습니다.
                        </p>
                    </div>
                    <div className="hero-map-container">
                        {/* Interactive Map Overlay */}
                        <img src="/assets/busan_map.png" alt="Busan Map" className="hero-map-overlay" />
                    </div>
                </div>
            </div>

            {/* Content Wrapper */}
            <div className="content-wrapper">

                {/* Category Grid Section */}
                <CategoryGrid />

                {/* Citizen Cards Section */}
                <CitizenCards />

                {/* Action Cards & Survey Row - User wants: Survey / Report / Diagnose in a row */}
                <div className="action-row">
                    {/* Survey Banner (As Card 1) */}
                    <div className="action-item survey-card" onClick={() => onNavigate && onNavigate('survey')}>
                        <div>
                            <div className="card-title survey-title-text">설문조사</div>
                            <div className="card-subtitle">공공디자인 설문에 참여해주세요<br />~ 2025.12.19까지</div>
                        </div>
                        <div className="card-arrow mobile-only">→</div>
                        {/* Desktop arrow/icon styling handled in CSS */}
                    </div>

                    <div className="action-item card report" onClick={() => onNavigate && onNavigate('report')}>
                        <div>
                            <div className="card-title">제보/제안하기</div>
                            <div className="card-subtitle">당신의 아이디어가<br />도시를 더 멋지게!</div>
                            <div className="card-arrow">→</div>
                        </div>
                        <div className="card-icon">
                            <img src="/assets/suggest.png" alt="제보하기" />
                        </div>
                    </div>
                    <div className="action-item card diagnose" onClick={() => onNavigate && onNavigate('checkList')}>
                        <div>
                            <div className="card-title">진단하기</div>
                            <div className="card-subtitle">우리 동네 디자인,<br />같이 검진해볼까요?</div>
                            <div className="card-arrow">→</div>
                        </div>
                        <div className="card-icon">
                            <img src="/assets/check.png" alt="진단하기" />
                        </div>
                    </div>
                </div>


                <div className="stats-wrapper">
                    {/* Stats Section Title */}
                    <div className="stats-header-section" style={{ marginTop: '0px' }}>
                        <div>
                            <h2 className="section-title">내가 남긴 제보와 제안, <span className="highlight">지금 어떻게 진행되고 있을까요?</span></h2>
                            <p className="section-subtitle">등록한 내용의 검토·처리 상태를 쉽게 확인할 수 있습니다.</p>
                        </div>
                        <div className="stats-detail-btn-container">
                            <button className="btn-detail">
                                자세히보기 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E6235A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </button>
                        </div>
                    </div>

                    {/* Stats Graphs */}
                    <div className="stats-content-row">
                        <StatsContent />
                    </div>
                </div>


                <ArchiveCards />

                {/* Bottom Row: News & Guide */}
                <div className="bottom-row">
                    {/* News Section */}
                    <div className="news-section">
                        <div className="news-header">
                            <h2 className="section-title-sm">플랫폼 소식</h2>
                            <div className="news-more">더보기 &gt;</div>
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

            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-links">
                    <a href="#" className="footer-link">이용약관</a>
                    <a href="#" className="footer-link">개인정보처리방침</a>
                    <a href="#" className="footer-link">문의하기</a>
                </div>

                <div className="faq-btn">
                    자주 묻는 질문(FAQ) →
                </div>

                <div className="footer-info">
                    이메일 | support@busan-design.kr<br />
                    전화 | 051-000-0000<br />
                    운영시간 | 평일 09:00 - 18:00
                </div>

                {/* Divider and Centered Logo Section */}
                <div className="footer-divider"></div>

                <div className="footer-logo-container">
                    <div className="footer-logo">
                        <img src="/assets/logowhite.png" alt="부산참여플랫폼" style={{ height: '30px' }} />
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 'lighter' }}>© 2025 Busan Public Design Platform. All rights reserved.</div>
                </div>
            </footer>

            {/* Temporary Link for Dev */}
            <div style={{ textAlign: 'center', padding: '10px', background: '#f0f0f0' }} onClick={() => onNavigate && onNavigate('diagnosisResult')}>
                (Test) 진단 결과 페이지
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: '#e0e0e0', borderTop: '1px solid #ccc' }} onClick={() => onNavigate && onNavigate('expertDiagnosisResult')}>
                (Test) 전문가 진단 결과 페이지
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: '#d0d0d0', borderTop: '1px solid #ccc' }} onClick={() => onNavigate && onNavigate('adminLogin')}>
                (Test) 관리자 로그인
            </div>

            {/* Fixed Bottom Nav */}
            <nav className="bottom-nav">
                <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'home' ? '#E6007E' : '#999'} strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span className="nav-text">홈</span>
                </div>
                <div className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'report' ? '#E6007E' : '#999'} strokeWidth="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                    <span className="nav-text">제보/제안</span>
                </div>
                <div className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'stats' ? '#E6007E' : '#999'} strokeWidth="2">
                        <line x1="12" y1="20" x2="12" y2="10"></line>
                        <line x1="18" y1="20" x2="18" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="16"></line>
                    </svg>
                    <span className="nav-text">진단하기</span>
                </div>
                <div className={`nav-item ${activeTab === 'mypage' ? 'active' : ''}`} onClick={() => onNavigate && onNavigate('login')}>
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'mypage' ? '#E6007E' : '#999'} strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span className="nav-text">정보확인</span>
                </div>
            </nav>
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
    // Mock Data
    const citizens = [
        {
            id: 1,
            name: "홍길동",
            age: 72,
            tags: ["#액티브시니어", "#낭만어부", "#손자바라기"],
            desc: "다리가 아파서... 우리 집 앞 언덕길에 잠깐 쉴 의자 하나만 있으면 좋겠어.",
            img: null
        },
        {
            id: 2,
            name: "김수현",
            age: 23,
            tags: ["#대학생", "#취준생", "#밤길무서워"],
            desc: "늦게까지 공부하고 집에 가는 길이 너무 어둡고 불안해요. 학교 앞 골목에 조명이 더 있었으면...",
            img: null
        },
        {
            id: 3,
            name: "박지민",
            age: 35,
            tags: ["#워킹맘", "#유모차", "#안전제일"],
            desc: "유모차 끌고 공원 가는 길이 너무 울퉁불퉁해요. 아이가 자꾸 깨서 산책하기가 힘들어요.",
            img: null
        },
        {
            id: 4,
            name: "최민수",
            age: 18,
            tags: ["#고등학생", "#자전거등교", "#신호등"],
            desc: "학교 앞 신호등이 너무 짧아서 건너기 힘들어요. 뛰어가다 넘어질 뻔한 적도 있어요.",
            img: null
        },
        {
            id: 5,
            name: "정옥자",
            age: 68,
            tags: ["#경로당회장", "#골목길", "#쓰레기"],
            desc: "골목길에 쓰레기가 너무 많이 쌓여서 냄새가 나요. 분리수거함이 제대로 있었으면 좋겠는데...",
            img: null
        }
    ];

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

    // Count Up Animation
    useEffect(() => {
        if (!isBarVisible) return;

        const targets = { personal: 210, report: 330, diagnose: 72 };
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
    }, [isBarVisible]);

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
    const archives = [
        {
            id: 1,
            title: "보행약자를 위한 길",
            desc: "모두가 안전하게 이동할 수 있는 환경을 만들었습니다. 휠체어와 유모차도 편안하게 다닐 수 있는...",
            img: "/assets/archieve1.png"
        },
        {
            id: 2,
            title: "야간 보행 안전 조명",
            desc: "어두운 골목길을 밝혀 범죄를 예방하고, 주민들의 귀갓길을 안전하게 지킵니다.",
            img: "/assets/archieve2.png"
        },
        {
            id: 3,
            title: "어린이 보호구역 디자인",
            desc: "운전자들의 서행을 유도하는 디자인으로 아이들의 통학로가 더욱 안전해졌습니다.",
            img: "/assets/archieve3.png"
        },
        {
            id: 4,
            title: "셉테드 안심 골목길",
            desc: "범죄 예방 환경 설계(CPTED)를 적용하여 안심하고 다닐 수 있는 골목길을 조성했습니다.",
            img: "/assets/archieve1.png" // Reuse placeholder
        },
        {
            id: 5,
            title: "찾아가는 건강 의료 서비스",
            desc: "이동식 진료소 디자인을 통해 의료 소외 지역 주민들에게 찾아가는 서비스를 제공합니다.",
            img: "/assets/archieve2.png" // Reuse placeholder
        },
        {
            id: 6,
            title: "자원순환 재활용 정거장",
            desc: "쓰레기 배출 문제를 해결하고 자원 순환을 돕는 깔끔한 재활용 정거장을 설치했습니다.",
            img: "/assets/archieve3.png" // Reuse placeholder
        }
    ];

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
