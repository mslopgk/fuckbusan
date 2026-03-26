import React, { useState } from 'react';
import '../styles/dashboard_new.css'; // Borrowing sidebar/header styles
import '../styles/member_edit.css';

export default function MemberEdit({ member, onNavigate }) {
    // Default mock data if no member provided
    const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(true);
    const [formData, setFormData] = useState(member || {
        name: '홍길동 1',
        nickname: '부산시민',
        phone: '010-1111-2222',
        address: '부산시 동래구 온천천로 285번길 28 104호',
        email: 'busan@naver.com',
        birth: '880101',
        joinDate: '2025.01.01',
        lastLogin: '2025.01.01 15:00',
        participation: '제안 4건'
    });

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        if (onNavigate) onNavigate('adminLoginNew');
    };

    const handleConfirm = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/users/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: formData.id,
                    ID: formData.email,
                    name: formData.name,
                    nickname: formData.nickname,
                    phone_num: formData.phone,
                    district_code: formData.district_code || 'general'
                }),
            });

            if (response.ok) {
                alert('회원 정보가 수정되었습니다.');
                if (onNavigate) onNavigate('adminDashboardNew');
            } else {
                alert('수정에 실패했습니다.');
            }
        } catch (error) {
            console.error("Update Error:", error);
            alert('에러가 발생했습니다.');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/users/${formData.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('회원이 삭제되었습니다.');
                if (onNavigate) onNavigate('adminDashboardNew');
            } else {
                alert('삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error("Delete Error:", error);
            alert('에러가 발생했습니다.');
        }
    };

    const handleBack = () => {
        if (onNavigate) onNavigate('adminDashboardNew');
    };

    return (
        <div className="member-edit-container">
            {/* Sidebar (Same as DashboardNew) */}
            <aside className="admin-sidebar-new">
                <div className="sidebar-logo-new">PDDP(가안)</div>
                <nav className="sidebar-menu-new">
                    <div 
                        className={`menu-item-new ${isMemberMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMemberMenuOpen(!isMemberMenuOpen)}
                    >
                        회원 관리
                        <svg 
                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: isMemberMenuOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
                        >
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </div>
                    {isMemberMenuOpen && (
                        <div className="submenu-list-new">
                            <div className="submenu-item-new active" onClick={() => onNavigate && onNavigate('adminDashboardNew')}>시민</div>
                            <div className="submenu-item-new" onClick={() => onNavigate && onNavigate('expertManagement')}>전문가</div>
                            <div className="submenu-item-new">관리자</div>
                        </div>
                    )}
                    <div 
                        className="menu-item-new"
                        onClick={() => {
                            setIsMemberMenuOpen(false);
                            onNavigate && onNavigate('proposalManagement');
                        }}
                    >
                        제안
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="member-edit-main">
                {/* Header (Same as DashboardNew) */}
                <header className="admin-header-new">
                    <div className="header-user-info">
                        <div className="user-avatar-circle">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                            </svg>
                        </div>
                        <span>홍길동님</span>
                    </div>
                    <button className="btn-logout-new" onClick={handleLogout}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        로그아웃
                    </button>
                </header>

                <div className="member-edit-content">
                    <div className="edit-form-header">
                        <h2 className="edit-form-title">회원관리</h2>
                    </div>

                    <div className="edit-form-box">
                        <div className="edit-form-row">
                            <label className="edit-form-label">회원이름</label>
                            <input 
                                type="text" 
                                className="edit-form-input" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="edit-form-row">
                            <label className="edit-form-label">닉네임</label>
                            <input 
                                type="text" 
                                className="edit-form-input" 
                                value={formData.nickname} 
                                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                            />
                        </div>
                        <div className="edit-form-row">
                            <label className="edit-form-label">연락처</label>
                            <input 
                                type="text" 
                                className="edit-form-input" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="edit-form-row">
                            <label className="edit-form-label">주소</label>
                            <input 
                                type="text" 
                                className="edit-form-input wide" 
                                value={formData.address} 
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                        <div className="edit-form-row">
                            <label className="edit-form-label">이메일</label>
                            <input 
                                type="text" 
                                className="edit-form-input" 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="edit-form-row">
                            <label className="edit-form-label">생년월일</label>
                            <input 
                                type="text" 
                                className="edit-form-input" 
                                value={formData.birth} 
                                onChange={(e) => setFormData({...formData, birth: e.target.value})}
                            />
                        </div>
                        <div className="edit-form-row">
                            <label className="edit-form-label">가입일</label>
                            <input 
                                type="text" 
                                className="edit-form-input" 
                                value={formData.joinDate || '2025.01.01'} 
                                readOnly
                            />
                        </div>
                        <div className="edit-form-row">
                            <label className="edit-form-label">최근 접속일</label>
                            <input 
                                type="text" 
                                className="edit-form-input" 
                                value={formData.lastLogin || '2025.01.01 15:00'} 
                                readOnly
                            />
                        </div>
                        <div className="edit-form-row">
                            <label className="edit-form-label">참여현황 리스트</label>
                            <div className="edit-form-input edit-form-text-only" style={{ display: 'flex', alignItems: 'center' }}>
                                제안 <span>&nbsp;4건</span>
                            </div>
                        </div>
                    </div>

                    <div className="edit-form-footer">
                        <button className="btn-delete-member" onClick={handleDelete}>회원삭제</button>
                        <button className="btn-confirm-edit" onClick={handleConfirm}>확인</button>
                    </div>
                </div>
            </main>
        </div>
    );
}
