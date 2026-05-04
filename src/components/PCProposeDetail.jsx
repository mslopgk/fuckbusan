import { useEffect, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import './PCDetailShared.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const CATEGORY_KEYS = {
    '주거': 'housing', '환경': 'env', '교통': 'traffic', '안전': 'safety',
    '교육': 'edu', '산업·일자리': 'work', '문화·여가': 'culture', '보건·복지': 'health',
};

export default function PCProposeDetail({ onNavigate, proposal }) {
    const [detail, setDetail] = useState(proposal || null);
    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState('');
    const [voteOpen, setVoteOpen] = useState(false);
    const [voteDoneOpen, setVoteDoneOpen] = useState(false);
    const [voted, setVoted] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        if (!proposal?.id) return;
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return;
                setDetail(d);
                setLikeCount(d.likes_count ?? 0);
                setVoted(!!d.has_voted);
            })
            .catch(() => {});
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));
    }, [proposal?.id]);

    const data = {
        title: detail?.title || '',
        author_id: detail?.nickname || detail?.region || '',
        date: detail?.created_at ? String(detail.created_at).slice(0, 10) : '',
        likes: likeCount,
        category: detail?.category || '',
        categoryKey: CATEGORY_KEYS[detail?.category] || 'traffic',
        body: detail?.content || '',
        lat: detail?.lat ?? 35.1631,
        lng: detail?.lng ?? 129.1638,
    };

    const submitVote = async () => {
        if (!proposal?.id) return;
        const token = localStorage.getItem('access_token');
        // 토큰 없어도 클라 사이드 시뮬: 투표 완료 팝업은 보여줌
        if (token) {
            try {
                const res = await fetch(`${API_URL}/api/reports/proposals/${proposal.id}/vote`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const j = await res.json();
                    setVoted(!!j.has_voted);
                    setLikeCount(j.likes_count ?? likeCount);
                }
            } catch (_) {}
        } else {
            setVoted(true);
            setLikeCount((c) => c + 1);
        }
        setVoteOpen(false);
        setVoteDoneOpen(true);
        // 1.6초 후 자동 닫기
        setTimeout(() => setVoteDoneOpen(false), 1600);
    };

    const submitComment = async () => {
        if (!comment.trim() || !proposal?.id) return;
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: comment.trim() }),
            });
            if (res.ok) {
                const created = await res.json();
                setComments((prev) => [...prev, created]);
                setComment('');
            }
        } catch (e) {
            console.error('comment failed', e);
        }
    };

    return (
        <UserPCLayout currentView="pcProposeDetail" onNavigate={onNavigate}>
            <div className="pc-detail-page">
                <div className="pc-detail-inner">
                    <div className="pc-detail-tags">
                        {data.category && <span className={`pc-cat-tag pc-cat-${data.categoryKey}`}>{data.category}</span>}
                    </div>
                    <h2 className="pc-detail-title">{data.title || '(제목 없음)'}</h2>
                    <div className="pc-detail-meta">
                        <span>{data.date}</span>
                        <span>·</span>
                        <span>{data.author_id}</span>
                        <span>·</span>
                        <span>❤️ {data.likes}</span>
                    </div>

                    <div className="pc-detail-image" />

                    <div className="pc-detail-map">
                        <PCMapCanvas
                            pins={[{ id: 'this', lat: data.lat, lng: data.lng, color: '#E6235A', title: data.title }]}
                            accentColor="#E6235A"
                            initialCenter={{ lat: data.lat, lng: data.lng }}
                            initialLevel={4}
                        />
                    </div>

                    <div className="pc-detail-body-wrap">
                        <div className="pc-detail-body">
                            {data.body ? data.body.split('\n').map((p, i) => p.trim().startsWith('-') ? (
                                <li key={i}>{p.replace(/^-\s*/, '')}</li>
                            ) : (
                                <p key={i}>{p}</p>
                            )) : <p style={{ color: '#999' }}>본문이 없습니다.</p>}
                        </div>
                        <button className={`pc-vote-float ${voted ? 'on' : ''}`} onClick={() => setVoteOpen(true)}>
                            <span className="pc-vote-float-icon">{voted ? '✓' : '🗳'}</span>
                            <span className="pc-vote-float-label">{voted ? '투표완료' : '투표하기'}</span>
                        </button>
                    </div>

                    <div className="pc-comment-section">
                        <div className="pc-comment-input-row">
                            <input
                                type="text"
                                placeholder="댓글을 입력해주세요"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
                                className="pc-comment-input"
                            />
                            <button className="pc-comment-send" onClick={submitComment}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                            </button>
                        </div>

                        <ul className="pc-comment-list">
                            {comments.length === 0 ? (
                                <li style={{ color: '#999', padding: '12px 0' }}>아직 댓글이 없습니다.</li>
                            ) : comments.map((c, i) => (
                                <li key={c.id || i}>
                                    <div className="pc-comment-meta">
                                        <strong>{c.nickname || '익명'}</strong>
                                        <span>{c.created_at ? String(c.created_at).slice(0, 10) : ''}</span>
                                    </div>
                                    <p>{c.content}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 맨 아래 목록으로 버튼 */}
                    <div className="pc-detail-bottom-actions">
                        <button
                            className="pc-btn-back-to-list"
                            onClick={() => onNavigate && onNavigate('pcProposeMap')}
                        >
                            ← 목록으로
                        </button>
                    </div>
                </div>

                {voteOpen && (
                    <div className="pc-modal-backdrop" onClick={() => setVoteOpen(false)}>
                        <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>이 제안에 투표하시겠습니까?</h3>
                            <p className="pc-vote-modal-text">투표는 한 번만 가능합니다.<br/>여러분의 의견이 정책 반영에 큰 도움이 됩니다.</p>
                            <div className="pc-vote-options">
                                <button className="pc-vote-option pc-vote-yes" onClick={submitVote}>투표하기</button>
                                <button className="pc-vote-option pc-vote-no" onClick={() => setVoteOpen(false)}>취소</button>
                            </div>
                        </div>
                    </div>
                )}

                {voteDoneOpen && (
                    <div className="pc-modal-backdrop pc-vote-done-backdrop">
                        <div className="pc-vote-done-card">
                            <div className="pc-vote-done-icon">
                                <svg width="44" height="44" viewBox="0 0 60 60" fill="none">
                                    <rect x="8" y="6" width="44" height="48" rx="4" fill="#fff" stroke="#E6235A" strokeWidth="2"/>
                                    <rect x="14" y="14" width="32" height="3" rx="1.5" fill="#E6235A" opacity="0.4"/>
                                    <path d="M20 32l6 6 14-16" stroke="#E6235A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </svg>
                            </div>
                            <p className="pc-vote-done-text">투표가<br/>완료되었습니다</p>
                        </div>
                    </div>
                )}
            </div>
        </UserPCLayout>
    );
}
