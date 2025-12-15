import { ChevronRight, MessageCircle } from 'lucide-react';

export default function AIPersonaPanel({ personas = [], onSelectPersona, onChatClick }) {
    if (!personas || personas.length === 0) {
        return (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center">
                <p className="text-slate-400 text-sm">생성된 AI 페르소나가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 h-full bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-1 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-800"><span className="text-primary">AI 가상시민</span> 리포트</h3>
                </div>
                <p className="text-xs text-slate-500">
                    빅데이터로 생성된 우리 동네 가상 시민들의<br />
                    생생한 목소리와 안전 제안을 확인하세요.
                </p>
            </div>

            {/* Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-rose-300"></div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-3 mt-2">
                {personas.map((persona) => (
                    <div
                        key={persona.id}
                        className="group relative flex flex-col gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
                        onClick={() => onSelectPersona(persona)}
                    >
                        {/* Chat Button - Always Visible */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChatClick && onChatClick(persona);
                            }}
                            className="absolute top-3 right-3 p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-primary hover:border-primary hover:bg-slate-50 transition-all shadow-sm z-20"
                            title="이 시민과 대화하기"
                        >
                            <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Profile Header */}
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-sm group-hover:scale-105 transition-transform">
                                {persona.image_emoji}
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-end gap-2 mb-1">
                                    <span className="font-bold text-slate-800 text-base">{persona.name}</span>
                                    <span className="text-xs text-slate-500 mb-0.5">{persona.age}세</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {persona.tags && Array.isArray(persona.tags) && persona.tags.slice(0, 2).map((tag, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-500">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Arrow Icon (Absolute or specialized) - Removed default flow to avoid overlap, or keep it? 
                              ChevronRight was at the end. I will keep it but maybe position it differently or hide it when chat button appears? 
                              Actually, let's keep ChevronRight but maybe move it down or just let it be. 
                              The chat button is top-right. Chevron was right aligned. 
                              I'll remove ChevronRight to reduce clutter since card has hover shadow.
                            */}
                        </div>

                        {/* Comment Bubble */}
                        <div className="relative bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 leading-snug group-hover:text-slate-900 group-hover:bg-slate-50 transition-colors">
                            <div className="absolute -top-1.5 left-5 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45 group-hover:bg-slate-50"></div>
                            {persona.quote}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-400">총 {personas.length}명의 가상 시민이 분석되었습니다.</span>
            </div>
        </div>
    );
}
