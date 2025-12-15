import { X, MapPin, Activity, Heart, Quote, PieChart as PieIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function PersonaDetailModal({ persona, onClose }) {
    if (!persona) return null;

    // Chart Data
    const pieData = [
        { name: '제안', value: persona.stats?.suggestion || 0, color: '#6366f1' }, // Indigo
        { name: '제보', value: persona.stats?.report || 0, color: '#f43f5e' },     // Rose
        { name: '진단', value: persona.stats?.diagnosis || 0, color: '#64748b' },  // Slate
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Modal Card */}
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[85vh] flex overflow-hidden relative animate-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/80 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-slate-200"
                >
                    <X className="w-6 h-6 text-slate-600" />
                </button>

                {/* Left Column: Visual Profile */}
                <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col p-8 overflow-y-auto custom-scrollbar">
                    {/* Header Info */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-8xl mb-4 relative">
                            {persona.image_emoji}
                            <div className="absolute bottom-0 right-0 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                {persona.district_code}
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-1">{persona.name} <span className="text-xl font-normal text-slate-500">{persona.age}세</span></h2>
                        <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                            <MapPin className="w-4 h-4" /> {persona.district_code}
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {persona.tags.map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600 font-medium shadow-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Stats Box */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" /> 활동 데이터
                        </h3>
                        <div className="h-48 w-full relative">
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xs text-slate-400">총 참여</span>
                                <span className="text-2xl font-bold text-slate-800">
                                    {((persona.stats?.suggestion || 0) + (persona.stats?.report || 0) + (persona.stats?.diagnosis || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                            {pieData.map((d, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                    <span className="text-xs text-slate-500">{d.name} {d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Personal Detail */}
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500 font-medium">직업</span>
                            <span className="text-slate-800 font-bold">{persona.job}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500 font-medium">관심사</span>
                            <span className="text-slate-800 text-right max-w-[60%]">
                                {persona.tags && persona.tags.map(t => t.replace('#', '')).join(', ')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">주요 고민</span>
                            <span className="text-slate-800 text-right max-w-[60%] font-bold text-rose-500">
                                {persona.pain_points && persona.pain_points[0]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Report */}
                <div className="w-2/3 bg-white p-10 overflow-y-auto custom-scrollbar flex flex-col gap-10">
                    {/* Quote Section */}
                    <div className="relative p-8 bg-slate-50 rounded-b-3xl rounded-tr-3xl">
                        <Quote className="absolute top-6 left-6 w-10 h-10 text-slate-200" />
                        <p className="relative z-10 text-2xl font-bold text-slate-800 leading-relaxed word-keep-all pl-10">
                            {persona.full_quote}
                        </p>
                    </div>

                    {/* 3-Column Grid for Details */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Pain Points */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-6 bg-rose-500 rounded-sm"></span>
                                여기는 좀 고쳐주세요 (Pain Points)
                            </h3>
                            <ul className="space-y-3">
                                {persona.pain_points && persona.pain_points.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
                                        <div className="w-6 h-6 rounded-full bg-white text-rose-500 font-bold flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                                            {idx + 1}
                                        </div>
                                        <span className="text-slate-700 font-medium mt-0.5">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Suggestions */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                                이렇게 바뀌면 좋겠어요 (Needs)
                            </h3>
                            <ul className="space-y-3">
                                {persona.suggestions && persona.suggestions.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="w-6 h-6 rounded-full bg-white text-blue-500 font-bold flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                            {idx + 1}
                                        </div>
                                        <span className="text-slate-700 font-medium mt-0.5">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Expected Effects (Full Width) */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                        <h3 className="relative z-10 text-lg font-bold mb-6 flex items-center gap-2 text-primary-light">
                            <Heart className="w-5 h-5 fill-current" />
                            기대 효과 (Expected Effects)
                        </h3>

                        <div className="relative z-10 grid grid-cols-2 gap-6">
                            {persona.expected_effects && persona.expected_effects.map((effect, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-rose-400 flex items-center justify-center shrink-0 shadow-lg font-bold text-lg">
                                        👍
                                    </div>
                                    <span className="text-lg font-bold">{effect}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
