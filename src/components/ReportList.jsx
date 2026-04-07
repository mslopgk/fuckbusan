import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ReportList.css';

// Fix for default Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Category Styles from ProposalList.jsx
const CATEGORY_STYLES = {
    '주거': { background: '#FFF3E0', color: '#E65100' },
    '환경': { background: '#E8F5E9', color: '#2E7D32' },
    '교통': { background: '#E3F2FD', color: '#1565C0' }, // Added 교통
    '안전': { background: '#FCE4EC', color: '#C62828' },
    '산업·일자리': { background: '#E0F2F1', color: '#00695C' }, // Updated industrial
    '교육': { background: '#EDE7F6', color: '#4527A0' },
    '문화·여가': { background: '#FFF8E1', color: '#F57F17' }, // Updated culture
    '보건·복지': { background: '#F3E5F5', color: '#7B1FA2' }, // Updated welfare
};

const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '산업·일자리', '교육', '문화·여가', '보건·복지'];

const REGIONS = [
    '부산 전 지역', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구',
    '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'
];

const STATUSES = ['개선중', '개선예정', '개선완료'];
const SORT_OPTIONS = ['최신순', '투표순', '조회수'];

// Updated Cluster Icons Logic
const createClusterIcon = (count) => {
    const isSingle = count === 1;
    const className = isSingle ? 'rl-cluster-circle' : 'rl-cluster-bubble';
    return L.divIcon({
        html: `<div class="${className}">${count}</div>`,
        className: 'rl-cluster-container',
        iconSize: L.point(40, 40),
        iconAnchor: isSingle ? [20, 20] : [20, 48], // Bubble anchor at the tip
    });
};

const MOCK_REPORTS = [
    {
        id: 1,
        category: '산업·일자리',
        sub_category: '골목쓰레기통',
        title: '공원 쓰레기통이 안전조치가 필요해요',
        author: '동래구 우리디자이너',
        location: '동래구 수안동',
        date: '2026.03.13',
        likes: 12,
        comments: 12,
        views: 333,
        image: '/assets/archieve1.png',
        lat: 35.1983,
        lng: 129.0831,
        region: '동래구',
        status: '개선중',
        progress_step: 2, // 1:접수, 2:검토중, 3:검토완료, 4:결과안내
        comments_list: [
            { id: 1, author: '동래구 우리디자이너', content: '빠른 조치가 필요하네요', date: '2026.03.13' },
            { id: 2, author: '동래구 우리디자이너', content: '빠른 조치가 필요하네요', date: '2026.03.13' }
        ]
    },
    {
        id: 2,
        category: '환경',
        sub_category: '가로수/조경 관리',
        title: '전기자전거 재고 불균형 해결 제안',
        author: '동래구 시민',
        location: '동래구 수안동',
        date: '2026.03.13',
        likes: 12,
        comments: 12,
        views: 250,
        image: '/assets/archieve2.png',
        lat: 35.1912,
        lng: 129.0805,
        region: '동래구',
        status: '개선중',
        progress_step: 2,
        comments_list: []
    },
    {
        id: 3,
        category: '교육',
        sub_category: '도로/교통 시설',
        title: '학교 앞 횡단보도 신호등 고장',
        author: '수영구 학부모',
        location: '수영구 광안동',
        date: '2026.03.05',
        likes: 45,
        comments: 8,
        views: 1200,
        image: '/assets/diagnosis_street.png',
        lat: 35.2048,
        lng: 129.0786,
        region: '수영구',
        status: '개선완료',
        progress_step: 4,
        result_details: {
            title: '개선 결과보기',
            image: '/assets/archieve3.png',
            content: 'U+one 마케터로서 그냥 지나칠 수가 없네요..(TT) 전 국민이 애용하는 U+one 앱이 될 수 있도록 더 열심히! 노력해 보겠습니다. 12월에도 런칭 기념 이벤트는 계속 되니 꼬옥 관심 가져주셔야 돼요~ 약속~',
            manager: '담당자 코멘트',
            result_date: '2026.01.02'
        },
        comments_list: [
            { id: 1, author: '관리자', content: '조치 완료되었습니다.', date: '2026.03.10' }
        ]
    },
    {
        id: 4,
        category: '환경',
        sub_category: '취업 지원',
        title: '취업 박람회 홍보 부족',
        author: '해운대구 취준생',
        location: '해운대구 우동',
        date: '2026.02.28',
        likes: 22,
        comments: 5,
        views: 890,
        image: '/assets/archieve3.png',
        lat: 35.1631,
        lng: 129.1589,
        region: '해운대구',
        status: '개선예정',
        progress_step: 1,
        comments_list: []
    },
    {
        id: 5,
        category: '교통',
        sub_category: '불법 주정차',
        title: '수영역 인근 상습 불법 주정차 구역',
        author: '수영구 주민',
        location: '수영구 망미동',
        date: '2026.03.14',
        likes: 18,
        comments: 4,
        views: 560,
        image: '/assets/archieve2.png',
        lat: 35.1645,
        lng: 129.1123,
        region: '수영구',
        status: '검토중',
        progress_step: 2,
        comments_list: [
            { id: 1, author: '수영구 주민', content: '여기 진짜 심각해요.', date: '2026.03.14' }
        ]
    }
];

const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const ReportList = ({ onBack, onNavigate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [sheetLevel, setSheetLevel] = useState(1);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Filtering/Modal State
    const [selectedRegion, setSelectedRegion] = useState('수영구');
    const [tempRegion, setTempRegion] = useState('수영구');
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('전체');
    const [sortBy, setSortBy] = useState('최신순');
    const [tempSort, setTempSort] = useState('최신순');
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);
    
    // GPS Center logic
    const [mapCenter, setMapCenter] = useState([35.1795543, 129.0756416]); // Default: Busan City Hall
    const [hasLocated, setHasLocated] = useState(false);

    const sheetRef = useRef(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCenter([position.coords.latitude, position.coords.longitude]);
                    setHasLocated(true);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setHasLocated(true); // Don't block loading
                }
            );
        } else {
            setHasLocated(true);
        }
    }, []);

    const handleTouchStart = (e) => {
        setStartY(e.touches[0].clientY);
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        setCurrentY(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        const diff = startY - currentY;
        if (Math.abs(diff) > 50) {
            if (diff > 0) setSheetLevel(prev => Math.min(prev + 1, 3));
            else setSheetLevel(prev => Math.max(prev - 1, 1));
        }
        setCurrentY(0);
    };

    const filteredReports = MOCK_REPORTS.filter(r => {
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
    else if (sortBy === '조회수') filteredReports.sort((a, b) => b.comments - a.comments); // Mocking view as comments for now

    const getSheetHeight = () => {
        switch (sheetLevel) {
            case 1: return '38%'; // Slightly higher for 2-row chips
            case 2: return '65%';
            case 3: return '100%';
            default: return '38%';
        }
    };

    return (
        <div className="rl-container">
            {/* Top Search Bar */}
            <div className="rl-search-container">
                <div className="rl-search-inner">
                    <input 
                        type="text" 
                        className="rl-search-input" 
                        placeholder="전체" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="rl-search-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="rl-map-wrapper">
                <MapContainer 
                    center={mapCenter} 
                    zoom={14} 
                    zoomControl={false}
                    attributionControl={false}
                    className="rl-leaflet-map"
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <MapController center={mapCenter} zoom={14} />
                    
                    {/* Clusters: Different counts for shape testing */}
                    <Marker position={[35.1983, 129.0831]} icon={createClusterIcon(12)} />
                    <Marker position={[35.1912, 129.0805]} icon={createClusterIcon(1)} />
                    <Marker position={[35.2048, 129.0786]} icon={createClusterIcon(1)} />
                    <Marker position={[35.1631, 129.1589]} icon={createClusterIcon(12)} />
                    
                    {/* User Pin */}
                    <Marker position={mapCenter} icon={L.divIcon({
                        html: '<div class="rl-user-pin"><div class="rl-user-pin-inner"></div></div>',
                        className: 'rl-user-pin-container',
                        iconSize: [24, 24]
                    })} />
                </MapContainer>

                {/* FAB */}
                <button className="rl-fab" onClick={() => onNavigate('reportPost')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="4" x2="12" y2="20"></line>
                        <line x1="4" y1="12" x2="20" y2="12"></line>
                    </svg>
                    제보하기
                </button>

                {/* GPS (Target) Button - Hide when level 3 */}
                {sheetLevel < 3 && (
                    <button 
                        className="rl-gps-btn" 
                        style={{ bottom: `calc(${getSheetHeight()} + 16px)` }}
                        onClick={() => {
                           if(navigator.geolocation) {
                               navigator.geolocation.getCurrentPosition(p => setMapCenter([p.coords.latitude, p.coords.longitude]));
                           }
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="#E6235A">
                            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Bottom Sheet */}
            <div 
                className={`rl-bottom-sheet level-${sheetLevel}`} 
                style={{ height: getSheetHeight() }}
                ref={sheetRef}
            >
                {sheetLevel < 3 && (
                    <div 
                        className="rl-sheet-handle-area" 
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => setSheetLevel(prev => prev === 3 ? 1 : prev + 1)}
                    >
                        <div className="rl-dragger"></div>
                    </div>
                )}

                {/* Level 3 Expanded Header */}
                {sheetLevel === 3 && (
                    <div className="rl-expanded-header">
                        <div className="rl-header-left" onClick={() => onBack()}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="15" y1="18" x2="9" y2="12"></line>
                                <line x1="9" y1="12" x2="15" y2="6"></line>
                            </svg>
                            <span className="rl-header-text">홈으로</span>
                        </div>
                        <button className="rl-view-map-btn" onClick={() => setSheetLevel(1)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            지도보기
                        </button>
                    </div>
                )}

                <div className="rl-sheet-content">
                    {/* Level 3 District Selector */}
                    {sheetLevel === 3 && (
                        <div className="rl-region-title-row" onClick={() => {
                            setTempRegion(selectedRegion);
                            setIsRegionModalOpen(true);
                        }}>
                            <h1 className="rl-region-title">{selectedRegion}</h1>
                            <button className="rl-region-arrow">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Category Chips (2-Row Layout via CSS flex-wrap) */}
                    <div className="rl-chips-wrapper">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat} 
                                className={`rl-chip ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sorting & Status Filters (Expanded only) */}
                    {sheetLevel === 3 && (
                        <div className="rl-sort-container">
                            <div className="rl-sort-row">
                                <button className="rl-sort-dropdown-btn" onClick={() => {
                                    setTempSort(sortBy);
                                    setIsSortModalOpen(true);
                                }}>
                                    {sortBy}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '2px' }}>
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="rl-status-tabs">
                                {['전체', '접수', '검토중', '검토완료', '결과안내'].map(tab => (
                                    <button 
                                        key={tab} 
                                        className={`rl-status-tab ${statusFilter === tab ? 'active' : ''}`}
                                        onClick={() => setStatusFilter(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Report List */}
                    <div className="rl-list-container">
                        {filteredReports.map(report => {
                            const style = CATEGORY_STYLES[report.category] || { background: '#F3F4F6', color: '#666' };
                            return (
                                <div key={report.id} className="rl-report-card" onClick={() => onNavigate('reportDetail', report)}>
                                    <div className="rl-card-left">
                                        <div className="rl-badge-row">
                                            <span className="rl-badge" style={{ background: style.background, color: style.color }}>
                                                {report.category}
                                            </span>
                                            <span className="rl-badge sub">{report.sub_category}</span>
                                        </div>
                                        <h3 className="rl-card-title">{report.title}</h3>
                                        <p className="rl-card-author">{report.location}</p>
                                    </div>
                                    <div className="rl-card-right">
                                        <div className="rl-card-img-placeholder">
                                            <img src={report.image} alt={report.title} className="rl-card-img" />
                                        </div>
                                        <div className="rl-card-stats">
                                            <div className="rl-stat">
                                                <div className="rl-stat-icon">
                                                    <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                </div>
                                                <span>{report.likes}</span>
                                            </div>
                                            <div className="rl-stat">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#adb5bd" stroke="none">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                                <span>{report.comments}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Region Modal */}
            {isRegionModalOpen && (
                <div className="rl-modal-overlay" onClick={() => setIsRegionModalOpen(false)}>
                    <div className="rl-bottom-sheet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="rl-sheet-header">
                            <h3 className="rl-sheet-title">위치 설정</h3>
                            <button className="rl-sheet-close" onClick={() => setIsRegionModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="rl-sheet-content-modal">
                            <div className="rl-region-list">
                                {REGIONS.map(reg => (
                                    <div 
                                        key={reg} 
                                        className={`rl-region-item ${tempRegion === reg ? 'selected' : ''}`}
                                        onClick={() => setTempRegion(reg)}
                                    >
                                        <div className="rl-item-arrow">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                        <span className="rl-item-name">{reg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rl-sheet-footer">
                            <button className="rl-sheet-select-btn" onClick={() => {
                                setSelectedRegion(tempRegion);
                                setIsRegionModalOpen(false);
                            }}>선택</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sort Modal */}
            {isSortModalOpen && (
                <div className="rl-modal-overlay" onClick={() => setIsSortModalOpen(false)}>
                    <div className="rl-bottom-sheet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="rl-sheet-header">
                            <h3 className="rl-sheet-title">정렬</h3>
                            <button className="rl-sheet-close" onClick={() => setIsSortModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="rl-sheet-content-modal">
                            <div className="rl-sort-list">
                                {SORT_OPTIONS.map(opt => (
                                    <div 
                                        key={opt}
                                        className={`rl-sort-item ${tempSort === opt ? 'selected' : ''}`}
                                        onClick={() => setTempSort(opt)}
                                    >
                                        <div className="rl-item-arrow">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                        <span className="rl-item-name">{opt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rl-sheet-footer">
                            <button className="rl-sheet-select-btn" onClick={() => {
                                setSortBy(tempSort);
                                setIsSortModalOpen(false);
                            }}>선택</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Nav Placeholder */}
            <nav className="rl-bottom-nav">
                <div className="nav-item" onClick={() => onBack()}>
                    <img src="/home.svg" alt="홈" className="nav-icon" style={{ filter: 'grayscale(100%) opacity(0.6)' }} />
                    <span className="nav-text">홈</span>
                </div>
                <div className="nav-item active">
                    <img src="/report.svg" alt="제보" className="nav-icon" style={{ width: '22px', height: '22px' }} />
                    <span className="nav-text">제보</span>
                </div>
                <div className="nav-item" onClick={() => onNavigate('proposalList')}>
                    <img src="/graph.svg" alt="제안" className="nav-icon" style={{ width: '20px', height: '20px', filter: 'grayscale(100%) opacity(0.6)' }} />
                    <span className="nav-text">제안</span>
                </div>
                <div className="nav-item" onClick={() => onNavigate('myProposals')}>
                    <img src="/myid.svg" alt="내 정보" className="nav-icon" style={{ filter: 'grayscale(100%) opacity(0.6)' }} />
                    <span className="nav-text">나의활동</span>
                </div>
            </nav>
        </div>
    );
};

export default ReportList;
