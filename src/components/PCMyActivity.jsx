import React, { useState, useEffect } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCMyActivity.css';
import { API_URL } from '../utils/api';

/* PC 나의 활동 — Figma 269:15666 (PC_나의활동) */

const DISTRICTS = ['전체', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구'];
const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

const STAT_DEFS = [
    { key: 'report',   label: '제보',   icon: '/assets/activity/icon_report.png',    linkLabel: '제보 전체보기',   target: 'pcMyReportList' },
    { key: 'proposal', label: '제안',   icon: '/assets/activity/icon_proposal.png',  linkLabel: '제안 전체보기',   target: 'myProposals' },
    { key: 'diagnosis',label: '진단',   icon: '/assets/activity/icon_diagnosis.png', linkLabel: '진단 전체보기',   target: 'myDiagnosis' },
    { key: 'survey',   label: '설문',   icon: '/assets/activity/icon_survey.png',    linkLabel: '설문 전체보기',   target: 'mySurveys' },
];

const QUICK_MENU = [
    { label: '관심목록',       sub: '내가 찜한 글 보기',         target: null },
    { label: '최근 본 글',     sub: '최근 열람한 콘텐츠 보기',   target: null },
    { label: '자주 본 글',     sub: '자주 본 글보기',            target: null },
    { label: '회원정보 관리',  sub: '개인정보 및 개정 관리',     target: 'myPage' },
    { label: '서비스 이용 동의', sub: '이용 동의 내역 관리',     target: null },
    { label: '알림 수신 동의', sub: '알림 설정 관리',            target: null },
];

const lenOf = (rows) => (Array.isArray(rows) ? rows.length : 0);

const formatAccess = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    let h = d.getHours();
    const ampm = h < 12 ? '오전' : '오후';
    h = h % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, '0');
    return `마지막 접속 ${y}. ${m}. ${day}. ${ampm} ${h}:${min}`;
};

/* 중립 실루엣 placeholder — 아바타 생성 전/실패 시 표시 (성별 추정 이미지 금지) */
const NEUTRAL_AVATAR = '/assets/activity/info_person.svg';

const PCMyActivity = ({ onNavigate }) => {
    const [name, setName] = useState(localStorage.getItem('user_name') || '');
    const [lastLogin, setLastLogin] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [counts, setCounts] = useState({ report: 0, proposal: 0, survey: 0, diagnosis: 0 });
    const [activeDistrict, setActiveDistrict] = useState('전체');
    const [activeCategories, setActiveCategories] = useState(new Set(['전체']));

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const auth = { Authorization: `Bearer ${token}` };
        const getJson = (path) =>
            fetch(`${API_URL}${path}`, { headers: auth }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

        getJson('/users/me').then((d) => {
            if (d?.name) setName(d.name);
            if (d?.last_login) {
                const dt = new Date(d.last_login);
                if (!isNaN(dt)) setLastLogin(formatAccess(dt));
            }
        });

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
        if (cat === '전체') { setActiveCategories(new Set(['전체'])); return; }
        const next = new Set(activeCategories);
        next.delete('전체');
        if (next.has(cat)) { next.delete(cat); if (next.size === 0) next.add('전체'); }
        else next.add(cat);
        setActiveCategories(next);
    };

    return (
        <UserPCLayout currentView="myActivityHub" onNavigate={onNavigate}>
            <div className="pcma">
                <div className="pcma-inner">
                    {/* 페이지 타이틀 */}
                    <div className="pcma-page-header">
                        <h1 className="pcma-page-title">마이페이지</h1>
                        <p className="pcma-page-subtitle">나의 활동과 관심서비스를 한눈에 확인하세요.</p>
                    </div>

                    {/* 프로필 카드 (풀폭) */}
                    <div className="pcma-profile">
                        <img
                            className={`pcma-avatar${avatarUrl ? '' : ' pcma-avatar--placeholder'}`}
                            src={avatarUrl || NEUTRAL_AVATAR}
                            alt="프로필"
                            onError={() => setAvatarUrl(null)}
                        />
                        <div className="pcma-profile-info">
                            <div className="pcma-greeting">반가워요 <strong>{name || '회원'}님</strong></div>
                            {lastLogin && <div className="pcma-lastlogin">{lastLogin}</div>}
                        </div>
                        <button className="pcma-profile-edit-btn" onClick={() => onNavigate && onNavigate('myPage')}>
                            프로필 수정
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </button>
                    </div>

                    {/* 나의 활동 + 관심서비스 설정 (한 카드, 2단) */}
                    <div className="pcma-main-card">
                        {/* 나의 활동 */}
                        <section className="pcma-activity-section">
                            <h2 className="pcma-section-title">나의 활동</h2>
                            <div className="pcma-activity-grid">
                                {STAT_DEFS.map((s) => (
                                    <button
                                        key={s.key}
                                        className={`pcma-act-card pcma-act-card--${s.key}`}
                                        onClick={() => onNavigate && onNavigate(s.target)}
                                    >
                                        <span className="pcma-act-label">{s.label}</span>
                                        <img className="pcma-act-icon" src={s.icon} alt={s.label} />
                                        <div className="pcma-act-count">
                                            <strong>{counts[s.key]}</strong>건
                                        </div>
                                        <div className="pcma-act-link">
                                            {s.linkLabel}
                                            <svg className="pcma-act-arrow" width="7" height="14" viewBox="0 0 7 14" fill="none">
                                                <path d="M1 1l5 6-5 6" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 관심서비스 설정 */}
                        <section className="pcma-interest-section">
                            <h2 className="pcma-section-title">관심서비스 설정</h2>
                            <div className="pcma-interest-row">
                                {/* 지역별 */}
                                <div className="pcma-interest-card pcma-interest-card--district">
                                    <h3 className="pcma-interest-subtitle">지역별</h3>
                                    <div className="pcma-district-chips">
                                        {DISTRICTS.map(d => (
                                            <button
                                                key={d}
                                                className={`pcma-district-chip ${activeDistrict === d ? 'active' : ''}`}
                                                onClick={() => setActiveDistrict(d)}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 유형별 */}
                                <div className="pcma-interest-card pcma-interest-card--type">
                                    <h3 className="pcma-interest-subtitle">유형별</h3>
                                    <div className="pcma-category-list">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                className={`pcma-cat-item ${activeCategories.has(cat) ? 'active' : ''}`}
                                                onClick={() => toggleCategory(cat)}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* 빠른메뉴 (풀폭 카드, 1행 6열) */}
                    <div className="pcma-quick-card">
                        <h2 className="pcma-section-title">빠른메뉴</h2>
                        <div className="pcma-quick-grid">
                            {QUICK_MENU.map((item) => (
                                <button
                                    key={item.label}
                                    className="pcma-quick-item"
                                    onClick={() => item.target && onNavigate && onNavigate(item.target)}
                                >
                                    <span className="pcma-quick-label">{item.label}</span>
                                    <span className="pcma-quick-sub">{item.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </UserPCLayout>
    );
};

export default PCMyActivity;
