import { useState, useEffect } from 'react';
import PCMapCanvas from './PCMapCanvas';
import { MY_CAT_STYLES as CAT_STYLES } from './catStyles';
import './MProposalDetail.css';
import './MReportDetail.css';
import './MMyReportDetail.css';
import { API_URL } from '../utils/api';

const STATUS_LABELS = {
    received: '접수',
    review: '검토중',
    inspect: '검토완료',
    notice: '결과안내',
};

export default function MMyReportDetail({ onNavigate, report, onDelete, onEdit }) {
    const data = {
        id: report?.id,
        title: report?.title || '',
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
        body: report?.body || report?.content || '',
        lat: report?.lat || 35.197,
        lng: report?.lng || 129.063,
        image: report?.image,
    };
    const style = CAT_STYLES[data.cat] || { bg: '#E0F4F1', color: '#2C9A8F' };

    const [comments, setComments] = useState([]);
    const [comment, setComment] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (!report?.id) return;
        fetch(`${API_URL}/api/reports/${report.id}/comments`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setComments(Array.isArray(rows) ? rows : []))
            .catch(() => setComments([]));
    }, [report?.id]);

    const submitComment = async () => {
        if (!comment.trim() || !data.id || commenting) return;
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        setCommenting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/${data.id}/comments`, {
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

    const handleDelete = async () => {
        if (deleting) return;
        setDeleteError('');
        const token = localStorage.getItem('access_token');
        if (!data.id || !token) {
            // 비로그인 / id 없음 — 로컬 상태만 갱신
            setShowDelete(false);
            if (onDelete) onDelete(data.id);
            if (onNavigate) onNavigate('myReportList');
            return;
        }
        setDeleting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/${data.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 404) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.detail || `삭제 실패 (${res.status})`);
            }
            setShowDelete(false);
            if (onDelete) onDelete(data.id);
            if (onNavigate) onNavigate('myReportList');
        } catch (e) {
            setDeleteError(e.message || '삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="m-prop-detail-page m-report-detail-page m-myreport-detail-page">
            <header className="m-detail-topbar m-myrdetail-topbar">
                <button className="m-detail-back" onClick={() => onNavigate && onNavigate('myReportList')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="m-rdetail-tags">
                    {data.region && <span className="m-rdetail-region-tag">{data.region}</span>}
                    {data.cat && <span className="m-prop-cat-tag" style={{ background: style.bg, color: style.color }}>{data.cat}</span>}
                    {data.sub && <span className="m-report-sub-tag">{data.sub}</span>}
                </div>
                <span className="m-myrdetail-status-badge">{STATUS_LABELS[data.currentStage] || '접수'}</span>
            </header>

            <div className="m-detail-content">
                <div className="m-rdetail-author-row">
                    <span className="m-rdetail-author">{data.author}</span>
                    {data.authorRegion && <span>· {data.authorRegion}</span>}
                    <span style={{ marginLeft: 'auto' }}>{data.createdAt}</span>
                </div>

                <h1 className="m-detail-title">{data.title}</h1>

                {data.image ? (
                    <img className="m-detail-image" src={data.image} alt={data.title} onError={(e) => { e.target.style.display = 'none'; }} />
                ) : null}

                <div className="m-detail-map">
                    <PCMapCanvas
                        pins={[{ id: 'this', lat: data.lat, lng: data.lng, color: '#E6235A', title: data.title }]}
                        accentColor="#E6235A"
                    />
                </div>

                <div className="m-rdetail-stat-row">
                    <span className="m-rdetail-stat-meta">{data.date} · 조회수 {data.views}</span>
                    <span className="m-rdetail-stat-icons">
                        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {data.likes}</span>
                        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {comments.length || data.comments}</span>
                    </span>
                </div>

                {data.body && <p className="m-myrdetail-body">{data.body}</p>}

                <div className="m-comment-input-row">
                    <input
                        type="text"
                        placeholder="댓글을 입력해주세요"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
                        className="m-comment-input"
                    />
                    <button className="m-comment-send" onClick={submitComment} disabled={commenting} aria-label="등록">
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
                        </li>
                    ))}
                </ul>
            </div>

            <footer className="m-myrdetail-actions">
                <button type="button" className="m-myrdetail-btn ghost" onClick={() => setShowDelete(true)}>삭제하기</button>
                <button type="button" className="m-myrdetail-btn primary" onClick={() => onEdit && onEdit(report)}>수정하기</button>
            </footer>

            {showDelete && (
                <div className="m-result-backdrop" onClick={() => !deleting && setShowDelete(false)}>
                    <div className="m-myrdetail-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="m-myrdetail-modal-title">제보글을<br/>삭제 하시겠습니까?</h3>
                        {deleteError && <p className="m-myrdetail-modal-error">{deleteError}</p>}
                        <div className="m-myrdetail-modal-actions">
                            <button type="button" className="m-myrdetail-btn ghost" disabled={deleting} onClick={() => setShowDelete(false)}>취소</button>
                            <button type="button" className="m-myrdetail-btn primary" disabled={deleting} onClick={handleDelete}>{deleting ? '삭제 중…' : '삭제하기'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
