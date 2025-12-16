import React, { useState, useEffect } from 'react';
import './MyActivity.css';
import DiagnosisCard from './DiagnosisCard';
import { fetchWithLogout } from '../utils/api';

const MyActivity = ({ onBack, onNavigate, onEdit }) => {
    const [activeTab, setActiveTab] = useState('my_diagnosis'); // Default to my_diagnosis
    const [sortOrder, setSortOrder] = useState('latest');
    const [myDiagnoses, setMyDiagnoses] = useState([]);

    // Mock User Data
    const user = {
        name: localStorage.getItem('user_name') || '사용자', // Get from local storage if available
        email: 'user@example.com',
        title: '열정적인 공간개척자',
        count: myDiagnoses.length
    };

    useEffect(() => {
        console.log("MyActivity Mounted. ActiveTab:", activeTab);
        if (activeTab === 'my_diagnosis') {
            const fetchMyData = async () => {
                try {
                    const token = localStorage.getItem('access_token');
                    console.log("MyActivity Token:", token);
                    if (!token) {
                        console.warn("MyActivity: No token found");
                        return;
                    }

                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                    console.log("Fetching: " + `${API_URL}/checklist/my`);
                    // alert("Fetching: " + `${API_URL}/checklist/my`); // Debug

                    const res = await fetchWithLogout(`${API_URL}/checklist/my`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        // Map to card format
                        const mapped = data.map(item => {
                            // Safe date parsing
                            let dateStr = '23.01.01';
                            try {
                                if (item.created_at) {
                                    dateStr = new Date(item.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/ /g, '.');
                                }
                            } catch (e) { console.warn("Date parse error", e); }

                            // Determine result for expert (assuming answers has 'suitable' or 'unsuitable' logic, or derived from score?)
                            // For now, if district_code is expert, we don't have a direct 'result' column in ChecklistResult (it has '만족도' or '점수').
                            // Let's assume '만족도' stores 'suitable'/'unsuitable' for expert if backend saved it there.
                            // In Review.jsx: "만족도": diagnosisPayload?.satisfaction ? String(diagnosisPayload.satisfaction) : "0",
                            // In expert mode, answers might contain suitability.
                            // Let's default to suitable if unknown.

                            return {
                                id: item.result_id,
                                type: item.district_code === 'expert' ? 'expert' : 'general',
                                date: dateStr,
                                bookmarked: false,
                                title: item.중분류 || item.대분류 || '진단 결과',
                                score: String(item.점수 || 0),
                                result: item.만족도 || 'suitable', // Start with satisfaction column
                                lat: item.위도,
                                lng: item.경도,
                                address: item.진단지역 || '주소 정보 없음',
                                placeName: item.장소명 || item.placeName || '', // With '진단지역' hack, placeName might be empty or part of address. Leaving as is if backend doesn't return it.
                                scores: [],
                                desc: item.리뷰,
                                image: item.이미지경로 ? (item.이미지경로.startsWith('/') ? `${API_URL}${item.이미지경로}` : item.이미지경로) : '/assets/diagnosis_street.png'
                            };
                        });
                        setMyDiagnoses(mapped);
                    }
                } catch (e) {
                    console.error("Failed to fetch my diagnoses", e);
                }
            };
            fetchMyData();
        }
    }, [activeTab]);

    const displayData = activeTab === 'bookmark'
        ? [] // No bookmarks implementation yet
        : myDiagnoses;

    return (
        <div className="my-activity-container">
            {/* Header */}
            <div className="activity-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <div className="page-title">나의 활동</div>

            {/* Profile Section */}
            <div className="profile-card">
                <div className="profile-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div className="profile-info">
                    <div className="user-types">
                        <span className="user-badge">{user.title}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </div>
                    <div className="user-name">
                        <span className="name-bold">{user.name}</span> <span className="name-suffix">님</span>
                    </div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-stats">총 진단 횟수: <span className="stat-count">{user.count}회</span></div>
                </div>
            </div>

            {/* Tabs & Sort */}
            <div className="controls-row">
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'bookmark' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookmark')}
                    >
                        북마크
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'my_diagnosis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my_diagnosis')}
                    >
                        나의 진단
                    </button>
                </div>

                <div className="sort-dropdown-wrapper">
                    <span className="sort-label">최신순</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            {/* List Content */}
            <div className="list-content">
                {displayData.length === 0 ? (
                    <div className="no-data" style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                        {activeTab === 'bookmark' ? '저장된 북마크가 없습니다.' : '아직 진단 내역이 없습니다.'}
                    </div>
                ) : (
                    displayData.map(item => (
                        <DiagnosisCard
                            key={item.id}
                            item={item}
                            onBookmark={() => { }} // No bookmark toggle logic in MyActivity mockup, but prop is required or can be safely ignored
                            onClick={() => activeTab === 'my_diagnosis' && onEdit && onEdit(item)}
                            style={{ cursor: activeTab === 'my_diagnosis' ? 'pointer' : 'default' }}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default MyActivity;
