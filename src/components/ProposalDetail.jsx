/* ProposalDetail.jsx */
import React, { useState, useEffect } from 'react';
import './ProposalDetail.css';

const ProposalDetail = ({ proposal, onBack, onNavigate }) => {
    const safeProposal = proposal || {};

    const [hasVoted, setHasVoted] = useState(safeProposal.has_voted || false);
    const [currentLikes, setCurrentLikes] = useState(safeProposal.likes_count || safeProposal.likes || 0);
    const [currentViews, setCurrentViews] = useState(safeProposal.views_count || safeProposal.views || 0);
    const [showVoteModal, setShowVoteModal] = useState(false);

    // UI Modal States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Comment States
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    const isMine = safeProposal.is_mine === true || safeProposal.isMine === true;

    // [중요] 127.0.0.1을 우선 사용하여 주소 충돌 방지
    const rawApiUrl = import.meta.env.VITE_API_URL || "https://ke7eh3ev2j33nj76skhv6n2tom0yzwim.lambda-url.ap-northeast-2.on.aws";
    const VITE_API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

    useEffect(() => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.sub);
            }
        } catch (e) {
            console.error("Token parse error", e);
        }
    }, []);

    useEffect(() => {
        const incrementView = async () => {
            if (!safeProposal.id) return;
            const token = localStorage.getItem('access_token');
            if (!token) return; // 비로그인은 무시
            try {
                const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${safeProposal.id}/view`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    setCurrentViews(result.views_count);
                }
            } catch (error) {
                console.error('View increment error:', error);
            }
        };
        incrementView();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeProposal.id]);

    const fetchComments = async () => {
        if (!safeProposal.id) return;
        try {
            const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${safeProposal.id}/comments`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setComments(data);
                } else if (data && Array.isArray(data.comments)) {
                    setComments(data.comments);
                } else {
                    setComments([]);
                    console.warn("Expected comments array, but received:", data);
                }
            } else {
                setComments([]);
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
            setComments([]);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [safeProposal.id]);

    const handleDeleteComment = async (commentId) => {
        if (!safeProposal.id) return;
        if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${safeProposal.id}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setOpenCommentMenuId(null);
                fetchComments();
            } else {
                alert("댓글 삭제에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const startEditComment = (comment) => {
        setOpenCommentMenuId(null);
        setReplyingTo(null);
        setEditingCommentId(comment.id);
        setNewComment(comment.content);
    };

    const handleAddComment = async (parentId = null, contentStr) => {
        if (!safeProposal.id) return;
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }
        if (!contentStr.trim()) return;

        try {
            if (editingCommentId) {
                // Edit existing
                const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${safeProposal.id}/comments/${editingCommentId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content: contentStr })
                });
                if (response.ok) {
                    setEditingCommentId(null);
                    setNewComment("");
                    fetchComments();
                }
            } else {
                // Create new
                const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${safeProposal.id}/comments`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: contentStr,
                        parent_comment_id: parentId
                    })
                });
                if (response.ok) {
                    if (parentId) {
                        setReplyingTo(null);
                    }
                    setNewComment("");
                    fetchComments();
                }
            }
        } catch (error) {
            console.error("Comment submit error", error);
        }
    };

    const renderComments = (commentList) => {
        if (!Array.isArray(commentList)) return null;
        return commentList.map(comment => (
            <div key={comment.id} className={`pd-comment-item ${comment.parent_comment_id ? 'is-reply' : ''}`}>
                <div className="pd-comment-header">
                    <div className="pd-comment-author">
                        {comment.nickname}
                        <span className="pd-comment-date" style={{ fontSize: '0.8rem', color: '#999', fontWeight: 'normal', marginLeft: '8px' }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    {(comment.user_id === currentUserId || currentUserId === 'admin') && (
                        <div className="pd-comment-actions">
                            <button className="pd-comment-more-btn" onClick={() => setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="5" r="2" fill="#aaa" />
                                    <circle cx="12" cy="12" r="2" fill="#aaa" />
                                    <circle cx="12" cy="19" r="2" fill="#aaa" />
                                </svg>
                            </button>
                            {openCommentMenuId === comment.id && (
                                <div className="pd-comment-dropdown">
                                    <button onClick={() => startEditComment(comment)}>수정하기</button>
                                    <button className="danger" onClick={() => handleDeleteComment(comment.id)}>삭제하기</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <p className="pd-comment-text">{comment.content}</p>
                {!comment.parent_comment_id && (
                    <button className="pd-reply-btn" onClick={() => {
                        setEditingCommentId(null);
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    }}>
                        {replyingTo === comment.id ? '답글취소' : '답글쓰기'}
                    </button>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="pd-comment-replies">
                        {renderComments(comment.replies)}
                    </div>
                )}
            </div>
        ));
    };

    const handleVote = async () => {
        if (!safeProposal.id) return;
        if (isMine) {
            alert("본인의 제안에는 투표할 수 없습니다.");
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            alert("로그인이 필요한 기능입니다.");
            return;
        }

        try {
            const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${safeProposal.id}/vote`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                const nowVoted = result.has_voted;

                setHasVoted(nowVoted);
                setCurrentLikes(result.likes_count);

                if (nowVoted) {
                    setShowVoteModal(true);
                    setTimeout(() => setShowVoteModal(false), 2000);
                }
            } else {
                const errorData = await response.json();
                alert(errorData.detail || "투표 처리에 실패했습니다.");
            }
        } catch (error) {
            console.error("Vote error:", error);
            alert("서버 통신 오류가 발생했습니다.");
        }
    };

    let imageUrl = safeProposal.image;
    if (safeProposal.files && safeProposal.files.length > 0 && (!imageUrl || imageUrl.includes('localhost:8501'))) {
        const firstFile = safeProposal.files[0];
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

    if (!proposal) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', backgroundColor: '#f9f9f9' }}>
                <p style={{ fontSize: '1.2rem', color: '#555', fontWeight: 'bold' }}>제안 데이터를 불러올 수 없습니다.</p>
                <button
                    onClick={onBack}
                    style={{ padding: '10px 20px', backgroundColor: '#16B5B0', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    홈으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="proposal-detail-container">
            {/* Header */}
            <header className="pd-header">
                <div className="pd-header-left">
                    <button className="pd-back-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="15" y1="18" x2="9" y2="12"></line>
                            <line x1="9" y1="12" x2="15" y2="6"></line>
                        </svg>
                    </button>
                </div>

                {(isMine || currentUserId === 'admin') ? (
                    <button className="pd-more-btn" onClick={() => setIsMenuOpen(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="5" r="2" fill="currentColor" />
                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                            <circle cx="12" cy="19" r="2" fill="currentColor" />
                        </svg>
                    </button>
                ) : (
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
                )}
            </header>

            {/* Main Content */}
            <div className="pd-content">
                {/* PC 전용 플로팅 투표 버튼 */}
                {!isMine && (
                    <div className="pd-pc-vote-float">
                        <button
                            className={`pd-pc-vote-circle ${hasVoted ? 'voted' : ''}`}
                            onClick={handleVote}
                        >
                            <div className="pd-pc-vote-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <span className="pd-pc-vote-count">{currentLikes}</span>
                            <span className="pd-pc-vote-label">{hasVoted ? '투표완료' : '투표하기'}</span>
                        </button>
                    </div>
                )}

                {/* 태그 행: 지역 + 카테고리 */}
                <div className="pd-tags-row">
                    {proposal.region && (
                        <span className="pd-region-pill">{proposal.region}</span>
                    )}
                    <div className="pd-category-tag" style={(() => {
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
                        return styles[proposal.category] || { background: '#F5F5F5', color: '#616161' };
                    })()}>{proposal.category}</div>
                </div>

                <h1 className="pd-title">{proposal.title}</h1>
                {/* 모바일 작성자 */}
                <p className="pd-author">{proposal.nickname || proposal.author || '작성자 정보 없음'}</p>

                {/* PC 작성자 + 메타 정보 행 */}
                <div className="pd-meta-row">
                    <span className="pd-author-text">{proposal.nickname || proposal.author || '작성자 정보 없음'}</span>
                    <div className="pd-meta-right">
                        <span>{proposal.date}</span>
                        <span>·</span>
                        <span>조회수 {currentViews}</span>
                    </div>
                </div>

                {/* PC 구분선 */}
                <div className="pd-divider"></div>

                {safeProposal.files && safeProposal.files.length > 0 ? (
                    <div className="pd-main-image-wrapper pd-order-image">
                        {safeProposal.files.map((file, idx) => {
                            let src = file;
                            if (!file.startsWith('http') && !file.startsWith('/assets/')) {
                                src = file.startsWith('/uploads/') ? `${VITE_API_URL}${file}` : `${VITE_API_URL}/uploads/${file}`;
                            }
                            return (
                                <img
                                    key={idx}
                                    src={src}
                                    alt={`Proposal ${idx + 1}`}
                                    className="pd-main-image"
                                    loading="lazy"
                                    style={{ marginBottom: idx < safeProposal.files.length - 1 ? '8px' : '0' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            );
                        })}
                        <div className="pd-address-badge">
                            {proposal.region || '전체'} · {proposal.detailed_address || proposal.detailedAddress || ''}
                        </div>
                    </div>
                ) : imageUrl ? (
                    <div className="pd-main-image-wrapper pd-order-image">
                        <img
                            src={imageUrl}
                            alt="Proposal"
                            className="pd-main-image"
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="pd-address-badge">
                            {proposal.region || '전체'} · {proposal.detailed_address || proposal.detailedAddress || ''}
                        </div>
                    </div>
                ) : null}

                <p className="pd-description pd-order-desc" style={{ whiteSpace: 'pre-wrap' }}>
                    {proposal.description || proposal.content}
                </p>

                <div className="pd-stats-row">
                    <div className="pd-stats-left">
                        <span>{proposal.date}</span>
                        <span>•</span>
                        <span>조회수 {currentViews}</span>
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
                            <span>{comments.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pd-comments-section">
                {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', margin: '20px 0' }}>아직 댓글이 없습니다. 첫 댓글을 남겨주세요!</div>
                ) : (
                    renderComments(comments)
                )}
            </div>

            <div className="pd-comment-input-panel">
                {(replyingTo || editingCommentId) && (
                    <div style={{ fontSize: '0.85rem', color: '#16B5B0', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                        <span>{editingCommentId ? "댓글을 수정 중입니다..." : "답글을 작성 중입니다..."}</span>
                        <button onClick={() => { setReplyingTo(null); setEditingCommentId(null); setNewComment(""); }} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontWeight: 'bold' }}>✕ 취소</button>
                    </div>
                )}
                <div className="pd-comment-input-wrapper">
                    <input
                        type="text"
                        className="pd-comment-input"
                        placeholder={editingCommentId ? "수정할 내용을 입력해주세요" : (replyingTo ? "답글을 입력해주세요" : "댓글을 입력해주세요")}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(replyingTo, newComment)}
                    />
                    <button className="pd-comment-send-btn" onClick={() => handleAddComment(replyingTo, newComment)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={newComment.trim() ? "#16B5B0" : "#ccc"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>

            {/* [추가] 제안글 관리 메뉴 모달 (바텀 시트) */}
            {isMenuOpen && (
                <div className="pd-modal-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div className="pd-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="pd-sheet-content">
                            <div className="pd-menu-list">
                                <div className="pd-menu-item" onClick={() => {
                                    setIsMenuOpen(false);
                                    onNavigate('proposalForm', { isEdit: true, proposal: proposal });
                                }}>
                                    제안글 수정
                                </div>
                                <div className="pd-menu-item danger" onClick={() => {
                                    setIsMenuOpen(false);
                                    setShowDeleteModal(true);
                                }}>
                                    삭제
                                </div>
                            </div>
                        </div>
                        <div className="pd-sheet-footer">
                            <button className="pd-sheet-close-btn" onClick={() => setIsMenuOpen(false)}>
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vote Success Modal */}
            {showVoteModal && (
                <div className="pd-vote-modal-overlay">
                    <div className="pd-vote-modal-box">
                        <div className="pd-vote-success-icon-container">
                            <img src="/Union.svg" alt="Union" className="pd-union-icon" />
                            <img src="/Vector.svg" alt="Vector" className="pd-vector-icon" />
                        </div>
                        <h2 className="pd-vote-modal-text">
                            투표가<br />완료되었습니다
                        </h2>
                    </div>
                </div>
            )}

            {/* [추가] 삭제 확인 모달 */}
            {showDeleteModal && (
                <div className="pd-delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="pd-delete-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="pd-delete-modal-icon-container">
                            <img src="/removeicon.svg" alt="Remove" className="pd-delete-modal-icon" />
                        </div>
                        <h2 className="pd-delete-modal-title">제안글을 삭제하시겠습니까?</h2>
                        <div className="pd-delete-modal-btns">
                            <button className="pd-delete-btn-yes" onClick={async () => {
                                if (!safeProposal.id) return;
                                try {
                                    const token = localStorage.getItem('access_token');
                                    const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${safeProposal.id}`, {
                                        method: 'DELETE',
                                        headers: {
                                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                        }
                                    });
                                    if (response.ok) {
                                        setShowDeleteModal(false);
                                        onBack();
                                    } else {
                                        alert("삭제에 실패했습니다.");
                                    }
                                } catch (error) {
                                    console.error("Delete error:", error);
                                    alert("오류가 발생했습니다.");
                                }
                            }}>
                                네
                            </button>
                            <button className="pd-delete-btn-no" onClick={() => setShowDeleteModal(false)}>
                                아니오
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProposalDetail;
