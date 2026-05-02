import { useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PCHeroIllu from './PCHeroIllu';
import './PCFormShared.css';

const TYPES = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

export default function PCProposeForm({ onNavigate }) {
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [location, setLocation] = useState('');
    const [files, setFiles] = useState([]);

    const [showMap, setShowMap] = useState(false);
    const [showFilePicker, setShowFilePicker] = useState(false);
    const [showDone, setShowDone] = useState(false);

    const valid = type && title.trim() && body.trim();

    const handleSelectAddress = (addr) => {
        setLocation(addr);
        setShowMap(false);
    };

    const handleAddFile = (name) => {
        setFiles((prev) => [...prev, name]);
        setShowFilePicker(false);
    };

    return (
        <UserPCLayout currentView="pcProposeForm" onNavigate={onNavigate}>
            <div className="pc-form-page">
                <div className="pc-form-inner">
                    <h2 className="pc-form-title">제안하기</h2>

                    <div className="pc-form-hero pc-hero-yellow">
                        <div>
                            <h3>우리동네 개선 아이디어를<br/>제안해보세요.</h3>
                        </div>
                        <PCHeroIllu accent="#c89500" height={140} />
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
                                        onChange={() => setType(t)}
                                    />
                                    {t}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">제목</label>
                        <input
                            type="text"
                            className="pc-form-input"
                            placeholder="제목을 입력해주세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">자세한 설명</label>
                        <textarea
                            className="pc-form-textarea"
                            placeholder="우리동네 현황 및 문제점, 개선방안, 기대효과 등을 자세히 작성해주세요."
                            rows={6}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">위치정보</label>
                        <button className="pc-form-input pc-form-clickable" onClick={() => setShowMap(true)}>
                            <span className={location ? '' : 'placeholder'}>{location || '지도로 위치 설정하기'}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z"/></svg>
                        </button>
                    </div>

                    <div className="pc-form-section">
                        <label className="pc-form-label">첨부자료 (선택)</label>
                        <div className="pc-attach-grid">
                            {files.map((f, i) => (
                                <div key={i} className="pc-attach-item">
                                    <span>{f}</span>
                                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                                </div>
                            ))}
                            <button className="pc-attach-add" onClick={() => setShowFilePicker(true)}>＋</button>
                        </div>
                        <p className="pc-form-hint">* 사진 또는 동영상 첨부해주세요</p>
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
                                {['해운대구 우동 123-45', '해운대구 좌동 678-9', '동래구 사직동 100-1'].map((a) => (
                                    <div key={a} className="pc-modal-list-item" onClick={() => handleSelectAddress(a)}>
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

                {showFilePicker && (
                    <div className="pc-modal-backdrop" onClick={() => setShowFilePicker(false)}>
                        <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>첨부자료 추가</h3>
                            <div className="pc-file-pick-grid">
                                <button onClick={() => handleAddFile('사진_001.jpg')}>📷 사진</button>
                                <button onClick={() => handleAddFile('영상_001.mp4')}>🎥 동영상</button>
                                <button onClick={() => handleAddFile('파일_001.pdf')}>📄 파일</button>
                            </div>
                            <div className="pc-modal-actions">
                                <button className="pc-btn-light" onClick={() => setShowFilePicker(false)}>취소</button>
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
                            <h3>제안 작성이<br/>완료되었습니다</h3>
                            <button className="pc-btn-pink" onClick={() => onNavigate && onNavigate('pcProposeMap')}>
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
