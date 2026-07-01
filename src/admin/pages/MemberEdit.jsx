import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/member_edit.css';
import { API_BASE } from '../api';

export default function MemberEdit({ member, onNavigate }) {
    const [formData, setFormData] = useState(member || {});
    const [saving, setSaving] = useState(false);

    const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

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
                    district_code: formData.district || null,
                }),
            });
            if (res.ok) {
                alert('회원 정보가 수정되었습니다.');
                onNavigate && onNavigate('adminUserList');
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
                alert('회원이 삭제되었습니다.');
                onNavigate && onNavigate('adminUserList');
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || '삭제에 실패했습니다.');
            }
        } catch (e) {
            alert('에러가 발생했습니다.');
        }
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="memberEdit">
            <div className="edit-form-header">
                <h2 className="edit-form-title">회원 정보</h2>
            </div>

            <div className="edit-form-box">
                <div className="edit-form-row">
                    <label className="edit-form-label">이름</label>
                    <input
                        type="text"
                        className="edit-form-input"
                        value={formData.name || ''}
                        readOnly
                        style={{ background: '#f5f5f5', cursor: 'default' }}
                    />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">아이디</label>
                    <input
                        type="text"
                        className="edit-form-input"
                        value={formData.loginId || ''}
                        readOnly
                        style={{ background: '#f5f5f5', cursor: 'default' }}
                    />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">닉네임</label>
                    <input
                        type="text"
                        className="edit-form-input"
                        value={formData.nickname || ''}
                        onChange={(e) => set('nickname', e.target.value)}
                    />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">연락처</label>
                    <input
                        type="text"
                        className="edit-form-input"
                        value={formData.phone || ''}
                        onChange={(e) => set('phone', e.target.value)}
                    />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">지역</label>
                    <input
                        type="text"
                        className="edit-form-input"
                        value={formData.district || ''}
                        onChange={(e) => set('district', e.target.value)}
                        placeholder="예: 부산진구"
                    />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">가입일</label>
                    <input
                        type="text"
                        className="edit-form-input"
                        value={formData.joinDate || '-'}
                        readOnly
                        style={{ background: '#f5f5f5', cursor: 'default' }}
                    />
                </div>
            </div>

            <div className="edit-form-footer">
                <button className="btn-delete-member" onClick={handleDelete}>회원삭제</button>
                <button className="btn-confirm-edit" onClick={handleConfirm} disabled={saving}>
                    {saving ? '저장 중...' : '확인'}
                </button>
            </div>
        </AdminLayout>
    );
}
