import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin_layout.css';
import '../styles/dashboard_new.css'; // 셸(admin-content-new 등) — lazy 단독 진입 시에도 로드되도록 직접 import
import './AdminCitizen.css';
import './AdminExtra.css';

/* 공공데이터 관리 (Figma 302-28393 목록 / 302-28599·28664 데이터추가).
   목록: 데이터명·지역구분·영역·등록일·메뉴. 등록: 지역구분·단위·기간(다년도)·엑셀 업로드.
   ※ Figma 데이터추가 목업엔 데이터명/영역 필드가 없으나, 목록 컬럼을 채우려면 필수라 폼에 포함. */

const API_BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/public-data/admin`;
const API = `${API_BASE}/stats`;
const BULK_API = `${API_BASE}/stats/bulk`;
const UPLOAD_API = `${API_BASE}/upload-csv`;

const THEMES = ['안전', '교통', '주거', '환경', '문화·여가', '산업·일자리', '교육', '보건·복지'];
const GUGUN = ['전체', '부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구'];
const YEARS = ['2027', '2026', '2025', '2024', '2023', '2022', '2021', '2020'];
const SIZE = 10;

const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};
const fmtDate = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '—');

// [2-3] 엑셀 업로드용 양식 다운로드 — 답변서 정의 컬럼(테마/지역/지표명/표시값/연도/비고/출처/정렬순서)
const EXCEL_COLUMNS = ['테마', '지역', '지표명', '표시값', '연도', '비고', '출처', '정렬순서'];
const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const sample = [
        ['안전', '수영구', '방범용 CCTV', '1234', '2026', '구 전수', 'data.busan.go.kr', '1'],
        ['교통', '부산전체', '교통사고 발생건수', '5678', '2026', '', 'TAAS', '2'],
    ];
    const ws = XLSX.utils.aoa_to_sheet([EXCEL_COLUMNS, ...sample]);
    ws['!cols'] = EXCEL_COLUMNS.map((c) => ({ wch: Math.max(10, c.length + 6) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '공공데이터');
    XLSX.writeFile(wb, '공공데이터_업로드양식.xlsx');
};

export default function AdminPublicData({ onNavigate }) {
    const [mode, setMode] = useState('list'); // list | form
    const [editRow, setEditRow] = useState(null);

    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page: String(page), size: String(SIZE) });
            if (q) p.set('q', q);
            const d = await fetch(`${API}?${p}`, { headers: auth() }).then((r) => r.json());
            setData(d.items ? d : { items: [], total: 0 });
        } catch { setData({ items: [], total: 0 }); }
        finally { setLoading(false); }
    }, [page, q]);
    useEffect(() => { if (mode === 'list') fetchList(); }, [fetchList, mode]);

    const totalPages = Math.max(1, Math.ceil((data.total || 0) / SIZE));
    const del = async (id, e) => {
        e?.stopPropagation();
        if (!window.confirm('이 공공데이터 항목을 삭제할까요?')) return;
        await fetch(`${API}/${id}`, { method: 'DELETE', headers: auth() });
        fetchList();
    };

    const openForm = (row) => { setEditRow(row || null); setMode('form'); };
    const closeForm = () => { setEditRow(null); setMode('list'); };

    if (mode === 'form') {
        return (
            <AdminLayout onNavigate={onNavigate} currentView="adminPublicData">
                <PublicDataForm row={editRow} onCancel={closeForm} onDone={() => { closeForm(); }} onDelete={del} />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminPublicData">
            <div className="acd">
                <div className="acd-head">
                    <h1>공공데이터 관리</h1>
                    <button className="acd-btn-convert" onClick={() => openForm(null)}>공공데이터 등록</button>
                </div>

                <div className="search-box-new" style={{ marginTop: 8 }}>
                    <div className="search-label-new">공공데이터 검색</div>
                    <div className="search-input-wrapper-new">
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="데이터명을 검색해주세요"
                            value={qInput}
                            onChange={(e) => setQInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setQ(qInput.trim()); } }}
                        />
                    </div>
                    <button className="btn-search-new" onClick={() => { setPage(1); setQ(qInput.trim()); }}>검색</button>
                </div>

                <div className="acd-table-wrap">
                    <table className="acd-table">
                        <thead><tr>
                            <th className="acd-th-title">데이터명</th>
                            <th>지역구분</th>
                            <th>영역</th>
                            <th>등록일</th>
                            <th>메뉴</th>
                        </tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan={5} className="acd-empty">불러오는 중…</td></tr>}
                            {!loading && data.items.length === 0 && <tr><td colSpan={5} className="acd-empty">데이터가 없습니다. ‘공공데이터 등록’으로 추가하세요.</td></tr>}
                            {!loading && data.items.map((s) => (
                                <tr key={s.id} onClick={() => openForm(s)}>
                                    <td className="acd-td-title">{s.metric}</td>
                                    <td>{s.region || '—'}</td>
                                    <td>{s.theme || '—'}</td>
                                    <td>{fmtDate(s.created_at)}</td>
                                    <td className="acx-mgmt">
                                        <button onClick={(e) => { e.stopPropagation(); openForm(s); }}>수정</button>
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
        </AdminLayout>
    );
}

/* ===== 데이터추가 (Figma 302-28599/28664) ===== */
function PublicDataForm({ row, onCancel, onDone, onDelete }) {
    const isEdit = !!row?.id;
    const [metric, setMetric] = useState(row?.metric || '');
    const [theme, setTheme] = useState(row?.theme || THEMES[0]);
    const [region, setRegion] = useState(row?.region || '전체');
    const [unit, setUnit] = useState(row?.unit || '');
    const [entries, setEntries] = useState(
        row?.year ? [{ year: String(row.year), value: row.value_text || '' }] : [{ year: YEARS[1], value: '' }],
    );
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);

    const setEntry = (i, k, v) => setEntries((p) => p.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
    const addEntry = () => setEntries((p) => [...p, { year: YEARS[0], value: '' }]);
    const removeEntry = (i) => setEntries((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

    const submit = async () => {
        if (!metric.trim()) { alert('데이터명을 입력하세요.'); return; }
        const validEntries = entries.filter((e) => e.year && String(e.value).trim() !== '');
        if (validEntries.length === 0 && !file) { alert('연도별 값 또는 엑셀 파일을 입력하세요.'); return; }
        setSaving(true);
        try {
            if (validEntries.length > 0) {
                const body = {
                    theme, metric: metric.trim(),
                    region: region === '전체' ? '부산' : region,
                    unit: unit.trim() || null,
                    entries: validEntries.map((e) => ({
                        year: e.year,
                        value: unit.trim() ? `${e.value}${unit.trim()}` : String(e.value),
                    })),
                };
                const r = await fetch(BULK_API, { method: 'POST', headers: auth(), body: JSON.stringify(body) });
                if (!r.ok) { alert('등록 실패 (' + r.status + ')'); setSaving(false); return; }
            }
            if (file) {
                const t = localStorage.getItem('access_token');
                const fd = new FormData();
                fd.append('file', file);
                const r = await fetch(UPLOAD_API, { method: 'POST', headers: t ? { Authorization: `Bearer ${t}` } : {}, body: fd });
                if (!r.ok) {
                    const d = await r.json().catch(() => ({}));
                    alert('엑셀 업로드 실패: ' + (d.detail || r.status));
                    setSaving(false); return;
                }
            }
            onDone();
        } catch (err) {
            alert('오류: ' + String(err?.message || err));
            setSaving(false);
        }
    };

    return (
        <div className="acd">
            <div className="acd-head"><h1>데이터추가</h1></div>

            <div className="acx-form acp-form-card">
                <div className="acx-frow">
                    <span className="acx-flabel">지역구분</span>
                    <select className="acx-finput" value={region} onChange={(e) => setRegion(e.target.value)}>
                        {GUGUN.map((g) => <option key={g} value={g}>{g === '전체' ? '지역선택(전체 / 16개 구군)' : g}</option>)}
                    </select>
                </div>

                <div className="acx-frow">
                    <span className="acx-flabel">데이터명</span>
                    <input className="acx-finput" value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="예: 보행환경 만족도" />
                </div>

                <div className="acx-frow">
                    <span className="acx-flabel">영역</span>
                    <select className="acx-finput" value={theme} onChange={(e) => setTheme(e.target.value)}>
                        {THEMES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                </div>

                <div className="acx-frow">
                    <span className="acx-flabel">단위입력</span>
                    <input className="acx-finput acx-finput-sm" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, 개, 건" />
                </div>

                <div className="acx-frow acx-frow-top">
                    <span className="acx-flabel">기간 설정</span>
                    <div className="acp-entries">
                        {entries.map((e, i) => (
                            <div className="acp-entry-row" key={i}>
                                <select className="acx-finput-sm" value={e.year} onChange={(ev) => setEntry(i, 'year', ev.target.value)}>
                                    {YEARS.map((y) => <option key={y}>{y}</option>)}
                                </select>
                                <input className="acx-finput" value={e.value} onChange={(ev) => setEntry(i, 'value', ev.target.value)} placeholder="데이터를 입력해주세요" />
                                <span className="acp-unit-suffix">{unit.trim()}</span>
                                <button type="button" className="acp-entry-add" onClick={i === entries.length - 1 ? addEntry : () => removeEntry(i)}>
                                    {i === entries.length - 1 ? '+' : '−'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="acx-frow acx-frow-top">
                    <span className="acx-flabel">데이터 파일</span>
                    <div className="acp-file">
                        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        <button type="button" className="acd-btn-ghost" onClick={() => fileRef.current?.click()}>엑셀 업로드</button>
                        <button type="button" className="acd-btn-ghost" onClick={downloadTemplate}>엑셀 양식 다운로드</button>
                        {file && (
                            <span className="acp-file-chip">{file.name}
                                <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}>×</button>
                            </span>
                        )}
                    </div>
                    <p className="acp-file-hint">양식 컬럼: {EXCEL_COLUMNS.join(' / ')}</p>
                </div>
            </div>

            <div className="acp-form-foot">
                {isEdit
                    ? <button className="acd-btn-cancel" disabled={saving} onClick={(e) => onDelete(row.id, e)}>삭제하기</button>
                    : <button className="acd-btn-cancel" disabled={saving} onClick={onCancel}>삭제하기</button>}
                <button className="acd-btn-run" disabled={saving} onClick={submit}>{saving ? '저장 중…' : '등록하기'}</button>
            </div>
        </div>
    );
}
