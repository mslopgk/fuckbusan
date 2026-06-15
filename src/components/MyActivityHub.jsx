/* MyActivityHub.jsx */
import React, { useState, useEffect } from 'react';
import './MyActivityHub.css';
import MobileBottomNav from './MobileBottomNav';
import PCMyActivity from './PCMyActivity';
import { fetchWithLogout, API_URL } from '../utils/api';

const CATEGORIES = [
    { id: 'all', label: '전체' },
    { id: 'housing', label: '주거' },
    { id: 'env', label: '환경' },
    { id: 'traffic', label: '교통' },
    { id: 'industry', label: '산업·일자리' },
    { id: 'edu', label: '교육' },
    { id: 'safety', label: '안전' },
    { id: 'culture', label: '문화·여가' },
    { id: 'health', label: '보건·복지' },
];

const MyActivityHub = ({ onBack, onNavigate }) => {
    const [isPC, setIsPC] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    const [activeCat, setActiveCat] = useState('all');
    const [userName, setUserName] = useState(localStorage.getItem('user_name') || '사용자');
    const [lastLogin, setLastLogin] = useState('');
    const [idVerified, setIdVerified] = useState(true);
    const [areaVerified, setAreaVerified] = useState(false);
    const [counts, setCounts] = useState({ report: 0, proposal: 0, survey: 0, diagnosis: 0 });

    useEffect(() => {
        const onResize = () => setIsPC(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    /* 사용자 정보 & 카운트 fetch */
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // 사용자 me
        fetchWithLogout(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                if (data.name || data.username) setUserName(data.name || data.username);
                if (data.last_login) {
                    try {
                        const d = new Date(data.last_login);
                        setLastLogin(
                            `마지막 접속 일시는 ${d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 였습니다.`
                        );
                    } catch (_) {}
                }
            })
            .catch(() => {});

        // 나의 진단 건수
        fetchWithLogout(`${API_URL}/checklist/my`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (Array.isArray(data)) {
                    setCounts(prev => ({ ...prev, diagnosis: data.length }));
                }
            })
            .catch(() => {});
    }, []);

    // PC 분기 — 절대 건드리지 말 것
    if (isPC) return <PCMyActivity onNavigate={onNavigate} />;

    return (
        <div className="mahub-container">
            {/* 상단 바 */}
            <div className="mahub-topbar">
                <button
                    className="mahub-profile-manage-btn"
                    onClick={() => onNavigate('myPage')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    내 정보 관리
                </button>
            </div>

            {/* 프로필 카드 */}
            <div className="mahub-profile-card">
                <div className="mahub-profile-left">
                    <p className="mahub-greeting">
                        반가워요<br />
                        <span className="mahub-greeting-name">{userName}님</span>
                    </p>
                    {lastLogin && (
                        <p className="mahub-last-login">{lastLogin}</p>
                    )}
                    <div className="mahub-verify-badges">
                        <div className={`mahub-verify-row ${idVerified ? 'verified' : 'unverified'}`}>
                            <img src="/assets/activity/verify_id_icon.png" alt="본인인증" className="mahub-verify-icon" />
                            <span>본인인증 완료</span>
                        </div>
                        <div className={`mahub-verify-row ${areaVerified ? 'verified' : 'unverified'}`}>
                            <img src="/assets/activity/verify_area_icon.png" alt="동네인증" className="mahub-verify-icon" />
                            <span>동네 인증(최근 30일)</span>
                        </div>
                    </div>
                </div>
                <div className="mahub-profile-avatar">
                    <img src="/assets/activity/profile_avatar.png" alt="프로필" />
                </div>
            </div>

            {/* 관심 버튼 3개 */}
            <div className="mahub-bookmark-row">
                <button className="mahub-bookmark-pill">관심목록</button>
                <button className="mahub-bookmark-pill">최근 본 글</button>
                <button className="mahub-bookmark-pill">자주본 글</button>
            </div>

            {/* 나의 활동 섹션 */}
            <div className="mahub-activity-section">
                <h2 className="mahub-activity-title">나의 활동</h2>

                {/* 카테고리 필터 */}
                <div className="mahub-cat-scroll">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`mahub-cat-chip ${activeCat === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCat(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* 2×2 통계 그리드 */}
                <div className="mahub-stats-container">
                    <div className="mahub-stats-grid">
                        {/* 제보 */}
                        <button
                            className="mahub-stat-card"
                            onClick={() => onNavigate('myReportList')}
                        >
                            <span className="mahub-stat-label">제보</span>
                            <span className="mahub-stat-count report">
                                <span className="mahub-stat-num">{counts.report}</span>건
                            </span>
                        </button>

                        {/* 제안 */}
                        <button
                            className="mahub-stat-card"
                            onClick={() => onNavigate('myProposals')}
                        >
                            <span className="mahub-stat-label">제안</span>
                            <span className="mahub-stat-count proposal">
                                <span className="mahub-stat-num">{counts.proposal}</span>건
                            </span>
                        </button>

                        {/* 설문 */}
                        <button
                            className="mahub-stat-card"
                            onClick={() => onNavigate('mySurveys')}
                        >
                            <span className="mahub-stat-label">설문</span>
                            <span className="mahub-stat-count survey">
                                <span className="mahub-stat-num">{counts.survey}</span>건
                            </span>
                        </button>

                        {/* 진단 */}
                        <button
                            className="mahub-stat-card"
                            onClick={() => onNavigate('mMyActivity')}
                        >
                            <span className="mahub-stat-label">진단</span>
                            <span className="mahub-stat-count diagnosis">
                                <span className="mahub-stat-num">{counts.diagnosis}</span>건
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <MobileBottomNav currentView="myActivityHub" onNavigate={onNavigate} />
        </div>
    );
};

export default MyActivityHub;
