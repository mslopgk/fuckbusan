import { useState, useRef } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCFormShared.css';
import './PCMyReportEdit.css';
import { API_URL } from '../utils/api';
import { compressImage } from '../utils/imageCompress';

// Figma 215:3219: 카테고리 chip 목록 (주거/환경/교통/안전/교육/산업·일자리/문화·여가/보건·복지)
const TYPES = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
const FACILITIES = ['공공/시설물', '도로/보도', '하수/배수', '가로등/조명', '벤치/쉼터', '쓰레기/청소', '안내판/표지판', '거리'];
const ISSUES = ['파손', '오염', '고장', '미흡', '안전위험', '위험이 있어요', '기타'];

export default function PCMyReportEdit({ onNavigate, report, onComplete }) {
    const [photo, setPhoto] = useState(report?.image || '');
    const [address, setAddress] = useState(report?.location || report?.address || '');
    const [detail, setDetail] = useState(report?.detailed_address || report?.detail || '');
    const [type, setType] = useState(report?.category || report?.cat || '');
    const [facility, setFacility] = useState(report?.sub_category || report?.position || '');
    const [issue, setIssue] = useState(report?.issue || '');
    const [description, setDescription] = useState(report?.content || report?.body || '');

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [showFacilityDrop, setShowFacilityDrop] = useState(false);
    const [showIssueDrop, setShowIssueDrop] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const valid = !!report?.id && !!address && !!type && !uploading;

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            const compressed = await compressImage(file);
            const form = new FormData();
            form.append('file', compressed);
            const res = await fetch(`${API_URL}/api/reports/upload`, { method: 'POST', body: form });
            if (res.ok) {
                const j = await res.json();
                setPhoto(j.url || '');
            } else {
                setError('사진 업로드에 실패했습니다.');
            }
        } catch (err) {
            setError(err?.message || '사진 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!valid || submitting) return;
        setError('');
        const token = localStorage.getItem('access_token');
        const payload = {
            title: report?.title || '',
            category: type,
            sub_category: facility || null,
            content: description || null,
            region: report?.region || null,
            location: address || null,
            detailed_address: detail || null,
            lat: report?.lat ?? null,
            lng: report?.lng ?? null,
            image_url: photo || null,
        };
        const updatedLocal = {
            ...report,
            image: photo,
            address,
            location: address,
            detail,
            detailed_address: detail,
            cat: type,
            category: type,
            sub_category: facility,
            position: facility,
            issue,
            body: description,
            content: description,
        };

        if (!token) {
            if (onComplete) onComplete(updatedLocal);
            if (onNavigate) onNavigate('pcMyReportList');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/${report.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.detail || `수정 실패 (${res.status})`);
            }
            if (onComplete) onComplete(updatedLocal);
            if (onNavigate) onNavigate('pcMyReportList');
        } catch (e) {
            setError(e.message || '수정 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <UserPCLayout currentView="pcMyReportEdit" onNavigate={onNavigate}>
            <div className="pc-form-page pc-myrep-edit-page">
                <div className="pc-form-inner">
                    {/* 페이지 제목 (Figma: "제보하기", 30px, bold) */}
                    <h2 className="pc-form-title">제보하기</h2>

                    {/* 히어로 배너 (Figma 215:3221: bg #fef4b7 노랑, radius=30px) */}
                    <div className="pc-form-hero pc-hero-yellow">
                        <div>
                            <h3>문제 상황이 잘 보이도록<br/>사진을 등록해 주세요</h3>
                        </div>
                        <img className="pc-form-hero-img" src="/figma-assets/propose-hero.png" alt="" />
                    </div>

                    {/* 사진 등록 (Figma: size=80px, 2개 박스) */}
                    <div className="pc-form-section">
                        <label className="pc-form-label">사진 등록</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        <div className="pc-myrep-edit-photo-row">
                            {photo && (
                                <div className="pc-myrep-edit-photo">
                                    <img src={photo} alt="등록 사진"
                                        onError={(e) => { e.currentTarget.parentNode.style.display = 'none'; }} />
                                    {uploading && (
                                        <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 5px' }}>
                                            업로드 중...
                                        </span>
                                    )}
                                </div>
                            )}
                            {/* + 버튼 박스 */}
                            <button
                                className="pc-myrep-edit-photo-add"
                                type="button"
                                aria-label="사진 추가"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <span style={{ fontSize: 11, color: '#999' }}>업로드 중...</span>
                                ) : (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 위치정보 (Figma 215:3224: 주소 + 상세위치 side by side, h=55px each) */}
                    <div className="pc-form-section">
                        <label className="pc-form-label">위치정보</label>
                        <div className="pc-myrep-edit-loc-row">
                            {/* 주소 입력 (Figma: placeholder #a6a6a6, border #dcdcdc) */}
                            <div className="pc-myrep-edit-loc-input">
                                <input
                                    type="text"
                                    placeholder="부산 해운대구 해운대해변로 99"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                                <button type="button" className="pc-myrep-edit-loc-pin" aria-label="위치 설정">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="12" y1="2" x2="12" y2="5"/>
                                        <line x1="12" y1="19" x2="12" y2="22"/>
                                        <line x1="2" y1="12" x2="5" y2="12"/>
                                        <line x1="19" y1="12" x2="22" y2="12"/>
                                        <circle cx="12" cy="12" r="2.5"/>
                                    </svg>
                                </button>
                            </div>
                            {/* 상세위치 (Figma 215:3248: border #542aa3 보라, 입력 활성 상태) */}
                            <input
                                type="text"
                                className="pc-myrep-edit-detail-input"
                                placeholder="상세 위치"
                                value={detail}
                                onChange={(e) => setDetail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 카테고리 chip (Figma 215:3257: 보라 active chip) */}
                    <div className="pc-form-section">
                        <label className="pc-form-label">우리동네 불편사항을 제보해주세요</label>
                        <div className="pc-chip-row">
                            {TYPES.map((t) => (
                                <button
                                    key={t}
                                    className={`pc-form-chip ${type === t ? 'active' : ''}`}
                                    onClick={() => setType(t)}
                                    type="button"
                                >{t}</button>
                            ))}
                        </div>
                    </div>

                    {/* [공공/시설물] 에 [문제사항] 불편해요 (Figma: 드롭다운) */}
                    <div className="pc-form-section pc-form-row-flex">
                        <div className="pc-form-dropdown">
                            <button
                                className="pc-form-input pc-form-clickable"
                                onClick={() => setShowFacilityDrop(!showFacilityDrop)}
                                type="button"
                            >
                                <span className={facility ? '' : 'placeholder'}>{facility || '공공/시설물'}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </button>
                            {showFacilityDrop && (
                                <div className="pc-dropdown-list">
                                    {FACILITIES.map((f) => (
                                        <div key={f} className="pc-dropdown-item"
                                            onClick={() => { setFacility(f); setShowFacilityDrop(false); }}>{f}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="pc-form-conjunction">에</span>
                        <div className="pc-form-dropdown">
                            <button
                                className="pc-form-input pc-form-clickable"
                                onClick={() => setShowIssueDrop(!showIssueDrop)}
                                type="button"
                            >
                                <span className={issue ? '' : 'placeholder'}>{issue || '문제사항'}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </button>
                            {showIssueDrop && (
                                <div className="pc-dropdown-list">
                                    {ISSUES.map((it) => (
                                        <div key={it} className="pc-dropdown-item"
                                            onClick={() => { setIssue(it); setShowIssueDrop(false); }}>{it}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="pc-form-conjunction">불편해요</span>
                    </div>

                    {/* 상세설명 */}
                    <div className="pc-form-section">
                        <input
                            type="text"
                            className="pc-form-input"
                            placeholder="상세설명을 작성해주세요"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {error && <p className="pc-myrep-edit-error">{error}</p>}

                    {/* 수정완료 버튼 (Figma 215:3226: bg #542aa3 보라, 우측 정렬, w=301px, h=59px) */}
                    <div className="pc-myrep-edit-actions">
                        <button
                            type="button"
                            className="pc-btn-purple"
                            disabled={!valid || submitting}
                            onClick={handleSubmit}
                        >
                            {submitting ? '수정 중…' : '수정완료'}
                        </button>
                    </div>
                </div>
            </div>
        </UserPCLayout>
    );
}
