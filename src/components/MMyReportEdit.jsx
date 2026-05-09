import { useState } from 'react';
import './MProposalForm.css';
import './MProposalList.css';
import './MReportForm.css';
import { API_URL } from '../utils/api';

const CATS = ['주거', '환경', '교통', '안전'];
const POSITIONS = ['', '공공/시설물', '도로/보도', '하수/배수', '가로등/조명', '벤치/쉼터', '쓰레기/청소', '안내판/표지판'];
const ISSUES = ['', '파손', '오염', '고장', '미흡', '안전위험', '기타'];

export default function MMyReportEdit({ onNavigate, report, onComplete }) {
    const [photo, setPhoto] = useState(report?.image || '');
    const [address, setAddress] = useState(report?.detailed_address || report?.location || report?.address || '');
    const [detail, setDetail] = useState(report?.detail || '');
    const [cat, setCat] = useState(report?.category || report?.cat || '');
    const [position, setPosition] = useState(report?.sub_category || report?.position || '');
    const [issue, setIssue] = useState(report?.issue || '');
    const [body, setBody] = useState(report?.content || report?.body || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = !!report?.id && !!cat && !!address.trim();

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;
        setError('');
        const token = localStorage.getItem('access_token');
        const payload = {
            title: report?.title || '',
            category: cat,
            sub_category: position || null,
            content: body || null,
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
            detailed_address: detail,
            detail,
            cat,
            category: cat,
            sub_category: position,
            position,
            issue,
            body,
            content: body,
        };

        if (!token) {
            // 비로그인 — 로컬 상태만 갱신
            if (onComplete) onComplete(updatedLocal);
            if (onNavigate) onNavigate('mMyReportDetail', updatedLocal);
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
            if (onNavigate) onNavigate('mMyReportDetail', updatedLocal);
        } catch (e) {
            setError(e.message || '수정 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="m-prop-form-page m-report-form-page m-myrep-edit-page">
            <header className="m-form-topbar">
                <button className="m-form-back" onClick={() => onNavigate && onNavigate('mMyReportDetail')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
            </header>

            <div className="m-form-body">
                <h1 className="m-form-title">문제 상황이 잘 보이도록<br/>사진을 등록해 주세요</h1>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">사진 등록</h3>
                    <div className="m-myrep-edit-photo-row">
                        {photo && (
                            <div className="m-myrep-edit-photo">
                                <img src={photo} alt="등록 사진" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                        )}
                        <button className="m-myrep-edit-photo-add" type="button" aria-label="사진 추가">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                    </div>
                </section>

                <section className="m-form-section">
                    <h3 className="m-form-section-title">위치정보</h3>
                    <div className="m-myrep-edit-loc">
                        <input
                            type="text"
                            className="m-row-input"
                            placeholder="주소"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                        <button className="m-myrep-edit-loc-pin" type="button" aria-label="위치 설정">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2.5"/></svg>
                        </button>
                    </div>
                    <input
                        type="text"
                        className="m-row-input m-myrep-edit-detail-input"
                        placeholder="상세 위치"
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                    />
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
                        <select className="m-select" value={position} onChange={(e) => setPosition(e.target.value)}>
                            {POSITIONS.map((p, i) => (
                                <option key={i} value={p}>{p || '공공/시설물'}</option>
                            ))}
                        </select>
                        <span className="m-row-suffix">에</span>
                    </div>

                    <div className="m-row-with-suffix">
                        <select className="m-select" value={issue} onChange={(e) => setIssue(e.target.value)}>
                            {ISSUES.map((p, i) => (
                                <option key={i} value={p}>{p || '문제사항'}</option>
                            ))}
                        </select>
                        <span className="m-row-suffix">불편해요</span>
                    </div>

                    <input
                        type="text"
                        className="m-row-input"
                        placeholder="상세설명을 작성해주세요"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />
                </section>

                {error && <p className="m-myrep-edit-error">{error}</p>}
            </div>

            <footer className="m-form-footer m-myrep-edit-footer">
                <button
                    className="m-form-submit"
                    type="button"
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                >{submitting ? '수정 중…' : '수정완료'}</button>
            </footer>
        </div>
    );
}
