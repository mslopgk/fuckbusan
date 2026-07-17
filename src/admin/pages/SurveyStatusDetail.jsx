import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin_layout.css';
import '../styles/survey_admin.css';
import { API_BASE } from '../api';

// Figma 302:28185는 "2025.01.01  18:00" 표기
const fmtDateTime = (v) => (v ? String(v).replace('T', ' ').slice(0, 16).replace(/-/g, '.') : '-');

// 처리상태 선택지 (Figma 예시 '신규' 포함)
const STATUS_OPTIONS = ['신규', '확인', '처리중', '완료', '보류'];

// Figma 설문 현황(302:28185): AI 대화형 설문 응답 1건 상세
export default function SurveyStatusDetail({ survey, onNavigate }) {
    const sessionId = survey?.session_id || survey?.id;
    const [detail, setDetail] = useState(null);
    const [status, setStatus] = useState('신규');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!sessionId) return;
        const token = localStorage.getItem('access_token');
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/survey-chat/admin/${sessionId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    const d = await res.json();
                    setDetail(d);
                    setStatus(d.status || '신규');
                }
            } catch (e) {
                console.error('Failed to fetch survey detail:', e);
            }
        })();
    }, [sessionId]);

    const handleExport = async () => {
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API_BASE}/survey-chat/admin/${sessionId}/export?fmt=txt`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) { alert('내보내기 실패: ' + res.status); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `survey_chat_${sessionId}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('오류: ' + e.message);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/survey-chat/admin/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                alert('처리상태가 저장되었습니다.');
                onNavigate && onNavigate('surveyManagement');
            } else {
                alert('저장 실패: ' + res.status);
            }
        } catch (e) {
            alert('오류: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const d = detail || {};
    const attachments = d.attachments || [];

    const fields = [
        { label: '접수일시', value: fmtDateTime(d.received_at) },
        { label: '진입유형', value: d.entry_type || '-' },
        { label: '제출유형', value: d.submit_type || '-' },
        { label: '장소', value: d.location || '-' },
        { label: '문제유형', value: d.problem_type || '-' },
        { label: '시급도', value: d.severity || '-' },
    ];

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyStatusDetail">
            <div className="svd-page">
                <div className="svd-content">
                    <h2 className="svd-title">설문현황</h2>
                    <hr className="svd-divider" />

                    <div className="svd-form">
                        {fields.map((f) => (
                            <div className="svd-row" key={f.label}>
                                <label className="svd-label">{f.label}</label>
                                <input type="text" className="svd-input" value={f.value} readOnly title={f.value} />
                            </div>
                        ))}
                        <div className="svd-row">
                            <label className="svd-label">처리상태</label>
                            <select
                                className="svd-select"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="svd-row svd-row-top">
                            <label className="svd-label">첨부 여부</label>
                            {attachments.length === 0 ? (
                                <span className="svd-attach-empty">첨부파일 없음</span>
                            ) : (
                                <div className="svd-attach-list">
                                    {attachments.map((url, i) => (
                                        <img key={i} className="svd-attach-img" src={url} alt={`첨부${i + 1}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="svd-footer">
                        <button className="svd-btn-export" onClick={handleExport}>대화 내보내기</button>
                        <button className="svd-btn-save" onClick={handleSave} disabled={saving}>
                            {saving ? '저장 중...' : '수정하기'}
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
