// lucide-react removed — using inline SVGs
import '../../styles/admin.css';

export default function AIPersonaPanel({ personas = [], onSelectPersona, onChatClick }) {
    if (!personas || personas.length === 0) {
        return (
            <div className="persona-empty">
                <p className="text-slate-400 text-sm">생성된 AI 페르소나가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="persona-panel-container">
            {/* Header */}
            <div className="persona-panel-header">
                <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="persona-panel-title"><span className="text-primary">AI 가상시민</span> 리포트</h3>
                </div>
                <p className="persona-panel-desc">
                    빅데이터로 생성된 우리 동네 가상 시민들의<br />
                    생생한 목소리와 안전 제안을 확인하세요.
                </p>
            </div>

            {/* Accent Line */}
            <div className="persona-accent"></div>

            {/* Scrollable List */}
            <div className="persona-list custom-scrollbar">
                {personas.map((persona) => (
                    <div
                        key={persona.id}
                        className="persona-card group"
                        onClick={() => onSelectPersona(persona)}
                    >
                        {/* Chat Button - Always Visible */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChatClick && onChatClick(persona);
                            }}
                            className="persona-btn-chat"
                            title="이 시민과 대화하기"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </button>

                        {/* Profile Header */}
                        <div className="persona-profile-header">
                            <div className="persona-avatar">
                                {persona.image_url ? (
                                    <img src={persona.image_url} alt={persona.name} className="w-full h-full object-cover" />
                                ) : (
                                    persona.image_emoji
                                )}
                            </div>
                            <div className="persona-info">
                                <div className="persona-name-row">
                                    <span className="persona-name">{persona.name}</span>
                                    <span className="persona-age">{persona.age}세</span>
                                </div>
                                <div className="persona-tags">
                                    {persona.tags && Array.isArray(persona.tags) && persona.tags.slice(0, 2).map((tag, idx) => (
                                        <span key={idx} className="persona-tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Comment Bubble */}
                        <div className="persona-quote-bubble">
                            <div className="persona-quote-arrow"></div>
                            {persona.quote}
                        </div>
                    </div>
                ))}
            </div>

            <div className="persona-footer">
                <span className="persona-footer-text">총 {personas.length}명의 가상 시민이 분석되었습니다.</span>
            </div>
        </div>
    );
}
