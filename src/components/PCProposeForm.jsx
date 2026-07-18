import { useState, useRef, useEffect } from 'react';
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';
import UserPCLayout from './UserPCLayout';
import './PCFormShared.css';
import './PCPropose.css';
import { API_URL } from '../utils/api';
import { extractDistrict } from '../utils/format';
import { compressImage } from '../utils/imageCompress';


const TYPES = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
const BUSAN_CENTER = { lat: 35.158, lng: 129.06 };
const DRAFT_KEY = 'pcProposeForm:draft';

function LocationPickerModal({ title = '제안하고 싶은 장소를 선택해주세요.', onCancel, onConfirm }) {
    const [kakaoLoading] = useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services'] });
    const [center, setCenter] = useState(BUSAN_CENTER);
    const [address, setAddress] = useState('');
    const [search, setSearch] = useState('');

    // 지도 중심 바뀔 때마다 역지오코딩 (500ms 디바운스)
    useEffect(() => {
        if (kakaoLoading) return;
        const timer = setTimeout(() => {
            try {
                const geocoder = new window.kakao.maps.services.Geocoder();
                geocoder.coord2Address(center.lng, center.lat, (result, status) => {
                    if (status === 'OK' && result.length > 0) {
                        setAddress(result[0].road_address?.address_name || result[0].address?.address_name || '');
                    } else {
                        setAddress('');
                    }
                });
            } catch { setAddress(''); }
        }, 500);
        return () => clearTimeout(timer);
    }, [center, kakaoLoading]);

    const handleSearch = () => {
        if (!search.trim() || !window.kakao?.maps?.services) return;
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(search.trim(), (results, status) => {
            if (status === 'OK' && results.length > 0) {
                setCenter({ lat: parseFloat(results[0].y), lng: parseFloat(results[0].x) });
            }
        });
    };

    const handleConfirm = () => {
        onConfirm({ lat: center.lat, lng: center.lng, address });
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {}
        );
    };

    return (
        <div className="pc-modal-backdrop" onClick={onCancel}>
            <div className="pc-loc-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pc-loc-picker-head">
                    <button className="pc-loc-picker-close" onClick={onCancel} aria-label="닫기">
                        <img src="/figma-assets/icons/locate-modal/close_x.png" alt="" width="14" height="14" />
                    </button>
                    <p className="pc-loc-picker-title">우리동네 공공디자인을<br/>{title}</p>
                </div>
                <div className="pc-loc-picker-search">
                    <img className="pc-loc-search-icon" src="/figma-assets/icons/locate-modal/search.png" alt="" width="24" height="24" />
                    <input
                        type="text"
                        className="pc-loc-search-input"
                        placeholder="장소 또는 주소 검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    {search && (
                        <button className="pc-loc-search-clear" onClick={() => setSearch('')}>
                            <img src="/figma-assets/icons/locate-modal/clear_x.png" alt="" width="14" height="14" />
                        </button>
                    )}
                </div>
                <div className="pc-loc-picker-map">
                    {!kakaoLoading ? (
                        <Map
                            center={center}
                            level={5}
                            style={{ width: '100%', height: '100%' }}
                            draggable
                            zoomable
                            onCenterChanged={(m) => {
                                const c = m.getCenter();
                                setCenter({ lat: c.getLat(), lng: c.getLng() });
                            }}
                        >
                        </Map>
                    ) : (
                        <div className="pc-loc-map-loading">지도 로딩 중...</div>
                    )}
                    <img className="pc-loc-pin" src="/figma-assets/icons/locate-modal/pin.png" alt="" />
                    <div className="pc-loc-picker-hint">지도를 움직여서 선택해보세요</div>
                    <button className="pc-loc-current-btn" onClick={handleCurrentLocation} title="현재 위치">
                        <img src="/figma-assets/icons/locate-modal/mylocation_purple.png" alt="" width="24" height="24" />
                    </button>
                </div>
                <button className="pc-loc-picker-confirm" onClick={handleConfirm}>
                    위치 선택완료
                </button>
            </div>
        </div>
    );
}

export default function PCProposeForm({ onNavigate }) {
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [location, setLocation] = useState(null); // { lat, lng }
    const [detailAddress, setDetailAddress] = useState(''); // 상세주소 (위치 선택 후 노출)
    const [files, setFiles] = useState([]); // [{ name, url, type, size, serverUrl }]
    const [uploading, setUploading] = useState(false);

    const [showMap, setShowMap] = useState(false);
    const [showDone, setShowDone] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
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

    const valid = type && title.trim().length >= 5 && body.trim().length >= 20 && location && !submitting && !uploading;

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError('');
        const token = localStorage.getItem('access_token');
        const uploadedUrls = files.map((f) => f.serverUrl).filter(Boolean);
        const payload = {
            category: type,
            title: title.trim(),
            content: body.trim(),
            region: extractDistrict(location?.address),
            lat: location?.lat,
            lng: location?.lng,
            detailed_address: detailAddress.trim() || undefined,
            files: uploadedUrls,
            image_url: uploadedUrls[0] || undefined,
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
                setShowDone(true);
            } else {
                setSubmitError('제출에 실패했습니다. 다시 시도해주세요.');
            }
        } catch {
            setSubmitError('네트워크 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    // 비활성 스타일이어도 클릭은 받아 미충족 필드를 인라인으로 안내 (Figma 오류멘트)
    const onSubmitClick = () => {
        if (submitting) return;
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        handleSubmit();
    };

    // 임시저장 draft 복원 (제보 폼 PCReportForm과 동일 패턴 — 기존엔 저장만 하고 불러오지 않았음)
    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved && window.confirm('임시저장된 내용이 있습니다. 불러오시겠습니까?')) {
                if (saved.type) setType(saved.type);
                if (saved.title) setTitle(saved.title);
                if (saved.body) setBody(saved.body);
                if (saved.location) setLocation(saved.location);
                if (saved.detailAddress) setDetailAddress(saved.detailAddress);
            }
        } catch { /* ignore */ }
    }, []);

    const handleDraft = () => {
        const draft = { type, title, body, location, detailAddress, savedAt: new Date().toISOString() };
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            alert('임시저장되었습니다. 다음에 이어서 작성할 수 있어요.');
        } catch { }
    };

    const handleSelectLocation = ({ lat, lng, address }) => {
        setLocation({ lat, lng, address });
        clearError('location');
        setShowMap(false);
    };

    const handleFileChange = async (e) => {
        const picked = Array.from(e.target.files || []);
        if (!picked.length) return;
        e.target.value = ''; // 같은 파일 재선택 가능하게
        setUploading(true);
        try {
            for (const f of picked) {
                // 로컬 미리보기 먼저, 서버 업로드 후 serverUrl 채움 (PCReportForm 패턴)
                const local = {
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    url: f.type.startsWith('image/') || f.type.startsWith('video/') ? URL.createObjectURL(f) : null,
                    serverUrl: '',
                };
                setFiles((prev) => [...prev, local]);
                try {
                    const toSend = f.type.startsWith('image/') ? await compressImage(f) : f;
                    const form = new FormData();
                    form.append('file', toSend);
                    const res = await fetch(`${API_URL}/api/reports/upload`, { method: 'POST', body: form });
                    if (res.ok) {
                        const j = await res.json();
                        setFiles((prev) => prev.map((p) => (p === local ? { ...p, serverUrl: j.url || '' } : p)));
                    } else {
                        setSubmitError('첨부파일 업로드에 실패했습니다.');
                        setTimeout(() => setSubmitError(''), 2500);
                    }
                } catch (err) {
                    setSubmitError(err?.message || '첨부파일 업로드 중 오류가 발생했습니다.');
                    setTimeout(() => setSubmitError(''), 2500);
                }
            }
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (idx) => {
        setFiles((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            if (prev[idx]?.url) URL.revokeObjectURL(prev[idx].url);
            return next;
        });
    };

    const locationLabel = location
        ? (location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`)
        : '지도로 위치 설정하기';

    return (
        <UserPCLayout currentView="pcProposeForm" onNavigate={onNavigate}>
            <div className="pc-form-page pc-propose-form">
                <div className="pc-form-inner">
                    <h2 className="pc-form-title">제안하기</h2>

                    <div className="pc-form-hero pc-hero-yellow">
                        <div>
                            <h3>우리동네 개선 아이디어를<br/>제안해보세요.</h3>
                        </div>
                        <img className="pc-form-hero-img" src="/figma-assets/propose-hero.png" alt="" />
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">제안 유형은 무엇인가요?</label>
                        <div className="pc-radio-flex">
                            {TYPES.map((t) => (
                                <label key={t} className="pc-radio-light">
                                    <input
                                        type="radio"
                                        name="proposeType"
                                        checked={type === t}
                                        onChange={() => { setType(t); clearError('type'); }}
                                    />
                                    {t}
                                </label>
                            ))}
                        </div>
                        {errors.type && <p className="pc-form-error-msg">{errors.type}</p>}
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">제목</label>
                        <input
                            type="text"
                            className={`pc-form-input${errors.title ? ' error' : ''}`}
                            placeholder="제목을 입력해주세요"
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
                        />
                        {errors.title && <p className="pc-form-error-msg">{errors.title}</p>}
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">자세한 설명</label>
                        <textarea
                            className={`pc-form-textarea${errors.body ? ' error' : ''}`}
                            placeholder="우리동네 현황 및 문제점, 개선방안, 기대효과 등을 자세히 작성해주세요."
                            rows={6}
                            value={body}
                            onChange={(e) => { setBody(e.target.value); clearError('body'); }}
                        />
                        {errors.body && <p className="pc-form-error-msg">{errors.body}</p>}
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">위치정보</label>
                        {/* Figma 302:12980: 위치 입력 470x55, 선택 후 상세주소 노출 (302:13006) */}
                        <div className="pc-form-loc-row">
                            <button className={`pc-form-input pc-form-clickable pcf-loc-field${errors.location ? ' error' : ''}`} onClick={() => setShowMap(true)}>
                                <span className="placeholder">{locationLabel}</span>
                                <img src="/figma-assets/icons/locate-modal/field_locate_gray.png" alt="" width="24" height="24" />
                            </button>
                            {location && (
                                <input
                                    type="text"
                                    className="pc-form-input pc-form-loc-detail"
                                    placeholder="예: 1층 오른쪽 표지판 앞"
                                    value={detailAddress}
                                    onChange={(e) => setDetailAddress(e.target.value)}
                                />
                            )}
                        </div>
                        {errors.location && <p className="pc-form-error-msg">{errors.location}</p>}
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">첨부자료 <span className="pcf-label-opt">(선택)</span></label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        <div className="pc-attach-grid">
                            {files.map((f, i) => (
                                <div key={i} className="pc-attach-item-thumb">
                                    {f.url ? (
                                        f.type.startsWith('video/')
                                            ? <video src={f.url} className="pc-attach-thumb-img" />
                                            : <img src={f.url} alt={f.name} className="pc-attach-thumb-img" />
                                    ) : (
                                        <div className="pc-attach-thumb-fallback">{f.name}</div>
                                    )}
                                    <button className="pc-attach-remove" onClick={() => removeFile(i)} aria-label="삭제">×</button>
                                </div>
                            ))}
                            <button className="pc-attach-add" onClick={() => fileInputRef.current?.click()}>
                                {/* Figma 815:9467 Group 275: + 아이콘 22x22 */}
                                <img src="/figma-assets/icons/report-propose/plus.png" alt="" width="22" height="22" />
                            </button>
                        </div>
                        <p className="pc-form-hint">* 사진 또는 동영상 첨부해주세요</p>
                    </div>

                    <div className="pc-form-divider" />
                    <div className="pc-form-actions">
                        <button className="pc-btn-propose-draft" onClick={handleDraft}>임시저장</button>
                        <button
                            className="pc-btn-propose-submit"
                            disabled={submitting}
                            onClick={onSubmitClick}
                        >
                            {submitting ? '제출 중...' : '작성완료'}
                        </button>
                    </div>
                    {submitError && <p style={{ color: '#E6235A', marginTop: 8, fontSize: 13 }}>{submitError}</p>}
                </div>

                {showMap && (
                    <LocationPickerModal
                        onCancel={() => setShowMap(false)}
                        onConfirm={handleSelectLocation}
                    />
                )}

                {showDone && (
                    <div className="pc-modal-backdrop">
                        <div className="pc-modal pc-modal-done" onClick={(e) => e.stopPropagation()}>
                            <div className="pc-done-illu">
                                <img
                                    className="pc-done-scroll-img"
                                    src="/figma-assets/proposal-done-scroll.svg"
                                    alt=""
                                />
                                <img
                                    className="pc-done-check-img"
                                    src="/figma-assets/proposal-done-check.svg"
                                    alt=""
                                />
                            </div>
                            <h3>제안 작성이<br/>완료되었습니다</h3>
                            <button className="pc-btn-propose-done-primary" onClick={() => onNavigate && onNavigate('pcProposeMap')}>
                                등록하기
                            </button>
                            <button className="pc-btn-propose-done-secondary" onClick={() => setShowDone(false)}>
                                임시저장
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </UserPCLayout>
    );
}
