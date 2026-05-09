import { useState, useEffect } from 'react';
import PCMapCanvas from './PCMapCanvas';
import { CAT_STYLES } from './catStyles';
import './MProposalDetail.css';
import { API_URL } from '../utils/api';

export default function MProposalDetail({ onNavigate, proposal }) {
    const DEFAULT_BODY = '안녕하세요. 부산 해운대구에 거주하는 학생입니다.\n\n지역 시민들 수요를 반영해 데이터를 개선해 전기자전거 부족·과잉의 문제점을 해결하기 위한 시스템 자전 계발과 빠른 자전거 적사 가이드 모니터링 시스템 개선 동을 통해 운영 가능성을 마련하고, 관련 정책을 제안드립니다.\n\n- 수요 예측 기반 운영 시스템 도입\n- 실시간 정보 자공 및 위 유도 가능 강화\n- 방치 자전거 관리 및 보행환경 개선 체계 구축\n\n자세한 내용은 아래 첨부파일 참고 바랍니다.';
    const data = {
        title: proposal?.title || '전기자전거 재고 불균형 해결 제안',
        cat: proposal?.cat || '주거',
        author: proposal?.author || '동래구 우리디자이너',
        body: proposal?.body || DEFAULT_BODY,
        date: proposal?.date || '2026.01.02',
        views: proposal?.views ?? 333,
        votes: proposal?.votes ?? 12,
        commentsCount: proposal?.comments ?? 12,
        attachment: '자전거 재고 불균형 제안 [hwp, 28KB]',
        lat: proposal?.lat || 35.197,
        lng: proposal?.lng || 129.063,
        imageUrl: proposal?.image || null,
    };

    const [comment, setComment] = useState('');
    const [voted, setVoted] = useState(!!proposal?.has_voted);
    const [comments, setComments] = useState([]);

    useEffect(() => {
        if (!proposal?.id) return;
        fetch(`${API_URL}/api/reports/proposals/${proposal.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));
    }, [proposal?.id]);

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
                    {data.body.split('\n').map((p, i) =>
                        p.trim().startsWith('-') ? (
                            <li key={i}>{p.replace(/^-\s*/, '')}</li>
                        ) : (
                            <p key={i}>{p}</p>
                        )
                    )}
                </div>

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
                <p className="m-detail-coord-text">📍 위도 {data.lat.toFixed(4)}, 경도 {data.lng.toFixed(4)}</p>

                <div className="m-detail-attachment">
                    <span>📎</span>
                    <span>{data.attachment}</span>
                </div>

                <div className="m-detail-meta-row">
                    <span className="m-detail-meta-left">{data.date} · 조회수 {data.views}</span>
                    <span className="m-detail-meta-icons">
                        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg> {data.votes}</span>
                        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {data.commentsCount}</span>
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
                                <button className="m-comment-reply" type="button">답글쓰기</button>
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
