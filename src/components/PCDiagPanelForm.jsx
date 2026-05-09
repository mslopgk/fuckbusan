import { useState, useRef } from 'react';
import {
    CATEGORIES,
    SUB_BY_CATEGORY,
    DIAGNOSIS_QUESTIONS as QUESTIONS,
    SATISFACTION_SCALE as SCALE,
} from '../constants/diagnosis';

export default function PCDiagPanelForm({ onCancel, onSubmit }) {
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [category, setCategory] = useState('주거');
    const [sub, setSub] = useState('');
    const [ratings, setRatings] = useState({});
    const [review, setReview] = useState('');

    const photoInputRef = useRef(null);

    const handlePhotoPick = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setPhoto(f);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(URL.createObjectURL(f));
    };

    const subList = SUB_BY_CATEGORY[category] ?? [];
    const ratedAll = QUESTIONS.every((_, i) => ratings[i] != null);
    const canSubmit = photo && category && sub && ratedAll;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onSubmit?.();
    };

    return (
        <>
            <h2 className="pc-diagform-title">진단하기</h2>

            <div className="pc-diagform-section">
                <h3 className="pc-diagform-label">사진등록</h3>
                <button
                    type="button"
                    className={`pc-diagform-photo ${photoPreview ? 'has-photo' : ''}`}
                    onClick={() => photoInputRef.current?.click()}
                    aria-label="사진 첨부"
                >
                    {photoPreview ? (
                        <img src={photoPreview} alt="첨부 사진 미리보기" />
                    ) : (
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                    )}
                </button>
                <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoPick}
                    style={{ display: 'none' }}
                />
                <p className="pc-diagform-hint">* 사진을 첨부해주세요</p>
            </div>

            <div className="pc-diagform-section">
                <h3 className="pc-diagform-label">분류</h3>
                <select
                    className="pc-diagform-select"
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setSub(''); }}
                >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="pc-diagform-sub-row">
                    {subList.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={`pc-diagform-sub-chip ${sub === s ? 'on' : ''}`}
                            onClick={() => setSub(s)}
                        >{s}</button>
                    ))}
                </div>
            </div>

            <div className="pc-diagform-section">
                <h3 className="pc-diagform-label">만족도 평가</h3>
                <p className="pc-diagform-sublabel">해당 시설물의 만족도를 평가해 주세요.</p>
                <ol className="pc-diagform-questions">
                    {QUESTIONS.map((q, idx) => (
                        <li key={idx} className="pc-diagform-question">
                            <div className="pc-diagform-q-head">
                                <span className="pc-diagform-q-num">{idx + 1}</span>
                                <p className="pc-diagform-q-text">{q}</p>
                            </div>
                            <div className="pc-diagform-scale" role="radiogroup">
                                <span className="pc-diagform-scale-track" />
                                {SCALE.map((s) => {
                                    const active = ratings[idx] === s.value;
                                    return (
                                        <button
                                            key={s.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            aria-label={s.label}
                                            className={`pc-diagform-scale-dot ${active ? 'on' : ''}`}
                                            onClick={() => setRatings((prev) => ({ ...prev, [idx]: s.value }))}
                                        >
                                            <img src={s.face} width="22" height="22" alt={s.label} className="pc-diagform-scale-face" />
                                        </button>
                                    );
                                })}
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="pc-diagform-section">
                <h3 className="pc-diagform-label">리뷰</h3>
                <textarea
                    className="pc-diagform-review"
                    placeholder="추가 의견을 입력해 주세요."
                    rows={5}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                />
            </div>

            <div className="pc-diagform-actions">
                <button
                    type="button"
                    className="pc-diagform-btn-secondary"
                    onClick={onCancel}
                >취소</button>
                <button
                    type="button"
                    className="pc-diagform-btn-primary"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >작성완료</button>
            </div>
        </>
    );
}
