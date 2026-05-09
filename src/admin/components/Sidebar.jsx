// Inline SVG icons — lucide-react removed per project policy
import MultiSelectDropdown from './common/MultiSelectDropdown';
import '../styles/admin.css';

import { DISTRICTS, MENU_ITEMS } from '../../data/constants';

const DISTRICT_OPTIONS = DISTRICTS.filter(d => d.id !== 'all').map(d => ({
    value: d.id,
    label: d.name
}));

const FACILITY_OPTIONS = [
    { value: 'public', label: '공공건축물' },
    { value: 'street', label: '가로시설물' },
    { value: 'park', label: '공원/녹지' },
    { value: 'sign', label: '안내표지판' }
];

const DIAGNOSTICIAN_OPTIONS = [
    { value: 'expert_A', label: '전문가 그룹 A' },
    { value: 'expert_B', label: '전문가 그룹 B' },
    { value: 'citizen', label: '일반 시민단' },
    { value: 'public_official', label: '공무원' }
];

// Inline SVG icon helpers
const SVG = ({ d, d2, circle, ...rest }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
        {d && <path d={d} />}
        {d2 && <path d={d2} />}
        {circle && <circle cx={circle[0]} cy={circle[1]} r={circle[2]} />}
    </svg>
);

// Helper to get icon for category
const getCategoryIcon = (id) => {
    switch (id) {
        case 'sidewalk':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19h16"/><path d="M8 15l2-6 4 3 2-6"/></svg>;
        case 'bicycle_road':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1-1h-1v1l-4.5 7H12"/><path d="M12 6h2l3.5 7"/></svg>;
        case 'car_road':
        case 'public_transport':
        case 'metro_facility':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
        case 'underpass':
        case 'overpass_under':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>;
        case 'plaza':
        case 'waterfront':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
        case 'park_small':
        case 'greenery':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14l-5-8-5 8h3v4h4v-4z"/><path d="M12 18v2"/></svg>;
        case 'indoor_public':
        case 'outdoor_public':
        case 'public_facility':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/><line x1="12" y1="3" x2="12" y2="8"/></svg>;
        case 'info_sales':
        case 'traffic_media':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
        case 'fire_facility':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5.8 11.3a3.3 3.3 0 0 0 0 4.6 3.3 3.3 0 0 0 4.6 0l2-2.1 2 2.1a3.3 3.3 0 0 0 4.6 0 3.3 3.3 0 0 0 0-4.6L12 4z"/></svg>;
        case 'rest_facility':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>;
        case 'lighting_security':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><path d="M17.66 7.34l-2.83 2.83"/><line x1="20" y1="12" x2="16" y2="12"/><path d="M17.66 16.66l-2.83-2.83"/><path d="M12 20a4 4 0 0 0 0-8 4 4 0 0 0 0 8z"/></svg>;
        case 'sanitary':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>;
        case 'pedestrian_media':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
        default:
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
    }
};

export default function Sidebar({
    selectedCategories,
    onSelectCategory,
    onResetFilters,
    userType,
    onSelectUserType,
    selectedDistricts = [],
    onSelectDistricts,
    selectedYear,
    onSelectYear,
    facilityTypes = [],
    onSelectFacilityTypes,
    diagnosticianClasses = [],
    onSelectDiagnosticianClasses,
    onNavigate // Add prop
}) {
    return (
        <aside className="admin-sidebar custom-scrollbar">
            <div className="sidebar-header">
                <div className="flex flex-col">
                    <img src="/assets/busan_is_good.png" alt="Busan is Good" className="sidebar-logo" />
                </div>
            </div>

            <nav className="sidebar-nav">

                {/* 1. Global Filters */}
                <div>
                    <h3 className="sidebar-section-title">진단 설정 (Filters)</h3>

                    <div className="sidebar-filter-group">
                        <div>
                            <label className="sidebar-control-label">연도 선택</label>
                            <div className="year-selector">
                                {['2024', '2025', '2026'].map(year => (
                                    <button
                                        key={year}
                                        className={`year-btn ${selectedYear === year ? 'active' : ''}`}
                                        onClick={() => onSelectYear(year)}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <MultiSelectDropdown
                            key={selectedDistricts.length}
                            label="지역 선택"
                            options={DISTRICT_OPTIONS}
                            selectedValues={selectedDistricts}
                            onChange={onSelectDistricts}
                        />

                        <MultiSelectDropdown
                            label="시설물 종류"
                            options={FACILITY_OPTIONS}
                            selectedValues={facilityTypes}
                            onChange={onSelectFacilityTypes}
                        />

                        <MultiSelectDropdown
                            label="진단인 분류"
                            options={DIAGNOSTICIAN_OPTIONS}
                            selectedValues={diagnosticianClasses}
                            onChange={onSelectDiagnosticianClasses}
                        />
                    </div>
                </div>

                <div className="sidebar-divider"></div>

                {/* 2. Category Grid */}
                <div>
                    <div className="sidebar-header-row">
                        <h3 className="sidebar-section-title" style={{ margin: 0 }}>진단 영역</h3>
                        <button
                            onClick={onResetFilters}
                            className="sidebar-reset-btn"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4.66"/></svg> 초기화
                        </button>
                    </div>

                    <div className="category-grid">
                        {MENU_ITEMS.map(item => {
                            const isActive = selectedCategories.includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    className={`category-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => onSelectCategory(item.id)}
                                    title={item.label}
                                >
                                    <span className="category-icon">{getCategoryIcon(item.id)}</span>
                                    <span className="category-label">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="sidebar-divider"></div>

                {/* 3. User Type Filter */}
                <div>
                    <h3 className="sidebar-section-title">데이터 소스 (Source)</h3>
                    <div className="sidebar-user-type-grid">
                        {[
                            { id: 'all', label: '전체' },
                            { id: 'citizen', label: '시민' },
                            { id: 'expert', label: '전문가' }
                        ].map(type => (
                            <button
                                key={type.id}
                                className={`user-type-btn ${userType === type.id ? 'active' : ''}`}
                                onClick={() => onSelectUserType(type.id)}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

            </nav>

            <div className="sidebar-status">
                <div className="sidebar-status-row">
                    <div className="status-dot-container">
                        <span className="status-ping"></span>
                        <span className="status-dot"></span>
                    </div>
                    <div>
                        <h4 className="status-text-title">시스템 상태 양호</h4>
                        <p className="status-text-desc">모든 서비스 정상 작동 중</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
