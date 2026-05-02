import React, { useState } from 'react';
import '../styles/dashboard_new.css'; // Borrowing sidebar/header styles
import '../styles/expert_edit.css';

export default function ExpertEdit({ member, onNavigate }) {
    const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(true);
    // Default mock data if no member provided
    const [formData, setFormData] = useState(member || {
        name: '홍길동 1',
        nickname: '부산시민1',
        phone: '010-1111-2222',
        address: '부산시 동래구 온천천로 285번길 28 104호',
        email: 'busan@naver.com',
        status: 'approved-orange',
        statusText: '승인',
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
                    district_code: formData.district_code || 'expert'
                }),
            });

            if (response.ok) {
                alert('전문가 정보가 수정되었습니다.');
                if (onNavigate) onNavigate('expertManagement');
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
                alert('전문가가 삭제되었습니다.');
                if (onNavigate) onNavigate('expertManagement');
            } else {
                alert('삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error("Delete Error:", error);
            alert('에러가 발생했습니다.');
        }
    };

    const handleBack = () => {
        if (onNavigate) onNavigate('expertManagement');
    };

    return (
        <div className="expert-edit-container">
            {/* Sidebar */}
            <aside className="admin-sidebar-new">
                <div className="sidebar-logo-new"><img src="/WDC.svg" alt="WDC" style={{ height: '32px', display: 'block' }} /></div>
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
                            <div className="submenu-item-new" onClick={() => onNavigate && onNavigate('adminDashboardNew')}>시민</div>
                            <div className="submenu-item-new active">전문가</div>
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
            <main className="expert-edit-main">
                {/* Header */}
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

                <div className="expert-edit-content">
                    <div className="ex-edit-header">
                        <h2 className="ex-edit-title">회원관리</h2>
                    </div>

                    <div className="ex-edit-form-box">
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">회원이름</label>
                            <input 
                                type="text" 
                                className="ex-edit-input" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">닉네임</label>
                            <input 
                                type="text" 
                                className="ex-edit-input" 
                                value={formData.nickname} 
                                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                            />
                        </div>
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">연락처</label>
                            <input 
                                type="text" 
                                className="ex-edit-input" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">주소</label>
                            <input 
                                type="text" 
                                className="ex-edit-input wide" 
                                value={formData.address} 
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">이메일</label>
                            <input 
                                type="text" 
                                className="ex-edit-input" 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">승인상태</label>
                            <div className="ex-edit-text-only">
                                <span className={`ex-status-display ${formData.status}`}>
                                    {formData.statusText || '승인'}
                                </span>
                            </div>
                        </div>
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">생년월일</label>
                            <input 
                                type="text" 
                                className="ex-edit-input" 
                                value={formData.birth} 
                                onChange={(e) => setFormData({...formData, birth: e.target.value})}
                            />
                        </div>
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">가입일</label>
                            <input 
                                type="text" 
                                className="ex-edit-input" 
                                value={formData.joinDate || '2025.01.01'} 
                                readOnly
                            />
                        </div>
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">최근 접속일</label>
                            <input 
                                type="text" 
                                className="ex-edit-input" 
                                value={formData.lastLogin || '2025.01.01 15:00'} 
                                readOnly
                            />
                        </div>
                        <div className="ex-edit-row">
                            <label className="ex-edit-label">참여현황 리스트</label>
                            <div className="ex-edit-input ex-edit-text-only" style={{ display: 'flex', alignItems: 'center' }}>
                                제안 <span>&nbsp;4건</span>
                            </div>
                        </div>
                    </div>

                    <div className="ex-edit-footer">
                        <button className="btn-ex-delete" onClick={handleDelete}>회원삭제</button>
                        <button className="btn-ex-confirm" onClick={handleConfirm}>확인</button>
                    </div>
                </div>
            </main>
        </div>
    );
}
