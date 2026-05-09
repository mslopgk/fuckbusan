import { useState, useEffect } from 'react';
import PCMapCanvas from './PCMapCanvas';
import './MProposalForm.css';
import './MProposalList.css';
import './MReportForm.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const CATS = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
const POSITIONS = ['위치', '도로', '인도', '공원', '주차장'];
const ISSUES = ['문제사항', '훼손', '오염', '불편', '위험'];
const DRAFT_KEY = 'mReportForm:draft';

const formatDraftDate = (iso) => {
    try {
        const d = new Date(iso);
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 작성됨`;
    } catch {
        return '';
    }
};

export default function MReportForm({ onNavigate }) {
    const [cat, setCat] = useState('');
    const [position, setPosition] = useState('');
    const [issue, setIssue] = useState('');
    const [body, setBody] = useState('');
    const [location, setLocation] = useState('');
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [pickedLat, setPickedLat] = useState(35.197);
    const [pickedLng, setPickedLng] = useState(129.063);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [draftMeta, setDraftMeta] = useState(null);
    const [toast, setToast] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.savedAt) {
                setDraftMeta(parsed);
                setRestoreOpen(true);
            }
        } catch {
            // ignore
        }
    }, []);

    const canSubmit = cat && position && issue && body.trim() && !submitting;

    const handleSaveDraft = () => {
        const draft = { cat, position, issue, body, savedAt: new Date().toISOString() };
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            setToast('임시저장 되었습니다');
            setTimeout(() => setToast(''), 1800);
        } catch {
            setToast('저장에 실패했습니다');
            setTimeout(() => setToast(''), 1800);
        }
    };

    const handleRestore = () => {
        if (!draftMeta) { setRestoreOpen(false); return; }
        setCat(draftMeta.cat || '');
        setPosition(draftMeta.position || '');
        setIssue(draftMeta.issue || '');
        setBody(draftMeta.body || '');
        setRestoreOpen(false);
    };

    const handleDiscardDraft = () => {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        setDraftMeta(null);
        setRestoreOpen(false);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const token = localStorage.getItem('access_token');
        const title = `${position}에 ${issue} 불편해요`;
        const payload = {
            category: cat,
            sub_category: `${position} · ${issue}`,
            title,
            content: body,
            detailed_address: location || undefined,
            lat: location ? pickedLat : undefined,
            lng: location ? pickedLng : undefined,
        };
        try {
            const res = await fetch(`${VITE_API_URL}/api/reports/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
                onNavigate && onNavigate('mReportDone');
            } else {
                setToast('제출에 실패했습니다. 다시 시도해주세요.');
                setTimeout(() => setToast(''), 2500);
            }
        } catch {
            setToast('네트워크 오류가 발생했습니다.');
            setTimeout(() => setToast(''), 2500);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="m-prop-form-page m-report-form-page">
            <header className="m-form-topbar">
                <button className="m-form-back" onClick={() => onNavigate && onNavigate('home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    <span>홈으로</span>
                </button>
            </header>

            <div className="m-form-body">
                <h1 className="m-form-title">문제 상황이 잘 보이도록<br/>사진을 등록해 주세요</h1>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">사진 등록</h3>
                    <button className="m-photo-add" type="button">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">위치정보</h3>
                    <button className="m-loc-input" type="button" onClick={() => setLocationPickerOpen(true)}>
                        <span className={location ? 'm-form-loc-text' : ''}>{location || '지도로 위치 설정하기'}</span>
                        <span className="m-loc-pin">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2.5"/></svg>
                        </span>
                    </button>
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">우리동네 불편사항을 제보해주세요</h3>
                    <div className="m-rcat-chips">
                        {CATS.map((c) => (
                            <button
                                key={c}
                                className={`m-cat-chip ${cat === c ? 'on' : ''}`}
                                onClick={() => setCat(c)}
                                type="button"
                            >{c}</button>
                        ))}
                    </div>

                    <div className="m-row-with-suffix">
                        <select className="m-select" value={position} onChange={(e) => setPosition(e.target.value)} required>
                            {POSITIONS.map((p, i) => (
                                <option key={p} value={i === 0 ? '' : p}>{p}</option>
                            ))}
                        </select>
                        <span className="m-row-suffix">에</span>
                    </div>

                    <div className="m-row-with-suffix">
                        <select className="m-select" value={issue} onChange={(e) => setIssue(e.target.value)} required>
                            {ISSUES.map((p, i) => (
                                <option key={p} value={i === 0 ? '' : p}>{p}</option>
                            ))}
                        </select>
                        <span className="m-row-suffix">불편해요</span>
                    </div>

                    <input
                        type="text"
                        className="m-row-input"
                        placeholder="상세설명을 작성해주세요"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />
                </section>
            </div>

            <footer className="m-form-footer">
                <button className="m-form-save" type="button" onClick={handleSaveDraft}>임시저장</button>
                <button
                    className="m-form-submit"
                    type="button"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >{submitting ? '제출 중...' : '작성완료'}</button>
            </footer>

            {toast && (
                <div className="m-form-toast" role="status">{toast}</div>
            )}

            {locationPickerOpen && (
                <div className="m-loc-picker">
                    <header className="m-loc-picker-top">
                        <button
                            className="m-form-back"
                            onClick={() => setLocationPickerOpen(false)}
                            type="button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                            <span>돌아가기</span>
                        </button>
                    </header>
                    <h2 className="m-loc-picker-title">제보할 위치를<br/>지도에서 선택해주세요.</h2>
                    <div className="m-loc-picker-map">
                        <PCMapCanvas
                            pins={[{ id: 'pick', lat: pickedLat, lng: pickedLng, color: '#E6235A', title: '제보 위치' }]}
                            accentColor="#E6235A"
                        />
                    </div>
                    <p className="m-loc-picker-help">지도를 움직여서 선택해주세요</p>
                    <button
                        className="m-loc-picker-confirm"
                        type="button"
                        onClick={() => {
                            setLocation(`위도 ${pickedLat.toFixed(4)}, 경도 ${pickedLng.toFixed(4)}`);
                            setLocationPickerOpen(false);
                        }}
                    >위치 선택완료</button>
                </div>
            )}

            {restoreOpen && draftMeta && (
                <div className="m-draft-backdrop" onClick={() => setRestoreOpen(false)}>
                    <div className="m-draft-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="m-draft-icon" aria-hidden="true">
                            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                <path d="M14 8 H32 L42 18 V46 a2 2 0 0 1 -2 2 H14 a2 2 0 0 1 -2 -2 V10 a2 2 0 0 1 2 -2 z" stroke="#1a1a1b" strokeWidth="2.5" strokeLinejoin="round" fill="#fff"/>
                                <path d="M32 8 V18 H42" stroke="#1a1a1b" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
                                <line x1="20" y1="28" x2="34" y2="28" stroke="#E6235A" strokeWidth="2.5" strokeLinecap="round"/>
                                <line x1="20" y1="34" x2="34" y2="34" stroke="#E6235A" strokeWidth="2.5" strokeLinecap="round"/>
                                <line x1="20" y1="40" x2="28" y2="40" stroke="#E6235A" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h3 className="m-draft-title">임시 저장된 내용을<br/>불러올까요?</h3>
                        <p className="m-draft-meta">· {formatDraftDate(draftMeta.savedAt)}</p>
                        <div className="m-draft-actions">
                            <button type="button" className="m-draft-btn m-draft-btn-primary" onClick={handleRestore}>불러오기</button>
                            <button type="button" className="m-draft-btn m-draft-btn-ghost" onClick={handleDiscardDraft}>새로 작성하기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
