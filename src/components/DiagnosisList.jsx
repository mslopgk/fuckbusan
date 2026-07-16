import React, { useState } from 'react';
import './DiagnosisList.css';
import DiagnosisCard from './DiagnosisCard';
import CategoryRail from './filters/CategoryRail';
import RegionDropdown from './filters/RegionDropdown';

import { fetchWithLogout, API_URL } from '../utils/api';

const REGIONS = [
    '부산 전 지역', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구',
    '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'
];

const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '산업·일자리', '교육', '문화·여가', '보건·복지'];

// 진단대상 세그먼트 (Figma 302:5940 "진단대상" 전체/시민/전문가)
const TARGETS = [
    { label: '전체', val: 'all' },
    { label: '시민', val: 'general' },
    { label: '전문가', val: 'expert' },
];

const PAGE_SIZE = 20;

const mapRow = (item) => {
    let dateStr = '23.01.01';
    if (item.created_at) {
        try {
            dateStr = new Date(item.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/ /g, '.');
        } catch (e) { }
    }

    return {
        id: item.result_id,
        type: item.district_code === 'expert' ? 'expert' : 'general',
        date: dateStr,
        bookmarked: false,
        title: item.중분류 || item.대분류 || '진단 결과',
        score: String(item.점수 || 0),
        result: item.만족도 || 'suitable',
        lat: item.위도,
        lng: item.경도,
        address: item.진단지역 || '주소 정보 없음',
        scores: [],
        desc: item.리뷰,
        image: item.이미지경로 ? (item.이미지경로.startsWith('/uploads') ? `${API_URL}${item.이미지경로}` : item.이미지경로) : '/assets/diagnosis_street.png',
        placeName: item.장소명 || item.placeName || '',
        // raw API row, kept for building the PCDiagnosisMap-compatible detail payload on click
        raw: item,
    };
};

const DiagnosisList = ({ onBack, onNavigate }) => {
    // 'all' | 'general' | 'expert'
    const [activeTab, setActiveTab] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [isSortOpen, setIsSortOpen] = useState(false);

    // 세로 레일 필터 (Figma 302:5940)
    const [selectedRegion, setSelectedRegion] = useState('부산 전 지역');
    const [selectedCategory, setSelectedCategory] = useState('전체');

    const [listData, setListData] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchPage = React.useCallback(async (skip, append) => {
        try {
            // Use fetchWithLogout to handle auth automatically
            const token = localStorage.getItem('access_token');
            const res = await fetchWithLogout(`${API_URL}/checklist/list?skip=${skip}&limit=${PAGE_SIZE}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const data = await res.json();
                const mapped = Array.isArray(data) ? data.map(mapRow) : [];
                setListData(prev => append ? [...prev, ...mapped] : mapped);
                setHasMore(mapped.length === PAGE_SIZE);
            } else {
                console.warn("Fetch List Failed:", res.status);
                if (!append) setListData([]);
                setHasMore(false);
            }
        } catch (e) {
            console.error("Failed to fetch diagnosis list", e);
            setHasMore(false);
        }
    }, []);

    React.useEffect(() => {
        fetchPage(0, false);
    }, [fetchPage]);

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        await fetchPage(listData.length, true);
        setLoadingMore(false);
    };

    const handleItemClick = (item) => {
        if (!onNavigate) return;
        const raw = item.raw || {};
        onNavigate('pcDiagnosisDetail', {
            id: raw.result_id,
            big: raw.대분류 || '주거',
            mid: raw.중분류 || '',
            name: raw.질문기준 || raw.대분류 || '진단',
            score: raw.점수 != null ? Number(raw.점수).toFixed(1) : null,
            reviewText: raw.리뷰 || '',
            region: raw.진단지역 || '',
            location: raw.진단지역 || raw.district_code || null,
            date: raw.created_at ? String(raw.created_at).slice(0, 10) : null,
            lat: raw.위도 != null ? Number(raw.위도) : null,
            lng: raw.경도 != null ? Number(raw.경도) : null,
            thumb: raw.이미지경로 ? (raw.이미지경로.startsWith('/uploads') ? `${API_URL}${raw.이미지경로}` : raw.이미지경로) : null,
            targetType: raw.진단대상 || '',
        });
    };

    const toggleBookmark = (id) => {
        setListData(prev => prev.map(item =>
            item.id === id ? { ...item, bookmarked: !item.bookmarked } : item
        ));
    };

    const filteredData = listData
        .filter(item => activeTab === 'all' || item.type === activeTab)
        .filter(item => selectedRegion === '부산 전 지역' || (item.address || '').includes(selectedRegion))
        // 진단 데이터에 생활정보 카테고리 필드가 아직 없어, 필드가 있을 때만 필터 (없으면 표시 유지)
        .filter(item => selectedCategory === '전체' || (item.category ? item.category === selectedCategory : true))
        .sort((a, b) => {
            if (sortOrder === 'latest') return b.date.localeCompare(a.date);
            return parseFloat(b.score || 0) - parseFloat(a.score || 0);
        });

    return (
        <div className="diagnosis-list-container">
            {/* Header */}
            <div className="diagnosis-list-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <div className="page-title">진단 목록</div>

            <div className="dl-body">
                {/* 좌측 세로 레일 (Figma 302:5940): 구역별 + 진단대상 + 생활정보 */}
                <aside className="dl-rail">
                    <RegionDropdown
                        title="구역별"
                        placeholder="설정해주세요"
                        value={selectedRegion}
                        unsetValue="부산 전 지역"
                        options={REGIONS}
                        onSelect={setSelectedRegion}
                        accent="#23bdbb"
                    />

                    <div className="dl-segment-card">
                        <div className="dl-segment-title">진단대상</div>
                        <div className="dl-segment">
                            {TARGETS.map(t => (
                                <button
                                    key={t.val}
                                    type="button"
                                    className={`dl-segment-btn${activeTab === t.val ? ' on' : ''}`}
                                    onClick={() => setActiveTab(t.val)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <CategoryRail
                        variant="rail"
                        title="생활정보"
                        categories={CATEGORIES}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        accent="#23bdbb"
                        tint="#e6f7f7"
                    />
                </aside>

                {/* 우측 콘텐츠: 정렬 + 목록 */}
                <div className="dl-content">
                    {/* Controls Row */}
                    <div className="controls-row">
                        <div className="sort-wrapper" style={{ position: 'relative' }}>
                    <div
                        className="sort-dropdown-wrapper"
                        onClick={(e) => { e.stopPropagation(); setIsSortOpen(!isSortOpen); }}
                        style={{ minWidth: '80px', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                        <span className="sort-label">
                            {sortOrder === 'latest' ? '최신순' : '점수순'}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    {isSortOpen && (
                        <div className="sort-menu" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            zIndex: 100,
                            background: 'white',
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            width: '100px', // Fixed width to ensure it doesn't squish
                            overflow: 'hidden'
                        }}>
                            <div
                                className={`sort-option ${sortOrder === 'latest' ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setSortOrder('latest'); setIsSortOpen(false); }}
                                style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', color: sortOrder === 'latest' ? '#E6235A' : '#333', background: sortOrder === 'latest' ? '#fff0f5' : 'white' }}
                            >
                                최신순
                            </div>
                            <div
                                className={`sort-option ${sortOrder === 'score' ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setSortOrder('score'); setIsSortOpen(false); }}
                                style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', color: sortOrder === 'score' ? '#E6235A' : '#333', background: sortOrder === 'score' ? '#fff0f5' : 'white' }}
                            >
                                점수순
                            </div>
                        </div>
                    )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="list-content">
                        {filteredData.map(item => (
                            <DiagnosisCard
                                key={item.id}
                                item={item}
                                onBookmark={toggleBookmark}
                                onClick={() => handleItemClick(item)}
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                            <button
                                type="button"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                style={{
                                    padding: '10px 28px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    background: '#fff',
                                    color: '#333',
                                    fontSize: '14px',
                                    cursor: loadingMore ? 'default' : 'pointer',
                                    opacity: loadingMore ? 0.6 : 1,
                                }}
                            >
                                {loadingMore ? '불러오는 중...' : '더보기'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiagnosisList;
