import React, { useState, useEffect, Suspense, lazy } from 'react'

const BigCategory = lazy(() => import('./components/BigCategory'));
const CheckList = lazy(() => import('./components/CheckList'));
const Satisfaction = lazy(() => import('./components/Satisfaction'));
const Review = lazy(() => import('./components/Review'));
const CheckDone = lazy(() => import('./components/CheckDone'));
const Home = lazy(() => import('./components/Home'));
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const SignupDone = lazy(() => import('./components/SignupDone'));
const Diagnosis = lazy(() => import('./components/Diagnosis'));
const DiagnosisStep1 = lazy(() => import('./components/DiagnosisStep1'));
const DiagnosisList = lazy(() => import('./components/DiagnosisList'));
const MyActivity = lazy(() => import('./components/MyActivity'));
const DiagnosisEdit = lazy(() => import('./components/DiagnosisEdit'));
const DiagnosisResult = lazy(() => import('./components/DiagnosisResult'));
const ExpertDiagnosisResult = lazy(() => import('./components/ExpertDiagnosisResult'));
const ExpertDiagnosisDetail = lazy(() => import('./components/ExpertDiagnosisDetail'));
const DiagnosisDetail = lazy(() => import('./components/DiagnosisDetail'));
const ProposalForm = lazy(() => import('./components/ProposalForm'));
const ProposalPreview = lazy(() => import('./components/ProposalPreview'));
const ProposalDone = lazy(() => import('./components/ProposalDone'));
const ProposalDetail = lazy(() => import('./components/ProposalDetail'));
const MyProposals = lazy(() => import('./components/MyProposals'));
const ProposalList = lazy(() => import('./components/ProposalList'));
const ChangePassword = lazy(() => import('./components/ChangePassword'));
const MyPage = lazy(() => import('./components/MyPage'));
const MyActivityHub = lazy(() => import('./components/MyActivityHub'));
const ReportPostForm = lazy(() => import('./components/ReportPostForm'));
const ReportDone = lazy(() => import('./components/ReportDone'));
const ReportList = lazy(() => import('./components/ReportList'));
const ReportDetail = lazy(() => import('./components/ReportDetail'));
const MyReports = lazy(() => import('./components/MyReports'));

const AdminLoginNew = lazy(() => import('./admin/pages/LoginNew'));
const AdminDashboardNew = lazy(() => import('./admin/pages/DashboardNew'));
const MemberEdit = lazy(() => import('./admin/pages/MemberEdit'));
const ExpertManagement = lazy(() => import('./admin/pages/ExpertManagement'));
const ExpertEdit = lazy(() => import('./admin/pages/ExpertEdit'));
const ProposalManagement = lazy(() => import('./admin/pages/ProposalManagement'));
const ProposalEdit = lazy(() => import('./admin/pages/ProposalEdit'));
const AdminMain = lazy(() => import('./admin/pages/AdminMain'));
const AdminUserList = lazy(() => import('./admin/pages/AdminUserList'));
const ReportManagement = lazy(() => import('./admin/pages/ReportManagement'));
const SurveyManagement = lazy(() => import('./admin/pages/SurveyManagement'));
const AdminReportDetail = lazy(() => import('./admin/pages/ReportDetail'));
const AdminProposalDetail = lazy(() => import('./admin/pages/AdminProposalDetail'));
const SurveyEditor = lazy(() => import('./admin/pages/SurveyEditor'));
const SurveyCreated = lazy(() => import('./admin/pages/SurveyCreated'));
const SurveyResults = lazy(() => import('./admin/pages/SurveyResults'));

// USER:PC pages (Figma node 845:4735 — 설문 series)
const PCSurveyList = lazy(() => import('./components/PCSurveyList'));
const PCSurveyDetail = lazy(() => import('./components/PCSurveyDetail'));
const PCSurveyConsent = lazy(() => import('./components/PCSurveyConsent'));
const PCSurveyJoin = lazy(() => import('./components/PCSurveyJoin'));
const PCSurveyResults = lazy(() => import('./components/PCSurveyResults'));
const PCSurveyDone = lazy(() => import('./components/PCSurveyDone'));
const PCProposeMap = lazy(() => import('./components/PCProposeMap'));
const PCProposeForm = lazy(() => import('./components/PCProposeForm'));
const PCProposeDetail = lazy(() => import('./components/PCProposeDetail'));
const PCReportMap = lazy(() => import('./components/PCReportMap'));
const PCReportForm = lazy(() => import('./components/PCReportForm'));
const PCReportDetail = lazy(() => import('./components/PCReportDetail'));

// USER:MOBILE survey pages (Figma node 848:13553)
const MSurveyList = lazy(() => import('./components/MSurveyList'));
const MSurveyDetail1 = lazy(() => import('./components/MSurveyDetail1'));
const MSurveyDetail2 = lazy(() => import('./components/MSurveyDetail2'));
const MSurveyJoin = lazy(() => import('./components/MSurveyJoin'));
const MSurveyDone = lazy(() => import('./components/MSurveyDone'));
const MSurveyResults = lazy(() => import('./components/MSurveyResults'));
const MProposalList = lazy(() => import('./components/MProposalList'));
const MProposalMap = lazy(() => import('./components/MProposalMap'));
const MProposalForm = lazy(() => import('./components/MProposalForm'));
const MProposalDetail = lazy(() => import('./components/MProposalDetail'));
const MProposalDone = lazy(() => import('./components/MProposalDone'));
const MReportList = lazy(() => import('./components/MReportList'));
const MReportMap = lazy(() => import('./components/MReportMap'));
const MReportForm = lazy(() => import('./components/MReportForm'));
const MReportDetail = lazy(() => import('./components/MReportDetail'));
const MReportDone = lazy(() => import('./components/MReportDone'));

// USER:MOBILE 진단(Diagnosis) pages (Figma node 941:5782 — 04/23 업데이트)
const MDiagnosisList = lazy(() => import('./components/MDiagnosisList'));
const MDiagnosisForm = lazy(() => import('./components/MDiagnosisForm'));
const MDiagnosisResult = lazy(() => import('./components/MDiagnosisResult'));
const MDiagnosisDone = lazy(() => import('./components/MDiagnosisDone'));

// USER:PC 진단(Diagnosis) pages (Figma node 941:5782 — 04/23 업데이트)
const PCDiagnosisMap = lazy(() => import('./components/PCDiagnosisMap'));

// USER: AI 가상시민 (Figma file TCuOzEqNhoLKjhF0reBDks — Phase 1)
const PCAICitizen = lazy(() => import('./components/PCAICitizen'));
const MAICitizen = lazy(() => import('./components/MAICitizen'));
const MAICitizenDetail = lazy(() => import('./components/MAICitizenDetail'));

// USER 04/01 업데이트 — 마이페이지 제보 (Figma node 830:4381)
const MMyReportDetail = lazy(() => import('./components/MMyReportDetail'));
const MMyReportEdit = lazy(() => import('./components/MMyReportEdit'));
const PCMyReportList = lazy(() => import('./components/PCMyReportList'));
const PCMyReportEdit = lazy(() => import('./components/PCMyReportEdit'));
const PCMyProposalDetail = lazy(() => import('./components/PCMyProposalDetail'));

import { fetchWithLogout, API_URL } from './utils/api'
import PCHeader from './components/PCHeader'

function App() {
    // Initialize view from sessionStorage to support page refresh
    // For adminLogin and adminSignup, force redirect to 'home' on refresh as per user request
    const [view, setView] = useState(() => {
        const path = window.location.pathname;
        if (path === '/admin' || path === '/admin/') {
            const token = localStorage.getItem('access_token');
            if (token) return 'adminMain';
            return 'adminLoginNew';
        }

        const stored = sessionStorage.getItem('current_view');
        // If path is not /admin, but stored view is an admin view, reset to home
        const isAdminView = ['adminLoginNew', 'adminDashboardNew', 'adminMain', 'adminUserList', 'reportManagement', 'adminReportDetail', 'surveyManagement', 'surveyEditor', 'surveyCreated', 'surveyResults', 'expertManagement', 'memberEdit', 'expertEdit', 'proposalManagement', 'proposalEdit', 'adminProposalDetail'].includes(stored);
        if (path === '/' && isAdminView) return 'home';

        if (['adminLogin', 'adminSignup', 'adminDashboard'].includes(stored)) return 'home';
        return stored || 'home';
    });

    const [previousView, setPreviousView] = useState('home');
    const [data, setData] = useState({}); // { Big: { Mid: [Questions...] } }
    const [loading, setLoading] = useState(false); // Initial loading not needed until diagnosis starts
    const [selectedBig, setSelectedBig] = useState('');
    const [selectedMid, setSelectedMid] = useState(null);
    const [diagnosisMode, setDiagnosisMode] = useState('general'); // 'general' | 'expert'

    // State to pass data to edit page
    const [editData, setEditData] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);

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

    const [selectedReport, setSelectedReport] = useState(() => {
        const stored = sessionStorage.getItem('selectedReport');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { return null; }
        }
        return null;
    });
    const [isReportEdit, setIsReportEdit] = useState(false);
    const [reportToEdit, setReportToEdit] = useState(null);
    const [selectedSurvey, setSelectedSurvey] = useState(() => {
        const stored = sessionStorage.getItem('selectedSurvey');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { return null; }
        }
        return null;
    });

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


    // Fetch diagnosis catalog (general/expert) from backend; fallback to static JSON for offline dev.
    useEffect(() => {
        const ctrl = new AbortController();
        const fetchData = async () => {
            setLoading(true);
            const mode = diagnosisMode === 'expert' ? 'expert' : 'general';
            try {
                let response = await fetch(`${API_URL}/checklist/templates?mode=${mode}`, { signal: ctrl.signal });
                if (!response.ok) {
                    response = await fetch(`/assets/data/${mode}_diagnosis.json`, { signal: ctrl.signal });
                }
                if (!response.ok) throw new Error(`Failed to fetch ${mode} catalog`);
                const jsonData = await response.json();
                if (!ctrl.signal.aborted) setData(jsonData);
            } catch (error) {
                // 컴포넌트 unmount 또는 view 전환으로 abort된 fetch는 무시
                if (ctrl.signal.aborted || error.name === 'AbortError' || error.name === 'TypeError') return;
                console.error("Failed to load diagnosis data:", error);
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        };

        fetchData();
        return () => ctrl.abort();
    }, [diagnosisMode]);

    // Fetch user's diagnosis pins from backend
    useEffect(() => {
        const fetchUserPins = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return; // Not logged in, keep default pins or clear? Maybe keep default mock for non-users?

            try {
                const res = await fetchWithLogout(`${API_URL}/checklist/my`, {
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

    // Sync state with browser history for back button support
    useEffect(() => {
        const handlePopState = (event) => {
            if (event.state && event.state.view) {
                setView(event.state.view);
            } else {
                setView('home');
            }
        };

        window.addEventListener('popstate', handlePopState);

        if (!window.history.state) {
            window.history.replaceState({ view: view }, '', '');
        }

        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Scroll to top and save view state whenever view changes
    useEffect(() => {
        window.scrollTo(0, 0);
        sessionStorage.setItem('current_view', view);

        const adminViews = ['adminLoginNew', 'adminDashboardNew', 'adminMain', 'adminUserList', 'reportManagement', 'adminReportDetail', 'surveyManagement', 'surveyEditor', 'surveyCreated', 'surveyResults', 'expertManagement', 'proposalManagement', 'memberEdit', 'expertEdit', 'proposalEdit', 'adminProposalDetail'];
        const newPath = adminViews.includes(view) ? '/admin' : '/';
        
        if (window.history.state?.view !== view || window.location.pathname !== newPath) {
            window.history.pushState({ view: view }, '', newPath);
        }
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

    // Persistence logic using localStorage
    const [deletedReportIds, setDeletedReportIds] = useState(() => {
        const saved = localStorage.getItem('deleted_report_ids');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [likedReportIds, setLikedReportIds] = useState(() => {
        const saved = localStorage.getItem('liked_report_ids');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [userCreatedReports, setUserCreatedReports] = useState(() => {
        const saved = localStorage.getItem('user_created_reports');
        return saved ? JSON.parse(saved) : [];
    });
    const [updatedReportsMap, setUpdatedReportsMap] = useState(() => {
        const saved = localStorage.getItem('updated_reports_map');
        return saved ? JSON.parse(saved) : {};
    });

    // Side effects to sync with localStorage
    useEffect(() => {
        localStorage.setItem('deleted_report_ids', JSON.stringify(Array.from(deletedReportIds)));
    }, [deletedReportIds]);

    useEffect(() => {
        localStorage.setItem('liked_report_ids', JSON.stringify(Array.from(likedReportIds)));
    }, [likedReportIds]);

    useEffect(() => {
        localStorage.setItem('user_created_reports', JSON.stringify(userCreatedReports));
    }, [userCreatedReports]);

    useEffect(() => {
        localStorage.setItem('updated_reports_map', JSON.stringify(updatedReportsMap));
    }, [updatedReportsMap]);

    const handleReportDelete = (reportId) => {
        setDeletedReportIds(prev => new Set(prev).add(reportId));
        alert('제보글이 정상적으로 삭제되었습니다.');
        setView(previousView);
    };

    const handleToggleLike = (reportId) => {
        setLikedReportIds(prev => {
            const next = new Set(prev);
            if (next.has(reportId)) next.delete(reportId);
            else next.add(reportId);
            return next;
        });
    };

    const onNavigate = (target, data) => {
        const districtCode = localStorage.getItem('district_code') || '';
        const isExpert = districtCode.startsWith('expert');

        if (target === 'home') {
            setView('home');
            return;
        } else if (target === 'checkList') {
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
        } else if (target === 'adminLoginNew') {
            setView('adminLoginNew');
        } else if (target === 'adminDashboardNew') {
            setView('adminDashboardNew');
        } else if (target === 'memberEdit') {
            setSelectedMember(data);
            setView('memberEdit');
        } else if (target === 'expertManagement') {
            setView('expertManagement');
        } else if (target === 'expertEdit') {
            setSelectedMember(data);
            setView('expertEdit');
        } else if (target === 'proposalManagement') {
            setView('proposalManagement');
        } else if (target === 'adminMain') {
            setView('adminMain');
        } else if (target === 'adminUserList') {
            setView('adminUserList');
        } else if (target === 'reportManagement') {
            setView('reportManagement');
        } else if (target === 'adminReportDetail') {
            setSelectedMember(data);
            setView('adminReportDetail');
        } else if (target === 'surveyManagement') {
            setView('surveyManagement');
        } else if (target === 'surveyEditor') {
            setSelectedSurvey(data || null);
            setView('surveyEditor');
        } else if (target === 'surveyCreated') {
            setView('surveyCreated');
        } else if (target === 'surveyResults') {
            setSelectedSurvey(data || null);
            setView('surveyResults');
        } else if (target === 'adminProposalDetail') {
            setSelectedMember(data);
            setView('adminProposalDetail');
        } else if (target === 'proposalEdit') {
            setSelectedMember(data); // Reusing selectedMember state for proposal context
            setView('proposalEdit');
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
        } else if (target === 'proposalList') {
            setView('proposalList');
        } else if (target === 'myPage') {
            if (!localStorage.getItem('access_token')) {
                alert('로그인이 필요한 서비스입니다.');
                setView('login');
                return;
            }
            setView('myPage');
        } else if (target === 'reportPostForm') {
            setIsReportEdit(!!data?.isEdit);
            setReportToEdit(data?.report || null);
            setView('reportPostForm');
            return;
        } else if (target === 'reportList') {
            setView('reportList');
        } else if (target === 'reportDetail') {
            setPreviousView(view);
            if (data) {
                const merged = { ...data, showActions: data.showActions ?? (view === 'myReportList' || view === 'myReports') };
                setSelectedReport(merged);
                sessionStorage.setItem('selectedReport', JSON.stringify(merged));
            } else {
                setSelectedReport(null);
            }
            setView('reportDetail');
        } else if (target === 'myActivityHub') {
            if (!localStorage.getItem('access_token')) {
                alert('로그인이 필요한 서비스입니다.');
                setView('login');
                return;
            }
            setView('myActivityHub');
        } else if (target === 'myReportList' || target === 'myReports') {
            if (!localStorage.getItem('access_token')) {
                alert('로그인이 필요한 서비스입니다.');
                setView('login');
                return;
            }
            setView('myReportList');
        } else if (target === 'pcSurveyList') {
            setView('pcSurveyList');
        } else if (target === 'pcSurveyDetail') {
            setSelectedSurvey(data);
            if (data) sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            setView('pcSurveyDetail');
        } else if (target === 'pcSurveyConsent') {
            setSelectedSurvey(data);
            if (data) sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            setView('pcSurveyConsent');
        } else if (target === 'pcSurveyJoin') {
            setSelectedSurvey(data);
            if (data) sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            setView('pcSurveyJoin');
        } else if (target === 'pcSurveyResults') {
            setSelectedSurvey(data);
            if (data) sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            setView('pcSurveyResults');
        } else if (target === 'pcSurveyDone') {
            if (data) {
                setSelectedSurvey(data);
                sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            }
            setView('pcSurveyDone');
        } else if (target === 'pcProposeMap') {
            setView('pcProposeMap');
        } else if (target === 'pcProposeForm') {
            setView('pcProposeForm');
        } else if (target === 'pcProposeDetail') {
            setSelectedProposal(data);
            if (data) sessionStorage.setItem('selectedProposal', JSON.stringify(data));
            setView('pcProposeDetail');
        } else if (target === 'pcReportMap') {
            setView('pcReportMap');
        } else if (target === 'pcReportForm') {
            setView('pcReportForm');
        } else if (target === 'pcReportDetail') {
            setSelectedReport(data);
            if (data) sessionStorage.setItem('selectedReport', JSON.stringify(data));
            setView('pcReportDetail');
        } else if (target === 'mSurveyList') {
            setView('mSurveyList');
        } else if (target === 'mSurveyDetail1') {
            setSelectedSurvey(data);
            if (data) sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            setView('mSurveyDetail1');
        } else if (target === 'mSurveyDetail2') {
            setSelectedSurvey(data);
            if (data) sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            setView('mSurveyDetail2');
        } else if (target === 'mSurveyJoin') {
            setSelectedSurvey(data);
            if (data) sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            setView('mSurveyJoin');
        } else if (target === 'mSurveyDone') {
            if (data) {
                setSelectedSurvey(data);
                sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            }
            setView('mSurveyDone');
        } else if (target === 'mSurveyResults') {
            setSelectedSurvey(data);
            if (data) sessionStorage.setItem('selectedSurvey', JSON.stringify(data));
            setView('mSurveyResults');
        } else if (target === 'mProposalList') {
            setView('mProposalList');
        } else if (target === 'mProposalMap') {
            setView('mProposalMap');
        } else if (target === 'mProposalForm') {
            setView('mProposalForm');
        } else if (target === 'mProposalDetail') {
            setSelectedProposal(data);
            setView('mProposalDetail');
        } else if (target === 'mProposalDone') {
            setView('mProposalDone');
        } else if (target === 'mReportList') {
            setView('mReportList');
        } else if (target === 'mReportMap') {
            setView('mReportMap');
        } else if (target === 'mReportForm') {
            setView('mReportForm');
        } else if (target === 'mReportDetail') {
            setSelectedReport(data);
            setView('mReportDetail');
        } else if (target === 'mReportDone') {
            setView('mReportDone');
        } else if (target === 'mDiagnosisList') {
            setView('mDiagnosisList');
        } else if (target === 'mDiagnosisForm') {
            if (data) setSelectedReport(data);
            setView('mDiagnosisForm');
        } else if (target === 'mDiagnosisDetail') {
            if (data) setSelectedReport(data);
            setView('mDiagnosisDetail');
        } else if (target === 'mDiagnosisResult') {
            if (data) setSelectedReport(data);
            setView('mDiagnosisResult');
        } else if (target === 'mDiagnosisDone') {
            setView('mDiagnosisDone');
        } else if (target === 'pcAICitizen') {
            setView('pcAICitizen');
        } else if (target === 'mAICitizen') {
            setView('mAICitizen');
        } else if (target === 'mAICitizenDetail') {
            if (data) setSelectedReport(data);
            setView('mAICitizenDetail');
        } else if (target === 'pcDiagnosisMap') {
            setView('pcDiagnosisMap');
        } else if (target === 'pcDiagnosisForm') {
            setView('pcDiagnosisForm');
        } else if (target === 'pcDiagnosisDetail') {
            setSelectedReport(data);
            setView('pcDiagnosisDetail');
        } else if (target === 'pcDiagnosisDone') {
            setView('pcDiagnosisDone');
        } else if (target === 'mMyReportDetail') {
            setSelectedReport(data);
            setView('mMyReportDetail');
        } else if (target === 'mMyReportEdit') {
            setSelectedReport(data || selectedReport);
            setView('mMyReportEdit');
        } else if (target === 'pcMyReportList') {
            setView('pcMyReportList');
        } else if (target === 'pcMyReportEdit') {
            setSelectedReport(data || selectedReport);
            setView('pcMyReportEdit');
        } else if (target === 'pcMyProposalDetail') {
            const proposalData = data || selectedProposal;
            setSelectedProposal(proposalData);
            if (proposalData) sessionStorage.setItem('selectedProposal', JSON.stringify(proposalData));
            setView('pcMyProposalDetail');
        }
    };

    // Determine theme based on mode
    // General: Primary #E6235A (Pink), Progress #8B1F54 (Dark Pink from CSS)
    // Expert: Primary #542AA3 (Purple), Progress #1E0B43 (Dark Purple)
    const theme = diagnosisMode === 'expert'
        ? { primary: '#542AA3', progressBar: '#1E0B43' }
        : { primary: '#E6235A', progressBar: '#8B1F54' };

    if (loading && view !== 'home') return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

    // 어드민·인증 뷰, UserPCLayout 자체 헤더 보유 PC 뷰에서는 PCHeader 숨김
    const noHeaderViews = [
        'login', 'signup', 'signupDone', 'changePassword',
        'adminLogin', 'adminLoginNew', 'adminDashboardNew', 'adminMain', 'adminUserList',
        'reportManagement', 'adminReportDetail', 'surveyManagement', 'surveyEditor',
        'surveyCreated', 'surveyResults', 'expertManagement', 'memberEdit', 'expertEdit',
        'proposalManagement', 'proposalEdit', 'adminProposalDetail',
        // UserPCLayout 자체 헤더를 가진 PC 전용 뷰 (PCHeader 중복 방지)
        'pcSurveyList', 'pcSurveyDetail', 'pcSurveyConsent', 'pcSurveyJoin', 'pcSurveyResults', 'pcSurveyDone',
        'pcProposeMap', 'pcProposeForm', 'pcProposeDetail',
        'pcReportMap', 'pcReportForm', 'pcReportDetail',
        'pcMyReportList', 'pcMyReportEdit', 'pcMyProposalDetail',
        'pcAICitizen',
        'pcDiagnosisMap', 'pcDiagnosisForm', 'pcDiagnosisDetail', 'pcDiagnosisDone',
    ];
    const showPCHeader = !noHeaderViews.includes(view);

    return (
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#16B5B0', fontWeight: 'bold' }}>화면을 불러오는 중입니다...</div>}>
            <div>
                {/* PC 전용 네비게이션 헤더 */}
                {showPCHeader && (
                    <PCHeader currentView={view} onNavigate={onNavigate} />
                )}
                {view === 'home' && (
                    <Home onNavigate={onNavigate} />
                )}
                {view === 'login' && (
                    <Login
                        onBack={() => {
                            if (sessionStorage.getItem('pw_change_required') === '1') {
                                setView('changePassword');
                            } else {
                                setView('home');
                            }
                        }}
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
                {view === 'proposalForm' && (
                    <ProposalForm
                        onBack={() => setView(isProposalEdit ? 'proposalDetail' : 'proposalList')}
                        onNavigate={onNavigate}
                        isEdit={isProposalEdit}
                        initialData={proposalToEdit}
                        onComplete={async (formData) => {
                            try {
                                const token = localStorage.getItem('access_token');
                                // [1] 신규 파일 업로드 처리
                                const uploadNewFiles = async (files) => {
                                    const uploadedNames = [];
                                    for (const file of files) {
                                        const uploadData = new FormData();
                                        // 한글 파일명 전송 시 서버(Python/Nginx 환경)에서 발생할 수 있는 
                                        // 인코딩 파싱 에러(500)를 방지하기 위해 파일명을 URL 인코딩하여 전송합니다.
                                        uploadData.append('file', file, encodeURIComponent(file.name));
                                        
                                        const uploadRes = await fetch(`${API_URL}/api/reports/upload`, {
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
                                    const response = await fetch(`${API_URL}/api/reports/proposals/${formData.id}`, {
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
                                    
                                    const response = await fetch(`${API_URL}/api/reports/new-proposal`, {
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
                            setView('proposalList');
                        }}
                    />
                )}
                {view === 'proposalDetail' && (
                    <ProposalDetail
                        proposal={selectedProposal}
                        onBack={() => setView('proposalList')}
                        onNavigate={onNavigate}
                    />
                )}
                {view === 'myProposals' && (
                    <MyProposals
                        onBack={() => setView('home')}
                        onNavigate={onNavigate}
                    />
                )}
                {view === 'proposalList' && (
                    <ProposalList
                        onBack={() => setView('home')}
                        onNavigate={onNavigate}
                    />
                )}
                {view === 'myPage' && (
                    <MyPage onBack={() => setView('home')} />
                )}
                {view === 'myActivityHub' && (
                    <MyActivityHub 
                        onBack={() => setView('home')} 
                        onNavigate={onNavigate}
                    />
                )}
                {view === 'myReportList' && (
                    <MyReports 
                        onBack={() => setView('myActivityHub')} 
                        onNavigate={onNavigate}
                        deletedIds={deletedReportIds}
                        likedIds={likedReportIds}
                        onToggleLike={handleToggleLike}
                        userCreatedReports={userCreatedReports}
                        updatedReportsMap={updatedReportsMap}
                    />
                )}
                {view === 'reportPostForm' && (
                    <ReportPostForm 
                        onBack={() => setView(isReportEdit ? 'reportDetail' : 'home')} 
                        onNavigate={onNavigate}
                        isEdit={isReportEdit}
                        initialData={reportToEdit}
                        onComplete={(newData) => {
                            if (isReportEdit && newData && selectedReport) {
                                setUpdatedReportsMap(prev => ({
                                    ...prev,
                                    [selectedReport.id]: { ...selectedReport, ...newData }
                                }));
                                setSelectedReport(prev => ({ ...prev, ...newData }));
                                setView('reportDetail');
                            } else if (newData) {
                                const newReport = {
                                    ...newData,
                                    id: Date.now(), // Unique ID
                                    author: '나',
                                    date: new Date().toLocaleDateString().replace(/\. /g, '.').replace(/\.$/, ''),
                                    likes: 0,
                                    comments: 0,
                                    views: 0,
                                    progress_step: 1,
                                    status: '개선예정',
                                    comments_list: []
                                };
                                setUserCreatedReports(prev => [newReport, ...prev]);
                                setView('reportDone');
                            } else {
                                setView('reportDone');
                            }
                        }}
                    />
                )}
                {view === 'reportDone' && (
                    <ReportDone 
                        onBack={() => setView('home')} 
                        onNavigate={onNavigate} 
                    />
                )}
                {view === 'reportList' && (
                    <ReportList 
                        onBack={() => setView('home')} 
                        onNavigate={onNavigate} 
                        deletedIds={deletedReportIds}
                        likedIds={likedReportIds}
                        onToggleLike={handleToggleLike}
                        userCreatedReports={userCreatedReports}
                        updatedReportsMap={updatedReportsMap}
                    />
                )}
                {view === 'reportDetail' && (
                    <ReportDetail 
                        report={selectedReport} 
                        onBack={() => setView(previousView)} 
                        onNavigate={onNavigate}
                        onDelete={handleReportDelete}
                        likedIds={likedReportIds}
                        onToggleLike={handleToggleLike}
                        showActions={selectedReport?.showActions}
                    />
                )}
                {view === 'changePassword' && (
                    <ChangePassword onBack={() => setView('home')} />
                )}
                {view === 'adminLoginNew' && (
                    <AdminLoginNew
                        onNavigate={(target) => setView(target)}
                    />
                )}
                {view === 'adminDashboardNew' && (
                    <AdminDashboardNew
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'memberEdit' && (
                    <MemberEdit
                        member={selectedMember}
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'expertManagement' && (
                    <ExpertManagement
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'expertEdit' && (
                    <ExpertEdit
                        member={selectedMember}
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'proposalManagement' && (
                    <ProposalManagement
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'proposalEdit' && (
                    <ProposalEdit
                        proposal={selectedMember}
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'adminMain' && (
                    <AdminMain
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'adminUserList' && (
                    <AdminUserList
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'reportManagement' && (
                    <ReportManagement
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'adminReportDetail' && (
                    <AdminReportDetail
                        report={selectedMember}
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'adminProposalDetail' && (
                    <AdminProposalDetail
                        proposal={selectedMember}
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'surveyEditor' && (
                    <SurveyEditor
                        surveyData={selectedSurvey}
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'surveyCreated' && (
                    <SurveyCreated
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'surveyResults' && (
                    <SurveyResults
                        survey={selectedSurvey}
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'surveyManagement' && (
                    <SurveyManagement
                        onNavigate={(target, data) => onNavigate(target, data)}
                    />
                )}
                {view === 'pcSurveyList' && (
                    <PCSurveyList onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'pcSurveyDetail' && (
                    <PCSurveyDetail onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'pcSurveyConsent' && (
                    <PCSurveyConsent onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'pcSurveyJoin' && (
                    <PCSurveyJoin onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'pcSurveyResults' && (
                    <PCSurveyResults onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'pcSurveyDone' && (
                    <PCSurveyDone onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'pcProposeMap' && (
                    <PCProposeMap onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'pcProposeForm' && (
                    <PCProposeForm onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'pcProposeDetail' && (
                    <PCProposeDetail onNavigate={(target, data) => onNavigate(target, data)} proposal={selectedProposal} />
                )}
                {view === 'pcReportMap' && (
                    <PCReportMap onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'pcReportForm' && (
                    <PCReportForm onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'pcReportDetail' && (
                    <PCReportDetail onNavigate={(target, data) => onNavigate(target, data)} report={selectedReport} />
                )}
                {view === 'mSurveyList' && (
                    <MSurveyList onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mSurveyDetail1' && (
                    <MSurveyDetail1 onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'mSurveyDetail2' && (
                    <MSurveyDetail2 onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'mSurveyJoin' && (
                    <MSurveyJoin onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'mSurveyDone' && (
                    <MSurveyDone onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'mSurveyResults' && (
                    <MSurveyResults onNavigate={(target, data) => onNavigate(target, data)} survey={selectedSurvey} />
                )}
                {view === 'mProposalList' && (
                    <MProposalList onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mProposalMap' && (
                    <MProposalMap onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mProposalForm' && (
                    <MProposalForm onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mProposalDetail' && (
                    <MProposalDetail onNavigate={(target, data) => onNavigate(target, data)} proposal={selectedProposal} />
                )}
                {view === 'mProposalDone' && (
                    <MProposalDone onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mReportList' && (
                    <MReportList onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mReportMap' && (
                    <MReportMap onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mReportForm' && (
                    <MReportForm onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mReportDetail' && (
                    <MReportDetail onNavigate={(target, data) => onNavigate(target, data)} report={selectedReport} />
                )}
                {view === 'mReportDone' && (
                    <MReportDone onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mDiagnosisList' && (
                    <MDiagnosisList onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mDiagnosisForm' && (
                    <MDiagnosisForm onNavigate={(target, data) => onNavigate(target, data)} location={selectedReport} />
                )}
                {(view === 'mDiagnosisResult' || view === 'mDiagnosisDetail') && (
                    <MDiagnosisResult
                        onNavigate={(target, data) => onNavigate(target, data)}
                        address={selectedReport?.region || selectedReport?.address || '부산 부산진구 초연로 6'}
                        date={selectedReport?.date || '2024/05/16'}
                        activeCategory={selectedReport?.categoryKey || 'traffic'}
                        photo={selectedReport?.thumb || null}
                        district={selectedReport?.region || null}
                        resultId={selectedReport?.id || null}
                    />
                )}
                {view === 'mDiagnosisDone' && (
                    <MDiagnosisDone onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'pcAICitizen' && (
                    <PCAICitizen onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mAICitizen' && (
                    <MAICitizen onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'mAICitizenDetail' && (
                    <MAICitizenDetail citizen={selectedReport} onNavigate={(target, data) => onNavigate(target, data)} />
                )}
                {view === 'pcDiagnosisMap' && (
                    <PCDiagnosisMap onNavigate={(target, data) => onNavigate(target, data)} initialPanel="list" />
                )}
                {view === 'pcDiagnosisForm' && (
                    <PCDiagnosisMap onNavigate={(target, data) => onNavigate(target, data)} initialPanel="form" />
                )}
                {view === 'pcDiagnosisDetail' && (
                    <PCDiagnosisMap onNavigate={(target, data) => onNavigate(target, data)} initialPanel="detail" initialItem={selectedReport} />
                )}
                {view === 'pcDiagnosisDone' && (
                    <PCDiagnosisMap onNavigate={(target, data) => onNavigate(target, data)} initialPanel="done" />
                )}
                {view === 'mMyReportDetail' && (
                    <MMyReportDetail
                        onNavigate={(target, data) => onNavigate(target, data)}
                        report={selectedReport}
                        onDelete={handleReportDelete}
                        onEdit={(rep) => onNavigate('mMyReportEdit', rep)}
                    />
                )}
                {view === 'mMyReportEdit' && (
                    <MMyReportEdit
                        onNavigate={(target, data) => onNavigate(target, data)}
                        report={selectedReport}
                        onComplete={(updated) => {
                            if (updated && selectedReport) {
                                setUpdatedReportsMap((prev) => ({
                                    ...prev,
                                    [selectedReport.id]: { ...selectedReport, ...updated },
                                }));
                                setSelectedReport((prev) => ({ ...prev, ...updated }));
                            }
                        }}
                    />
                )}
                {view === 'pcMyReportList' && (
                    <PCMyReportList
                        onNavigate={(target, data) => onNavigate(target, data)}
                        deletedIds={deletedReportIds}
                        likedIds={likedReportIds}
                        userCreatedReports={userCreatedReports}
                        updatedReportsMap={updatedReportsMap}
                    />
                )}
                {view === 'pcMyReportEdit' && (
                    <PCMyReportEdit
                        onNavigate={(target, data) => onNavigate(target, data)}
                        report={selectedReport}
                        onComplete={(updated) => {
                            if (updated && selectedReport) {
                                setUpdatedReportsMap((prev) => ({
                                    ...prev,
                                    [selectedReport.id]: { ...selectedReport, ...updated },
                                }));
                                setSelectedReport((prev) => ({ ...prev, ...updated }));
                            }
                        }}
                    />
                )}
                {view === 'pcMyProposalDetail' && (
                    <PCMyProposalDetail
                        onNavigate={(target, data) => onNavigate(target, data)}
                        proposal={selectedProposal}
                    />
                )}
            </div>
        </Suspense>
    )
}

export default App
