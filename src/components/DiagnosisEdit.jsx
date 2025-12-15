import React, { useState, useEffect } from 'react';
import './DiagnosisEdit.css';

const DiagnosisEdit = ({ data, onBack, onComplete }) => {
    // Determine type from data (passed from MyActivity)
    const type = data ? data.type : 'general'; // 'general' | 'expert'

    // Data Loading
    const [fullData, setFullData] = useState({});
    const [loading, setLoading] = useState(true);

    // Form State
    const [image, setImage] = useState(data ? data.image : '/assets/diagnosis_street.png');
    const [selectedBig, setSelectedBig] = useState(data ? data.title : '');
    const [selectedMid, setSelectedMid] = useState('');

    // Answers State
    const [answers, setAnswers] = useState({}); // { questionIndex: value }
    const [reviewText, setReviewText] = useState(data ? data.desc : '');
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const fileName = type === 'expert'
                    ? '/assets/data/expert_diagnosis.json'
                    : '/assets/data/general_diagnosis.json';

                const response = await fetch(fileName);
                const json = await response.json();
                setFullData(json);

                // Set initial Big/Mid if not set
                const bigKeys = Object.keys(json);
                let initBig = selectedBig;
                if (!initBig || !json[initBig]) {
                    initBig = bigKeys[0];
                    setSelectedBig(initBig);
                }

                if (initBig && json[initBig]) {
                    const midKeys = Object.keys(json[initBig]);
                    if (midKeys.length > 0) {
                        setSelectedMid(midKeys[0]);
                    }
                }

            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [type]);

    // Handle Big Category Change
    const handleBigChange = (e) => {
        const newBig = e.target.value;
        setSelectedBig(newBig);
        // Reset Mid to first of new Big
        if (fullData[newBig]) {
            const mids = Object.keys(fullData[newBig]);
            if (mids.length > 0) setSelectedMid(mids[0]);
        }
        setHasChanges(true); // Technically a change
    };

    const handleAnswerChange = (idx, val) => {
        setAnswers(prev => ({ ...prev, [idx]: val }));
        setHasChanges(true);
    };

    const handleReviewChange = (e) => {
        setReviewText(e.target.value);
        setHasChanges(true);
    };

    if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

    // Dynamic Theme Colors
    const isExpert = type === 'expert';
    const themeColor = isExpert ? '#542AA3' : '#E6235A';
    const titleClass = isExpert ? 'page-title-expert' : 'page-title-general';

    const currentQuestions = fullData[selectedBig]?.[selectedMid] || [];

    return (
        <div className="diagnosis-edit-container">
            {/* Header */}
            <div className="edit-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <div className={titleClass}>진단 내용 수정</div>

            <div className="sub-title-wrapper">
                <div className="sub-title">부산 부산진구 초연로 6</div>
                <div className="sub-desc">입력하신 정보를 바탕으로 진단 결과를 정리했습니다.<br />전송 전 내용을 다시 한 번 확인해주세요.</div>
            </div>

            <div className="form-section">
                <div className="field-label">사진 첨부</div>
                <div className="image-preview-container">
                    <div className="image-name">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#542AA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                        20251204.jpg
                    </div>
                    <button className="remove-img-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div className="preview-box">
                        <img src={image} alt="preview" />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <div className="field-label">대분류</div>
                <div className="dropdown-wrapper">
                    <select className="dropdown-select" value={selectedBig} onChange={handleBigChange}>
                        {Object.keys(fullData).map(key => (
                            <option key={key} value={key}>{key}</option>
                        ))}
                    </select>
                    <svg className="dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            <div className="form-section">
                <div className="field-label">중분류</div>
                <div className="mid-grid">
                    {fullData[selectedBig] && Object.keys(fullData[selectedBig]).map(midKey => (
                        <div
                            key={midKey}
                            className={`mid-item ${selectedMid === midKey ? 'selected' : ''}`}
                            onClick={() => { setSelectedMid(midKey); setHasChanges(true); }}
                        >
                            <div className="mid-img-box">
                                {/* Placeholder or map images if possible */}
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={selectedMid === midKey ? "#fff" : "#ccc"} strokeWidth="1">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                </svg>
                            </div>
                            <div className="mid-name">{midKey}</div>
                            {selectedMid === midKey && <div className="overlay-check">수정하기</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Questions List */}
            <div className="questions-list">
                {currentQuestions.map((qText, idx) => (
                    <div className="question-item" key={idx} style={{ marginBottom: '48px' }}>
                        <h3 className="question-text" style={{
                            fontFamily: 'GmarketSans, sans-serif',
                            fontWeight: 300,
                            display: 'flex',
                            alignItems: 'flex-start',
                            fontSize: '17px',
                            lineHeight: 1.5,
                            color: '#111',
                            marginBottom: '24px',
                            wordBreak: 'keep-all'
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
                                {idx + 1}
                            </span>
                            <span style={{ paddingTop: '0px' }}>
                                {qText}
                            </span>
                        </h3>

                        {type === 'general' ? (
                            <div className="rating-slider-container">
                                <div className="slider-bg-line"></div>
                                <div className="radio-group">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <label key={val} className="radio-label">
                                            <input
                                                type="radio"
                                                name={`q-gen-${idx}`}
                                                value={val}
                                                checked={parseInt(answers[idx] || 3) === val}
                                                onChange={() => handleAnswerChange(idx, val)}
                                            />
                                            <div className={`custom-radio ${parseInt(answers[idx] || 3) === val ? 'checked' : ''}`}></div>
                                        </label>
                                    ))}
                                </div>
                                <div className="slider-labels">
                                    <span>매우<br />불만족</span>
                                    <span>보통</span>
                                    <span>매우<br />만족</span>
                                </div>
                            </div>
                        ) : (
                            /* Expert Mode Styled like CheckList */
                            <div className="rating-slider-container" style={{ padding: '20px 0 10px' }}>
                                <div className="slider-bg-line"></div>
                                <div className="radio-group" style={{ justifyContent: 'space-between' }}>
                                    {[
                                        { value: 'unsuitable', label: '부적합' },
                                        { value: 'suitable', label: '적합' },
                                        { value: 'na', label: '해당 없음' }
                                    ].map((opt) => (
                                        <label key={opt.value} className="radio-label">
                                            <input
                                                type="radio"
                                                name={`q-${idx}`}
                                                value={opt.value}
                                                checked={answers[idx] === opt.value}
                                                onChange={() => handleAnswerChange(idx, opt.value)}
                                            />
                                            <span
                                                className={`custom-radio ${answers[idx] === opt.value ? 'checked' : ''}`}
                                                style={answers[idx] === opt.value ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                                            ></span>
                                            <span style={{
                                                marginTop: '8px',
                                                fontSize: '14px',
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
                        )}
                    </div>
                ))}
            </div>

            {/* Review */}
            <div className="form-section">
                <div className="field-label">리뷰</div>
                <textarea
                    className="review-area"
                    value={reviewText}
                    onChange={handleReviewChange}
                />
                <div className="char-count">{reviewText.length} / 1600</div>
            </div>

            {/* Submit Button */}
            <div className="footer-action">
                <button
                    className={`submit-btn ${hasChanges ? 'active' : ''}`}
                    disabled={!hasChanges}
                    onClick={onComplete}
                >
                    수정하기
                </button>
            </div>
        </div>
    );
};

export default DiagnosisEdit;
