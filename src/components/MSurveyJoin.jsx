import { useState } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MSurveyJoin.css';

const QUESTIONS = [
    {
        id: 'Q1',
        title: '사직구장을 방문한 경험이 있습니까?',
        type: 'single',
        options: ['없다', '있다'],
    },
    {
        id: 'Q2',
        title: '사직구장 주변 보행로는 안전하다고 느낍니다.',
        type: 'scale',
        labels: ['전혀\n아니다', '보통', '매우\n그렇다'],
    },
    {
        id: 'Q3',
        title: '차량과 보행자의 동선이 잘 분리되어 있습니다.',
        type: 'scale',
        labels: ['전혀\n아니다', '보통', '매우\n그렇다'],
    },
    {
        id: 'Q4',
        title: '가장 개선이 필요하다고 생각하는 항목을 선택해주세요. (중복가능)',
        type: 'multi',
        options: ['보행로 확장', '차량 통제 및 동선 분리', '야간 조명 개선', '길 안내 시스템', '기타'],
    },
    {
        id: 'Q5',
        title: '사직구장 보행환경 개선을 위해 필요한 사항을 자유롭게 작성해주세요.',
        type: 'text',
        placeholder: '예: 야간 조명이 어두워 불안했어요 / 인도가 좁아 보행이 불편해요 등',
        maxLength: 1300,
    },
];

export default function MSurveyJoin({ onNavigate, survey }) {
    const [answers, setAnswers] = useState({});

    const isAnswered = (q) => {
        const a = answers[q.id];
        if (q.type === 'multi') return Array.isArray(a) && a.length > 0;
        if (q.type === 'text')  return typeof a === 'string' && a.trim().length > 0;
        return a !== undefined && a !== null && a !== '';
    };
    const answeredCount = QUESTIONS.filter(isAnswered).length;
    const progress = (answeredCount / QUESTIONS.length) * 100;

    const setSingle = (qid, value) =>
        setAnswers((prev) => ({ ...prev, [qid]: value }));

    const toggleMulti = (qid, value) =>
        setAnswers((prev) => {
            const current = prev[qid] || [];
            return {
                ...prev,
                [qid]: current.includes(value)
                    ? current.filter((v) => v !== value)
                    : [...current, value],
            };
        });

    const setScale = (qid, value) => setSingle(qid, value);
    const setText = (qid, value) => setSingle(qid, value);

    return (
        <div className="m-survey-join-page">
            <header className="m-join-topbar">
                <h1 className="m-join-title">설문조사</h1>
                <div className="m-join-progress">
                    <div className="m-join-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </header>

            <main className="m-join-content">
                {QUESTIONS.map((q) => (
                    <section key={q.id} className="m-q-block">
                        <h3 className="m-q-title">{q.id}. {q.title}</h3>

                        {q.type === 'single' && (
                            <div className="m-q-options">
                                {q.options.map((opt) => {
                                    const on = answers[q.id] === opt;
                                    return (
                                        <button
                                            key={opt}
                                            className={`m-q-option ${on ? 'on' : ''}`}
                                            onClick={() => setSingle(q.id, opt)}
                                            type="button"
                                        >
                                            <span className={`m-q-check ${on ? 'on' : ''}`}>
                                                {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                            </span>
                                            <span className="m-q-option-label">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {q.type === 'multi' && (
                            <div className="m-q-options">
                                {q.options.map((opt) => {
                                    const on = (answers[q.id] || []).includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            className={`m-q-option ${on ? 'on' : ''}`}
                                            onClick={() => toggleMulti(q.id, opt)}
                                            type="button"
                                        >
                                            <span className={`m-q-check ${on ? 'on' : ''}`}>
                                                {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                            </span>
                                            <span className="m-q-option-label">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {q.type === 'scale' && (
                            <div className="m-scale">
                                <div className="m-scale-track" />
                                {[1, 2, 3, 4, 5].map((v) => {
                                    const sel = answers[q.id] === v;
                                    return (
                                        <button
                                            key={v}
                                            className="m-scale-item"
                                            onClick={() => setScale(q.id, v)}
                                            type="button"
                                            aria-label={`${v}점`}
                                        >
                                            <span className={`m-scale-dot ${sel ? 'on' : ''}`} />
                                        </button>
                                    );
                                })}
                                <div className="m-scale-labels">
                                    <span>{q.labels[0]}</span>
                                    <span>{q.labels[1]}</span>
                                    <span>{q.labels[2]}</span>
                                </div>
                            </div>
                        )}

                        {q.type === 'text' && (
                            <div className="m-q-textwrap">
                                <textarea
                                    className="m-q-textarea"
                                    placeholder={q.placeholder}
                                    maxLength={q.maxLength}
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setText(q.id, e.target.value)}
                                />
                                <div className="m-q-textcount">{(answers[q.id] || '').length} /{q.maxLength}</div>
                            </div>
                        )}
                    </section>
                ))}
            </main>

            <footer className="m-join-footer">
                <button
                    className="m-join-prev"
                    onClick={() => onNavigate && onNavigate('mSurveyDetail2', survey)}
                    type="button"
                >이전</button>
                <button
                    className="m-join-next"
                    onClick={() => onNavigate && onNavigate('mSurveyDone', survey)}
                    type="button"
                >다음</button>
            </footer>

            <MobileBottomNav currentView="mSurveyJoin" onNavigate={onNavigate} />
        </div>
    );
}
