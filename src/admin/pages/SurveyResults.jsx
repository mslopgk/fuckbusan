import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/survey_editor.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function SurveyResults({ onNavigate, survey }) {
    const [tab, setTab] = useState('results');
    const [viewMode, setViewMode] = useState('summary');
    const [results, setResults] = useState(null);

    useEffect(() => {
        // survey prop으로 id 받았으면 그걸 쓰고, 없으면 첫 번째 result 설문 자동 로드
        const loadFirstResultSurvey = async () => {
            const list = await fetch(`${API_URL}/api/surveys/list?tab=result`).then((r) => r.ok ? r.json() : []).catch(() => []);
            if (Array.isArray(list) && list.length) return list[0].id;
            const all = await fetch(`${API_URL}/api/surveys/list`).then((r) => r.ok ? r.json() : []).catch(() => []);
            return Array.isArray(all) && all.length ? all[0].id : null;
        };
        const load = async () => {
            const id = survey?.id || await loadFirstResultSurvey();
            if (!id) {
                setResults({ title: '(설문 없음)', questions: [] });
                return;
            }
            const res = await fetch(`${API_URL}/api/surveys/${id}/results`);
            if (res.ok) setResults(await res.json());
            else setResults({ title: '(불러오기 실패)', questions: [] });
        };
        load();
    }, [survey?.id]);

    // 종합 점수: 응답 분포 가중치를 점수화 (단순 평균)
    const compositeScores = (results?.questions || [])
        .filter((q) => Array.isArray(q.distribution) && q.distribution.length > 0)
        .slice(0, 6)
        .map((q, idx) => {
            const total = q.distribution.reduce((s, d) => s + (d.count || 0), 0) || 1;
            // 단계별 점수: 첫 옵션 5점, 마지막 1점 가정 (대부분 만족도 척도)
            const weighted = q.distribution.reduce((s, d, i) => s + (d.count || 0) * (q.distribution.length - i), 0);
            return {
                key: q.id || idx,
                label: q.text?.length > 12 ? `Q${idx + 1}` : (q.text || `Q${idx + 1}`),
                value: q.distribution.length > 1 ? (weighted / total / q.distribution.length * 5) : 0,
            };
        });

    const questionResults = (results?.questions || []).map((q, idx) => ({
        id: q.id,
        title: `Q${idx + 1}. ${q.text || ''}`,
        distribution: Array.isArray(q.distribution) ? q.distribution.map((d) => {
            const total = q.distribution.reduce((s, x) => s + (x.count || 0), 0) || 1;
            return {
                label: d.label,
                pct: Math.round(((d.count || 0) / total) * 100),
            };
        }) : [],
        qtype: q.qtype,
        samples: q.samples,
    }));

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyResults">
            <div className="content-header-new">
                <h2 className="content-title-new">{results?.title || '설문 결과'}</h2>
                <button
                    className="btn-search-new"
                    style={{ height: 40, padding: '0 24px', background: '#f1f3f5', color: '#333' }}
                    onClick={() => onNavigate && onNavigate('surveyManagement')}
                >
                    ← 목록으로
                </button>
            </div>

            <div className="survey-tabs">
                <button className={`survey-tab ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}>편집</button>
                <button className={`survey-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>설정</button>
                <button className={`survey-tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>결과</button>
            </div>

            {tab === 'results' && (
                <div className="survey-results-pane">
                    <div className="results-toolbar">
                        <button
                            className={`chip ${viewMode === 'summary' ? 'on' : ''}`}
                            onClick={() => setViewMode('summary')}
                        >요약보기</button>
                        <button
                            className={`chip ${viewMode === 'individual' ? 'on' : ''}`}
                            onClick={() => setViewMode('individual')}
                        >개별보기</button>
                        <button className="pill-btn" onClick={() => alert('CSV 다운로드는 준비 중입니다.')}>
                            <Download size={14} style={{ marginRight: 4 }} /> Sheets 다운받기
                        </button>
                    </div>

                    <section className="results-summary-card">
                        <h3 className="results-summary-title">종합결과 ({results?.response_count ?? 0}명 응답)</h3>
                        <div className="score-grid">
                            {compositeScores.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#999' }}>
                                    아직 집계할 응답이 없습니다.
                                </div>
                            ) : compositeScores.map((s) => (
                                <div key={s.key} className="score-tile">
                                    <div className="score-tile-label">{s.label}</div>
                                    <div className="score-tile-value">{s.value.toFixed(1)}</div>
                                    <div className="score-bar">
                                        <div className="score-bar-fill" style={{ width: `${(s.value / 5) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {questionResults.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            등록된 질문이 없습니다.
                        </div>
                    ) : questionResults.map((q) => (
                        <section key={q.id} className="question-result-card">
                            <h3 className="question-result-title">{q.title}</h3>
                            {q.qtype === 'text' ? (
                                <div style={{ paddingLeft: 12, color: '#666' }}>
                                    {Array.isArray(q.samples) && q.samples.length > 0
                                        ? q.samples.map((s, i) => <p key={i} style={{ margin: '6px 0' }}>· {s}</p>)
                                        : <p>주관식 응답이 없습니다.</p>}
                                </div>
                            ) : q.distribution.map((d) => (
                                <div key={d.label} className="dist-row">
                                    <span className="label">{d.label}</span>
                                    <div className="dist-bar">
                                        <div className="dist-bar-fill" style={{ width: `${d.pct}%` }} />
                                    </div>
                                    <span className="dist-pct">{d.pct}%</span>
                                </div>
                            ))}
                        </section>
                    ))}
                </div>
            )}

            {tab === 'edit' && (
                <div style={{ padding: 40, color: '#888', textAlign: 'center' }}>
                    편집 탭으로 전환됩니다 — 실제 편집은 "설문 작성"에서 하세요.
                </div>
            )}
            {tab === 'settings' && (
                <div style={{ padding: 40, color: '#888', textAlign: 'center' }}>
                    설정 탭은 "설문 작성 → 설정"에서 변경하세요.
                </div>
            )}
        </AdminLayout>
    );
}
