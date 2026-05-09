import { useEffect, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import './PCDetailShared.css';
import { API_URL } from '../utils/api';


export default function PCReportDetail({ onNavigate, report }) {
    const [detail, setDetail] = useState(report || null);
    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState('');
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        if (!report?.id) return;
        fetch(`${API_URL}/api/reports/${report.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return;
                setDetail(d);
                setLikeCount(d.likes ?? 0);
            })
            .catch(() => {});
        fetch(`${API_URL}/api/reports/${report.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));
    }, [report?.id]);

    const data = {
        title: detail?.title || '',
        author_id: detail?.author || detail?.region || '',
        date: detail?.date || '',
        likes: likeCount,
        category: detail?.category || '',
        body: detail?.content || detail?.body || '',
        lat: detail?.lat ?? 35.1631,
        lng: detail?.lng ?? 129.1638,
        status: detail?.status || '',
    };

    const submitComment = async () => {
        if (!comment.trim() || !report?.id) return;
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/reports/${report.id}/comments`, {
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
        if (!report?.id) {
            setLiked((v) => !v);
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
                setLiked(!!j.liked);
                setLikeCount(j.likes_count ?? likeCount);
            }
        } catch (e) {
            console.error('like failed', e);
        }
    };

    return (
        <UserPCLayout currentView="pcReportDetail" onNavigate={onNavigate}>
            <div className="pc-detail-page">
                <div className="pc-detail-inner">
                    <div className="pc-detail-tags">
                        <span className="pc-status-tag pc-status-public">제보/제안</span>
                        {data.category && <span className="pc-status-tag pc-status-cat">{data.category}</span>}
                        <span style={{ marginLeft: 'auto' }}>
                            <span className="pc-status-tag pc-status-pending">{data.status || '처리중'}</span>
                        </span>
                    </div>
                    <h2 className="pc-detail-title">{data.title || '(제목 없음)'}</h2>
                    <div className="pc-detail-meta">
                        <span>{data.date}</span>
                        <span>·</span>
                        <span>{data.author_id}</span>
                        <span>·</span>
                        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="#E6235A" stroke="#E6235A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg> {data.likes}</span>
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
                        <button
                            className={`pc-vote-float ${liked ? 'on' : ''}`}
                            onClick={toggleLike}
                        >
                            <span className="pc-vote-float-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            </span>
                            <span className="pc-vote-float-label">{liked ? '응원완료' : '응원해'}</span>
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
                                        <strong>{c.author || '익명'}</strong>
                                        <span>{c.date || ''}</span>
                                    </div>
                                    <p>{c.content}</p>
                                    <button className="pc-comment-reply-btn">답글쓰기</button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pc-detail-bottom-actions">
                        <button
                            className="pc-btn-back-to-list"
                            onClick={() => onNavigate && onNavigate('pcReportMap')}
                        >
                            ← 목록으로
                        </button>
                    </div>
                </div>
            </div>
        </UserPCLayout>
    );
}
