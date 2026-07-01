import { useState, useRef, useEffect } from 'react';
import '../../styles/admin.css';

export default function MultiSelectDropdown({ label, options, selectedValues, onChange, color = 'bg-primary' }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newValues);
    };

    const handleSelectAll = () => {
        if (selectedValues.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(o => o.value));
        }
    };

    return (
        <div className="dropdown-container" ref={dropdownRef}>
            <label className="dropdown-label">{label}</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="dropdown-btn"
            >
                <span className="truncate">
                    {selectedValues.length === 0
                        ? '선택안함'
                        : selectedValues.length === options.length
                            ? '전체 선택됨'
                            : `${selectedValues.length}개 선택됨`}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-icon ${isOpen ? 'open' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {isOpen && (
                <div className="dropdown-menu custom-scrollbar">
                    <div
                        className="dropdown-item"
                        onClick={handleSelectAll}
                    >
                        <div className={`checkbox-box ${selectedValues.length === options.length ? 'checked' : ''}`}>
                            {selectedValues.length === options.length && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="checkbox-icon"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span className="dropdown-item-text font-medium">전체 선택</span>
                    </div>
                    {options.map((option) => {
                        const isSelected = selectedValues.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                className="dropdown-item"
                                onClick={() => toggleOption(option.value)}
                            >
                                <div className={`checkbox-box ${isSelected ? 'checked' : ''}`}>
                                    {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="checkbox-icon"><polyline points="20 6 9 17 4 12"/></svg>}
                                </div>
                                <span className={`dropdown-item-text ${isSelected ? 'selected' : ''}`}>
                                    {option.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
