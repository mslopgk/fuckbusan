import { useEffect, useState, useRef } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import './PCDetailShared.css';
import './PCPropose.css';
import { API_URL } from '../utils/api';
import { recordView } from '../utils/viewHistory';


const getImgSrc = (file) => {
    if (!file) return null;
    if (file.startsWith('http') || file.startsWith('/assets/')) return file;
    if (file.startsWith('/uploads/')) return `${API_URL}${file}`;
    return `${API_URL}/uploads/${file}`;
};

export default function PCProposeDetail({ onNavigate, proposal }) {
    const [detail, setDetail] = useState(proposal || null);
    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState('');
    const [commenting, setCommenting] = useState(false);
    const submittingRef = useRef(false); // 동기 가드: state는 비동기라 연타 시 중복 POST 발생
    const [voteDoneType, setVoteDoneType] = useState(null); // null | 'voted' | 'cancelled'
    const [voted, setVoted] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const viewCalled = useRef(false);

    useEffect(() => {
        if (!proposal?.id) return;
        const rawId = proposal.id;
        const numId = typeof rawId === 'string' ? parseInt(rawId.replace(/\D/g, ''), 10) : rawId;
        if (!numId) return;
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${API_URL}/api/reports/proposals/${numId}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return;
                setDetail(d);
                setLikeCount(d.likes_count ?? 0);
                setVoted(!!d.has_voted);
                recordView({ type: 'proposal', id: numId, title: d.title, category: d.category, region: d.region });
                try { sessionStorage.setItem('selectedProposal', JSON.stringify(d)); } catch (_) {}
            })
            .catch(() => {});
        fetch(`${API_URL}/api/reports/proposals/${numId}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));
        if (!viewCalled.current) {
            viewCalled.current = true;
            fetch(`${API_URL}/api/reports/proposals/${numId}/view`, { method: 'POST' }).catch(() => {});
        }
    }, [proposal?.id]);

    const district = detail?.region
        ? (detail.region.match(/[가-힣]+(?:구|군)/) || [''])[0]
        : '';
    const photoSrc = detail?.files?.[0]
        ? getImgSrc(detail.files[0])
        : detail?.image ? getImgSrc(detail.image) : null;
    const lat = detail?.lat ?? 35.1631;
    const lng = detail?.lng ?? 129.1638;
    const dateStr = detail?.created_at
        ? String(detail.created_at).slice(0, 10).replace(/-/g, '.')
        : '';
    const isMine = detail?.is_mine || false;

    const submitVote = async () => {
        const rawId = detail?.id ?? proposal?.id;
        const proposalId = typeof rawId === 'string' ? parseInt(rawId.replace(/\D/g, ''), 10) : rawId;
        if (!proposalId) return;
        const token = localStorage.getItem('access_token');
        if (!token) { alert('로그인이 필요합니다.'); return; }
        try {
            const res = await fetch(`${API_URL}/api/reports/proposals/${proposalId}/vote`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const j = await res.json();
                const nowVoted = !!j.has_voted;
                setVoted(nowVoted);
                setLikeCount(j.likes_count ?? likeCount);
                setVoteDoneType(nowVoted ? 'voted' : 'cancelled');
                setTimeout(() => setVoteDoneType(null), 2000);
            } else {
                const errText = await res.text().catch(() => '');
                console.error(`vote ${res.status}:`, errText, 'proposalId=', proposalId);
                let msg;
                try { const e = JSON.parse(errText); msg = typeof e.detail === 'string' ? e.detail : `투표 실패 (${res.status})`; }
                catch { msg = `투표 실패 (${res.status})`; }
                alert(msg);
            }
        } catch (e) {
            console.error('vote error', e);
            alert('서버 연결 오류가 발생했습니다.');
        }
    };

    const submitComment = async () => {
        const rawId = detail?.id ?? proposal?.id;
        const proposalId = typeof rawId === 'string' ? parseInt(rawId.replace(/\D/g, ''), 10) : rawId;
        if (!comment.trim() || !proposalId || submittingRef.current) return;
        const token = localStorage.getItem('access_token');
        if (!token) { alert('로그인이 필요합니다.'); return; }
        submittingRef.current = true;
        setCommenting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/proposals/${proposalId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: comment.trim() }),
            });
            if (res.ok) {
                const created = await res.json();
                setComments((prev) => [...prev, created]);
                setComment('');
            } else {
                const err = await res.json().catch(() => ({}));
                const msg = typeof err.detail === 'string' ? err.detail : `댓글 등록 실패 (${res.status})`;
                alert(msg);
            }
        } catch (e) {
            console.error('comment failed', e);
            alert('서버 연결 오류가 발생했습니다.');
        } finally {
            submittingRef.current = false;
            setCommenting(false);
        }
    };

    return (
        <UserPCLayout currentView="pcProposeDetail" onNavigate={onNavigate}>
            <div className="pcd-page pcd-propose">
                <div className="pcd-inner">

                    {/* 진행상태 배지 (우상단) */}
                    <span className="pcd-status-badge">{detail?.status || '접수중'}</span>

                    {/* 태그 행: 지역 + 카테고리 */}
                    <div className="pcd-tags">
                        {district && <span className="pcd-region-pill">{district}</span>}
                        {detail?.category && <span className="pcd-cat-pill">{detail.category}</span>}
                    </div>

                    <h1 className="pcd-title">{detail?.title || '(제목 없음)'}</h1>

                    {/* 메타: 작성자 왼쪽 | 날짜·조회수 오른쪽 */}
                    <div className="pcd-meta">
                        <span>{detail?.nickname || detail?.region || '작성자 정보 없음'}</span>
                        <span>{dateStr}{dateStr && ' · '}조회수 {detail?.views_count || 0}</span>
                    </div>

                    <div className="pcd-divider" />

                    {/* 대표 이미지 */}
                    {photoSrc && (
                        <img
                            src={photoSrc}
                            alt="제안 사진"
                            className="pcd-photo"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}

                    {/* 카카오 지도 */}
                    <div className="pcd-map-wrap">
                        <PCMapCanvas
                            pins={[{ id: 'this', lat, lng, color: '#E6235A', title: detail?.title || '' }]}
                            accentColor="#E6235A"
                            initialCenter={{ lat, lng }}
                            initialLevel={4}
                        />
                    </div>

                    {/* 본문 + 투표 버튼 */}
                    <div className="pcd-body-wrap">
                        <div className="pcd-body">
                            {(detail?.content || detail?.body)
                                ? (detail.content || detail.body).split('\n').map((line, i) =>
                                    line.trim().startsWith('-')
                                        ? <li key={i}>{line.replace(/^-\s*/, '')}</li>
                                        : <p key={i}>{line}</p>
                                  )
                                : <p style={{ color: '#999' }}>본문이 없습니다.</p>
                            }
                        </div>
                        {!isMine && (
                            <button
                                className={`pcd-vote-circle${voted ? ' voted' : ''}`}
                                onClick={submitVote}
                            >
                                <span className="pcd-vote-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill={voted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
                                    </svg>
                                </span>
                                <span className="pcd-vote-count">{likeCount}</span>
                                <span className="pcd-vote-label">{voted ? '투표완료' : '투표하기'}</span>
                            </button>
                        )}
                    </div>

                    {/* 댓글 입력 + 목록 */}
                    <div className="pcd-comment-section">
                        <div className="pcd-comment-input-row">
                            <input
                                type="text"
                                className="pcd-comment-input"
                                placeholder="댓글을 입력해주세요"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
                            />
                            <button className="pcd-comment-send" onClick={submitComment}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 2L11 13" />
                                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                </svg>
                            </button>
                        </div>

                        <ul className="pcd-comment-list">
                            {comments.length === 0 ? (
                                <li className="pcd-comment-empty">아직 댓글이 없습니다.</li>
                            ) : comments.map((c, i) => (
                                <li key={c.id || i} className="pcd-comment-item">
                                    <div className="pcd-comment-author">{c.nickname || '익명'}</div>
                                    <p className="pcd-comment-text">{c.content}</p>
                                    <button className="pcd-comment-reply-btn">답글쓰기</button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pcd-bottom-actions">
                        <button className="pcd-back-btn" onClick={() => onNavigate && onNavigate('pcProposeMap')}>
                            ← 목록으로
                        </button>
                    </div>
                </div>

                {/* 투표 완료/취소 팝업 */}
                {voteDoneType && (
                    <div className="pcd-vote-modal-overlay" onClick={() => setVoteDoneType(null)}>
                        <div className="pcd-vote-modal-box">
                            <div className="pcd-vote-modal-icon">
                                <svg width="90" height="100" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* 문서 본체 — 두꺼운 검정 아웃라인, 우상단 도그이어 */}
                                    <path d="M10 6 H58 L80 28 V92 Q80 96 76 96 H14 Q10 96 10 92 Z" fill="white" stroke="#1a1a1a" strokeWidth="4.5" strokeLinejoin="round"/>
                                    {/* 도그이어 폴드 선 */}
                                    <path d="M58 6 L80 28 H58 Z" fill="white" stroke="#1a1a1a" strokeWidth="4.5" strokeLinejoin="round"/>
                                    {/* 핑크 체크마크 */}
                                    <g transform="translate(45,62) rotate(-5)">
                                        <path d="M-18 2 L-5 16 L20 -14" stroke="#E6235A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                    </g>
                                </svg>
                            </div>
                            <p className="pcd-vote-modal-text">
                                투표가<br />{voteDoneType === 'voted' ? '완료되었습니다' : '취소되었습니다'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </UserPCLayout>
    );
}
