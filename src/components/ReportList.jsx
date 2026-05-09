import React, { useState, useEffect, useRef } from 'react';
import { Map, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import './ReportList.css';
import { API_URL } from '../utils/api';


// Category Styles from ProposalList.jsx
const CATEGORY_STYLES = {
    '주거': { background: '#FFF3E0', color: '#E65100' },
    '환경': { background: '#E8F5E9', color: '#2E7D32' },
    '교통': { background: '#E3F2FD', color: '#1565C0' },
    '안전': { background: '#FCE4EC', color: '#C62828' },
    '산업·일자리': { background: '#E0F2F1', color: '#00695C' },
    '교육': { background: '#EDE7F6', color: '#4527A0' },
    '문화·여가': { background: '#FFF8E1', color: '#F57F17' },
    '보건·복지': { background: '#F3E5F5', color: '#7B1FA2' },
};

const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '산업·일자리', '교육', '문화·여가', '보건·복지'];

const REGIONS = [
    '부산 전 지역', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구',
    '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'
];

const STATUSES = ['개선중', '개선예정', '개선완료'];
const SORT_OPTIONS = ['최신순', '투표순', '조회수'];

const ClusterPin = ({ count }) => {
    const isSingle = count === 1;
    const className = isSingle ? 'rl-cluster-circle' : 'rl-cluster-bubble';
    return <div className="rl-cluster-container"><div className={className}>{count}</div></div>;
};

const ReportList = ({ onBack, onNavigate, deletedIds, likedIds, onToggleLike, userCreatedReports, updatedReportsMap }) => {
    useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services'] });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('전체');

    // Filtering/Modal State
    const [selectedRegion, setSelectedRegion] = useState('부산 전 지역');
    const [tempRegion, setTempRegion] = useState('부산 전 지역');
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('전체');
    const [sortBy, setSortBy] = useState('최신순');
    const [tempSort, setTempSort] = useState('최신순');
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);

    // GPS Center logic
    const [mapCenter, setMapCenter] = useState({ lat: 35.1795543, lng: 129.0756416 }); // Default: Busan City Hall
    const [hasLocated, setHasLocated] = useState(false);

    // Reports loaded from backend
    const [serverReports, setServerReports] = useState([]);
    const [clusters, setClusters] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/reports/full`)
            .then(res => res.ok ? res.json() : [])
            .then(data => Array.isArray(data) ? setServerReports(data) : setServerReports([]))
            .catch(err => { console.error('Failed to load reports:', err); setServerReports([]); });

        fetch(`${API_URL}/api/reports/clusters`)
            .then(res => res.ok ? res.json() : [])
            .then(data => Array.isArray(data) ? setClusters(data.filter(c => c.lat && c.lng)) : setClusters([]))
            .catch(() => setClusters([]));
    }, []);

    // Filter logic – merge user created reports and updates with server data
    const getFinalReports = () => {
        let base = [...serverReports];
        if (userCreatedReports && userCreatedReports.length > 0) {
            base = [...userCreatedReports, ...base];
        }
        return base.map(r => {
            if (updatedReportsMap && updatedReportsMap[r.id]) {
                return { ...r, ...updatedReportsMap[r.id] };
            }
            return r;
        });
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
                    setHasLocated(true);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setHasLocated(true);
                }
            );
        } else {
            setHasLocated(true);
        }
    }, []);

    const filteredReports = getFinalReports().filter(r => {
        if (deletedIds && deletedIds.has(r.id)) return false;

        const matchesCategory = selectedCategory === '전체' || r.category === selectedCategory;
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             r.location.toLowerCase().includes(searchQuery.toLowerCase());
        const regionMatch = selectedRegion === '부산 전 지역' || r.region === selectedRegion;
        const statusMatch = statusFilter === '전체' || (
            (statusFilter === '접수' && r.status === '개선예정') ||
            (statusFilter === '검토중' && r.status === '개선중') ||
            (statusFilter === '검토완료' && r.status === '개선완료') ||
            (statusFilter === '결과안내' && r.status === '개선완료' && r.progress_step === 4)
        );
        return matchesCategory && matchesSearch && regionMatch && statusMatch;
    });

    if (sortBy === '최신순') filteredReports.sort((a, b) => b.id - a.id);
    else if (sortBy === '투표순') filteredReports.sort((a, b) => b.likes - a.likes);
    else if (sortBy === '조회수') filteredReports.sort((a, b) => b.comments - a.comments);

    return (
        <div className="rl-page">
            {/* Header: Title + Search */}
            <div className="rl-header">
                <h1 className="rl-title">제보현황</h1>
                <div className="rl-search-row">
                    <div className="rl-search-wrap">
                        <input
                            type="text"
                            className="rl-search"
                            placeholder="검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="rl-search-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </span>
                    </div>
                </div>
            </div>

            {/* Region chips */}
            <div className="rl-region-chips">
                {REGIONS.map(reg => (
                    <button
                        key={reg}
                        className={`rl-region-chip${selectedRegion === reg ? ' active' : ''}`}
                        onClick={() => setSelectedRegion(reg)}
                    >
                        {reg}
                    </button>
                ))}
            </div>

            {/* Compact Kakao Map */}
            <div className="rl-map-wrap">
                <Map
                    center={mapCenter}
                    level={5}
                    style={{ width: '100%', height: '100%' }}
                >
                    {clusters.map((c, i) => (
                        <CustomOverlayMap key={c.region || i} position={{ lat: c.lat, lng: c.lng }} yAnchor={c.count === 1 ? 0.5 : 1} xAnchor={0.5}>
                            <ClusterPin count={c.count} />
                        </CustomOverlayMap>
                    ))}
                    <CustomOverlayMap position={mapCenter} yAnchor={0.5} xAnchor={0.5}>
                        <div className="rl-user-pin-container">
                            <div className="rl-user-pin">
                                <div className="rl-user-pin-inner"></div>
                            </div>
                        </div>
                    </CustomOverlayMap>
                </Map>
                <button
                    className="rl-gps-btn"
                    onClick={() => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(p =>
                                setMapCenter({ lat: p.coords.latitude, lng: p.coords.longitude })
                            );
                        }
                    }}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#E6235A">
                        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                    </svg>
                </button>
            </div>

            {/* Category filter chips */}
            <div className="rl-filter-row">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`rl-cat-chip${selectedCategory === cat ? ' active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Sort dropdown + status tabs */}
            <div className="rl-sort-status-row">
                <button
                    className="rl-sort-dropdown-btn"
                    onClick={() => {
                        setTempSort(sortBy);
                        setIsSortModalOpen(true);
                    }}
                >
                    {sortBy}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '4px' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div className="rl-status-tabs">
                    {['전체', '개선중', '개선예정', '개선완료'].map(tab => (
                        <button
                            key={tab}
                            className={`rl-status-tab${statusFilter === tab ? ' active' : ''}`}
                            onClick={() => setStatusFilter(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <button className="rl-fab-inline" onClick={() => onNavigate('reportPostForm')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <line x1="12" y1="4" x2="12" y2="20"></line>
                        <line x1="4" y1="12" x2="20" y2="12"></line>
                    </svg>
                    제보하기
                </button>
            </div>

            {/* 3-column card grid */}
            <div className="rl-cards-grid">
                {filteredReports.length === 0 && (
                    <div className="rl-empty">검색 결과가 없습니다.</div>
                )}
                {filteredReports.map(report => {
                    const style = CATEGORY_STYLES[report.category] || { background: '#F3F4F6', color: '#666' };
                    return (
                        <div key={report.id} className="rl-card" onClick={() => onNavigate('reportDetail', report)}>
                            <div className="rl-card-img-wrap">
                                <img src={report.image} alt={report.title} className="rl-card-img" />
                            </div>
                            <div className="rl-card-body">
                                <div className="rl-badge-row">
                                    <span className="rl-badge" style={{ background: style.background, color: style.color }}>
                                        {report.category}
                                    </span>
                                    {report.sub_category && (
                                        <span className="rl-badge sub">{report.sub_category}</span>
                                    )}
                                </div>
                                <h3 className="rl-card-title">{report.title}</h3>
                                <p className="rl-card-location">{report.location}</p>
                                <div className="rl-card-stats">
                                    <span className="rl-stat">
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill={likedIds && likedIds.has(report.id) ? "#E6235A" : "none"}
                                            stroke={likedIds && likedIds.has(report.id) ? "#E6235A" : "#adb5bd"}
                                            strokeWidth="2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onToggleLike) onToggleLike(report.id);
                                            }}
                                            style={{ cursor: 'pointer', flexShrink: 0 }}
                                        >
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                        {(report.likes || 0) + (likedIds && likedIds.has(report.id) ? 1 : 0)}
                                    </span>
                                    <span className="rl-stat">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="#adb5bd" stroke="none">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        {report.comments}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sort Modal */}
            {isSortModalOpen && (
                <div className="rl-modal-overlay" onClick={() => setIsSortModalOpen(false)}>
                    <div className="rl-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="rl-modal-header">
                            <h3 className="rl-modal-title">정렬</h3>
                            <button className="rl-modal-close" onClick={() => setIsSortModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="rl-modal-body">
                            <div className="rl-sort-list">
                                {SORT_OPTIONS.map(opt => (
                                    <div
                                        key={opt}
                                        className={`rl-sort-item${tempSort === opt ? ' selected' : ''}`}
                                        onClick={() => setTempSort(opt)}
                                    >
                                        <span className="rl-item-arrow">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </span>
                                        <span className="rl-item-name">{opt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rl-modal-footer">
                            <button className="rl-modal-select-btn" onClick={() => {
                                setSortBy(tempSort);
                                setIsSortModalOpen(false);
                            }}>선택</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportList;
