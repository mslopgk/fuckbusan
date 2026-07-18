import { useState, useRef, useEffect } from 'react';
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';
import UserPCLayout from './UserPCLayout';
import './PCFormShared.css';
import './PCReportForm.css';
import { API_URL } from '../utils/api';
import { compressImage } from '../utils/imageCompress';


const TYPES = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
// Figma 302:11748 드롭다운 실측 옵션 (거리/골목쓰레기통/공원하수구/공공장소)
const FACILITIES = ['거리', '골목쓰레기통', '공원하수구', '공공장소'];
// Figma 302:11825 문제사항 옵션
const ISSUES = ['미끄러워요', '파손됐어요', '안전조치가 부족해요', '위험이 있어요', '어려워요'];
const BUSAN_CENTER = { lat: 35.158, lng: 129.06 };

function LocationPickerModal({ onCancel, onConfirm }) {
    const [kakaoLoading] = useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services'] });
    const [center, setCenter] = useState(BUSAN_CENTER);
    const [address, setAddress] = useState('');
    const [search, setSearch] = useState('');

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
                    <p className="pc-loc-picker-title">우리동네 공공디자인을<br/>제보하고 싶은 장소를 선택해주세요.</p>
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
                <button className="pc-loc-picker-confirm pc-loc-picker-confirm--report" onClick={handleConfirm}>
                    위치 선택완료
                </button>
            </div>
        </div>
    );
}

export default function PCReportForm({ onNavigate }) {
    const [photos, setPhotos] = useState([]); // [{ url, name, type, serverUrl }]
    const [uploading, setUploading] = useState(false);
    const [location, setLocation] = useState(null); // { lat, lng, address }
    const [detailAddress, setDetailAddress] = useState(''); // 상세주소 (detailed_address)
    const [type, setType] = useState('');
    const [facility, setFacility] = useState(''); // 미선택 시 placeholder '공공/시설물'
    const [issue, setIssue] = useState('');       // 미선택 시 placeholder '문제사항'
    const [description, setDescription] = useState('');

    const [showMap, setShowMap] = useState(false);
    const [showFacilityDrop, setShowFacilityDrop] = useState(false);
    const [showIssueDrop, setShowIssueDrop] = useState(false);
    const [showDone, setShowDone] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const clearError = (key) => setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

    // Figma "오류멘트" 검증: 미충족 필드별 한국어 메시지 반환
    const validate = () => {
        const e = {};
        if (!photos.length) e.photos = '문제 상황이 보이도록 사진을 등록해 주세요.';
        if (!type) e.type = '제보 카테고리를 선택해주세요.';
        if (!location) e.location = '어디에서 발생한 문제인지 위치를 선택해 주세요.';
        if (!facility) e.facility = '공공/시설물을 선택해주세요.';
        if (!issue) e.issue = '문제사항을 선택해주세요.';
        if (description.trim().length < 20) e.description = '내용을 조금 더 자세히 작성해 주세요. (20자 이상)';
        return e;
    };

    // Load draft on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem('pcReportForm:draft');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved && window.confirm('임시저장된 내용이 있습니다. 불러오시겠습니까?')) {
                if (saved.cat) setType(saved.cat);
                if (saved.facility) setFacility(saved.facility);
                if (saved.issue) setIssue(saved.issue);
                if (saved.body) setDescription(saved.body);
                if (saved.detailAddress) setDetailAddress(saved.detailAddress);
                if (saved.location) setLocation({ address: saved.location, lat: saved.lat, lng: saved.lng });
            }
        } catch { /* ignore */ }
    }, []);

    const valid = photos.length > 0 && location && type
        && facility && issue
        && description.trim().length >= 20 && !submitting && !uploading;

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError('');
        const token = localStorage.getItem('access_token');
        const title = `${facility}에 ${issue} 불편해요`;
        const uploadedUrls = photos.map((p) => p.serverUrl).filter(Boolean);
        const payload = {
            category: type,
            sub_category: `${facility} · ${issue}`,
            title,
            content: description.trim(),
            lat: location?.lat,
            lng: location?.lng,
            location: location?.address || undefined,
            detailed_address: detailAddress.trim() || undefined,
            image_url: uploadedUrls[0] || undefined,
            files: uploadedUrls,
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
        if (submitting || uploading) return;
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        handleSubmit();
    };

    const handlePhotoChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        e.target.value = '';
        setUploading(true);
        try {
            for (const f of files) {
                // Show local preview immediately
                const local = { name: f.name, type: f.type, url: URL.createObjectURL(f), serverUrl: '' };
                setPhotos((prev) => [...prev, local]);
                clearError('photos');
                // Upload to server
                try {
                    const compressed = await compressImage(f);
                    const form = new FormData();
                    form.append('file', compressed);
                    const res = await fetch(`${API_URL}/api/reports/upload`, { method: 'POST', body: form });
                    if (res.ok) {
                        const j = await res.json();
                        setPhotos((prev) => prev.map((p) => (p === local ? { ...p, serverUrl: j.url || '' } : p)));
                    } else {
                        setSubmitError('사진 업로드에 실패했습니다.');
                        setTimeout(() => setSubmitError(''), 2000);
                    }
                } catch (err) {
                    setSubmitError(err?.message || '사진 업로드 중 오류가 발생했습니다.');
                    setTimeout(() => setSubmitError(''), 2500);
                }
            }
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = (target) => {
        if (target?.url) URL.revokeObjectURL(target.url);
        setPhotos((prev) => prev.filter((p) => p !== target));
    };

    const handleSaveDraft = () => {
        try {
            localStorage.setItem('pcReportForm:draft', JSON.stringify({
                cat: type,
                facility,
                issue,
                body: description,
                detailAddress,
                location: location?.address || '',
                lat: location?.lat,
                lng: location?.lng,
            }));
            alert('임시저장 되었습니다.');
        } catch { /* ignore */ }
    };

    const locationLabel = location
        ? (location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`)
        : '지도로 위치 설정하기';

    return (
        <UserPCLayout currentView="pcReportForm" onNavigate={onNavigate}>
            <div className="pc-form-page">
                <div className="pc-form-inner">
                    <h2 className="pc-form-title">제보하기</h2>

                    <div className="pc-form-hero pc-hero-yellow">
                        <div>
                            <h3>문제 상황이 잘 보이도록<br/>사진을 등록해 주세요</h3>
                        </div>
                        <img className="pc-form-hero-img" src="/figma-assets/propose-hero.png" alt="" />
                    </div>

                    <div className="pc-form-section pcf-sec-photo">
                        <label className="pc-form-label">사진 등록</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handlePhotoChange}
                        />
                        <div className="pc-attach-grid">
                            {photos.map((p, i) => (
                                <div key={p.url || i} className="pc-attach-item-thumb">
                                    <img src={p.url} alt={p.name} className="pc-attach-thumb-img" />
                                    {!p.serverUrl && <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 5px' }}>업로드 중...</span>}
                                    <button className="pc-attach-remove" onClick={() => removePhoto(p)} aria-label="삭제">×</button>
                                </div>
                            ))}
                            <button className={`pc-photo-btn${errors.photos ? ' error' : ''}`} onClick={() => fileInputRef.current?.click()} type="button">
                                {photos.length > 0 ? (
                                    /* Figma 302:11697 Group 275: + 아이콘 22x22 */
                                    <img src="/figma-assets/icons/report-propose/plus.png" alt="" width="22" height="22" />
                                ) : (
                                    /* Figma 302:12157 image 69: 카메라 30x30 */
                                    <img src="/figma-assets/icons/report-propose/camera.png" alt="" width="30" height="30" />
                                )}
                            </button>
                        </div>
                        {errors.photos && <p className="pc-form-error-msg">{errors.photos}</p>}
                    </div>

                    <div className="pc-form-section pcf-sec-loc">
                        <label className="pc-form-label">위치정보</label>
                        <div className="pc-form-loc-row">
                            <button className={`pc-form-input pc-form-clickable pcf-loc-field${errors.location ? ' error' : ''}`} onClick={() => setShowMap(true)}>
                                {/* Figma 302:11673: 선택된 주소도 #a6a6a6 16/400 */}
                                <span className="placeholder">{locationLabel}</span>
                                <img src="/figma-assets/icons/locate-modal/field_locate_gray.png" alt="" width="24" height="24" />
                            </button>
                            {/* Figma 302:12140→11673: 상세주소 입력은 위치 선택 후 노출 */}
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

                    <div className="pc-form-section pcf-sec-chips">
                        <label className="pc-form-label">우리동네 불편사항을 제보해주세요</label>
                        <div className="pc-chip-row">
                            {TYPES.map((t) => (
                                <button
                                    key={t}
                                    className={`pc-form-chip pcrf-chip ${type === t ? 'active' : ''}`}
                                    onClick={() => { setType(t); clearError('type'); }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {errors.type && <p className="pc-form-error-msg">{errors.type}</p>}
                    </div>

                    <div className="pc-form-section pcf-sec-dd">
                        <div className="pc-form-row-flex">
                            {/* Figma 302:11748: 열리면 필드+옵션이 한 박스(보라 스트로크 r15)로 확장 */}
                            <div className="pc-form-dropdown">
                                <button className={`pc-form-input pc-form-clickable pcf-dd-field${errors.facility ? ' error' : ''}`} onClick={() => { setShowFacilityDrop(!showFacilityDrop); setShowIssueDrop(false); }}>
                                    <span className={facility ? 'pcf-dd-value' : 'placeholder'}>{facility || '공공/시설물'}</span>
                                    <img src="/figma-assets/icons/report-propose/dd_chevron.png" alt="" width="18" height="9" />
                                </button>
                                {showFacilityDrop && (
                                    <div className="pcf-dd-panel">
                                        <button className="pcf-dd-panel-field" onClick={() => setShowFacilityDrop(false)}>
                                            <span className={facility ? 'pcf-dd-open-label' : 'pcf-dd-open-label'}>{facility || '공공/시설물'}</span>
                                            <img src="/figma-assets/icons/report-propose/dd_chevron.png" alt="" width="18" height="9" />
                                        </button>
                                        <div className="pcf-dd-options">
                                            {FACILITIES.map((f) => (
                                                <div key={f} className="pcf-dd-item" onClick={() => { setFacility(f); setShowFacilityDrop(false); clearError('facility'); }}>{f}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className="pc-form-conjunction">에</span>
                            <div className="pc-form-dropdown">
                                <button className={`pc-form-input pc-form-clickable pcf-dd-field${errors.issue ? ' error' : ''}`} onClick={() => { setShowIssueDrop(!showIssueDrop); setShowFacilityDrop(false); }}>
                                    <span className={issue ? 'pcf-dd-value' : 'placeholder'}>{issue || '문제사항'}</span>
                                    <img src="/figma-assets/icons/report-propose/dd_chevron.png" alt="" width="18" height="9" />
                                </button>
                                {showIssueDrop && (
                                    <div className="pcf-dd-panel">
                                        <button className="pcf-dd-panel-field" onClick={() => setShowIssueDrop(false)}>
                                            <span className="pcf-dd-open-label">{issue || '문제사항'}</span>
                                            <img src="/figma-assets/icons/report-propose/dd_chevron.png" alt="" width="18" height="9" />
                                        </button>
                                        <div className="pcf-dd-options">
                                            {ISSUES.map((it) => (
                                                <div key={it} className="pcf-dd-item" onClick={() => { setIssue(it); setShowIssueDrop(false); clearError('issue'); }}>{it}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className="pc-form-conjunction">불편해요</span>
                        </div>
                        {(errors.facility || errors.issue) && <p className="pc-form-error-msg">{errors.facility || errors.issue}</p>}
                    </div>

                    <div className="pc-form-section pcf-sec-desc">
                        <input
                            type="text"
                            className={`pc-form-input pcf-desc-input${errors.description ? ' error' : ''}`}
                            placeholder="상세설명을 작성해주세요"
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); clearError('description'); }}
                        />
                        {errors.description && <p className="pc-form-error-msg">{errors.description}</p>}
                    </div>

                    {/* Figma 302:12140: 상세설명 아래 29px 지점 1px #eee 구분선 */}
                    <div className="pc-form-divider pcf-divider-report" />
                    <div className="pc-form-actions">
                        <button className="pc-btn-light" type="button" onClick={handleSaveDraft}>임시저장</button>
                        <button
                            className={`pcrf-btn-purple ${valid ? '' : 'disabled'}`}
                            type="button"
                            onClick={onSubmitClick}
                        >
                            {uploading ? '업로드 중...' : submitting ? '제출 중...' : '작성완료'}
                        </button>
                    </div>
                    {submitError && <p style={{ color: '#E6235A', marginTop: 8, fontSize: 13 }}>{submitError}</p>}
                </div>

                {showMap && (
                    <LocationPickerModal
                        onCancel={() => setShowMap(false)}
                        onConfirm={({ lat, lng, address }) => { setLocation({ lat, lng, address }); clearError('location'); setShowMap(false); }}
                    />
                )}

                {showDone && (
                    <div className="pc-modal-backdrop">
                        <div className="pcrf-done-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="pcrf-done-icons">
                                <img
                                    src="/figma-assets/report_done_scroll.svg"
                                    alt=""
                                    className="pcrf-done-scroll"
                                />
                                <img
                                    src="/figma-assets/report_done_check.svg"
                                    alt=""
                                    className="pcrf-done-check"
                                />
                            </div>
                            <h3 className="pcrf-done-title">제보 작성이<br/>완료되었습니다</h3>
                            <button className="pcrf-btn-purple pcrf-done-cta" onClick={() => onNavigate && onNavigate('pcReportMap')}>
                                등록하기
                            </button>
                            <button className="pcrf-btn-purple-soft pcrf-done-sub" onClick={() => setShowDone(false)}>
                                임시저장
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </UserPCLayout>
    );
}
