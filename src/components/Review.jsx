import React, { useState, useEffect } from 'react';
import './Review.css';
import { fetchWithLogout } from '../utils/api';

const Review = ({ onPrev, onNext, color = '#E6235A', progressBarColor, diagnosisMode, diagnosisPayload }) => {
    // Expert step is 5, General is 4
    const stepTitle = diagnosisMode === 'expert' ? "5) 리뷰" : "4) 리뷰";

    const [text, setText] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            let imageUrl = '';

            // 1. Upload Image if exists
            if (diagnosisPayload?.photo?.original) {
                const formData = new FormData();
                formData.append('file', diagnosisPayload.photo.original);

                const uploadRes = await fetchWithLogout(`${API_URL}/checklist/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url;
                } else {
                    console.error("Image upload failed");
                }
            }

            // 2. Submit Checklist
            const token = localStorage.getItem('access_token');
            const submitPayload = {
                "진단지역": diagnosisPayload?.address?.road || diagnosisPayload?.address?.placeName || '부산', // Save detailed address here
                "district_code": diagnosisMode, // 'general' or 'expert'
                "위도": diagnosisPayload?.location?.lat || 0,
                "경도": diagnosisPayload?.location?.lng || 0,
                "대분류": diagnosisPayload?.bigCategory || '',
                "중분류": diagnosisPayload?.midCategory || '',
                "질문기준": "default",
                "answers": JSON.stringify(diagnosisPayload?.answers || {}),
                "점수": diagnosisPayload?.satisfaction || 0, // Using satisfaction as 'score' for general, maybe calculate for expert?
                "리뷰": text,
                "만족도": diagnosisPayload?.satisfaction ? String(diagnosisPayload.satisfaction) : "0",
                "이미지경로": imageUrl
            };

            const submitRes = await fetchWithLogout(`${API_URL}/checklist/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitPayload)
            });

            if (!submitRes.ok) {
                const errJson = await submitRes.json();
                throw new Error(errJson.detail || '제출 실패');
            }

            // Success
            onNext();

        } catch (error) {
            console.error("Submit Error:", error);
            alert(`제출 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
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
                <button className="btn btn-prev" onClick={onPrev} disabled={isSubmitting}>이전</button>
                <button
                    className={`btn btn-next ${isValid ? 'active' : ''}`}
                    disabled={!isValid || isSubmitting}
                    onClick={handleSubmit}
                    style={isValid && !isSubmitting ? { backgroundColor: color } : {}}
                >
                    {isSubmitting ? '제출 중...' : '다음'}
                </button>
            </footer>
        </div>
    );
};

export default Review;
