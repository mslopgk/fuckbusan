import React, { useState, useEffect } from 'react';
import '../styles/dashboard_new.css'; // Borrowing sidebar/header styles
import '../styles/expert_management.css';

export default function ExpertManagement({ onNavigate }) {
    const [activeSubMenu, setActiveSubMenu] = useState('expert');
    const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(true);
    const [expertData, setExpertData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [username, setUsername] = useState('관리자');

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            setUsername(JSON.parse(storedUser).username || '관리자');
        }

        const fetchExperts = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/api/users?user_type=expert`);
                if (response.ok) {
                    const data = await response.json();
                    const formatted = data.map(u => ({
                        id: u.user_id,
                        name: u.name,
                        nickname: u.nickname || '-',
                        phone: u.phone_num || '-',
                        address: '-', // DB에 현재 주소 필드 없음
                        email: u.ID,
                        status: 'pending-gray', // DB에 상태 필드 없으나 UI 호환 위해 기본값 설정
                        statusText: '대기',
                        district_code: u.district_code
                    }));
                    setExpertData(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch experts:", error);
            }
        };
        fetchExperts();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        if (onNavigate) onNavigate('adminLoginNew');
    };

    return (
        <div className="expert-mgmt-container">
            {/* Sidebar */}
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
                            <div className="submenu-item-new" onClick={() => onNavigate && onNavigate('adminDashboardNew')}>시민</div>
                            <div className={`submenu-item-new ${activeSubMenu === 'expert' ? 'active' : ''}`}>전문가</div>
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
            <main className="expert-mgmt-main">
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

                <div className="expert-mgmt-content">
                    <div className="expert-mgmt-header">
                        <h2 className="expert-mgmt-title">회원관리 - 전문가</h2>
                        <div className="expert-total-count">전체 회원 <span>{expertData.length}명</span></div>
                    </div>

                    {/* Search Box */}
                    <div className="expert-search-box">
                        <div className="expert-search-label">회원검색</div>
                        <div className="expert-search-input-wrapper">
                            <input type="text" className="expert-search-input" placeholder="이름을 입력해 주세요" />
                            <svg
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }}
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <button className="btn-expert-search">검색</button>
                    </div>

                    {/* Table Area */}
                    <div className="expert-table-container">
                        <table className="expert-table">
                            <thead>
                                <tr>
                                    <th>회원이름</th>
                                    <th>닉네임</th>
                                    <th>연락처</th>
                                    <th>주소</th>
                                    <th>이메일</th>
                                    <th>승인상태</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {expertData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td className="expert-nickname">{item.nickname}</td>
                                        <td>{item.phone}</td>
                                        <td>{item.address}</td>
                                        <td>{item.email}</td>
                                        <td>
                                            <span className={`status-label ${item.status}`}>
                                                {item.statusText}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="expert-action-btns">
                                                <span 
                                                    className="btn-expert-action"
                                                    onClick={() => onNavigate && onNavigate('expertEdit', item)}
                                                >
                                                    수정
                                                </span> | <span className="btn-expert-action">삭제</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="expert-pagination">
                            <svg 
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                style={{ transform: 'rotate(180deg)', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            
                            {Array.from({ length: Math.ceil(expertData.length / itemsPerPage) }, (_, i) => i + 1).map(num => (
                                <span 
                                    key={num} 
                                    className={`expert-page-num ${currentPage === num ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(num)}
                                >
                                    {num}
                                </span>
                            ))}

                            <svg 
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ cursor: 'pointer', opacity: currentPage === Math.ceil(expertData.length / itemsPerPage) || expertData.length === 0 ? 0.3 : 1 }}
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(expertData.length / itemsPerPage), prev + 1))}
                            >
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
