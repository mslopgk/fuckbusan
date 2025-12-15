import React, { useState, useEffect } from 'react';
import './Review.css';

const Review = ({ onPrev, onNext, color = '#E6235A', progressBarColor, diagnosisMode }) => {
    // Expert step is 5, General is 4
    const stepTitle = diagnosisMode === 'expert' ? "5) 리뷰" : "4) 리뷰";

    const [text, setText] = useState('');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        if (val.length <= 1600) {
            setText(val);
        }
    };

    const isValid = text.length >= 20;

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
                        <div className="progress-bar-fill" style={{ width: '100%', backgroundColor: progressBarColor || color }}></div>
                    </div>
                </div>
                <div className="step-title">{stepTitle}</div>
                <p className="description">
                    해당 시설물에 대해 추가로 남기고 싶은 의견이 있으시면 자유롭게 작성해 주세요.
                </p>

                <div className="review-section">
                    <label className="review-label">리뷰</label>
                    <textarea
                        className="review-textarea"
                        placeholder="추가 의견을 입력해 주세요."
                        value={text}
                        onChange={handleChange}
                    />
                    <div className="char-count">
                        {text.length} / 1600
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="sticky-footer">
                <button className="btn btn-prev" onClick={onPrev}>이전</button>
                <button
                    className={`btn btn-next ${isValid ? 'active' : ''}`}
                    disabled={!isValid}
                    onClick={onNext}
                    style={isValid ? { backgroundColor: color } : {}}
                >
                    다음
                </button>
            </footer>
        </div>
    );
};

export default Review;
