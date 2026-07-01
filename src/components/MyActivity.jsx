import React, { useState, useEffect } from 'react';
import './MyActivity.css';
import DiagnosisCard from './DiagnosisCard';
import { fetchWithLogout, API_URL } from '../utils/api';

const MyActivity = ({ onBack, onNavigate, onEdit }) => {
    const [activeTab, setActiveTab] = useState('my_diagnosis'); // Default to my_diagnosis
    const [sortOrder, setSortOrder] = useState('latest');
    const [myDiagnoses, setMyDiagnoses] = useState([]);
    const [userEmail, setUserEmail] = useState('');

    const user = {
        name: localStorage.getItem('user_name') || '사용자',
        email: userEmail,
        title: '열정적인 공간개척자',
        count: myDiagnoses.length
    };

    // Fetch user email from /users/me
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        fetchWithLogout(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.email) setUserEmail(data.email);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (activeTab === 'my_diagnosis') {
            const fetchMyData = async () => {
                try {
                    const token = localStorage.getItem('access_token');
                    if (!token) return;

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
                            } catch (e) { /* ignore date parse errors */ }

                            return {
                                id: item.result_id,
                                type: item.district_code === 'expert' ? 'expert' : 'general',
                                date: dateStr,
                                created_at: item.created_at,
                                bookmarked: false,
                                title: item.중분류 || item.대분류 || '진단 결과',
                                score: String(item.점수 || 0),
                                result: item.만족도 || 'suitable',
                                lat: item.위도,
                                lng: item.경도,
                                address: item.진단지역 || '주소 정보 없음',
                                placeName: item.장소명 || item.placeName || '',
                                scores: [],
                                desc: item.리뷰,
                                image: item.이미지경로 ? (item.이미지경로.startsWith('/uploads') ? `${API_URL}${item.이미지경로}` : item.이미지경로) : '/assets/diagnosis_street.png'
                            };
                        });
                        setMyDiagnoses(mapped);
                    }
                } catch (e) {
                    // silently ignore fetch errors
                }
            };
            fetchMyData();
        }
    }, [activeTab]);

    // Apply sort to diagnosis list
    const sortedDiagnoses = [...myDiagnoses].sort((a, b) => {
        if (sortOrder === 'oldest') {
            return new Date(a.created_at) - new Date(b.created_at);
        }
        // default: 'latest'
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const displayData = activeTab === 'bookmark'
        ? null // bookmark placeholder — rendered separately below
        : sortedDiagnoses;

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

                {activeTab === 'my_diagnosis' && (
                    <div
                        className="sort-dropdown-wrapper"
                        onClick={() => setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest')}
                    >
                        <span className="sort-label">{sortOrder === 'latest' ? '최신순' : '오래된순'}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                )}
            </div>

            {/* List Content */}
            <div className="list-content">
                {activeTab === 'bookmark' ? (
                    <div className="no-data" style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px', lineHeight: '1.6' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔖</div>
                        <div style={{ fontWeight: '600', color: '#555', marginBottom: '6px' }}>북마크 기능은 준비 중입니다</div>
                        <div>곧 업데이트될 예정이에요.</div>
                    </div>
                ) : displayData.length === 0 ? (
                    <div className="no-data" style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                        아직 진단 내역이 없습니다.
                    </div>
                ) : (
                    displayData.map(item => (
                        <DiagnosisCard
                            key={item.id}
                            item={item}
                            onBookmark={() => {}}
                            onClick={() => onEdit && onEdit(item)}
                            style={{ cursor: 'pointer' }}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default MyActivity;
