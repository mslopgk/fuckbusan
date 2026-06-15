import React, { useState } from 'react';
import './HomeMobile.css';
import BusanMap from './BusanMap';
import MobileBottomNav from './MobileBottomNav';
import BUSAN_DONG from '../data/busanDong';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

/* 모바일 홈 — WDC Figma node 215:16807 (Group 685, 393×1473) */

const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

const NEWS = [
    '2025년 1월 시민 참여 결과 리포트가 업데이트되었습니다.',
    '도로·보행 환경 개선 의견 접수 기간 안내',
    '서비스 정기 점검 일정 안내 (12/30 02:00–05:00)',
    '제보된 안전 위험 요소의 조치 현황을 확인하세요',
    '우수 사례 아카이브 신규 콘텐츠가 추가되었습니다',
];

// Figma "Icons / arrow" (viewBox 16) — currentColor 로 색 제어
const Arrow = ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" />
    </svg>
);

const HomeMobile = ({ onNavigate }) => {
    const [district, setDistrict] = useState(null); // 구·군 (지도 선택)
    const [dong, setDong] = useState(null);          // 읍·면·동 (드롭다운 선택)
    const [filterOpen, setFilterOpen] = useState(false);
    const [cat, setCat] = useState('전체');
    const { count: unreadCount } = useUnreadNotifications();

    const go = (t) => onNavigate && onNavigate(t);

    // 지도에서 구·군 바뀌면 동 선택 초기화
    const handleDistrictChange = (gu) => { setDistrict(gu); setDong(null); setFilterOpen(false); };
    const dongList = district ? (BUSAN_DONG[district] || []) : [];

    return (
        <div className="hmob">
            {/* 히어로 (크림 배경) */}
            <div className="hmob-hero">
                <header className="hmob-header">
                    <button className="hmob-logo" onClick={() => go('home')} aria-label="홈">
                        <img src="/WDC.svg" alt="WDC" />
                    </button>
                    <button className="hmob-bell" aria-label="알림" onClick={() => go('mNotifications')}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && <span className="hmob-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                    </button>
                </header>

                <div className="hmob-hero-text">
                    <h1>시민과 기술이 함께 만드는<br /><span className="accent">더 나은 부산</span></h1>
                    <p>
                        시민의 목소리와 지능형 기술로<br />
                        도시를 진단하고 개선하는 참여형 플랫폼입니다.<br />
                        누구나 쉽게 의견을 제시하고,<br />
                        우리 동네 변화를 함께 만들어갈 수 있습니다.
                    </p>
                </div>

                <div className="hmob-map">
                    <BusanMap selectedDistrict={district} onDistrictChange={handleDistrictChange} />
                </div>
            </div>

            {/* 구역별 (지도에서 고른 구·군의 읍·면·동) */}
            <div className="hmob-filter">
                <span className="hmob-filter-label">구역별{district ? ` · ${district}` : ''}</span>
                <div
                    className={`hmob-filter-select${district ? '' : ' disabled'}`}
                    onClick={() => { if (district) setFilterOpen((o) => !o); }}
                >
                    <span className={dong ? '' : 'placeholder'}>
                        {dong || (district ? '읍·면·동을 선택하세요' : '지도에서 구·군을 먼저 선택하세요')}
                    </span>
                    {dong && (
                        <svg className="hmob-filter-clear" width="20" height="20" viewBox="0 0 24 24" fill="#bdbdbd"
                            onClick={(e) => { e.stopPropagation(); setDong(null); }}>
                            <circle cx="12" cy="12" r="10" /><path d="M9 9l6 6M15 9l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                    <svg className={`hmob-filter-arrow${filterOpen ? ' open' : ''}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={district ? '#242424' : '#bbb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {filterOpen && district && (
                    <ul className="hmob-filter-menu">
                        {dongList.map((d) => (
                            <li key={d} className={d === dong ? 'active' : ''} onClick={() => { setDong(d); setFilterOpen(false); }}>{d}</li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 생활정보 칩 (가로 스크롤) */}
            <div className="hmob-cats">
                {CATEGORIES.map((c) => (
                    <button key={c} className={`hmob-chip${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
                ))}
            </div>

            {/* 제보 / 제안 카드 */}
            <div className="hmob-cards">
                <button className="hmob-card report" onClick={() => go('mReportMap')}>
                    <img className="hmob-card-emoji sm" src="/pencilicon.svg" alt="" />
                    <span className="hmob-card-title">제보하기</span>
                    <p className="hmob-card-sub">당신의 아이디어가<br />도시를 더 멋지게!</p>
                    <span className="hmob-card-arrow"><Arrow size={24} color="#fff" /></span>
                </button>
                <button className="hmob-card propose" onClick={() => go('mProposalMap')}>
                    <img className="hmob-card-emoji" src="/lighticon.svg" alt="" />
                    <span className="hmob-card-title">제안하기</span>
                    <p className="hmob-card-sub">우리 동네 디자인,<br />같이 점검해볼까요?</p>
                    <span className="hmob-card-arrow"><Arrow size={24} color="#fff" /></span>
                </button>
            </div>

            {/* 플랫폼 소식 */}
            <section className="hmob-news">
                <div className="hmob-news-head">
                    <h2>플랫폼 소식</h2>
                    <button className="hmob-pill" onClick={() => go('mPlatformNews')}>더보기 <Arrow size={16} color="#1e1e1e" /></button>
                </div>
                <div className="hmob-news-divider" />
                <ul className="hmob-news-list">
                    {NEWS.map((n, i) => (<li key={i}>{n}</li>))}
                </ul>
            </section>

            {/* 처음 방문하셨나요 */}
            <section className="hmob-guide">
                <div className="hmob-guide-body">
                    <h2>처음 방문하셨나요?</h2>
                    <p>지도를 보며 문제를 선택하고 의견을 남기면, 동네 개선에 직접 기여할 수 있습니다. 한 번의 참여로 우리 동네 변화에 함께할 수 있습니다.</p>
                    <button className="hmob-pill red">참여가이드 <Arrow size={16} color="#e6235a" /></button>
                </div>
                <img className="hmob-guide-char" src="/assets/guide_character.png" alt="가이드 캐릭터" />
            </section>

            <MobileBottomNav currentView="home" onNavigate={onNavigate} />
        </div>
    );
};

export default HomeMobile;
