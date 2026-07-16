import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import PCMapCanvas from '../../components/PCMapCanvas';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import './AdminCitizen.css';
import './AdminExtra.css';
import { API_BASE } from '../api';

/* 진단관리 — 진단 지역 registry (DiagnosisRegion) 기반.
   진단지역 / 진단수 / 진단인원 / 등록일 / 메뉴(수정|삭제) + 추가하기 모달.
   Figma: TCuOzEqNhoLKjhF0reBDks node 302-28253. 디자인 시스템: dashboard_new.css. */

const API = `${API_BASE}/admin/diagnosis-regions`;
const DIAG_API = `${API_BASE}/admin/diagnoses`;
const SIZE = 10;
const DIAG_SIZE = 10;
// 전체 진단기록(ChecklistResult)이 ~7,598건이라 지도에 전부 찍으면 렌더 성능이 나빠짐.
// 최신순 500건만 요청해 좌표가 있는 것만 핀으로 표시 (클러스터링은 PCMapCanvas가 처리).
const MAP_PIN_SIZE = 500;

const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};
const fmtDate = (s) => (s ? s.replace('T', ' ').slice(0, 19) : '-');

const EMPTY = { name: '', district_code: '', latitude: '', longitude: '' };

export default function AdminDiagnosisList({ onNavigate }) {
    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null); // null | {} (new) | {id,...} (edit)

    // 진단 지역(registry) 행 클릭 시 실제 진단기록(ChecklistResult) 드릴다운
    const [drillRegion, setDrillRegion] = useState(null); // null | region name
    const [diagData, setDiagData] = useState({ items: [], total: 0 });
    const [diagLoading, setDiagLoading] = useState(false);
    const [diagPage, setDiagPage] = useState(1);

    // 지도 핀(진단 기록 좌표) — 최초 1회 로드
    const [mapPins, setMapPins] = useState([]);
    const [mapLoading, setMapLoading] = useState(false);

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
        if (!drillRegion) return;
        setDiagLoading(true);
        try {
            const p = new URLSearchParams({ page: String(diagPage), size: String(DIAG_SIZE), region: drillRegion });
            const d = await fetch(`${DIAG_API}?${p}`, { headers: auth() }).then((r) => r.json());
            setDiagData(d && d.items ? d : { items: [], total: 0 });
        } catch { setDiagData({ items: [], total: 0 }); }
        finally { setDiagLoading(false); }
    }, [drillRegion, diagPage]);

    useEffect(() => { fetchDiagnoses(); }, [fetchDiagnoses]);

    // 지도용 핀 — region 필터 없이 최신 MAP_PIN_SIZE건만 가져와 좌표 있는 것만 표시
    useEffect(() => {
        let cancelled = false;
        setMapLoading(true);
        const p = new URLSearchParams({ page: '1', size: String(MAP_PIN_SIZE) });
        fetch(`${DIAG_API}?${p}`, { headers: auth() })
            .then((r) => r.json())
            .then((d) => {
                if (cancelled) return;
                const items = (d && d.items) || [];
                const pins = items
                    .filter((it) => it.lat != null && it.lng != null)
                    .map((it) => ({
                        id: it.result_id,
                        lat: it.lat,
                        lng: it.lng,
                        targetType: it.target,
                        big: it.category,
                        title: it.title || it.category || '진단',
                        region: it.region,
                    }));
                setMapPins(pins);
            })
            .catch(() => { if (!cancelled) setMapPins([]); })
            .finally(() => { if (!cancelled) setMapLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const openRegion = (name) => { setDrillRegion(name); setDiagPage(1); };
    const closeRegion = () => { setDrillRegion(null); setDiagData({ items: [], total: 0 }); };
    const handlePinClick = (pin) => { if (pin.region) openRegion(pin.region); };
    const diagTotalPages = Math.max(1, Math.ceil((diagData.total || 0) / DIAG_SIZE));

    const totalPages = Math.max(1, Math.ceil((data.total || 0) / SIZE));
    const doSearch = () => { setPage(1); setQ(qInput.trim()); };

    const del = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('이 진단 지역을 삭제할까요? (진단 기록 자체는 삭제되지 않습니다)')) return;
        await fetch(`${API}/${id}`, { method: 'DELETE', headers: auth() });
        fetchList();
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
        setEditing(null);
        if (!isEdit) setPage(1);
        fetchList();
        return true;
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminDiagnosis">
            <div className="content-header-new">
                <h2 className="content-title-new">진단관리</h2>
                <button className="btn-search-new" onClick={() => setEditing({ ...EMPTY })}>진단 지역 추가하기</button>
            </div>

            <div className="table-container-new" style={{ marginBottom: 30 }}>
                <div className="content-header-new" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                        진단 지도{!mapLoading && ` (핀 ${mapPins.length.toLocaleString()}건 표시${mapPins.length >= MAP_PIN_SIZE ? ` · 최신 ${MAP_PIN_SIZE}건 기준` : ''})`}
                    </h3>
                </div>
                <div style={{ height: 460, borderRadius: 12, overflow: 'hidden', border: '1px solid #eee', position: 'relative' }}>
                    {mapLoading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', zIndex: 5, background: 'rgba(255,255,255,0.6)' }}>
                            지도 불러오는 중…
                        </div>
                    )}
                    <PCMapCanvas
                        pins={mapPins}
                        onPinClick={handlePinClick}
                        accentColor="#23BDBB"
                        pinVariant="diagnosis"
                        selectedDistrict={drillRegion}
                    />
                </div>
            </div>

            <div className="search-box-new">
                <div className="search-label-new">설문검색</div>
                <div className="search-input-wrapper-new">
                    <input
                        type="text"
                        className="search-input-new"
                        placeholder="설문을 검색해주세요"
                        value={qInput}
                        onChange={(e) => setQInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
                    />
                    <svg
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }}
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
                <button className="btn-search-new" onClick={doSearch}>검색</button>
            </div>

            <div className="table-container-new">
                <table className="admin-table-new">
                    <thead>
                        <tr>
                            <th style={{ width: '45%', textAlign: 'left', paddingLeft: 30 }}>진단지역</th>
                            <th>진단수</th>
                            <th>진단인원</th>
                            <th>등록일</th>
                            <th>메뉴</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '40px 0', color: '#999' }}>불러오는 중…</td></tr>
                        ) : data.items.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '40px 0', color: '#999' }}>등록된 진단 지역이 없습니다.</td></tr>
                        ) : data.items.map((r) => (
                            <tr key={r.id} onClick={() => openRegion(r.name)} style={{ cursor: 'pointer' }}>
                                <td style={{ textAlign: 'left', paddingLeft: 30, color: '#333' }}>{r.name}</td>
                                <td>{r.diagnosis_count}</td>
                                <td>{r.participant_count}</td>
                                <td>{fmtDate(r.created_at)}</td>
                                <td>
                                    <div className="action-btns-new">
                                        <span className="btn-action-text" onClick={(e) => { e.stopPropagation(); setEditing({
                                            id: r.id, name: r.name, district_code: r.district_code || '',
                                            latitude: r.latitude ?? '', longitude: r.longitude ?? '',
                                        }); }}>수정</span> | <span className="btn-action-text" onClick={(e) => del(r.id, e)}>삭제</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination-new">
                    <svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: 'rotate(180deg)', cursor: 'pointer', opacity: page === 1 ? 0.3 : 1 }}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((n) => (
                        <span key={n} className={`page-num-new ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</span>
                    ))}
                    <svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ cursor: 'pointer', opacity: page === totalPages ? 0.3 : 1 }}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </div>
            </div>

            {drillRegion && (
                <div className="table-container-new" style={{ marginTop: 24 }}>
                    <div className="content-header-new">
                        <h2 className="content-title-new">"{drillRegion}" 진단 기록 ({diagData.total ?? 0}건)</h2>
                        <button className="btn-search-new" onClick={closeRegion}>닫기</button>
                    </div>
                    <table className="admin-table-new">
                        <thead>
                            <tr>
                                <th style={{ width: '18%', textAlign: 'left', paddingLeft: 30 }}>진단대상</th>
                                <th>대분류</th>
                                <th>중분류</th>
                                <th>점수</th>
                                <th>작성자</th>
                                <th>작성일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {diagLoading ? (
                                <tr><td colSpan={6} style={{ padding: '40px 0', color: '#999' }}>불러오는 중…</td></tr>
                            ) : diagData.items.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '40px 0', color: '#999' }}>이 지역에 등록된 진단 기록이 없습니다.</td></tr>
                            ) : diagData.items.map((d) => (
                                <tr key={d.result_id}>
                                    <td style={{ textAlign: 'left', paddingLeft: 30, color: '#333' }}>{d.target}</td>
                                    <td>{d.category || '-'}</td>
                                    <td>{d.sub_category || '-'}</td>
                                    <td>{d.score ?? '-'}</td>
                                    <td>{d.author}</td>
                                    <td>{fmtDate(d.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {diagTotalPages > 1 && (
                        <div className="pagination-new">
                            <svg
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transform: 'rotate(180deg)', cursor: 'pointer', opacity: diagPage === 1 ? 0.3 : 1 }}
                                onClick={() => setDiagPage((p) => Math.max(1, p - 1))}
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                            {Array.from({ length: Math.min(diagTotalPages, 10) }, (_, i) => i + 1).map((n) => (
                                <span key={n} className={`page-num-new ${diagPage === n ? 'active' : ''}`} onClick={() => setDiagPage(n)}>{n}</span>
                            ))}
                            <svg
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ cursor: 'pointer', opacity: diagPage === diagTotalPages ? 0.3 : 1 }}
                                onClick={() => setDiagPage((p) => Math.min(diagTotalPages, p + 1))}
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </div>
                    )}
                </div>
            )}

            {editing && <RegionModal row={editing} onClose={() => setEditing(null)} onSave={save} />}
        </AdminLayout>
    );
}

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
