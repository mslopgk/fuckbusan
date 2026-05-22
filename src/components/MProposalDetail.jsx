import { useState, useEffect } from 'react';
import PCMapCanvas from './PCMapCanvas';
import { CAT_STYLES } from './catStyles';
import './MProposalDetail.css';
import { API_URL } from '../utils/api';

export default function MProposalDetail({ onNavigate, proposal }) {
    const data = {
        title: proposal?.title || '',
        cat: proposal?.cat || proposal?.category || '',
        author: proposal?.author || proposal?.nickname || '익명',
        body: proposal?.body || proposal?.content || '',
        date: proposal?.date || (proposal?.created_at ? new Date(proposal.created_at).toLocaleDateString('ko-KR') : ''),
        lat: proposal?.lat || 35.197,
        lng: proposal?.lng || 129.063,
        imageUrl: proposal?.image || (Array.isArray(proposal?.files) && proposal.files.length > 0 ? proposal.files[0] : null) || null,
    };

    const [comment, setComment] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [voted, setVoted] = useState(!!proposal?.has_voted);
    const [comments, setComments] = useState([]);
    const [views, setViews] = useState(proposal?.views ?? proposal?.views_count ?? 0);
    const [votes, setVotes] = useState(proposal?.votes ?? proposal?.likes_count ?? 0);

    useEffect(() => {
        if (!proposal?.id) return;
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));

        const token = localStorage.getItem('access_token');
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}/view`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.views_count != null) setViews(d.views_count); })
            .catch(() => {});
    }, [proposal?.id]);

    const submitComment = async () => {
        if (!comment.trim() || !proposal?.id || commenting) return;
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        setCommenting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`, {
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
        } finally {
            setCommenting(false);
        }
    };

    const toggleVote = async () => {
        if (!proposal?.id) {
            setVoted((v) => !v);
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
                setVoted(!!j.has_voted);
                if (j.likes_count != null) setVotes(j.likes_count);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const style = CAT_STYLES[data.cat] || { bg: '#eee', color: '#555' };

    return (
        <div className="m-prop-detail-page">
            <header className="m-detail-topbar">
                <button className="m-detail-back" onClick={() => onNavigate && onNavigate('mProposalList')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span className="m-detail-cat-tag" style={{ background: style.bg, color: style.color }}>{data.cat}</span>
            </header>

            <div className="m-detail-content">
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

                {data.imageUrl ? (
                    <div
                        className="m-detail-image"
                        style={{ backgroundImage: `url(${data.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                ) : (
                    <div className="m-detail-image m-detail-image-placeholder" />
                )}

                <div className="m-detail-map">
                    <PCMapCanvas
                        pins={[{ id: 'this', lat: data.lat, lng: data.lng, color: '#E6235A', title: data.title }]}
                        accentColor="#E6235A"
                    />
                </div>
                <p className="m-detail-coord-text">📍 위도 {(data.lat ?? 0).toFixed(4)}, 경도 {(data.lng ?? 0).toFixed(4)}</p>

                {(proposal?.files?.length > 0) && (
                    <div className="m-detail-attachment">
                        {proposal.files.map((f, i) => (
                            <div key={i}>
                                <span>📎</span>
                                <span>{typeof f === 'string' ? f : (f.name || f.url || f)}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="m-detail-meta-row">
                    <span className="m-detail-meta-left">{data.date} · 조회수 {views}</span>
                    <span className="m-detail-meta-icons">
                        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg> {votes}</span>
                        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {comments.length}</span>
                    </span>
                </div>

                <div className="m-detail-comments">
                    <div className="m-detail-comments-header">댓글 {comments.length}</div>
                    <ul>
                        {comments.map((c, i) => (
                            <li key={c.id ?? i}>
                                <div className="m-comment-meta">
                                    <strong>{c.nickname || c.author || '익명'}</strong>
                                    <span>{c.created_at ? new Date(c.created_at).toLocaleDateString('ko-KR') : (c.date || '')}</span>
                                </div>
                                <p>{c.content || c.body}</p>
                            </li>
                        ))}
                    </ul>

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
                </div>
            </div>

            <footer className="m-detail-footer">
                <button
                    className={`m-vote-cta ${voted ? 'on' : ''}`}
                    type="button"
                    onClick={toggleVote}
                >
                    {voted ? '투표 완료' : '투표하기'}
                </button>
            </footer>
        </div>
    );
}
