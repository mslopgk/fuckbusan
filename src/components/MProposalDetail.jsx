import { useState, useEffect, useRef } from 'react';
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
    const [votes, setVotes] = useState(proposal?.likes_count ?? proposal?.votes ?? 0);
    const viewCalled = useRef(false);

    useEffect(() => {
        if (!proposal?.id) return;
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));

        if (viewCalled.current) return;
        viewCalled.current = true;
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
            } else if (res.status === 403) {
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
        }
    };

    const style = CAT_STYLES[data.cat] || { bg: '#eee', color: '#555' };

    return (
        <div className="m-prop-detail-page">
            <header className="m-detail-topbar">
                <button className="m-detail-back" onClick={() => onNavigate && onNavigate('mProposalList')}>
                    <svg width="6.5" height="13" viewBox="0 0 6.5 13" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 1 0.5 6.5 6 12"/></svg>
                </button>
            </header>

            <div className="m-detail-content">
                {/* WDC: category tag appears inside content area above title */}
                <span className="m-detail-cat-tag" style={{ background: style.bg, color: style.color, display: 'inline-flex', marginBottom: 10 }}>{data.cat}</span>
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
                {(proposal?.files?.length > 0) && (
                    <div className="m-detail-attachment">
                        {proposal.files.map((f, i) => {
                            const name = typeof f === 'string' ? f.split('/').pop() : (f.name || f.url || String(f));
                            return (
                                <div key={i} className="m-detail-attachment-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                    <span>{name}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="m-detail-meta-row">
                    <span className="m-detail-meta-left">{data.date} · 조회수 {views}</span>
                    <span className="m-detail-meta-icons">
                        {/* WDC: heart icon for votes */}
                        <span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            {votes}
                        </span>
                        <span>
                            <svg width="14" height="12" viewBox="0 0 24 20" fill="none" stroke="#bfbfbf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            {comments.length}
                        </span>
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
