// 공유 모바일 지도 UI: 서치바 + 위치/정렬 바텀시트 (MProposalMap/MReportMap/MProposalList/MReportList 공용)

// Figma 302:15671 — back arrow(24x24)는 검색바 밖 (20,25) standalone, 바는 left 63
export function MMapSearchBar({ value, onChange, onBack, placeholder = '제목·내용으로 검색', showBack = true }) {
    return (
        <>
            {showBack && (
                <button className="m-map-back-float" onClick={onBack} aria-label="뒤로">
                    <img src="/figma-assets/icons/icon_arrow_back.svg" alt="" width="24" height="24" />
                </button>
            )}
            <div className="m-map-search-bar">
                <input
                    type="text"
                    className="m-map-search"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </>
    );
}

// Figma 302:16313 export — 11x11 X
const CloseIcon = () => (
    <img src="/figma-assets/mobile-report/modal_close.png" alt="" width="11" height="11" />
);

// Figma 302:16303 export (15x8) — mask로 색만 상태에 따라 변경
const ChevronDownIcon = ({ active, accent = '#f74e7e' }) => (
    <span
        className="m-modal-chev-ic"
        style={{ backgroundColor: active ? accent : '#d9d9d9' }}
        aria-hidden="true"
    />
);

export function RegionSheet({ regions, draft, onSelect, onConfirm, onClose, accent }) {
    return (
        <div className="m-modal-backdrop" onMouseDown={(e) => { e.stopPropagation(); }} onTouchStart={(e) => { e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <div className="m-modal-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="m-modal-head">
                    <h3 className="m-modal-title">위치 설정</h3>
                    <button className="m-modal-close" type="button" aria-label="닫기" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>
                <ul className="m-region-list">
                    {regions.map((r) => (
                        <li key={r} className={`m-region-item ${draft === r ? 'on' : ''}`} onClick={() => onSelect(r)}>
                            <span className="m-modal-chevron"><ChevronDownIcon active={draft === r} accent={accent} /></span>
                            <span>{r}</span>
                        </li>
                    ))}
                </ul>
                <button type="button" className="m-modal-confirm" onClick={onConfirm}>선택</button>
            </div>
        </div>
    );
}

export function SortSheet({ sorts, draft, onSelect, onConfirm, onClose, accent }) {
    return (
        <div className="m-modal-backdrop" onMouseDown={(e) => { e.stopPropagation(); }} onTouchStart={(e) => { e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <div className="m-modal-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="m-modal-head">
                    <h3 className="m-modal-title">정렬</h3>
                    <button className="m-modal-close" type="button" aria-label="닫기" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>
                <ul className="m-sort-list">
                    {sorts.map((s) => (
                        <li key={s} className={`m-sort-item ${draft === s ? 'on' : ''}`} onClick={() => onSelect(s)}>
                            <span className="m-modal-chevron"><ChevronDownIcon active={draft === s} accent={accent} /></span>
                            <span>{s}</span>
                        </li>
                    ))}
                </ul>
                <button type="button" className="m-modal-confirm" onClick={onConfirm}>선택</button>
            </div>
        </div>
    );
}
