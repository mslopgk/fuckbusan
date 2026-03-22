import React, { useState, useEffect, Suspense, lazy } from 'react'

const BigCategory = lazy(() => import('./components/BigCategory'));
const CheckList = lazy(() => import('./components/CheckList'));
const Satisfaction = lazy(() => import('./components/Satisfaction'));
const Review = lazy(() => import('./components/Review'));
const CheckDone = lazy(() => import('./components/CheckDone'));
const Survey = lazy(() => import('./components/Survey'));
const Home = lazy(() => import('./components/Home'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const SignupDone = lazy(() => import('./components/SignupDone'));
const Report = lazy(() => import('./components/Report'));
const ReportForm = lazy(() => import('./components/ReportForm'));
const Diagnosis = lazy(() => import('./components/Diagnosis'));
const DiagnosisStep1 = lazy(() => import('./components/DiagnosisStep1'));
const DiagnosisList = lazy(() => import('./components/DiagnosisList'));
const MyActivity = lazy(() => import('./components/MyActivity'));
const DiagnosisEdit = lazy(() => import('./components/DiagnosisEdit'));
const DiagnosisResult = lazy(() => import('./components/DiagnosisResult'));
const ExpertDiagnosisResult = lazy(() => import('./components/ExpertDiagnosisResult'));
const ExpertDiagnosisDetail = lazy(() => import('./components/ExpertDiagnosisDetail'));
const DiagnosisDetail = lazy(() => import('./components/DiagnosisDetail'));
const NewDiagnosis = lazy(() => import('./components/NewDiagnosis'));
const ProposalForm = lazy(() => import('./components/ProposalForm'));
const ProposalPreview = lazy(() => import('./components/ProposalPreview'));
const ProposalDone = lazy(() => import('./components/ProposalDone'));
const ProposalDetail = lazy(() => import('./components/ProposalDetail'));
const MyProposals = lazy(() => import('./components/MyProposals'));

const AdminLogin = lazy(() => import('./admin/pages/Login'));
const AdminSignup = lazy(() => import('./admin/pages/Signup'));
const AdminDashboard = lazy(() => import('./admin/pages/Dashboard'));

import { fetchWithLogout } from './utils/api'

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

    const [proposalData, setProposalData] = useState(null); // Temporary storage for proposal preview
    const [selectedProposal, setSelectedProposal] = useState(() => {
        const stored = sessionStorage.getItem('selectedProposal');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { return null; }
        }
        return null;
    });
    const [isProposalEdit, setIsProposalEdit] = useState(false); // [추가] 제안 수정 모드 여부
    const [proposalToEdit, setProposalToEdit] = useState(null); // [추가] 수정할 제안 데이터

    const updateDiagnosisPayload = (key, value) => {
        setDiagnosisPayload(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Map Pins State (Lifted from Diagnosis.jsx)
    const [mapPins, setMapPins] = useState({
        1: { lat: 35.1668, lng: 129.0570, id: 1, address: { placeName: '부산시민공원', road: '부산 부산진구 시민공원로 73', jibun: '범전동 200', zip: '47196' } },
        2: { lat: 35.1635, lng: 129.0620, id: 2, address: { placeName: '송상현광장', road: '부산 부산진구 동평로 405', jibun: '전포동 870-1', zip: '47200' } },
        3: { lat: 35.1610, lng: 129.0550, id: 3, address: { placeName: '서면역', road: '부산 부산진구 가야대로 777', jibun: '부전동 573-1', zip: '47288' } },
        4: { lat: 35.1685, lng: 129.0595, id: 4, address: { placeName: '국립부산국악원', road: '부산 부산진구 국악원로 2', jibun: '연지동 219-2', zip: '47197' } }
    });

    const handleAddPin = (newPin) => {
        // newPin: { lat, lng, address: {...} }
        const newId = Date.now(); // Simple ID generation
        setMapPins(prev => ({
            ...prev,
            [newId]: { ...newPin, id: newId }
        }));
        return newId;
    };


    const rawApiUrl = import.meta.env.VITE_API_URL || 'https://ke7eh3ev2j33nj76skhv6n2tom0yzwim.lambda-url.ap-northeast-2.on.aws';
    const VITE_API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

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

    // Fetch user's diagnosis pins from backend
    useEffect(() => {
        const fetchUserPins = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return; // Not logged in, keep default pins or clear? Maybe keep default mock for non-users?

            try {
                const res = await fetchWithLogout(`${VITE_API_URL}/checklist/my`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const userPins = {};
                        data.forEach(item => {
                            // Map backend item to mapPin format
                            // Use 'user_' prefix to avoid collision with default pins (1,2,3,4)
                            const id = `user_${item.result_id}`;
                            userPins[id] = {
                                id: id,
                                lat: item.위도,
                                lng: item.경도,
                                address: {
                                    placeName: item.장소명 || item.placeName || (item.진단지역 ? item.진단지역.split(' ')[0] : '위치 정보 없음'),
                                    road: item.진단지역 || item.도로명주소 || item.address || '주소 정보 없음',
                                    jibun: '',
                                    zip: ''
                                },
                                type: item.district_code === 'expert' ? 'expert' : 'general',
                                ...item
                            };
                        });

                        if (Object.keys(userPins).length > 0) {
                            setMapPins(prev => ({
                                ...prev,
                                ...userPins
                            }));
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user pins:", error);
            }
        };

        if (view === 'diagnosis' || view === 'home') {
            fetchUserPins();
        }
    }, [view]);

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

    const handleEdit = (item) => {
        setEditData(item);
        setView('diagnosisEdit');
    };

    const handleViewResult = (item) => {
        if (item.type === 'expert') {
            setDiagnosisMode('expert');
            setView('expertDiagnosisResult');
        } else {
            setDiagnosisMode('general');
            setView('diagnosisResult');
        }
    };

    const onNavigate = (target, data) => {
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
        } else if (target === 'newDiagnosis') {
            setView('newDiagnosis');
        } else if (target === 'proposalForm') {
            setIsProposalEdit(!!data?.isEdit); // 데이터로 수정 모드 판단
            setProposalToEdit(data?.proposal || null);
            setView('proposalForm');
        } else if (target === 'proposalPreview') {
            setView('proposalPreview');
        } else if (target === 'proposalDetail') {
            setSelectedProposal(data);
            if (data) sessionStorage.setItem('selectedProposal', JSON.stringify(data));
            setView('proposalDetail');
        } else if (target === 'myProposals') {
            setView('myProposals');
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
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#16B5B0', fontWeight: 'bold' }}>화면을 불러오는 중입니다...</div>}>
            <div>
                {view === 'home' && (
                    <Home onNavigate={onNavigate} />
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
                        mapPins={mapPins}
                        onAddPin={handleAddPin}
                        onBack={() => setView('home')}
                        onNext={(data) => {
                            // data: { mode, location, address }
                            setDiagnosisMode(data.mode);
                            updateDiagnosisPayload('location', data.location);
                            updateDiagnosisPayload('address', data.address); // Add to payload if needed in future
                            setView('diagnosisStep1');
                        }}
                        onEdit={handleEdit}
                        onResult={handleViewResult}
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
                                // Calculate Average for General Mode (1-5)
                                const vals = Object.values(ratings).map(Number);
                                const sum = vals.reduce((a, b) => a + b, 0);
                                const avg = vals.length > 0 ? (sum / vals.length).toFixed(1) : "0.0";
                                updateDiagnosisPayload('satisfaction', avg);
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
                {view === 'newDiagnosis' && (
                    <NewDiagnosis
                        onBack={() => setView('home')}
                        onNavigate={onNavigate}
                    />
                )}
                {view === 'proposalForm' && (
                    <ProposalForm 
                        onBack={() => setView(isProposalEdit ? 'proposalDetail' : 'newDiagnosis')} 
                        onNavigate={onNavigate}
                        isEdit={isProposalEdit}
                        initialData={proposalToEdit}
                        onComplete={async (formData) => {
                            try {
                                const token = localStorage.getItem('access_token');
                                const VITE_API_URL = import.meta.env.VITE_API_URL || "https://ke7eh3ev2j33nj76skhv6n2tom0yzwim.lambda-url.ap-northeast-2.on.aws";
    
                                // [1] 신규 파일 업로드 처리
                                const uploadNewFiles = async (files) => {
                                    const uploadedNames = [];
                                    for (const file of files) {
                                        const uploadData = new FormData();
                                        // 한글 파일명 전송 시 서버(Python/Nginx 환경)에서 발생할 수 있는 
                                        // 인코딩 파싱 에러(500)를 방지하기 위해 파일명을 URL 인코딩하여 전송합니다.
                                        uploadData.append('file', file, encodeURIComponent(file.name));
                                        
                                        const uploadRes = await fetch(`${VITE_API_URL}/api/reports/upload`, {
                                            method: 'POST',
                                            body: uploadData,
                                            // FormData 전송 시 Content-Type 헤더를 명시하지 않아야 브라우저가 boundary를 자동으로 설정함
                                        });
                                        
                                        if (uploadRes.ok) {
                                            const result = await uploadRes.json();
                                            uploadedNames.push(result.url);
                                        } else {
                                            console.error('File upload failed for:', file.name);
                                        }
                                    }
                                    return uploadedNames;
                                };
    
                                const newUploadedFilenames = await uploadNewFiles(formData.newFiles || []);
                                const finalFilenames = [...(formData.existingFiles || []), ...newUploadedFilenames];
    
                                if (isProposalEdit) {
                                    // [수정 모드] PUT 요청
                                    const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${formData.id}`, {
                                        method: 'PUT',
                                        headers: { 
                                            'Content-Type': 'application/json',
                                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                        },
                                        body: JSON.stringify({
                                            category: formData.category,
                                            title: formData.title,
                                            content: formData.content,
                                            region: formData.region,
                                            detailed_address: formData.detailed_address,
                                            files: finalFilenames
                                        })
                                    });
    
                                    if (response.ok) {
                                        setSelectedProposal(prev => {
                                            const updatedProposal = {
                                                ...prev,
                                                category: formData.category,
                                                title: formData.title,
                                                content: formData.content,
                                                description: formData.content, // Fallback compatibility
                                                region: formData.region,
                                                detailed_address: formData.detailed_address,
                                                detailedAddress: formData.detailed_address, // Fallback compatibility
                                                files: finalFilenames,
                                                image: finalFilenames.length > 0 ? (finalFilenames[0].startsWith('http') ? finalFilenames[0] : (finalFilenames[0].startsWith('/uploads/') ? finalFilenames[0] : `/uploads/${finalFilenames[0]}`)) : (prev ? prev.image : null)
                                            };
                                            sessionStorage.setItem('selectedProposal', JSON.stringify(updatedProposal));
                                            return updatedProposal;
                                        });

                                        setView('proposalDetail');
                                    } else {
                                        alert('수정에 실패했습니다.');
                                    }
                                } else {
                                    // [신규 등록] POST 요청
                                    const payload = {
                                        category: formData.category,
                                        title: formData.title,
                                        content: formData.content,
                                        region: formData.region,
                                        detailed_address: formData.detailed_address,
                                        files: finalFilenames
                                    };
                                    
                                    const response = await fetch(`${VITE_API_URL}/api/reports/new-proposal`, {
                                        method: 'POST',
                                        headers: { 
                                            'Content-Type': 'application/json',
                                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                        },
                                        body: JSON.stringify(payload)
                                    });
                                    
                                    if (response.ok) {
                                        localStorage.removeItem('proposal_draft'); // [추가] 등록 성공 시 임시저장 삭제
                                        setView('proposalDone');
                                    } else {
                                        alert('제안 저장에 실패했습니다.');
                                    }
                                }
                            } catch (error) {
                                console.error("Proposal action error:", error);
                                alert('오류가 발생했습니다.');
                            }
                        }} 
                    />
                )}
                {view === 'proposalPreview' && (
                    <ProposalPreview
                        data={proposalData}
                        onBack={() => setView('proposalForm')}
                        onComplete={() => setView('proposalDone')}
                    />
                )}
                {view === 'proposalDone' && (
                    <ProposalDone
                        onMyProposals={() => {
                            setProposalData(null);
                            onNavigate('myProposals');
                        }}
                        onOthers={() => {
                            setProposalData(null);
                            setView('newDiagnosis');
                        }}
                    />
                )}
                {view === 'proposalDetail' && (
                    <ProposalDetail
                        proposal={selectedProposal}
                        onBack={() => setView('newDiagnosis')}
                        onNavigate={onNavigate}
                    />
                )}
                {view === 'myProposals' && (
                    <MyProposals
                        onBack={() => setView('home')}
                        onNavigate={onNavigate}
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
        </Suspense>
    )
}

export default App
