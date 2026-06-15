/* PCMyProposalDetail.jsx — Figma 215:2205(나의제안글보기), 215:2829(수정), 215:2886(삭제), 215:2659(완료>나의제안) */
import { useEffect, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import { CAT_STYLES } from './catStyles';
import './PCDetailShared.css';
import './PCMyProposalDetail.css';
import { API_URL } from '../utils/api';
import { formatDate } from '../utils/format';

/* 제안 진행 상태 — 수정 화면에서 보이는 배지 */
const STATUS_MAP = {
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
            .then(r => (r.ok ? r.json() : null))
            .then(d => {
                if (!d) return;
                setDetail(d);
                setLikeCount(d.likes_count ?? d.likes ?? 0);
                setLiked(!!(d.has_voted || d.liked));
            })
            .catch(() => {});

        fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`)
            .then(r => (r.ok ? r.json() : []))
            .then(rows => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));
    }, [proposal?.id]);

    const catKey = (detail?.category || detail?.cat || '').replace('및 ', '·').replace(' 및 ', '·').trim();
    const catStyle = CAT_STYLES[catKey] || CAT_STYLES[detail?.category] || { bg: '#eee', color: '#555' };

    const statusRaw = detail?.status
        || PROGRESS_TO_STATUS[detail?.progress_step]
        || detail?.currentStage
        || '접수';
    const statusLabel = STATUS_MAP[statusRaw] || statusRaw;

    const data = {
        id: detail?.id,
        title: detail?.title || '',
        author: detail?.nickname || detail?.author || '',
        region: detail?.region || '',
        cat: detail?.category || detail?.cat || '',
        sub: detail?.sub_category || detail?.sub || '',
        date: detail?.created_at ? formatDate(detail.created_at) : (detail?.date || ''),
        views: detail?.views_count ?? detail?.views ?? 0,
        likes: likeCount,
        body: detail?.content || detail?.body || '',
        lat: detail?.lat ?? 35.1631,
        lng: detail?.lng ?? 129.1638,
        image: detail?.image,
        isMine: detail?.is_mine ?? proposal?.isMine ?? true,
    };

    const submitComment = async () => {
        if (!comment.trim() || !proposal?.id) return;
        const token = localStorage.getItem('access_token');
        if (!token) { alert('로그인이 필요합니다.'); return; }
        try {
            const res = await fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: comment.trim() }),
            });
            if (res.ok) {
                const created = await res.json();
                setComments(prev => [...prev, created]);
                setComment('');
            }
        } catch (e) { console.error('comment failed', e); }
    };

    const toggleLike = async () => {
        if (!proposal?.id) { setLiked(v => !v); return; }
        const token = localStorage.getItem('access_token');
        if (!token) { alert('로그인이 필요합니다.'); return; }
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
        } catch (e) { console.error('like failed', e); }
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
            <div className="pcmpd-page">
                <div className="pcmpd-inner">

                    {/* 태그 + 상태 배지 */}
                    <div className="pcmpd-header-row">
                        <div className="pcmpd-tags">
                            {data.region && (
                                <span className="pcmpd-tag pcmpd-tag--region">{data.region}</span>
                            )}
                            {data.cat && (
                                <span
                                    className="pcmpd-tag pcmpd-tag--cat"
                                    style={{ background: catStyle.bg, color: catStyle.color }}
                                >{data.cat}</span>
                            )}
                            {data.sub && (
                                <span className="pcmpd-tag pcmpd-tag--sub">{data.sub}</span>
                            )}
                        </div>
                        <span className="pcmpd-status-badge">{statusLabel}</span>
                    </div>

                    {/* 제목 */}
                    <h2 className="pcmpd-title">{data.title || '(제목 없음)'}</h2>

                    {/* 메타 */}
                    <div className="pcmpd-meta-row">
                        <span className="pcmpd-author">{data.author}</span>
                        <span className="pcmpd-meta-right">
                            {data.date}{data.views ? ` · 조회수 ${data.views}` : ''}
                        </span>
                    </div>

                    {/* 이미지 */}
                    {data.image ? (
                        <img
                            className="pcmpd-image"
                            src={data.image}
                            alt={data.title}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                    ) : (
                        <div className="pcmpd-image pcmpd-image--empty" />
                    )}

                    {/* 지도 */}
                    <div className="pcmpd-map">
                        <PCMapCanvas
                            pins={[{ id: 'this', lat: data.lat, lng: data.lng, color: '#f74e7e', title: data.title }]}
                            accentColor="#f74e7e"
                            initialCenter={{ lat: data.lat, lng: data.lng }}
                            initialLevel={4}
                        />
                    </div>

                    {/* 본문 + 투표 버튼 */}
                    <div className="pcmpd-body-wrap">
                        <div className="pcmpd-body">
                            {data.body
                                ? data.body.split('\n').map((line, i) =>
                                    line.trim().startsWith('-')
                                        ? <li key={i}>{line.replace(/^-\s*/, '')}</li>
                                        : <p key={i}>{line}</p>
                                )
                                : <p style={{ color: '#999' }}>본문이 없습니다.</p>
                            }
                        </div>
                        <button
                            className={`pcmpd-vote-btn${liked ? ' on' : ''}`}
                            onClick={toggleLike}
                            type="button"
                            aria-label={liked ? '투표 취소' : '투표하기'}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? '#f74e7e' : 'none'} stroke="#f74e7e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span>{data.likes}</span>
                            <span className="pcmpd-vote-label">투표</span>
                        </button>
                    </div>

                    {/* 삭제/수정 버튼 (내 글일 때만) */}
                    {data.isMine && (
                        <div className="pcmpd-actions">
                            <button
                                type="button"
                                className="pcmpd-btn pcmpd-btn--ghost"
                                onClick={() => setShowDelete(true)}
                            >삭제하기</button>
                            <button
                                type="button"
                                className="pcmpd-btn pcmpd-btn--primary"
                                onClick={() => onEdit ? onEdit(detail) : (onNavigate && onNavigate('proposalForm', detail))}
                            >수정하기</button>
                        </div>
                    )}

                    <div className="pcmpd-divider" />

                    {/* 댓글 */}
                    <div className="pcmpd-comments">
                        <p className="pcmpd-comment-count">댓글 {comments.length}개</p>
                        <div className="pcmpd-comment-input-row">
                            <input
                                type="text"
                                placeholder="댓글을 입력해주세요"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
                                className="pcmpd-comment-input"
                            />
                            <button className="pcmpd-comment-send" onClick={submitComment} type="button" aria-label="댓글 전송">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                </svg>
                            </button>
                        </div>

                        <ul className="pcmpd-comment-list">
                            {comments.length === 0 ? (
                                <li className="pcmpd-comment-empty">아직 댓글이 없습니다.</li>
                            ) : comments.map((c, i) => (
                                <li key={c.id || i} className="pcmpd-comment-item">
                                    <div className="pcmpd-comment-meta">
                                        <strong>@{c.nickname || c.author || '익명'}</strong>
                                        <span>{c.created_at ? formatDate(c.created_at) : (c.date || '')}</span>
                                    </div>
                                    <p className="pcmpd-comment-body">{c.content}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 목록으로 */}
                    <div className="pcmpd-bottom-nav">
                        <button
                            className="pcmpd-back-to-list"
                            onClick={() => onNavigate && onNavigate('myProposals')}
                            type="button"
                        >← 목록으로</button>
                    </div>
                </div>

                {/* 삭제 확인 모달 */}
                {showDelete && (
                    <div
                        className="pcmpd-modal-backdrop"
                        onClick={() => !deleting && setShowDelete(false)}
                    >
                        <div
                            className="pcmpd-delete-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* 쓰레기통 아이콘 */}
                            <div className="pcmpd-delete-icon-wrap">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                    <path d="M10 11v6M14 11v6" />
                                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                            </div>
                            <p className="pcmpd-delete-title">제안글을 삭제하시겠습니까?</p>
                            {deleteError && <p className="pcmpd-delete-error">{deleteError}</p>}
                            <div className="pcmpd-delete-actions">
                                <button
                                    type="button"
                                    className="pcmpd-delete-btn pcmpd-delete-btn--yes"
                                    disabled={deleting}
                                    onClick={handleDelete}
                                >{deleting ? '삭제 중…' : '예'}</button>
                                <button
                                    type="button"
                                    className="pcmpd-delete-btn pcmpd-delete-btn--no"
                                    disabled={deleting}
                                    onClick={() => setShowDelete(false)}
                                >아니요</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </UserPCLayout>
    );
}
