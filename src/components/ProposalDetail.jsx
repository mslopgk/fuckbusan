/* ProposalDetail.jsx */
import React, { useState } from 'react';
import './ProposalDetail.css';

const ProposalDetail = ({ proposal, onBack }) => {
    if (!proposal) return null;

    const [hasVoted, setHasVoted] = useState(false);
    const [currentLikes, setCurrentLikes] = useState(proposal.likes || 0);

    const handleVote = () => {
        if (!hasVoted) {
            setHasVoted(true);
            setCurrentLikes(prev => prev + 1);
        } else {
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
                    투표하기
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
                </div>

                <div className="pd-stats-row">
                    <div className="pd-stats-left">
                        <span>{proposal.date}</span>
                        <span>•</span>
                        <span>조회수 {proposal.views}</span>
                    </div>
                    <div className="pd-stats-right">
                        <div className={`pd-stat-item ${hasVoted ? 'active-heart' : ''}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={hasVoted ? "#ff4d4f" : "none"} stroke={hasVoted ? "#ff4d4f" : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span style={{ color: hasVoted ? '#ff4d4f' : '#bbb' }}>{currentLikes}</span>
                        </div>
                        <div className="pd-stat-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                </div>
            </div>
        </div>
    );
};

export default ProposalDetail;
