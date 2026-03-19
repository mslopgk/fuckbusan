/* ProposalDetail.jsx */
import React, { useState } from 'react';
import './ProposalDetail.css';

const ProposalDetail = ({ proposal, onBack }) => {
    if (!proposal) return null;

    const [hasVoted, setHasVoted] = useState(false);
    const [currentLikes, setCurrentLikes] = useState(proposal.likes || 0);
    const [showVoteModal, setShowVoteModal] = useState(false);

    const handleVote = () => {
        if (!hasVoted) {
            // Start voting process with modal
            setShowVoteModal(true);
            
            // Wait 2 seconds before applying the result and closing modal
            setTimeout(() => {
                setHasVoted(true);
                setCurrentLikes(prev => prev + 1);
                setShowVoteModal(false);
            }, 2000);
        } else {
            // Logic for un-voting (if allowed, user didn't specify modal for this)
            setHasVoted(false);
            setCurrentLikes(prev => prev - 1);
        }
    };

    // Dummy comments for the UI demonstration as seen in the screenshot
    const dummyComments = [
        { id: 1, author: '동래구 우리디자이너', text: '빠른 조치가 필요하네요' },
        { id: 2, author: '동래구 우리디자이너', text: '빠른 조치가 필요하네요' }
    ];

    return (
        <div className="proposal-detail-container">
            {/* Header */}
            <header className="pd-header">
                <button className="pd-back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button 
                    className={`pd-vote-btn ${hasVoted ? 'voted' : ''}`} 
                    onClick={handleVote}
                >
                    <div className="pd-vote-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    {hasVoted ? '투표하였습니다' : '투표하기'}
                </button>
            </header>

            {/* Main Content */}
            <div className="pd-content">
                <div className="pd-category-tag">{proposal.category}</div>
                <h1 className="pd-title">{proposal.title}</h1>
                <p className="pd-author">{proposal.author}</p>
                
                <p className="pd-description" style={{ whiteSpace: 'pre-wrap' }}>
                    {proposal.description}
                </p>

                <div className="pd-main-image-wrapper">
                    <img src={proposal.image} alt="Proposal" className="pd-main-image" />
                    <div className="pd-address-badge">
                        {proposal.region || '전체'} · {proposal.detailedAddress || '부산광역시'}
                    </div>
                </div>

                <div className="pd-stats-row">
                    <div className="pd-stats-left">
                        <span>{proposal.date}</span>
                        <span>•</span>
                        <span>조회수 {proposal.views}</span>
                    </div>
                    <div className="pd-stats-right">
                        <div className="pd-stat-item" style={{ cursor: 'pointer' }} onClick={handleVote}>
                        <div className={`pd-stat-icon-circle ${hasVoted ? 'active' : ''}`}>
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <span>{currentLikes}</span>
                    </div>
                        <div className="pd-stat-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#adb5bd" stroke="none">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>{proposal.comments}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="pd-comments-section">
                {dummyComments.map((comment) => (
                    <div key={comment.id} className="pd-comment-item">
                        <div className="pd-comment-author">{comment.author}</div>
                        <p className="pd-comment-text">{comment.text}</p>
                        <button className="pd-reply-btn">답글쓰기</button>
                    </div>
                ))}
            </div>

            {/* Fixed Bottom Comment Input */}
            <div className="pd-comment-input-panel">
                <div className="pd-comment-input-wrapper">
                    <input 
                        type="text" 
                        className="pd-comment-input" 
                        placeholder="댓글을 입력해주세요"
                    />
                    <button className="pd-comment-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Vote Success Modal */}
            {showVoteModal && (
                <div className="pd-vote-modal-overlay">
                    <div className="pd-vote-modal-box">
                        <div className="pd-vote-success-icon-container">
                            <img src="/Union.svg" alt="Union" className="pd-union-icon" />
                            <img src="/Vector.svg" alt="Vector" className="pd-vector-icon" />
                        </div>
                        <h2 className="pd-vote-modal-text">
                            투표가<br/>완료되었습니다
                        </h2>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProposalDetail;
