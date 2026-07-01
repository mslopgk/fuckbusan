import { useState, useRef } from 'react';
import {
    CATEGORIES,
    SUB_BY_CATEGORY,
    DIAGNOSIS_QUESTIONS,
    QUESTIONS_BY_SUB,
    SATISFACTION_SCALE as SCALE,
} from '../constants/diagnosis';
import { API_URL, authHeaders } from '../utils/api';

export default function PCDiagPanelForm({ onCancel, onSubmit, location, mode = 'citizen' }) {
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [category, setCategory] = useState('주거');
    const [sub, setSub] = useState('');
    const [ratings, setRatings] = useState({});
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const photoInputRef = useRef(null);

    const handlePhotoPick = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setPhoto(f);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(URL.createObjectURL(f));
    };

    const subList = SUB_BY_CATEGORY[category] ?? [];
    const QUESTIONS = sub ? (QUESTIONS_BY_SUB[sub] ?? DIAGNOSIS_QUESTIONS) : DIAGNOSIS_QUESTIONS;
    const ratedAll = QUESTIONS.every((_, i) => ratings[i] != null);
    const canSubmit = photo && category && sub && ratedAll && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);

        try {
            // 1. 이미지 업로드
            let imageUrl = null;
            if (photo) {
                const formData = new FormData();
                formData.append('file', photo);
                const uploadRes = await fetch(`${API_URL}/checklist/upload`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: formData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url ?? null;
                }
            }

            // 2. 진단 결과 제출
            const avgScore = Object.values(ratings).reduce((a, b) => a + b, 0) / QUESTIONS.length;
            const payload = {
                대분류: category,
                중분류: sub,
                answers: JSON.stringify(ratings),
                점수: Math.round(avgScore),
                리뷰: review || null,
                이미지경로: imageUrl,
                위도: location?.lat ?? null,
                경도: location?.lng ?? null,
                district_code: location?.district ?? null,
                진단대상: mode === 'expert' ? '전문가' : '시민',
            };
            const submitRes = await fetch(`${API_URL}/checklist/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(payload),
            });
            if (!submitRes.ok) {
                const err = await submitRes.json().catch(() => ({}));
                alert(`제출 실패: ${err.detail ?? submitRes.status}`);
                return;
            }
        } catch (e) {
            console.warn('진단 제출 중 오류:', e);
        } finally {
            setSubmitting(false);
        }

        onSubmit?.();
    };

    return (
        <>
            {/* Figma 269:13157 — 24px bold subtitle, not just "진단하기" */}
            <h2 className="pc-diagform-title">우리동네 개선 아이디어를<br/>진단해보세요.</h2>

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
                        /* Figma 269:13157 — same photo_add icon as mobile form */
                        <img src="/figma-assets/diagnosis/photo_add.svg" width="22" height="22" alt="사진 추가" style={{ objectFit: 'contain' }} />
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
                            onClick={() => { setSub(s); setRatings({}); }}
                        >{s}</button>
                    ))}
                </div>
            </div>

            {sub && (
                <>
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
                                                    {s.face && <img src={s.face} width="22" height="22" alt={s.label} className="pc-diagform-scale-face" />}
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
                </>
            )}

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
                >{submitting ? '제출 중...' : '작성완료'}</button>
            </div>
        </>
    );
}
