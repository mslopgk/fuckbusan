import React, { useState, useEffect } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCMyActivity.css';
import { API_URL } from '../utils/api';

/* PC 나의 활동 — Figma 215:2080 (PC_나의활동) */

const TABS = ['관심목록', '최근 본 글', '자주본 글'];

const STAT_DEFS = [
    { key: 'report', label: '제보', color: '#f74e7e', target: 'myReportList' },
    { key: 'proposal', label: '제안', color: '#23bdbb', target: 'myProposals' },
    { key: 'survey', label: '설문', color: '#542aa3', target: 'mySurveys' },
    { key: 'diagnosis', label: '진단', color: '#dd5b1b', target: 'pcDiagnosisMap' },
];

const PCMyActivity = ({ onNavigate }) => {
    const [tab, setTab] = useState('관심목록');
    const [name, setName] = useState(localStorage.getItem('user_name') || '');
    const [counts, setCounts] = useState({ report: 0, proposal: 0, survey: 0, diagnosis: 0 });

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const auth = { Authorization: `Bearer ${token}` };
        fetch(`${API_URL}/users/me`, { headers: auth })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.name) setName(d.name); })
            .catch(() => {});
        // 나의 제보/제안 카운트 (/api/reports/mine: 내가 쓴 글)
        fetch(`${API_URL}/api/reports/mine`, { headers: auth })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                if (!Array.isArray(rows)) return;
                const report = rows.filter((it) => (it.type || it.post_type) !== 'proposal').length;
                const proposal = rows.filter((it) => (it.type || it.post_type) === 'proposal').length;
                setCounts((c) => ({ ...c, report, proposal }));
            })
            .catch(() => {});
    }, []);

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
                                마지막 접속 일시는 3개월 전<br />
                                2025. 12. 09. 오전 10:44 였습니다.
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
