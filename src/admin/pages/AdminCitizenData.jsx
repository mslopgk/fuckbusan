import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import './AdminCitizen.css';

/* 가상시민데이터 관리 (Figma 263:5660/5864/6075)
   제보·제안·진단·설문 원천 데이터를 조회하고, 선택 → 가상시민 변환(RAG/Minimax 생성).
   디자이너 디자인 + 기존 RAG 엔진 융합. 하단 접이식 '시스템 상태' 패널. */

const API = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/admin/rag`;
const GUGUN = ['부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구'];
const YEARS = ['2026', '2025', '2024'];
const TYPE_TABS = ['전체', '제보', '제안', '설문', '진단'];
const CATEGORIES = ['전체', '안전', '교통', '주거', '환경', '문화여가', '산업일자리', '교육', '보건'];
const PERIODS = [
    { value: '2026H1', label: '2026년 상반기' },
    { value: '2025H2', label: '2025년 하반기' },
    { value: '2025H1', label: '2025년 상반기' },
];
const TYPE_STYLE = {
    제보: { bg: '#542aa3' }, 제안: { bg: '#f74e7e' },
    설문: { bg: '#9aa3ab' }, 진단: { bg: '#2d2d2d' },
};
const SIZE = 10;

const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };
};
const rowKey = (r) => `${r.kind}:${r.id}`;
const fmtDate = (s) => (s ? s.replace('T', ' ').slice(0, 19) : '-');

export default function AdminCitizenData({ onNavigate }) {
    const [region, setRegion] = useState('');
    const [year, setYear] = useState('');
    const [type, setType] = useState('전체');
    const [category, setCategory] = useState('전체');
    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [page, setPage] = useState(1);

    const [data, setData] = useState({ rows: [], total: 0, counts: {} });
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState({});   // key → row
    const [catOpen, setCatOpen] = useState(false);

    const [convertOpen, setConvertOpen] = useState(false);
    const [convDistrict, setConvDistrict] = useState('부산진구');
    const [convPeriod, setConvPeriod] = useState('2025H2');
    const [periodOpen, setPeriodOpen] = useState(false);
    const [converting, setConverting] = useState(false);
    const [convResult, setConvResult] = useState(null);

    // 시스템 상태 패널
    const [sysOpen, setSysOpen] = useState(false);
    const [status, setStatus] = useState(null);
    const [ingesting, setIngesting] = useState(false);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page: String(page), size: String(SIZE), type, category });
            if (region) p.set('region', region);
            if (year) p.set('year', year);
            if (q) p.set('q', q);
            const r = await fetch(`${API}/source-rows?${p}`, { headers: auth() });
            const d = await r.json();
            setData(d.rows ? d : { rows: [], total: 0, counts: {} });
        } catch { setData({ rows: [], total: 0, counts: {} }); }
        finally { setLoading(false); }
    }, [page, type, category, region, year, q]);

    useEffect(() => { fetchRows(); }, [fetchRows]);

    const refreshStatus = useCallback(async () => {
        try {
            const s = await fetch(`${API}/status`, { headers: auth() }).then((r) => r.json());
            setStatus(s);
        } catch { /* noop */ }
    }, []);
    useEffect(() => { refreshStatus(); }, [refreshStatus]);

    const counts = data.counts || {};
    const total = data.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / SIZE));
    const selCount = Object.keys(selected).length;
    const allChecked = data.rows.length > 0 && data.rows.every((r) => selected[rowKey(r)]);

    const toggleRow = (r) => setSelected((m) => {
        const k = rowKey(r); const n = { ...m };
        if (n[k]) delete n[k]; else n[k] = r;
        return n;
    });
    const toggleAll = () => setSelected((m) => {
        const n = { ...m };
        if (allChecked) data.rows.forEach((r) => delete n[rowKey(r)]);
        else data.rows.forEach((r) => { n[rowKey(r)] = r; });
        return n;
    });

    const applySearch = () => { setPage(1); setQ(qInput.trim()); };
    const onTab = (t) => { setType(t); setPage(1); };
    const onCat = (c) => { setCategory(c); setCatOpen(false); setPage(1); };

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(Object.values(selected).length ? Object.values(selected) : data.rows, null, 2)],
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `가상시민데이터_${region || '전체'}_${Date.now()}.json`;
        a.click(); URL.revokeObjectURL(url);
    };

    const openConvert = () => {
        if (selCount === 0) return;
        const rows = Object.values(selected);
        const guess = GUGUN.find((g) => rows.some((r) => (r.region || '').includes(g))) || region || '부산진구';
        setConvDistrict(guess);
        setConvResult(null);
        setConvertOpen(true);
    };

    const runConvert = async () => {
        setConverting(true); setConvResult(null);
        try {
            const body = {
                district: convDistrict, period: convPeriod,
                rows: Object.values(selected).map((r) => ({ kind: r.kind, id: r.id })),
            };
            const r = await fetch(`${API}/convert`, { method: 'POST', headers: auth(), body: JSON.stringify(body) });
            const d = await r.json();
            setConvResult(d.ok === false ? { error: d.error || d.detail || '변환 실패' } : { ok: true, ...d });
        } catch (e) { setConvResult({ error: String(e) }); }
        finally { setConverting(false); }
    };

    const runIngest = async (full) => {
        setIngesting(true);
        try {
            const r = await fetch(`${API}/ingest`, { method: 'POST', headers: auth(), body: JSON.stringify({ full }) });
            const d = await r.json();
            if (!d.started) { setIngesting(false); refreshStatus(); return; }
            const poll = setInterval(async () => {
                const s = await fetch(`${API}/status`, { headers: auth() }).then((x) => x.json()).catch(() => null);
                if (s) setStatus(s);
                if (s && !s.ingest?.running) { clearInterval(poll); setIngesting(false); }
            }, 4000);
        } catch { setIngesting(false); }
    };

    const Card = ({ label, val, accent }) => (
        <div className="acd-count-card">
            <span className="acd-count-label">{label}</span>
            <span className="acd-count-val">총 <b className={accent ? 'accent' : ''}>{(val ?? 0).toLocaleString()}</b>건</span>
        </div>
    );

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminCitizenData">
            <div className="acd">
                <div className="acd-head">
                    <h1>가상시민데이터 관리</h1>
                    <span className="acd-total">총 <b>{total.toLocaleString()}</b>건</span>
                </div>

                {/* 검색 패널 */}
                <div className="acd-searchbox">
                    <div className="acd-search-field">
                        <label>지역검색</label>
                        <select value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }}>
                            <option value="">전체 지역</option>
                            {GUGUN.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="acd-search-field">
                        <label>년도검색</label>
                        <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }}>
                            <option value="">전체 년도</option>
                            {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
                        </select>
                    </div>
                    <button className="acd-search-btn" onClick={() => { setPage(1); fetchRows(); }}>검색</button>
                </div>

                {/* 집계 카드 */}
                <div className="acd-counts">
                    <Card label="전체 건수" val={counts['전체']} accent />
                    <Card label="제보" val={counts['제보']} accent />
                    <Card label="제안" val={counts['제안']} accent />
                    <Card label="진단" val={counts['진단']} accent />
                    <Card label="설문" val={counts['설문']} accent />
                </div>

                {/* 툴바 */}
                <div className="acd-toolbar">
                    <div className="acd-searchinput">
                        <input value={qInput} placeholder="제목/내용을 검색해주세요"
                            onChange={(e) => setQInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }} />
                        <button onClick={applySearch} aria-label="검색">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                        </button>
                    </div>
                    <div className="acd-tabs">
                        {TYPE_TABS.map((t) => (
                            <button key={t} className={`acd-tab${type === t ? ' active' : ''}`} onClick={() => onTab(t)}>{t}</button>
                        ))}
                    </div>
                    <div className={`acd-catdrop${catOpen ? ' open' : ''}`}>
                        <button className="acd-catdrop-btn" onClick={() => setCatOpen((v) => !v)}>
                            {category}<i className="acd-caret" />
                        </button>
                        {catOpen && (
                            <ul className="acd-catdrop-menu">
                                {CATEGORIES.map((c) => (
                                    <li key={c}><button className={c === category ? 'sel' : ''} onClick={() => onCat(c)}>{c}</button></li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="acd-toolbar-right">
                        {selCount > 0 && (
                            <button className="acd-btn-convert" onClick={openConvert}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
                                {selCount}건 가상시민 변환
                            </button>
                        )}
                        <button className="acd-btn-dark" onClick={() => alert('수동 데이터 추가는 다음 단계에서 지원됩니다. 현재는 사용자 제보·제안·진단·설문이 자동 집계됩니다.')}>+ 데이터 추가</button>
                        <button className="acd-btn-dark" onClick={exportJSON}>JSON 내보내기</button>
                    </div>
                </div>

                {/* 테이블 */}
                <div className="acd-table-wrap">
                    <table className="acd-table">
                        <thead>
                            <tr>
                                <th className="acd-th-check"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                                <th className="acd-th-type">유형</th>
                                <th className="acd-th-title">제목 / 내용</th>
                                <th>카테고리</th>
                                <th>제출자</th>
                                <th>연령</th>
                                <th>등록일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={7} className="acd-empty">불러오는 중…</td></tr>}
                            {!loading && data.rows.length === 0 && <tr><td colSpan={7} className="acd-empty">데이터가 없습니다.</td></tr>}
                            {!loading && data.rows.map((r) => {
                                const k = rowKey(r);
                                return (
                                    <tr key={k} className={selected[k] ? 'sel' : ''} onClick={() => toggleRow(r)}>
                                        <td className="acd-td-check"><input type="checkbox" checked={!!selected[k]} readOnly /></td>
                                        <td><span className="acd-badge" style={{ background: (TYPE_STYLE[r.type] || {}).bg }}>{r.type}</span></td>
                                        <td className="acd-td-title">{r.title || '—'}</td>
                                        <td>{r.category || '—'}</td>
                                        <td>{r.author || '익명'}</td>
                                        <td>{r.age || '-'}</td>
                                        <td className="acd-td-date">{fmtDate(r.created_at)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 페이지네이션 */}
                <div className="acd-pager">
                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                        const n = start + i;
                        return n <= totalPages ? (
                            <button key={n} className={n === page ? 'on' : ''} onClick={() => setPage(n)}>{n}</button>
                        ) : null;
                    })}
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                </div>

                {/* 접이식 시스템 상태 */}
                <div className={`acd-sys${sysOpen ? ' open' : ''}`}>
                    <button className="acd-sys-head" onClick={() => setSysOpen((v) => !v)}>
                        <span className="acd-sys-title">
                            <i className="acd-caret" />시스템 상태 (RAG 인덱스 · LLM)
                        </span>
                        <span className="acd-sys-dots">
                            <em className={status?.qdrant_ok ? 'ok' : 'off'} />Qdrant
                            <em className={status?.llm_ok ? 'ok' : 'off'} />LLM
                            <em className={status?.collection_exists ? 'ok' : 'off'} />인덱스 {status?.points ?? 0}
                        </span>
                    </button>
                    {sysOpen && (
                        <div className="acd-sys-body">
                            <div className="acd-sys-grid">
                                <div><span>RAG 의존성</span><b className={status?.deps_ok ? 'ok' : 'off'}>{status?.deps_ok ? '설치됨' : '미설치'}</b></div>
                                <div><span>Qdrant 벡터DB</span><b className={status?.qdrant_ok ? 'ok' : 'off'}>{status?.qdrant_ok ? status.qdrant_host : '미연결'}</b></div>
                                <div><span>LLM</span><b className={status?.llm_ok ? 'ok' : 'off'}>{status?.llm_ok ? status.model : '미설정'}</b></div>
                                <div><span>인덱스</span><b className={status?.collection_exists ? 'ok' : 'off'}>{status?.collection_exists ? `${status.points ?? 0} 포인트` : '없음'}</b></div>
                            </div>
                            <div className="acd-sys-actions">
                                <button disabled={ingesting || !status?.qdrant_ok || status?.ingest?.running} onClick={() => runIngest(false)}>
                                    {(ingesting || status?.ingest?.running) ? '인덱싱 중…' : '증분 인덱싱'}
                                </button>
                                <button className="ghost" disabled={ingesting || !status?.qdrant_ok || status?.ingest?.running} onClick={() => runIngest(true)}>
                                    전체 재인덱싱
                                </button>
                                <button className="ghost" onClick={refreshStatus}>상태 새로고침</button>
                                {!status?.qdrant_ok && <span className="acd-sys-hint">Qdrant 6333 기동 후 활성화 (변환은 LLM만으로도 동작)</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 가상시민 변환 모달 */}
            {convertOpen && (
                <div className="acd-modal-backdrop" onClick={() => !converting && setConvertOpen(false)}>
                    <div className="acd-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="acd-modal-head">
                            <div>
                                <h3>가상시민 변환</h3>
                                <p>선택 데이터 {selCount}건 + 가상시민 카드 생성</p>
                            </div>
                            <button className="acd-modal-x" onClick={() => !converting && setConvertOpen(false)}>×</button>
                        </div>

                        <div className="acd-conv-note">
                            <b>RAG 기반 변환</b>
                            <p>선택한 시민 데이터(제보·제안·진단·설문)를 근거로 AI(RAG/Minimax)가 대표 가상시민을 생성합니다.
                                생성 후 ‘가상시민 생성 관리’에서 모든 항목을 수기로 편집할 수 있어요.</p>
                        </div>

                        <div className="acd-conv-rows">
                            <div className="acd-conv-row">
                                <span>지역</span>
                                <select value={convDistrict} onChange={(e) => setConvDistrict(e.target.value)}>
                                    {GUGUN.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="acd-conv-row"><span>선택 데이터</span><b>{selCount}건</b></div>
                            <div className="acd-conv-row">
                                <span>갱신 주기</span>
                                <div className={`acd-perioddrop${periodOpen ? ' open' : ''}`}>
                                    <button onClick={() => setPeriodOpen((v) => !v)}>
                                        {PERIODS.find((p) => p.value === convPeriod)?.label}<i className="acd-caret" />
                                    </button>
                                    {periodOpen && (
                                        <ul>
                                            {PERIODS.map((p) => (
                                                <li key={p.value}><button className={p.value === convPeriod ? 'sel' : ''}
                                                    onClick={() => { setConvPeriod(p.value); setPeriodOpen(false); }}>{p.label}</button></li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {convResult?.ok && (
                            <div className="acd-conv-result ok">
                                ✅ {convResult.created}명 생성 완료 — {(convResult.personas || []).map((p) => `${p.name}(${p.age}세)`).join(', ')}
                                <button className="acd-conv-goto" onClick={() => onNavigate && onNavigate('adminCitizenPersonas')}>생성 관리에서 보기 ›</button>
                            </div>
                        )}
                        {convResult?.error && <div className="acd-conv-result err">⚠️ {convResult.error}</div>}

                        {selCount < 3 && !convResult?.ok && (
                            <div className="acd-conv-warn">최소 3건 이상 선택 시 더 정확한 가상시민이 생성됩니다. (현재 {selCount}건)</div>
                        )}

                        <div className="acd-modal-foot">
                            <button className="acd-btn-cancel" disabled={converting} onClick={() => setConvertOpen(false)}>
                                {convResult?.ok ? '닫기' : '취소'}
                            </button>
                            {!convResult?.ok && (
                                <button className="acd-btn-run" disabled={converting} onClick={runConvert}>
                                    {converting ? '변환 중…' : '⟳ 변환 실행'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
