import { useState } from 'react';
import { catIconFlipped } from './catIcons';
import './MapFilterPanel.css';

// PCAICitizen 좌측 필터(구역별 카드 + 생활정보 세로 레일, Figma 302:3872)를
// 제보/제안/진단 지도에서도 그대로 재사용하기 위해 추출한 공용 컴포넌트 (챗봇 버튼 제외).

// 구역별 카드. value가 falsy면 placeholder(설정해주세요) 표시, 아니면 실제 값(예: '전체') 표시.
export function RegionFilterCard({ value, onSelect, options, accent = '#23bdbb', placeholder = '설정해주세요', unsetValue = null }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mfp-region-card" style={{ '--mfp-accent': accent }}>
            <label className="mfp-label">구역별</label>
            <div className={`mfp-select${open ? ' open' : ''}`}>
                <button type="button" className="mfp-select-btn" onClick={() => setOpen((v) => !v)}>
                    <span className={value ? undefined : 'mfp-select-ph'}>{value || placeholder}</span>
                    {value && value !== unsetValue && (
                        <i className="mfp-select-clear" role="button" aria-label="선택 해제"
                            onClick={(e) => { e.stopPropagation(); onSelect(unsetValue); setOpen(false); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
                        </i>
                    )}
                    <i className="mfp-caret" aria-hidden="true" />
                </button>
                {open && (
                    <ul className="mfp-select-menu" role="listbox">
                        {options.map((d) => (
                            <li key={d}>
                                <button type="button" className={`mfp-select-opt${d === value ? ' sel' : ''}`}
                                    onClick={() => { onSelect(d); setOpen(false); }}>{d}</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// 생활정보 세로 레일. categories: [{ key, label, icon }]
export function LifeRail({ categories, isOn, onChange, accent = '#23bdbb' }) {
    return (
        <nav className="mfp-liferail" aria-label="생활정보 카테고리" style={{ '--mfp-accent': accent }}>
            <div className="mfp-liferail-head">생활정보</div>
            <ul className="mfp-liferail-list">
                {categories.map((c) => {
                    const on = isOn(c);
                    return (
                        <li key={c.key} className="mfp-liferail-item">
                            <button type="button"
                                className={`mfp-liferail-btn${on ? ' active' : ''}`}
                                aria-pressed={on}
                                onClick={() => onChange(c)}>
                                <img
                                    className={`mfp-liferail-ic${catIconFlipped(c.label) ? ' flip' : ''}`}
                                    src={c.icon} alt="" aria-hidden="true"
                                />
                                <span>{c.label}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
