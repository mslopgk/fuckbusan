import { Bot, X } from 'lucide-react';
import AIChatPanel from './AIChatPanel';
import '../../styles/admin.css';

export default function FloatingChatWidget({ context, isOpen, onToggle, targetPersona }) {

    // Merge targetPersona into context for the panel
    const chatContext = { ...context, targetPersona };

    return (

        <div className="floating-widget-container">
            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    {/* Header */}
                    <div className={`chat-header ${targetPersona ? 'persona' : 'default'}`}>
                        <div className="chat-header-info">
                            {targetPersona ? (
                                <div className="chat-avatar-wrapper">
                                    {targetPersona.image_emoji}
                                </div>
                            ) : (
                                <Bot className="chat-avatar-icon" />
                            )}
                            <div className="chat-title-wrapper">
                                <h3 className="chat-title">
                                    {targetPersona ? `${targetPersona.name}님과의 대화` : 'AI 안전 도우미'}
                                </h3>
                                {targetPersona && <p className="chat-subtitle">{targetPersona.district_code} / {targetPersona.age}세</p>}
                            </div>
                        </div>
                        <button
                            onClick={onToggle}
                            className="chat-close-btn"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Chat Content */}
                    <div className="chat-content-wrapper">
                        <AIChatPanel context={chatContext} /> {/* Ensure AIChatPanel is also refactored if it uses Tailwind */}
                    </div>
                </div>
            )}

            {/* FAB (Floating Action Button) */}
            <button
                onClick={onToggle}
                className={`fab-btn ${isOpen ? 'open' : 'closed'}`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <div className="fab-icon-wrapper">
                        <Bot className="fab-icon" />
                        <span className="fab-status-dot"></span>
                    </div>
                )}
            </button>
        </div>
    );
}
