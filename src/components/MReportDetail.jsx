import { useState, useEffect } from 'react';
import PCMapCanvas from './PCMapCanvas';
import { CAT_STYLES } from './catStyles';
import './MProposalDetail.css';
import './MReportDetail.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

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
        createdAt: report?.createdAt || report?.date || '',
        date: report?.date || '',
        views: report?.views ?? 0,
        likes: report?.likes ?? 0,
        comments: report?.comments ?? 0,
        currentStage: report?.currentStage || (report?.progress_step === 4 ? 'notice' : report?.progress_step === 3 ? 'inspect' : report?.progress_step === 2 ? 'review' : 'received'),
        lat: report?.lat || 35.197,
        lng: report?.lng || 129.063,
        result: report?.result || report?.result_details || null,
        imageUrl: report?.image || null,
        resultImageUrl: report?.result_image || report?.result?.image || null,
        resultComment: report?.result_comment || report?.result?.comment || report?.result?.result_comment || '',
    };
    const stageIdx = STAGES.findIndex((s) => s.key === data.currentStage);
    const style = CAT_STYLES[data.cat] || { bg: '#E0F4F1', color: '#2C9A8F' };

    const [comment, setComment] = useState('');
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(data.likes);
    const [resultOpen, setResultOpen] = useState(false);
    const [comments, setComments] = useState([]);

    useEffect(() => {
        if (!report?.id) return;
        fetch(`${VITE_API_URL}/api/reports/${report.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));
    }, [report?.id]);

    const toggleLike = async () => {
        if (!report?.id) {
            setLiked((prev) => { setLikeCount((c) => c + (prev ? -1 : 1)); return !prev; });
            return;
        }
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const res = await fetch(`${VITE_API_URL}/api/reports/${report.id}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const j = await res.json();
                setLiked(!!j.liked);
                setLikeCount(j.likes_count ?? likeCount);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const submitComment = async () => {
        if (!comment.trim() || !report?.id) return;
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const res = await fetch(`${VITE_API_URL}/api/reports/${report.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: comment }),
            });
            if (res.ok) {
                const c = await res.json();
                setComments((prev) => [...prev, c]);
                setComment('');
            }
        } catch (e) {
            console.error(e);
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
                    <span className="m-rdetail-region-tag">{data.region}</span>
                    <span className="m-prop-cat-tag" style={{ background: style.bg, color: style.color }}>{data.cat}</span>
                    <span className="m-report-sub-tag">{data.sub}</span>
                </div>
            </header>

            <div className="m-detail-content">
                <div className="m-rdetail-author-row">
                    <span className="m-rdetail-author">{data.author}</span>
                    <span>· {data.authorRegion}</span>
                    <span style={{ marginLeft: 'auto' }}>{data.createdAt}</span>
                </div>

                <h1 className="m-detail-title">{data.title}</h1>

                {data.body && <p className="m-rdetail-body">{data.body}</p>}

                <div
                    className="m-detail-image"
                    style={data.imageUrl ? { backgroundImage: `url(${data.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                />

                <div className="m-detail-map">
                    <PCMapCanvas
                        pins={[{ id: 'this', lat: data.lat, lng: data.lng, color: '#E6235A', title: data.title }]}
                        accentColor="#E6235A"
                    />
                </div>

                <div className="m-rdetail-stat-row">
                    <span className="m-rdetail-stat-meta">{data.date} · 조회수 {data.views}</span>
                    <span className="m-rdetail-stat-icons">
                        <button
                            type="button"
                            className={`m-rdetail-like-btn ${liked ? 'liked' : ''}`}
                            onClick={toggleLike}
                            aria-pressed={liked}
                            aria-label={liked ? '좋아요 취소' : '좋아요'}
                        >
                            {liked ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            )}
                            {likeCount}
                        </button>
                        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {comments.length || data.comments}</span>
                    </span>
                </div>

                <div className="m-comment-input-row">
                    <input
                        type="text"
                        placeholder="댓글을 입력해주세요"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
                        className="m-comment-input"
                    />
                    <button className="m-comment-send" onClick={submitComment} aria-label="등록">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    </button>
                </div>

                <ul className="m-rdetail-comments">
                    {comments.map((c, i) => (
                        <li key={c.id ?? i}>
                            <div className="m-comment-meta">
                                <strong>{c.author || '익명'}</strong>
                                <span>{c.date || ''}</span>
                            </div>
                            <p>{c.content}</p>
                            <button className="m-comment-reply" type="button">답글쓰기</button>
                        </li>
                    ))}
                </ul>
            </div>

            <footer className="m-rdetail-stage-bar">
                <div className="m-rstage-pills-row">
                    {STAGES.map((s, i) => (
                        <div key={s.key} className="m-rstage-step">
                            <button
                                type="button"
                                className={`m-rstage-pill ${i === stageIdx ? 'active' : ''} ${i < stageIdx ? 'done' : ''}`}
                                onClick={() => handleStageClick(s.key)}
                            >
                                {s.label}
                            </button>
                            {i < STAGES.length - 1 && (
                                <span className="m-rstage-sep" aria-hidden="true">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                </span>
                            )}
                        </div>
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
                <div className="m-result-backdrop" onClick={() => setResultOpen(false)}>
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
