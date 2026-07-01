// lucide-react removed — using inline SVGs
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DISTRICTS } from '../../data/constants';
import '../../styles/admin.css';

export default function PersonaDetailModal({ persona, onClose }) {
    if (!persona) return null;

    // Chart Data
    const pieData = [
        { name: '제안', value: persona.stats?.suggestion || 0, color: '#6366f1' }, // Indigo
        { name: '제보', value: persona.stats?.report || 0, color: '#f43f5e' },     // Rose
        { name: '진단', value: persona.stats?.diagnosis || 0, color: '#64748b' },  // Slate
    ];

    return (
        <div className="modal-overlay">
            {/* Modal Card */}
            <div className="modal-content">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="modal-close-btn"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                {/* Left Column: Visual Profile */}
                <div className="modal-left-col custom-scrollbar">
                    {/* Header Info */}
                    <div className="modal-profile-header">
                        <div className="modal-avatar-wrapper">
                            {persona.image_url ? (
                                <img src={persona.image_url} alt={persona.name} className="w-full h-full object-cover" />
                            ) : (
                                // Smart Fallback Logic
                                (() => {
                                    const age = parseInt(persona.age); // Parse "60" from "60" or "60세"
                                    const gender = persona.gender;
                                    let assetName = null;

                                    if (age >= 60) {
                                        assetName = (gender === '남성' || gender === 'Male') ? 'persona_70m.png' : 'persona_70f.png';
                                    } else if (age >= 40) {
                                        assetName = (gender === '남성' || gender === 'Male') ? 'persona_40m.png' : 'persona_40f.png';
                                    } else {
                                        assetName = (gender === '남성' || gender === 'Male') ? 'persona_20m.png' : 'persona_20f.png';
                                    }

                                    if (assetName) {
                                        return <img src={`/assets/personas/${assetName}`} alt={persona.name} className="w-full h-full object-cover" />;
                                    }
                                    return persona.image_emoji;
                                })()
                            )}
                        </div>
                        <h2 className="modal-name-title">{persona.name} <span className="modal-age-sub">{persona.age}세</span></h2>
                        <div className="modal-location">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: '-3px', marginRight: 2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {DISTRICTS.find(d => d.id === persona.district_code)?.name || persona.district_code}
                        </div>
                        <div className="modal-tags">
                            {persona.tags && persona.tags.map((tag, idx) => (
                                <span key={idx} className="modal-tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Stats Box */}
                    <div className="modal-stats-box">
                        <h3 className="modal-section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E6235A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: '-4px', marginRight: 4 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> 활동 데이터
                        </h3>
                        <div className="h-48 w-full relative" style={{ height: '192px', width: '100%', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                <span className="text-xs text-slate-400" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>총 참여</span>
                                <span className="text-2xl font-bold text-slate-800" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                                    {((persona.stats?.suggestion || 0) + (persona.stats?.report || 0) + (persona.stats?.diagnosis || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-2" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
                            {pieData.map((d, i) => (
                                <div key={i} className="flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div className="w-3 h-3 rounded-full" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: d.color }}></div>
                                    <span className="text-xs text-slate-500" style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.name} {d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Personal Detail */}
                    <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="modal-detail-row">
                            <span className="modal-label">직업</span>
                            <span className="modal-value">{persona.job}</span>
                        </div>
                        <div className="modal-detail-row">
                            <span className="modal-label">관심사</span>
                            <span className="modal-value">
                                {persona.tags && persona.tags.map(t => t.replace('#', '')).join(', ')}
                            </span>
                        </div>
                        <div className="modal-detail-row">
                            <span className="modal-label">주요 고민</span>
                            <span className="modal-value text-rose-500" style={{ color: '#f43f5e' }}>
                                {persona.pain_points && persona.pain_points[0]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Report */}
                <div className="modal-right-col custom-scrollbar">
                    {/* Quote Section */}
                    <div className="modal-quote-box">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="modal-quote-icon"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                        <p className="modal-quote-text">
                            {persona.quote}
                        </p>
                    </div>

                    {/* 2-Column Grid for Details */}
                    <div className="modal-grid-2">
                        {/* Pain Points */}
                        <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 className="modal-list-title">
                                <span className="modal-list-bar bg-rose"></span>
                                여기는 좀 고쳐주세요 (Pain Points)
                            </h3>
                            <ul className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0, listStyle: 'none' }}>
                                {persona.pain_points && persona.pain_points.map((point, idx) => (
                                    <li key={idx} className="modal-list-item bg-red-50">
                                        <div className="modal-list-idx text-rose">
                                            {idx + 1}
                                        </div>
                                        <span className="text-slate-700 font-medium mt-0.5" style={{ color: '#334155', fontWeight: 500, marginTop: '2px' }}>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Suggestions */}
                        <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 className="modal-list-title">
                                <span className="modal-list-bar bg-blue"></span>
                                이렇게 바뀌면 좋겠어요 (Needs)
                            </h3>
                            <ul className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0, listStyle: 'none' }}>
                                {persona.suggestions && persona.suggestions.map((point, idx) => (
                                    <li key={idx} className="modal-list-item bg-blue-50">
                                        <div className="modal-list-idx text-blue">
                                            {idx + 1}
                                        </div>
                                        <span className="text-slate-700 font-medium mt-0.5" style={{ color: '#334155', fontWeight: 500, marginTop: '2px' }}>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Expected Effects (Full Width) */}
                    <div className="modal-effects-box">
                        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" style={{ position: 'absolute', top: 0, right: 0, padding: '128px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '9999px', filter: 'blur(64px)', marginRight: '-64px', marginTop: '-64px' }}></div>

                        <h3 className="relative z-10 text-lg font-bold mb-6 flex items-center gap-2 text-primary-light" style={{ position: 'relative', zIndex: 10, fontSize: '1.125rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            기대 효과 (Expected Effects)
                        </h3>

                        <div className="modal-effects-grid">
                            {(persona.expected_effects || ['주민 안전 만족도 30% 증가', '야간 보행자 사고 50% 감소']).map((effect, idx) => (
                                <div key={idx} className="modal-effect-item">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-rose-400 flex items-center justify-center shrink-0 shadow-lg font-bold text-lg" style={{ width: '40px', height: '40px', borderRadius: '9999px', background: 'linear-gradient(to bottom right, #E6235A, #fb7185)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 700, fontSize: '1.125rem' }}>
                                        👍
                                    </div>
                                    <span className="text-lg font-bold" style={{ fontSize: '1.125rem', fontWeight: 700 }}>{effect}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
