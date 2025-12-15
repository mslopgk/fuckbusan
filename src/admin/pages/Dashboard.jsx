import { useState, useEffect, Suspense, lazy } from 'react';
import { LogOut, User, Loader2, Home } from 'lucide-react';

import Sidebar from '../components/Sidebar';
// Lazy load MapCanvas
const MapCanvas = lazy(() => import('../components/dashboard/MapCanvas'));
import AnalysisChart from '../components/dashboard/AnalysisChart';
import AIPersonaPanel from '../components/dashboard/AIPersonaPanel';
import ScoreGauge from '../components/dashboard/ScoreGauge';
import FloatingChatWidget from '../components/dashboard/FloatingChatWidget';
import PersonaDetailModal from '../components/dashboard/PersonaDetailModal';
const InsightDetailModal = lazy(() => import('../components/dashboard/InsightDetailModal'));
// import { DISTRICTS } from '../data/constants'; // Unused import
import { fetchDashboardData as fetchAnalysisData, fetchScore, fetchInsights, fetchPersonas } from '../api';
import '../styles/admin.css';

export default function Dashboard({ onNavigate }) {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [userType, setUserType] = useState('all');
    const [username, setUsername] = useState('User');
    const [selectedDistricts, setSelectedDistricts] = useState([]);
    const [selectedYear, setSelectedYear] = useState('2026');
    const [selectedFacilityTypes, setSelectedFacilityTypes] = useState([]);
    const [selectedDiagnosticianClasses, setSelectedDiagnosticianClasses] = useState([]);

    // State for dashboard data
    const [dashboardData, setDashboardData] = useState({
        analysis: [],
        score: { value: 0, grade: '-', trend: '-' },
        personas: [],
        insights: []
    });

    const [selectedPersona, setSelectedPersona] = useState(null);
    const [selectedInsight, setSelectedInsight] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeChatPersona, setActiveChatPersona] = useState(null);

    // Load Initial Data (Mock)
    useEffect(() => {
        // Fetch User Info
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            setUsername(JSON.parse(storedUser).username);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        // Navigate back to login or home
        if (onNavigate) {
            onNavigate('adminLogin'); // Go back to admin login
        }
    };

    // Fetch Data from Backend API
    useEffect(() => {
        const loadData = async () => {
            const districtParam = selectedDistricts.length > 0 ? selectedDistricts.join(',') : 'all';

            const [analysis, score, insights, personas] = await Promise.all([
                fetchAnalysisData(selectedYear, districtParam),
                fetchScore(selectedYear, districtParam),
                fetchInsights(selectedYear, districtParam),
                fetchPersonas(selectedYear, districtParam)
            ]);

            setDashboardData({
                analysis,
                score,
                insights,
                personas
            });
        };

        loadData();
    }, [selectedYear, selectedDistricts]);


    const handleChatWithPersona = (persona) => {
        setActiveChatPersona(persona);
        setIsChatOpen(true);
    };

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
        if (isChatOpen) setActiveChatPersona(null);
    };

    return (
        <div className="admin-container">
            <Sidebar
                selectedCategories={selectedCategories}
                onSelectCategory={(id) => {
                    setSelectedCategories(prev =>
                        prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
                    );
                }}
                onResetFilters={() => {
                    setSelectedCategories([]);
                    setSelectedDistricts([]);
                    setSelectedFacilityTypes([]);
                    setSelectedDiagnosticianClasses([]);
                    setSelectedYear('2026');
                }}
                userType={userType}
                onSelectUserType={setUserType}
                selectedDistricts={selectedDistricts}
                onSelectDistricts={setSelectedDistricts}
                selectedYear={selectedYear}
                onSelectYear={setSelectedYear}
                facilityTypes={selectedFacilityTypes}
                onSelectFacilityTypes={setSelectedFacilityTypes}
                diagnosticianClasses={selectedDiagnosticianClasses}
                onSelectDiagnosticianClasses={setSelectedDiagnosticianClasses}
                onNavigate={onNavigate}
            />

            <main className="admin-main">
                {/* Top Header Area */}
                <header className="admin-header">
                    <h1 className="header-title">
                        <span className="text-rose">부산시</span> 지능형 공공디자인 통합 진단 플랫폼
                        <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full" style={{ fontSize: '0.875rem', fontWeight: 400, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '9999px', marginLeft: '8px' }}>({selectedYear}년 성과 전망)</span>
                    </h1>
                    <div className="header-user">
                        <div className="user-badge">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">{username}</span>
                        </div>
                        <button
                            onClick={() => onNavigate && onNavigate('home')}
                            className="bg-white p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                            title="홈으로 이동"
                        >
                            <Home className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <button
                            onClick={handleLogout}
                            className="btn-logout"
                        >
                            <LogOut className="w-4 h-4" /> 로그아웃
                        </button>
                    </div>
                </header>

                <div className="admin-content">
                    {/* Left Panel (Main Content: Map + Chart) */}
                    <div className="panel-left">
                        {/* Map Area */}
                        <div className="admin-card map-card group">
                            <Suspense fallback={
                                <div className="map-loading">
                                    <div className="loader-content">
                                        <Loader2 className="map-loader-spinner" />
                                        <span className="map-loader-text">지도 모듈 로딩 중...</span>
                                    </div>
                                </div>
                            }>
                                <MapCanvas
                                    selectedCategories={selectedCategories}
                                    userType={userType}
                                    theme="light"
                                    selectedDistricts={selectedDistricts}
                                    insights={dashboardData.insights}
                                    analysisData={dashboardData.analysis}
                                    onViewDetail={setSelectedInsight}
                                />
                            </Suspense>
                            <div className="map-hover-overlay"></div>
                        </div>

                        {/* Bottom Chart Area */}
                        <div className="admin-card chart-card">
                            <AnalysisChart data={dashboardData.analysis} selectedDistricts={selectedDistricts} />
                        </div>
                    </div>

                    {/* Right Panel (Side Widgets: Score + Personas) */}
                    <div className="panel-right custom-scrollbar">
                        <div className="admin-card score-card">
                            <ScoreGauge score={dashboardData.score} />
                        </div>

                        {/* Analysis Section Replaced with Persona Panel */}
                        <div className="admin-card persona-panel-card">
                            <AIPersonaPanel
                                personas={dashboardData.personas}
                                onSelectPersona={setSelectedPersona}
                                onChatClick={handleChatWithPersona}
                            />
                        </div>
                    </div>
                </div>

                {/* Modal Overlay for Persona */}
                <PersonaDetailModal
                    persona={selectedPersona}
                    onClose={() => setSelectedPersona(null)}
                />

                {/* Insight Detail Modal */}
                <Suspense fallback={null}>
                    {selectedInsight && (
                        <InsightDetailModal
                            insight={selectedInsight}
                            onClose={() => setSelectedInsight(null)}
                        />
                    )}
                </Suspense>

                {/* Floating Chat Widget */}
                <FloatingChatWidget
                    isOpen={isChatOpen}
                    onToggle={toggleChat}
                    targetPersona={activeChatPersona}
                    context={{
                        district: selectedDistricts.length > 0 ? selectedDistricts.join(', ') : '부산시 전체',
                        year: selectedYear,
                        score: dashboardData.score?.score || 0,
                        grade: dashboardData.score?.grade || 'N/A'
                    }}
                />
            </main>
        </div>
    );
}
