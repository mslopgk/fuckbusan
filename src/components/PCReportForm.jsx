import { useState, useRef, useEffect } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import UserPCLayout from './UserPCLayout';
import './PCFormShared.css';
import { API_URL } from '../utils/api';
import { compressImage } from '../utils/imageCompress';


const TYPES = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
const FACILITIES = ['공공/시설물', '도로/보도', '하수/배수', '가로등/조명', '벤치/쉼터', '쓰레기/청소', '안내판/표지판'];
const ISSUES = ['파손', '오염', '고장', '미흡', '안전위험', '기타'];
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <p className="pc-loc-picker-title">우리동네 공공디자인을<br/>제보하고 싶은 장소를 선택해주세요.</p>
                </div>
                <div className="pc-loc-picker-search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pc-loc-search-icon">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
                            <MapMarker position={center} />
                        </Map>
                    ) : (
                        <div className="pc-loc-map-loading">지도 로딩 중...</div>
                    )}
                    <div className="pc-loc-picker-hint">지도를 움직여서 선택해보세요</div>
                    <button className="pc-loc-current-btn" onClick={handleCurrentLocation} title="현재 위치">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                        </svg>
                    </button>
                </div>
                <button className="pc-loc-picker-confirm" onClick={handleConfirm}>
                    위치 선택완료
                </button>
            </div>
        </div>
    );
}

export default function PCReportForm({ onNavigate }) {
    const [photo, setPhoto] = useState(null); // { url, name, type }
    const [uploadedUrl, setUploadedUrl] = useState(''); // server-side URL after upload
    const [uploading, setUploading] = useState(false);
    const [location, setLocation] = useState(null); // { lat, lng, address }
    const [type, setType] = useState('');
    const [facility, setFacility] = useState('공공/시설물');
    const [issue, setIssue] = useState('문제사항');
    const [description, setDescription] = useState('');

    const [showMap, setShowMap] = useState(false);
    const [showFacilityDrop, setShowFacilityDrop] = useState(false);
    const [showIssueDrop, setShowIssueDrop] = useState(false);
    const [showDone, setShowDone] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const fileInputRef = useRef(null);

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
                if (saved.location) setLocation({ address: saved.location, lat: saved.lat, lng: saved.lng });
            }
        } catch { /* ignore */ }
    }, []);

    const valid = photo && location && type && description.trim() && !submitting && !uploading;

    const handlePhotoChange = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        // Show local preview immediately
        if (photo?.url) URL.revokeObjectURL(photo.url);
        setPhoto({ name: f.name, type: f.type, url: URL.createObjectURL(f) });
        e.target.value = '';
        // Upload to server
        setUploading(true);
        setUploadedUrl('');
        try {
            const compressed = await compressImage(f);
            const form = new FormData();
            form.append('file', compressed);
            const res = await fetch(`${API_URL}/api/reports/upload`, { method: 'POST', body: form });
            if (res.ok) {
                const j = await res.json();
                setUploadedUrl(j.url || '');
            } else {
                setSubmitError('사진 업로드에 실패했습니다.');
                setTimeout(() => setSubmitError(''), 2000);
            }
        } catch (err) {
            setSubmitError(err?.message || '사진 업로드 중 오류가 발생했습니다.');
            setTimeout(() => setSubmitError(''), 2500);
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = () => {
        if (photo?.url) URL.revokeObjectURL(photo.url);
        setPhoto(null);
        setUploadedUrl('');
    };

    const handleSaveDraft = () => {
        try {
            localStorage.setItem('pcReportForm:draft', JSON.stringify({
                cat: type,
                facility,
                issue,
                body: description,
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

                    <div className="pc-form-section">
                        <label className="pc-form-label">사진 등록</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handlePhotoChange}
                        />
                        <div className="pc-attach-grid">
                            {photo && (
                                <div className="pc-attach-item-thumb">
                                    <img src={photo.url} alt={photo.name} className="pc-attach-thumb-img" />
                                    {uploading && <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 5px' }}>업로드 중...</span>}
                                    <button className="pc-attach-remove" onClick={removePhoto} aria-label="삭제">×</button>
                                </div>
                            )}
                            <button className="pc-photo-btn" onClick={() => fileInputRef.current?.click()} type="button">
                                {photo ? (
                                    <span style={{ fontSize: '22px' }}>＋</span>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">위치정보</label>
                        <button className="pc-form-input pc-form-clickable" onClick={() => setShowMap(true)}>
                            <span className={location ? '' : 'placeholder'}>{locationLabel}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z"/></svg>
                        </button>
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">우리동네 불편사항을 제보해주세요</label>
                        <div className="pc-chip-row">
                            {TYPES.map((t) => (
                                <button
                                    key={t}
                                    className={`pc-form-chip ${type === t ? 'active' : ''}`}
                                    onClick={() => setType(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pc-form-section pc-form-row-flex">
                        <div className="pc-form-dropdown">
                            <button className="pc-form-input pc-form-clickable" onClick={() => setShowFacilityDrop(!showFacilityDrop)}>
                                <span>{facility}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                            {showFacilityDrop && (
                                <div className="pc-dropdown-list">
                                    {FACILITIES.map((f) => (
                                        <div key={f} className="pc-dropdown-item" onClick={() => { setFacility(f); setShowFacilityDrop(false); }}>{f}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="pc-form-conjunction">에</span>
                        <div className="pc-form-dropdown">
                            <button className="pc-form-input pc-form-clickable" onClick={() => setShowIssueDrop(!showIssueDrop)}>
                                <span>{issue}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                            {showIssueDrop && (
                                <div className="pc-dropdown-list">
                                    {ISSUES.map((it) => (
                                        <div key={it} className="pc-dropdown-item" onClick={() => { setIssue(it); setShowIssueDrop(false); }}>{it}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="pc-form-conjunction">불편해요</span>
                    </div>

                    <div className="pc-form-section">
                        <input
                            type="text"
                            className="pc-form-input"
                            placeholder="상세설명을 작성해주세요"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="pc-form-actions">
                        <button className="pc-btn-light" type="button" onClick={handleSaveDraft}>임시저장</button>
                        <button
                            className={`pc-btn-pink ${valid ? '' : 'disabled'}`}
                            disabled={!valid}
                            onClick={async () => {
                                setSubmitting(true);
                                setSubmitError('');
                                const token = localStorage.getItem('access_token');
                                const title = `${facility}에 ${issue} 불편해요`;
                                const payload = {
                                    category: type,
                                    sub_category: `${facility} · ${issue}`,
                                    title,
                                    content: description.trim(),
                                    lat: location?.lat,
                                    lng: location?.lng,
                                    location: location?.address || undefined,
                                    image_url: uploadedUrl || undefined,
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
                            }}
                        >
                            {submitting ? '제출 중...' : '작성완료'}
                        </button>
                    </div>
                    {submitError && <p style={{ color: '#E6235A', marginTop: 8, fontSize: 13 }}>{submitError}</p>}
                </div>

                {showMap && (
                    <LocationPickerModal
                        onCancel={() => setShowMap(false)}
                        onConfirm={({ lat, lng, address }) => { setLocation({ lat, lng, address }); setShowMap(false); }}
                    />
                )}

                {showDone && (
                    <div className="pc-modal-backdrop">
                        <div className="pc-modal pc-modal-done" onClick={(e) => e.stopPropagation()}>
                            <div className="pc-done-illu">
                                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                    <rect x="20" y="14" width="80" height="92" rx="8" fill="#FCDAE3" stroke="#E6235A" strokeWidth="2.5"/>
                                    <rect x="32" y="26" width="56" height="6" rx="3" fill="#E6235A" opacity="0.4"/>
                                    <rect x="32" y="38" width="40" height="4" rx="2" fill="#E6235A" opacity="0.25"/>
                                    <circle cx="60" cy="70" r="22" fill="#fff" stroke="#E6235A" strokeWidth="2"/>
                                    <path d="M48 71l8 8 16-18" stroke="#E6235A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </svg>
                            </div>
                            <h3>제보 작성이<br/>완료되었습니다</h3>
                            <button className="pc-btn-pink" onClick={() => onNavigate && onNavigate('pcReportMap')}>
                                등록하기
                            </button>
                            <button className="pc-btn-pink-soft" onClick={() => setShowDone(false)}>
                                임시저장
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </UserPCLayout>
    );
}
