import { useState, useEffect, useRef } from 'react';
import PCMapCanvas from './PCMapCanvas';
import { CAT_STYLES } from './catStyles';
import './MProposalDetail.css';
import './MReportDetail.css';
import { API_URL } from '../utils/api';

const STAGES = [
    { key: 'received', label: '접수' },
    { key: 'review',   label: '검토중' },
    { key: 'inspect',  label: '검토완료' },
    { key: 'notice',   label: '결과안내' },
];

export default function MReportDetail({ onNavigate, report }) {
    const data = {
        title: report?.title || '',
        body: report?.body || report?.description || report?.content || '',
        cat: report?.cat || report?.category || '',
        sub: report?.sub || report?.sub_category || '',
        region: report?.region || '',
        author: report?.author || '',
        authorRegion: report?.authorRegion || '',
        createdAt: report?.createdAt || report?.date || report?.created_at || '',
        date: report?.date || report?.created_at || '',
        views: report?.views ?? 0,
        likes: report?.likes ?? 0,
        comments: report?.comments ?? 0,
        currentStage: report?.currentStage || (report?.progress_step === 4 ? 'notice' : report?.progress_step === 3 ? 'inspect' : report?.progress_step === 2 ? 'review' : 'received'),
        lat: report?.lat || 35.197,
        lng: report?.lng || 129.063,
        result: report?.result || report?.result_details || null,
        imageUrl: report?.image || null,
        resultImageUrl: report?.result_image || report?.result?.image || report?.result_details?.image || null,
        resultComment: report?.result_comment || report?.result?.comment || report?.result?.result_comment || report?.result_details?.manager || '',
    };
    const stageIdx = STAGES.findIndex((s) => s.key === data.currentStage);
    const style = CAT_STYLES[data.cat] || { bg: '#E0F4F1', color: '#2C9A8F' };

    const [comment, setComment] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [liked, setLiked] = useState(() => {
        if (!report?.id) return false;
        try {
            const ids = JSON.parse(localStorage.getItem('likedReportIds') || '[]');
            return ids.includes(report.id);
        } catch { return false; }
    });
    const [likeCount, setLikeCount] = useState(data.likes);
    const [resultOpen, setResultOpen] = useState(false);
    const [comments, setComments] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const commentInputRef = useRef(null);
    const [myId, setMyId] = useState(null);

    // 소유자 판정용 현재 사용자 user_id
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.user_id != null) setMyId(d.user_id); })
            .catch(() => {});
    }, []);

    const myName = (() => { try { return localStorage.getItem('user_name') || localStorage.getItem('username') || ''; } catch { return ''; } })();
    const isOwner = (myId != null && report?.user_id != null)
        ? report.user_id === myId
        : (!!myName && !!data.author && data.author === myName);

    useEffect(() => {
        if (!report?.id) return;
        fetch(`${API_URL}/api/reports/${report.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));

        // 조회수 +1 (본인/관리자/비로그인은 백엔드가 무시)
        const token = localStorage.getItem('access_token');
        if (token) {
            fetch(`${API_URL}/api/reports/${report.id}/view`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
        }
    }, [report?.id]);

    const toggleLike = async () => {
        if (!report?.id) {
            setLiked((prev) => {
                setLikeCount((c) => c + (prev ? -1 : 1));
                return !prev;
            });
            return;
        }
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/reports/${report.id}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const j = await res.json();
                const nextLiked = !!j.liked;
                setLiked(nextLiked);
                setLikeCount(j.likes_count ?? likeCount);
                // sync to localStorage
                try {
                    const ids = new Set(JSON.parse(localStorage.getItem('likedReportIds') || '[]'));
                    if (nextLiked) ids.add(report.id); else ids.delete(report.id);
                    localStorage.setItem('likedReportIds', JSON.stringify([...ids]));
                } catch (_) {}
            }
        } catch (e) {
            console.error(e);
        }
    };

    const submitComment = async () => {
        if (!comment.trim() || !report?.id || commenting) return;
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        setCommenting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/${report.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: comment, parent_id: replyTo?.id ?? null }),
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
            setCommenting(false);
        }
    };

    const handleStageClick = (key) => {
        if (key === 'notice' && stageIdx === STAGES.length - 1) {
            setResultOpen(true);
        }
    };

    return (
        <div className={`m-prop-detail-page m-report-detail-page${data.currentStage !== 'notice' && report?.improvement_status !== '개선완료' ? ' stage-bar-compact' : ''}`}>
            <header className="m-detail-topbar">
                <button className="m-detail-back" onClick={() => onNavigate && onNavigate('mReportList')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="m-rdetail-tags">
                    {data.region && <span className="m-rdetail-region-tag">{data.region}</span>}
                    {data.cat && <span className="m-prop-cat-tag" style={{ background: style.bg, color: style.color }}>{data.cat}</span>}
                    {data.sub && <span className="m-report-sub-tag">{data.sub}</span>}
                </div>
            </header>

            <div className="m-detail-content">
                <div className="m-rdetail-author-block">
                    {data.author && <span className="m-rdetail-author">{data.author}</span>}
                    {(data.authorRegion || data.createdAt) && (
                        <span className="m-rdetail-author-sub">
                            {data.authorRegion}
                            {data.authorRegion && data.createdAt && ' · '}
                            {data.createdAt}
                        </span>
                    )}
                </div>

                <div className="m-rdetail-divider" />
                <h1 className="m-detail-title">{data.title}</h1>

                {data.body && <p className="m-rdetail-body">{data.body}</p>}

                {data.imageUrl ? (
                    <div
                        className="m-detail-image"
                        style={{ backgroundImage: `url(${data.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                ) : null}

                <div className="m-detail-map">
                    <PCMapCanvas
                        pins={[{ id: 'this', lat: data.lat, lng: data.lng, color: '#542aa3', title: data.title }]}
                        accentColor="#542aa3"
                    />
                </div>

                <div className="m-rdetail-stat-row">
                    <span className="m-rdetail-stat-meta">{data.date} · 조회수 {data.views}</span>
                    <span className="m-rdetail-stat-icons">
                        {isOwner ? (
                            /* 본인 글은 좋아요 불가 → 클릭 불가 정적 표시 */
                            <span className="m-rdetail-like-btn" aria-label="좋아요 수" style={{ cursor: 'default' }}>
                                <svg width="16" height="13" viewBox="0 0 15.3587 12.2297" fill="currentColor">
                                    <path d="M9.0568 1.0811C10.4983 -0.360439 12.8359 -0.360292 14.2775 1.0811C15.7191 2.52272 15.7191 4.86019 14.2775 6.30181L8.78141 11.7989C8.47833 12.102 8.07586 12.2441 7.67887 12.2286C7.2822 12.2438 6.88013 12.1017 6.57731 11.7989L1.08121 6.30181C-0.360404 4.86019 -0.360404 2.52272 1.08121 1.0811C2.52285 -0.360296 4.86037 -0.36044 6.30192 1.0811L7.67887 2.45806L9.0568 1.0811Z"/>
                                </svg>
                                {likeCount}
                            </span>
                        ) : (
                            <button
                                type="button"
                                className={`m-rdetail-like-btn ${liked ? 'liked' : ''}`}
                                onClick={toggleLike}
                                aria-pressed={liked}
                                aria-label={liked ? '좋아요 취소' : '좋아요'}
                            >
                                {/* Figma heart icon (Union path) */}
                                <svg width="16" height="13" viewBox="0 0 15.3587 12.2297" fill="currentColor">
                                    <path d="M9.0568 1.0811C10.4983 -0.360439 12.8359 -0.360292 14.2775 1.0811C15.7191 2.52272 15.7191 4.86019 14.2775 6.30181L8.78141 11.7989C8.47833 12.102 8.07586 12.2441 7.67887 12.2286C7.2822 12.2438 6.88013 12.1017 6.57731 11.7989L1.08121 6.30181C-0.360404 4.86019 -0.360404 2.52272 1.08121 1.0811C2.52285 -0.360296 4.86037 -0.36044 6.30192 1.0811L7.67887 2.45806L9.0568 1.0811Z"/>
                                </svg>
                                {likeCount}
                            </button>
                        )}
                        <span>
                            {/* Figma comment bubble icon */}
                            <svg width="14" height="12" viewBox="0 0 14 11.8457" fill="currentColor">
                                <path d="M9.1543 0C11.8305 0.000244114 14 2.1694 14 4.8457C14 7.52201 11.8305 9.69116 9.1543 9.69141H6.5127L3.23047 11.8457V9.41406C1.34871 8.74853 4.44368e-08 6.95541 0 4.8457C0 2.1694 2.16945 0.000244114 4.8457 0H9.1543Z"/>
                            </svg>
                            {comments.length || data.comments}
                        </span>
                    </span>
                </div>

                {replyTo && (
                    <div className="m-comment-reply-bar">
                        <span><strong>{replyTo.author || '익명'}</strong>님에게 답글 작성 중</span>
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
                        className="m-comment-input"
                        disabled={commenting}
                    />
                    <button className="m-comment-send" onClick={submitComment} aria-label="등록" disabled={!comment.trim() || commenting} style={{ opacity: (!comment.trim() || commenting) ? 0.45 : 1 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    </button>
                </div>

                <ul className="m-rdetail-comments">
                    {comments.map((c, i) => (
                        <li key={c.id ?? i}>
                            <div className="m-comment-meta">
                                <strong>{c.author || '익명'}</strong>
                                {c.date && <span>{c.date}</span>}
                            </div>
                            <p className="m-rdetail-comment-content">{c.content}</p>
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
                                                <strong>{r.author || '익명'}</strong>
                                                {r.date && <span>{r.date}</span>}
                                            </div>
                                            <p className="m-rdetail-comment-content">{r.content}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <footer className="m-rdetail-stage-bar">
                <div className="m-rstage-pills-row">
                    {/* Figma: continuous connector line behind pills */}
                    <div className="m-rstage-connector" aria-hidden="true" />
                    {STAGES.map((s, i) => (
                        <button
                            key={s.key}
                            type="button"
                            className={`m-rstage-pill ${i === stageIdx ? 'active' : ''} ${i < stageIdx ? 'done' : ''}`}
                            onClick={() => handleStageClick(s.key)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                {(data.currentStage === 'notice' || report?.improvement_status === '개선완료') && (
                    <button
                        type="button"
                        className="m-rstage-result-btn"
                        onClick={() => setResultOpen(true)}
                    >
                        개선 결과보기
                    </button>
                )}
            </footer>

            {resultOpen && (
                <div className="m-result-backdrop" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setResultOpen(false); }}>
                    <div className="m-result-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="m-result-header">
                            <h3 className="m-result-title">개선 결과보기</h3>
                            <button
                                type="button"
                                className="m-result-close"
                                onClick={() => setResultOpen(false)}
                                aria-label="닫기"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        {data.resultImageUrl ? (
                            <img
                                src={data.resultImageUrl}
                                alt="개선 결과 사진"
                                className="m-result-image m-result-image--actual"
                            />
                        ) : (
                            <div className="m-result-image m-result-image--placeholder">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a0bdd0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                </svg>
                                <span>결과 사진이 없습니다</span>
                            </div>
                        )}
                        <p className="m-result-body">{data.result?.body || data.result?.content || data.result?.detail || '결과가 아직 등록되지 않았습니다.'}</p>
                        <div className="m-result-divider" />
                        <p className="m-result-comment-label">담당자 코멘트</p>
                        {data.resultComment ? (
                            <p className="m-result-comment-content">{data.resultComment}</p>
                        ) : (
                            <p className="m-result-comment-content m-result-comment-content--empty">등록된 코멘트가 없습니다.</p>
                        )}
                        {(data.result?.date || data.result?.result_date) && (
                            <p className="m-result-date">{data.result?.date || data.result?.result_date}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
