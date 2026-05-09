import { useState, useRef, useEffect } from 'react';

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
        <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-text-sub mb-1.5 ml-1">{label}</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm text-text-main flex items-center justify-between hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
                <span className="truncate">
                    {selectedValues.length === 0
                        ? '선택안함'
                        : selectedValues.length === options.length
                            ? '전체 선택됨'
                            : `${selectedValues.length}개 선택됨`}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: '#6b7280' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                        className="px-3 py-2 border-b border-border flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={handleSelectAll}
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedValues.length === options.length ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                            {selectedValues.length === options.length && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span className="text-sm font-medium text-text-main">전체 선택</span>
                    </div>
                    {options.map((option) => {
                        const isSelected = selectedValues.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleOption(option.value)}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                    {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                </div>
                                <span className={`text-sm ${isSelected ? 'font-medium text-primary' : 'text-text-main'}`}>
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
