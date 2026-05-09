import { useEffect, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import { MY_CAT_STYLES as CAT_STYLES } from './catStyles';
import './PCDetailShared.css';
import './PCFormShared.css';
import './PCMyProposalDetail.css';
import { API_URL } from '../utils/api';


const STATUS_LABELS = {
    received: '접수',
    review: '검토중',
    inspect: '검토완료',
    notice: '결과안내',
    개선예정: '개선예정',
    개선중: '개선중',
    개선완료: '개선완료',
};

const PROGRESS_TO_STATUS = {
    1: '개선예정',
    2: '개선중',
    3: '개선중',
    4: '개선완료',
};

export default function PCMyProposalDetail({ onNavigate, proposal, onDelete, onEdit }) {
    const [detail, setDetail] = useState(proposal || null);
    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState('');
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (!proposal?.id) return;
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return;
                setDetail(d);
                setLikeCount(d.likes_count ?? d.likes ?? 0);
                setLiked(!!(d.has_voted || d.liked));
            })
            .catch(() => {});
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));
    }, [proposal?.id]);

    const status = detail?.status
        || PROGRESS_TO_STATUS[detail?.progress_step]
        || STATUS_LABELS[detail?.currentStage]
        || '개선예정';

    const data = {
        id: detail?.id,
        title: detail?.title || '',
        author: detail?.nickname || detail?.author || '',
        region: detail?.region || '',
        cat: detail?.category || detail?.cat || '',
        sub: detail?.sub_category || detail?.sub || '',
        date: detail?.created_at ? String(detail.created_at).slice(0, 10) : (detail?.date || ''),
        views: detail?.views_count ?? detail?.views ?? 0,
        likes: likeCount,
        body: detail?.content || detail?.body || '',
        lat: detail?.lat ?? 35.1631,
        lng: detail?.lng ?? 129.1638,
        image: detail?.image,
    };
    const catStyle = CAT_STYLES[data.cat] || { bg: '#E0F4F1', color: '#2C9A8F' };

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

    const toggleLike = async () => {
        if (!proposal?.id) {
            setLiked((v) => !v);
            return;
        }
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/reports/proposals/${proposal.id}/vote`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const j = await res.json();
                setLiked(!!j.has_voted);
                setLikeCount(j.likes_count ?? likeCount);
            }
        } catch (e) {
            console.error('like failed', e);
        }
    };

    const handleDelete = async () => {
        if (deleting) return;
        setDeleteError('');
        const token = localStorage.getItem('access_token');
        if (!data.id || !token) {
            setShowDelete(false);
            if (onDelete) onDelete(data.id);
            if (onNavigate) onNavigate('myProposals');
            return;
        }
        setDeleting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/proposals/${data.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 404) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.detail || `삭제 실패 (${res.status})`);
            }
            setShowDelete(false);
            if (onDelete) onDelete(data.id);
            if (onNavigate) onNavigate('myProposals');
        } catch (e) {
            setDeleteError(e.message || '삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <UserPCLayout currentView="pcMyProposalDetail" onNavigate={onNavigate}>
            <div className="pc-detail-page pc-myprop-detail-page">
                <div className="pc-detail-inner">
                    <div className="pc-myprop-header-row">
                        <div className="pc-detail-tags">
                            {data.region && <span className="pc-myprop-region-tag">{data.region}</span>}
                            {data.cat && <span className="pc-myprop-cat-tag" style={{ background: catStyle.bg, color: catStyle.color }}>{data.cat}</span>}
                            {data.sub && <span className="pc-myprop-sub-tag">{data.sub}</span>}
                        </div>
                        <span className="pc-myprop-status-badge">{STATUS_LABELS[status] || status}</span>
                    </div>

                    <h2 className="pc-detail-title">{data.title || '(제목 없음)'}</h2>
                    <div className="pc-myprop-meta-row">
                        <span className="pc-myprop-author">{data.author}</span>
                        <span className="pc-myprop-meta-right">{data.date}{data.views ? ` · 조회수 ${data.views}` : ''}</span>
                    </div>

                    {data.image ? (
                        <img className="pc-detail-image" src={data.image} alt={data.title} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                        <div className="pc-detail-image" />
                    )}

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
                        <button
                            className={`pc-myprop-like-float ${liked ? 'on' : ''}`}
                            onClick={toggleLike}
                            type="button"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? '#E6235A' : 'none'} stroke="#E6235A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>좋아요</span>
                        </button>
                    </div>

                    <div className="pc-myprop-actions">
                        <button
                            type="button"
                            className="pc-myprop-btn ghost"
                            onClick={() => setShowDelete(true)}
                        >삭제하기</button>
                        <button
                            type="button"
                            className="pc-myprop-btn primary"
                            onClick={() => onEdit ? onEdit(detail) : (onNavigate && onNavigate('proposalForm', detail))}
                        >수정하기</button>
                    </div>

                    <div className="pc-myprop-divider" />

                    <div className="pc-comment-section pc-myprop-comments">
                        <p className="pc-myprop-comment-count">댓글 {comments.length}개</p>
                        <div className="pc-comment-input-row">
                            <input
                                type="text"
                                placeholder="댓글을 입력해주세요"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
                                className="pc-comment-input"
                            />
                            <button className="pc-comment-send" onClick={submitComment} type="button">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                            </button>
                        </div>

                        <ul className="pc-comment-list">
                            {comments.length === 0 ? (
                                <li style={{ color: '#999', padding: '12px 0' }}>아직 댓글이 없습니다.</li>
                            ) : comments.map((c, i) => (
                                <li key={c.id || i}>
                                    <div className="pc-comment-meta">
                                        <strong>@{c.nickname || c.author || '익명'}</strong>
                                        <span>{c.created_at ? String(c.created_at).slice(0, 10) : (c.date || '')}</span>
                                    </div>
                                    <p>{c.content}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pc-detail-bottom-actions">
                        <button
                            className="pc-btn-back-to-list"
                            onClick={() => onNavigate && onNavigate('myProposals')}
                            type="button"
                        >
                            ← 목록으로
                        </button>
                    </div>
                </div>

                {showDelete && (
                    <div className="pc-modal-backdrop" onClick={() => !deleting && setShowDelete(false)}>
                        <div className="pc-myprop-delete-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="pc-myprop-delete-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </div>
                            <p className="pc-myprop-delete-title">제안글을 삭제하시겠습니까?</p>
                            {deleteError && <p className="pc-myprop-delete-error">{deleteError}</p>}
                            <div className="pc-myprop-delete-actions">
                                <button type="button" className="pc-myprop-delete-btn yes" disabled={deleting} onClick={handleDelete}>
                                    {deleting ? '삭제 중…' : '예'}
                                </button>
                                <button type="button" className="pc-myprop-delete-btn no" disabled={deleting} onClick={() => setShowDelete(false)}>
                                    아니요
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </UserPCLayout>
    );
}
