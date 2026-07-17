import { useState, useEffect, useRef } from 'react';
import MLocationPicker from './MLocationPicker';
import { formatDraftDate } from '../utils/format';
import { API_URL } from '../utils/api';
import { compressImage } from '../utils/imageCompress';
import './MProposalForm.css';
import './MProposalList.css';
import './MReportForm.css';

// Figma 0:12713 (제보하기01 최신) — 카테고리 4개
// PC(PCReportForm) 기준으로 통일 — 카테고리 8 / 시설물 7 / 문제 6
const CATS = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
const POSITIONS = ['공공/시설물', '도로/보도', '하수/배수', '가로등/조명', '벤치/쉼터', '쓰레기/청소', '안내판/표지판'];
const ISSUES = ['파손', '오염', '고장', '미흡', '안전위험', '기타'];
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
    const [errors, setErrors] = useState({});

    const clearError = (key) => setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

    // Figma "오류멘트" 검증: 카테고리·위치·시설물·문제사항 필수, 상세설명 20자↑
    const validate = () => {
        const e = {};
        if (!cat) e.cat = '제보 카테고리를 선택해주세요.';
        if (!location) e.location = '어디에서 발생한 문제인지 위치를 선택해 주세요.';
        if (!position) e.position = '공공/시설물을 선택해주세요.';
        if (!issue) e.issue = '문제사항을 선택해주세요.';
        if (body.trim().length < 20) e.body = '내용을 조금 더 자세히 작성해 주세요. (20자 이상)';
        return e;
    };

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

    const canSubmit = cat && position && issue && location && body.trim().length >= 20 && !submitting && !uploading;

    // 비활성 스타일이어도 클릭은 받아 미충족 필드를 인라인으로 안내 (Figma 오류멘트)
    const onSubmitClick = () => {
        if (submitting || uploading) return;
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        handleSubmit();
    };

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
                <button className="m-form-back" onClick={handleBackClick} aria-label="뒤로">
                    <img src="/figma-assets/icons/icon_arrow_back.svg" alt="" width="24" height="24" />
                </button>
            </header>

            <div className="m-form-body">
                <h1 className="m-form-title">문제 상황이 잘 보이도록<br/>사진을 등록해 주세요</h1>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">사진 등록</h3>
                    <div className="m-rform-photo-row">
                        {photoUrl && <img className="m-rform-photo-thumb" src={photoUrl} alt="등록 사진" />}
                        <label className="m-photo-add" style={{ cursor: 'pointer' }}>
                            {uploading ? (
                                <span style={{ fontSize: 12, color: '#999' }}>업로드 중...</span>
                            ) : photoUrl ? (
                                /* Figma 302:16864 export — 22x22 플러스 */
                                <img src="/figma-assets/mobile-report/form_add_plus.png" alt="" width="22" height="22" />
                            ) : (
                                /* Figma 302:16477 export — 30x30 카메라 */
                                <img src="/figma-assets/mobile-report/form_camera.png" alt="" width="30" height="30" />
                            )}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                        </label>
                    </div>
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">위치정보</h3>
                    <button className={`m-loc-input${errors.location ? ' error' : ''}`} type="button" onClick={() => setLocationPickerOpen(true)}>
                        <span className={location ? 'm-form-loc-text' : ''}>{location || '지도로 위치 설정하기'}</span>
                        <span className="m-loc-pin">
                            {/* Figma 302:16458 export — 24x24 서클 */}
                            <img src="/figma-assets/mobile-report/field_locate.png" alt="" width="24" height="24" />
                        </span>
                    </button>
                    {errors.location && <p className="m-form-error-msg">{errors.location}</p>}
                    {location && (
                        <input
                            className="m-loc-input m-loc-detail-input m-form-loc-detail"
                            type="text"
                            placeholder="세부 위치를 입력해주세요 (예: 3층 계단 옆)"
                            value={detailAddr}
                            onChange={(e) => setDetailAddr(e.target.value)}
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
                                onClick={() => { setCat(c); clearError('cat'); }}
                                type="button"
                            >{c}</button>
                        ))}
                    </div>
                    {errors.cat && <p className="m-form-error-msg">{errors.cat}</p>}

                    <div className="m-row-with-suffix">
                        <select className={`m-select${errors.position ? ' error' : ''}`} value={position} onChange={(e) => { setPosition(e.target.value); clearError('position'); }} required>
                            {POSITIONS.map((p, i) => (
                                <option key={p} value={i === 0 ? '' : p}>{p}</option>
                            ))}
                        </select>
                        <span className="m-row-suffix">에</span>
                    </div>
                    {errors.position && <p className="m-form-error-msg">{errors.position}</p>}

                    <div className="m-row-with-suffix">
                        <select className={`m-select${errors.issue ? ' error' : ''}`} value={issue} onChange={(e) => { setIssue(e.target.value); clearError('issue'); }} required>
                            <option value="" disabled hidden>문제사항</option>
                            {ISSUES.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                        <span className="m-row-suffix">불편해요</span>
                    </div>
                    {errors.issue && <p className="m-form-error-msg">{errors.issue}</p>}

                    <input
                        type="text"
                        className={`m-row-input${errors.body ? ' error' : ''}`}
                        placeholder="느끼신 점을 자유롭게 작성해 주세요."
                        value={body}
                        onChange={(e) => { setBody(e.target.value); clearError('body'); }}
                    />
                    {errors.body && <p className="m-form-error-msg">{errors.body}</p>}
                </section>
            </div>

            <footer className="m-form-footer">
                <button className="m-form-save" type="button" onClick={handleSaveDraft}>임시저장</button>
                <button
                    className={`m-form-submit${canSubmit ? '' : ' disabled'}`}
                    type="button"
                    onClick={onSubmitClick}
                >{uploading ? '업로드 중...' : submitting ? '제출 중...' : '작성완료'}</button>
            </footer>

            {toast && (
                <div className="m-form-toast" role="status">{toast}</div>
            )}

            {locationPickerOpen && (
                <MLocationPicker
                    accent="report"
                    initialCenter={{ lat: pickedLat, lng: pickedLng }}
                    onClose={() => setLocationPickerOpen(false)}
                    onConfirm={({ lat, lng, address }) => {
                        setPickedLat(lat);
                        setPickedLng(lng);
                        setPickedAddress(address);
                        setLocation(address);
                        clearError('location');
                        setLocationPickerOpen(false);
                    }}
                />
            )}

            {restoreOpen && draftMeta && (
                <div className="m-draft-backdrop" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setRestoreOpen(false); }}>
                    <div className="m-draft-modal m-draft-modal--restore" onClick={(e) => e.stopPropagation()}>
                        <div className="m-draft-icon" aria-hidden="true">
                            {/* Figma 302:16784 export — 67x82 */}
                            <img src="/figma-assets/mobile-report/restore_icon.png" alt="" width="67" height="82" />
                        </div>
                        <h3 className="m-draft-title">임시 저장된 내용을 불러올까요?</h3>
                        <p className="m-draft-meta">∙ {formatDraftDate(draftMeta.savedAt)}</p>
                        <div className="m-draft-actions">
                            <button type="button" className="m-draft-btn m-draft-btn-primary" onClick={handleRestore}>불러오기</button>
                            <button type="button" className="m-draft-btn m-draft-btn-tint" onClick={handleDiscardDraft}>새로 작성하기</button>
                        </div>
                    </div>
                </div>
            )}

            {leaveOpen && (
                <div className="m-draft-backdrop" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setLeaveOpen(false); }}>
                    <div className="m-draft-modal m-draft-modal--leave" onClick={(e) => e.stopPropagation()}>
                        <div className="m-draft-icon" aria-hidden="true">
                            {/* Figma 302:17040 export — 84x84 */}
                            <img src="/figma-assets/mobile-report/draft_modal_icon.png" alt="" width="84" height="84" />
                        </div>
                        <h3 className="m-draft-title">작성중인 제보글을 저장할까요?</h3>
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
                            >저장안함</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
