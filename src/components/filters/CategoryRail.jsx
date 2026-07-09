import { catIcon, catIconFlipped } from './catIcons';
import './CategoryRail.css';

// 생활정보 카테고리 필터 (Figma 302:5940 디자인 언어)
// variant: 'row' (모바일 가로 스크롤) | 'rail' (PC 세로 rail 카드)
// accent: 활성 라벨 색, tint: 활성 배경 tint
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
    return (
        <div className={`cat-rail cat-rail--${variant} ${className}`}>
            {variant === 'rail' && title && <div className="cat-rail-title">{title}</div>}
            <div className="cat-rail-items">
                {categories.map((c) => {
                    const on = value === c;
                    return (
                        <button
                            key={c}
                            type="button"
                            className={`cat-rail-item${on ? ' on' : ''}`}
                            style={on ? { color: accent, background: tint } : undefined}
                            onClick={() => onChange(c)}
                        >
                            <span className={`cat-rail-ic${catIconFlipped(c) ? ' flip' : ''}`}>
                                <img src={catIcon(c)} alt="" aria-hidden="true" />
                            </span>
                            <span className="cat-rail-label">{c}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
