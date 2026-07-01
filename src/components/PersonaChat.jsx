import { useEffect, useRef, useState, useCallback } from 'react';
import './PersonaChat.css';
import { API_URL, authHeaders } from '../utils/api';

/* AI 가상시민 챗봇 — 페르소나와 1인칭 대화.
   ⚠️ 백엔드는 사용자 RAG 시스템이 담당. 이 컴포넌트는 아래 계약으로 호출만 한다:
     POST {API_URL}/api/ai-citizens/{id}/chat
       body: { message: string, history: [{role:'user'|'assistant', content:string}] }
       res : { reply: string, suggested?: string[] }
   엔드포인트 미구현(404 등) 시 안내 메시지로 폴백(대화 UI는 정상 동작). */

const avatarOf = (p) => p?.avatarUrl || p?.image_url || null;

// 받침에 따라 로/으로 조사
function ro(word) {
    if (!word) return '로';
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xac00 || code > 0xd7a3) return '로';
    const jong = (code - 0xac00) % 28;
    return jong === 0 || jong === 8 ? '로' : '으로';  // 받침 없음 또는 ㄹ받침 → 로
}

// 페르소나 데이터로 시작 인사 + 추천 질문 구성 (백엔드 없이 클라에서)
function buildGreeting(p) {
    const job = p?.detail?.job || p?.job || '시민';
    const greet = `안녕하세요, 저는 ${p?.district || p?.district_code || '부산'}에 사는 ${p?.name || '시민'}(${p?.age ?? '?'}세)예요. ${job}${ro(job)} 지내고 있어요. 우리 동네나 제 생활에 대해 궁금한 거 있으면 편하게 물어보세요!`;
    const issues = p?.detail?.top_issues || p?.pain_points || [];
    const sugg = [];
    if (issues[0]) sugg.push(`${String(issues[0]).slice(0, 18)} 관련해서 어떠세요?`);
    sugg.push('요즘 동네에서 가장 불편한 점은 뭐예요?');
    sugg.push('어떤 공공서비스가 더 있으면 좋겠어요?');
    return { greet, sugg: sugg.slice(0, 3) };
}

export default function PersonaChat({ persona, onClose, embedded = false }) {
    const [messages, setMessages] = useState([]);   // {role:'assistant'|'user', text}
    const [suggested, setSuggested] = useState([]);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const scrollRef = useRef(null);
    const initRef = useRef(false);

    // 시작 인사
    useEffect(() => {
        if (initRef.current || !persona) return;
        initRef.current = true;
        const { greet, sugg } = buildGreeting(persona);
        setMessages([{ role: 'assistant', text: greet }]);
        setSuggested(sugg);
    }, [persona]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, busy]);

    const send = useCallback(async (text) => {
        const t = (text ?? draft).trim();
        if (!t || busy || !persona) return;
        setDraft('');
        setSuggested([]);
        const history = messages.map((m) => ({ role: m.role, content: m.text }));
        setMessages((m) => [...m, { role: 'user', text: t }]);
        setBusy(true);
        try {
            const res = await fetch(`${API_URL}/api/ai-citizens/${persona.id}/chat`, {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ message: t, history }),
            });
            if (!res.ok) throw new Error('not-ready');
            const d = await res.json();
            setMessages((m) => [...m, { role: 'assistant', text: d.reply || '...' }]);
            setSuggested(Array.isArray(d.suggested) ? d.suggested.slice(0, 3) : []);
        } catch {
            setMessages((m) => [...m, {
                role: 'assistant',
                text: '죄송해요, 지금은 대화 기능이 준비 중이에요. 곧 직접 이야기 나눌 수 있게 될 거예요!',
            }]);
        } finally {
            setBusy(false);
        }
    }, [draft, busy, persona, messages]);

    if (!persona) return null;

    const avatar = avatarOf(persona);
    const body = (
        <div className="pchat">
            <div className="pchat-head">
                <div className="pchat-head-id">
                    <span className="pchat-avatar">
                        {avatar ? <img src={avatar} alt="" /> : <span className="pchat-avatar-fallback">{persona.avatar_initial || persona.name?.[0] || '시'}</span>}
                    </span>
                    <span className="pchat-head-text">
                        <strong>{persona.name}</strong>
                        <em>{persona.age}세 · {persona.district || persona.district_code} · AI 가상시민</em>
                    </span>
                </div>
                <button type="button" className="pchat-close" onClick={onClose} aria-label="닫기">×</button>
            </div>

            <div className="pchat-scroll" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`pchat-row ${m.role}`}>
                        {m.role === 'assistant' && (
                            <span className="pchat-msg-avatar">
                                {avatar ? <img src={avatar} alt="" /> : <span>{persona.avatar_initial || persona.name?.[0] || '시'}</span>}
                            </span>
                        )}
                        <div className={`pchat-bubble ${m.role}`}>{m.text}</div>
                    </div>
                ))}
                {busy && (
                    <div className="pchat-row assistant">
                        <span className="pchat-msg-avatar">
                            {avatar ? <img src={avatar} alt="" /> : <span>{persona.avatar_initial || persona.name?.[0] || '시'}</span>}
                        </span>
                        <div className="pchat-bubble assistant pchat-typing"><span /><span /><span /></div>
                    </div>
                )}
                {!busy && suggested.length > 0 && (
                    <div className="pchat-suggest">
                        {suggested.map((s) => (
                            <button key={s} type="button" className="pchat-chip" onClick={() => send(s)}>{s}</button>
                        ))}
                    </div>
                )}
            </div>

            <div className="pchat-inputbar">
                <input
                    className="pchat-input"
                    placeholder={`${persona.name}님에게 물어보기`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) send(); }}
                    disabled={busy}
                />
                <button type="button" className={`pchat-send${draft.trim() && !busy ? ' active' : ''}`}
                    onClick={() => send()} disabled={busy || !draft.trim()} aria-label="전송">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );

    if (embedded) return body;

    return (
        <div className="pchat-backdrop" onClick={onClose}>
            <div className="pchat-modal" onClick={(e) => e.stopPropagation()}>{body}</div>
        </div>
    );
}
