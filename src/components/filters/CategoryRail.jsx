import { catIcon, catIconFlipped } from './catIcons';
import './CategoryRail.css';

// 생활정보 카테고리 필터 (Figma 302:5940 디자인 언어)
// variant: 'row' (모바일 아이콘+라벨 가로 스크롤) | 'rail' (PC 세로 rail 카드)
//        | 'pill' (모바일 리스트 전용 둥근 알약칩 — 아이콘 없이 라벨, accent 채움 active)
// accent: 활성 라벨/채움 색, tint: 활성 배경 tint(row/rail)
export default function CategoryRail({
    categories,
    value,
    onChange,
    accent = '#06AB69',
    tint = '#eef7f2',
    variant = 'row',
    title = '생활정보',
    className = '',
}) {
    const isPill = variant === 'pill';
    return (
        <div className={`cat-rail cat-rail--${variant} ${className}`}>
            {variant === 'rail' && title && <div className="cat-rail-title">{title}</div>}
            <div className="cat-rail-items">
                {categories.map((c) => {
                    const on = value === c;
                    const onStyle = isPill
                        ? { background: accent, color: '#fff', borderColor: accent }
                        : { color: accent, background: tint };
                    return (
                        <button
                            key={c}
                            type="button"
                            className={`cat-rail-item${on ? ' on' : ''}`}
                            style={on ? onStyle : undefined}
                            onClick={() => onChange(c)}
                        >
                            {!isPill && (
                                <span className={`cat-rail-ic${catIconFlipped(c) ? ' flip' : ''}`}>
                                    <img src={catIcon(c)} alt="" aria-hidden="true" />
                                </span>
                            )}
                            <span className="cat-rail-label">{c}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
