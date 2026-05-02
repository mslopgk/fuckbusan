import { useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PCHeroIllu from './PCHeroIllu';
import './PCFormShared.css';

const TYPES = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
const FACILITIES = ['공공/시설물', '도로/보도', '하수/배수', '가로등/조명', '벤치/쉼터', '쓰레기/청소', '안내판/표지판'];
const ISSUES = ['파손', '오염', '고장', '미흡', '안전위험', '기타'];

export default function PCReportForm({ onNavigate }) {
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState('');
    const [type, setType] = useState('');
    const [facility, setFacility] = useState('공공/시설물');
    const [issue, setIssue] = useState('문제사항');
    const [description, setDescription] = useState('');

    const [showPhoto, setShowPhoto] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [showFacilityDrop, setShowFacilityDrop] = useState(false);
    const [showIssueDrop, setShowIssueDrop] = useState(false);
    const [showDone, setShowDone] = useState(false);

    const valid = photo && location && type && description.trim();

    return (
        <UserPCLayout currentView="pcReportForm" onNavigate={onNavigate}>
            <div className="pc-form-page">
                <div className="pc-form-inner">
                    <h2 className="pc-form-title">제보하기</h2>

                    <div className="pc-form-hero pc-hero-yellow">
                        <div>
                            <h3>문제 상황이 잘 보이도록<br/>사진을 등록해 주세요</h3>
                        </div>
                        <PCHeroIllu accent="#c89500" height={140} />
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">사진 등록</label>
                        <button className="pc-photo-btn" onClick={() => setShowPhoto(true)}>
                            {photo ? <img src={photo} alt="등록 사진" /> : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            )}
                        </button>
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">위치정보</label>
                        <button className="pc-form-input pc-form-clickable" onClick={() => setShowMap(true)}>
                            <span className={location ? '' : 'placeholder'}>{location || '지도로 위치 설정하기'}</span>
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
                        <button className="pc-btn-light" disabled={!valid}>임시저장</button>
                        <button
                            className={`pc-btn-pink ${valid ? '' : 'disabled'}`}
                            disabled={!valid}
                            onClick={() => setShowDone(true)}
                        >
                            작성완료
                        </button>
                    </div>
                </div>

                {showPhoto && (
                    <div className="pc-modal-backdrop" onClick={() => setShowPhoto(false)}>
                        <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>사진 등록</h3>
                            <div className="pc-file-pick-grid">
                                <button onClick={() => { setPhoto('/preview.jpg'); setShowPhoto(false); }}>📷 카메라</button>
                                <button onClick={() => { setPhoto('/preview.jpg'); setShowPhoto(false); }}>🖼 갤러리</button>
                            </div>
                            <div className="pc-modal-actions">
                                <button className="pc-btn-light" onClick={() => setShowPhoto(false)}>취소</button>
                            </div>
                        </div>
                    </div>
                )}

                {showMap && (
                    <div className="pc-modal-backdrop" onClick={() => setShowMap(false)}>
                        <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>주소 검색</h3>
                            <input
                                type="text"
                                placeholder="도로명, 지번, 건물명으로 검색"
                                className="pc-form-input"
                                autoFocus
                            />
                            <div className="pc-modal-list">
                                {['해운대구 우동 123-45', '동래구 사직동 100-1', '부산진구 부전동 200-2'].map((a) => (
                                    <div key={a} className="pc-modal-list-item" onClick={() => { setLocation(a); setShowMap(false); }}>
                                        {a}
                                    </div>
                                ))}
                            </div>
                            <div className="pc-modal-actions">
                                <button className="pc-btn-light" onClick={() => setShowMap(false)}>취소</button>
                            </div>
                        </div>
                    </div>
                )}

                {showDone && (
                    <div className="pc-modal-backdrop">
                        <div className="pc-modal pc-modal-done" onClick={(e) => e.stopPropagation()}>
                            <div className="pc-done-illu">
                                <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                                    <rect x="22" y="14" width="56" height="76" rx="6" fill="#FFE9C8" stroke="#E6235A" strokeWidth="2"/>
                                    <path d="M40 56l8 8 14-16" stroke="#E6235A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
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
