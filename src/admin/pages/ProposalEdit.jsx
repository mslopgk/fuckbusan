import React, { useState } from 'react';
import '../styles/dashboard_new.css'; // Borrowing sidebar/header styles
import '../styles/proposal_edit.css';

export default function ProposalEdit({ proposal, onNavigate }) {
    const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
    
    // Default mock data if no proposal provided
    const [formData, setFormData] = useState(proposal || {
        title: '전기자전거 재고 불균형 해결 제안',
        type: '교통',
        description: '안녕하세요. 저는 부산 해운대구 학생입니다.\n지역 시간별 수요 편차로 대여소마다 전기자전거\n부족/과잉이 반복되며 자전거 없음, 반납 자리 없음,\n방치로 인한 보행공간 침해와 길막힘 문제가 발생\n되고 있습니다. 이에 운영 기상 데이터를 바탕으로',
        address: '부산 해운대구 해운대해변로 99',
        addressDetail: '1층 오른쪽 표지판 앞',
        authorId: '부산시민',
        authorNickname: '부산시민',
        createDate: '2025.01.01',
        editDate: '2025.01.01'
    });

    const [username, setUsername] = useState('관리자');

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            setUsername(JSON.parse(storedUser).username || '관리자');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        if (onNavigate) onNavigate('adminLoginNew');
    };

    const handleConfirm = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/reports/proposals/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category: formData.category,
                    title: formData.title,
                    content: formData.content,
                    region: formData.region,
                    detailed_address: formData.detailed_address,
                    files: formData.files || []
                }),
            });

            if (response.ok) {
                alert('제안이 수정되었습니다.');
                if (onNavigate) onNavigate('proposalManagement');
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
            const response = await fetch(`${API_URL}/api/reports/proposals/${formData.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('제안이 삭제되었습니다.');
                if (onNavigate) onNavigate('proposalManagement');
            } else {
                alert('삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error("Delete Error:", error);
            alert('에러가 발생했습니다.');
        }
    };

    const handleBack = () => {
        if (onNavigate) onNavigate('proposalManagement');
    };

    return (
        <div className="proposal-edit-container">
            {/* Sidebar */}
            <aside className="admin-sidebar-new">
                <div className="sidebar-logo-new">PDDP(가안)</div>
                <nav className="sidebar-menu-new">
                    <div 
                        className="menu-item-new" 
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
                            <div className="submenu-item-new" onClick={() => onNavigate && onNavigate('expertManagement')}>전문가</div>
                            <div className="submenu-item-new">관리자</div>
                        </div>
                    )}
                    <div className="menu-item-new active" onClick={handleBack}>제안</div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="proposal-edit-main">
                {/* Header */}
                <header className="admin-header-new">
                    <div className="header-user-info">
                        <div className="user-avatar-circle">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                            </svg>
                        </div>
                        <span>{username}님</span>
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

                <div className="proposal-edit-content">
                    <div className="pr-edit-header">
                        <h2 className="pr-edit-title">제안현황</h2>
                    </div>

                    <div className="pr-edit-form-box">
                        <div className="pr-edit-row">
                            <label className="pr-edit-label">제안제목</label>
                            <input 
                                type="text" 
                                className="pr-edit-input" 
                                style={{ maxWidth: '660px' }}
                                value={formData.title} 
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                            />
                        </div>
                        <div className="pr-edit-row">
                            <label className="pr-edit-label">유형</label>
                            <input 
                                type="text" 
                                className="pr-edit-input" 
                                value={formData.category} 
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            />
                        </div>
                        <div className="pr-edit-row">
                            <label className="pr-edit-label">자세한설명</label>
                            <textarea 
                                className="pr-edit-textarea" 
                                value={formData.content} 
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                            ></textarea>
                        </div>
                        <div className="pr-edit-row">
                            <label className="pr-edit-label">위치정보</label>
                            <div className="pr-location-group">
                                <input 
                                    type="text" 
                                    className="pr-edit-input location-main" 
                                    value={formData.region} 
                                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                                />
                                <input 
                                    type="text" 
                                    className="pr-edit-input location-detail" 
                                    value={formData.detailed_address} 
                                    onChange={(e) => setFormData({...formData, detailed_address: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="pr-edit-row">
                            <label className="pr-edit-label">첨부이미지파일</label>
                            <div className="pr-image-preview">
                                <img src="https://via.placeholder.com/120?text=Proposal+Image" alt="첨부 이미지" />
                            </div>
                        </div>
                        <div className="pr-edit-row">
                            <label className="pr-edit-label">작성자 닉네임</label>
                            <input 
                                type="text" 
                                className="pr-edit-input readonly" 
                                value={formData.nickname || '익명'} 
                                readOnly
                            />
                        </div>
                        <div className="pr-edit-row">
                            <label className="pr-edit-label">작성일</label>
                            <input 
                                type="text" 
                                className="pr-edit-input readonly" 
                                value={formData.created_at ? new Date(formData.created_at).toLocaleDateString() : '-'} 
                                readOnly
                            />
                        </div>
                        <div className="pr-edit-row">
                            <label className="pr-edit-label">편집일</label>
                            <input 
                                type="text" 
                                className="pr-edit-input readonly" 
                                value={formData.editDate} 
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="pr-edit-footer">
                        <button className="btn-pr-delete" onClick={handleDelete}>글 삭제</button>
                        <button className="btn-pr-confirm" onClick={handleConfirm}>확인</button>
                    </div>
                </div>
            </main>
        </div>
    );
}
