import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import PersonaReport from '../../components/PersonaReport';
import './AdminCitizen.css';

/* 가상시민 생성 관리 (Figma 263:6342/6708/7075)
   RAG로 생성된 페르소나 아코디언 목록 → 펼치면 전체 상세 리포트(공용 PersonaReport).
   각 행: 편집(전 필드 모달) / JSON 내보내기 / 삭제. 상단: 지역+인원 자동 생성. */

const API = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/admin/rag`;
const API_BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}`;
const GUGUN = ['부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구'];
const CAT8 = ['안전', '교통', '주거', '산업일자리', '교육', '환경', '문화여가', '보건'];

const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };
};
const avatarSrc = (u) => (u ? (u.startsWith('http') ? u : `${API_BASE}${u}`) : null);
const periodLabel = (p) => {
    if (!p) return '';
    const m = /^(\d{4})H([12])$/.exec(p);
    return m ? `${m[1]}년 ${m[2] === '1' ? '상반기' : '하반기'}` : `${p}년`;
};
const fmtDate = (s) => (s ? s.slice(0, 10) : '');

function Avatar({ url, initial, size = 44 }) {
    return (
        <span className="acp-avatar" style={{ width: size, height: size }}>
            {url ? <img src={url} alt="" /> : <span>{initial || '시'}</span>}
        </span>
    );
}

export default function AdminCitizenPersonas({ onNavigate }) {
    const [region, setRegion] = useState('');
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openId, setOpenId] = useState(null);
    const [details, setDetails] = useState({});   // id → full persona
    const [genDistrict, setGenDistrict] = useState('부산진구');
    const [genCount, setGenCount] = useState(3);
    const [gen, setGen] = useState(null);          // {busy, msg, err}
    const [editing, setEditing] = useState(null);  // full persona being edited
    const [status, setStatus] = useState(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const url = region ? `${API}/personas?district=${encodeURIComponent(region)}` : `${API}/personas`;
            const r = await fetch(url, { headers: auth() });
            const d = await r.json();
            setList(Array.isArray(d) ? d : []);
        } catch { setList([]); }
        finally { setLoading(false); }
    }, [region]);

    useEffect(() => { refresh(); }, [refresh]);
    useEffect(() => {
        fetch(`${API}/status`, { headers: auth() }).then((r) => r.json()).then(setStatus).catch(() => {});
    }, []);

    const expand = async (id) => {
        if (openId === id) { setOpenId(null); return; }
        setOpenId(id);
        if (!details[id]) {
            try {
                const d = await fetch(`${API}/personas/${id}`, { headers: auth() }).then((r) => r.json());
                setDetails((m) => ({ ...m, [id]: d }));
            } catch { /* noop */ }
        }
    };

    const generate = async () => {
        setGen({ busy: true });
        try {
            const r = await fetch(`${API}/generate-personas`, {
                method: 'POST', headers: auth(),
                body: JSON.stringify({ district: genDistrict, count: Number(genCount) }),
            });
            const d = await r.json();
            if (d.ok) setGen({ msg: `${d.created}명 생성 완료 (${genDistrict})` });
            else setGen({ err: d.error || d.detail || '생성 실패', detail: d.detail });
            refresh();
        } catch (e) { setGen({ err: String(e) }); }
    };

    const removePersona = async (id, name) => {
        if (!window.confirm(`'${name}' 가상시민을 삭제할까요?`)) return;
        await fetch(`${API}/personas/${id}`, { method: 'DELETE', headers: auth() });
        setDetails((m) => { const n = { ...m }; delete n[id]; return n; });
        if (openId === id) setOpenId(null);
        refresh();
    };

    const exportPersona = async (id, name) => {
        let full = details[id];
        if (!full) full = await fetch(`${API}/personas/${id}`, { headers: auth() }).then((r) => r.json());
        const blob = new Blob([JSON.stringify(full, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `가상시민_${name || id}.json`; a.click();
        URL.revokeObjectURL(url);
    };

    const openEdit = async (id) => {
        let full = details[id];
        if (!full) full = await fetch(`${API}/personas/${id}`, { headers: auth() }).then((r) => r.json());
        setEditing(full);
    };

    const onSaved = (updated) => {
        setEditing(null);
        setDetails((m) => ({ ...m, [updated.id]: updated }));
        setList((l) => l.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminCitizenPersonas">
            <div className="acp">
                <div className="acd-head">
                    <h1>가상시민 생성 관리</h1>
                    <span className="acd-total">총 <b>{list.length}</b>명</span>
                </div>

                {/* 자동 생성 + 지역 필터 */}
                <div className="acp-genbar">
                    <div className="acp-genbar-l">
                        <label>지역 필터</label>
                        <select value={region} onChange={(e) => setRegion(e.target.value)}>
                            <option value="">전체 지역</option>
                            {GUGUN.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="acp-genbar-r">
                        <span className="acp-gen-label">지역 RAG 자동 생성</span>
                        <select value={genDistrict} onChange={(e) => setGenDistrict(e.target.value)}>
                            {GUGUN.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={genCount} onChange={(e) => setGenCount(e.target.value)}>
                            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}명</option>)}
                        </select>
                        <button className="acp-gen-btn" disabled={gen?.busy || !status?.llm_ok} onClick={generate}>
                            {gen?.busy ? '생성 중…' : 'RAG 페르소나 생성'}
                        </button>
                        {!status?.llm_ok && <span className="acp-gen-hint">LLM 키 설정 후 활성화</span>}
                    </div>
                </div>
                {gen?.msg && <div className="acp-gen-result ok">✅ {gen.msg}</div>}
                {gen?.err && <div className="acp-gen-result err">⚠️ {gen.err}{gen.detail ? ` — ${JSON.stringify(gen.detail).slice(0, 200)}` : ''}</div>}

                {/* 페르소나 아코디언 목록 */}
                <div className="acp-list">
                    {loading && <p className="acd-empty">불러오는 중…</p>}
                    {!loading && list.length === 0 && <p className="acd-empty">아직 생성된 가상시민이 없습니다. 데이터 관리에서 변환하거나 위에서 자동 생성하세요.</p>}
                    {!loading && list.map((p) => (
                        <div key={p.id} className={`acp-item${openId === p.id ? ' open' : ''}`}>
                            <div className="acp-item-head">
                                <button className="acp-item-main" onClick={() => expand(p.id)}>
                                    <Avatar url={avatarSrc(p.image_url)} initial={p.avatar_initial} />
                                    <div className="acp-item-info">
                                        <div className="acp-item-nameline">
                                            <b>{p.name}</b> <em>{p.age}세 · {p.gender}</em>
                                            <span className="acp-item-tags">{(p.tags || []).slice(0, 3).map((t) => <span key={t}>{t}</span>)}</span>
                                        </div>
                                        <div className="acp-item-meta">
                                            {periodLabel(p.period)} · {fmtDate(p.generated_at)} 생성 · {p.district} · 원본 {p.evidence_count}건
                                        </div>
                                    </div>
                                </button>
                                <div className="acp-item-actions">
                                    <button className="acp-act edit" onClick={() => openEdit(p.id)}>✎ 편집</button>
                                    <button className="acp-act ghost" onClick={() => exportPersona(p.id, p.name)}>JSON 내보내기</button>
                                    <button className="acp-act del" onClick={() => removePersona(p.id, p.name)} aria-label="삭제">🗑</button>
                                    <button className="acp-act chev" onClick={() => expand(p.id)} aria-label="펼치기">{openId === p.id ? '⌃' : '⌄'}</button>
                                </div>
                            </div>
                            {openId === p.id && (
                                <div className="acp-item-body">
                                    {details[p.id]
                                        ? <PersonaReport citizen={details[p.id]} avatarUrl={avatarSrc(details[p.id].image_url)} />
                                        : <p className="acd-empty">상세 불러오는 중…</p>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {editing && <EditModal persona={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
        </AdminLayout>
    );
}

/* ── 전 필드 편집 모달 ── */
const linesToArr = (s) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean);
const arrToLines = (a) => (Array.isArray(a) ? a.join('\n') : '');
const csvToArr = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);

function EditModal({ persona, onClose, onSaved }) {
    const d = persona.detail || {};
    const [f, setF] = useState({
        name: persona.name || '', age: persona.age || 0, gender: persona.gender || '',
        job: d.job || persona.job || '', quote: persona.quote || '',
        tags: (persona.tags || []).join(', '), categories: (persona.categories || []).join(', '),
        body_language: d.body_language || '', interests: Array.isArray(d.interests) ? d.interests.join(', ') : (d.interests || ''),
        concerns: Array.isArray(d.concerns) ? d.concerns.join(', ') : (d.concerns || ''),
        hobbies: Array.isArray(d.hobbies) ? d.hobbies.join(', ') : (d.hobbies || ''),
        motto: d.motto || '', family: d.family || '', dream_life: d.dream_life || '',
        activities: Array.isArray(d.activities) ? d.activities.join(', ') : (d.activities || ''),
        similar_ratio: d.similar_ratio || '', similar_desc: d.similar_desc || '',
        top_issues: arrToLines(d.top_issues), voices: arrToLines(d.voices),
        category_scores: { ...CAT8.reduce((o, k) => ({ ...o, [k]: (d.category_scores || {})[k] || 0 }), {}) },
        participation: { 제안: (d.participation || {})['제안'] || 0, 제보: (d.participation || {})['제보'] || 0, 진단: (d.participation || {})['진단'] || 0, 설문: (d.participation || {})['설문'] || 0 },
        advanced: JSON.stringify({ journey: d.journey || [], policy_signals: d.policy_signals || {} }, null, 2),
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const setScore = (k, v) => setF((p) => ({ ...p, category_scores: { ...p.category_scores, [k]: Number(v) } }));
    const setPart = (k, v) => setF((p) => ({ ...p, participation: { ...p.participation, [k]: Number(v) } }));

    const save = async () => {
        setSaving(true); setErr('');
        let adv = {};
        try { adv = JSON.parse(f.advanced || '{}'); }
        catch { setErr('고급(JSON) 형식 오류 — journey/policy_signals 확인'); setSaving(false); return; }
        const detail = {
            ...persona.detail, job: f.job, body_language: f.body_language,
            interests: f.interests, concerns: f.concerns, hobbies: f.hobbies,
            motto: f.motto, family: f.family, dream_life: f.dream_life, activities: f.activities,
            similar_ratio: f.similar_ratio, similar_desc: f.similar_desc,
            top_issues: linesToArr(f.top_issues), voices: linesToArr(f.voices),
            category_scores: f.category_scores, participation: f.participation,
            journey: adv.journey ?? d.journey ?? [], policy_signals: adv.policy_signals ?? d.policy_signals ?? {},
        };
        const body = {
            name: f.name, age: Number(f.age), gender: f.gender, job: f.job, quote: f.quote,
            tags: csvToArr(f.tags), categories: csvToArr(f.categories), detail,
        };
        try {
            const r = await fetch(`${API}/personas/${persona.id}`, { method: 'PATCH', headers: auth(), body: JSON.stringify(body) });
            if (!r.ok) { setErr(`저장 실패 (${r.status})`); setSaving(false); return; }
            const updated = await r.json();
            onSaved(updated);
        } catch (e) { setErr(String(e)); setSaving(false); }
    };

    return (
        <div className="acp-edit-backdrop" onClick={() => !saving && onClose()}>
            <div className="acp-edit" onClick={(e) => e.stopPropagation()}>
                <div className="acp-edit-head">
                    <h3>가상시민 편집 — {persona.name}</h3>
                    <button onClick={() => !saving && onClose()}>×</button>
                </div>
                <div className="acp-edit-body">
                    <div className="acp-edit-grid4">
                        <label>이름<input value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
                        <label>나이<input type="number" value={f.age} onChange={(e) => set('age', e.target.value)} /></label>
                        <label>성별<input value={f.gender} onChange={(e) => set('gender', e.target.value)} /></label>
                        <label>직업<input value={f.job} onChange={(e) => set('job', e.target.value)} /></label>
                    </div>
                    <label className="acp-edit-full">한 줄 인용(quote)<textarea rows={2} value={f.quote} onChange={(e) => set('quote', e.target.value)} /></label>
                    <div className="acp-edit-grid2">
                        <label>태그 (쉼표)<input value={f.tags} onChange={(e) => set('tags', e.target.value)} /></label>
                        <label>카테고리 (쉼표)<input value={f.categories} onChange={(e) => set('categories', e.target.value)} /></label>
                    </div>
                    <label className="acp-edit-full">시민 체감 언어<textarea rows={2} value={f.body_language} onChange={(e) => set('body_language', e.target.value)} /></label>
                    <div className="acp-edit-grid4">
                        <label>관심사<input value={f.interests} onChange={(e) => set('interests', e.target.value)} /></label>
                        <label>고민<input value={f.concerns} onChange={(e) => set('concerns', e.target.value)} /></label>
                        <label>취미<input value={f.hobbies} onChange={(e) => set('hobbies', e.target.value)} /></label>
                        <label>활동<input value={f.activities} onChange={(e) => set('activities', e.target.value)} /></label>
                    </div>
                    <div className="acp-edit-grid4">
                        <label>가족<input value={f.family} onChange={(e) => set('family', e.target.value)} /></label>
                        <label>좌우명<input value={f.motto} onChange={(e) => set('motto', e.target.value)} /></label>
                        <label>꿈꾸는 생활<input value={f.dream_life} onChange={(e) => set('dream_life', e.target.value)} /></label>
                        <label>유사비율<input value={f.similar_ratio} onChange={(e) => set('similar_ratio', e.target.value)} /></label>
                    </div>
                    <label className="acp-edit-full">유사 시민 설명<input value={f.similar_desc} onChange={(e) => set('similar_desc', e.target.value)} /></label>
                    <div className="acp-edit-grid2">
                        <label>핵심 이슈 TOP (줄바꿈)<textarea rows={3} value={f.top_issues} onChange={(e) => set('top_issues', e.target.value)} /></label>
                        <label>시민 목소리 (줄바꿈)<textarea rows={3} value={f.voices} onChange={(e) => set('voices', e.target.value)} /></label>
                    </div>
                    <div className="acp-edit-sub">카테고리별 관심도 (0~5)</div>
                    <div className="acp-edit-scores">
                        {CAT8.map((k) => (
                            <label key={k}>{k}
                                <input type="number" min={0} max={5} value={f.category_scores[k]} onChange={(e) => setScore(k, e.target.value)} />
                            </label>
                        ))}
                    </div>
                    <div className="acp-edit-sub">공공데이터 참여 비율 (%)</div>
                    <div className="acp-edit-scores">
                        {['제안', '제보', '진단', '설문'].map((k) => (
                            <label key={k}>{k}
                                <input type="number" min={0} max={100} value={f.participation[k]} onChange={(e) => setPart(k, e.target.value)} />
                            </label>
                        ))}
                    </div>
                    <details className="acp-edit-adv">
                        <summary>고급: 여정지도 · 정책신호등 (JSON)</summary>
                        <textarea rows={8} value={f.advanced} onChange={(e) => set('advanced', e.target.value)} />
                    </details>
                    {err && <div className="acp-edit-err">{err}</div>}
                </div>
                <div className="acp-edit-foot">
                    <button className="acd-btn-cancel" disabled={saving} onClick={onClose}>취소</button>
                    <button className="acd-btn-run" disabled={saving} onClick={save}>{saving ? '저장 중…' : '저장'}</button>
                </div>
            </div>
        </div>
    );
}
