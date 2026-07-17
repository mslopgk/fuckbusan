import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { ParticipationTable } from './MemberEdit';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/member_edit.css';
import '../styles/expert_edit.css';
import { API_BASE } from '../api';

const fmtDate = (v) => (v ? String(v).replace('T', ' ').slice(0, 10) : '-');
const fmtDateTime = (v) => (v ? String(v).replace('T', ' ').slice(0, 16) : '-');

export default function ExpertEdit({ member, onNavigate }) {
    const [formData, setFormData] = useState(member || {});
    const [activity, setActivity] = useState({ proposals: [], reports: [], surveys: [] });
    const [open, setOpen] = useState({ proposals: true, reports: true, surveys: true });
    const [saving, setSaving] = useState(false);
    const [approveModal, setApproveModal] = useState(false); // 승인 확인 모달 (Figma 302:27772)

    const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));
    const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

    useEffect(() => {
        const id = member?.id;
        if (!id) return;
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/admin/users/${id}`, { headers });
                if (res.ok) {
                    const u = await res.json();
                    setFormData({
                        id: u.user_id,
                        name: u.name || '',
                        loginId: u.ID || '',
                        nickname: u.nickname || '',
                        phone: u.phone_num || '',
                        address: [u.address, u.detailed_address].filter(Boolean).join(' '),
                        email: u.email || '',
                        isApproved: !!u.is_approved,
                        joinDate: fmtDate(u.created_at),
                        lastLogin: fmtDateTime(u.prev_login || u.last_login),
                    });
                }
            } catch (e) { console.error('Failed to fetch expert:', e); }

            try {
                const res = await fetch(`${API_BASE}/admin/users/${id}/activity`, { headers });
                if (res.ok) setActivity(await res.json());
            } catch (e) { console.error('Failed to fetch activity:', e); }
        })();
    }, [member?.id]);

    const handleConfirm = async () => {
        if (!formData.id) { alert('회원 정보가 없습니다.'); return; }
        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/admin/users/${formData.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    nickname: formData.nickname || null,
                    phone_num: formData.phone || null,
                    email: formData.email || null,
                    address: formData.address || null,
                    is_approved: !!formData.isApproved,
                }),
            });
            if (res.ok) {
                alert('전문가 정보가 수정되었습니다.');
                onNavigate && onNavigate('expertManagement');
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || '수정에 실패했습니다.');
            }
        } catch (e) {
            alert('에러가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!formData.id) return;
        if (!window.confirm(`"${formData.name}" 회원을 삭제하시겠습니까?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/admin/users/${formData.id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                alert('전문가가 삭제되었습니다.');
                onNavigate && onNavigate('expertManagement');
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || '삭제에 실패했습니다.');
            }
        } catch (e) {
            alert('에러가 발생했습니다.');
        }
    };

    // 승인 클릭 시 확인 모달 (Figma 302:27637), 미승인은 즉시 반영
    const handleApproveClick = () => {
        if (formData.isApproved) return;
        setApproveModal(true);
    };

    const proposals = activity.proposals || [];
    const reports = activity.reports || [];
    const surveys = activity.surveys || [];

    return (
        <AdminLayout onNavigate={onNavigate} currentView="expertEdit">
            <div className="edit-form-header">
                <h2 className="edit-form-title">회원관리</h2>
            </div>

            <div className="edit-form-box">
                <div className="edit-form-row">
                    <label className="edit-form-label">회원이름</label>
                    <input type="text" className="edit-form-input" value={formData.name || ''} readOnly />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">회원아이디</label>
                    <input type="text" className="edit-form-input" value={formData.loginId || ''} readOnly />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">닉네임</label>
                    <input type="text" className="edit-form-input" value={formData.nickname || ''}
                        onChange={(e) => set('nickname', e.target.value)} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">연락처</label>
                    <input type="text" className="edit-form-input" value={formData.phone || ''}
                        onChange={(e) => set('phone', e.target.value)} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">주소</label>
                    <input type="text" className="edit-form-input wide" value={formData.address || ''}
                        onChange={(e) => set('address', e.target.value)} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">이메일</label>
                    <input type="text" className="edit-form-input" value={formData.email || ''}
                        onChange={(e) => set('email', e.target.value)} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">승인상태</label>
                    <div className="approval-toggle">
                        <button
                            type="button"
                            className={`approval-toggle-btn ${formData.isApproved ? 'on' : ''}`}
                            onClick={handleApproveClick}
                        >승인</button>
                        <button
                            type="button"
                            className={`approval-toggle-btn pending ${!formData.isApproved ? 'on' : ''}`}
                            onClick={() => set('isApproved', false)}
                        >미승인</button>
                    </div>
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">가입일</label>
                    <input type="text" className="edit-form-input" value={formData.joinDate || '-'} readOnly />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">최근 접속일</label>
                    <input type="text" className="edit-form-input" value={formData.lastLogin || '-'} readOnly />
                </div>

                {/* 참여현황 리스트 (collapsible) */}
                <div className="edit-form-row" style={{ alignItems: 'flex-start' }}>
                    <label className="edit-form-label">참여현황 리스트</label>
                    <div className="participation-wrap">
                        <ParticipationTable
                            title="제안" count={proposals.length} open={open.proposals} onToggle={() => toggle('proposals')}
                            head={['제안제목', '작성자 ID', '유형', '위치']}
                            rows={proposals.map((p) => [p.title, p.author_id, p.category, p.region])}
                        />
                        <ParticipationTable
                            title="제보" count={reports.length} open={open.reports} onToggle={() => toggle('reports')}
                            head={['제보제목', '작성자 ID', '유형', '위치']}
                            rows={reports.map((r) => [r.title, r.author_id, r.category, r.region])}
                        />
                        <ParticipationTable
                            variant="survey"
                            title="설문" count={surveys.length} open={open.surveys} onToggle={() => toggle('surveys')}
                            head={['설문제목', '작성자 ID', '상태', '답변', '수정', '메뉴']}
                            rows={surveys.map((s) => [s.title, s.author_id, s.status, s.answer_count, fmtDateTime(s.updated_at), '결과'])}
                        />
                    </div>
                </div>
            </div>

            <div className="edit-form-footer">
                <button className="btn-delete-member" onClick={handleDelete}>회원삭제</button>
                <button className="btn-confirm-edit" onClick={handleConfirm} disabled={saving}>
                    {saving ? '저장 중...' : '확인'}
                </button>
            </div>

            {/* 승인 확인 모달 — Figma 302:27772 (500x242 r10, 오버레이 70% 블랙) */}
            {approveModal && (
                <div className="apv-modal-overlay" onClick={() => setApproveModal(false)}>
                    <div className="apv-modal" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="apv-modal-close" onClick={() => setApproveModal(false)}>
                            <img src="/figma-assets/admin/modal_close.png" alt="닫기" />
                        </button>
                        <div className="apv-modal-title">승인 확인</div>
                        <div className="apv-modal-desc">승인하시겠습니까?</div>
                        <div className="apv-modal-actions">
                            <button type="button" className="apv-btn-cancel" onClick={() => setApproveModal(false)}>취소</button>
                            <button
                                type="button"
                                className="apv-btn-ok"
                                onClick={() => { set('isApproved', true); setApproveModal(false); }}
                            >승인</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
