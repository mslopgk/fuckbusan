import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin_layout.css';
import '../styles/dashboard_new.css'; // 셸 CSS — lazy 단독 진입 시에도 로드
import './AdminRAGDashboard.css';

const API = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/admin/rag`;
const GUGUN = ['부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구'];

const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function AdminRAGDashboard({ onNavigate }) {
    const [status, setStatus] = useState(null);
    const [sources, setSources] = useState(null);
    const [personas, setPersonas] = useState([]);
    const [busy, setBusy] = useState('');       // 'ingest' | 'gen'
    const [log, setLog] = useState(null);
    const [district, setDistrict] = useState('부산진구');
    const [count, setCount] = useState(3);

    const refresh = useCallback(async () => {
        try {
            const [s, src, ps] = await Promise.all([
                fetch(`${API}/status`, { headers: auth() }).then((r) => r.json()),
                fetch(`${API}/sources`, { headers: auth() }).then((r) => r.json()),
                fetch(`${API}/personas`, { headers: auth() }).then((r) => (r.ok ? r.json() : [])),
            ]);
            setStatus(s); setSources(src); setPersonas(Array.isArray(ps) ? ps : []);
        } catch (e) { setLog({ err: String(e) }); }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const runIngest = async (full) => {
        setBusy('ingest'); setLog(null);
        try {
            const r = await fetch(`${API}/ingest`, { method: 'POST', headers: auth(), body: JSON.stringify({ full }) });
            const d = await r.json();
            if (!d.started) { setLog({ title: '인덱싱', data: d }); setBusy(''); return; }
            // 백그라운드 진행 폴링
            const poll = setInterval(async () => {
                try {
                    const s = await fetch(`${API}/status`, { headers: auth() }).then((x) => x.json());
                    setStatus(s); setSources((prev) => prev);
                    const ing = s.ingest || {};
                    if (!ing.running) {
                        clearInterval(poll);
                        setLog({ title: '인덱싱 완료', data: ing.error ? { error: ing.error } : ing.result });
                        setBusy('');
                        refresh();
                    }
                } catch { /* 폴링 일시 실패 무시 */ }
            }, 4000);
        } catch (e) { setLog({ err: String(e) }); setBusy(''); }
    };

    const genPersonas = async () => {
        setBusy('gen'); setLog(null);
        try {
            const r = await fetch(`${API}/generate-personas`, { method: 'POST', headers: auth(), body: JSON.stringify({ district, count: Number(count) }) });
            const d = await r.json();
            setLog({ title: '페르소나 생성 결과', data: d });
            refresh();
        } catch (e) { setLog({ err: String(e) }); } finally { setBusy(''); }
    };

    const Stat = ({ ok, label, val }) => (
        <div className={`ragd-stat ${ok ? 'ok' : 'off'}`}>
            <span className="ragd-stat-dot" />
            <div><div className="ragd-stat-label">{label}</div><div className="ragd-stat-val">{val}</div></div>
        </div>
    );

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminRAG">
            <div className="ragd">
                <div className="ragd-head">
                    <h1>AI 가상시민 RAG 관리</h1>
                    <button className="ragd-refresh" onClick={refresh}>새로고침</button>
                </div>
                <p className="ragd-sub">공공데이터 + 제보·제안·진단·설문을 취합해 RAG 인덱스를 구축하고, 가상시민 페르소나를 생성합니다. (엔진: shain1912/runway 이식)</p>

                {/* 상태 */}
                <div className="ragd-section">
                    <h2>시스템 상태</h2>
                    <div className="ragd-stats">
                        <Stat ok={status?.deps_ok} label="RAG 의존성" val={status?.deps_ok ? '설치됨' : '미설치'} />
                        <Stat ok={status?.qdrant_ok} label="Qdrant 벡터DB" val={status ? (status.qdrant_ok ? status.qdrant_host : '미연결') : '...'} />
                        <Stat ok={status?.llm_ok} label="LLM 키" val={status?.llm_ok ? status.model : '미설정'} />
                        <Stat ok={status?.collection_exists} label="인덱스" val={status?.collection_exists ? `${status.points ?? 0} 포인트` : '없음'} />
                    </div>
                    {status && (!status.qdrant_ok || !status.llm_ok) && (
                        <div className="ragd-warn">
                            ⚠️ 운영 전제: Qdrant 6333 기동(<code>docker run -p 6333:6333 qdrant/qdrant</code>) + <code>.env</code>에 <code>ANTHROPIC_API_KEY</code>(또는 MINIMAX) 설정 후 백엔드 재기동.
                        </div>
                    )}
                </div>

                {/* 데이터 소스 + 인덱싱 */}
                <div className="ragd-section">
                    <h2>데이터 수집 · 인덱싱</h2>
                    <div className="ragd-sources">
                        {sources?.by_type && Object.entries(sources.by_type).map(([k, v]) => (
                            <div key={k} className="ragd-src"><b>{v.toLocaleString()}</b><span>{k}</span></div>
                        ))}
                        <div className="ragd-src total"><b>{(sources?.total ?? 0).toLocaleString()}</b><span>총 문서</span></div>
                    </div>
                    <div className="ragd-actions">
                        <button disabled={!!busy || status?.ingest?.running || !status?.qdrant_ok} onClick={() => runIngest(false)}>
                            {(busy === 'ingest' || status?.ingest?.running) ? '인덱싱 중…' : '증분 인덱싱'}
                        </button>
                        <button className="ghost" disabled={!!busy || status?.ingest?.running || !status?.qdrant_ok} onClick={() => runIngest(true)}>
                            전체 재인덱싱
                        </button>
                        {!status?.qdrant_ok && <span className="ragd-hint">Qdrant 연결 후 활성화</span>}
                        {status?.ingest?.running && <span className="ragd-hint">백그라운드 인덱싱 진행 중… (최초 모델 다운로드 시 수 분)</span>}
                    </div>
                </div>

                {/* 페르소나 생성 */}
                <div className="ragd-section">
                    <h2>가상시민 페르소나 생성</h2>
                    <div className="ragd-gen">
                        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                            {GUGUN.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={count} onChange={(e) => setCount(e.target.value)}>
                            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}명</option>)}
                        </select>
                        <button disabled={!!busy || !status?.llm_ok} onClick={genPersonas}>
                            {busy === 'gen' ? '생성 중…' : 'RAG 페르소나 생성'}
                        </button>
                        {!status?.llm_ok && <span className="ragd-hint">LLM 키 설정 후 활성화</span>}
                    </div>
                </div>

                {/* 결과 로그 */}
                {log && (
                    <div className="ragd-section">
                        <h2>{log.err ? '오류' : (log.title || '결과')}</h2>
                        <pre className="ragd-log">{log.err || JSON.stringify(log.data, null, 2)}</pre>
                    </div>
                )}

                {/* RAG 생성 페르소나 목록 */}
                <div className="ragd-section">
                    <h2>RAG 생성 페르소나 ({personas.length})</h2>
                    <div className="ragd-personas">
                        {personas.length === 0 && <p className="ragd-empty">아직 RAG로 생성된 페르소나가 없습니다.</p>}
                        {personas.map((p) => (
                            <div key={p.id} className="ragd-persona">
                                <div className="ragd-persona-name">{p.name} <em>{p.age}세 · {p.district}</em></div>
                                <div className="ragd-persona-tags">{(p.tags || []).map((t) => <span key={t}>{t}</span>)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
