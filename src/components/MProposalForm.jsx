import { useState, useRef, useEffect } from 'react';
import MLocationPicker from './MLocationPicker';
import { formatDraftDate, extractDistrict } from '../utils/format';
import { API_URL } from '../utils/api';
import { compressImage } from '../utils/imageCompress';
import './MProposalForm.css';

// Figma 302:18088 — 표시 라벨은 Figma 문구, 저장 값은 서비스 공통 카테고리(리스트/필터와 일치)
const TYPES = [
    { value: '주거', label: '주거' },
    { value: '환경', label: '환경' },
    { value: '교육', label: '교육' },
    { value: '안전', label: '안전' },
    { value: '산업·일자리', label: '산업 및 고용' },
    { value: '교통', label: '교통' },
    { value: '문화·여가', label: '문화 및 레저' },
    { value: '보건·복지', label: '보건 및 복지' },
];
const DRAFT_KEY = 'mProposalForm:draft';



export default function MProposalForm({ onNavigate }) {
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [location, setLocation] = useState('');
    const [detailAddr, setDetailAddr] = useState('');
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [pickedLat, setPickedLat] = useState(35.197);
    const [pickedLng, setPickedLng] = useState(129.063);
    const [pickedAddress, setPickedAddress] = useState('');
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [draftMeta, setDraftMeta] = useState(null);
    const [toast, setToast] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const clearError = (key) => setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

    // Figma "오류멘트" 검증: 유형·위치 필수, 제목 5자↑, 내용 20자↑
    const validate = () => {
        const e = {};
        if (!type) e.type = '제안 유형을 선택해주세요.';
        if (title.trim().length < 5) e.title = '제목을 입력해주세요. (5자 이상)';
        if (body.trim().length < 20) e.body = '내용을 조금 더 자세히 작성해주세요. (20자 이상)';
        if (!location) e.location = '어디에서 발생한 문제인지 위치를 선택해 주세요.';
        return e;
    };

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

    const canSubmit = type && title.trim().length >= 5 && body.trim().length >= 20 && location && !submitting && !uploading;

    // 비활성 스타일이어도 클릭은 받아 미충족 필드를 인라인으로 안내 (Figma 오류멘트)
    const onSubmitClick = () => {
        if (submitting || uploading) return;
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        handleSubmit();
    };

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

    const saveDraftSilent = () => {
        const draft = { type, title, body, location, pickedLat, pickedLng, savedAt: new Date().toISOString() };
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
    };

    // Figma 302:18520 — 내용 있을 때 뒤로가기 시 임시저장 여부 확인
    const handleBackClick = () => {
        const hasContent = !!(type || title.trim() || body.trim() || location || photos.length);
        if (hasContent) setLeaveOpen(true);
        else onNavigate?.('mProposalList');
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
            region: extractDistrict(pickedAddress),
            detailed_address: (detailAddr.trim() ? `${location} ${detailAddr.trim()}` : location) || undefined,
            files: uploadedUrls,
            image_url: uploadedUrls[0] || undefined,
            lat: pickedLat,
            lng: pickedLng,
        };
        try {
            const res = await fetch(`${API_URL}/api/reports/new-proposal`, {
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

    const handleFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Optimistic local preview
        const previews = files.map((f) => ({
            id: `${f.name}-${f.size}-${f.lastModified}`,
            name: f.name,
            url: URL.createObjectURL(f),
        }));
        setPhotos((prev) => [...prev, ...previews]);
        e.target.value = '';

        setUploading(true);
        const uploaded = [];
        for (const file of files) {
            const compressed = await compressImage(file);
            const form = new FormData();
            form.append('file', compressed);
            try {
                const res = await fetch(`${API_URL}/api/reports/upload`, { method: 'POST', body: form });
                if (res.ok) {
                    const j = await res.json();
                    if (j.url) uploaded.push(j.url);
                } else {
                    setToast('사진 업로드에 실패했습니다.');
                    setTimeout(() => setToast(''), 2000);
                }
            } catch {
                setToast('사진 업로드 중 오류가 발생했습니다.');
                setTimeout(() => setToast(''), 2000);
            }
        }
        setUploadedUrls((prev) => [...prev, ...uploaded]);
        setUploading(false);
    };

    const removePhoto = (id) => {
        setPhotos((prev) => {
            const removed = prev.find((p) => p.id === id);
            if (removed) {
                // revoke object URL to avoid memory leak
                try { URL.revokeObjectURL(removed.url); } catch { /* ignore */ }
            }
            return prev.filter((p) => p.id !== id);
        });
    };

    return (
        <div className="m-prop-form-page">
            <header className="m-form-topbar">
                <button className="m-form-back" onClick={handleBackClick} aria-label="뒤로">
                    <img src="/figma-assets/icons/icon_arrow_back.svg" alt="" width="24" height="24" />
                </button>
            </header>

            <div className="m-form-body">
                <h1 className="m-form-title">우리동네 개선 아이디어를<br/>제안해보세요.</h1>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">제안 유형은 무엇인가요?</h3>
                    <div className="m-form-type-grid">
                        {TYPES.map((t) => (
                            <label key={t.value} className="m-form-type">
                                <input type="radio" name="type" checked={type === t.value} onChange={() => { setType(t.value); clearError('type'); }} />
                                <span className="m-form-type-dot" />
                                <span>{t.label}</span>
                            </label>
                        ))}
                    </div>
                    {errors.type && <p className="m-form-error-msg">{errors.type}</p>}
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">제목</h3>
                    <input
                        type="text"
                        className={`m-form-input${errors.title ? ' error' : ''}`}
                        placeholder="제목을 입력해주세요"
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
                    />
                    {errors.title && <p className="m-form-error-msg">{errors.title}</p>}
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">자세한 설명</h3>
                    <textarea
                        className={`m-form-textarea${errors.body ? ' error' : ''}`}
                        placeholder={"우리동네 개선방안, 기대효과를\n자세히 작성해주세요."}
                        value={body}
                        onChange={(e) => { setBody(e.target.value); clearError('body'); }}
                    />
                    {errors.body && <p className="m-form-error-msg">{errors.body}</p>}
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">위치정보</h3>
                    <button
                        type="button"
                        className={`m-form-loc-btn${errors.location ? ' error' : ''}`}
                        onClick={() => setLocationPickerOpen(true)}
                    >
                        <span className={location ? 'm-form-loc-text' : 'm-form-loc-placeholder'}>
                            {location || '지도로 위치 설정하기'}
                        </span>
                        <span className="m-form-loc-pin">
                            {/* Figma 302:18406 export — 24x24 서클 */}
                            <img src="/figma-assets/mobile-propose/field_locate.png" alt="" width="24" height="24" />
                        </span>
                    </button>
                    {errors.location && <p className="m-form-error-msg">{errors.location}</p>}
                    {location && (
                        /* Figma 302:18418 — 상세위치 353x55, 위치 필드와 20 */
                        <input
                            type="text"
                            className="m-form-input m-form-loc-detail"
                            placeholder="세부 위치를 입력해주세요 (예: 3층 계단 옆)"
                            value={detailAddr}
                            onChange={(e) => setDetailAddr(e.target.value)}
                        />
                    )}
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">첨부자료 <span className="m-form-section-sub">(선택)</span></h3>
                    <div className="m-form-attach-row">
                        {photos.map((p) => (
                            <div key={p.id} className="m-form-attach-thumb">
                                <img src={p.url} alt={p.name} />
                                <button
                                    type="button"
                                    className="m-form-attach-x"
                                    onClick={() => removePhoto(p.id)}
                                    aria-label="삭제"
                                >
                                    {/* Figma 302:18442 export — 24x24 흰 원 X */}
                                    <img src="/figma-assets/mobile-propose/photo_remove.png" alt="" width="24" height="24" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="m-form-attach-add"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="사진 추가"
                        >
                            {/* Figma 302:18426 export — 22x22 플러스 */}
                            <img src="/figma-assets/mobile-propose/form_add_plus.png" alt="" width="22" height="22" />
                        </button>
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
                    className={`m-form-submit${canSubmit ? '' : ' disabled'}`}
                    type="button"
                    onClick={onSubmitClick}
                >{uploading ? '업로드 중...' : submitting ? '제출 중...' : '작성완료'}</button>
            </footer>

            {toast && (
                <div className="m-form-toast" role="status">{toast}</div>
            )}

            {restoreOpen && draftMeta && (
                <div className="m-draft-backdrop" onClick={() => setRestoreOpen(false)}>
                    <div className="m-draft-modal m-draft-modal--restore" onClick={(e) => e.stopPropagation()}>
                        <div className="m-draft-icon" aria-hidden="true">
                            {/* Figma 302:18255 export — 67x82 */}
                            <img src="/figma-assets/mobile-propose/restore_icon.png" alt="" width="67" height="82" />
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
                <div className="m-draft-backdrop" onClick={() => setLeaveOpen(false)}>
                    <div className="m-draft-modal m-draft-modal--leave" onClick={(e) => e.stopPropagation()}>
                        <div className="m-draft-icon" aria-hidden="true">
                            {/* Figma 302:18596 export — 84x84 */}
                            <img src="/figma-assets/mobile-propose/draft_modal_icon.png" alt="" width="84" height="84" />
                        </div>
                        <h3 className="m-draft-title">작성중인 제안글을 저장할까요?</h3>
                        <div className="m-draft-actions">
                            <button
                                type="button"
                                className="m-draft-btn m-draft-btn-primary"
                                onClick={() => { saveDraftSilent(); onNavigate?.('mProposalList'); }}
                            >저장하기</button>
                            <button
                                type="button"
                                className="m-draft-btn m-draft-btn-ghost"
                                onClick={() => onNavigate?.('mProposalList')}
                            >저장안함</button>
                        </div>
                    </div>
                </div>
            )}

            {locationPickerOpen && (
                <MLocationPicker
                    accent="propose"
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
        </div>
    );
}
