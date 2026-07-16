/* MyActivityHub.jsx — Figma 269:24130 기준 */
import React, { useState, useEffect } from 'react';
import './MyActivityHub.css';
import MobileBottomNav from './MobileBottomNav';
import PCMyActivity from './PCMyActivity';
import { fetchWithLogout, API_URL } from '../utils/api';

const DISTRICTS = ['전체', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구'];
const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

/* 중립 실루엣 placeholder — 아바타 생성 전/실패 시 표시 (성별 추정 이미지 금지) */
const NEUTRAL_AVATAR = '/assets/activity/info_person.svg';

const MyActivityHub = ({ onBack, onNavigate }) => {
    const [isPC, setIsPC] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    const [userName, setUserName] = useState(localStorage.getItem('user_name') || '사용자');
    const [lastLogin, setLastLogin] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [counts, setCounts] = useState({ report: 0, proposal: 0, survey: 0, diagnosis: 0 });
    const [activeDistrict, setActiveDistrict] = useState('전체');
    const [activeCategories, setActiveCategories] = useState(new Set(['전체']));

    useEffect(() => {
        const onResize = () => setIsPC(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    /* 사용자 정보 & 카운트 fetch */
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

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
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        let h = d.getHours();
                        const ampm = h < 12 ? '오전' : '오후';
                        h = h % 12 || 12;
                        const min = String(d.getMinutes()).padStart(2, '0');
                        setLastLogin(`마지막 접속 ${y}. ${m}. ${day}. ${ampm} ${h}:${min}`);
                    } catch (_) {}
                }
            })
            .catch(() => {});

        const lenOf = (d) => (Array.isArray(d) ? d.length : 0);
        const getJson = (path) =>
            fetchWithLogout(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => (r.ok ? r.json() : null)).catch(() => null);

        // 회원정보(나이대) 기반 생성 아바타 — 실패/폴백 시 중립 실루엣 유지
        getJson('/users/me/avatar').then((d) => {
            if (d?.url) setAvatarUrl(`${API_URL}${d.url}`);
        });
        Promise.all([
            getJson('/api/reports/mine'),
            getJson('/api/reports/my-proposals'),
            getJson('/checklist/my'),
            getJson('/api/surveys/my-participations'),
        ]).then(([reports, proposals, diagnoses, surveys]) => {
            setCounts({
                report: lenOf(reports),
                proposal: lenOf(proposals),
                diagnosis: lenOf(diagnoses),
                survey: lenOf(surveys),
            });
        });
    }, []);

    const toggleCategory = (cat) => {
        if (cat === '전체') {
            setActiveCategories(new Set(['전체']));
            return;
        }
        const next = new Set(activeCategories);
        next.delete('전체');
        if (next.has(cat)) {
            next.delete(cat);
            if (next.size === 0) next.add('전체');
        } else {
            next.add(cat);
        }
        setActiveCategories(next);
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        localStorage.removeItem('user_name');
        localStorage.removeItem('district_code');
        onNavigate('home');
    };

    // PC 분기 — 절대 건드리지 말 것
    if (isPC) return <PCMyActivity onNavigate={onNavigate} />;

    return (
        <div className="mahub-container">
            {/* 페이지 타이틀 */}
            <div className="mahub-page-header">
                <h1 className="mahub-page-title">마이페이지</h1>
                <p className="mahub-page-subtitle">나의 활동과 관심서비스를 한눈에 확인하세요.</p>
            </div>

            {/* 프로필 카드 */}
            <div className="mahub-profile-card">
                <div className="mahub-profile-avatar">
                    <img
                        className={avatarUrl ? '' : 'mahub-avatar-placeholder'}
                        src={avatarUrl || NEUTRAL_AVATAR}
                        alt="프로필"
                        onError={() => setAvatarUrl(null)}
                    />
                </div>
                <div className="mahub-profile-info">
                    <p className="mahub-greeting">반가워요 <strong>{userName}님</strong></p>
                    {lastLogin && <p className="mahub-last-login">{lastLogin}</p>}
                    <button className="mahub-profile-edit-btn" onClick={() => onNavigate('myPage')}>
                        프로필 수정
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 나의 활동 섹션 */}
            <div className="mahub-section">
                <h2 className="mahub-section-title">나의 활동</h2>
                <div className="mahub-activity-grid">
                    {/* 제보 */}
                    <button className="mahub-act-card mahub-act-card--report" onClick={() => onNavigate('myReportList')}>
                        <div className="mahub-act-top">
                            <span className="mahub-act-label">제보</span>
                            <img className="mahub-act-icon" src="/assets/activity/icon_report.png" alt="제보" />
                        </div>
                        <div className="mahub-act-count">
                            <strong>{counts.report}</strong>건
                        </div>
                        <div className="mahub-act-link">제보 전체보기 <span className="mahub-act-arrow">›</span></div>
                    </button>

                    {/* 제안 */}
                    <button className="mahub-act-card mahub-act-card--proposal" onClick={() => onNavigate('myProposals')}>
                        <div className="mahub-act-top">
                            <span className="mahub-act-label">제안</span>
                            <img className="mahub-act-icon" src="/assets/activity/icon_proposal.png" alt="제안" />
                        </div>
                        <div className="mahub-act-count">
                            <strong>{counts.proposal}</strong>건
                        </div>
                        <div className="mahub-act-link">제안 전체보기 <span className="mahub-act-arrow">›</span></div>
                    </button>

                    {/* 진단 */}
                    <button className="mahub-act-card mahub-act-card--diagnosis" onClick={() => onNavigate('myDiagnosis')}>
                        <div className="mahub-act-top">
                            <span className="mahub-act-label">진단</span>
                            <img className="mahub-act-icon" src="/assets/activity/icon_diagnosis.png" alt="진단" />
                        </div>
                        <div className="mahub-act-count">
                            <strong>{counts.diagnosis}</strong>건
                        </div>
                        <div className="mahub-act-link">진단 전체보기 <span className="mahub-act-arrow">›</span></div>
                    </button>

                    {/* 설문 */}
                    <button className="mahub-act-card mahub-act-card--survey" onClick={() => onNavigate('mySurveys')}>
                        <div className="mahub-act-top">
                            <span className="mahub-act-label">설문</span>
                            <img className="mahub-act-icon" src="/assets/activity/icon_survey.png" alt="설문" />
                        </div>
                        <div className="mahub-act-count">
                            <strong>{counts.survey}</strong>건
                        </div>
                        <div className="mahub-act-link">설문 전체보기 <span className="mahub-act-arrow">›</span></div>
                    </button>
                </div>
            </div>

            {/* 관심서비스 설정 섹션 */}
            <div className="mahub-section">
                <h2 className="mahub-section-title">관심서비스 설정</h2>

                {/* 지역별 */}
                <div className="mahub-interest-card">
                    <h3 className="mahub-interest-subtitle">지역별</h3>
                    <div className="mahub-district-chips">
                        {DISTRICTS.map(d => (
                            <button
                                key={d}
                                className={`mahub-district-chip ${activeDistrict === d ? 'active' : ''}`}
                                onClick={() => setActiveDistrict(d)}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 유형별 — Figma 269:24130: 좌 4개 / 우 5개 두 열 그룹 */}
                <div className="mahub-interest-card mahub-interest-card--type">
                    <h3 className="mahub-interest-subtitle">유형별</h3>
                    <div className="mahub-category-cols">
                        {[CATEGORIES.slice(0, 4), CATEGORIES.slice(4)].map((col, ci) => (
                            <div key={ci} className="mahub-category-col">
                                {col.map(cat => (
                                    <label key={cat} className="mahub-cat-row">
                                        <span className={`mahub-cat-checkbox ${activeCategories.has(cat) ? 'checked' : ''}`}>
                                            {activeCategories.has(cat) && (
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 6l3 3 5-5" stroke="#23bdbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </span>
                                        <span className="mahub-cat-name" onClick={() => toggleCategory(cat)}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 빠른메뉴 섹션 */}
            <div className="mahub-section">
                <h2 className="mahub-section-title">빠른메뉴</h2>
                <div className="mahub-quick-grid">
                    <button className="mahub-quick-item" onClick={() => {}}>
                        <div className="mahub-quick-top">
                            <span className="mahub-quick-label">관심목록</span>
                            <img src="/assets/activity/icon_quick_bookmark.png" alt="" className="mahub-quick-icon" onError={e => e.target.style.display='none'} />
                        </div>
                        <span className="mahub-quick-sub">내가 찜한 글 보기</span>
                    </button>
                    <button className="mahub-quick-item" onClick={() => {}}>
                        <div className="mahub-quick-top">
                            <span className="mahub-quick-label">최근 본 글</span>
                            <img src="/assets/activity/icon_quick_recent.png" alt="" className="mahub-quick-icon" onError={e => e.target.style.display='none'} />
                        </div>
                        <span className="mahub-quick-sub">최근 열람한 콘텐츠 보기</span>
                    </button>
                    <button className="mahub-quick-item" onClick={() => {}}>
                        <div className="mahub-quick-top">
                            <span className="mahub-quick-label">자주 본 글</span>
                            <img src="/assets/activity/icon_quick_frequent.png" alt="" className="mahub-quick-icon" onError={e => e.target.style.display='none'} />
                        </div>
                        <span className="mahub-quick-sub">자주 본 글보기</span>
                    </button>
                    <button className="mahub-quick-item" onClick={() => onNavigate('myPage')}>
                        <div className="mahub-quick-top">
                            <span className="mahub-quick-label">회원정보 관리</span>
                        </div>
                        <span className="mahub-quick-sub">개인정보 및 개정 관리</span>
                    </button>
                    <button className="mahub-quick-item" onClick={() => {}}>
                        <div className="mahub-quick-top">
                            <span className="mahub-quick-label">서비스 이용 동의</span>
                            <img src="/assets/activity/icon_quick_consent.png" alt="" className="mahub-quick-icon" onError={e => e.target.style.display='none'} />
                        </div>
                        <span className="mahub-quick-sub">이용 동의 내역 관리</span>
                    </button>
                    <button className="mahub-quick-item" onClick={() => {}}>
                        <div className="mahub-quick-top">
                            <span className="mahub-quick-label">알림 수신 동의</span>
                        </div>
                        <span className="mahub-quick-sub">알림 설정 관리</span>
                    </button>
                </div>
            </div>

            {/* 로그아웃 */}
            <button className="mahub-logout-btn" onClick={handleLogout}>
                로그아웃
            </button>

            <MobileBottomNav currentView="myActivityHub" onNavigate={onNavigate} />
        </div>
    );
};

export default MyActivityHub;
