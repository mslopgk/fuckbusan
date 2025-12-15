import { Home, Leaf, Car, Shield, GraduationCap, Factory, Palette, Heart, RotateCcw, Footprints, Bike, Building, Trees, Info, Coffee, Siren, Lightbulb, User, Box, MapPin } from 'lucide-react';
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

// Helper to get icon for category
const getCategoryIcon = (id) => {
    switch (id) {
        case 'sidewalk': return <Footprints size={18} />;
        case 'bicycle_road': return <Bike size={18} />;
        case 'car_road': return <Car size={18} />;
        case 'underpass': return <Box size={18} />;
        case 'overpass_under': return <Box size={18} />;
        case 'plaza': return <MapPin size={18} />;
        case 'waterfront': return <MapPin size={18} />;
        case 'park_small': return <Trees size={18} />;
        case 'greenery': return <Trees size={18} />;
        case 'indoor_public': return <Building size={18} />;
        case 'outdoor_public': return <Building size={18} />;
        case 'public_facility': return <Building size={18} />;
        case 'public_transport': return <Car size={18} />;
        case 'metro_facility': return <Car size={18} />;
        case 'info_sales': return <Info size={18} />;
        case 'fire_facility': return <Siren size={18} />;
        case 'rest_facility': return <Coffee size={18} />;
        case 'lighting_security': return <Lightbulb size={18} />;
        case 'sanitary': return <Heart size={18} />;
        case 'traffic_media': return <Info size={18} />;
        case 'pedestrian_media': return <User size={18} />;
        default: return <Box size={18} />;
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
                            <RotateCcw size={10} /> 초기화
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
