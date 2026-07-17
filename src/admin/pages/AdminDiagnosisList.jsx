import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import './AdminCitizen.css';
import './AdminExtra.css';
import './AdminDiagnosis.css';
import { API_BASE } from '../api';
import {
    CATEGORIES,
    SUB_BY_CATEGORY,
    DIAGNOSIS_QUESTIONS,
    QUESTIONS_BY_SUB,
} from '../../constants/diagnosis';

/* 진단관리 — Figma(TCuOzEqNhoLKjhF0reBDks) 4프레임 정합.
   302:28253 메인(진단지역 registry 목록) / 302:28743 지역 상세 / 302:29082 기록 상세(시민) / 302:29240 기록 상세(전문가).
   내부 mode state machine: list → region → record (App.jsx 라우팅 불변). */

const API = `${API_BASE}/admin/diagnosis-regions`;
const DIAG_API = `${API_BASE}/admin/diagnoses`;
const SIZE = 10;
const DIAG_SIZE = 10;

const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};
const fmtDateTime = (s) => (s ? s.replace('T', ' ').slice(0, 19) : '-');
const fmtDate = (s) => (s ? s.slice(0, 10).replaceAll('-', '.') : '-');

const EMPTY = { name: '', district_code: '', latitude: '', longitude: '' };

/* ── 페이지네이션 (Figma: < 1 2 3 4 5 > · 피치 30 · active teal) ── */
function Pager({ page, totalPages, onChange }) {
    const nums = Array.from({ length: Math.min(Math.max(totalPages, 1), 10) }, (_, i) => i + 1);
    return (
        <div className="adg-pager">
            <button
                type="button" className="adg-pager-arrow" aria-label="이전"
                disabled={page <= 1} onClick={() => onChange(Math.max(1, page - 1))}
            >
                <img src="/figma-assets/admin/diag_page_prev.png" alt="" />
            </button>
            {nums.map((n) => (
                <span key={n} className={`adg-pager-num ${page === n ? 'active' : ''}`} onClick={() => onChange(n)}>{n}</span>
            ))}
            <button
                type="button" className="adg-pager-arrow" aria-label="다음"
                disabled={page >= totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}
            >
                <img src="/figma-assets/admin/diag_page_next.png" alt="" />
            </button>
        </div>
    );
}

export default function AdminDiagnosisList({ onNavigate }) {
    // list | region | record
    const [mode, setMode] = useState('list');

    // ── 메인 목록 (진단 지역 registry) ──
    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null); // null | {} (new) | {id,...} (edit)

    // ── 지역 상세 ──
    const [region, setRegion] = useState(null);
    const [diagData, setDiagData] = useState({ items: [], total: 0 });
    const [diagLoading, setDiagLoading] = useState(false);
    const [diagPage, setDiagPage] = useState(1);
    const [targetCounts, setTargetCounts] = useState({ citizen: 0, expert: 0 });

    // ── 기록 상세 ──
    const [record, setRecord] = useState(null);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page: String(page), size: String(SIZE) });
            if (q) p.set('q', q);
            const d = await fetch(`${API}?${p}`, { headers: auth() }).then((r) => r.json());
            setData(d && d.items ? d : { items: [], total: 0 });
        } catch { setData({ items: [], total: 0 }); }
        finally { setLoading(false); }
    }, [page, q]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const fetchDiagnoses = useCallback(async () => {
        if (!region) return;
        setDiagLoading(true);
        try {
            const p = new URLSearchParams({ page: String(diagPage), size: String(DIAG_SIZE), region: region.name });
            const d = await fetch(`${DIAG_API}?${p}`, { headers: auth() }).then((r) => r.json());
            setDiagData(d && d.items ? d : { items: [], total: 0 });
        } catch { setDiagData({ items: [], total: 0 }); }
        finally { setDiagLoading(false); }
    }, [region, diagPage]);

    useEffect(() => { fetchDiagnoses(); }, [fetchDiagnoses]);

    // 시민/전문가 진단 건수 (진단 세부 내용 카운트)
    useEffect(() => {
        if (!region) return;
        let cancelled = false;
        const count = (target) => {
            const p = new URLSearchParams({ page: '1', size: '1', region: region.name, target });
            return fetch(`${DIAG_API}?${p}`, { headers: auth() }).then((r) => r.json()).then((d) => d?.total ?? 0).catch(() => 0);
        };
        // 진단대상 NULL 레코드는 백엔드 직렬화에서 '시민' 취급 → 시민 = 전체 - 전문가
        Promise.all([count(''), count('전문가')]).then(([all, expert]) => {
            if (!cancelled) setTargetCounts({ citizen: Math.max(all - expert, 0), expert });
        });
        return () => { cancelled = true; };
    }, [region]);

    // 화면(mode) 전환 시 콘텐츠 스크롤 최상단으로
    useEffect(() => {
        document.querySelector('.admin-content-new')?.scrollTo(0, 0);
    }, [mode]);

    // ESC → 한 단계 뒤로
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            setMode((m) => (m === 'record' ? 'region' : m === 'region' ? 'list' : m));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const openRegion = (row) => { setRegion(row); setDiagPage(1); setMode('region'); };
    const backToList = () => { setMode('list'); setRegion(null); setDiagData({ items: [], total: 0 }); fetchList(); };
    const backToRegion = () => { setMode('region'); setRecord(null); fetchDiagnoses(); };

    const openRecord = async (row) => {
        try {
            const d = await fetch(`${DIAG_API}/${row.result_id}`, { headers: auth() }).then((r) => r.json());
            setRecord(d && d.result_id ? d : row);
        } catch { setRecord(row); }
        setMode('record');
    };

    const totalPages = Math.max(1, Math.ceil((data.total || 0) / SIZE));
    const diagTotalPages = Math.max(1, Math.ceil((diagData.total || 0) / DIAG_SIZE));
    const doSearch = () => { setPage(1); setQ(qInput.trim()); };

    const delRegion = async (row, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('이 진단 지역을 삭제할까요? (진단 기록 자체는 삭제되지 않습니다)')) return;
        await fetch(`${API}/${row.id}`, { method: 'DELETE', headers: auth() });
        if (mode !== 'list') backToList();
        else fetchList();
    };

    const delRecord = async (row, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('이 진단 기록을 삭제할까요?')) return;
        await fetch(`${DIAG_API}/${row.result_id}`, { method: 'DELETE', headers: auth() });
        if (mode === 'record') backToRegion();
        else fetchDiagnoses();
    };

    const save = async (form) => {
        const name = (form.name || '').trim();
        if (!name) { alert('지역명을 입력해주세요'); return false; }
        const body = {
            name,
            district_code: form.district_code?.trim() || null,
            latitude: form.latitude === '' ? null : Number(form.latitude),
            longitude: form.longitude === '' ? null : Number(form.longitude),
        };
        const isEdit = !!form.id;
        const res = await fetch(isEdit ? `${API}/${form.id}` : API, {
            method: isEdit ? 'PUT' : 'POST', headers: auth(), body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.detail || '저장에 실패했습니다.');
            return false;
        }
        const saved = await res.json().catch(() => null);
        setEditing(null);
        if (isEdit && region && saved && saved.id === region.id) setRegion(saved);
        if (!isEdit) setPage(1);
        fetchList();
        return true;
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminDiagnosis">
            {mode === 'list' && (
                <ListView
                    q={qInput} onQ={setQInput} onSearch={doSearch}
                    data={data} loading={loading} page={page} totalPages={totalPages} onPage={setPage}
                    onAdd={() => setEditing({ ...EMPTY })}
                    onRow={openRegion}
                    onEdit={(r, e) => { e.stopPropagation(); setEditing({
                        id: r.id, name: r.name, district_code: r.district_code || '',
                        latitude: r.latitude ?? '', longitude: r.longitude ?? '',
                    }); }}
                    onDel={delRegion}
                />
            )}

            {mode === 'region' && region && (
                <RegionDetail
                    region={region}
                    diagData={diagData} diagLoading={diagLoading}
                    diagPage={diagPage} diagTotalPages={diagTotalPages} onDiagPage={setDiagPage}
                    targetCounts={targetCounts}
                    onBack={backToList}
                    onDelete={() => delRegion(region)}
                    onEdit={() => setEditing({
                        id: region.id, name: region.name, district_code: region.district_code || '',
                        latitude: region.latitude ?? '', longitude: region.longitude ?? '',
                    })}
                    onRecordEdit={openRecord}
                    onRecordDel={delRecord}
                />
            )}

            {mode === 'record' && record && (
                <RecordDetail record={record} onBack={backToRegion} onDelete={() => delRecord(record)} />
            )}

            {editing && <RegionModal row={editing} onClose={() => setEditing(null)} onSave={save} />}
        </AdminLayout>
    );
}

/* ═══════════ 메인 목록 — Figma 302:28253 ═══════════ */
function ListView({ q, onQ, onSearch, data, loading, page, totalPages, onPage, onAdd, onRow, onEdit, onDel }) {
    return (
        <div className="adg-page">
            <div className="adg-head">
                <h2 className="adg-title">진단관리</h2>
                <button className="adg-btn-add" onClick={onAdd}>진단 지역 추가하기</button>
            </div>

            <div className="adg-searchbox">
                <span className="adg-search-label">설문검색</span>
                <div className="adg-search-inputwrap">
                    <input
                        type="text" className="adg-search-input" placeholder="설문을 검색해주세요"
                        value={q} onChange={(e) => onQ(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
                    />
                    <img className="adg-search-icon" src="/figma-assets/admin/diag_search.png" alt="" />
                </div>
                <button className="adg-btn-search" onClick={onSearch}>검색</button>
            </div>

            <table className="adg-table">
                <colgroup>
                    <col style={{ width: 704 }} /><col style={{ width: 92 }} /><col style={{ width: 150 }} />
                    <col style={{ width: 198 }} /><col style={{ width: 156 }} />
                </colgroup>
                <thead>
                    <tr>
                        <th className="adg-col-name">진단지역</th>
                        <th>진단수</th>
                        <th>진단인원</th>
                        <th>등록일</th>
                        <th>메뉴</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr className="adg-empty"><td colSpan={5}>불러오는 중…</td></tr>
                    ) : data.items.length === 0 ? (
                        <tr className="adg-empty"><td colSpan={5}>등록된 진단 지역이 없습니다.</td></tr>
                    ) : data.items.map((r) => (
                        <tr key={r.id} onClick={() => onRow(r)}>
                            <td className="adg-col-name">{r.name}</td>
                            <td>{r.diagnosis_count}</td>
                            <td>{r.participant_count}</td>
                            <td>{fmtDateTime(r.created_at)}</td>
                            <td>
                                <div className="adg-actions">
                                    <span onClick={(e) => onEdit(r, e)}>수정</span><em>|</em><span onClick={(e) => onDel(r, e)}>삭제</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Pager page={page} totalPages={totalPages} onChange={onPage} />
        </div>
    );
}

/* ═══════════ 지역 상세 — Figma 302:28743 ═══════════ */
function RegionDetail({
    region, diagData, diagLoading, diagPage, diagTotalPages, onDiagPage,
    targetCounts, onBack, onDelete, onEdit, onRecordEdit, onRecordDel,
}) {
    const firstImage = diagData.items.find((d) => d.image)?.image || '';
    return (
        <div className="adg-page adg-detail">
            <div className="adg-head">
                <h2 className="adg-title clickable" title="목록으로 (ESC)" onClick={onBack}>진단 상세 관리</h2>
                <div className="adg-head-btns">
                    <button className="adg-btn-del" onClick={onDelete}>글 삭제</button>
                    <button className="adg-btn-edit" onClick={onEdit}>수정하기</button>
                </div>
            </div>
            <hr className="adg-divider top" />

            <div className="adg-form">
                <div className="adg-frow">
                    <span className="adg-flabel">진단일정</span>
                    <div className="adg-fbox">{fmtDate(region.created_at)}</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">진단지역</span>
                    <div className="adg-fbox">{region.name}</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">위도/경도</span>
                    <div className="adg-fbox plain">{region.latitude != null ? `위도 ${region.latitude}` : '위도 -'}</div>
                    <div className="adg-fbox plain">{region.longitude != null ? `경도 ${region.longitude}` : '경도 -'}</div>
                </div>
                <div className="adg-frow top">
                    <span className="adg-flabel">이미지 등록</span>
                    <div className="adg-imgrow">
                        {firstImage && <img className="adg-img-thumb" src={firstImage} alt="진단 이미지" />}
                        <div className="adg-img-add">+</div>
                    </div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">총 진단 수</span>
                    <div className="adg-fbox">{region.diagnosis_count}건</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">총 진단인원</span>
                    <div className="adg-fbox">{region.participant_count}명</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">편집일</span>
                    <div className="adg-fbox plain">{fmtDate(region.created_at)}</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">작성일</span>
                    <div className="adg-fbox plain">{fmtDate(region.created_at)}</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">작성자 ID</span>
                    <div className="adg-fbox plain">관리자</div>
                </div>
            </div>

            <div className="adg-subhead">
                <span className="adg-flabel">진단 세부 내용</span>
                <span className="adg-subcounts">
                    시민진단 <b>{targetCounts.citizen}</b>건 / 전문가 진단 <b>{targetCounts.expert}</b>건
                </span>
            </div>

            <div className="adg-card">
                <table className="adg-card-table">
                    <colgroup>
                        <col style={{ width: 184 }} /><col style={{ width: 96 }} /><col style={{ width: 264 }} /><col style={{ width: 183 }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>공공/시설물</th>
                            <th>참여자(ID)</th>
                            <th>편집일</th>
                            <th>메뉴</th>
                        </tr>
                    </thead>
                    <tbody>
                        {diagLoading ? (
                            <tr className="adg-empty"><td colSpan={4}>불러오는 중…</td></tr>
                        ) : diagData.items.length === 0 ? (
                            <tr className="adg-empty"><td colSpan={4}>이 지역에 등록된 진단 기록이 없습니다.</td></tr>
                        ) : diagData.items.map((d) => (
                            <tr key={d.result_id}>
                                <td>{d.category || d.sub_category || '-'}</td>
                                <td>{d.author}</td>
                                <td>{fmtDateTime(d.created_at)}</td>
                                <td>
                                    <div className="adg-actions">
                                        <span onClick={() => onRecordEdit(d)}>수정</span><em>|</em><span onClick={(e) => onRecordDel(d, e)}>삭제</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pager page={diagPage} totalPages={diagTotalPages} onChange={onDiagPage} />
            </div>
        </div>
    );
}

/* ═══════════ 기록 상세 — Figma 302:29082(시민) / 302:29240(전문가) ═══════════ */
const DOT_LEFTS = [0, 64, 128, 191, 255];
const FACE_LEFTS = [-3, 125, 254];
const FACES = [
    '/figma-assets/admin/diag_face_1.png',
    '/figma-assets/admin/diag_face_2.png',
    '/figma-assets/admin/diag_face_3.png',
];
const CHECK_LEFTS = [0, 127, 255];
const CHECK_LABELS = ['해당없음', '부적합', '적합'];

function RecordDetail({ record, onBack, onDelete }) {
    const [tab, setTab] = useState(record.target === '전문가' ? '전문가' : '시민');
    const [cat, setCat] = useState(record.category || '');
    const [sub, setSub] = useState(record.sub_category || '');
    const [minor, setMinor] = useState('');
    const [review, setReview] = useState(record.review || '');

    let answers = {};
    try { answers = JSON.parse(record.answers || '{}') || {}; } catch { answers = {}; }
    // 데이터 2형: 세션형(answers={"0":n,...}) / 문항형(질문기준 1개 + 점수)
    let questions = (record.sub_category && QUESTIONS_BY_SUB[record.sub_category]) || DIAGNOSIS_QUESTIONS;
    if (Object.keys(answers).length === 0 && record.title) {
        questions = [record.title];
        if (record.score != null) answers = { 0: record.score };
    }
    const isExpert = tab === '전문가';

    // 만족도값(1~5) → 전문가 라벨 인덱스 (해당없음=1~2 / 부적합=3 / 적합=4~5)
    const checkIdx = (v) => (v == null ? -1 : v <= 2 ? 0 : v === 3 ? 1 : 2);

    return (
        <div className="adg-page adg-detail record">
            <div className="adg-head">
                <h2 className="adg-title clickable" title="지역 상세로 (ESC)" onClick={onBack}>진단 상세 관리</h2>
                <div className="adg-tabs">
                    <button className={`adg-tab ${!isExpert ? 'active' : ''}`} onClick={() => setTab('시민')}>시민</button>
                    <button className={`adg-tab ${isExpert ? 'active' : ''}`} onClick={() => setTab('전문가')}>전문가</button>
                </div>
            </div>
            <hr className="adg-divider top" />

            <div className="adg-form">
                <div className="adg-frow">
                    <span className="adg-flabel">진단지역</span>
                    <div className="adg-fbox">{record.region || '-'}</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">위도/경도</span>
                    <div className="adg-fbox plain">{record.lat != null ? `위도 ${record.lat}` : '위도 -'}</div>
                    <div className="adg-fbox plain">{record.lng != null ? `경도 ${record.lng}` : '경도 -'}</div>
                </div>
                <div className="adg-frow top">
                    <span className="adg-flabel">이미지 등록</span>
                    <div className="adg-imgrow">
                        {record.image && <img className="adg-img-thumb" src={record.image} alt="진단 이미지" />}
                        <div className="adg-img-add">+</div>
                    </div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">편집일</span>
                    <div className="adg-fbox plain">{fmtDate(record.created_at)}</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">작성일</span>
                    <div className="adg-fbox plain">{fmtDate(record.created_at)}</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">작성자 ID</span>
                    <div className="adg-fbox plain">{record.author || '-'}</div>
                </div>
                <div className="adg-frow">
                    <span className="adg-flabel">분류</span>
                    <select className="adg-select" value={cat} onChange={(e) => { setCat(e.target.value); setSub(''); }}>
                        <option value="">대분류</option>
                        {[...new Set([...(record.category ? [record.category] : []), ...CATEGORIES])].map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <select className="adg-select" value={sub} onChange={(e) => setSub(e.target.value)}>
                        <option value="">중분류</option>
                        {[...new Set([...(record.sub_category ? [record.sub_category] : []), ...(SUB_BY_CATEGORY[cat] || [])])].map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select className="adg-select" value={minor} onChange={(e) => setMinor(e.target.value)}>
                        <option value="">소분류</option>
                    </select>
                </div>
                <div className="adg-frow top">
                    <span className="adg-flabel">분류</span>
                    <textarea
                        className="adg-textarea" placeholder="추가 의견을 입력해 주세요."
                        value={review} onChange={(e) => setReview(e.target.value)}
                    />
                </div>
                <div className="adg-frow top" style={{ marginTop: 38 }}>
                    <span className="adg-flabel" style={{ paddingTop: 0 }}>만족도 평가</span>
                    <div>
                        <div className="adg-sat-hint">해당 시설물의 만족도를 평가해 주세요.</div>
                        <div className="adg-questions">
                            {questions.map((qt, i) => {
                                const val = answers[i] ?? answers[String(i)] ?? null;
                                const ci = checkIdx(val);
                                return (
                                    <div key={i} className={`adg-q ${isExpert ? 'expert' : ''}`}>
                                        <div className="adg-q-head">
                                            <span className="adg-q-num">{i + 1}</span>
                                            <span className="adg-q-text">{qt}</span>
                                        </div>
                                        <div className="adg-scale">
                                            <div className="adg-scale-track" />
                                            {DOT_LEFTS.map((left, di) => (
                                                <span key={di} className={`adg-scale-dot ${val === di + 1 ? 'on' : ''}`} style={{ left }} />
                                            ))}
                                        </div>
                                        {!isExpert ? (
                                            <div className="adg-faces">
                                                {FACES.map((src, fi) => (
                                                    <img key={fi} src={src} alt="" style={{ left: FACE_LEFTS[fi] }} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="adg-checks">
                                                {CHECK_LABELS.map((label, li) => (
                                                    <div key={label} className={`adg-check ${ci === li ? 'on' : ''}`} style={{ left: CHECK_LEFTS[li] }}>
                                                        <span className="adg-check-circle">
                                                            <img
                                                                src={ci === li
                                                                    ? '/figma-assets/admin/diag_check_white.png'
                                                                    : '/figma-assets/admin/diag_check_grayglyph.png'}
                                                                alt=""
                                                            />
                                                        </span>
                                                        <span className="adg-check-label">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <hr className="adg-divider bottom" />
            <div className="adg-foot">
                <button className="adg-btn-del" onClick={onDelete}>글 삭제</button>
                <button
                    className="adg-btn-edit wide"
                    onClick={() => alert('진단 기록 수정 API는 아직 제공되지 않습니다. (조회 전용)')}
                >
                    수정하기
                </button>
            </div>
        </div>
    );
}

/* ═══════════ 지역 추가/수정 모달 (registry — 기존 구조 유지) ═══════════ */
function RegionModal({ row, onClose, onSave }) {
    const [f, setF] = useState({ ...row });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const submit = async () => {
        setSaving(true);
        const ok = await onSave(f);
        if (!ok) setSaving(false);
    };
    return (
        <div className="acp-edit-backdrop" onClick={() => !saving && onClose()}>
            <div className="acd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="acd-modal-head">
                    <div><h3>{f.id ? '진단 지역 수정' : '진단 지역 추가하기'}</h3></div>
                    <button className="acd-modal-x" onClick={() => !saving && onClose()}>×</button>
                </div>
                <div className="acx-form">
                    <label>진단 지역명 *
                        <input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 부산역" autoFocus />
                    </label>
                    <label>구/군 (선택)
                        <input value={f.district_code} onChange={(e) => set('district_code', e.target.value)} placeholder="예: 동구" />
                    </label>
                    <div className="acx-form-grid2">
                        <label>위도 (선택)
                            <input value={f.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="예: 35.1150" inputMode="decimal" />
                        </label>
                        <label>경도 (선택)
                            <input value={f.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="예: 129.0420" inputMode="decimal" />
                        </label>
                    </div>
                </div>
                <div className="acd-modal-foot">
                    <button className="acd-btn-cancel" disabled={saving} onClick={onClose}>취소</button>
                    <button className="acd-btn-run" disabled={saving} onClick={submit}>{saving ? '저장 중…' : '저장'}</button>
                </div>
            </div>
        </div>
    );
}
