import React, { useState, useEffect } from 'react';
import './MyReports.css';
import { API_URL } from '../utils/api';

/* MyReports.jsx — 나의제보 모바일 리스트
 * Figma 302:18818 (나의제보 탭) / 302:18907 (좋아요 제보글 탭) */
const ASSET = '/figma-assets/mobile-myactivity';

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

    return (
        <div className="my-reports-container">
            {/* 헤더 — Figma: 좌측 back(13,21 24px) + 중앙 타이틀 '나의제보' */}
            <header className="mr-header">
                <button className="mr-back-btn" onClick={onBack} aria-label="뒤로가기">
                    <img src={`${ASSET}/icon_back.png`} alt="" width="24" height="24" />
                </button>
                <h1 className="mr-header-title">나의제보</h1>
            </header>

            {/* 탭 스위처 (나의제보 | 좋아요 제보글) — Figma 302:18821/18957 보라 pill */}
            <div className="mr-tabs-container">
                <div className="mr-tab-switcher">
                    <button
                        className={`mr-tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mine')}
                    >
                        나의제보
                    </button>
                    <button
                        className={`mr-tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('likes')}
                    >
                        좋아요 제보글
                    </button>
                </div>
            </div>

            {/* 상태 필터 — 나의제보 탭에만 표시 (Figma 302:18871~18904) */}
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
            <div className={`mr-list ${activeTab === 'likes' ? 'mr-list--likes' : ''}`}>
                {filteredReports.length === 0 && (
                    <div className="mr-empty">
                        {activeTab === 'likes'
                            ? '아직 좋아요한 제보가 없습니다.'
                            : `${statusFilter} 단계의 제보가 없습니다.`}
                    </div>
                )}
                {filteredReports.map(report => {
                    const liked = likedIds && likedIds.has(report.id);
                    return (
                        <div key={report.id} className="mr-card" onClick={() => handleCardClick(report)}>
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

                            {/* 썸네일 — Figma 55x55 r15 우상단 */}
                            {report.image && (
                                <div className="mr-card-img-wrapper">
                                    <img src={report.image} alt={report.title} className="mr-card-img"
                                        onError={(e) => { e.target.closest('.mr-card-img-wrapper').style.display = 'none'; }} />
                                </div>
                            )}

                            {/* 통계 — Figma 우하단 (하트/댓글 14px #bfbfbf, 좋아요 시 #542aa3) */}
                            <div className="mr-card-stats">
                                <button
                                    type="button"
                                    className="mr-stat mr-stat--like"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onToggleLike) onToggleLike(report.id);
                                    }}
                                >
                                    <img
                                        src={liked ? `${ASSET}/icon_heart_purple.png` : `${ASSET}/icon_heart_gray.png`}
                                        alt=""
                                        className="mr-stat-icon mr-stat-icon--heart"
                                    />
                                    <span style={liked ? { color: '#542aa3' } : undefined}>
                                        {(report.likes || 0) + (liked ? 1 : 0)}
                                    </span>
                                </button>
                                <span className="mr-stat">
                                    <img src={`${ASSET}/icon_comment.png`} alt="" className="mr-stat-icon mr-stat-icon--comment" />
                                    <span>{report.comments ?? 0}</span>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyReports;
