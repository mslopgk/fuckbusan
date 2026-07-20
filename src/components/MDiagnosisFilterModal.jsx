import { useState, useMemo, useEffect } from 'react';
import './MDiagnosisFilterModal.css';

// Figma 302:20880 (진단 목록6) — "진단 상세를 선택해주세요" 전체화면 필터
// 진단대상(전체/시민/전문가) + 대분류(체크박스) + 중분류/소분류(드롭다운)
// 대분류/중분류 선택지는 실제 진단 데이터(rows)에서 진단대상별로 동적 생성한다.
// (PC PCDiagnosisMap 과 동일 방식. 생활정보 카테고리 상수는 데이터와 안 맞아 미사용)

const TARGETS = [
    { key: 'all', label: '전체' },
    { key: 'citizen', label: '시민' },
    { key: 'expert', label: '전문가' },
];

// 진단대상 필터 판정 (List/Map/Modal 공통 규칙)
function matchTarget(rowTarget, ft) {
    if (ft === 'all') return true;
    if (ft === 'expert') return rowTarget === '전문가' || rowTarget === 'expert';
    return rowTarget !== '전문가' && rowTarget !== 'expert';
}

export default function MDiagnosisFilterModal({
    open,
    value = {},
    rows = [],
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

    // 현재 진단대상에 해당하는 행만 (대분류/중분류 옵션 소스)
    const targetRows = useMemo(
        () => rows.filter((r) => matchTarget(r.target, target)),
        [rows, target],
    );

    // 대분류(공공/시설물) 옵션 = 실제 데이터의 대분류 (진단대상별)
    const bigOptions = useMemo(
        () => [...new Set(targetRows.map((r) => r.big).filter(Boolean))].sort(),
        [targetRows],
    );

    // 중분류 옵션 = 선택된 대분류들의 실제 중분류 합집합 (없으면 전체)
    const midOptions = useMemo(() => {
        const relevant = bigCats.size ? targetRows.filter((r) => bigCats.has(r.big)) : targetRows;
        return [...new Set(relevant.map((r) => r.mid).filter(Boolean))].sort();
    }, [targetRows, bigCats]);

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
        <div className="mdf-overlay">
            <div className="mdf-panel" onClick={(e) => e.stopPropagation()}>
                {/* 헤더 — Figma 302:21048~21053 */}
                <header className="mdf-head">
                    <button type="button" className="mdf-back" aria-label="뒤로" onClick={onClose}>
                        <img src="/figma-assets/mobile-diagnosis/arrow_back.png" width="24" height="24" alt="" />
                    </button>
                    <span className="mdf-title">진단 상세를 선택해주세요</span>
                    <button type="button" className="mdf-collapse" aria-label="접기" onClick={onClose}>
                        <img src="/figma-assets/mobile-diagnosis/expand_circle_down.png" width="20" height="20" alt="" className="mdf-collapse-icon" />
                    </button>
                </header>

                <div className="mdf-body">
                    {/* 진단대상 — Figma Frame 30 */}
                    <div className="mdf-target-section">
                        <div className="mdf-target-label">진단대상</div>
                        <div className="mdf-segment">
                            {TARGETS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    className={`mdf-seg-btn${target === t.key ? ' on' : ''}`}
                                    onClick={() => {
                                        setTarget(t.key);
                                        // 진단대상이 바뀌면 대분류/중분류 옵션이 달라지므로 선택 초기화
                                        setBigCats(new Set());
                                        setMid('');
                                        setSub('');
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 회색 밴드 — Figma #f2f2f2 5px */}
                    <div className="mdf-band" />

                    {/* 공공/시설물 — 대분류 체크박스 */}
                    <div className="mdf-group-label">공공/시설물</div>
                    <div className="mdf-label">대분류</div>
                    <ul className="mdf-check-list">
                        {bigOptions.length === 0 && (
                            <li className="mdf-check-empty">해당 진단대상의 분류가 없습니다.</li>
                        )}
                        {bigOptions.map((c) => {
                            const checked = bigCats.has(c);
                            return (
                                <li
                                    key={c}
                                    className="mdf-check-item"
                                    onClick={() => toggleCat(c)}
                                >
                                    <img
                                        src={`/figma-assets/mobile-diagnosis/check_box_${checked ? 'on' : 'off'}.png`}
                                        width="20"
                                        height="20"
                                        alt=""
                                        aria-hidden="true"
                                    />
                                    <span className={`mdf-check-text${checked ? ' on' : ''}`}>{c}</span>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mdf-dotted" />

                    {/* 중분류 */}
                    <div className="mdf-label">중분류</div>
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
                        <img className="mdf-select-chevron" src="/figma-assets/mobile-diagnosis/select_arrow_down.png" width="24" height="24" alt="" aria-hidden="true" />
                    </div>

                    <div className="mdf-dotted" />

                    {/* 소분류 (데이터 매핑 미정 — UI만) */}
                    <div className="mdf-label">소분류</div>
                    <div className="mdf-select-wrap">
                        <select
                            className="mdf-select"
                            value={sub}
                            onChange={(e) => setSub(e.target.value)}
                        >
                            <option value="">선택해주세요</option>
                        </select>
                        <img className="mdf-select-chevron" src="/figma-assets/mobile-diagnosis/select_arrow_down.png" width="24" height="24" alt="" aria-hidden="true" />
                    </div>

                    {/* 하단 액션 — Figma 170x35 r8 */}
                    <div className="mdf-actions">
                        <button type="button" className="mdf-btn mdf-btn-cancel" onClick={onClose}>취소</button>
                        <button type="button" className="mdf-btn mdf-btn-confirm" onClick={handleApply}>확인</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
