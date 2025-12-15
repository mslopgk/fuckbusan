import React, { useState } from 'react';
import './MyActivity.css';

const MyActivity = ({ onBack, onNavigate, onEdit }) => {
    const [activeTab, setActiveTab] = useState('bookmark'); // 'bookmark' | 'my_diagnosis'
    const [sortOrder, setSortOrder] = useState('latest');

    // Mock User Data
    const user = {
        name: '홍길동',
        email: 'user123456@gmail.com',
        title: '열정적인 공간개척자',
        count: 10
    };

    // Mock Diagnosis Data (similar to DiagnosisList but for specific user tabs)
    const mockData = [
        {
            id: 1,
            type: 'general',
            date: '25.12.20',
            bookmarked: true,
            title: '보도',
            score: '2.0',
            lat: '35.1717231',
            lng: '129.1107443',
            scores: [
                { label: '접근성', val: '2.0' },
                { label: '안전성', val: '2.0' },
                { label: '정보\n제공성', val: '2.0' },
                { label: '포용성', val: '2.0' },
                { label: '이동성', val: '2.0' },
                { label: '심미성', val: '2.0' }
            ],
            desc: '시설물 전반은 잘 관리되고 있는 것으로 보이나, 일부 구간의 바닥 상태가 고르지 않아 보행 시 불편함을 느꼈습니다. 특히 노약자나 어린이가 이용할 경우 안전사고...',
            image: '/assets/diagnosis_street.png'
        },
        {
            id: 2,
            type: 'expert',
            date: '25.12.20',
            bookmarked: true,
            title: '위생공간/화장실',
            result: 'suitable',
            lat: '35.1717231',
            lng: '129.1107443',
            desc: '시설물 전반은 잘 관리되고 있는 것으로 보이나, 일부 구간의 바닥 상태가 고르지 않아 보행 시 불편함을 느꼈습니다. 특히 노약자나 어린이가 이용할 경우 안전사고...',
            image: '/assets/diagnosis_street.png'
        }
    ];

    // For demo, show same data for both tabs but filtered by 'bookmarked' logic if real
    const displayData = activeTab === 'bookmark'
        ? mockData.filter(d => d.bookmarked)
        : mockData;

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
                {displayData.map(item => (
                    <div
                        key={item.id}
                        className="diagnosis-card"
                        onClick={() => activeTab === 'my_diagnosis' && onEdit && onEdit(item)}
                        style={{ cursor: activeTab === 'my_diagnosis' ? 'pointer' : 'default' }}
                    >
                        <div className="card-header">
                            <div className={`type-badge ${item.type}`}>
                                {item.type === 'general' ? '일반인' : '전문가'}
                            </div>
                            <div className="card-date-row">
                                <span className="card-date">{item.date}</span>
                            </div>
                        </div>

                        {/* Main Info Row */}
                        <div className="card-main-info">
                            <div className="card-img">
                                <img src={item.image} alt="site" />
                            </div>
                            <div className="card-text-info">
                                <div className="card-title">{item.title}</div>
                                {item.type === 'general' ? (
                                    <div className="card-score-large">{item.score}</div>
                                ) : (
                                    <div className={`card-result ${item.result}`}>
                                        {item.result === 'suitable' ? '적합' : '부적합'}
                                    </div>
                                )}

                                <div className="card-coords">
                                    <div className="coord-col">
                                        <div className="coord-label">위도</div>
                                        <div className="coord-val">{item.lat}</div>
                                    </div>
                                    <div className="coord-col">
                                        <div className="coord-label">경도</div>
                                        <div className="coord-val">{item.lng}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* General Only: Score Grid */}
                        {item.type === 'general' && (
                            <div className="score-grid">
                                {item.scores.map((s, idx) => (
                                    <div key={idx} className="score-box">
                                        <div className="score-label">{s.label}</div>
                                        <div className="score-val">{s.val}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Divider */}
                        <div className="card-divider"></div>

                        {/* Description */}
                        <div className="card-desc">
                            {item.desc}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyActivity;
