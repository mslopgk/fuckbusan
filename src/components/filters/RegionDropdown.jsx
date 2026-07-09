import { useEffect, useRef, useState } from 'react';
import './RegionDropdown.css';

// 구역별 드롭다운 카드 (Figma 302:5940 "구역별" 필터 스타일)
// 두 가지 사용 방식:
//  1) options 미전달  → 클릭 시 onClick() 호출 (모바일: 기존 지역선택 시트/모달 오픈, 로직 보존)
//  2) options 전달    → 컴포넌트가 자체 드롭다운 메뉴를 렌더 (PC 세로 레일). 선택 시 onSelect(region).
// chevron 아이콘은 Figma export 자산 재사용 (손으로 그리지 않음).
export default function RegionDropdown({
    value,
    placeholder = '설정해주세요',
    title = '구역별',
    onClick,
    onSelect,
    options,
    unsetValue,
    accent = '#06AB69',
    className = '',
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const hasMenu = Array.isArray(options) && options.length > 0;

    useEffect(() => {
        if (!open) return undefined;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const isUnset = !value || value === placeholder || value === unsetValue;
    const display = isUnset ? placeholder : value;

    const handleBox = () => {
        if (hasMenu) setOpen((o) => !o);
        else if (onClick) onClick();
    };

    return (
        <div className={`region-dd ${className}`} style={{ '--dd-accent': accent }} ref={ref}>
            {title && <div className="region-dd-title">{title}</div>}
            <button type="button" className={`region-dd-box${open ? ' open' : ''}`} onClick={handleBox}>
                <span className={`region-dd-value${!isUnset ? ' set' : ''}`}>{display}</span>
                <span className={`region-dd-chev${open ? ' up' : ''}`}>
                    <img src="/figma-assets/icons/icon_sort_chevron.svg" alt="" aria-hidden="true" width="12" height="8" />
                </span>
            </button>
            {hasMenu && open && (
                <div className="region-dd-menu" role="listbox">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className={`region-dd-opt${value === opt ? ' on' : ''}`}
                            onClick={() => {
                                if (onSelect) onSelect(opt);
                                setOpen(false);
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
