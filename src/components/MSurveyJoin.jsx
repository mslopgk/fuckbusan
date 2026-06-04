import { useState, useEffect, Fragment } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MSurveyJoin.css';
import { API_URL } from '../utils/api';

export default function MSurveyJoin({ onNavigate, survey }) {
    const [questions, setQuestions] = useState(survey?.questions || null);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [validationError, setValidationError] = useState('');

    const surveyId = survey?.id;
    const progressKey = surveyId ? `mSurveyProgress:${surveyId}` : null;

    // Load saved progress from localStorage on mount
    useEffect(() => {
        if (!progressKey) return;
        try {
            const saved = localStorage.getItem(progressKey);
            if (saved) {
                const { answers: savedAnswers } = JSON.parse(saved);
                if (savedAnswers) setAnswers(savedAnswers);
            }
        } catch (_) {}
    }, [progressKey]);

    useEffect(() => {
        if (survey?.questions?.length) {
            setQuestions(survey.questions.map(normalizeQ));
            return;
        }
        const id = surveyId;
        if (!id) return;
        fetch(`${API_URL}/api/surveys/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.questions?.length) setQuestions(d.questions.map(normalizeQ)); })
            .catch(() => {});
    }, [surveyId]);

    const qs = questions || [];

    const isAnswered = (q) => {
        const a = answers[q.id];
        if (q.qtype === 'multi') return Array.isArray(a) && a.length > 0;
        if (q.qtype === 'text') return typeof a === 'string' && a.trim().length > 0;
        return a !== undefined && a !== null && a !== '';
    };
    const answeredCount = qs.filter(isAnswered).length;
    const allAnswered = qs.length > 0 && answeredCount === qs.length;
    const progress = qs.length ? (answeredCount / qs.length) * 100 : 0;

    const saveProgress = (newAnswers) => {
        if (!progressKey) return;
        try {
            localStorage.setItem(progressKey, JSON.stringify({ answers: newAnswers }));
        } catch (_) {}
    };

    const setSingle = (qid, value) => {
        if (validationError) setValidationError('');
        setAnswers((prev) => {
            const next = { ...prev, [qid]: value };
            saveProgress(next);
            return next;
        });
    };
    const toggleMulti = (qid, value) => {
        if (validationError) setValidationError('');
        setAnswers((prev) => {
            const cur = prev[qid] || [];
            const next = { ...prev, [qid]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
            saveProgress(next);
            return next;
        });
    };

    const handleSubmit = async () => {
        if (submitting) return;

        // Validate all questions are answered
        const unanswered = qs.filter((q) => !isAnswered(q));
        if (unanswered.length > 0) {
            setValidationError('모든 질문에 답해주세요.');
            return;
        }
        setValidationError('');
        setSubmitting(true);

        if (surveyId && qs.length > 0) {
            const demographics = survey?.demographics || null;
            const mappedAnswers = qs
                .map((q) => ({ question_id: q.id, value: answers[q.id] ?? '' }))
                .filter((a) => a.value !== '' && (Array.isArray(a.value) ? a.value.length > 0 : true));
            const token = localStorage.getItem('access_token');
            const body = { answers: mappedAnswers };
            if (demographics) body.demographics = demographics;
            await fetch(`${API_URL}/api/surveys/${surveyId}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify(body),
            }).catch(() => {});
            // Clear saved progress after successful submission
            if (progressKey) {
                try { localStorage.removeItem(progressKey); } catch (_) {}
            }
        }
        setSubmitting(false);
        onNavigate && onNavigate('mSurveyDone', survey);
    };

    return (
        <div className="m-survey-join-page">
            <header className="m-join-topbar">
                <div className="m-join-topbar-row">
                    <button
                        className="m-join-back"
                        onClick={() => onNavigate && onNavigate('mSurveyDetail2', survey)}
                        aria-label="뒤로"
                        type="button"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <h1 className="m-join-title">설문조사</h1>
                    <div className="m-join-progress">
                        <div className="m-join-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </header>

            <main className="m-join-content">
                {!questions && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>불러오는 중...</div>
                )}
                {qs.map((q, idx) => (
                    <Fragment key={q.id}>
                    {idx > 0 && <div className="m-q-divider" />}
                    <section className="m-q-block">
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

                        {(q.qtype === 'scale' || q.qtype === 'likert') && (
                            <div style={{ paddingBottom: '36px' }}>
                                <div className="m-scale" role="radiogroup" aria-label={q.text}>
                                    <span className="m-scale-track" />
                                    {[1, 2, 3, 4, 5].map((val) => {
                                        const active = answers[q.id] === val;
                                        return (
                                            <button
                                                key={val}
                                                type="button"
                                                role="radio"
                                                aria-checked={active}
                                                aria-label={`${val}점`}
                                                className="m-scale-item"
                                                onClick={() => setSingle(q.id, val)}
                                            >
                                                <span className={`m-scale-dot${active ? ' on' : ''}`} />
                                            </button>
                                        );
                                    })}
                                    <div className="m-scale-labels">
                                        <span>전혀{'\n'}아니다</span>
                                        <span></span>
                                        <span>보통</span>
                                        <span></span>
                                        <span>매우{'\n'}그렇다</span>
                                    </div>
                                </div>
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
                    </Fragment>
                ))}
            </main>

            {validationError && (
                <div className="m-join-validation-error">{validationError}</div>
            )}

            <footer className="m-join-footer">
                <button className="m-join-prev" onClick={() => onNavigate && onNavigate('mSurveyDetail2', survey)} type="button">이전</button>
                <button className="m-join-next" type="button" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? '제출 중...' : allAnswered ? '제출' : '다음'}
                </button>
            </footer>

            <MobileBottomNav currentView="mSurveyJoin" onNavigate={onNavigate} />
        </div>
    );
}

function normalizeQ(q) {
    const options = q.options?.map((o) => (typeof o === 'string' ? { label: o } : o)) ?? [];
    // 선택지 기반 질문인데 옵션이 비어있으면 text로 폴백 — 그렇지 않으면 사용자가 응답 불가
    const choiceLike = q.qtype === 'single' || q.qtype === 'multi' || q.qtype === 'agree';
    const fallback = choiceLike && options.length === 0;
    return {
        ...q,
        qtype: fallback ? 'text' : q.qtype,
        options,
    };
}
