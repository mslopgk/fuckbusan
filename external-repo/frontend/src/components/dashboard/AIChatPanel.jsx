import { useState, useRef, useEffect } from 'react';
import api from '../../api';
import { Bot, Send, Loader2 } from 'lucide-react';
import { DISTRICTS } from '../../data/constants';

export default function AIChatPanel({ context }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const getDistrictName = (code) => {
        const d = DISTRICTS.find(item => item.id === code);
        return d ? d.name : code;
    };

    // Initialize/Reset Chat based on Context/Persona
    useEffect(() => {
        if (context.targetPersona) {
            const p = context.targetPersona;
            const hobbies = p.tags && Array.isArray(p.tags) ? p.tags.join(', ') : '산책';
            const concern = p.pain_points && Array.isArray(p.pain_points) ? p.pain_points[0] : '안전 문제';
            const locationName = getDistrictName(p.district_code);

            setMessages([
                {
                    role: 'system',
                    content: `당신은 부산 ${locationName}에 거주하는 ${p.age}세 ${p.name}입니다. 직업은 ${p.job}이고, 관심사는 ${hobbies}입니다. 평소 "${concern}" 문제에 대해 걱정이 많으며, 이와 관련된 안전/공공디자인 개선을 요구하는 시민의 입장에서 대화하세요. 말투는 해당 연령대와 부산 지역 특성을 살려 자연스럽게 하세요.`
                },
                {
                    role: 'assistant',
                    content: `반갑습니데이. 내는 ${locationName} 사는 ${p.name}이라 하예. ${concern} 때문에 요즘 진짜 걱정이 많습니다. 내 이야기 좀 들어보이소.`
                }
            ]);
        } else {
            setMessages([
                {
                    role: 'system',
                    content: `당신은 부산시 지능형 공공디자인 안전 진단 플랫폼의 AI 어시스턴트입니다. ${context.district}의 데이터(안전점수 ${context.score}점, 등급 ${context.grade})를 바탕으로 사용자의 질문에 전문적이고 친절하게 답하세요.`
                },
                {
                    role: 'assistant',
                    content: `안녕하세요! ${context.district} 공공디자인 진단 결과에 대해 궁금한 점이 있으신가요? 제가 분석해 드릴까요?`
                }
            ]);
        }
    }, [context.targetPersona, context.district]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Call Backend API
            const response = await api.post('/api/ai/chat', {
                message: input,
                history: messages,
                context: context
            });

            const botMsg = { role: 'assistant', content: response.data.response };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg = { role: 'system', content: "죄송합니다. AI 서비스 연결에 문제가 발생했습니다. (데모 모드: 서버 응답 없음)" };
            // Fallback for Demo if server fails
            const fallbackMsg = { role: 'assistant', content: context.targetPersona ? "아이고, 내 목소리가 잘 안 들리는갑네. 다시 말해볼게요." : "잠시 연결이 원활하지 않습니다. 다시 시도해주세요." };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-transparent">
            {/* Header Removed as it is handled by parent widget */}

            {/* Chat Area */}
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-none'
                            : msg.role === 'system'
                                ? 'bg-slate-100 text-slate-500 text-xs text-center w-full my-2'
                                : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-3 py-2 flex items-center gap-2 shadow-sm">
                            <span className="animate-spin text-primary"><Loader2 className="w-4 h-4" /></span>
                            <span className="text-xs text-slate-500">분석 중...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        placeholder={context.targetPersona ? "대화하기..." : "안전 진단에 대해 물어보세요..."}
                        className="w-full bg-slate-100 border border-slate-200 rounded-full pl-4 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${input.trim() && !isLoading ? 'bg-primary text-white hover:bg-primary-hover shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        disabled={!input.trim() || isLoading}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
