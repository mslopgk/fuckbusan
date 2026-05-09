// Inline SVG icons — lucide-react removed per project policy
import MultiSelectDropdown from './common/MultiSelectDropdown';

import { DISTRICTS } from '../data/constants';

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

const menuItems = [
    { id: 'housing', label: '주거', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, color: 'cat-housing' },
    { id: 'environment', label: '환경', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8c.8.8 1.5 1.8 1.9 2.8C20.2 14 19 18 16 20s-7 2-10-1c-2-2-3-5-2-8 1.2.6 2.4 1 3.7 1C10.6 12 13 9.5 13 6.5c0-1-.3-2-.8-2.8C13.7 3.3 15.6 6.6 17 8z"/></svg>, color: 'cat-env' },
    { id: 'transport', label: '교통', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, color: 'cat-transport' },
    { id: 'safety', label: '안전', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, color: 'cat-safety' },
    { id: 'education', label: '교육', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>, color: 'cat-education' },
    { id: 'industry', label: '산업/일자리', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, color: 'cat-industry' },
    { id: 'culture', label: '문화/여가', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>, color: 'cat-culture' },
    { id: 'welfare', label: '보건/복지', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>, color: 'cat-wellness' },
];

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
    onSelectDiagnosticianClasses
}) {
    return (
        <aside className="w-72 bg-white border-r border-border h-full flex flex-col z-20 shadow-sm transition-all duration-300 font-sans">
            <div className="h-16 flex items-center px-6 border-b border-border bg-white shrink-0">
                <div className="flex flex-col">
                    <img src="/busan_is_good.png" alt="Busan is Good" className="h-10 w-auto object-contain" />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">

                {/* 1. Global Filters */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">진단 설정 (Filters)</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-sub mb-1.5 ml-1">연도 선택</label>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                {['2024', '2025', '2026'].map(year => (
                                    <button
                                        key={year}
                                        className={`flex-1 py-1.5 text-xs rounded-md transition-all ${selectedYear === year ? 'bg-white text-primary font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                                        onClick={() => onSelectYear(year)}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <MultiSelectDropdown
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

                <div className="h-px bg-slate-100 my-2"></div>

                {/* 2. Category Grid */}
                <div>
                    <div className="flex items-center justify-between px-1 mb-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">진단 영역</h3>
                        <button
                            onClick={onResetFilters}
                            className="text-[10px] flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded-md transition-colors"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4.66"/></svg> 초기화
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {menuItems.map(item => {
                            const isActive = selectedCategories.includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 group ${isActive ? 'bg-rose-50 border-primary shadow-sm scale-[0.98]' : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                                    onClick={() => onSelectCategory(item.id)}
                                >
                                    <span className={`mb-1.5 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>{item.icon}</span>
                                    <span className={`text-xs font-medium transition-colors ${isActive ? 'text-primary font-bold' : 'text-slate-500 group-hover:text-slate-900'}`}>{item.label}</span>
                                    {isActive && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                {/* 3. User Type Filter */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">데이터 소스 (Source)</h3>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-lg p-1">
                        {[
                            { id: 'all', label: '전체' },
                            { id: 'citizen', label: '시민' },
                            { id: 'expert', label: '전문가' }
                        ].map(type => (
                            <button
                                key={type.id}
                                className={`text-xs py-2 rounded-md transition-all font-medium ${userType === type.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                onClick={() => onSelectUserType(type.id)}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

            </nav>

            <div className="p-4 border-t border-border bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-800">시스템 상태 양호</h4>
                        <p className="text-[10px] text-slate-500">모든 서비스 정상 작동 중</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
