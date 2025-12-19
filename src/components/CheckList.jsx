import React, { useState, useEffect } from 'react';
import './CheckList.css';

const CheckList = ({ onPrev, onNext, questions, color = '#E6235A', progressBarColor, diagnosisMode }) => {
    // Determine if expert mode
    const isExpert = diagnosisMode === 'expert';

    console.log("CheckList rendered with questions:", questions);
    if (!Array.isArray(questions)) {
        console.error("CheckList: questions is not an array!", questions);
        return <div>Error: Invalid questions data.</div>;
    }
    const [scrolled, setScrolled] = useState(false);
    // State to store ratings keys are index of question, value is rating (1-5 for general, 1-3 for expert)
    const [ratings, setRatings] = useState({});

    const [currentStep, setCurrentStep] = useState(0);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentStep]);

    // Force full width layout
    useEffect(() => {
        document.body.classList.add('layout-full-width');

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    // Questions passed via props
    // const questions = [ ... ];

    const handleRatingChange = (qIndex, value) => {
        setRatings(prev => ({ ...prev, [qIndex]: value }));
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            onPrev();
        }
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onNext(ratings);
        }
    };

    // Check if current question is answered
    const isCurrentAnswered = ratings[currentStep] !== undefined;

    // Check if everything is answered (for final submit safety, though step logic enforces it)
    const allAnswered = questions && questions.length > 0 && Object.keys(ratings).length === questions.length;

    // Expert Mode Options: Unsuitable, Suitable, N/A
    const expertOptions = [
        { value: 1, label: '부적합' },
        { value: 2, label: '적합' },
        { value: 3, label: '해당 없음' }
    ];

    return (
        <div className="container">
            {/* Header */}
            <div className="step-header">
                <button className="back-btn" onClick={handlePrev} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            {/* Content */}
            <main className="step-content">
                <div className="step-top-section">
                    <div className="step-main-title" style={{ color: color }}>진단하기</div>
                    <div className="step-title">{isExpert ? "3) 진단하기" : "3) 체크리스트 작성"}</div>
                    <p className="description">
                        {isExpert ? "해당 시설물의 상태를 진단해 주세요." : "해당 시설물의 만족도를 평가해 주세요."}
                    </p>
                </div>

                <div className="questions-list">
                    {questions.length > 0 && (
                        <div key={currentStep} className="question-item">
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
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    marginRight: '8px',
                                    flexShrink: 0,
                                    marginTop: '4px' // Push number down further (approx 4px for 17px text line-height)
                                }}>
                                    {currentStep + 1}
                                </span>
                                <span style={{ paddingTop: '0px' }}>
                                    {questions[currentStep]}
                                </span>
                            </h3>

                            {isExpert ? (
                                /* Expert Mode: Circle Radio Buttons (Unsuitable, Suitable, N/A) - Styled like General */
                                <div className="rating-slider-container" style={{ padding: '20px 0 10px' }}>
                                    <div className="slider-bg-line"></div>
                                    <div className="radio-group" style={{ justifyContent: 'space-between' }}>
                                        {[
                                            { value: 1, label: '부적합' },
                                            { value: 2, label: '적합' },
                                            { value: 3, label: '해당 없음' }
                                        ].map((opt) => (
                                            <label key={opt.value} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name={`question-${currentStep}`}
                                                    value={opt.value}
                                                    checked={ratings[currentStep] === opt.value}
                                                    onChange={() => handleRatingChange(currentStep, opt.value)}
                                                />
                                                <span
                                                    className={`custom-radio ${ratings[currentStep] === opt.value ? 'checked' : ''}`}
                                                    style={ratings[currentStep] === opt.value ? { backgroundColor: color, borderColor: color } : {}}
                                                ></span>
                                                <span style={{
                                                    marginTop: '8px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    color: '#333',
                                                    textAlign: 'center'
                                                }}>
                                                    {opt.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* General Mode: Rating Slider */
                                <div className="rating-slider-container">
                                    <div className="slider-line"></div>
                                    <div className="slider-bg-line"></div>
                                    <div className="slider-labels">
                                        <span>매우<br />불만족</span>
                                        <span>보통</span>
                                        <span>매우<br />만족</span>
                                    </div>

                                    <div className="radio-group">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <label key={val} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name={`question-${currentStep}`}
                                                    value={val}
                                                    checked={ratings[currentStep] === val}
                                                    onChange={() => handleRatingChange(currentStep, val)}
                                                />
                                                <span
                                                    className={`custom-radio ${ratings[currentStep] === val ? 'checked' : ''}`}
                                                    style={ratings[currentStep] === val ? { backgroundColor: color, borderColor: color } : {}}
                                                ></span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="sticky-footer">
                <button className="btn btn-prev" onClick={handlePrev}>
                    {currentStep === 0 ? "이전" : "이전"}
                </button>
                <button
                    className={`btn btn-next ${isCurrentAnswered ? 'active' : ''}`}
                    disabled={!isCurrentAnswered}
                    onClick={handleNext}
                    style={isCurrentAnswered ? { backgroundColor: color } : {}}
                >
                    {currentStep === questions.length - 1 ? "제출하기" : "다음"}
                </button>
            </footer>
        </div>
    );
};

export default CheckList;
