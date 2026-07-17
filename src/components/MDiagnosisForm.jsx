import { useState, useRef } from 'react';
import {
    DIAGNOSIS_QUESTIONS as DEFAULT_QUESTIONS,
    QUESTIONS_BY_SUB,
    SATISFACTION_SCALE as SCALE,
} from '../constants/diagnosis';
import './MDiagnosisForm.css';
import { API_URL, authHeaders } from '../utils/api';

// 칩 UI 라벨 → 백엔드 대분류 표준값 매핑
const FACILITY_CHIP_MAP = {
    '아파트/주택가':   { label: '아파트/주택가',   sub: '아파트·주택가', cat: '주거' },
    '근린/어린이공원': { label: '근린/어린이공원', sub: '근린공원·어린이공원', cat: '문화·여가' },
    '폐가/공가':       { label: '폐가/공가',       sub: '폐가·공가',       cat: '주거' },
    '어린이보호구역':  { label: '어린이보호구역',  sub: '어린이보호구역',  cat: '안전' },
    '상업가':          { label: '상업가',          sub: '상업가·상점가',   cat: '산업·일자리' },
    '공공시설':        { label: '공공시설',        sub: '공공기관·행정',   cat: '산업·일자리' },
    '기타':            { label: '기타',            sub: null,              cat: null },
};
const FACILITY_CHIPS = Object.keys(FACILITY_CHIP_MAP);

export default function MDiagnosisForm({ onNavigate, location, mode = 'citizen' }) {
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [facilityName, setFacilityName] = useState('');
    const [sub, setSub] = useState('');         // 칩 key (UI 라벨)
    const [ratings, setRatings] = useState({});
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const photoInputRef = useRef(null);

    // 선택된 칩에 따라 대분류(cat)·세부분류(subKey) 결정
    const chipMeta = sub ? FACILITY_CHIP_MAP[sub] : null;
    const catValue = chipMeta?.cat ?? sub;       // 백엔드 대분류 표준값
    const subKey   = chipMeta?.sub ?? sub;       // QUESTIONS_BY_SUB 조회 키

    // 세부분류별 질문 — 없으면 기본 질문 사용
    const QUESTIONS = (subKey && QUESTIONS_BY_SUB[subKey]) ? QUESTIONS_BY_SUB[subKey] : DEFAULT_QUESTIONS;

    const handlePhotoPick = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setPhoto(f);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(URL.createObjectURL(f));
    };

    const ratedAll = sub && QUESTIONS.every((_, i) => ratings[i] != null);
    const canSubmit = photo && sub && ratedAll && location && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);

        try {
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

            const avgScore = Object.values(ratings).reduce((a, b) => a + b, 0) / QUESTIONS.length;
            const payload = {
                대분류: catValue,
                중분류: subKey || facilityName || sub,
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
                setSubmitting(false);
                return;
            }
        } catch (e) {
            console.warn('진단 제출 중 오류:', e);
            setSubmitting(false);
            return;
        }

        setSubmitting(false);
        onNavigate?.('mDiagnosisDone', { category: catValue, sub: subKey || sub, ratings, review });
    };

    const handleDraft = () => {
        alert('임시저장은 준비 중입니다.');
    };

    return (
        <div className="m-diagform-page">
            <header className="m-diagform-topbar">
                <button
                    type="button"
                    className="m-diagform-back"
                    aria-label="뒤로"
                    onClick={() => onNavigate?.('mDiagnosisMap')}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                {mode === 'expert' && (
                    <span className="m-diagform-mode-badge">전문가 진단</span>
                )}
            </header>

            <main className="m-diagform-body">
                <p className="m-diagform-subtitle">우리동네 개선 아이디어를<br />진단해보세요.</p>

                {/* 사진 등록 */}
                <section className="m-diagform-section">
                    <h2 className="m-diagform-label">사진등록</h2>
                    <button
                        type="button"
                        className={`m-diagform-photo ${photoPreview ? 'has-photo' : ''}`}
                        onClick={() => photoInputRef.current?.click()}
                        aria-label="사진 첨부"
                    >
                        {photoPreview ? (
                            <img src={photoPreview} alt="첨부 사진 미리보기" />
                        ) : (
                            <img className="m-diagform-photo-add" src="/figma-assets/diagnosis/photo_add.svg" width="28" height="28" alt="사진 추가" />
                        )}
                    </button>
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoPick}
                        style={{ display: 'none' }}
                    />
                    <p className="m-diagform-hint">* 사진을 첨부해주세요</p>
                </section>

                {/* 분류 */}
                <section className="m-diagform-section">
                    <h2 className="m-diagform-label">분류</h2>
                    <input
                        type="text"
                        className="m-diagform-facility-input"
                        placeholder="진단 대상물을 입력해주세요"
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                    />
                    <div className="m-diagform-sub-row">
                        {FACILITY_CHIPS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`m-diagform-sub-chip ${sub === s ? 'on' : ''}`}
                                onClick={() => {
                                    setSub((prev) => (prev === s ? '' : s));
                                    setRatings({});
                                }}
                            >{s}</button>
                        ))}
                    </div>
                </section>

                {/* 만족도 평가 — 시설물 선택 후 표시 */}
                {sub && (
                    <section className="m-diagform-section">
                        <h2 className="m-diagform-label">만족도 평가</h2>
                        <p className="m-diagform-sublabel">해당 시설물의 만족도를 평가해 주세요.</p>
                        <ol className="m-diagform-questions">
                            {QUESTIONS.map((q, idx) => (
                                <li key={idx} className="m-diagform-question">
                                    <div className="m-diagform-q-head">
                                        <span className="m-diagform-q-num">{idx + 1}</span>
                                        <p className="m-diagform-q-text">{q}</p>
                                    </div>
                                    <div className="m-diagform-scale" role="radiogroup" aria-label={`Q${idx + 1} 만족도`}>
                                        <span className="m-diagform-scale-track" />
                                        {SCALE.map((s) => {
                                            const active = ratings[idx] === s.value;
                                            return (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={active}
                                                    aria-label={s.label}
                                                    className={`m-diagform-scale-dot ${active ? 'on' : ''}`}
                                                    onClick={() => setRatings((prev) => ({ ...prev, [idx]: s.value }))}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="m-diagform-scale-faces">
                                        {SCALE.map((s) => (
                                            <div key={s.value} className="m-diagform-face-slot">
                                                {s.face && (
                                                    <img
                                                        src={s.face}
                                                        width="24"
                                                        height="24"
                                                        alt={s.label}
                                                        className={`m-diagform-face-img ${ratings[idx] === s.value ? 'on' : ''}`}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                {/* 리뷰 */}
                <section className="m-diagform-section">
                    <h2 className="m-diagform-label">리뷰</h2>
                    <textarea
                        className="m-diagform-review"
                        placeholder="추가 의견을 입력해 주세요."
                        rows={4}
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                    />
                </section>
            </main>

            <footer className="m-diagform-footer">
                <button type="button" className="m-diagform-cta-secondary" onClick={handleDraft}>임시저장</button>
                <button
                    type="button"
                    className="m-diagform-cta-primary"
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                >{submitting ? '제출 중...' : '작성완료'}</button>
            </footer>
        </div>
    );
}
