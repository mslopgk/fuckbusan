import React, { useState } from 'react';
import './Satisfaction.css';

const Satisfaction = ({ onPrev, onNext, color = '#542AA3', progressBarColor }) => {
    const [rating, setRating] = useState(null);

    const handleRatingChange = (val) => {
        setRating(val);
    };

    return (
        <div className="container">
            {/* Header */}
            <div className="step-header">
                <button onClick={onPrev} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            {/* Content */}
            <main className="step-content">
                <div className="step-top-section">
                    <div className="step-main-title" style={{ color: color }}>진단하기</div>
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: '85%', backgroundColor: progressBarColor || color }}></div>
                    </div>
                </div>
                <div className="step-title">4) 만족도 평가</div>
                <p className="description">
                    해당 시설물의 만족도를 평가해 주세요.
                </p>

                <div className="satisfaction-question">
                    <h3 className="question-text" style={{ fontWeight: 500 }}>
                        보행공간의 전반적인 만족도를 평가해 주세요.
                    </h3>

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
                                        name="satisfaction"
                                        value={val}
                                        checked={rating === val}
                                        onChange={() => handleRatingChange(val)}
                                    />
                                    <span
                                        className={`custom-radio ${rating === val ? 'checked' : ''}`}
                                        style={rating === val ? { backgroundColor: color, borderColor: color } : {}}
                                    ></span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="sticky-footer">
                <button className="btn btn-prev" onClick={onPrev}>이전</button>
                <button
                    className={`btn btn-next ${rating ? 'active' : ''}`}
                    disabled={!rating}
                    onClick={() => onNext(rating)}
                    style={rating ? { backgroundColor: color } : {}}
                >
                    다음
                </button>
            </footer>
        </div>
    );
};

export default Satisfaction;
