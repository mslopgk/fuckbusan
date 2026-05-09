import { useState, useRef, useEffect } from 'react';
import {
    CATEGORIES,
    SUB_BY_CATEGORY,
    DIAGNOSIS_QUESTIONS as QUESTIONS,
    SATISFACTION_SCALE as SCALE,
} from '../constants/diagnosis';
import './MDiagnosisForm.css';

export default function MDiagnosisForm({ onNavigate }) {
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [category, setCategory] = useState('주거');
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [sub, setSub] = useState('');
    const [ratings, setRatings] = useState({});
    const [review, setReview] = useState('');

    const photoInputRef = useRef(null);
    const catWrapRef = useRef(null);

    useEffect(() => {
        if (!categoryOpen) return undefined;
        const handler = (e) => {
            if (catWrapRef.current && !catWrapRef.current.contains(e.target)) {
                setCategoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [categoryOpen]);

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
        // 임시: 일반 진단 완료 화면으로 이동
        onNavigate?.('mDiagnosisDone', { photo, category, sub, ratings, review });
    };

    const handleDraft = () => {
        // 임시저장 — 후속 처리
        alert('임시저장은 준비 중입니다.');
    };

    return (
        <div className="m-diagform-page">
            <header className="m-diagform-topbar">
                <button
                    type="button"
                    className="m-diagform-back"
                    onClick={() => onNavigate?.('home')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <span>홈으로</span>
                </button>
            </header>

            <main className="m-diagform-body">
                <h1 className="m-diagform-title">우리동네 개선 아이디어를<br/>진단해보세요</h1>

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
                            <img src="/figma-assets/diagnosis/photo_add.svg" width="28" height="28" alt="사진 추가" />
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
                    <div className="m-diagform-cat-wrap" ref={catWrapRef}>
                        <button
                            type="button"
                            className="m-diagform-cat-btn"
                            onClick={() => setCategoryOpen((v) => !v)}
                            aria-haspopup="listbox"
                            aria-expanded={categoryOpen}
                        >
                            <span>{category}</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {categoryOpen && (
                            <ul className="m-diagform-cat-menu" role="listbox">
                                {CATEGORIES.map((c) => (
                                    <li key={c}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={c === category}
                                            className={c === category ? 'on' : ''}
                                            onClick={() => {
                                                setCategory(c);
                                                setSub('');
                                                setCategoryOpen(false);
                                            }}
                                        >{c}</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="m-diagform-sub-row">
                        {subList.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`m-diagform-sub-chip ${sub === s ? 'on' : ''}`}
                                onClick={() => setSub(s)}
                            >{s}</button>
                        ))}
                    </div>
                </section>

                {/* 만족도 평가 */}
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
                                            >
                                                                <img src={s.face} width="22" height="22" alt={s.label} className="m-diagform-scale-face" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

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
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >작성완료</button>
            </footer>
        </div>
    );
}
