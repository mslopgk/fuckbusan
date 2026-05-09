import { useState, useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MSurveyJoin.css';
import { API_URL } from '../utils/api';

export default function MSurveyJoin({ onNavigate, survey }) {
    const [questions, setQuestions] = useState(survey?.questions || null);
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        if (survey?.questions?.length) {
            setQuestions(survey.questions.map(normalizeQ));
            return;
        }
        const id = survey?.id;
        if (!id) return;
        fetch(`${API_URL}/api/surveys/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.questions?.length) setQuestions(d.questions.map(normalizeQ)); })
            .catch(() => {});
    }, [survey?.id]);

    const qs = questions || [];

    const isAnswered = (q) => {
        const a = answers[q.id];
        if (q.qtype === 'multi') return Array.isArray(a) && a.length > 0;
        if (q.qtype === 'text') return typeof a === 'string' && a.trim().length > 0;
        return a !== undefined && a !== null && a !== '';
    };
    const answeredCount = qs.filter(isAnswered).length;
    const progress = qs.length ? (answeredCount / qs.length) * 100 : 0;

    const setSingle = (qid, value) => setAnswers((prev) => ({ ...prev, [qid]: value }));
    const toggleMulti = (qid, value) =>
        setAnswers((prev) => {
            const cur = prev[qid] || [];
            return { ...prev, [qid]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
        });

    const handleSubmit = async () => {
        const surveyId = survey?.id;
        if (surveyId && qs.length > 0) {
            const mappedAnswers = qs
                .map((q) => ({ question_id: q.id, value: answers[q.id] ?? '' }))
                .filter((a) => a.value !== '' && (Array.isArray(a.value) ? a.value.length > 0 : true));
            const token = localStorage.getItem('access_token');
            await fetch(`${API_URL}/api/surveys/${surveyId}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ answers: mappedAnswers }),
            }).catch(() => {});
        }
        onNavigate && onNavigate('mSurveyDone', survey);
    };

    return (
        <div className="m-survey-join-page">
            <header className="m-join-topbar">
                <h1 className="m-join-title">설문조사</h1>
                <div className="m-join-progress">
                    <div className="m-join-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </header>

            <main className="m-join-content">
                {!questions && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>불러오는 중...</div>
                )}
                {qs.map((q, idx) => (
                    <section key={q.id} className="m-q-block">
                        <h3 className="m-q-title">Q{idx + 1}. {q.text}</h3>

                        {(q.qtype === 'single' || q.qtype === 'agree') && (
                            <div className="m-q-options">
                                {q.options.map((opt) => {
                                    const label = opt.label ?? opt;
                                    const on = answers[q.id] === label;
                                    return (
                                        <button key={label} className={`m-q-option ${on ? 'on' : ''}`} onClick={() => setSingle(q.id, label)} type="button">
                                            <span className={`m-q-check ${on ? 'on' : ''}`}>
                                                {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                            </span>
                                            <span className="m-q-option-label">{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {q.qtype === 'multi' && (
                            <div className="m-q-options">
                                {q.options.map((opt) => {
                                    const label = opt.label ?? opt;
                                    const on = (answers[q.id] || []).includes(label);
                                    return (
                                        <button key={label} className={`m-q-option ${on ? 'on' : ''}`} onClick={() => toggleMulti(q.id, label)} type="button">
                                            <span className={`m-q-check ${on ? 'on' : ''}`}>
                                                {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                            </span>
                                            <span className="m-q-option-label">{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {q.qtype === 'text' && (
                            <div className="m-q-textwrap">
                                <textarea
                                    className="m-q-textarea"
                                    placeholder={q.placeholder || '답변을 입력해주세요.'}
                                    maxLength={q.maxLength || 1300}
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setSingle(q.id, e.target.value)}
                                />
                                <div className="m-q-textcount">{(answers[q.id] || '').length} /{q.maxLength || 1300}</div>
                            </div>
                        )}
                    </section>
                ))}
            </main>

            <footer className="m-join-footer">
                <button className="m-join-prev" onClick={() => onNavigate && onNavigate('mSurveyDetail2', survey)} type="button">이전</button>
                <button className="m-join-next" type="button" onClick={handleSubmit}>다음</button>
            </footer>

            <MobileBottomNav currentView="mSurveyJoin" onNavigate={onNavigate} />
        </div>
    );
}

function normalizeQ(q) {
    return {
        ...q,
        options: q.options?.map((o) => (typeof o === 'string' ? { label: o } : o)) ?? [],
    };
}
