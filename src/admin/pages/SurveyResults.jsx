import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/survey_editor.css';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { API_BASE } from '../api';

const PIE_COLORS = ['#16B5B0', '#5B2EAB', '#E6235A', '#F59E0B', '#10B981', '#6366F1'];

function SummaryRadar({ scores }) {
    if (!scores.length) return <div style={{ padding: '20px', color: '#999', textAlign: 'center' }}>응답 데이터가 없습니다.</div>;
    const data = scores.map(s => ({ subject: s.label, value: parseFloat(s.value.toFixed(1)), fullMark: 5 }));
    const legend = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.map(d => (
                <div key={d.subject} style={{ display: 'flex', justifyContent: 'space-between', gap: 32, fontSize: 14 }}>
                    <span style={{ color: '#555' }}>{d.subject}</span>
                    <span style={{ fontWeight: 700, color: '#5B2EAB' }}>{d.value}</span>
                </div>
            ))}
        </div>
    );
    if (data.length < 3) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ flex: '0 0 260px', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#555' }} />
                            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                            <Bar dataKey="value" fill="#5B2EAB" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {legend}
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ flex: '0 0 260px', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#555', fontWeight: 600 }} />
                        <Radar dataKey="value" stroke="#5B2EAB" fill="#5B2EAB" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            {legend}
        </div>
    );
}

function QuestionChart({ q }) {
    const isPie = q.qtype === 'select' || (q.distribution.length <= 5 && q.qtype !== 'text');
    if (q.qtype === 'text') {
        return (
            <div style={{ color: '#666', fontSize: 13 }}>
                {Array.isArray(q.samples) && q.samples.length > 0
                    ? q.samples.map((s, i) => <p key={i} style={{ margin: '4px 0' }}>· {s}</p>)
                    : <p>주관식 응답이 없습니다.</p>}
            </div>
        );
    }
    if (isPie && q.distribution.length >= 2) {
        const data = q.distribution.map(d => ({ name: d.label, value: d.pct }));
        return (
            <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `${v}%`} />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
                    {data.map((d, i) => (
                        <span key={i} style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                            {d.name} {d.value}%
                        </span>
                    ))}
                </div>
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.distribution.map((d) => (
                <div key={d.label} className="dist-row">
                    <span className="label">{d.label}</span>
                    <div className="dist-bar"><div className="dist-bar-fill" style={{ width: `${d.pct}%` }} /></div>
                    <span className="dist-pct">{d.pct}%</span>
                </div>
            ))}
        </div>
    );
}

export default function SurveyResults({ onNavigate, survey }) {
    const [tab, setTab] = useState('results');
    const [viewMode, setViewMode] = useState('summary');
    const [scoreDetailOpen, setScoreDetailOpen] = useState(false);
    const [results, setResults] = useState(null);

    useEffect(() => {
        // survey prop으로 id 받았으면 그걸 쓰고, 없으면 첫 번째 result 설문 자동 로드
        const loadFirstResultSurvey = async () => {
            const list = await fetch(`${API_BASE}/surveys/list?tab=result`).then((r) => r.ok ? r.json() : []).catch(() => []);
            if (Array.isArray(list) && list.length) return list[0].id;
            const all = await fetch(`${API_BASE}/surveys/list`).then((r) => r.ok ? r.json() : []).catch(() => []);
            return Array.isArray(all) && all.length ? all[0].id : null;
        };
        const load = async () => {
            const id = survey?.id || await loadFirstResultSurvey();
            if (!id) {
                setResults({ title: '(설문 없음)', questions: [] });
                return;
            }
            const res = await fetch(`${API_BASE}/surveys/${id}/results`);
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
                fullText: q.text || `Q${idx + 1}`,
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
                <h2 className="content-title-new">{results?.title || '설문관리'}</h2>
                <button
                    className="btn-search-new"
                    style={{ height: 40, padding: '0 24px', background: '#f1f3f5', color: '#333' }}
                    onClick={() => onNavigate && onNavigate('surveyManagement')}
                >
                    ← 목록으로
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div className="survey-tabs" style={{ margin: 0 }}>
                    <button className={`survey-tab ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}>편집</button>
                    <button className={`survey-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>설정</button>
                    <button className={`survey-tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>결과</button>
                </div>

                {tab === 'results' && (
                    <div className="results-toolbar" style={{ margin: 0 }}>
                        <button className={`results-view-btn ${viewMode === 'summary' ? 'on' : ''}`} onClick={() => setViewMode('summary')}>요약보기</button>
                        <button className={`results-view-btn ${viewMode === 'individual' ? 'on' : ''}`} onClick={() => setViewMode('individual')}>개별보기</button>
                        <button className="results-sheets-btn" onClick={() => alert('CSV 다운로드는 준비 중입니다.')}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
                            Sheets 다운받기
                        </button>
                    </div>
                )}
            </div>

            {tab === 'results' && (
                <div className="survey-results-pane">
                    <section className="results-summary-card">
                        <h3 className="results-summary-title">종합결과 ({results?.response_count ?? 0}명 응답)</h3>
                        <SummaryRadar scores={compositeScores} />
                        {compositeScores.length > 0 && (
                            <div style={{ marginTop: 16, textAlign: 'center' }}>
                                <button
                                    className="btn-outline-new"
                                    style={{ fontSize: 13, height: 36, padding: '0 20px' }}
                                    onClick={() => setScoreDetailOpen((v) => !v)}
                                >{scoreDetailOpen ? '접기 ∧' : '자세히보기 ∨'}</button>
                                {scoreDetailOpen && (
                                    <table style={{ width: '100%', marginTop: 14, fontSize: 13, borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <tbody>
                                            {compositeScores.map((s) => (
                                                <tr key={s.key} style={{ borderTop: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '8px 4px', color: '#555' }}>{s.fullText}</td>
                                                    <td style={{ padding: '8px 4px', fontWeight: 700, width: 70, textAlign: 'right' }}>{s.value.toFixed(1)} / 5</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </section>

                    {questionResults.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            등록된 질문이 없습니다.
                        </div>
                    ) : (
                        <div className="question-results-grid">
                            {questionResults.map((q) => (
                                <section key={q.id} className="question-result-card">
                                    <h3 className="question-result-title">{q.title}</h3>
                                    <QuestionChart q={q} />
                                </section>
                            ))}
                        </div>
                    )}
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
