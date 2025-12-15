import { Bot, X } from 'lucide-react';
import AIChatPanel from './AIChatPanel';

export default function FloatingChatWidget({ context, isOpen, onToggle, targetPersona }) {

    // Merge targetPersona into context for the panel
    const chatContext = { ...context, targetPersona };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200 h-origin-bottom-right">
                    {/* Header */}
                    <div className={`flex items-center justify-between p-3 text-white ${targetPersona ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-slate-900'}`}>
                        <div className="flex items-center gap-2">
                            {targetPersona ? (
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg shadow-sm backdrop-blur-sm border border-white/30">
                                    {targetPersona.image_emoji}
                                </div>
                            ) : (
                                <Bot className="w-5 h-5 text-primary" />
                            )}
                            <div>
                                <h3 className="font-bold text-sm">
                                    {targetPersona ? `${targetPersona.name}님과의 대화` : 'AI 안전 도우미'}
                                </h3>
                                {targetPersona && <p className="text-[10px] text-white/80">{targetPersona.district_code} / {targetPersona.age}세</p>}
                            </div>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 overflow-hidden relative">
                        <AIChatPanel context={chatContext} />
                    </div>
                </div>
            )}

            {/* FAB (Floating Action Button) */}
            <button
                onClick={onToggle}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group ${isOpen ? 'bg-slate-700 rotate-90' : 'bg-slate-900 border-2 border-primary hover:border-white'}`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <div className="relative">
                        <Bot className="w-7 h-7 text-white group-hover:text-primary transition-colors" />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                    </div>
                )}
            </button>
        </div>
    );
}
