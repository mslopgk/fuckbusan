import { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, SUB_BY_CATEGORY } from '../constants/diagnosis';
import './MDiagnosisFilterModal.css';

// Figma 269:26256 — "진단 상세를 선택해주세요" 필터 모달
// 진단대상(전체/시민/전문가) + 대분류(체크박스) + 중분류/소분류(드롭다운)

const TARGETS = [
    { key: 'all', label: '전체' },
    { key: 'citizen', label: '시민' },
    { key: 'expert', label: '전문가' },
];

export default function MDiagnosisFilterModal({
    open,
    value = {},
    onClose,
    onApply,
}) {
    const [target, setTarget] = useState(value.target || 'citizen');
    const [bigCats, setBigCats] = useState(() => new Set(value.bigCats || []));
    const [mid, setMid] = useState(value.mid || '');
    const [sub, setSub] = useState(value.sub || '');

    // 모달이 열릴 때마다 외부 값으로 초기화
    useEffect(() => {
        if (!open) return;
        setTarget(value.target || 'citizen');
        setBigCats(new Set(value.bigCats || []));
        setMid(value.mid || '');
        setSub(value.sub || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // 중분류 옵션 = 선택된 대분류들의 세부분류 합집합 (없으면 전체)
    const midOptions = useMemo(() => {
        const cats = bigCats.size ? [...bigCats] : CATEGORIES;
        const set = new Set();
        cats.forEach((c) => (SUB_BY_CATEGORY[c] || []).forEach((s) => set.add(s)));
        return [...set];
    }, [bigCats]);

    if (!open) return null;

    const toggleCat = (c) => {
        setBigCats((prev) => {
            const next = new Set(prev);
            if (next.has(c)) next.delete(c);
            else next.add(c);
            return next;
        });
        // 대분류 변경 시 중분류 초기화 (옵션 정합성)
        setMid('');
    };

    const handleApply = () => {
        onApply?.({ target, bigCats: [...bigCats], mid, sub });
        onClose?.();
    };

    return (
        <div className="mdf-overlay" onClick={onClose}>
            <div className="mdf-panel" onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <header className="mdf-head">
                    <button type="button" className="mdf-back" aria-label="뒤로" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <span className="mdf-title">진단 상세를 선택해주세요</span>
                    <button type="button" className="mdf-collapse" aria-label="접기" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M6 15l6-6 6 6" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </header>

                <div className="mdf-body">
                    {/* 진단대상 */}
                    <div className="mdf-section">
                        <div className="mdf-label">진단대상</div>
                        <div className="mdf-segment">
                            {TARGETS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    className={`mdf-seg-btn${target === t.key ? ' on' : ''}`}
                                    onClick={() => setTarget(t.key)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mdf-band" />

                    {/* 공공/시설물 — 대분류 체크박스 */}
                    <div className="mdf-section">
                        <div className="mdf-group-label">공공/시설물</div>
                        <div className="mdf-label mdf-label-sub">대분류</div>
                        <ul className="mdf-check-list">
                            {CATEGORIES.map((c) => {
                                const checked = bigCats.has(c);
                                return (
                                    <li
                                        key={c}
                                        className="mdf-check-item"
                                        onClick={() => toggleCat(c)}
                                    >
                                        <span className={`mdf-check-box${checked ? ' on' : ''}`}>
                                            {checked && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 12l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </span>
                                        <span className="mdf-check-text">{c}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="mdf-dotted" />

                    {/* 중분류 */}
                    <div className="mdf-section">
                        <div className="mdf-label mdf-label-sub">중분류</div>
                        <div className="mdf-select-wrap">
                            <select
                                className="mdf-select"
                                value={mid}
                                onChange={(e) => { setMid(e.target.value); setSub(''); }}
                            >
                                <option value="">선택해주세요</option>
                                {midOptions.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <svg className="mdf-select-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    <div className="mdf-dotted" />

                    {/* 소분류 (데이터 매핑 미정 — UI만) */}
                    <div className="mdf-section">
                        <div className="mdf-label mdf-label-sub">소분류</div>
                        <div className="mdf-select-wrap">
                            <select
                                className="mdf-select"
                                value={sub}
                                onChange={(e) => setSub(e.target.value)}
                            >
                                <option value="">선택해주세요</option>
                            </select>
                            <svg className="mdf-select-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    {/* 하단 액션 */}
                    <div className="mdf-actions">
                        <button type="button" className="mdf-btn mdf-btn-cancel" onClick={onClose}>취소</button>
                        <button type="button" className="mdf-btn mdf-btn-confirm" onClick={handleApply}>확인</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
