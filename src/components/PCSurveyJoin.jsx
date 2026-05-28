import { useState, useEffect } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCSurveyJoin.css';
import { API_URL } from '../utils/api';

export default function PCSurveyJoin({ onNavigate, survey }) {
    const data = survey || { title: '설문조사' };
    const [questions, setQuestions] = useState(survey?.questions || null);
    const [answers, setAnswers] = useState({});
    const [copied, setCopied] = useState(false);

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

    const setSingle = (qid, val) => setAnswers((prev) => ({ ...prev, [qid]: val }));
    const toggleMulti = (qid, val) =>
        setAnswers((prev) => {
            const cur = prev[qid] || [];
            return { ...prev, [qid]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val] };
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
        onNavigate && onNavigate('pcSurveyDone', data);
    };

    return (
        <UserPCLayout currentView="pcSurveyJoin" onNavigate={onNavigate}>
            <div className="pc-survey-join-page">
                <div className="pc-purple-banner pc-banner-tall">
                    <h1 className="pc-banner-title">{data.title}</h1>
                    <button
                        className="pc-banner-copy-btn"
                        onClick={async () => {
                            const url = window.location.href;
                            try {
                                await navigator.clipboard.writeText(url);
                            } catch {
                                const ta = document.createElement('textarea');
                                ta.value = url;
                                ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0.01;pointer-events:none;';
                                document.body.appendChild(ta);
                                ta.focus();
                                ta.select();
                                try { document.execCommand('copy'); } catch {}
                                document.body.removeChild(ta);
                            }
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                    >
                        {copied
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        }
                        {copied ? '복사됨' : '복사하기'}
                    </button>
                </div>

                <div className="pc-join-card">
                    {!questions && (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>불러오는 중...</div>
                    )}
                    {qs.map((q, idx) => (
                        <div key={q.id} className="pc-question">
                            <p className="pc-question-text">Q{idx + 1}. {q.text}</p>

                            {(q.qtype === 'single' || q.qtype === 'agree') && (
                                <div className="pc-question-options">
                                    {q.options.map((opt) => {
                                        const label = opt.label ?? opt;
                                        const active = answers[q.id] === label;
                                        return (
                                            <label key={label} className={`pc-option-pill ${active ? 'active' : ''}`}>
                                                <input type="checkbox" checked={active} onChange={() => setSingle(q.id, label)} />
                                                {label}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {q.qtype === 'multi' && (
                                <div className="pc-checkbox-grid">
                                    {q.options.map((opt) => {
                                        const label = opt.label ?? opt;
                                        const active = (answers[q.id] || []).includes(label);
                                        return (
                                            <label key={label} className={`pc-option-pill ${active ? 'active' : ''}`}>
                                                <input type="checkbox" checked={active} onChange={() => toggleMulti(q.id, label)} />
                                                {label}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {q.qtype === 'text' && (
                                <div className="pc-textarea-wrapper">
                                    <textarea
                                        value={answers[q.id] || ''}
                                        onChange={(e) => setSingle(q.id, e.target.value.slice(0, q.maxLength || 1300))}
                                        placeholder={q.placeholder || '답변을 입력해주세요.'}
                                    />
                                    <span className="pc-textarea-count">{(answers[q.id] || '').length} /{q.maxLength || 1300}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pc-join-actions">
                    <button className="pc-btn-secondary" onClick={() => onNavigate && onNavigate('pcSurveyDetail', data)}>이전</button>
                    <button className="pc-btn-primary" onClick={handleSubmit}>다음</button>
                </div>
            </div>
        </UserPCLayout>
    );
}

function normalizeQ(q) {
    return {
        ...q,
        options: q.options?.map((o) => (typeof o === 'string' ? { label: o } : o)) ?? [],
    };
}
