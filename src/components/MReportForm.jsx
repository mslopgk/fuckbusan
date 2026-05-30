import { useState, useEffect, useRef } from 'react';
import PCMapCanvas from './PCMapCanvas';
import { formatDraftDate } from '../utils/format';
import { API_URL } from '../utils/api';
import { compressImage } from '../utils/imageCompress';
import './MProposalForm.css';
import './MProposalList.css';
import './MReportForm.css';

const CATS = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
const POSITIONS = ['위치', '도로', '인도', '공원', '주차장'];
const ISSUES = ['문제사항', '훼손', '오염', '불편', '위험'];
const DRAFT_KEY = 'mReportForm:draft';


export default function MReportForm({ onNavigate }) {
    const [cat, setCat] = useState('');
    const [position, setPosition] = useState('');
    const [issue, setIssue] = useState('');
    const [body, setBody] = useState('');
    const [location, setLocation] = useState('');
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [pickedLat, setPickedLat] = useState(35.197);
    const [pickedLng, setPickedLng] = useState(129.063);
    const [pickedAddress, setPickedAddress] = useState('');
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [draftMeta, setDraftMeta] = useState(null);
    const [toast, setToast] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [detailAddr, setDetailAddr] = useState('');

    // ref for use inside popstate handler without stale closure
    const formStateRef = useRef({});
    formStateRef.current = { cat, body, location, photoUrl, locationPickerOpen };

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

    // Mobile hardware back button intercept
    useEffect(() => {
        window.history.pushState({ formGuard: true, view: 'mReportForm' }, '');
        const handlePop = () => {
            const { cat, body, location, photoUrl, locationPickerOpen } = formStateRef.current;
            if (locationPickerOpen) {
                setLocationPickerOpen(false);
                window.history.pushState({ formGuard: true, view: 'mReportForm' }, '');
                return;
            }
            const hasContent = !!(cat || body.trim() || location || photoUrl);
            if (hasContent) {
                setLeaveOpen(true);
                window.history.pushState({ formGuard: true, view: 'mReportForm' }, '');
            } else {
                onNavigate?.('mReportList');
            }
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto reverse-geocode when picker opens with no address yet
    useEffect(() => {
        if (!locationPickerOpen || pickedAddress) return;
        if (!window.kakao?.maps?.services) return;
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(pickedLng, pickedLat, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const addr = result[0]?.road_address?.address_name || result[0]?.address?.address_name || '';
                setPickedAddress(addr);
            }
        });
    }, [locationPickerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const canSubmit = cat && position && issue && body.trim() && !submitting && !uploading;

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const compressed = await compressImage(file);
            const form = new FormData();
            form.append('file', compressed);
            const res = await fetch(`${API_URL}/api/reports/upload`, { method: 'POST', body: form });
            if (res.ok) {
                const j = await res.json();
                setPhotoUrl(j.url || '');
            } else {
                setToast('사진 업로드에 실패했습니다.');
                setTimeout(() => setToast(''), 2000);
            }
        } catch (err) {
            setToast(err?.message || '사진 업로드 중 오류가 발생했습니다.');
            setTimeout(() => setToast(''), 2500);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveDraft = () => {
        const draft = {
            cat, position, issue, body, location, pickedLat, pickedLng,
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

    const saveDraftSilent = () => {
        const draft = {
            cat, position, issue, body, location, pickedLat, pickedLng,
            savedAt: new Date().toISOString(),
        };
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
    };

    const handleRestore = () => {
        if (!draftMeta) { setRestoreOpen(false); return; }
        setCat(draftMeta.cat || '');
        setPosition(draftMeta.position || '');
        setIssue(draftMeta.issue || '');
        setBody(draftMeta.body || '');
        if (draftMeta.location) setLocation(draftMeta.location);
        if (draftMeta.pickedLat) setPickedLat(draftMeta.pickedLat);
        if (draftMeta.pickedLng) setPickedLng(draftMeta.pickedLng);
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
            location: detailAddr || undefined,
            detailed_address: location || undefined,
            lat: pickedLat,
            lng: pickedLng,
            image_url: photoUrl || undefined,
        };
        try {
            const res = await fetch(`${API_URL}/api/reports/report`, {
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

    const handleBackClick = () => {
        const hasContent = !!(cat || body.trim() || location || photoUrl);
        if (hasContent) {
            setLeaveOpen(true);
        } else {
            onNavigate?.('mReportList');
        }
    };

    return (
        <div className="m-prop-form-page m-report-form-page">
            <header className="m-form-topbar">
                <button className="m-form-back" onClick={handleBackClick}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    <span>홈으로</span>
                </button>
            </header>

            <div className="m-form-body">
                <h1 className="m-form-title" style={{ fontWeight: 700 }}>문제 상황이 잘 보이도록<br/>사진을 등록해 주세요</h1>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">사진 등록</h3>
                    <label className="m-photo-add" style={{ cursor: 'pointer', position: 'relative' }}>
                        {uploading ? (
                            <span style={{ fontSize: 12, color: '#999' }}>업로드 중...</span>
                        ) : photoUrl ? (
                            <img src={photoUrl} alt="등록 사진" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                        ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        )}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                    </label>
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">위치정보</h3>
                    <button className="m-loc-input" type="button" onClick={() => setLocationPickerOpen(true)}>
                        <span className={location ? 'm-form-loc-text' : ''}>{location || '지도로 위치 설정하기'}</span>
                        <span className="m-loc-pin">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2.5"/></svg>
                        </span>
                    </button>
                    {location && (
                        <input
                            className="m-loc-input m-loc-detail-input"
                            type="text"
                            placeholder="세부 위치를 입력해주세요 (예: 3층 계단 옆)"
                            value={detailAddr}
                            onChange={(e) => setDetailAddr(e.target.value)}
                            style={{ marginTop: 8, cursor: 'text' }}
                        />
                    )}
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
                        placeholder="느끼신 점을 자유롭게 작성해 주세요."
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
                            pins={[]}
                            accentColor="#E6235A"
                            selectedPoint={{ lat: pickedLat, lng: pickedLng }}
                            onMapClick={({ lat, lng }) => {
                                setPickedLat(lat);
                                setPickedLng(lng);
                                setPickedAddress('');
                                if (window.kakao?.maps?.services) {
                                    const geocoder = new window.kakao.maps.services.Geocoder();
                                    geocoder.coord2Address(lng, lat, (result, status) => {
                                        if (status === window.kakao.maps.services.Status.OK) {
                                            const addr = result[0]?.road_address?.address_name || result[0]?.address?.address_name || '';
                                            setPickedAddress(addr);
                                        }
                                    });
                                }
                            }}
                        />
                    </div>
                    <p className="m-loc-picker-help">
                        {pickedAddress ? pickedAddress : '지도를 클릭하여 위치를 선택해주세요'}
                    </p>
                    <button
                        className="m-loc-picker-confirm"
                        type="button"
                        disabled={!pickedAddress}
                        onClick={() => {
                            setLocation(pickedAddress);
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

            {leaveOpen && (
                <div className="m-draft-backdrop" onClick={() => setLeaveOpen(false)}>
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
                        <h3 className="m-draft-title">작성중인 제보글을<br/>저장할까요?</h3>
                        <div className="m-draft-actions">
                            <button
                                type="button"
                                className="m-draft-btn m-draft-btn-primary"
                                onClick={() => {
                                    saveDraftSilent();
                                    onNavigate?.('mReportList');
                                }}
                            >저장하기</button>
                            <button
                                type="button"
                                className="m-draft-btn m-draft-btn-ghost"
                                onClick={() => onNavigate?.('mReportList')}
                            >저장 안함</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
