import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/member_edit.css';

export default function MemberEdit({ member, onNavigate }) {
    const [formData, setFormData] = useState(member || {
        name: '홍길동 1',
        userIdShown: 'abc123',
        nickname: '부산시민',
        phone: '010-1111-2222',
        address: '부산시 동래구 온천천로 285번길 28 104호',
        email: 'busan@naver.com',
        birth: '880101',
        approval: '승인',
        joinDate: '2025.01.01',
        lastLogin: '2025.01.01 15:00',
        participation: '제안 4건',
    });

    const handleConfirm = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/users/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: formData.id,
                    ID: formData.email,
                    name: formData.name,
                    nickname: formData.nickname,
                    phone_num: formData.phone,
                    district_code: formData.district_code || 'general',
                }),
            });
            if (response.ok) {
                alert('회원 정보가 수정되었습니다.');
                if (onNavigate) onNavigate('adminDashboardNew');
            } else {
                alert('수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('Update Error:', error);
            alert('에러가 발생했습니다.');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/users/${formData.id}`, { method: 'DELETE' });
            if (response.ok) {
                alert('회원이 삭제되었습니다.');
                if (onNavigate) onNavigate('adminDashboardNew');
            } else {
                alert('삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete Error:', error);
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
                    <label className="edit-form-label">회원이름</label>
                    <input type="text" className="edit-form-input" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">회원아이디</label>
                    <input type="text" className="edit-form-input" value={formData.userIdShown || formData.email || ''} onChange={(e) => setFormData({ ...formData, userIdShown: e.target.value })} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">닉네임</label>
                    <input type="text" className="edit-form-input" value={formData.nickname || ''} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">연락처</label>
                    <input type="text" className="edit-form-input" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">주소</label>
                    <input type="text" className="edit-form-input wide" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">이메일</label>
                    <input type="text" className="edit-form-input" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">생년월일</label>
                    <input type="text" className="edit-form-input" value={formData.birth || ''} onChange={(e) => setFormData({ ...formData, birth: e.target.value })} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">승인상태</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={`approval-badge ${formData.approval === '승인' ? 'approved' : 'pending'}`}>
                            {formData.approval || '대기'}
                        </span>
                        <button
                            type="button"
                            className="pill-btn muted"
                            onClick={() => setFormData({ ...formData, approval: formData.approval === '승인' ? '대기' : '승인' })}
                        >
                            {formData.approval === '승인' ? '대기로 변경' : '승인하기'}
                        </button>
                    </div>
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">가입일</label>
                    <input type="text" className="edit-form-input" value={formData.joinDate || '2025.01.01'} readOnly />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">최근 접속일</label>
                    <input type="text" className="edit-form-input" value={formData.lastLogin || '2025.01.01 15:00'} readOnly />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">참여현황</label>
                    <div className="edit-form-input edit-form-text-only" style={{ display: 'flex', alignItems: 'center' }}>
                        {formData.participation || '제안 0건'}
                    </div>
                </div>
            </div>

            <div className="edit-form-footer">
                <button className="btn-delete-member" onClick={handleDelete}>회원삭제</button>
                <button className="btn-confirm-edit" onClick={handleConfirm}>확인</button>
            </div>
        </AdminLayout>
    );
}
