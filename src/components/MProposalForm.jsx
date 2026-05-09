import { useState, useRef, useEffect } from 'react';
import PCMapCanvas from './PCMapCanvas';
import { formatDraftDate } from '../utils/format';
import './MProposalForm.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const TYPES = ['주거', '환경', '교육', '안전', '산업·일자리', '교통', '문화·여가', '보건·복지'];
const DRAFT_KEY = 'mProposalForm:draft';


export default function MProposalForm({ onNavigate }) {
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [location, setLocation] = useState('');
    const [photos, setPhotos] = useState([]);
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [pickedLat, setPickedLat] = useState(35.197);
    const [pickedLng, setPickedLng] = useState(129.063);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [draftMeta, setDraftMeta] = useState(null);
    const [toast, setToast] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

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

    const canSubmit = type && title.trim() && body.trim() && !submitting;

    const handleSaveDraft = () => {
        const draft = {
            type,
            title,
            body,
            location,
            pickedLat,
            pickedLng,
            savedAt: new Date().toISOString(),
        };
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
        if (!draftMeta) {
            setRestoreOpen(false);
            return;
        }
        setType(draftMeta.type || '');
        setTitle(draftMeta.title || '');
        setBody(draftMeta.body || '');
        setLocation(draftMeta.location || '');
        if (typeof draftMeta.pickedLat === 'number') setPickedLat(draftMeta.pickedLat);
        if (typeof draftMeta.pickedLng === 'number') setPickedLng(draftMeta.pickedLng);
        setRestoreOpen(false);
    };

    const handleDiscardDraft = () => {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {
            // ignore
        }
        setDraftMeta(null);
        setRestoreOpen(false);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const token = localStorage.getItem('access_token');
        const payload = {
            category: type,
            title: title.trim(),
            content: body.trim(),
            region: '부산',
            detailed_address: location || undefined,
            files: [],
        };
        try {
            const res = await fetch(`${VITE_API_URL}/api/reports/new-proposal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
                onNavigate && onNavigate('mProposalDone');
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

    const handleFiles = (e) => {
        const files = Array.from(e.target.files || []);
        const items = files.map((f) => ({
            id: `${f.name}-${f.size}-${f.lastModified}`,
            name: f.name,
            url: URL.createObjectURL(f),
        }));
        setPhotos((prev) => [...prev, ...items]);
        e.target.value = '';
    };

    const removePhoto = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id));

    return (
        <div className="m-prop-form-page">
            <header className="m-form-topbar">
                <button className="m-form-back" onClick={() => onNavigate && onNavigate('home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    <span>홈으로</span>
                </button>
            </header>

            <div className="m-form-body">
                <h1 className="m-form-title">우리동네 개선 아이디어를<br/>제안해보세요</h1>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">제안 유형은 무엇인가요?</h3>
                    <div className="m-form-type-grid">
                        {TYPES.map((t) => (
                            <label key={t} className="m-form-type">
                                <input type="radio" name="type" checked={type === t} onChange={() => setType(t)} />
                                <span className="m-form-type-dot" />
                                <span>{t}</span>
                            </label>
                        ))}
                    </div>
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">제목</h3>
                    <input
                        type="text"
                        className="m-form-input"
                        placeholder="제목을 입력해주세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">자세한 설명</h3>
                    <textarea
                        className="m-form-textarea"
                        placeholder={"우리동네 개선방안, 기대효과를\n자세히 작성해주세요."}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">위치정보</h3>
                    <button
                        type="button"
                        className="m-form-loc-btn"
                        onClick={() => setLocationPickerOpen(true)}
                    >
                        <span className={location ? 'm-form-loc-text' : 'm-form-loc-placeholder'}>
                            {location || '지도로 위치 설정하기'}
                        </span>
                        <span className="m-form-loc-pin">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2.5"/></svg>
                        </span>
                    </button>
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">첨부자료 <span className="m-form-section-sub">(선택)</span></h3>
                    <div className="m-form-attach-row">
                        <button
                            type="button"
                            className="m-form-attach-add"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="사진 추가"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                        {photos.map((p) => (
                            <div key={p.id} className="m-form-attach-thumb">
                                <img src={p.url} alt={p.name} />
                                <button
                                    type="button"
                                    className="m-form-attach-x"
                                    onClick={() => removePhoto(p.id)}
                                    aria-label="삭제"
                                >×</button>
                            </div>
                        ))}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFiles}
                        />
                    </div>
                    <p className="m-form-attach-help">* 사진 또는 동영상 첨부해주세요</p>
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

            {locationPickerOpen && (
                <div className="m-loc-picker">
                    <header className="m-loc-picker-top">
                        <button
                            className="m-form-back"
                            onClick={() => setLocationPickerOpen(false)}
                            type="button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                            <span>홈으로</span>
                        </button>
                    </header>
                    <h2 className="m-loc-picker-title">우리동네 공공디자인을<br/>제안하고 싶은 장소를 선택해주세요.</h2>
                    <div className="m-loc-picker-search">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="" />
                        <button type="button" aria-label="닫기">×</button>
                    </div>
                    <div className="m-loc-picker-map">
                        <PCMapCanvas
                            pins={[{ id: 'pick', lat: pickedLat, lng: pickedLng, color: '#E6235A', title: '여기에 제안' }]}
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
        </div>
    );
}
