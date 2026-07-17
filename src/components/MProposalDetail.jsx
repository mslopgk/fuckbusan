import { useState, useEffect, useRef } from 'react';
import PCMapCanvas from './PCMapCanvas';
import { CAT_STYLES } from './catStyles';
import ImageLightbox from './common/ImageLightbox';
import './MProposalDetail.css';
import { API_URL } from '../utils/api';
import { formatDate } from '../utils/format';

export default function MProposalDetail({ onNavigate, proposal, sourceView }) {
    const data = {
        title: proposal?.title || '',
        cat: proposal?.cat || proposal?.category || '',
        author: proposal?.author || proposal?.nickname || '익명',
        body: proposal?.body || proposal?.content || '',
        date: proposal?.created_at ? formatDate(proposal.created_at) : (proposal?.date || ''),
        lat: proposal?.lat || 35.197,
        lng: proposal?.lng || 129.063,
        imageUrl: proposal?.image || (Array.isArray(proposal?.files) && proposal.files.length > 0 ? proposal.files[0] : null) || null,
    };

    const [comment, setComment] = useState('');
    const [commenting, setCommenting] = useState(false);
    const submittingRef = useRef(false); // 동기 가드: state는 비동기라 연타 시 중복 POST 발생
    const [replyTo, setReplyTo] = useState(null);
    const [lightbox, setLightbox] = useState(false);
    const commentInputRef = useRef(null);
    const [voted, setVoted] = useState(!!proposal?.has_voted);
    const [voting, setVoting] = useState(false);
    const [voteDoneOpen, setVoteDoneOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [comments, setComments] = useState([]);
    const [views, setViews] = useState(proposal?.views ?? proposal?.views_count ?? 0);
    const [votes, setVotes] = useState(proposal?.likes_count ?? proposal?.votes ?? 0);
    const [isMine, setIsMine] = useState(!!(proposal?.is_mine || proposal?.isMine));
    const viewCalled = useRef(false);

    useEffect(() => {
        if (!proposal?.id) return;
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));

        // 리스트에서 넘어온 prop은 has_voted가 없거나 stale할 수 있음 → 상세 API로 동기화
        const token = localStorage.getItem('access_token');
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return;
                setVoted(!!d.has_voted);
                setIsMine(!!d.is_mine);
                if (d.likes_count != null) setVotes(d.likes_count);
                if (d.views_count != null) setViews(d.views_count);
            })
            .catch(() => {});

        if (viewCalled.current) return;
        viewCalled.current = true;
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}/view`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.views_count != null) setViews(d.views_count); })
            .catch(() => {});
    }, [proposal?.id]);

    const submitComment = async () => {
        if (!comment.trim() || !proposal?.id || submittingRef.current) return;
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        submittingRef.current = true;
        setCommenting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: comment, parent_comment_id: replyTo?.id ?? null }),
            });
            if (res.ok) {
                const c = await res.json();
                if (replyTo) {
                    setComments((prev) => prev.map((p) =>
                        p.id === replyTo.id ? { ...p, replies: [...(p.replies || []), c] } : p
                    ));
                } else {
                    setComments((prev) => [...prev, c]);
                }
                setComment('');
                setReplyTo(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            submittingRef.current = false;
            setCommenting(false);
        }
    };

    // 투표 토글 API 호출 → 성공 시 결과(has_voted) 반환, 실패 시 null
    const requestVoteToggle = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return null;
        }
        setVoting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/proposals/${proposal.id}/vote`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const j = await res.json();
                setVoted(!!j.has_voted);
                if (j.likes_count != null) setVotes(j.likes_count);
                return !!j.has_voted;
            }
            if (res.status === 403) {
                let msg = '투표할 수 없습니다.';
                try {
                    const j = await res.json();
                    if (j?.detail) msg = j.detail;
                } catch { /* ignore */ }
                alert(msg);
            } else {
                alert('투표 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
        } catch (e) {
            console.error(e);
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            setVoting(false);
        }
        return null;
    };

    // Figma 제안상세1~4 플로우: 미투표 → 투표 + 완료 모달 / 투표됨 → 취소 확인 모달
    const handleVoteClick = async () => {
        if (voting || !proposal?.id) return;
        if (voted) {
            setCancelOpen(true);
            return;
        }
        const result = await requestVoteToggle();
        if (result === true) {
            setVoteDoneOpen(true);
            setTimeout(() => setVoteDoneOpen(false), 1600);
        }
    };

    const confirmCancelVote = async () => {
        const result = await requestVoteToggle();
        if (result !== null) setCancelOpen(false);
    };

    const style = CAT_STYLES[data.cat] || { bg: '#eee', color: '#555' };

    return (
        <div className="m-prop-detail-page">
            <header className="m-detail-topbar">
                <button className="m-detail-back" onClick={() => onNavigate && onNavigate(sourceView || 'mProposalList')} aria-label="뒤로">
                    <img src="/figma-assets/icons/icon_arrow_back.svg" alt="" width="24" height="24" />
                </button>
            </header>

            <div className="m-detail-content">
                {/* Figma 302:18065 — 태그 y62(뒤로끝 49 + 13), 태그끝(86)→타이틀(99) 13 */}
                <span className="m-detail-cat-tag" style={{ background: style.bg, color: style.color, display: 'inline-flex', marginBottom: 13 }}>{data.cat}</span>
                <h1 className="m-detail-title">{data.title}</h1>
                <p className="m-detail-author">{data.author}</p>

                <div className="m-detail-body">
                    {(data.body || '').split('\n').map((p, i) =>
                        p.trim().startsWith('-') ? (
                            <li key={i}>{p.replace(/^-\s*/, '')}</li>
                        ) : (
                            <p key={i}>{p}</p>
                        )
                    )}
                </div>

                {data.imageUrl && (
                    <div
                        className="m-detail-image"
                        style={{ backgroundImage: `url(${data.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'zoom-in' }}
                        onClick={() => setLightbox(true)}
                    />
                )}

                <div className="m-detail-map">
                    <PCMapCanvas
                        pins={[{ id: 'this', lat: data.lat, lng: data.lng, color: '#f74e7e', title: data.title }]}
                        accentColor="#f74e7e"
                    />
                </div>
                {/* Figma 302:18070 — 첨부 파일명 16/500 #a6a6a6 텍스트 (아이콘 없음) */}
                {(proposal?.files?.length > 0) && (
                    <div className="m-detail-attachment">
                        {proposal.files.map((f, i) => {
                            const name = typeof f === 'string' ? f.split('/').pop() : (f.name || f.url || String(f));
                            return (
                                <div key={i} className="m-detail-attachment-item">
                                    <span>{name}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="m-detail-meta-row">
                    <span className="m-detail-meta-left">{data.date} · 조회수 {views}</span>
                    <span className="m-detail-meta-icons">
                        {/* Figma 302:18077 — 체크 아이콘 12x12 + 카운트. 투표 시 핑크 (302:17920) */}
                        <span style={voted ? { color: '#f74e7e' } : undefined}>
                            <img
                                src={voted ? '/figma-assets/mobile-propose/vote_check_pink.png' : '/figma-assets/icons/icon_vote_check.png'}
                                alt="" width="12" height="12"
                                style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 3, opacity: voted ? 1 : 0.3 }}
                            />
                            {votes}
                        </span>
                        <span>
                            <img src="/figma-assets/icons/icon_comment.svg" alt="" width="14" height="12" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }} />
                            {comments.length}
                        </span>
                    </span>
                </div>

                <div className="m-detail-comments">
                    {replyTo && (
                        <div className="m-comment-reply-bar">
                            <span><strong>{replyTo.nickname || '익명'}</strong>님에게 답글 작성 중</span>
                            <button type="button" aria-label="답글 취소" onClick={() => setReplyTo(null)}>×</button>
                        </div>
                    )}
                    <div className="m-comment-input-row">
                        <input
                            ref={commentInputRef}
                            type="text"
                            placeholder={replyTo ? '답글을 입력해주세요' : '댓글을 입력해주세요'}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !commenting) submitComment(); }}
                            onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300); }}
                            className="m-comment-input"
                            disabled={commenting}
                        />
                        <button className="m-comment-send" onClick={submitComment} aria-label="등록" disabled={!comment.trim() || commenting} style={{ opacity: (!comment.trim() || commenting) ? 0.45 : 1 }}>
                            {/* Figma 302:18060 export — 21x19 종이비행기 */}
                            <img src="/figma-assets/mobile-propose/comment_send.png" alt="" width="21" height="19" />
                        </button>
                    </div>

                    <ul>
                        {comments.map((c, i) => (
                            <li key={c.id ?? i}>
                                <div className="m-comment-meta">
                                    <strong>{c.nickname || c.author || '익명'}</strong>
                                    <span>{c.created_at ? formatDate(c.created_at) : (c.date || '')}</span>
                                </div>
                                <p>{c.content || c.body}</p>
                                <button
                                    type="button"
                                    className="m-comment-reply"
                                    onClick={() => { setReplyTo(c); commentInputRef.current?.focus(); }}
                                >답글쓰기</button>
                                {(c.replies?.length > 0) && (
                                    <ul className="m-comment-replies">
                                        {c.replies.map((r, j) => (
                                            <li key={r.id ?? j}>
                                                <div className="m-comment-meta">
                                                    <strong>{r.nickname || '익명'}</strong>
                                                    <span>{r.created_at ? formatDate(r.created_at) : ''}</span>
                                                </div>
                                                <p>{r.content}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* 본인 글은 투표 불가 → CTA 숨김 */}
            {!isMine && (
                <footer className="m-detail-footer">
                    <button
                        className={`m-vote-cta ${voted ? 'on' : ''}`}
                        type="button"
                        onClick={handleVoteClick}
                        disabled={voting}
                        style={{ opacity: voting ? 0.7 : 1 }}
                    >
                        {voting ? '처리 중...' : voted ? '투표하셨습니다' : '투표하기'}
                    </button>
                </footer>
            )}

            {/* 투표 완료 모달 — Figma 302:18043: 265x244 r30 */}
            {voteDoneOpen && (
                <div className="m-vote-backdrop" onClick={() => setVoteDoneOpen(false)}>
                    <div className="m-vote-modal m-vote-modal--done" onClick={(e) => e.stopPropagation()}>
                        <VoteBallotIcon />
                        <p className="m-vote-modal-title">투표가<br/>완료되었습니다</p>
                    </div>
                </div>
            )}

            {/* 투표 취소 확인 모달 — Figma 302:17960: 303x350 r30 */}
            {cancelOpen && (
                <div className="m-vote-backdrop" onClick={() => setCancelOpen(false)}>
                    <div className="m-vote-modal m-vote-modal--cancel" onClick={(e) => e.stopPropagation()}>
                        <VoteBallotIcon />
                        <p className="m-vote-modal-title">진행한 투표를 취소하시겠습니까?</p>
                        <div className="m-vote-modal-actions">
                            <button type="button" className="m-vote-modal-btn primary" onClick={confirmCancelVote} disabled={voting}>네, 취소할게요</button>
                            <button type="button" className="m-vote-modal-btn ghost" onClick={() => setCancelOpen(false)} disabled={voting}>아니오, 투표할게요</button>
                        </div>
                    </div>
                </div>
            )}

            {lightbox && data.imageUrl && (
                <ImageLightbox
                    images={data.imageUrl}
                    alt="제안 사진"
                    onClose={() => setLightbox(false)}
                />
            )}
        </div>
    );
}

// 문서 + 핑크 체크 아이콘 — Figma 302:17967 export (81x81)
function VoteBallotIcon() {
    return (
        <img src="/figma-assets/mobile-propose/vote_ballot.png" alt="" width="81" height="81" aria-hidden="true" />
    );
}
