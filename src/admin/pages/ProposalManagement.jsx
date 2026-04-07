import React, { useState } from 'react';
import '../styles/dashboard_new.css'; // Borrowing sidebar/header styles
import '../styles/proposal_management.css';

export default function ProposalManagement({ onNavigate }) {
    const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false); // Collapsed by default when in Proposal view
    
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        if (onNavigate) onNavigate('adminLoginNew');
    };

    const [proposalData, setProposalData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [username, setUsername] = useState('관리자');

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            setUsername(JSON.parse(storedUser).username || '관리자');
        }

        const fetchProposals = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/api/reports/proposals`);
                if (response.ok) {
                    const data = await response.json();
                    setProposalData(data);
                }
            } catch (error) {
                console.error("Failed to fetch proposals:", error);
            }
        };
        fetchProposals();
    }, []);

    return (
        <div className="proposal-mgmt-container">
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
                    <div className="menu-item-new active">제안</div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="proposal-mgmt-main">
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

                <div className="proposal-mgmt-content">
                    <div className="proposal-mgmt-header">
                        <h2 className="proposal-mgmt-title">제안현황</h2>
                    </div>

                    {/* Table Area */}
                    <div className="proposal-table-container">
                        <table className="proposal-table">
                            <thead>
                                <tr>
                                    <th>제안제목</th>
                                    <th>유형</th>
                                    <th>위치</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proposalData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                                    <tr key={item.id} onClick={() => onNavigate && onNavigate('proposalEdit', item)} style={{ cursor: 'pointer' }}>
                                        <td>{item.title}</td>
                                        <td>{item.category}</td>
                                        <td>{item.region}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="proposal-pagination">
                             <svg 
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                style={{ transform: 'rotate(180deg)', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                             >
                                <polyline points="9 18 15 12 9 6"></polyline>
                             </svg>
                             
                             {Array.from({ length: Math.ceil(proposalData.length / itemsPerPage) }, (_, i) => i + 1).map(num => (
                                 <span 
                                    key={num} 
                                    className={`proposal-page-num ${currentPage === num ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(num)}
                                 >
                                    {num}
                                 </span>
                             ))}

                             <svg 
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ cursor: 'pointer', opacity: currentPage === Math.ceil(proposalData.length / itemsPerPage) || proposalData.length === 0 ? 0.3 : 1 }}
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(proposalData.length / itemsPerPage), prev + 1))}
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
