import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import './AdminCitizen.css';
import './AdminExtra.css';

/* 진단 관리 (시민/전문가 진단) — ChecklistResult 기반 목록/상세/삭제.
   현재 comingSoon 이던 메뉴 신규 구축. 어드민 디자인 시스템(acd-*) 재사용. */

const API = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/admin/diagnoses`;
const IMG_BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}`;
const TARGET_TABS = ['전체', '시민', '전문가'];
const CATEGORIES = ['전체', '안전', '교통', '주거', '환경', '문화여가', '산업일자리', '교육', '보건', '공공시설', '보도 (공공공간)'];
const SIZE = 10;

const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};
const fmtDate = (s) => (s ? s.replace('T', ' ').slice(0, 16) : '-');
const imgSrc = (u) => (u ? (u.startsWith('http') ? u : `${IMG_BASE}${u}`) : null);

export default function AdminDiagnosisList({ onNavigate }) {
    const [target, setTarget] = useState('전체');
    const [category, setCategory] = useState('전체');
    const [region, setRegion] = useState('');
    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0 });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [catOpen, setCatOpen] = useState(false);
    const [detail, setDetail] = useState(null);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page: String(page), size: String(SIZE), target, category });
            if (region) p.set('region', region);
            if (q) p.set('q', q);
            const d = await fetch(`${API}?${p}`, { headers: auth() }).then((r) => r.json());
            setData(d.items ? d : { items: [], total: 0 });
        } catch { setData({ items: [], total: 0 }); }
        finally { setLoading(false); }
    }, [page, target, category, region, q]);

    useEffect(() => { fetchList(); }, [fetchList]);
    useEffect(() => { fetch(`${API}/stats`, { headers: auth() }).then((r) => r.json()).then(setStats).catch(() => {}); }, []);

    const totalPages = Math.max(1, Math.ceil((data.total || 0) / SIZE));
    const openDetail = async (id) => {
        try { setDetail(await fetch(`${API}/${id}`, { headers: auth() }).then((r) => r.json())); } catch {/*noop*/}
    };
    const del = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('이 진단 기록을 삭제할까요?')) return;
        await fetch(`${API}/${id}`, { method: 'DELETE', headers: auth() });
        fetchList();
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminDiagnosis">
            <div className="acd">
                <div className="acd-head">
                    <h1>진단 관리</h1>
                    <span className="acd-total">총 <b>{(data.total || 0).toLocaleString()}</b>건</span>
                </div>

                <div className="acd-counts acd-counts-4">
                    <div className="acd-count-card"><span className="acd-count-label">전체 진단</span><span className="acd-count-val">총 <b className="accent">{(stats?.total ?? 0).toLocaleString()}</b>건</span></div>
                    <div className="acd-count-card"><span className="acd-count-label">시민 진단</span><span className="acd-count-val">총 <b className="accent">{(stats?.citizen ?? 0).toLocaleString()}</b>건</span></div>
                    <div className="acd-count-card"><span className="acd-count-label">전문가 진단</span><span className="acd-count-val">총 <b className="accent">{(stats?.expert ?? 0).toLocaleString()}</b>건</span></div>
                    <div className="acd-count-card"><span className="acd-count-label">평균 점수</span><span className="acd-count-val"><b className="accent">{stats?.avg_score ?? '-'}</b> / 5</span></div>
                </div>

                <div className="acd-toolbar">
                    <div className="acd-searchinput">
                        <input value={qInput} placeholder="진단 항목(질문기준)을 검색해주세요"
                            onChange={(e) => setQInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setQ(qInput.trim()); } }} />
                        <button onClick={() => { setPage(1); setQ(qInput.trim()); }} aria-label="검색">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                        </button>
                    </div>
                    <div className="acd-tabs">
                        {TARGET_TABS.map((t) => <button key={t} className={`acd-tab${target === t ? ' active' : ''}`} onClick={() => { setTarget(t); setPage(1); }}>{t}</button>)}
                    </div>
                    <div className={`acd-catdrop${catOpen ? ' open' : ''}`}>
                        <button className="acd-catdrop-btn" onClick={() => setCatOpen((v) => !v)}>{category}<i className="acd-caret" /></button>
                        {catOpen && <ul className="acd-catdrop-menu">{CATEGORIES.map((c) => <li key={c}><button className={c === category ? 'sel' : ''} onClick={() => { setCategory(c); setCatOpen(false); setPage(1); }}>{c}</button></li>)}</ul>}
                    </div>
                    <input className="acd-region-input" value={region} placeholder="지역" onChange={(e) => { setRegion(e.target.value); setPage(1); }} />
                </div>

                <div className="acd-table-wrap">
                    <table className="acd-table">
                        <thead><tr>
                            <th className="acd-th-type">대상</th>
                            <th className="acd-th-title">진단 항목</th>
                            <th>대분류</th><th>중분류</th><th>지역</th><th>점수</th><th>만족도</th><th>작성자</th><th>작성일</th><th></th>
                        </tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan={10} className="acd-empty">불러오는 중…</td></tr>}
                            {!loading && data.items.length === 0 && <tr><td colSpan={10} className="acd-empty">데이터가 없습니다.</td></tr>}
                            {!loading && data.items.map((r) => (
                                <tr key={r.result_id} onClick={() => openDetail(r.result_id)}>
                                    <td><span className="acd-badge" style={{ background: r.target === '전문가' ? '#5b2eab' : '#23bdbb' }}>{r.target}</span></td>
                                    <td className="acd-td-title">{r.title || `${r.category} ${r.sub_category}`.trim() || '—'}</td>
                                    <td>{r.category || '—'}</td>
                                    <td>{r.sub_category || '—'}</td>
                                    <td>{r.region || '—'}</td>
                                    <td><b>{r.score ?? '-'}</b></td>
                                    <td>{r.satisfaction || '—'}</td>
                                    <td>{r.author || '익명'}</td>
                                    <td className="acd-td-date">{fmtDate(r.created_at)}</td>
                                    <td><button className="acd-row-del" onClick={(e) => del(r.result_id, e)} aria-label="삭제">🗑</button></td>
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

            {detail && (
                <div className="acd-modal-backdrop" onClick={() => setDetail(null)}>
                    <div className="acd-modal acd-modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="acd-modal-head">
                            <div><h3>진단 상세</h3><p>{detail.target} · {detail.category} / {detail.sub_category}</p></div>
                            <button className="acd-modal-x" onClick={() => setDetail(null)}>×</button>
                        </div>
                        <div className="acx-detail">
                            <div className="acx-drow"><span>진단 항목</span><b>{detail.title || '—'}</b></div>
                            <div className="acx-drow"><span>점수 / 만족도</span><b>{detail.score ?? '-'} / 5 · {detail.satisfaction || '—'}</b></div>
                            <div className="acx-drow"><span>지역</span><b>{detail.region || '—'} {detail.district_code ? `(${detail.district_code})` : ''}</b></div>
                            <div className="acx-drow"><span>작성자</span><b>{detail.author}</b></div>
                            <div className="acx-drow"><span>작성일</span><b>{fmtDate(detail.created_at)}</b></div>
                            <div className="acx-drow col"><span>리뷰</span><p>{detail.review || '—'}</p></div>
                            {imgSrc(detail.image) && <img className="acx-detail-img" src={imgSrc(detail.image)} alt="진단 이미지" />}
                        </div>
                        <div className="acd-modal-foot">
                            <button className="acd-btn-cancel" onClick={(e) => del(detail.result_id, e) || setDetail(null)}>삭제</button>
                            <button className="acd-btn-run" onClick={() => setDetail(null)}>닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
