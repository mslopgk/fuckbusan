
// lucide-react removed — using inline SVGs
import { useEffect } from 'react';

export default function InsightDetailModal({ insight, onClose }) {
    if (!insight) return null;

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return 'bg-red-500 text-white';
            case 'medium': return 'bg-orange-500 text-white';
            case 'low': return 'bg-blue-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const getSeverityLabel = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return '위험';
            case 'medium': return '주의';
            case 'low': return '양호';
            default: return '미정';
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-slate-500 hover:text-slate-800 transition-all shadow-sm"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Left: Image Section */}
                    <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 relative group">
                        <img
                            src={insight.image}
                            alt={insight.label}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wide flex items-center gap-1.5 ${getSeverityColor(insight.severity)}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                {getSeverityLabel(insight.severity)}
                            </span>
                        </div>
                    </div>

                    {/* Right: Content Section */}
                    <div className="w-full md:w-1/2 flex flex-col p-6 md:p-8 bg-white overflow-y-auto custom-scrollbar">

                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                                    {insight.category?.toUpperCase() || 'OTHER'}
                                </span>
                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    {insight.lat.toFixed(4)}, {insight.lng.toFixed(4)}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-2">
                                {insight.label}
                            </h2>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">등록일</span>
                                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    {insight.date}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">제안자</span>
                                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    <span>{insight.proposer}</span>
                                    <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                                        {insight.proposerRole}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="w-1 h-4 bg-primary rounded-full"></span>
                                상세 내용
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                {insight.description || "상세 설명이 없습니다."}
                            </p>
                        </div>

                        {/* AI Analysis Mockup */}
                        <div className="mt-auto bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
                                🤖 AI 분석 코멘트
                            </h3>
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                이 지역은 <strong>{insight.category === 'transport' ? '보행 안전' : '공공 시설'}</strong> 관련 민원이 빈번하게 발생하는 곳입니다.
                                최근 3개월간 유사한 신고가 5건 접수되었으며,
                                {insight.severity === 'high'
                                    ? '즉각적인 현장 점검과 개선 조치가 시급해 보입니다.'
                                    : '정기적인 모니터링을 통한 관리가 권장됩니다.'}
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
