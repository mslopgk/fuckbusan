/* MyProposals.jsx */
import React, { useState } from 'react';
import './MyProposals.css';

const MyProposals = ({ onBack, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('mine'); // 'mine' or 'voted'

    const myProposals = [
        {
            id: 1,
            category: '주거',
            title: '전봇대 불이 나갔어요',
            author: '동래구 우리디자이너',
            likes: 12,
            comments: 12,
            image: '/assets/proposal_1.png',
            description: '여기 위치보내드립니다\n전봇대가 꺼졌습니다\n빨리 켜주세요',
            date: '2026.01.02',
            views: 333
        },
        {
            id: 2,
            category: '생활',
            title: '골목길 쓰레기 방치',
            author: '서구 보안관',
            likes: 8,
            comments: 5,
            image: '/assets/proposal_2.png',
            description: '집 앞 골목에 쓰레기가 일주일째 방치되어 있습니다.\n악취가 너무 심하니 조치 부탁드립니다.',
            date: '2026.01.05',
            views: 120
        },
        {
            id: 3,
            category: '교통',
            title: '신호등 고장 신고',
            author: '동래구 운전자B',
            likes: 25,
            comments: 10,
            image: '/assets/proposal_3.png',
            description: '사거리 신호등이 깜빡거리기만 하고 바뀌질 않네요.\n교통 체증이 심각하니 확인해주세요.',
            date: '2026.01.07',
            views: 450
        }
    ];

    return (
        <div className="my-proposals-container">
            {/* Header */}
            <header className="mp-header">
                <button className="mp-back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <span className="mp-header-title">나의 제안현황</span>
            </header>

            {/* Tabs */}
            <div className="mp-tabs-container">
                <button 
                    className={`mp-tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mine')}
                >
                    나의 제안글
                </button>
                <button 
                    className={`mp-tab-btn ${activeTab === 'voted' ? 'active' : ''}`}
                    onClick={() => setActiveTab('voted')}
                >
                    투표한 제안
                </button>
            </div>

            {/* Content List */}
            <div className="mp-content">
                {(activeTab === 'mine' ? myProposals : myProposals).map((item) => {
                    const isVotedTab = activeTab === 'voted';
                    const displayLikes = isVotedTab ? item.likes + 1 : item.likes;

                    return (
                        <div 
                            key={item.id} 
                            className="mp-proposal-card"
                            onClick={() => onNavigate('proposalDetail', item)}
                        >
                            <div className={`mp-card-badge ${item.category === '주거' ? 'bg-mint-light' : item.category === '생활' ? 'bg-green-light' : 'bg-pink-light'}`}>
                                {item.category}
                            </div>
                            <h3 className="mp-card-title">{item.title}</h3>
                            <p className="mp-card-author">{item.author}</p>

                            {item.image && (
                                <div className="mp-card-image-wrapper">
                                    <img src={item.image} alt={item.title} className="mp-card-image" />
                                </div>
                            )}

                            <div className="mp-card-stats">
                                <div className="mp-stat">
                                    <div 
                                        className={`mp-stat-icon-circle ${isVotedTab ? 'active' : ''}`} 
                                        style={(item.title === '전봇대 불이 나갔어요' || item.title === '신호등 고장 신고') ? { marginTop: '-2px' } : {}}
                                    >
                                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span>{displayLikes}</span>
                                </div>
                                <div className="mp-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#adb5bd" stroke="none">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    <span>{item.comments}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyProposals;
