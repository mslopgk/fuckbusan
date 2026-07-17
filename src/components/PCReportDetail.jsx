import { useEffect, useState, useRef} from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import ImageLightbox from './common/ImageLightbox';
import './PCDetailShared.css';
import './PCReportDetail.css';
import { API_URL } from '../utils/api';
import { recordView } from '../utils/viewHistory';


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
    const submittingRef = useRef(false); // 동시 제출 레이스 방지 (댓글 중복 등록)
    const [liked, setLiked] = useState(() => getLikedSet().has(reportId));
    const [likeCount, setLikeCount] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [myId, setMyId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const fetchCalled = useRef(false);
    const [lightbox, setLightbox] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // 현재 로그인 사용자의 user_id (소유자 판정용 — 이름/닉네임 문자열 비교 대신 신뢰 가능한 id 비교)
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.user_id != null) setMyId(d.user_id); })
            .catch(() => {});
    }, []);

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
                recordView({ type: 'report', id: reportId, title: d.title, category: d.category, region: d.region, status: d.status });
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
    // 다중 이미지: 백엔드 images 배열 우선, 없으면 단일 대표 이미지로 폴백
    const images = (Array.isArray(detail?.images) && detail.images.length)
        ? detail.images
        : (imageSrc ? [imageSrc] : []);

    // 개선완료 결과 데이터
    const isImproved = detail?.status === '개선완료' || detail?.status === '결과안내';
    const resultDetails = detail?.result_details || null;
    const resultImage = resultDetails?.image || detail?.result_image || null;
    const resultText = resultDetails?.content || resultDetails?.title || '';

    // 소유자(작성자) 판별: user_id 우선(신뢰), 없으면 이름 문자열 폴백
    const myName = (() => { try { return localStorage.getItem('user_name') || localStorage.getItem('username') || ''; } catch { return ''; } })();
    const isOwner = (myId != null && detail?.user_id != null)
        ? detail.user_id === myId
        : (!!myName && author === myName);

    const handleDelete = async () => {
        if (!reportId || deleting) return;
        const token = localStorage.getItem('access_token');
        if (!token) { alert('로그인이 필요합니다.'); return; }
        setDeleting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/${reportId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(typeof e.detail === 'string' ? e.detail : `삭제 실패 (${res.status})`);
            }
            setConfirmDelete(false);
            onNavigate && onNavigate('pcMyReportList');
        } catch (e) {
            alert(e.message || '삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

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
        if (submittingRef.current) return;
        submittingRef.current = true;
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
            submittingRef.current = false;
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
                            isImproved ? (
                                /* Figma 302:12293 — 개선완료: 상태 배지 대신 우상단 "개선결과보기" 버튼 */
                                <button
                                    type="button"
                                    className="pcrd-status-result"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={() => setShowResult(true)}
                                >
                                    개선결과보기
                                </button>
                            ) : (
                                /* Figma 302:13665 — 개선중=보라 채움, 개선예정=연핑크 */
                                <span
                                    className={`pcrd-tag pcrd-tag-status ${detail.status === '개선중' || detail.status === '검토중' ? 'is-progress' : 'is-planned'}`}
                                    style={{ marginLeft: 'auto' }}
                                >
                                    {detail.status}
                                </span>
                            )
                        )}
                    </div>

                    <h1 className="pcd-title">{detail?.title || '(제목 없음)'}</h1>

                    {/* 메타: 작성자 왼쪽 | 날짜·조회수 오른쪽 */}
                    <div className="pcd-meta">
                        <span>{author}</span>
                        <span>{dateStr}{(detail?.views ?? detail?.views_count) != null ? `${dateStr ? ' · ' : ''}조회수 ${detail?.views ?? detail?.views_count}` : ''}</span>
                    </div>

                    <div className="pcd-divider" />

                    {/* 제보 사진 (다중 지원) */}
                    {images.length > 0 && (
                        <div className={`pcd-photos${images.length > 1 ? ' multi' : ''}`}>
                            {images.map((src, i) => (
                                <img
                                    key={`${src}-${i}`}
                                    src={src}
                                    alt={`제보 사진 ${i + 1}`}
                                    className="pcd-photo"
                                    style={{ cursor: 'zoom-in' }}
                                    onClick={() => { setLightboxIndex(i); setLightbox(true); }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ))}
                        </div>
                    )}

                    {/* 카카오 지도 */}
                    <div className="pcd-map-wrap">
                        <PCMapCanvas
                            pins={[{ id: 'this', lat, lng, color: '#542aa3', title: detail?.title || '' }]}
                            accentColor="#542aa3"
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
                        {/* Vote — Figma: purple #542aa3 circle, "좋아요" label. 본인 글은 공감 불가 → 숨김 */}
                        {!isOwner && (
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
                        )}
                    </div>

                    {/* 개선완료 담당자 코멘트 프리뷰 카드 — Figma 302:12293 (Group 382) */}
                    {isImproved && (
                        <div className="pcrd-manager-card">
                            <div className="pcrd-manager-main">
                                <img src="/figma-assets/report_manager_reply.svg" alt="" className="pcrd-manager-arrow" aria-hidden="true" />
                                <div className="pcrd-manager-text">
                                    <p className="pcrd-manager-title">담당자 코멘트</p>
                                    {(resultDetails?.date || resultDetails?.result_date) && (
                                        <p className="pcrd-manager-date">{String(resultDetails.date || resultDetails.result_date).slice(0, 10).replace(/-/g, '.')}</p>
                                    )}
                                    <p className="pcrd-manager-comment">
                                        {resultText || '담당자 코멘트가 아직 등록되지 않았습니다.'}
                                    </p>
                                </div>
                            </div>
                            {resultImage && (
                                <img src={resultImage} alt="개선 결과 사진" className="pcrd-manager-thumb" onError={(e) => { e.target.style.display = 'none'; }} />
                            )}
                        </div>
                    )}

                    {/* 본인 글 삭제/수정 — 본문 아래 중앙 (Figma) */}
                    {isOwner && (
                        <>
                            <div className="pcd-divider" />
                            <div className="pcd-owner-actions">
                                <button
                                    type="button"
                                    className="pcd-delete-btn"
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    삭제하기
                                </button>
                                <button
                                    type="button"
                                    className="pcd-edit-btn"
                                    onClick={() => onNavigate && onNavigate('pcMyReportEdit', detail)}
                                >
                                    수정하기
                                </button>
                            </div>
                        </>
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
                                    <button className="pcd-comment-reply-btn">답글쓰기</button>
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
                                    {(resultDetails?.date || resultDetails?.result_date) && <p className="pcrd-result-comment-date">{String(resultDetails.date || resultDetails.result_date).slice(0, 10).replace(/-/g, '.')}</p>}
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

                {/* 삭제 확인 모달 */}
                {confirmDelete && (
                    <div className="pcd-result-backdrop" onClick={() => !deleting && setConfirmDelete(false)}>
                        <div className="pcd-confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <p className="pcd-confirm-title">제보글을 삭제하시겠습니까?</p>
                            <p className="pcd-confirm-sub">삭제한 제보글은 복구할 수 없습니다.</p>
                            <div className="pcrd-result-modal-actions">
                                <button type="button" className="pcrd-result-btn-soft" disabled={deleting} onClick={() => setConfirmDelete(false)}>취소</button>
                                <button type="button" className="pcrd-result-btn-purple" disabled={deleting} onClick={handleDelete}>{deleting ? '삭제 중…' : '삭제'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {lightbox && (
                    <ImageLightbox
                        images={images}
                        index={lightboxIndex}
                        alt="제보 사진"
                        onClose={() => setLightbox(false)}
                    />
                )}
            </div>
        </UserPCLayout>
    );
}
