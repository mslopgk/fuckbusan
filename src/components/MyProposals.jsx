/* MyProposals.jsx */
import React, { useState, useEffect } from 'react';
import './MyProposals.css';

const MyProposals = ({ onBack, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('mine'); // 'mine' or 'voted'
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    // [중요] 127.0.0.1을 우선 사용하여 주소 충돌 방지
    const VITE_API_URL = import.meta.env.VITE_API_URL || "https://ke7eh3ev2j33nj76skhv6n2tom0yzwim.lambda-url.ap-northeast-2.on.aws";

    useEffect(() => {
        const fetchProposalsData = async () => {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const endpoint = activeTab === 'mine' ? 'my-proposals' : 'voted-proposals';
                const response = await fetch(`${VITE_API_URL}/api/reports/${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setProposals(data || []);
                }
            } catch (error) {
                console.error(`Failed to fetch ${activeTab} proposals:`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchProposalsData();
    }, [VITE_API_URL, activeTab]);

    // 카테고리별 배지 색상 정의
    const getCategoryStyle = (category) => {
        const styles = {
            '주거': { background: '#FFF3E0', color: '#E65100' },
            '환경': { background: '#E8F5E9', color: '#2E7D32' },
            '교육': { background: '#EDE7F6', color: '#4527A0' },
            '안전': { background: '#FCE4EC', color: '#C62828' },
            '산업 및 고용': { background: '#E0F2F1', color: '#00695C' },
            '모빌리티': { background: '#E3F2FD', color: '#1565C0' },
            '문화 및 레저': { background: '#FFF8E1', color: '#F57F17' },
            '보건 및 복지': { background: '#F3E5F5', color: '#7B1FA2' },
        };
        return styles[category] || { background: '#F5F5F5', color: '#616161' };
    };

    // Format date string
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    return (
        <div className="my-proposals-container">
            {/* Header */}
            <header className="mp-header">
                <div className="mp-header-left">
                    <button className="mp-back-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="15" y1="18" x2="9" y2="12"></line>
                            <line x1="9" y1="12" x2="15" y2="6"></line>
                        </svg>
                    </button>
                    <span className="mp-header-title">나의 제안현황</span>
                </div>
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
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>로딩 중...</div>
                ) : proposals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        {activeTab === 'mine' ? '아직 작성한 제안이 없습니다.' : '투표한 제안이 없습니다.'}
                    </div>
                ) : (proposals).map((item) => {
                    
                    // [수정] 이미지 경로 생성 로직 강화
                    let imageUrl = null;
                    if (item.files && item.files.length > 0) {
                        const firstFile = item.files[0];
                        if (firstFile.startsWith('http')) {
                            imageUrl = firstFile;
                        } else if (firstFile.startsWith('/assets/')) {
                            imageUrl = firstFile;
                        } else if (firstFile.startsWith('/uploads/')) {
                            imageUrl = `${VITE_API_URL}${firstFile}`;
                        } else {
                            imageUrl = `${VITE_API_URL}/uploads/${firstFile}`;
                        }
                    }
                    
                    // 디버깅용 로그 (나중에 지워도 됨)
                    if (imageUrl) console.log(`Proposal Image [${item.id}]:`, imageUrl);

                    return (
                        <div 
                            key={item.id} 
                            className="mp-proposal-card"
                            onClick={() => onNavigate('proposalDetail', {
                                ...item,
                                description: item.content,
                                author: item.nickname,
                                date: formatDate(item.created_at),
                                views: item.views_count,
                                likes: item.likes_count,
                                image: imageUrl,
                                isMine: item.is_mine
                            })}
                        >
                            <div className="mp-card-badge" style={getCategoryStyle(item.category)}>
                                {item.category}
                            </div>
                            <h3 className="mp-card-title">{item.title}</h3>
                            <p className="mp-card-author">{item.nickname || '나의 제안'}</p>

                            {imageUrl && (
                                <div className="mp-card-image-wrapper">
                                    <img 
                                        src={imageUrl} 
                                        alt={item.title} 
                                        className="mp-card-image" 
                                        loading="lazy"
                                        onError={(e) => { 
                                            console.warn("Image load failed:", imageUrl);
                                            e.target.style.display='none'; 
                                        }} 
                                    />
                                </div>
                            )}

                            <div className="mp-card-stats">
                                <div className="mp-stat">
                                    <div 
                                        className={`mp-stat-icon-circle ${item.has_voted ? 'active' : ''}`} 
                                    >
                                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span>{item.likes_count}</span>
                                </div>
                                <div className="mp-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#adb5bd" stroke="none">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    <span>0</span>
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
