// lucide-react removed — using inline SVGs
import AIChatPanel from './AIChatPanel';
import { DISTRICTS } from '../../data/constants';
import '../../styles/admin.css';

export default function FloatingChatWidget({ context, isOpen, onToggle, targetPersona }) {

    // Merge targetPersona into context for the panel
    const chatContext = { ...context, targetPersona };

    // Helper to get asset
    const getPersonaAsset = (p) => {
        if (!p) return null;
        if (p.image_url) return p.image_url;

        // Detailed mapping based on new assets
        const age = p.age;
        const gender = p.gender;
        let assetName = null;

        if (age >= 60) {
            assetName = gender === '남성' ? 'persona_70m.png' : 'persona_70f.png';
        } else if (age >= 40) {
            assetName = gender === '남성' ? 'persona_40m.png' : 'persona_40f.png';
        } else {
            // Default to 20s for younger
            assetName = gender === '남성' ? 'persona_20m.png' : 'persona_20f.png';
        }

        if (assetName) return `/assets/personas/${assetName}`;
        return null;
    };

    const personaImage = getPersonaAsset(targetPersona);

    return (

        <div className="floating-widget-container">
            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    {/* Header */}
                    <div className={`chat-header ${targetPersona ? 'persona' : 'default'} relative overflow-visible`} style={{ minHeight: targetPersona ? '120px' : 'auto', alignItems: targetPersona ? 'flex-start' : 'center' }}>
                        {/* Standing Character Image (Absolute) */}
                        {targetPersona && personaImage && (
                            <div className="absolute bottom-0 left-4 z-10" style={{ marginBottom: '-10px' }}>
                                <img
                                    src={personaImage}
                                    alt={targetPersona.name}
                                    className="w-32 h-auto object-contain drop-shadow-lg transform hover:scale-105 transition-transform duration-300"
                                    style={{ maxHeight: '160px' }}
                                />
                            </div>
                        )}

                        <div className="chat-header-info w-full flex justify-between items-start pl-36"> {/* Added padding-left to clear image */}
                            <div className="chat-title-wrapper flex flex-col gap-1">
                                {!targetPersona && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chat-avatar-icon" style={{ marginBottom: 4 }}><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 3a3 3 0 0 0-3 3v5h6V6a3 3 0 0 0-3-3z"/><path d="M8 21v-2"/><path d="M16 21v-2"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>}
                                <h3 className="chat-title text-lg font-bold flex items-center gap-2">
                                    {targetPersona ? (
                                        <>
                                            {targetPersona.name}
                                            <span className="text-xs font-normal opacity-90 border border-white/30 px-2 py-0.5 rounded-full">
                                                {targetPersona.age}세
                                            </span>
                                        </>
                                    ) : 'AI 안전 도우미'}
                                </h3>
                                {targetPersona && (
                                    <div className="chat-subtitle text-xs opacity-90 flex flex-col gap-0.5">
                                        <p className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            {DISTRICTS.find(d => d.id === targetPersona.district_code)?.name || targetPersona.district_code} 거주
                                        </p>
                                        <p className="opacity-80 line-clamp-1">"{targetPersona.quote}"</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={onToggle}
                                className="chat-close-btn p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    <div className="chat-content-wrapper flex-1 bg-slate-50 relative z-0">
                        <AIChatPanel context={chatContext} />
                    </div>
                </div>
            )}

            {/* FAB (Floating Action Button) */}
            <button
                onClick={onToggle}
                className={`fab-btn ${isOpen ? 'open' : 'closed'}`}
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                ) : (
                    <div className="fab-icon-wrapper">
                        {targetPersona && personaImage ? (
                            <img src={personaImage} alt="img" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fab-icon"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 3a3 3 0 0 0-3 3v5h6V6a3 3 0 0 0-3-3z"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>
                                <span className="fab-status-dot"></span>
                            </>
                        )}
                    </div>
                )}
            </button>
        </div>
    );
}
