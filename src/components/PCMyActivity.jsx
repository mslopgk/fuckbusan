import React, { useState, useEffect } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCMyActivity.css';
import { API_URL } from '../utils/api';
import { getRecentViews, getFrequentViews } from '../utils/viewHistory';

/* PC 나의 활동 — Figma 215:2080 (PC_나의활동) */

const TABS = ['관심목록', '최근 본 글', '자주본 글'];

const LIKED_REPORTS_KEY = 'liked_report_ids';
const readLikedReportIds = () => {
    try { return new Set(JSON.parse(localStorage.getItem(LIKED_REPORTS_KEY) || '[]')); } catch { return new Set(); }
};

// 항목 클릭 → 도메인별 상세로 이동
const navTargetFor = (it) => {
    if (it.type === 'report') return ['pcReportDetail', { id: it.id }];
    if (it.type === 'proposal') return ['pcMyProposalDetail', { id: it.id, title: it.title }];
    if (it.type === 'survey') return ['pcSurveyResults', { id: it.id, title: it.title }];
    return ['pcDiagnosisMap', null];
};

const TYPE_LABEL = { report: '제보', proposal: '제안', survey: '설문', diagnosis: '진단' };

const STAT_DEFS = [
    { key: 'report', label: '제보', color: '#f74e7e', target: 'pcMyReportList' },
    { key: 'proposal', label: '제안', color: '#23bdbb', target: 'myProposals' },
    { key: 'survey', label: '설문', color: '#542aa3', target: 'mySurveys' },
    { key: 'diagnosis', label: '진단', color: '#dd5b1b', target: 'pcDiagnosisMap' },
];

const lenOf = (rows) => (Array.isArray(rows) ? rows.length : 0);

// "3개월 전", "5일 전" 같은 상대시간
const relativeTime = (d) => {
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return '방금';
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}일 전`;
    const mon = Math.floor(day / 30);
    if (mon < 12) return `${mon}개월 전`;
    return `${Math.floor(mon / 12)}년 전`;
};

// "2025. 12. 09. 오전 10:44"
const formatAccess = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    let h = d.getHours();
    const ampm = h < 12 ? '오전' : '오후';
    h = h % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}. ${m}. ${day}. ${ampm} ${h}:${min}`;
};

const PCMyActivity = ({ onNavigate }) => {
    const [tab, setTab] = useState('관심목록');
    const [name, setName] = useState(localStorage.getItem('user_name') || '');
    const [lastLogin, setLastLogin] = useState(null);
    const [counts, setCounts] = useState({ report: 0, proposal: 0, survey: 0, diagnosis: 0 });
    const [bookmarks, setBookmarks] = useState([]); // 관심목록: 좋아요 제보 + 투표 제안

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const auth = { Authorization: `Bearer ${token}` };
        const getJson = (path) =>
            fetch(`${API_URL}${path}`, { headers: auth }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

        getJson('/users/me').then((d) => {
            if (d?.name) setName(d.name);
            if (d?.last_login) { const dt = new Date(d.last_login); if (!isNaN(dt)) setLastLogin(dt); }
        });

        // 4개 도메인 카운트를 각 전용 엔드포인트에서 집계
        // 제보=/api/reports/mine, 제안=/api/reports/my-proposals, 진단=/checklist/my, 설문=/api/surveys/my-participations
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

        // 관심목록: 좋아요한 제보(localStorage id → /api/reports/full에서 매칭) + 투표한 제안(/voted-proposals)
        const likedIds = readLikedReportIds();
        Promise.all([
            likedIds.size ? getJson('/api/reports/full') : Promise.resolve(null),
            getJson('/api/reports/voted-proposals'),
        ]).then(([full, voted]) => {
            const rows = Array.isArray(full?.items) ? full.items : (Array.isArray(full) ? full : []);
            const likedReports = rows
                .filter((r) => likedIds.has(r.id))
                .map((r) => ({ type: 'report', id: r.id, title: r.title, category: r.category, region: r.region, status: r.status }));
            const votedProposals = (Array.isArray(voted) ? voted : [])
                .map((p) => ({ type: 'proposal', id: p.id, title: p.title, category: p.category, region: p.region, status: '' }));
            setBookmarks([...likedReports, ...votedProposals]);
        });
    }, []);

    const tabItems = tab === '관심목록' ? bookmarks
        : tab === '최근 본 글' ? getRecentViews(20)
            : getFrequentViews(20);

    const emptyMsg = tab === '관심목록' ? '좋아요·투표한 글이 여기에 모여요.'
        : tab === '최근 본 글' ? '최근 본 글이 없습니다.'
            : '자주 본 글이 없습니다. (2번 이상 본 글이 모여요)';

    const openItem = (it) => {
        const [target, payload] = navTargetFor(it);
        onNavigate && onNavigate(target, payload);
    };

    return (
        <UserPCLayout currentView="myActivityHub" onNavigate={onNavigate}>
            <div className="pcma">
                <div className="pcma-inner">
                    {/* 프로필 헤더 */}
                    <div className="pcma-head">
                        <h2 className="pcma-h">프로필</h2>
                        <button className="pcma-info-link" onClick={() => onNavigate && onNavigate('myPage')}>
                            <img src="/assets/activity/info_person.svg" alt="" /> 내 정보 관리
                        </button>
                    </div>

                    {/* 프로필 카드 */}
                    <div className="pcma-profile">
                        <img className="pcma-avatar" src="/assets/activity/avatar.png" alt="프로필" />
                        <div className="pcma-profile-info">
                            <div className="pcma-greeting">반가워요 {name || '회원'}님</div>
                            <div className="pcma-lastlogin">
                                {lastLogin ? (
                                    <>
                                        마지막 접속 일시는 {relativeTime(lastLogin)}<br />
                                        {formatAccess(lastLogin)} 였습니다.
                                    </>
                                ) : (
                                    <>
                                        오늘도 우리 동네를 위한<br />
                                        활동에 참여해 주셔서 감사합니다.
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="pcma-verify">
                            <div className="pcma-verify-row"><img src="/assets/activity/verify_id.png" alt="" /> 본인인증 완료</div>
                            <div className="pcma-verify-row"><img src="/assets/activity/verify_area.png" alt="" /> 동네 인증(최근 30일)</div>
                        </div>
                    </div>

                    {/* 탭 */}
                    <div className="pcma-tabs">
                        {TABS.map((t) => (
                            <button key={t} className={`pcma-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
                        ))}
                    </div>

                    {/* 탭 콘텐츠 (관심목록 / 최근 본 글 / 자주 본 글) */}
                    <div className="pcma-tablist">
                        {tabItems.length === 0 ? (
                            <div className="pcma-empty">{emptyMsg}</div>
                        ) : (
                            tabItems.map((it) => (
                                <button key={`${it.type}:${it.id}`} className="pcma-listitem" onClick={() => openItem(it)}>
                                    <span className={`pcma-listitem-type type-${it.type}`}>{TYPE_LABEL[it.type] || ''}</span>
                                    <span className="pcma-listitem-title">{it.title}</span>
                                    <span className="pcma-listitem-meta">
                                        {it.region && <span>{it.region}</span>}
                                        {it.category && <span>{it.category}</span>}
                                        {it.viewedAt && <span>{relativeTime(new Date(it.viewedAt))}</span>}
                                        {tab === '자주본 글' && it.count && <span>{it.count}회</span>}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    {/* 나의 활동 통계 */}
                    <h2 className="pcma-h pcma-section">나의 활동</h2>
                    <div className="pcma-stats">
                        {STAT_DEFS.map((s) => (
                            <button key={s.key} className="pcma-stat" onClick={() => onNavigate && onNavigate(s.target)}>
                                <span className="pcma-stat-label">{s.label}</span>
                                <span className="pcma-stat-count">
                                    <b style={{ color: s.color }}>{counts[s.key]}</b>건
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </UserPCLayout>
    );
};

export default PCMyActivity;
