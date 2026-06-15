import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

export default function DashboardNew({ onNavigate }) {
    const [memberData, setMemberData] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchCitizens = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${API_BASE}/admin/users?limit=500`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (response.ok) {
                    const data = await response.json();
                    setMemberData(data.map((u) => ({
                        id: u.user_id,
                        name: u.name || '-',
                        nickname: u.nickname || '-',
                        phone: u.phone_num || '-',
                        address: u.district_code || '-',
                        email: u.ID,
                        joinedAt: u.created_at ? String(u.created_at).slice(0, 10) : '-',
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch citizens:', error);
            }
        };
        fetchCitizens();
    }, []);

    const handleDelete = async (item) => {
        if (!window.confirm(`"${item.name}" 회원을 삭제하시겠습니까?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/admin/users/${item.id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                setMemberData((prev) => prev.filter((u) => u.id !== item.id));
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || '삭제에 실패했습니다.');
            }
        } catch {
            alert('네트워크 오류가 발생했습니다.');
        }
    };

    const filtered = memberData.filter((m) => !search || m.name.includes(search));
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const visible = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminDashboardNew">
            <div className="content-header-new">
                <h2 className="content-title-new">회원관리 - 시민</h2>
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
                            <th>가입일</th>
                            <th>메뉴</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px 0', color: '#999' }}>
                                    등록된 시민이 없습니다.
                                </td>
                            </tr>
                        ) : visible.map((item) => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td className="nickname-cell">{item.nickname}</td>
                                <td>{item.phone}</td>
                                <td>{item.address}</td>
                                <td>{item.email}</td>
                                <td>{item.joinedAt}</td>
                                <td>
                                    <div className="action-btns-new">
                                        <span
                                            className="btn-action-text"
                                            onClick={() => onNavigate && onNavigate('memberEdit', item)}
                                        >
                                            수정
                                        </span> | <span className="btn-action-text" onClick={() => handleDelete(item)}>삭제</span>
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
