import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import './AdminCitizen.css';
import './AdminExtra.css';

/* 공공데이터 관리 — PublicThemeStat(테마별 지표) 목록 관리 + 작성/수정/삭제.
   현재 comingSoon 이던 메뉴 신규 구축. */

const API = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/public-data/admin/stats`;
const THEMES = ['전체', '안전', '교통', '주거', '환경', '문화·여가', '산업·일자리', '교육', '보건·복지'];
const SIZE = 10;
const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};
const EMPTY = { theme: '안전', region: '부산', metric: '', value_text: '', year: '', note: '', source: '', sort_order: 0 };

export default function AdminPublicData({ onNavigate }) {
    const [theme, setTheme] = useState('전체');
    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [themeOpen, setThemeOpen] = useState(false);
    const [editing, setEditing] = useState(null);   // row or EMPTY(new)

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page: String(page), size: String(SIZE), theme });
            if (q) p.set('q', q);
            const d = await fetch(`${API}?${p}`, { headers: auth() }).then((r) => r.json());
            setData(d.items ? d : { items: [], total: 0 });
        } catch { setData({ items: [], total: 0 }); }
        finally { setLoading(false); }
    }, [page, theme, q]);
    useEffect(() => { fetchList(); }, [fetchList]);

    const totalPages = Math.max(1, Math.ceil((data.total || 0) / SIZE));
    const del = async (id, e) => {
        e?.stopPropagation();
        if (!window.confirm('이 공공데이터 항목을 삭제할까요?')) return;
        await fetch(`${API}/${id}`, { method: 'DELETE', headers: auth() });
        fetchList();
    };
    const save = async (form) => {
        const isNew = !form.id;
        const url = isNew ? API : `${API}/${form.id}`;
        const method = isNew ? 'POST' : 'PATCH';
        const r = await fetch(url, { method, headers: auth(), body: JSON.stringify(form) });
        if (r.ok) { setEditing(null); fetchList(); }
        return r.ok;
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminPublicData">
            <div className="acd">
                <div className="acd-head">
                    <h1>공공데이터 관리</h1>
                    <span className="acd-total">총 <b>{(data.total || 0).toLocaleString()}</b>건</span>
                </div>

                <div className="acd-toolbar">
                    <div className="acd-searchinput">
                        <input value={qInput} placeholder="지표명을 검색해주세요"
                            onChange={(e) => setQInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setQ(qInput.trim()); } }} />
                        <button onClick={() => { setPage(1); setQ(qInput.trim()); }} aria-label="검색">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                        </button>
                    </div>
                    <div className={`acd-catdrop${themeOpen ? ' open' : ''}`}>
                        <button className="acd-catdrop-btn" onClick={() => setThemeOpen((v) => !v)}>{theme}<i className="acd-caret" /></button>
                        {themeOpen && <ul className="acd-catdrop-menu">{THEMES.map((c) => <li key={c}><button className={c === theme ? 'sel' : ''} onClick={() => { setTheme(c); setThemeOpen(false); setPage(1); }}>{c}</button></li>)}</ul>}
                    </div>
                    <div className="acd-toolbar-right">
                        <button className="acd-btn-convert" onClick={() => setEditing({ ...EMPTY })}>+ 데이터 작성</button>
                    </div>
                </div>

                <div className="acd-table-wrap">
                    <table className="acd-table">
                        <thead><tr>
                            <th className="acd-th-type">테마</th>
                            <th className="acd-th-title">지표명</th>
                            <th>값</th><th>지역</th><th>연도</th><th>비고</th><th>출처</th><th>관리</th>
                        </tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan={8} className="acd-empty">불러오는 중…</td></tr>}
                            {!loading && data.items.length === 0 && <tr><td colSpan={8} className="acd-empty">데이터가 없습니다. ‘데이터 작성’으로 추가하세요.</td></tr>}
                            {!loading && data.items.map((s) => (
                                <tr key={s.id} onClick={() => setEditing(s)}>
                                    <td><span className="acd-badge" style={{ background: '#23bdbb' }}>{s.theme}</span></td>
                                    <td className="acd-td-title">{s.metric}</td>
                                    <td><b>{s.value_text}</b></td>
                                    <td>{s.region || '—'}</td>
                                    <td>{s.year || '—'}</td>
                                    <td>{s.note || '—'}</td>
                                    <td className="acx-src">{s.source || '—'}</td>
                                    <td className="acx-mgmt">
                                        <button onClick={(e) => { e.stopPropagation(); setEditing(s); }}>수정</button>
                                        <button className="del" onClick={(e) => del(s.id, e)}>삭제</button>
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

            {editing && <StatEditModal row={editing} onClose={() => setEditing(null)} onSave={save} />}
        </AdminLayout>
    );
}

function StatEditModal({ row, onClose, onSave }) {
    const [f, setF] = useState({ ...EMPTY, ...row });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const submit = async () => {
        if (!f.metric.trim()) { alert('지표명을 입력하세요'); return; }
        setSaving(true);
        const ok = await onSave({ ...f, sort_order: Number(f.sort_order) || 0 });
        if (!ok) setSaving(false);
    };
    return (
        <div className="acp-edit-backdrop" onClick={() => !saving && onClose()}>
            <div className="acd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="acd-modal-head">
                    <div><h3>{f.id ? '공공데이터 수정' : '공공데이터 작성'}</h3><p>테마별 핵심 지표</p></div>
                    <button className="acd-modal-x" onClick={() => !saving && onClose()}>×</button>
                </div>
                <div className="acx-form">
                    <div className="acx-form-grid2">
                        <label>테마<select value={f.theme} onChange={(e) => set('theme', e.target.value)}>{THEMES.filter((t) => t !== '전체').map((t) => <option key={t}>{t}</option>)}</select></label>
                        <label>지역<input value={f.region} onChange={(e) => set('region', e.target.value)} /></label>
                    </div>
                    <label>지표명<input value={f.metric} onChange={(e) => set('metric', e.target.value)} placeholder="예: 공공 자전거 보관소" /></label>
                    <div className="acx-form-grid2">
                        <label>표시값<input value={f.value_text} onChange={(e) => set('value_text', e.target.value)} placeholder="예: 1,130대" /></label>
                        <label>연도<input value={f.year} onChange={(e) => set('year', e.target.value)} placeholder="예: 2024" /></label>
                    </div>
                    <div className="acx-form-grid2">
                        <label>비고<input value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="예: 부산 내 3위" /></label>
                        <label>정렬 순서<input type="number" value={f.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></label>
                    </div>
                    <label>출처<input value={f.source} onChange={(e) => set('source', e.target.value)} placeholder="예: data.busan.go.kr" /></label>
                </div>
                <div className="acd-modal-foot">
                    <button className="acd-btn-cancel" disabled={saving} onClick={onClose}>취소</button>
                    <button className="acd-btn-run" disabled={saving} onClick={submit}>{saving ? '저장 중…' : '저장'}</button>
                </div>
            </div>
        </div>
    );
}
