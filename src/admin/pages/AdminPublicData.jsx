import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin_layout.css';
import '../styles/dashboard_new.css'; // 셸(admin-content-new 등) — lazy 단독 진입 시에도 로드되도록 직접 import
import './AdminCitizen.css';

/* 공공데이터 관리 — Figma WDC 관리자 캔버스
   목록 302:28393 / 공공데이터 등록(작성01·02/신규) 302:28895·28956·29019 / 데이터추가 302:28599·28664
   버튼 teal #23bdbb (공공데이터 프레임 실측). 지역 컬럼·엑셀 양식 다운로드는 사용자 확정 기능. */

const API_BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/public-data/admin`;
const API = `${API_BASE}/stats`;
const BULK_API = `${API_BASE}/stats/bulk`;
const UPLOAD_API = `${API_BASE}/upload-csv`;
const ASSET = '/figma-assets/admin';

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
const fmtDot = (s) => {
    const d = s ? new Date(s) : new Date();
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};
const adminId = () => {
    try { return JSON.parse(localStorage.getItem('user_info') || '{}').loginId || '관리자'; }
    catch { return '관리자'; }
};

// 엑셀 업로드용 양식 다운로드 — 답변서 정의 컬럼(테마/지역/지표명/표시값/연도/비고/출처/정렬순서)
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

const emptyDraft = () => ({ region: '전체', unit: '', entries: [], file: null });

export default function AdminPublicData({ onNavigate }) {
    const [mode, setMode] = useState('list'); // list | main(공공데이터 등록) | add(데이터추가)
    const [editRow, setEditRow] = useState(null);
    const [meta, setMeta] = useState({ metric: '', theme: THEMES[0] });
    const [draft, setDraft] = useState(emptyDraft());

    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

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

    const openForm = (row) => {
        setEditRow(row || null);
        setMeta({ metric: row?.metric || '', theme: row?.theme || THEMES[0] });
        setDraft(row?.year
            ? { region: row.region || '전체', unit: row.unit || '', file: null,
                entries: [{ year: String(row.year), value: row.value_text || '' }] }
            : emptyDraft());
        setMode('main');
    };
    const closeForm = () => { setEditRow(null); setMode('list'); };

    const submitMain = async () => {
        if (!meta.metric.trim()) { alert('데이터명을 입력하세요.'); return; }
        const validEntries = draft.entries.filter((e) => e.year && String(e.value).trim() !== '');
        if (validEntries.length === 0 && !draft.file) {
            alert('‘데이터 추가’에서 연도별 값 또는 엑셀 파일을 입력하세요.'); return;
        }
        setSaving(true);
        try {
            if (validEntries.length > 0) {
                const body = {
                    theme: meta.theme, metric: meta.metric.trim(),
                    region: draft.region === '전체' ? '부산' : draft.region,
                    unit: draft.unit.trim() || null,
                    entries: validEntries.map((e) => ({
                        year: e.year,
                        value: draft.unit.trim() ? `${e.value}${draft.unit.trim()}` : String(e.value),
                    })),
                };
                const r = await fetch(BULK_API, { method: 'POST', headers: auth(), body: JSON.stringify(body) });
                if (!r.ok) { alert('등록 실패 (' + r.status + ')'); setSaving(false); return; }
            }
            if (draft.file) {
                const t = localStorage.getItem('access_token');
                const fd = new FormData();
                fd.append('file', draft.file);
                const r = await fetch(UPLOAD_API, { method: 'POST', headers: t ? { Authorization: `Bearer ${t}` } : {}, body: fd });
                if (!r.ok) {
                    const d = await r.json().catch(() => ({}));
                    alert('엑셀 업로드 실패: ' + (d.detail || r.status));
                    setSaving(false); return;
                }
            }
            setSaving(false);
            closeForm();
        } catch (err) {
            alert('오류: ' + String(err?.message || err));
            setSaving(false);
        }
    };

    const deleteMain = async () => {
        if (editRow?.id) {
            if (!window.confirm('이 공공데이터 항목을 삭제할까요?')) return;
            await fetch(`${API}/${editRow.id}`, { method: 'DELETE', headers: auth() });
        }
        closeForm();
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminPublicData">
            {mode === 'list' && (
                <PublicDataList
                    data={data} loading={loading} page={page} totalPages={totalPages}
                    qInput={qInput} setQInput={setQInput}
                    onSearch={() => { setPage(1); setQ(qInput.trim()); }}
                    setPage={setPage} openForm={openForm} del={del}
                />
            )}
            {mode === 'main' && (
                <PublicDataMain
                    isEdit={!!editRow?.id} row={editRow} meta={meta} setMeta={setMeta}
                    entryCount={draft.entries.filter((e) => e.year && String(e.value).trim() !== '').length}
                    hasFile={!!draft.file} saving={saving}
                    onAdd={() => setMode('add')} onSubmit={submitMain} onDelete={deleteMain}
                />
            )}
            {mode === 'add' && (
                <PublicDataAdd
                    initial={draft}
                    onApply={(d) => { setDraft(d); setMode('main'); }}
                    onDiscard={() => setMode('main')}
                />
            )}
        </AdminLayout>
    );
}

/* ── 목록 (302:28393) ── */
function PublicDataList({ data, loading, page, totalPages, qInput, setQInput, onSearch, setPage, openForm, del }) {
    return (
        <div className="acd apd">
            <div className="acd-head apd-head">
                <h1>공공데이터 관리</h1>
                <button className="apd-regbtn" onClick={() => openForm(null)}>공공데이터 등록</button>
            </div>

            <div className="apd-search">
                <span className="apd-search-label">공공데이터 검색</span>
                <div className="apd-search-inputwrap">
                    <input
                        type="text"
                        placeholder="설문을 검색해주세요"
                        value={qInput}
                        onChange={(e) => setQInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
                    />
                    <img src={`${ASSET}/aicd_search.png`} alt="" />
                </div>
                <button className="apd-search-btn" onClick={onSearch}>검색</button>
            </div>

            <div className="acd-table-wrap">
                <table className="acd-table apd-table">
                    <thead><tr>
                        <th>데이터명</th>
                        <th className="apd-col-region">지역구분</th>
                        <th className="apd-col-theme">영역</th>
                        <th className="apd-col-date">등록일</th>
                        <th className="apd-col-menu">메뉴</th>
                    </tr></thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} className="acd-empty">불러오는 중…</td></tr>}
                        {!loading && data.items.length === 0 && <tr><td colSpan={5} className="acd-empty">데이터가 없습니다. ‘공공데이터 등록’으로 추가하세요.</td></tr>}
                        {!loading && data.items.map((s) => (
                            <tr key={s.id} onClick={() => openForm(s)}>
                                <td className="acd-td-title">{s.metric}</td>
                                <td>{s.region || '—'}</td>
                                <td>{s.theme || '—'}</td>
                                <td className="apd-col-date acd-td-date">{fmtDate(s.created_at)}</td>
                                <td className="apd-col-menu">
                                    <button onClick={(e) => { e.stopPropagation(); openForm(s); }}>수정</button>
                                    <i>|</i>
                                    <button onClick={(e) => del(s.id, e)}>삭제</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pager page={page} totalPages={totalPages} setPage={setPage} />
        </div>
    );
}

/* ── 공공데이터 등록 (302:28895/28956/29019) ── */
function PublicDataMain({ isEdit, row, meta, setMeta, entryCount, hasFile, saving, onAdd, onSubmit, onDelete }) {
    return (
        <div className="acd apm-wrap">
            <div className="acd-head"><h1>공공데이터 등록</h1></div>
            <hr className="apm-hr" />
            <div className="apm-body">
                <div className="apm-row">
                    <span className="apm-label">데이터명</span>
                    <input className="apd-input apd-w300" value={meta.metric}
                        onChange={(e) => setMeta((m) => ({ ...m, metric: e.target.value }))} />
                </div>
                <div className="apm-row">
                    <span className="apm-label">영역</span>
                    <select className="apd-select apd-w300" value={meta.theme}
                        onChange={(e) => setMeta((m) => ({ ...m, theme: e.target.value }))}>
                        {THEMES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div className="apm-row">
                    <span className="apm-label">편집일</span>
                    <input className="apd-input apd-w300" value={fmtDot()} readOnly />
                </div>
                <div className="apm-row">
                    <span className="apm-label">작성일</span>
                    <input className="apd-input apd-w300" value={fmtDot(row?.created_at)} readOnly />
                </div>
                <div className="apm-row">
                    <span className="apm-label">작성자 ID</span>
                    <input className="apd-input apd-w300" value={adminId()} readOnly />
                </div>
                <div className="apm-row">
                    <span className="apm-label">총 데이터 수</span>
                    <input className="apd-input apm-w238" value={`${entryCount}건${hasFile ? ' + 엑셀' : ''}`} readOnly />
                    <button type="button" className="apm-count-btn" onClick={onAdd}>
                        데이터 추가 <img src={`${ASSET}/pd_plus.png`} alt="" />
                    </button>
                </div>
            </div>
            <hr className="apm-hr" />
            <div className="apm-foot">
                <button type="button" className="apm-download" onClick={downloadTemplate}>공공데이터 다운로드</button>
                <div className="apm-foot-r">
                    <button type="button" className="apm-btn-del" disabled={saving} onClick={onDelete}>글 삭제</button>
                    <button type="button" className="apm-btn-submit" disabled={saving} onClick={onSubmit}>
                        {saving ? '저장 중…' : isEdit ? '수정하기' : '등록하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── 데이터추가 (302:28599/28664) ── */
function PublicDataAdd({ initial, onApply, onDiscard }) {
    const [region, setRegion] = useState(initial.region);
    const [unit, setUnit] = useState(initial.unit);
    const [entries, setEntries] = useState(
        initial.entries.length ? initial.entries : [{ year: YEARS[1], value: '' }],
    );
    const [file, setFile] = useState(initial.file);
    const fileRef = useRef(null);

    const setEntry = (i, k, v) => setEntries((p) => p.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
    const addEntry = () => setEntries((p) => [...p, { year: YEARS[0], value: '' }]);
    const removeEntry = (i) => setEntries((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

    const apply = () => {
        const valid = entries.filter((e) => e.year && String(e.value).trim() !== '');
        if (valid.length === 0 && !file) { alert('연도별 값 또는 엑셀 파일을 입력하세요.'); return; }
        onApply({ region, unit, entries: valid, file });
    };

    return (
        <div className="acd apd-gray">
            <div className="acd-head"><h1>데이터추가</h1></div>

            <div className="apd-card">
                <div className="apd-frow">
                    <span className="apd-flabel">지역구분</span>
                    <select className="apd-select apd-w300" value={region} onChange={(e) => setRegion(e.target.value)}>
                        {GUGUN.map((g) => <option key={g} value={g}>{g === '전체' ? '지역선택(전체 / 16개 구군)' : g}</option>)}
                    </select>
                </div>

                <div className="apd-frow">
                    <span className="apd-flabel">단위입력</span>
                    <input className="apd-input apd-w215" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, 개, 건" />
                </div>

                <div className="apd-frow apd-frow-top">
                    <span className="apd-flabel">기간 설정</span>
                    <div className="apd-entries">
                        {entries.map((e, i) => (
                            <div className="apd-entry-row" key={i}>
                                <select className="apd-select apd-w215" value={e.year} onChange={(ev) => setEntry(i, 'year', ev.target.value)}>
                                    {YEARS.map((y) => <option key={y}>{y}</option>)}
                                </select>
                                <div className="apd-entry-valwrap">
                                    <input className="apd-input" value={e.value} onChange={(ev) => setEntry(i, 'value', ev.target.value)} placeholder="데이터를 입력해주세요" />
                                    {unit.trim() && <span className="apd-entry-unit">{unit.trim()}</span>}
                                </div>
                                <button type="button" className="apd-entry-add" onClick={i === entries.length - 1 ? addEntry : () => removeEntry(i)}>
                                    {i === entries.length - 1 ? '+' : '−'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="apd-frow apd-frow-top">
                    <span className="apd-flabel">데이터 파일</span>
                    <div>
                        <div className="apd-file">
                            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            <button type="button" className="apd-excel-btn" onClick={() => fileRef.current?.click()}>
                                <img src={`${ASSET}/pd_excel.png`} alt="" />엑셀 업로드
                            </button>
                        </div>
                        {file && (
                            <div className="apd-file-chip">
                                {file.name}
                                <button type="button" aria-label="파일 제거"
                                    onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}>
                                    <img src={`${ASSET}/pd_file_x.png`} alt="" />
                                </button>
                            </div>
                        )}
                        <p className="apd-file-hint">양식 컬럼: {EXCEL_COLUMNS.join(' / ')} — ‘공공데이터 등록’ 화면의 ‘공공데이터 다운로드’로 양식을 받을 수 있습니다.</p>
                    </div>
                </div>
            </div>

            <div className="apd-foot">
                <button type="button" className="apd-btn-del" onClick={onDiscard}>삭제하기</button>
                <button type="button" className="apd-btn-submit" onClick={apply}>등록하기</button>
            </div>
        </div>
    );
}

/* ── 페이지네이션 (공용) ── */
export function Pager({ page, totalPages, setPage }) {
    return (
        <div className="acd-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="이전">
                <img src={`${ASSET}/page_prev.png`} alt="" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4)); const n = start + i;
                return n <= totalPages ? <button key={n} className={n === page ? 'on' : ''} onClick={() => setPage(n)}>{n}</button> : null;
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="다음">
                <img src={`${ASSET}/page_next.png`} alt="" />
            </button>
        </div>
    );
}
