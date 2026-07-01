// 공유 모바일 지도 UI: 서치바 + 위치/정렬 바텀시트 (MProposalMap/MReportMap/MProposalList/MReportList 공용)

export function MMapSearchBar({ value, onChange, onBack, placeholder = '제목·내용으로 검색', showBack = true }) {
    return (
        <div className="m-map-search-bar">
            {showBack && (
                <button className="m-map-back" onClick={onBack}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
            )}
            <input
                type="text"
                className="m-map-search"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const ChevronDownIcon = ({ active, accent = '#E6235A' }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? accent : '#b0b0b0'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
    </svg>
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
