import React, { useState, useEffect } from 'react';
import './MyReports.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const MyReports = ({ onBack, onNavigate, deletedIds, likedIds, onToggleLike, userCreatedReports, updatedReportsMap }) => {
    const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'likes'
    const [statusFilter, setStatusFilter] = useState('검토중');
    const [serverReports, setServerReports] = useState([]);
    const [myServerReports, setMyServerReports] = useState([]);

    useEffect(() => {
        // Public list (used for 'likes' tab merge)
        fetch(`${VITE_API_URL}/api/reports/full`)
            .then(res => res.ok ? res.json() : [])
            .then(data => Array.isArray(data) ? setServerReports(data) : setServerReports([]))
            .catch(err => { console.error('Failed to load reports:', err); setServerReports([]); });

        // My-only list (auth-gated)
        const token = localStorage.getItem('access_token');
        if (token) {
            fetch(`${VITE_API_URL}/api/reports/mine`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.ok ? res.json() : [])
                .then(data => Array.isArray(data) ? setMyServerReports(data) : setMyServerReports([]))
                .catch(err => { console.error('Failed to load my reports:', err); setMyServerReports([]); });
        }
    }, []);

    const handleCardClick = (report) => {
        onNavigate('reportDetail', { ...report, showActions: activeTab === 'mine' });
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
        
        // 2. Status filter
        return report.status === statusFilter || (statusFilter === '결과안내' && report.progress_step === 4);
    });

    return (
        <div className="my-reports-container">
            {/* Header (ProposalList style) */}
            <header className="mr-header">
                <div className="mr-header-left">
                    <button className="mr-back-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="15" y1="18" x2="9" y2="12"></line>
                            <line x1="9" y1="12" x2="15" y2="6"></line>
                        </svg>
                    </button>
                    <span className="mr-header-title">홈으로</span>
                </div>
            </header>

            {/* Tabs (MyProposals style) */}
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

            {/* Status Filter (ReportList style) */}
            <div className="mr-status-container">
                <div className="mr-status-tabs">
                    {['접수', '검토중', '결과안내'].map(tab => (
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

            {/* List Content (ReportList Card style) */}
            <div className="mr-list">
                {filteredReports.map(report => (
                    <div key={report.id} className="mr-card" onClick={() => handleCardClick(report)}>
                        <div className="mr-card-left">
                            <div className="mr-badge-row">
                                <span className="mr-badge region">
                                    {report.region}
                                </span>
                                <span className="mr-badge category">
                                    {report.category}
                                </span>
                                <span className="mr-badge sub">
                                    {report.sub_category}
                                </span>
                            </div>
                            <h3 className="mr-card-title">{report.title}</h3>
                            <p className="mr-card-author">{report.author}</p>
                            
                            <div className="mr-card-stats">
                                <div className="mr-stat">
                                    <svg 
                                        width="14" 
                                        height="14" 
                                        viewBox="0 0 24 24" 
                                        fill={likedIds && likedIds.has(report.id) ? "#E6235A" : "none"} 
                                        stroke={likedIds && likedIds.has(report.id) ? "#E6235A" : "#adb5bd"}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onToggleLike) onToggleLike(report.id);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                    <span>{(report.likes || 0) + (likedIds && likedIds.has(report.id) ? 1 : 0)}</span>
                                </div>
                                <div className="mr-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#adb5bd" stroke="none">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    <span>{report.comments}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mr-card-right">
                            {report.image && (
                                <div className="mr-card-img-wrapper">
                                    <img src={report.image} alt={report.title} className="mr-card-img" onError={(e) => e.target.style.display='none'} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* FAB (ReportList style) */}
            <button className="mr-fab" onClick={() => onNavigate('reportPostForm')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                제보하기
            </button>
        </div>
    );
};

export default MyReports;
