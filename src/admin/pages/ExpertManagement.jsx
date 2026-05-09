import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

export default function ExpertManagement({ onNavigate }) {
    const [experts, setExperts] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchExperts = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${API_BASE}/users?user_type=expert`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (response.ok) {
                    const data = await response.json();
                    setExperts(data.map((u, idx) => ({
                        id: u.user_id,
                        name: u.name,
                        nickname: u.nickname || '-',
                        phone: u.phone_num || '-',
                        address: u.address || u.location || '-',
                        email: u.ID,
                        approval: idx % 2 === 0 ? '승인' : '대기',
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch experts:', error);
            }
        };
        fetchExperts();
    }, []);

    const filtered = experts.filter((e) => !search || e.name.includes(search));
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const visible = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <AdminLayout onNavigate={onNavigate} currentView="expertManagement">
            <div className="content-header-new">
                <h2 className="content-title-new">회원관리 - 전문가</h2>
                <div className="total-count-text">전체 회원 <span>{filtered.length}명</span></div>
            </div>

            <div className="search-box-new">
                <div className="search-label-new">회원검색</div>
                <div className="search-input-wrapper-new">
                    <input
                        type="text"
                        className="search-input-new"
                        placeholder="이름을 입력해 주세요"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }}
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
                <button className="btn-search-new" onClick={() => setPage(1)}>검색</button>
            </div>

            <div className="table-container-new">
                <table className="admin-table-new">
                    <thead>
                        <tr>
                            <th>회원이름</th>
                            <th>닉네임</th>
                            <th>연락처</th>
                            <th>주소</th>
                            <th>이메일</th>
                            <th>승인상태</th>
                            <th>메뉴</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px 0', color: '#999' }}>
                                    등록된 전문가가 없습니다.
                                </td>
                            </tr>
                        ) : visible.map((item) => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td className="nickname-cell">{item.nickname}</td>
                                <td>{item.phone}</td>
                                <td>{item.address}</td>
                                <td>{item.email}</td>
                                <td>
                                    <span className={`approval-badge ${item.approval === '승인' ? 'approved' : 'pending'}`}>
                                        {item.approval}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-btns-new">
                                        <span
                                            className="btn-action-text"
                                            onClick={() => onNavigate && onNavigate('expertEdit', item)}
                                        >
                                            수정
                                        </span> | <span className="btn-action-text">삭제</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination-new">
                    <svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: 'rotate(180deg)', cursor: 'pointer', opacity: page === 1 ? 0.3 : 1 }}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <span
                            key={n}
                            className={`page-num-new ${page === n ? 'active' : ''}`}
                            onClick={() => setPage(n)}
                        >
                            {n}
                        </span>
                    ))}
                    <svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ cursor: 'pointer', opacity: page === totalPages ? 0.3 : 1 }}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </div>
            </div>
        </AdminLayout>
    );
}
