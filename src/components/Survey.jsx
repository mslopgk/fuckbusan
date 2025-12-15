import React, { useState, useEffect } from 'react';
import './Survey.css';

const Survey = ({ onBack, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({}); // { QID: value }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/assets/data/survey.json')
            .then(res => res.json())
            .then(data => {
                setQuestions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load survey:", err);
                setLoading(false);
            });
    }, []);

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

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            console.log("Survey Complete:", answers);
            if (onComplete) onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            onBack();
        }
    };

    if (loading) return <div>Loading...</div>;
    if (questions.length === 0) return <div>No questions found.</div>;

    const currentQ = questions[currentStep];
    // Logic for disabling next button if required
    const isMainNegative = (answers[currentQ.id] === '매우 불만족' || answers[currentQ.id] === '불만족' || answers[currentQ.id] === '1점' || answers[currentQ.id] <= 2);

    const renderScale = (q) => {
        const options = q.options;
        const selected = answers[q.id];
        const isQ1Q4 = ['Q1', 'Q4'].includes(q.id);

        return (
            <div className="scale-container">
                <div className="scale-track"></div>
                {options.map((opt, idx) => {
                    // Show label logic:
                    // If Q1/Q4: Show only First(0), Middle(2), Last(4).
                    // Else: Show all.
                    const showLabel = !isQ1Q4 || (idx === 0 || idx === 2 || idx === 4);

                    return (
                        <div key={idx} className="scale-item" onClick={() => handleAnswer(q.id, idx + 1)}>
                            <div className={`scale-circle ${selected === idx + 1 ? 'selected' : ''}`}></div>
                            {showLabel && <span className="scale-label">{opt}</span>}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderMultiSelect = (q) => {
        const selected = answers[q.id] || [];

        // Q9 Special Grid Layout (Button only, no checkbox)
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

    const renderReason = (q) => {
        // Find referred question
        const refId = q.refersTo;
        const refAnswer = answers[refId] || []; // Should be array

        return (
            <div className="reason-container">
                {/* Reference Section */}
                <div className="ref-section">
                    <div className="ref-bar"></div>
                    <div className="ref-content">
                        {refAnswer.length > 0 ? refAnswer.map((a, i) => (
                            <div key={i} className="ref-item">{a}</div>
                        )) : <div className="ref-placeholder">선택된 항목 없음</div>}
                    </div>
                </div>
                <div className="question-text-sub">{q.text} <span className="red-text">(최대 3개)</span></div>

                {/* Options */}
                {renderMultiSelect(q)}
            </div>
        );
    };

    // Sub-question Renderer
    const renderSubQuestions = (parentQ) => {
        // Trigger condition: Scale 1 or 2 (Dissatisfied)
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
                    placeholder={q.placeholder || "예: 야간 조명이 어두워 불안했어요 / 인도가 좁아 보행이 불편해요 등"}
                    value={answers[q.id] || ''}
                    maxLength={1600}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    style={{
                        width: '100%',
                        height: '150px',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '15px',
                        resize: 'none',
                        fontFamily: 'Pretendard Variable, sans-serif'
                    }}
                />
                <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '14px', color: '#888' }}>
                    {(answers[q.id] || '').length}/1600
                </div>
            </div>
        );
    };

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
                        <div className="progress-bar-fill" style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}></div>
                    </div>
                </div>

                <div className="step-title">공공디자인 설문에 참여해주세요</div>
                <p className="description">
                    소중한 의견을 바탕으로 공공디자인 품질을 개선하고자 합니다.<br />
                    설문 참여 기간: 2025년 12월 19일 까지
                </p>

                {currentQ.refersTo ? (
                    // Specialized Layout for Reference Questions (Q3, Q8)
                    <div className="reference-question-container">
                        <div className="question-header-row" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <span className="question-number" style={{
                                color: '#fff',
                                backgroundColor: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                fontSize: '14px',
                                fontWeight: 500,
                                marginRight: '12px',
                                flexShrink: 0,
                                marginTop: '4px'
                            }}>
                                {currentQ.id.replace('Q', '')}
                            </span>

                            {/* Reference Display */}
                            <div className="ref-display-group" style={{ flex: 1 }}>
                                <div className="ref-section" style={{ marginBottom: '0' }}>
                                    <div className="ref-bar"></div>
                                    <div className="ref-content" style={{ fontFamily: 'GmarketSans', fontWeight: 500 }}>
                                        {(answers[currentQ.refersTo] || []).length > 0 ? (answers[currentQ.refersTo] || []).map((a, i) => (
                                            <div key={i} className="ref-item">{a}</div>
                                        )) : <div className="ref-placeholder">선택된 항목 없음</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Question Text */}
                        <div className="question-text-sub" style={{
                            fontFamily: 'GmarketSans',
                            fontWeight: 300,
                            fontSize: '20px',
                            color: '#111',
                            marginBottom: '30px',
                            wordBreak: 'keep-all',
                            lineHeight: '1.4'
                        }}>
                            {/* Standard text for refersTo, maybe logic for '(최대 3개)' if needed, present in text usually */}
                            {currentQ.text} <span className="red-text" style={{ fontSize: '16px', fontWeight: 700 }}>(최대 3개)</span>
                        </div>

                        {/* Options */}
                        {renderMultiSelect(currentQ)}
                    </div>
                ) : (
                    // Standard Question Layout
                    <>
                        <h3 className="question-text" style={{
                            fontFamily: 'GmarketSans, sans-serif',
                            fontWeight: 300,
                            display: 'flex',
                            alignItems: 'flex-start'
                        }}>
                            <span className="question-number" style={{
                                color: '#fff',
                                backgroundColor: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                fontSize: '14px',
                                fontWeight: 500,
                                marginRight: '8px',
                                flexShrink: 0,
                                marginTop: '4px'
                            }}>
                                {currentQ.id.replace('Q', '')}
                            </span>
                            {/* Render text with HTML safely */}
                            <span
                                style={{ paddingTop: '0px' }}
                                dangerouslySetInnerHTML={{
                                    __html: currentQ.text + (
                                        ['Q2', 'Q6', 'Q7', 'Q9'].includes(currentQ.id)
                                            ? ' <span class="text-highlight">(최대 3개)</span>'
                                            : ''
                                    )
                                }}
                            />
                        </h3>

                        {currentQ.type === 'scale_5' && renderScale(currentQ)}
                        {currentQ.type === 'multi_select' && renderMultiSelect(currentQ)}
                        {currentQ.type === 'text' && renderText(currentQ)}
                    </>
                )}

                {/* Render Sub Questions if applicable */}
                {currentQ.subQuestions && currentQ.subQuestions.length > 0 && renderSubQuestions(currentQ)}

            </main>

            <footer className="sticky-footer">
                <button className="btn btn-prev" onClick={handlePrev}>이전</button>
                <button
                    className={`btn btn-next ${answers[currentQ.id] ? 'active' : ''}`}
                    onClick={handleNext}
                    disabled={
                        !answers[currentQ.id] ||
                        (isMainNegative && currentQ.subQuestions && currentQ.subQuestions.length > 0 && !currentQ.subQuestions.every(sq => answers[sq.id]))
                    }
                >
                    다음
                </button>
            </footer>
        </div>
    );
};

export default Survey;
