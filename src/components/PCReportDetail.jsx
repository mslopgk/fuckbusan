import { useEffect, useState, useRef} from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import './PCDetailShared.css';
import './PCReportDetail.css';
import { API_URL } from '../utils/api';


const LS_KEY = 'liked_report_ids';
function getLikedSet() {
    try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch { return new Set(); }
}
function saveLikedSet(s) {
    localStorage.setItem(LS_KEY, JSON.stringify([...s]));
}

export default function PCReportDetail({ onNavigate, report }) {
    // report.id may arrive as "r-58" from PCProposeMap; normalize to integer
    const reportId = (() => {
        const raw = report?.id;
        if (typeof raw === 'string') return parseInt(raw.replace(/\D/g, ''), 10) || null;
        return raw ?? null;
    })();

    const [detail, setDetail] = useState(report || null);
    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [liked, setLiked] = useState(() => getLikedSet().has(reportId));
    const [likeCount, setLikeCount] = useState(0);
    const [voteDoneType, setVoteDoneType] = useState(null); // 'liked' | 'unliked' | null
    const [showResult, setShowResult] = useState(false);
    const fetchCalled = useRef(false);

    useEffect(() => {
        if (!reportId || fetchCalled.current) return;
        fetchCalled.current = true;
        setLiked(getLikedSet().has(reportId));
        fetch(`${API_URL}/api/reports/${reportId}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return;
                setDetail(d);
                setLikeCount(d.likes ?? d.likes_count ?? 0);
            })
            .catch(() => {});
        fetch(`${API_URL}/api/reports/${reportId}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));
    }, [reportId]);

    const lat = detail?.lat ?? 35.1631;
    const lng = detail?.lng ?? 129.1638;
    const dateStr = detail?.date
        ? String(detail.date).slice(0, 10).replace(/-/g, '.')
        : detail?.created_at
            ? String(detail.created_at).slice(0, 10).replace(/-/g, '.')
            : '';
    const author = detail?.author || detail?.nickname || '익명';
    const imageSrc = detail?.image_url || detail?.image || null;

    // 개선완료 결과 데이터
    const isImproved = detail?.status === '개선완료' || detail?.status === '결과안내';
    const resultDetails = detail?.result_details || null;
    const resultImage = resultDetails?.image || detail?.result_image || null;
    const resultText = resultDetails?.content || resultDetails?.title || '';

    // 소유자(작성자) 판별: user_name 일치 (백엔드에 /users/me 호출 없이 경량 비교)
    const myName = (() => { try { return localStorage.getItem('user_name') || localStorage.getItem('username') || ''; } catch { return ''; } })();
    const isOwner = !!myName && (author === myName);

    const toggleLike = async () => {
        if (!reportId) {
            setLiked((v) => !v);
            return;
        }
        const token = localStorage.getItem('access_token');
        if (!token) { alert('로그인이 필요합니다.'); return; }
        try {
            const res = await fetch(`${API_URL}/api/reports/${reportId}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const j = await res.json();
                const nowLiked = !!j.liked;
                setLiked(nowLiked);
                setLikeCount(j.likes_count ?? likeCount);
                const ids = getLikedSet();
                if (nowLiked) ids.add(reportId); else ids.delete(reportId);
                saveLikedSet(ids);
                setVoteDoneType(nowLiked ? 'liked' : 'unliked');
                setTimeout(() => setVoteDoneType(null), 2000);
            } else {
                const errText = await res.text().catch(() => '');
                let msg;
                try { const e = JSON.parse(errText); msg = typeof e.detail === 'string' ? e.detail : `오류 (${res.status})`; }
                catch { msg = `투표 실패 (${res.status})`; }
                alert(msg);
            }
        } catch (e) {
            console.error('like failed', e);
            alert('서버 연결 오류가 발생했습니다.');
        }
    };

    const submitComment = async () => {
        if (!comment.trim() || !reportId || commenting) return;
        const token = localStorage.getItem('access_token');
        if (!token) { alert('로그인이 필요합니다.'); return; }
        setCommenting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/${reportId}/comments`, {
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
                alert(typeof err.detail === 'string' ? err.detail : `댓글 등록 실패 (${res.status})`);
            }
        } catch (e) {
            console.error('comment failed', e);
            alert('서버 연결 오류가 발생했습니다.');
        } finally {
            setCommenting(false);
        }
    };

    return (
        <UserPCLayout currentView="pcReportDetail" onNavigate={onNavigate}>
            <div className="pcd-page">
                <div className="pcd-inner">

                    {/* 태그 행 — Figma: district(teal bg), category(yellow bg), sub-cat(pink bg) */}
                    <div className="pcd-tags">
                        {detail?.region && (
                            <span className="pcrd-tag pcrd-tag-district">{detail.region}</span>
                        )}
                        {detail?.category && (
                            <span className="pcrd-tag pcrd-tag-category">{detail.category}</span>
                        )}
                        {detail?.sub_category && (
                            <span className="pcrd-tag pcrd-tag-subcat">{detail.sub_category}</span>
                        )}
                        {detail?.status && (
                            <span className="pcrd-tag pcrd-tag-status" style={{ marginLeft: 'auto' }}>
                                {detail.status}
                            </span>
                        )}
                        {isOwner && (
                            <button
                                type="button"
                                className="pcd-edit-btn"
                                style={detail?.status ? undefined : { marginLeft: 'auto' }}
                                onClick={() => onNavigate && onNavigate('pcMyReportEdit', detail)}
                            >
                                수정하기
                            </button>
                        )}
                    </div>

                    <h1 className="pcd-title">{detail?.title || '(제목 없음)'}</h1>

                    {/* 메타: 작성자 왼쪽 | 날짜·조회수 오른쪽 */}
                    <div className="pcd-meta">
                        <span>{author}</span>
                        <span>{dateStr}{(detail?.views ?? detail?.views_count) != null ? `${dateStr ? ' · ' : ''}조회수 ${detail?.views ?? detail?.views_count}` : ''}</span>
                    </div>

                    <div className="pcd-divider" />

                    {/* 대표 이미지 */}
                    {imageSrc && (
                        <img
                            src={imageSrc}
                            alt="제보 사진"
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
                        {/* Vote — Figma: purple #542aa3 circle, "좋아요" label */}
                        <button
                            className={`pcrd-vote-circle${liked ? ' voted' : ''}`}
                            onClick={toggleLike}
                        >
                            <span className="pcd-vote-icon">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                            </span>
                            <span className="pcd-vote-count">{likeCount}</span>
                            <span className="pcd-vote-label">좋아요</span>
                        </button>
                    </div>

                    {/* 개선완료 결과 배너 — Figma: purple rgba(84,42,163,0.2) bg, no border */}
                    {isImproved && (
                        <div className="pcd-result-banner pcrd-improvement-banner">
                            <div className="pcd-result-banner-head">
                                <span className="pcd-result-banner-badge">개선완료</span>
                                <p className="pcd-result-banner-title">답변이 등록되었습니다</p>
                            </div>
                            {resultImage && (
                                <img src={resultImage} alt="개선 결과 사진" className="pcd-result-banner-img" onError={(e) => { e.target.style.display = 'none'; }} />
                            )}
                            {resultText && <p className="pcd-result-banner-text">{resultText}</p>}
                            <button type="button" className="pcd-result-banner-btn" onClick={() => setShowResult(true)}>
                                결과보기
                            </button>
                        </div>
                    )}

                    {/* 댓글 */}
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
                                    <div className="pcd-comment-author">{c.author || c.nickname || '익명'}</div>
                                    <p className="pcd-comment-text">{c.content}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pcd-bottom-actions">
                        <button className="pcd-back-btn" onClick={() => onNavigate && onNavigate('pcReportMap')}>
                            ← 목록으로
                        </button>
                    </div>
                </div>

                {/* 개선 결과보기 모달 */}
                {showResult && (
                    <div className="pcd-result-backdrop" onClick={() => setShowResult(false)}>
                        <div className="pcd-result-modal pcrd-result-modal-override" onClick={(e) => e.stopPropagation()}>
                            <div className="pcd-result-modal-head">
                                <h3>개선 결과보기</h3>
                            </div>
                            {resultImage ? (
                                <img src={resultImage} alt="개선 결과 사진" className="pcd-result-modal-img" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                                <div className="pcd-result-modal-img pcd-result-modal-img--empty">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a0bdd0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    <span>결과 사진이 없습니다</span>
                                </div>
                            )}
                            {resultText && <p className="pcd-result-modal-text">{resultText}</p>}
                            {/* Figma: 담당자 코멘트 block inside modal */}
                            {resultDetails?.content && (
                                <div className="pcrd-result-comment-block">
                                    <p className="pcrd-result-comment-label">담당자 코멘트</p>
                                    {resultDetails?.date && <p className="pcrd-result-comment-date">{String(resultDetails.date).slice(0, 10).replace(/-/g, '.')}</p>}
                                    <p className="pcrd-result-comment-text">{resultDetails.content}</p>
                                </div>
                            )}
                            {/* Figma: purple "확인" button + light-purple "닫기" button */}
                            <div className="pcrd-result-modal-actions">
                                <button type="button" className="pcrd-result-btn-soft" onClick={() => setShowResult(false)}>닫기</button>
                                <button type="button" className="pcrd-result-btn-purple" onClick={() => setShowResult(false)}>확인</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 투표 완료/취소 팝업 */}
                {voteDoneType && (
                    <div className="pcd-vote-modal-overlay" onClick={() => setVoteDoneType(null)}>
                        <div className="pcd-vote-modal-box">
                            <div className="pcd-vote-modal-icon">
                                <svg width="90" height="100" viewBox="0 0 90 100" fill="none">
                                    <path d="M10 6 H58 L80 28 V92 Q80 96 76 96 H14 Q10 96 10 92 Z" fill="white" stroke="#1a1a1a" strokeWidth="4.5" strokeLinejoin="round"/>
                                    <path d="M58 6 L80 28 H58 Z" fill="white" stroke="#1a1a1a" strokeWidth="4.5" strokeLinejoin="round"/>
                                    <g transform="translate(45,62) rotate(-5)">
                                        <path d="M-18 2 L-5 16 L20 -14" stroke="#542aa3" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                    </g>
                                </svg>
                            </div>
                            <p className="pcd-vote-modal-text">
                                투표가<br />{voteDoneType === 'liked' ? '완료되었습니다' : '취소되었습니다'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </UserPCLayout>
    );
}
