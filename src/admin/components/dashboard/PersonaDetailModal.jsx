import { X, MapPin, Activity, Heart, Quote, PieChart as PieIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
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
                    <X className="w-6 h-6 text-slate-600" style={{ color: '#475569' }} />
                </button>

                {/* Left Column: Visual Profile */}
                <div className="modal-left-col custom-scrollbar">
                    {/* Header Info */}
                    <div className="modal-profile-header">
                        <div className="modal-avatar-wrapper">
                            {persona.image_emoji}
                            <div className="modal-district-badge">
                                {persona.district_code}
                            </div>
                        </div>
                        <h2 className="modal-name-title">{persona.name} <span className="modal-age-sub">{persona.age}세</span></h2>
                        <div className="modal-location">
                            <MapPin className="w-4 h-4" /> {persona.district_code}
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
                            <Activity className="w-5 h-5 text-primary" style={{ color: '#E6235A' }} /> 활동 데이터
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
                        <Quote className="modal-quote-icon" />
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
                            <Heart className="w-5 h-5 fill-current" />
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
