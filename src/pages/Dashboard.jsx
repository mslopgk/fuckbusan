import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Loader2 } from 'lucide-react';

import Sidebar from '../components/Sidebar';
// Lazy load MapCanvas
const MapCanvas = lazy(() => import('../components/dashboard/MapCanvas'));
import AnalysisChart from '../components/dashboard/AnalysisChart';
import AIPersonaPanel from '../components/dashboard/AIPersonaPanel';
import ScoreGauge from '../components/dashboard/ScoreGauge';
import FloatingChatWidget from '../components/dashboard/FloatingChatWidget';
import PersonaDetailModal from '../components/dashboard/PersonaDetailModal';
const InsightDetailModal = lazy(() => import('../components/dashboard/InsightDetailModal'));
import { DISTRICTS } from '../data/constants';
import { fetchDashboardData as fetchAnalysisData, fetchScore, fetchInsights, fetchPersonas } from '../api';

export default function Dashboard() {
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

    const navigate = useNavigate();

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
        navigate('/login');
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
        <div className="flex h-screen bg-bg-main overflow-hidden font-sans text-slate-800">
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
            />

            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Header Area */}
                <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-primary">부산시</span> 지능형 공공디자인 통합 진단 플랫폼
                        <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">({selectedYear}년 성과 전망)</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">{username}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors px-2"
                        >
                            <LogOut className="w-4 h-4" /> 로그아웃
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden bg-slate-50">
                    {/* Left Panel (Main Content: Map + Chart) */}
                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
                        {/* Map Area */}
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                            <Suspense fallback={
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <span className="text-sm font-medium text-slate-500">지도 모듈 로딩 중...</span>
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
                            {/* Decorative border on hover/active could act as 'focus' */}
                            <div className="absolute inset-0 border-2 border-transparent pointer-events-none transition-colors group-hover:border-primary/10 rounded-2xl"></div>
                        </div>

                        {/* Bottom Chart Area */}
                        <div className="h-72 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                            <AnalysisChart data={dashboardData.analysis} selectedDistricts={selectedDistricts} />
                        </div>
                    </div>

                    {/* Right Panel (Side Widgets: Score + Personas) */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 h-64">
                            <ScoreGauge score={dashboardData.score} />
                        </div>

                        {/* Analysis Section Replaced with Persona Panel */}
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
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
