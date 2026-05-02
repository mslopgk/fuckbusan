import { useState } from 'react';
import { Download } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/survey_editor.css';

const COMPOSITE_SCORES = [
    { key: 'info', label: '정보제공성', value: 1.7 },
    { key: 'safety', label: '안전성', value: 3.8 },
    { key: 'inclusion', label: '포용성', value: 3.8 },
    { key: 'mobility', label: '이동성', value: 4.2 },
    { key: 'aesthetic', label: '심미성', value: 3.5 },
    { key: 'access', label: '접근성', value: 2.3 },
];

const QUESTION_RESULTS = [
    {
        id: 1,
        title: 'Q1. 사직구장 주변 보행로 안전',
        distribution: [
            { label: '매우만족', pct: 37 },
            { label: '조금만족', pct: 55 },
            { label: '보통', pct: 6 },
            { label: '불만족', pct: 2 },
        ],
    },
    {
        id: 2,
        title: 'Q2. 사직구장 주변 차량과 보행자도로의 분리',
        distribution: [
            { label: '매우만족', pct: 28 },
            { label: '조금만족', pct: 45 },
            { label: '보통', pct: 18 },
            { label: '불만족', pct: 9 },
        ],
    },
    {
        id: 3,
        title: 'Q3. 가장 개선이 필요한 항목',
        distribution: [
            { label: '조명', pct: 42 },
            { label: 'CCTV', pct: 31 },
            { label: '보행로', pct: 18 },
            { label: '기타', pct: 9 },
        ],
    },
];

export default function SurveyResults({ onNavigate }) {
    const [tab, setTab] = useState('results');
    const [viewMode, setViewMode] = useState('summary');

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyResults">
            <div className="content-header-new">
                <h2 className="content-title-new">학생의 학교 외 생활활동 조사</h2>
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
                        <h3 className="results-summary-title">종합결과</h3>
                        <div className="score-grid">
                            {COMPOSITE_SCORES.map((s) => (
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

                    {QUESTION_RESULTS.map((q) => (
                        <section key={q.id} className="question-result-card">
                            <h3 className="question-result-title">{q.title}</h3>
                            {q.distribution.map((d) => (
                                <div key={d.label} className="dist-row">
                                    <span className="label">{d.label}</span>
                                    <div className="dist-bar">
                                        <div className="dist-bar-fill" style={{ width: `${d.pct}%` }} />
                                    </div>
                                    <span className="dist-pct">{d.pct}%</span>
                                </div>
                            ))}
                            <button
                                className="question-detail-link"
                                onClick={() => alert('상세 결과는 준비 중입니다.')}
                            >
                                자세히보기 →
                            </button>
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
