import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin_layout.css';
import '../styles/dashboard_new.css'; // 셸 CSS — lazy 단독 진입 시에도 로드
import './AdminCitizen.css';
import './AdminExtra.css';

/* 공지사항 / 홍보 통합 관리 (kind='notice'|'promo').
   현재 comingSoon 이던 메뉴 신규 구축. Announcement CRUD. */

const API = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/admin/announcements`;
const IMG_BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}`;
const SIZE = 10;
const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};
const fmtDate = (s) => (s ? s.slice(0, 10) : '-');
const imgSrc = (u) => (u ? (u.startsWith('http') ? u : `${IMG_BASE}${u}`) : null);

export default function AdminAnnouncements({ onNavigate, kind = 'notice' }) {
    const isPromo = kind === 'promo';
    const view = isPromo ? 'adminPromos' : 'adminNotices';
    const label = isPromo ? '홍보' : '공지사항';
    const empty = { kind, title: '', content: '', category: '', image_url: '', link_url: '', pinned: false, published: true };

    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ kind, page: String(page), size: String(SIZE) });
            if (q) p.set('q', q);
            const d = await fetch(`${API}?${p}`, { headers: auth() }).then((r) => r.json());
            setData(d.items ? d : { items: [], total: 0 });
        } catch { setData({ items: [], total: 0 }); }
        finally { setLoading(false); }
    }, [kind, page, q]);
    useEffect(() => { fetchList(); }, [fetchList]);
    // kind 바뀌면(공지↔홍보 메뉴 전환) 초기화 — 컴포넌트 인스턴스 재사용 시 이전 목록 잔상 방지
    useEffect(() => { setPage(1); setQ(''); setQInput(''); setData({ items: [], total: 0 }); }, [kind]);

    const totalPages = Math.max(1, Math.ceil((data.total || 0) / SIZE));
    const del = async (id, e) => {
        e?.stopPropagation();
        if (!window.confirm(`이 ${label}을(를) 삭제할까요?`)) return;
        await fetch(`${API}/${id}`, { method: 'DELETE', headers: auth() });
        fetchList();
    };
    const togglePub = async (row, e) => {
        e.stopPropagation();
        await fetch(`${API}/${row.id}`, { method: 'PATCH', headers: auth(), body: JSON.stringify({ published: !row.published }) });
        fetchList();
    };
    const save = async (form) => {
        const isNew = !form.id;
        const r = await fetch(isNew ? API : `${API}/${form.id}`, {
            method: isNew ? 'POST' : 'PATCH', headers: auth(), body: JSON.stringify(form),
        });
        if (r.ok) { setEditing(null); fetchList(); }
        return r.ok;
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView={view}>
            <div className="acd">
                <div className="acd-head">
                    <h1>{label} 관리</h1>
                    <span className="acd-total">총 <b>{(data.total || 0).toLocaleString()}</b>건</span>
                </div>

                <div className="acd-toolbar">
                    <div className="acd-searchinput">
                        <input value={qInput} placeholder="제목을 검색해주세요"
                            onChange={(e) => setQInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setQ(qInput.trim()); } }} />
                        <button onClick={() => { setPage(1); setQ(qInput.trim()); }} aria-label="검색">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                        </button>
                    </div>
                    <div className="acd-toolbar-right">
                        <button className="acd-btn-convert" onClick={() => setEditing({ ...empty })}>+ {label} 작성</button>
                    </div>
                </div>

                <div className="acd-table-wrap">
                    <table className="acd-table">
                        <thead><tr>
                            <th className="acd-th-type">상태</th>
                            <th className="acd-th-title">제목</th>
                            {isPromo && <th>배너</th>}
                            <th>분류</th><th>조회</th><th>작성일</th><th>관리</th>
                        </tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan={isPromo ? 7 : 6} className="acd-empty">불러오는 중…</td></tr>}
                            {!loading && data.items.length === 0 && <tr><td colSpan={isPromo ? 7 : 6} className="acd-empty">{label}이(가) 없습니다. ‘{label} 작성’으로 추가하세요.</td></tr>}
                            {!loading && data.items.map((a) => (
                                <tr key={a.id} onClick={() => setEditing(a)}>
                                    <td>
                                        <span className={`acx-pub${a.published ? ' on' : ''}`} onClick={(e) => togglePub(a, e)}>{a.published ? '게시중' : '비공개'}</span>
                                        {a.pinned && <span className="acx-pin">📌</span>}
                                    </td>
                                    <td className="acd-td-title">{a.title}</td>
                                    {isPromo && <td>{imgSrc(a.image_url) ? <img className="acx-thumb" src={imgSrc(a.image_url)} alt="" /> : '—'}</td>}
                                    <td>{a.category || '—'}</td>
                                    <td>{a.views ?? 0}</td>
                                    <td className="acd-td-date">{fmtDate(a.created_at)}</td>
                                    <td className="acx-mgmt">
                                        <button onClick={(e) => { e.stopPropagation(); setEditing(a); }}>수정</button>
                                        <button className="del" onClick={(e) => del(a.id, e)}>삭제</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="acd-pager">
                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const start = Math.max(1, Math.min(page - 2, totalPages - 4)); const n = start + i;
                        return n <= totalPages ? <button key={n} className={n === page ? 'on' : ''} onClick={() => setPage(n)}>{n}</button> : null;
                    })}
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                </div>
            </div>

            {editing && <AnnEditModal row={editing} label={label} isPromo={isPromo} onClose={() => setEditing(null)} onSave={save} />}
        </AdminLayout>
    );
}

function AnnEditModal({ row, label, isPromo, onClose, onSave }) {
    const [f, setF] = useState({ ...row });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const submit = async () => {
        if (!f.title.trim()) { alert('제목을 입력하세요'); return; }
        setSaving(true);
        const ok = await onSave(f);
        if (!ok) setSaving(false);
    };
    return (
        <div className="acp-edit-backdrop" onClick={() => !saving && onClose()}>
            <div className="acd-modal acd-modal-wide" onClick={(e) => e.stopPropagation()}>
                <div className="acd-modal-head">
                    <div><h3>{f.id ? `${label} 수정` : `${label} 작성`}</h3></div>
                    <button className="acd-modal-x" onClick={() => !saving && onClose()}>×</button>
                </div>
                <div className="acx-form">
                    <label>제목<input value={f.title} onChange={(e) => set('title', e.target.value)} /></label>
                    <div className="acx-form-grid2">
                        <label>분류<input value={f.category || ''} onChange={(e) => set('category', e.target.value)} placeholder={isPromo ? '예: 캠페인' : '예: 일반/긴급'} /></label>
                        <label className="acx-checks">
                            <span><input type="checkbox" checked={!!f.pinned} onChange={(e) => set('pinned', e.target.checked)} /> 상단 고정</span>
                            <span><input type="checkbox" checked={!!f.published} onChange={(e) => set('published', e.target.checked)} /> 게시</span>
                        </label>
                    </div>
                    {isPromo && (
                        <div className="acx-form-grid2">
                            <label>배너 이미지 URL<input value={f.image_url || ''} onChange={(e) => set('image_url', e.target.value)} placeholder="/uploads/... 또는 https://" /></label>
                            <label>링크 URL<input value={f.link_url || ''} onChange={(e) => set('link_url', e.target.value)} placeholder="https://" /></label>
                        </div>
                    )}
                    <label>내용<textarea rows={8} value={f.content || ''} onChange={(e) => set('content', e.target.value)} /></label>
                </div>
                <div className="acd-modal-foot">
                    <button className="acd-btn-cancel" disabled={saving} onClick={onClose}>취소</button>
                    <button className="acd-btn-run" disabled={saving} onClick={submit}>{saving ? '저장 중…' : '저장'}</button>
                </div>
            </div>
        </div>
    );
}
