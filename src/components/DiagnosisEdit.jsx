import React, { useState, useEffect } from 'react';
import './DiagnosisEdit.css';
import { fetchWithLogout, API_URL } from '../utils/api';

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
        // Force full width layout
        document.body.classList.add('layout-full-width');

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Load Questions Structure (DB 우선, 정적 JSON fallback)
                const mode = type === 'expert' ? 'expert' : 'general';
                let response = await fetch(`${API_URL}/checklist/templates?mode=${mode}`);
                if (!response.ok) response = await fetch(`/assets/data/${mode}_diagnosis.json`);
                const json = await response.json();
                setFullData(json);

                // 2. Load Checklist Detail if ID exists
                if (data && data.id) {
                    const token = localStorage.getItem('access_token');
                    const res = await fetchWithLogout(`${API_URL}/checklist/${data.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const detail = await res.json();
                        // Set fields from detail
                        setSelectedBig(detail.대분류);
                        setSelectedMid(detail.중분류);

                        // Correctly format image URL
                        let imgUrl = detail.이미지경로 || '/assets/diagnosis_street.png';
                        if (imgUrl && imgUrl.startsWith('/uploads')) {
                            imgUrl = `${API_URL}${imgUrl}`;
                        }
                        setImage(imgUrl);

                        setReviewText(detail.리뷰 || '');

                        // Parse answers
                        try {
                            const parsedAnswers = JSON.parse(detail.answers);
                            setAnswers(parsedAnswers);
                        } catch (e) {
                            console.warn("Failed to parse answers", e);
                        }
                    }
                } else {
                    // Fallback to props data or defaults
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
                }

            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [type, data]);

    // Cleanup full width layout
    useEffect(() => {
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

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

    const handleSave = async () => {
        if (!data || !data.id) return;

        try {
            const token = localStorage.getItem('access_token');

            const payload = {
                "대분류": selectedBig,
                "중분류": selectedMid,
                "리뷰": reviewText,
                "answers": JSON.stringify(answers),
                "점수": 0 // Optional, backend might not update this or needs calc
            };

            const res = await fetchWithLogout(`${API_URL}/checklist/${data.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("수정되었습니다.");
                if (onComplete) onComplete();
            } else {
                alert("수정 실패.");
            }
        } catch (e) {
            console.error("Update failed", e);
            alert("에러가 발생했습니다.");
        }
    };

    if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

    // Dynamic Theme Colors
    const isExpert = type === 'expert';
    const themeColor = isExpert ? '#542AA3' : '#E6235A';
    const titleClass = isExpert ? 'page-title-expert' : 'page-title-general';

    const currentQuestions = fullData[selectedBig]?.[selectedMid] || [];

    // [Added] Image Mapping Logic (Same as BigCategory)
    const getImageForMid = (name) => {
        // Legacy check for Sidewalk (Big Category Check)
        // Since we don't track 'Big Category' ID easily here (it's name based), we check if big category name is '보도'
        if (selectedBig === '보도') {
            if (name === '보행공간') return '/assets/categories/pedestrian_space.png';
            if (name === '차량진입구역') return '/assets/categories/vehicle_entry.png';
            if (name === '자전거도로') return '/assets/categories/bicycle_path.png';
            if (name === '건물 앞 열린 광장, 쉼터(공개공지)') return '/assets/categories/public_road.png';
            if (name === '시설물구역') return '/assets/categories/facility_zone.png';
            return '/assets/categories/facility_zone.png';
        }

        const map = {
            "생활도로(국지도로, 동네에서 차가 다니는 길)": "생활도로.png",
            "횡단보도": "횡단보도.png",
            "속도저감장치": "속도저감장치.png",
            "진입공간(보행 접근로)": "진입공간(보행 접근로).png",
            "산책로": "산책로.png",
            "위생공간(화장실)": "위생공간(화장실).png",
            "편의공간(편의시설, 안내시설)": "편의공간(편의시설).png",
            "휴게공간": "휴게공간.png",
            "안내시설": "안내 시설.png",
            "가로등(보행등)": "가로등(보행등).png",
            "신호등": "신호등.png",
            "버스승차대": "버스승차대.png",
            "택시승차대": "택시승차대.png",
            "두리발승차대": "두리발승차대.png",
            "지하철출입구": "지하철출입구.png",
            "휴게(벤치)": "휴게(벤치).png",
            "휴게(파고라)": "휴게(파고라).png",
            "휴지통": "휴지통.png",
            "음수대": "음수대.png",
            "기타지원시설": "기타지원시설.png",
            "접근공간": "접근공간.png",
            "진입공간": "진입공간(진입).png",
            "이동공간": "이동공간.png",
            "위생공간": "위생공간.png"
        };

        if (map[name]) {
            return `/assets/categories/middle/${map[name]}`;
        }

        // Fallback
        if (name.includes('시설')) return '/assets/categories/middle/기타지원시설.png';
        if (name.includes('위생') || name.includes('화장실')) return '/assets/categories/middle/위생공간(화장실).png';

        return '/assets/categories/facility_zone.png';
    };

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
                <div className="sub-title">{data && (data.address || data.road) ? (data.address || data.road) : '부산 부산진구 초연로 6 (기본)'}</div>
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
                        <img
                            src={image}
                            alt="preview"
                            onError={(e) => { e.target.src = '/assets/diagnosis_street.png'; }}
                        />
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
                                <img
                                    src={getImageForMid(midKey)}
                                    alt={midKey}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
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
                            fontSize: '1.0625rem',
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
                                fontSize: '0.875rem',
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
                                        { value: 1, label: '부적합' },
                                        { value: 2, label: '적합' },
                                        { value: 3, label: '해당 없음' }
                                    ].map((opt) => (
                                        <label key={opt.value} className="radio-label">
                                            <input
                                                type="radio"
                                                name={`q-${idx}`}
                                                value={opt.value}
                                                checked={parseInt(answers[idx]) === opt.value}
                                                onChange={() => handleAnswerChange(idx, opt.value)}
                                            />
                                            <span
                                                className={`custom-radio ${parseInt(answers[idx]) === opt.value ? 'checked' : ''}`}
                                                style={parseInt(answers[idx]) === opt.value ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
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
                    onClick={handleSave}
                >
                    수정하기
                </button>
            </div>
        </div>
    );
};

export default DiagnosisEdit;
