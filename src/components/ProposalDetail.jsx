/* ProposalDetail.jsx */
import React, { useState, useEffect } from 'react';
import './ProposalDetail.css';

const ProposalDetail = ({ proposal, onBack, onNavigate }) => {
    if (!proposal) return null;

    const [hasVoted, setHasVoted] = useState(proposal.has_voted || false);
    const [currentLikes, setCurrentLikes] = useState(proposal.likes_count || proposal.likes || 0);
    const [currentViews, setCurrentViews] = useState(proposal.views_count || proposal.views || 0);
    const [showVoteModal, setShowVoteModal] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // [추가] 메뉴 모달 상태
    const [showDeleteModal, setShowDeleteModal] = useState(false); // [추가] 삭제 확인 모달 상태

    const isMine = proposal.is_mine === true || proposal.isMine === true;

    // [중요] 127.0.0.1을 우선 사용하여 주소 충돌 방지
    const VITE_API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

    // [조회수] 상세 페이지 진입 시 조회수 증가 API 호출 (본인 글 제외, 중복 방지)
    useEffect(() => {
        const incrementView = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return; // 비로그인은 무시
            try {
                const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${proposal.id}/view`, {
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
    }, [proposal.id]);

    const handleVote = async () => {
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
            const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${proposal.id}/vote`, {
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
    
    // 이미지 경로 처리
    let imageUrl = proposal.image;
    if (proposal.files && proposal.files.length > 0 && (!imageUrl || imageUrl.includes('localhost:8501'))) {
        const firstFile = proposal.files[0];
        if (firstFile.startsWith('http')) {
            imageUrl = firstFile;
        } else if (firstFile.startsWith('/uploads/')) {
            imageUrl = `${VITE_API_URL}${firstFile}`;
        } else {
            imageUrl = `${VITE_API_URL}/uploads/${firstFile}`;
        }
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
                
                {isMine ? (
                    <button className="pd-more-btn" onClick={() => setIsMenuOpen(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="5" r="2" fill="currentColor"/>
                            <circle cx="12" cy="12" r="2" fill="currentColor"/>
                            <circle cx="12" cy="19" r="2" fill="currentColor"/>
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
                <div className="pd-category-tag" style={(() => {
                    const styles = {
                        '주거': { background: '#FFF3E0', color: '#E65100' },
                        '생활': { background: '#E8F5E9', color: '#2E7D32' },
                        '교통': { background: '#E3F2FD', color: '#1565C0' },
                        '안전': { background: '#FCE4EC', color: '#C62828' },
                        '교육': { background: '#EDE7F6', color: '#4527A0' },
                        '산업일자리': { background: '#E0F2F1', color: '#00695C' },
                        '문화여가': { background: '#FFF8E1', color: '#F57F17' },
                    };
                    return styles[proposal.category] || { background: '#F5F5F5', color: '#616161' };
                })()}>{proposal.category}</div>
                <h1 className="pd-title">{proposal.title}</h1>
                <p className="pd-author">{proposal.nickname || proposal.author || '작성자 정보 없음'}</p>
                
                <p className="pd-description" style={{ whiteSpace: 'pre-wrap' }}>
                    {proposal.description || proposal.content}
                </p>

                {imageUrl && (
                    <div className="pd-main-image-wrapper">
                        <img 
                            src={imageUrl} 
                            alt="Proposal" 
                            className="pd-main-image" 
                            onError={(e) => { 
                                console.warn("Detail image load failed:", imageUrl);
                                e.target.style.display='none'; 
                            }}
                        />
                        <div className="pd-address-badge">
                            {proposal.region || '전체'} · {proposal.detailed_address || proposal.detailedAddress || ''}
                        </div>
                    </div>
                )}

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
                            <span>{proposal.comments || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pd-comments-section">
                <div className="pd-comment-item" style={{ opacity: 0.7 }}>
                    <div className="pd-comment-author">동래구 우리디자이너</div>
                    <p className="pd-comment-text">빠른 조치가 필요하네요 (데모 데이터)</p>
                    <button className="pd-reply-btn">답글쓰기</button>
                </div>
            </div>

            <div className="pd-comment-input-panel">
                <div className="pd-comment-input-wrapper">
                    <input 
                        type="text" 
                        className="pd-comment-input" 
                        placeholder="댓글을 입력해주세요 (기능은 추후 연동 예정)"
                    />
                    <button className="pd-comment-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            투표가<br/>완료되었습니다
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
                                try {
                                    const token = localStorage.getItem('access_token');
                                    const response = await fetch(`${VITE_API_URL}/api/reports/proposals/${proposal.id}`, {
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
