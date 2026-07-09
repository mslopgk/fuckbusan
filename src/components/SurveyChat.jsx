import { useState, useEffect, useRef, useCallback } from 'react';
import './SurveyChat.css';
import MobileBottomNav from './MobileBottomNav';
import UserPCLayout from './UserPCLayout';
import { API_URL, authHeaders } from '../utils/api';

/* AI 대화형 설문 (구글폼 → 챗봇 형태 리뉴얼)
   Figma: TCuOzEqNhoLKjhF0reBDks  인트로 302:2694 / 대화 302:2936 (teal 테마)
   백엔드: /api/survey-chat (start/message) — shain1912/test4 인터뷰 엔진 이식 (OpenAI 전용)
   - 서버가 응답하는 AI 메시지 + suggested_replies(보기 칩)로 진행 (로컬 목업 없음)
   - 인트로 화면(무엇을 도와드릴까요? + 칩 + 설문 시작하기) → "설문 시작하기"로 세션 시작 */

const INTRO = [
    { key: 'report', emoji: '🙋🏻', label: '불편사항 이야기하기' },
    { key: 'propose', emoji: '🌱', label: '환경 개선 제안하기' },
    { key: 'diagnose', emoji: '🏠', label: '우리동네 진단하기' },
];

export default function SurveyChat({ onNavigate, isPC = false }) {
    const [messages, setMessages] = useState([]); // { role:'ai'|'user', text }
    const [suggestions, setSuggestions] = useState([]);
    // 현재 질문이 기대하는 입력 위젯: { type:'text'|'single_choice'|'scale', choices:[], scale:{min,max,labels} }
    const [activeInput, setActiveInput] = useState({ type: 'text', choices: [], scale: null });
    const [complete, setComplete] = useState(false);
    const [started, setStarted] = useState(false); // 인트로 → 대화 전환
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const sessionRef = useRef(null);   // 서버 세션 id
    const scrollRef = useRef(null);
    const startedRef = useRef(false);  // beginSurvey 1회만 실행 (더블클릭/StrictMode 이중 마운트 방지)

    const nav = (target) => onNavigate && onNavigate(target);

    // AI 턴 반영: 메시지 + 입력 위젯(유형/보기/척도) + 텍스트형 빠른보기
    const pushAI = (text, payload = {}) => {
        setMessages((m) => [...m, { role: 'ai', text }]);
        const type = payload.input_type || 'text';
        setActiveInput({ type, choices: payload.choices || [], scale: payload.scale || null });
        setSuggestions(type === 'text' ? (payload.suggested_replies || []) : []);
    };

    // 세션 시작
    const start = useCallback(async () => {
        setMessages([]); setSuggestions([]); setComplete(false); setDraft('');
        setActiveInput({ type: 'text', choices: [], scale: null });
        sessionRef.current = null;
        try {
            const res = await fetch(`${API_URL}/api/survey-chat/start`, { method: 'POST' });
            if (!res.ok) throw new Error('start failed');
            const d = await res.json();
            sessionRef.current = d.session_id;
            pushAI(d.greeting, d);
        } catch {
            sessionRef.current = null;
            pushAI('지금은 AI 설문을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
    }, []);

    // 새 메시지마다 맨 아래로 스크롤
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, suggestions, complete, started]);

    const send = async (text) => {
        const t = (text ?? draft).trim();
        if (!t || busy || complete) return;
        setMessages((m) => [...m, { role: 'user', text: t }]);
        setSuggestions([]);
        setActiveInput({ type: 'text', choices: [], scale: null });
        setDraft('');

        if (!sessionRef.current) {
            pushAI('지금은 AI 설문을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        setBusy(true);
        try {
            const res = await fetch(`${API_URL}/api/survey-chat/message`, {
                method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ session_id: sessionRef.current, message: t }),
            });
            if (!res.ok) throw new Error('message failed');
            const d = await res.json();
            pushAI(d.response, d);
            if (d.is_complete) setComplete(true);
        } catch {
            pushAI('일시적으로 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.');
        } finally { setBusy(false); }
    };

    // 인트로 → 대화 진입 (세션 시작 후 선택지가 있으면 첫 메시지 전송)
    const beginSurvey = async (firstMsg) => {
        if (startedRef.current) return;
        startedRef.current = true;
        setStarted(true);
        await start();
        if (firstMsg) send(firstMsg);
    };

    const onIntro = (key) => {
        if (key === 'diagnose') { nav(isPC ? 'pcDiagnosisMap' : 'mDiagnosisList'); return; }
        const chip = INTRO.find((c) => c.key === key);
        beginSurvey(chip ? chip.label : '');
    };

    // 인트로 칩 목록
    const introChips = (
        <div className={`surveychat-intro ${isPC ? 'pc' : 'mobile'}`}>
            {INTRO.map((c) => (
                <button key={c.key} type="button" className="surveychat-introchip" onClick={() => onIntro(c.key)}>
                    <span className="surveychat-introemoji">{c.emoji}</span>{c.label}
                </button>
            ))}
        </div>
    );

    // 카드 스크롤 영역(인트로/대화 공용)
    const cardInner = (
        <>
            <div className={`surveychat-scroll${isPC ? '' : ' mobile'}`} ref={scrollRef}>
                {!started ? (
                    /* ===== 인트로 ===== */
                    isPC ? (
                        <div className="surveychat-introwrap">
                            <h1 className="surveychat-title">무엇을 도와드릴까요?</h1>
                            <div className="surveychat-pc-body">
                                <p className="surveychat-pc-desc">생활 속에서 느낀 불편이나<br />개선이 필요한 공간에 대해 이야기해주세요.</p>
                                {introChips}
                            </div>
                            <div className="surveychat-startwrap">
                                <button type="button" className="surveychat-startbtn" onClick={() => beginSurvey()}>설문 시작하기</button>
                            </div>
                        </div>
                    ) : (
                        <div className="surveychat-introwrap mobile">
                            <p className="surveychat-pc-desc mobile">생활 속에서 느낀 불편이나<br />개선이 필요한 공간에 대해 이야기해주세요.</p>
                            {introChips}
                            <div className="surveychat-startwrap">
                                <button type="button" className="surveychat-startbtn" onClick={() => beginSurvey()}>설문 시작하기</button>
                            </div>
                        </div>
                    )
                ) : (
                    /* ===== 대화 ===== */
                    <>
                        {messages.map((m, i) => (
                            <div key={i} className={`surveychat-row ${m.role}`}>
                                <div className={`surveychat-bubble ${m.role}`}>{m.text}</div>
                            </div>
                        ))}

                        {busy && (
                            <div className="surveychat-row ai">
                                <div className="surveychat-bubble ai surveychat-typing"><span /><span /><span /></div>
                            </div>
                        )}

                        {/* 질문 유형별 입력 위젯 */}
                        {!complete && !busy && (
                            <>
                                {/* 척도(리커트) — 낮음/보통/높음 트랙 */}
                                {activeInput.type === 'scale' && activeInput.scale?.labels?.length > 0 && (
                                    <div className="surveychat-scale" role="radiogroup" aria-label="척도 선택">
                                        <span className="surveychat-scale-track" />
                                        <div className="surveychat-scale-dots">
                                            {activeInput.scale.labels.map((lbl, i) => (
                                                <button
                                                    key={lbl + i}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked="false"
                                                    aria-label={lbl}
                                                    className="surveychat-scale-dot"
                                                    onClick={() => send(lbl)}
                                                >
                                                    <span className="surveychat-scale-bullet" />
                                                    <span className="surveychat-scale-label">{lbl}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 단일 선택 — 옵션 칩 */}
                                {activeInput.type === 'single_choice' && activeInput.choices.length > 0 && (
                                    <div className="surveychat-options">
                                        {activeInput.choices.map((opt) => (
                                            <button key={opt} type="button" className="surveychat-opt" onClick={() => send(opt)}>{opt}</button>
                                        ))}
                                    </div>
                                )}

                                {/* 자유서술 — 빠른 예시 보기(선택) */}
                                {activeInput.type === 'text' && suggestions.length > 0 && (
                                    <div className="surveychat-options">
                                        {suggestions.map((opt) => (
                                            <button key={opt} type="button" className="surveychat-opt" onClick={() => send(opt)}>{opt}</button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* 종료: 새 설문 시작 / 홈으로 */}
                        {complete && (
                            <>
                                <div className="surveychat-final">
                                    <button type="button" className="surveychat-cta fill" onClick={() => start()}>새로운 설문 시작하기</button>
                                    <button type="button" className="surveychat-cta ghost" onClick={() => nav('home')}>홈으로</button>
                                </div>
                                <p className="surveychat-note">소중한 의견 감사합니다.{'\n'}우리 동네 개선에 큰 도움이 됩니다.</p>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* 입력바 — 대화 시작 후에만 노출 (인트로엔 없음) */}
            {started && (
                <div className="surveychat-inputbar">
                    <div className="surveychat-field">
                        <button type="button" className="surveychat-attach" aria-label="첨부">
                            <img src="/figma-assets/icons/attach_icon.png" alt="" width="22" height="22" />
                        </button>
                        <input
                            className="surveychat-textfield"
                            placeholder={complete ? '설문이 완료되었습니다' : '질문하기'}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                // 한글 IME 조합 중 Enter는 무시 (조합 미완 글자가 입력창에 남는 버그 방지)
                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) send();
                            }}
                            disabled={complete}
                        />
                    </div>
                    <button
                        type="button"
                        className={`surveychat-send${draft.trim() && !busy && !complete ? ' active' : ''}`}
                        onClick={() => send()}
                        disabled={busy || complete}
                        aria-label="전송"
                    >
                        <span className="surveychat-send-label">전송</span>
                        <img src="/figma-assets/icons/send_icon.svg" alt="" />
                    </button>
                </div>
            )}
        </>
    );

    if (isPC) {
        return (
            <UserPCLayout currentView="pcSurveyList" onNavigate={onNavigate}>
                <div className="surveychat pc">
                    <div className="surveychat-cardwrap">
                        <div className="surveychat-avatar" aria-hidden="true">
                            <img src="/figma-assets/icons/survey_persona.svg" alt="" width="52" height="52" />
                        </div>
                        <div className="surveychat-card">{cardInner}</div>
                    </div>
                </div>
            </UserPCLayout>
        );
    }

    return (
        <div className="surveychat">
            <div className="surveychat-topbar">
                <button type="button" className="surveychat-back" onClick={() => nav('home')} aria-label="뒤로">
                    <img src="/figma-assets/icons/icon_back_arrow.svg" alt="" width="8" height="14" />
                </button>
                <h1 className="surveychat-title-inline">무엇을 도와드릴까요?</h1>
            </div>
            <div className="surveychat-card">{cardInner}</div>
            <MobileBottomNav onNavigate={onNavigate} />
        </div>
    );
}
