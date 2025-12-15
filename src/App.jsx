import React, { useState, useEffect } from 'react'
import BigCategory from './components/BigCategory'
import CheckList from './components/CheckList'
import Satisfaction from './components/Satisfaction'
import Review from './components/Review'
import CheckDone from './components/CheckDone'
import Survey from './components/Survey'
import Home from './components/Home'

import Login from './components/Login'
import Signup from './components/Signup'
import Report from './components/Report'
import ReportForm from './components/ReportForm'
import Diagnosis from './components/Diagnosis'
import DiagnosisStep1 from './components/DiagnosisStep1'
import DiagnosisList from './components/DiagnosisList'
import MyActivity from './components/MyActivity'
import DiagnosisEdit from './components/DiagnosisEdit'
import DiagnosisResult from './components/DiagnosisResult'
import ExpertDiagnosisResult from './components/ExpertDiagnosisResult'
import ExpertDiagnosisDetail from './components/ExpertDiagnosisDetail'
import DiagnosisDetail from './components/DiagnosisDetail'

import AdminLogin from './admin/pages/Login'
import AdminSignup from './admin/pages/Signup'
import AdminDashboard from './admin/pages/Dashboard'

function App() {
    // Initialize view from sessionStorage to support page refresh
    // For adminLogin and adminSignup, force redirect to 'home' on refresh as per user request
    const [view, setView] = useState(() => {
        const stored = sessionStorage.getItem('current_view');
        if (stored === 'adminLogin' || stored === 'adminSignup') return 'home';
        return stored || 'home';
    });
    const [data, setData] = useState({}); // { Big: { Mid: [Questions...] } }
    const [loading, setLoading] = useState(false); // Initial loading not needed until diagnosis starts
    const [selectedBig, setSelectedBig] = useState('');
    const [selectedMid, setSelectedMid] = useState(null);
    const [diagnosisMode, setDiagnosisMode] = useState('general'); // 'general' | 'expert'

    // State to pass data to edit page
    const [editData, setEditData] = useState(null);

    // Fetch data whenever diagnosisMode changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const fileName = diagnosisMode === 'expert'
                    ? '/assets/data/expert_diagnosis.json'
                    : '/assets/data/general_diagnosis.json';

                const response = await fetch(fileName);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${fileName}`);
                }
                const jsonData = await response.json();
                setData(jsonData);
            } catch (error) {
                console.error("Failed to load diagnosis data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [diagnosisMode]);

    // Scroll to top and save view state whenever view changes
    useEffect(() => {
        window.scrollTo(0, 0);
        sessionStorage.setItem('current_view', view);
    }, [view]);

    const goToCheckList = (big, mid) => {
        setSelectedBig(big);
        setSelectedMid(mid);
        setView('checkList');
    };

    const goToBigCategory = () => {
        setView('bigCategory');
    };

    const goToReview = () => {
        setView('review');
    };

    const goToCheckDone = () => {
        setView('checkDone');
    };

    const navigateFromHome = (target) => {
        if (target === 'checkList') {
            setView('diagnosis');
        } else if (target === 'login') {
            setView('login');
        } else if (target === 'signup') {
            setView('signup');
        } else if (target === 'report') {
            setView('report');
        } else if (target === 'survey') {
            setView('survey');
        } else if (target === 'diagnosisResult') {

            if (diagnosisMode === 'expert') {
                // If currently in expert mode, switching back to diagnosisResult implies General mode?
                // The user wants "(Test) General Result Page" button to go to "General Result Page".
                // So we force General Mode.
                setDiagnosisMode('general');
                setView('diagnosisResult');
            } else {
                setDiagnosisMode('general'); // Explicitly ensure general
                setView('diagnosisResult');
            }
        } else if (target === 'expertDiagnosisResult') {
            setDiagnosisMode('expert');
            setView('expertDiagnosisResult');
        } else if (target === 'adminLogin') {
            setView('adminLogin');
        } else if (target === 'adminDashboard') {
            setView('adminDashboard');
        }
    };

    // Determine theme based on mode
    // General: Primary #E6235A (Pink), Progress #8B1F54 (Dark Pink from CSS)
    // Expert: Primary #542AA3 (Purple), Progress #1E0B43 (Dark Purple)
    const theme = diagnosisMode === 'expert'
        ? { primary: '#542AA3', progressBar: '#1E0B43' }
        : { primary: '#E6235A', progressBar: '#8B1F54' };

    if (loading && view !== 'home') return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

    return (
        <div>
            {view === 'home' && (
                <Home onNavigate={navigateFromHome} />
            )}
            {view === 'login' && (
                <Login
                    onBack={() => setView('home')}
                    onSignup={() => setView('signup')}
                />
            )}
            {view === 'signup' && (
                <Signup onBack={() => setView('login')} />
            )}
            {view === 'report' && (
                <Report
                    onBack={() => setView('home')}
                    onNext={(type) => setView('reportForm')}
                />
            )}
            {view === 'reportForm' && (
                <ReportForm onBack={() => setView('report')} />
            )}
            {view === 'diagnosis' && (
                <Diagnosis
                    onBack={() => setView('home')}
                    onNext={(mode) => {
                        setDiagnosisMode(mode);
                        setView('diagnosisStep1');
                    }}
                    onList={() => setView('diagnosisList')}
                    onMyActivity={() => setView('myActivity')}
                />
            )}
            {view === 'diagnosisList' && (
                <DiagnosisList
                    onBack={() => setView('diagnosis')}
                />
            )}
            {view === 'myActivity' && (
                <MyActivity
                    onBack={() => setView('diagnosis')}
                    onEdit={(item) => {
                        setEditData(item);
                        setView('diagnosisEdit');
                    }}
                />
            )}
            {view === 'diagnosisEdit' && (
                <DiagnosisEdit
                    data={editData}
                    onBack={() => setView('myActivity')}
                    onComplete={() => setView('myActivity')}
                />
            )}
            {view === 'diagnosisStep1' && (
                <DiagnosisStep1
                    color={theme.primary}
                    progressBarColor={theme.progressBar}
                    onBack={() => setView('diagnosis')}
                    onNext={() => {
                        setSelectedBig('');
                        setSelectedMid(null);
                        setView('bigCategory');
                    }}
                />
            )}
            {view === 'bigCategory' && (
                <BigCategory
                    color={theme.primary}
                    progressBarColor={theme.progressBar}
                    data={data}
                    initialBig={selectedBig}
                    initialMid={selectedMid}
                    onNext={goToCheckList}
                    onBack={() => setView('diagnosisStep1')}
                />
            )}
            {view === 'checkList' && (
                <CheckList
                    color={theme.primary}
                    progressBarColor={theme.progressBar}
                    diagnosisMode={diagnosisMode}
                    questions={data[selectedBig]?.[selectedMid] || []}
                    onPrev={goToBigCategory}
                    onNext={() => {
                        if (diagnosisMode === 'expert') {
                            setView('satisfaction');
                        } else {
                            goToReview();
                        }
                    }}
                />
            )}
            {view === 'satisfaction' && (
                <Satisfaction
                    color={theme.primary}
                    progressBarColor={theme.progressBar}
                    onPrev={() => setView('checkList')}
                    onNext={() => setView('review')} // Satisfaction always goes to Review
                />
            )}
            {view === 'review' && (
                <Review
                    color={theme.primary}
                    progressBarColor={theme.progressBar}
                    diagnosisMode={diagnosisMode}
                    onPrev={() => setView('checkList')}
                    onNext={goToCheckDone}
                />
            )}
            {view === 'checkDone' && (
                <CheckDone
                    type="diagnosis"
                    color={theme.primary}
                    onGoHome={() => setView('home')}
                />
            )}
            {view === 'diagnosisResult' && (
                <DiagnosisResult
                    onBack={() => setView('home')}
                    onHome={() => setView('home')}
                    onDetailFacility={() => setView('facilityDetail')}
                    onDetailZone={() => setView('zoneDetail')}
                    onDetailPerson={() => setView('personDetail')}
                />
            )}
            {view === 'expertDiagnosisResult' && (
                <ExpertDiagnosisResult
                    onBack={() => setView('home')}
                    onHome={() => setView('home')}
                    onDetailFacility={() => setView('facilityDetail')}
                    onDetailZone={() => setView('zoneDetail')}
                    onDetailPerson={() => setView('personDetail')}
                />
            )}
            {view === 'facilityDetail' && (
                diagnosisMode === 'expert' ? (
                    <ExpertDiagnosisDetail
                        type="facility"
                        data={data}
                        onBack={() => setView('expertDiagnosisResult')}
                        onHome={() => setView('home')}
                        onDetailFacility={() => setView('facilityDetail')}
                        onDetailZone={() => setView('zoneDetail')}
                        onDetailPerson={() => setView('personDetail')}
                    />
                ) : (
                    <DiagnosisDetail
                        type="facility"
                        data={data}
                        onBack={() => setView(diagnosisMode === 'expert' ? 'expertDiagnosisResult' : 'diagnosisResult')}
                        onHome={() => setView('home')}
                        onDetailFacility={() => setView('facilityDetail')}
                        onDetailZone={() => setView('zoneDetail')}
                        onDetailPerson={() => setView('personDetail')}
                    />
                )
            )}
            {view === 'zoneDetail' && (
                diagnosisMode === 'expert' ? (
                    <ExpertDiagnosisDetail
                        type="zone"
                        data={data}
                        onBack={() => setView('expertDiagnosisResult')}
                        onHome={() => setView('home')}
                        onDetailFacility={() => setView('facilityDetail')}
                        onDetailZone={() => setView('zoneDetail')}
                        onDetailPerson={() => setView('personDetail')}
                    />
                ) : (
                    <DiagnosisDetail
                        type="zone"
                        data={data}
                        onBack={() => setView(diagnosisMode === 'expert' ? 'expertDiagnosisResult' : 'diagnosisResult')}
                        onHome={() => setView('home')}
                        onDetailFacility={() => setView('facilityDetail')}
                        onDetailZone={() => setView('zoneDetail')}
                        onDetailPerson={() => setView('personDetail')}
                    />
                )
            )}
            {view === 'personDetail' && (
                diagnosisMode === 'expert' ? (
                    <ExpertDiagnosisDetail
                        type="person"
                        data={data}
                        onBack={() => setView('expertDiagnosisResult')}
                        onHome={() => setView('home')}
                        onDetailFacility={() => setView('facilityDetail')}
                        onDetailZone={() => setView('zoneDetail')}
                        onDetailPerson={() => setView('personDetail')}
                    />
                ) : (
                    <DiagnosisDetail
                        type="person"
                        data={data}
                        onBack={() => setView(diagnosisMode === 'expert' ? 'expertDiagnosisResult' : 'diagnosisResult')}
                        onHome={() => setView('home')}
                        onDetailFacility={() => setView('facilityDetail')}
                        onDetailZone={() => setView('zoneDetail')}
                        onDetailPerson={() => setView('personDetail')}
                    />
                )
            )}
            {view === 'surveyDone' && (
                <CheckDone
                    type="survey"
                    color="#E6235A"
                    onGoHome={() => setView('home')}
                />
            )}
            {view === 'survey' && (
                <Survey
                    onBack={() => setView('home')}
                    onComplete={() => setView('surveyDone')}
                />
            )}
            {view === 'adminLogin' && (
                <AdminLogin
                    onNavigate={(target) => setView(target)}
                />
            )}
            {view === 'adminSignup' && (
                <AdminSignup
                    onNavigate={(target) => setView(target)}
                />
            )}
            {view === 'adminDashboard' && (
                <AdminDashboard
                    onNavigate={(target) => setView(target)}
                />
            )}
        </div>
    )
}

export default App
