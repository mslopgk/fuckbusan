import React, { useState, useEffect } from 'react';
import '../styles/dashboard_new.css';

export default function DashboardNew({ onNavigate }) {
    const [activeSubMenu, setActiveSubMenu] = useState('citizen'); // 'citizen' active by default
    const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(true);
    const [memberData, setMemberData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [username, setUsername] = useState('관리자');
    
    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            setUsername(JSON.parse(storedUser).username || '관리자');
        }

        const fetchCitizens = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/api/users?user_type=general`);
                if (response.ok) {
                    const data = await response.json();
                    const formatted = data.map(u => ({
                        id: u.user_id,
                        name: u.name,
                        nickname: u.nickname || '-',
                        phone: u.phone_num || '-',
                        address: '-', // DB에 현재 주소 필드 없음
                        email: u.ID,
                        birth: '-',   // DB에 현재 생년월일 필드 없음
                        district_code: u.district_code
                    }));
                    setMemberData(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch citizens:", error);
            }
        };
        fetchCitizens();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        if (onNavigate) onNavigate('adminLoginNew');
    };

    return (
        <div className="admin-dashboard-new">
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
                            <div 
                                className={`submenu-item-new ${activeSubMenu === 'citizen' ? 'active' : ''}`}
                                onClick={() => setActiveSubMenu('citizen')}
                            >
                                시민
                            </div>
                            <div 
                                className={`submenu-item-new ${activeSubMenu === 'expert' ? 'active' : ''}`}
                                onClick={() => onNavigate && onNavigate('expertManagement')}
                            >
                                전문가
                            </div>
                            <div 
                                className={`submenu-item-new ${activeSubMenu === 'admin' ? 'active' : ''}`}
                                onClick={() => setActiveSubMenu('admin')}
                            >
                                관리자
                            </div>
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
            <main className="admin-main-new">
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

                <div className="admin-content-new">
                    <div className="content-header-new">
                        <h2 className="content-title-new">회원관리 - 시민</h2>
                        <div className="total-count-text">전체 회원 <span>{memberData.length}명</span></div>
                    </div>

                    {/* Search Box */}
                    <div className="search-box-new">
                        <div className="search-label-new">회원검색</div>
                        <div className="search-input-wrapper-new">
                            <input type="text" className="search-input-new" placeholder="이름을 입력해 주세요" />
                            <svg 
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} 
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <button className="btn-search-new">검색</button>
                    </div>

                    {/* Table Area */}
                    <div className="table-container-new">
                        <table className="admin-table-new">
                            <thead>
                                <tr>
                                    <th>회원이름</th>
                                    <th>닉네임</th>
                                    <th>연락처</th>
                                    <th>주소</th>
                                    <th>이메일</th>
                                    <th>생년월일</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {memberData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td className="nickname-cell">{item.nickname}</td>
                                        <td>{item.phone}</td>
                                        <td>{item.address}</td>
                                        <td>{item.email}</td>
                                        <td>{item.birth}</td>
                                        <td>
                                            <div className="action-btns-new">
                                                <span 
                                                    className="btn-action-text"
                                                    onClick={() => onNavigate && onNavigate('memberEdit', item)}
                                                >
                                                    수정
                                                </span> | <span className="btn-action-text">삭제</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="pagination-new">
                             <svg 
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                style={{ transform: 'rotate(180deg)', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                             >
                                <polyline points="9 18 15 12 9 6"></polyline>
                             </svg>
                             
                             {Array.from({ length: Math.ceil(memberData.length / itemsPerPage) }, (_, i) => i + 1).map(num => (
                                 <span 
                                    key={num} 
                                    className={`page-num-new ${currentPage === num ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(num)}
                                 >
                                    {num}
                                 </span>
                             ))}

                             <svg 
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ cursor: 'pointer', opacity: currentPage === Math.ceil(memberData.length / itemsPerPage) || memberData.length === 0 ? 0.3 : 1 }}
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(memberData.length / itemsPerPage), prev + 1))}
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
