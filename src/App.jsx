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
import SignupDone from './components/SignupDone'
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

    // Accumulated Diagnosis Data
    const [diagnosisPayload, setDiagnosisPayload] = useState({
        location: null, // { lat, lng }
        photo: null, // File object or URL string
        bigCategory: '',
        midCategory: '',
        questions: [], // Current questions for convenience
        answers: [],   // Array of { q_index: val } or similar, eventually stringified
        satisfaction: null,
        review: ''
    });

    const updateDiagnosisPayload = (key, value) => {
        setDiagnosisPayload(prev => ({
            ...prev,
            [key]: value
        }));
    };

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
        const districtCode = localStorage.getItem('district_code') || '';
        const isExpert = districtCode.startsWith('expert');

        if (target === 'checkList') {
            setDiagnosisMode(isExpert ? 'expert' : 'general');
            setView('diagnosis');
        } else if (target === 'diagnosis') {
            if (!localStorage.getItem('access_token')) {
                alert('로그인이 필요한 서비스입니다.');
                setView('login');
                return;
            }
            setDiagnosisMode(isExpert ? 'expert' : 'general');
            setDiagnosisPayload({
                location: null, photo: null, bigCategory: '', midCategory: '', questions: [], answers: [], satisfaction: null, review: ''
            });
            setView('diagnosis');
        } else if (target === 'login') {
            setView('login');
        } else if (target === 'signup') {
            setView('signup');
        } else if (target === 'signupDone') {
            setView('signupDone');
        } else if (target === 'report') {
            if (!localStorage.getItem('access_token')) {
                alert('로그인이 필요한 서비스입니다.');
                setView('login');
                return;
            }
            setView('report');
        } else if (target === 'survey') {
            if (!localStorage.getItem('access_token')) {
                alert('로그인이 필요한 서비스입니다.');
                setView('login');
                return;
            }
            setView('survey');
        } else if (target === 'diagnosisResult') {
            if (isExpert) {
                setDiagnosisMode('expert');
                setView('expertDiagnosisResult');
            } else {
                setDiagnosisMode('general');
                setView('diagnosisResult');
            }
        } else if (target === 'expertDiagnosisResult') {
            // Keep direct access for testing/buttons
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
                <Signup
                    onBack={() => setView('login')}
                    onNavigate={(target) => setView(target)}
                />
            )}
            {view === 'signupDone' && (
                <SignupDone
                    onLogin={() => setView('login')}
                />
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
                    initialMode={diagnosisMode}
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
                    onNext={(data) => {
                        // data: { photo, location } from Step1
                        updateDiagnosisPayload('photo', data.photo);
                        updateDiagnosisPayload('location', data.location);

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
                    onNext={(big, mid) => {
                        updateDiagnosisPayload('bigCategory', big);
                        updateDiagnosisPayload('midCategory', mid);
                        goToCheckList(big, mid);
                    }}
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
                    onNext={(ratings) => {
                        // ratings: { index: value }
                        updateDiagnosisPayload('answers', ratings);

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
                    onNext={(score) => {
                        updateDiagnosisPayload('satisfaction', score);
                        setView('review');
                    }} // Satisfaction always goes to Review
                />
            )}
            {view === 'review' && (
                <Review
                    color={theme.primary}
                    progressBarColor={theme.progressBar}
                    diagnosisMode={diagnosisMode}
                    diagnosisPayload={diagnosisPayload} // Pass full payload to submit
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
