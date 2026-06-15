import { useEffect, useRef, useState } from 'react';
import './SurveyChat.css';
import './SurveyChatHistory.css';
import MobileBottomNav from './MobileBottomNav';
import UserPCLayout from './UserPCLayout';
import { API_URL, authHeaders } from '../utils/api';

/* AI 대화형 설문 이전 대화내역 다시보기 (읽기 전용).
   나의 활동 > 설문 > (AI 대화형 설문 카드) 클릭 시 진입.
   백엔드: GET /api/survey-chat/session/{session_id} */

export default function SurveyChatHistory({ sessionId, title: initialTitle, onBack, onNavigate, isPC = false }) {
    const [title, setTitle] = useState(initialTitle || 'AI 대화형 설문');
    const [messages, setMessages] = useState([]);
    const [meta, setMeta] = useState({ created_at: null, issue_count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!sessionId) { setError('대화 세션 정보가 없습니다.'); setLoading(false); return; }
        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/survey-chat/session/${encodeURIComponent(sessionId)}`, {
                    headers: authHeaders(),
                });
                if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || '대화 기록을 불러오지 못했습니다.');
                const d = await res.json();
                setTitle(d.title || initialTitle || 'AI 대화형 설문');
                setMessages(Array.isArray(d.messages) ? d.messages : []);
                setMeta({ created_at: d.created_at, issue_count: d.issue_count || 0 });
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [sessionId, initialTitle]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = 0;
    }, [messages]);

    const fmtDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    };

    const body = (
        <div className={`surveychat schist${isPC ? ' pc' : ''}`}>
            <div className="surveychat-card">
                <div className="schist-head">
                    <h1 className="schist-title">{title}</h1>
                    <p className="schist-sub">
                        AI 대화형 설문 · 완료
                        {meta.issue_count ? ` · 수집 이슈 ${meta.issue_count}건` : ''}
                        {meta.created_at ? ` · ${fmtDate(meta.created_at)}` : ''}
                    </p>
                </div>
                <div className="surveychat-scroll schist-scroll" ref={scrollRef}>
                    {loading && <p className="schist-state">대화내역을 불러오는 중...</p>}
                    {error && <p className="schist-state schist-error">{error}</p>}
                    {!loading && !error && messages.length === 0 && (
                        <p className="schist-state">표시할 대화내역이 없습니다.</p>
                    )}
                    {messages.map((m, i) => {
                        // 저장된 transcript role은 OpenAI 형식(assistant/user) → 말풍선 클래스(ai/user)로 정규화
                        const cls = m.role === 'user' ? 'user' : 'ai';
                        return (
                            <div key={i} className={`surveychat-row ${cls}`}>
                                <div className={`surveychat-bubble ${cls}`}>{m.content}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="schist-footer">
                    <button type="button" className="schist-back-btn" onClick={() => (onBack ? onBack() : onNavigate && onNavigate('mySurveys'))}>
                        목록으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );

    if (isPC) {
        return (
            <UserPCLayout currentView="mySurveys" onNavigate={onNavigate}>
                {body}
            </UserPCLayout>
        );
    }

    return (
        <>
            <header className="schist-mobile-header">
                <button className="schist-mobile-back" aria-label="뒤로" onClick={() => (onBack ? onBack() : onNavigate && onNavigate('mySurveys'))}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <span className="schist-mobile-title">대화내역</span>
                <span style={{ width: 24 }} />
            </header>
            {body}
            <MobileBottomNav currentView="myActivityHub" onNavigate={onNavigate} />
        </>
    );
}
