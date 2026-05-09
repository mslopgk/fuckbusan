import React, { useState, useEffect } from 'react';
import './Survey.css';
import { API_URL } from '../utils/api';

const Survey = ({ onBack, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // { QID: value }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                let res = await fetch(`${API_URL}/checklist/comprehensive-survey`);
                if (!res.ok) res = await fetch('/assets/data/survey.json');
                const data = await res.json();
                setQuestions(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to load survey:", err);
                setQuestions([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const [currentStep, setCurrentStep] = useState(0);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentStep]);

    const handleAnswer = (qid, value) => {
        setAnswers(prev => ({ ...prev, [qid]: value }));
    };

    const toggleMultiSelect = (qid, option, max = 3) => {
        setAnswers(prev => {
            const current = prev[qid] || [];
            if (current.includes(option)) {
                return { ...prev, [qid]: current.filter(item => item !== option) };
            } else {
                if (current.length >= max) return prev; // Limit reached
                return { ...prev, [qid]: [...current, option] };
            }
        });
    };

    const checkCurrentStepCompletion = () => {
        if (!questions[currentStep]) return false;
        const q = questions[currentStep];
        const ans = answers[q.id];

        // 1. Check Main Question
        if (q.type === 'multi_select') {
            if (!ans || ans.length === 0) return false;
        } else if (q.type === 'text') {
            // Text required? Let's assume required as per previous logic (or check validation)
            if (!ans || ans.trim() === '') return false;
        } else {
            // Scale
            if (!ans) return false;
        }

        // 2. Check Sub Questions (if visible)
        if (q.subQuestions && q.subQuestions.length > 0) {
            const val = answers[q.id];
            // If Dissatisfied (1 or 2), subquestions are required
            if (val === 1 || val === 2) {
                for (const subQ of q.subQuestions) {
                    if (!answers[subQ.id]) return false;
                }
            }
        }
        return true;
    };

    const isCurrentStepComplete = checkCurrentStepCompletion();

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            onBack();
        }
    };

    const handleSubmit = () => {
        // Final validation
        if (questions.length > 0) {
            console.log("Survey Complete:", answers);
            if (onComplete) onComplete();
        }
    };

    if (loading) return <div>Loading...</div>;
    if (questions.length === 0) return <div>No questions found.</div>;

    // --- Render Helpers ---

    const renderScale = (q) => {
        const options = q.options;
        const selected = answers[q.id];
        const isQ1Q4 = ['Q1', 'Q4'].includes(q.id);

        return (
            <div className="scale-container">
                <div className="scale-track"></div>
                {options.map((opt, idx) => {
                    const val = idx + 1;
                    const showLabel = !isQ1Q4 || (idx === 0 || idx === 2 || idx === 4);
                    return (
                        <div key={idx} className="scale-item" onClick={() => handleAnswer(q.id, val)}>
                            <div className={`scale-circle ${selected === val ? 'selected' : ''}`}></div>
                            {showLabel && <span className="scale-label">{opt}</span>}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderMultiSelect = (q) => {
        const selected = answers[q.id] || [];
        // Q9 Special Grid
        if (q.id === 'Q9') {
            return (
                <div className="q9-grid-container">
                    {q.options.map((opt, idx) => (
                        <div
                            key={idx}
                            className={`q9-btn ${selected.includes(opt) ? 'selected' : ''}`}
                            onClick={() => toggleMultiSelect(q.id, opt)}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            );
        }
        return (
            <div className="multi-select-grid">
                {q.options.map((opt, idx) => (
                    <div
                        key={idx}
                        className={`multi-select-card ${selected.includes(opt) ? 'selected' : ''}`}
                        onClick={() => toggleMultiSelect(q.id, opt)}
                    >
                        <div className={`checkbox ${selected.includes(opt) ? 'checked' : ''}`}>
                            {selected.includes(opt) && <span className="checkmark">✔</span>}
                        </div>
                        <span className="option-text">{opt}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderSubQuestions = (parentQ) => {
        const val = answers[parentQ.id];
        if (parentQ.type === 'scale_5' && (val === 1 || val === 2)) {
            return (
                <div className="sub-questions-area">
                    {parentQ.subQuestions.map(subQ => (
                        <div key={subQ.id} className="sub-question-block">
                            <div className="sub-q-text">{subQ.text.replace(/\*/g, '')}</div>
                            {renderScale(subQ)}
                        </div>
                    ))}
                </div>
            )
        }
        return null;
    };

    const renderText = (q) => {
        return (
            <div className="text-input-container">
                <textarea
                    className="survey-textarea"
                    placeholder={q.placeholder || "내용을 입력해 주세요."}
                    value={answers[q.id] || ''}
                    maxLength={1600}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                />
                <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.875rem', color: '#888' }}>
                    {(answers[q.id] || '').length}/1600
                </div>
            </div>
        );
    };

    // Calculate Progress
    const progressPerc = questions.length > 0 ? Math.round(((currentStep + 1) / questions.length) * 100) : 0;


    return (
        <div className="survey-container">
            {/* Header */}
            <div className="step-header">
                <button onClick={handlePrev} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <main className="step-content">
                <div className="step-top-section">
                    <div className="step-main-title">설문조사</div>
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${progressPerc}%` }}></div>
                    </div>
                </div>

                <div className="step-title">공공디자인 설문에 참여해주세요</div>
                <p className="description">
                    소중한 의견을 바탕으로 공공디자인 품질을 개선하고자 합니다.<br />
                    설문 참여 기간: 2025년 12월 19일 까지
                </p>

                <div className="questions-list">
                    {questions.length > 0 && (() => {
                        const q = questions[currentStep];
                        const isMultiLimit = ['Q2', 'Q6', 'Q7', 'Q9'].includes(q.id);

                        // RefersTo Logic (Q3, Q8)
                        if (q.refersTo) {
                            const refAnswer = answers[q.refersTo] || [];
                            return (
                                <div key={q.id} className="question-item">
                                    <div className="question-text">
                                        <span className="question-number">
                                            {q.id.replace('Q', '')}
                                        </span>
                                        <span>
                                            {q.text} <span className="red-text">(최대 3개)</span>
                                        </span>
                                    </div>

                                    {/* Reference Display */}
                                    <div className="ref-section">
                                        <div className="ref-bar"></div>
                                        <div className="ref-content" style={{ fontFamily: 'GmarketSans', fontWeight: 500 }}>
                                            {refAnswer.length > 0 ? refAnswer.map((a, i) => (
                                                <div key={i} className="ref-item">{a}</div>
                                            )) : <div className="ref-placeholder" style={{ fontWeight: 400, color: '#888' }}>선택된 항목 없음</div>}
                                        </div>
                                    </div>

                                    {renderMultiSelect(q)}
                                </div>
                            );
                        }

                        // Standard Question
                        return (
                            <div key={q.id} className="question-item">
                                <h3 className="question-text">
                                    <span className="question-number">
                                        {q.id.replace('Q', '')}
                                    </span>
                                    <span dangerouslySetInnerHTML={{
                                        __html: q.text + (isMultiLimit ? ' <span class="text-highlight">(최대 3개)</span>' : '')
                                    }} />
                                </h3>

                                {q.type === 'scale_5' && renderScale(q)}
                                {q.type === 'multi_select' && renderMultiSelect(q)}
                                {q.type === 'text' && renderText(q)}

                                {/* Sub Questions */}
                                {q.subQuestions && q.subQuestions.length > 0 && renderSubQuestions(q)}
                            </div>
                        );
                    })()}
                </div>
            </main>

            {/* Footer */}
            <footer className="sticky-footer">
                <button className="btn btn-prev" onClick={handlePrev}>
                    {currentStep === 0 ? "이전" : "이전"}
                </button>
                <button
                    className={`btn btn-next ${isCurrentStepComplete ? 'active' : ''}`}
                    disabled={!isCurrentStepComplete}
                    onClick={handleNext}
                >
                    {currentStep === questions.length - 1 ? "제출하기" : "다음"}
                </button>
            </footer>
        </div>
    );
};

export default Survey;
