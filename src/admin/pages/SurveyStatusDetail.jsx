import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/member_edit.css';
import { API_BASE } from '../api';

const fmtDateTime = (v) => (v ? String(v).replace('T', ' ').slice(0, 16) : '-');

// 처리상태 선택지 (Figma 예시 '신규' 포함)
const STATUS_OPTIONS = ['신규', '확인', '처리중', '완료', '보류'];

// Figma 설문현황(302-28185): AI 대화형 설문 응답 1건 상세
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

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyStatusDetail">
            <div className="edit-form-header">
                <h2 className="edit-form-title">설문현황</h2>
            </div>

            <div className="edit-form-box">
                <div className="edit-form-row">
                    <label className="edit-form-label">접수일시</label>
                    <input type="text" className="edit-form-input" value={fmtDateTime(d.received_at)} readOnly
                        style={{ background: '#f5f5f5', cursor: 'default' }} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">진입유형</label>
                    <input type="text" className="edit-form-input" value={d.entry_type || '-'} readOnly
                        style={{ background: '#f5f5f5', cursor: 'default' }} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">제출유형</label>
                    <input type="text" className="edit-form-input" value={d.submit_type || '-'} readOnly
                        style={{ background: '#f5f5f5', cursor: 'default' }} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">장소</label>
                    <input type="text" className="edit-form-input wide" value={d.location || '-'} readOnly
                        style={{ background: '#f5f5f5', cursor: 'default' }} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">문제유형</label>
                    <input type="text" className="edit-form-input" value={d.problem_type || '-'} readOnly
                        style={{ background: '#f5f5f5', cursor: 'default' }} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">시급도</label>
                    <input type="text" className="edit-form-input" value={d.severity || '-'} readOnly
                        style={{ background: '#f5f5f5', cursor: 'default' }} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">처리상태</label>
                    <select
                        className="edit-form-input"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ cursor: 'pointer' }}
                    >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="edit-form-row" style={{ alignItems: 'flex-start' }}>
                    <label className="edit-form-label" style={{ paddingTop: 4 }}>첨부 여부</label>
                    <div>
                        {attachments.length === 0 ? (
                            <span style={{ color: '#bbb', fontSize: 14 }}>첨부파일 없음</span>
                        ) : (
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {attachments.map((url, i) => (
                                    <img key={i} src={url} alt={`첨부${i + 1}`}
                                        style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="edit-form-footer">
                <button className="btn-delete-member" onClick={handleExport}>대화 내보내기</button>
                <button className="btn-confirm-edit" onClick={handleSave} disabled={saving}>
                    {saving ? '저장 중...' : '수정하기'}
                </button>
            </div>
        </AdminLayout>
    );
}
