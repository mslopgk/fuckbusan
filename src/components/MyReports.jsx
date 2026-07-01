import React, { useState, useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MyReports.css';
import { API_URL } from '../utils/api';

const MyReports = ({ onBack, onNavigate, deletedIds, likedIds, onToggleLike, userCreatedReports, updatedReportsMap }) => {
    const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'likes'
    const [statusFilter, setStatusFilter] = useState('검토중');
    const [serverReports, setServerReports] = useState([]);
    const [myServerReports, setMyServerReports] = useState([]);

    useEffect(() => {
        // Public list (used for 'likes' tab merge)
        fetch(`${API_URL}/api/reports/full`)
            .then(res => res.ok ? res.json() : [])
            .then(data => Array.isArray(data) ? setServerReports(data) : setServerReports([]))
            .catch(err => { console.error('Failed to load reports:', err); setServerReports([]); });

        // My-only list (auth-gated)
        const token = localStorage.getItem('access_token');
        if (token) {
            fetch(`${API_URL}/api/reports/mine`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.ok ? res.json() : [])
                .then(data => Array.isArray(data) ? setMyServerReports(data) : setMyServerReports([]))
                .catch(err => { console.error('Failed to load my reports:', err); setMyServerReports([]); });
        }
    }, []);

    const handleCardClick = (report) => {
        onNavigate('mMyReportDetail', { ...report, showActions: activeTab === 'mine' });
    };

    const getFinalMyReports = () => {
        let base = activeTab === 'mine'
            ? [...userCreatedReports, ...myServerReports]
            : [...userCreatedReports, ...myServerReports, ...serverReports];
        return base.map(r => {
            if (updatedReportsMap && updatedReportsMap[r.id]) {
                return { ...r, ...updatedReportsMap[r.id] };
            }
            return r;
        });
    };

    const finalMyReports = getFinalMyReports();

    const filteredReports = finalMyReports.filter(report => {
        // 0. Filter out deleted reports
        if (deletedIds && deletedIds.has(report.id)) return false;

        // 1. Tab filter
        if (activeTab === 'likes') return likedIds && likedIds.has(report.id);

        // 2. Status filter — map by progress_step (1=접수, 2=검토중, >=3=검토완료)
        const step = report.progress_step ?? 1;
        if (statusFilter === '접수')    return step === 1;
        if (statusFilter === '검토중')   return step === 2;
        if (statusFilter === '검토완료') return step >= 3;
        return true;
    });

    // likes 탭에서의 좋아요 아이콘 색: 보라(#542aa3)
    const heartColor = activeTab === 'likes' ? '#542aa3' : '#bfbfbf';
    const heartFill  = activeTab === 'likes' ? '#542aa3' : 'none';

    return (
        <div className="my-reports-container">
            {/* 헤더 — 뒤로가기 버튼만 (Figma: 좌측 chevron) */}
            <header className="mr-header">
                <button className="mr-back-btn" onClick={onBack} aria-label="뒤로가기">
                    <svg width="7" height="13" viewBox="0 0 7 13" fill="none">
                        <path d="M6 1L1 6.5L6 12" stroke="#1a1a1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </header>

            {/* 탭 스위처 (나의 제보글 | 좋아요 제보글) */}
            {/* Figma 215:14052: 나의 제보글 active → 보라 pill on left */}
            {/* Figma 215:14160: 좋아요 제보글 active → 보라 pill on right */}
            <div className="mr-tabs-container">
                <div className="mr-tab-switcher">
                    <button
                        className={`mr-tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mine')}
                    >
                        나의 제보글
                    </button>
                    <button
                        className={`mr-tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('likes')}
                    >
                        좋아요 제보글
                    </button>
                </div>
            </div>

            {/* 상태 필터 — 나의 제보글 탭에만 표시 (Figma 215:14052) */}
            {activeTab === 'mine' && (
                <div className="mr-status-container">
                    <div className="mr-status-tabs">
                        {['접수', '검토중', '검토완료'].map(tab => (
                            <button
                                key={tab}
                                className={`mr-status-tab ${statusFilter === tab ? 'active' : ''}`}
                                onClick={() => setStatusFilter(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 리스트 */}
            <div className="mr-list">
                {filteredReports.length === 0 && (
                    <div className="mr-empty">
                        {activeTab === 'likes'
                            ? '아직 좋아요한 제보가 없습니다.'
                            : `${statusFilter} 단계의 제보가 없습니다.`}
                    </div>
                )}
                {filteredReports.map(report => (
                    <div key={report.id} className="mr-card" onClick={() => handleCardClick(report)}>
                        <div className="mr-card-left">
                            {/* 배지 행: 지역 / 카테고리 / 서브카테고리 */}
                            <div className="mr-badge-row">
                                {report.region && (
                                    <span className="mr-badge region">{report.region}</span>
                                )}
                                {(report.category || report.cat) && (
                                    <span className="mr-badge category">{report.category || report.cat}</span>
                                )}
                                {(report.sub_category || report.sub) && (
                                    <span className="mr-badge sub">{report.sub_category || report.sub}</span>
                                )}
                            </div>
                            <h3 className="mr-card-title">{report.title}</h3>
                            <p className="mr-card-author">{report.author}</p>
                            <div className="mr-card-stats">
                                {/* 좋아요 */}
                                <div className="mr-stat">
                                    <svg
                                        width="14" height="12"
                                        viewBox="0 0 15.36 12.23"
                                        fill={likedIds && likedIds.has(report.id) ? '#542aa3' : heartFill}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onToggleLike) onToggleLike(report.id);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <path d="M9.057 1.081C10.498-0.36 12.836-0.36 14.277 1.081 15.719 2.523 15.719 4.860 14.277 6.302L8.781 11.799C8.478 12.102 8.076 12.244 7.679 12.229 7.282 12.244 6.880 12.102 6.577 11.799L1.081 6.302C-0.360 4.860-0.360 2.523 1.081 1.081 2.523-0.360 4.860-0.360 6.302 1.081L7.679 2.458Z"
                                            stroke={likedIds && likedIds.has(report.id) ? '#542aa3' : '#bfbfbf'} strokeWidth="0"/>
                                    </svg>
                                    <span style={{ color: likedIds && likedIds.has(report.id) ? '#542aa3' : '#bfbfbf' }}>
                                        {(report.likes || 0) + (likedIds && likedIds.has(report.id) ? 1 : 0)}
                                    </span>
                                </div>
                                {/* 댓글 */}
                                <div className="mr-stat">
                                    <svg width="13" height="12" viewBox="0 0 14 11.85" fill="#bfbfbf">
                                        <path d="M9.154 0C11.831 0 14 2.169 14 4.846 14 7.522 11.831 9.691 9.154 9.691H6.513L3.230 11.846V9.414C1.349 8.749 0 6.955 0 4.846 0 2.169 2.169 0 4.846 0Z"/>
                                    </svg>
                                    <span>{report.comments ?? 0}</span>
                                </div>
                            </div>
                        </div>
                        {/* 썸네일 */}
                        <div className="mr-card-right">
                            {report.image && (
                                <div className="mr-card-img-wrapper">
                                    <img src={report.image} alt={report.title} className="mr-card-img"
                                        onError={(e) => { e.target.closest('.mr-card-img-wrapper').style.display = 'none'; }} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* FAB: + 제보하기 (Figma: 보라 pill 우하단) */}
            <button className="mr-fab" onClick={() => onNavigate('mReportMap')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                제보하기
            </button>

            <MobileBottomNav currentView="myReportList" onNavigate={onNavigate} />
        </div>
    );
};

export default MyReports;
