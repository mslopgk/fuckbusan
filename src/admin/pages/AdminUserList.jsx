import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

export default function AdminUserList({ onNavigate }) {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [inputVal, setInputVal] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;

    const fetchUsers = useCallback(async (q) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const url = `${API_BASE}/admin/users?limit=500${q ? `&q=${encodeURIComponent(q)}` : ''}`;
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(res.status);
            const data = await res.json();
            // 관리자 = district_code가 'admin'으로 지정된 회원
            const adminsOnly = data.filter((u) => u.district_code === 'admin');
            setUsers(adminsOnly.map((u) => ({
                id: u.user_id,
                name: u.name || '-',
                nickname: u.nickname || '-',
                phone: u.phone_num || '-',
                address: [u.address, u.detailed_address].filter(Boolean).join(' ') || '-',
                email: u.email || '-',
                district: u.district_code || '-',
                loginId: u.ID,
                approval: u.is_approved ? '승인' : '미승인',
                isSuperAdmin: !!u.is_super_admin,
                joinDate: u.created_at ? u.created_at.slice(0, 10) : '-',
            })));
            setPage(1);
        } catch (e) {
            console.error('Failed to fetch users:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(''); }, [fetchUsers]);

    const handleSearch = () => {
        setSearch(inputVal);
        fetchUsers(inputVal);
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`"${user.name}" 회원을 삭제하시겠습니까?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || '삭제에 실패했습니다.');
            }
        } catch (e) {
            alert('에러가 발생했습니다.');
        }
    };

    const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));
    const visible = users.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminUserList">
            <div className="content-header-new">
                <h2 className="content-title-new">회원관리 - 관리자</h2>
                <div className="total-count-text">전체 회원 <span>{users.length}명</span></div>
            </div>

            <div className="search-box-new">
                <div className="search-label-new">회원검색</div>
                <div className="search-input-wrapper-new">
                    <input
                        type="text"
                        className="search-input-new"
                        placeholder="이름을 입력해 주세요"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button className="btn-search-new" onClick={handleSearch}>검색</button>
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
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px 0', color: '#999' }}>불러오는 중...</td>
                            </tr>
                        ) : visible.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px 0', color: '#999' }}>회원이 없습니다.</td>
                            </tr>
                        ) : visible.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    {item.name}
                                    {item.isSuperAdmin && (
                                        <span className="super-admin-crown" title="슈퍼관리자">👑</span>
                                    )}
                                </td>
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
                                    {/* 슈퍼관리자는 DB 미저장 가상 계정 — 수정/삭제 불가 */}
                                    {item.isSuperAdmin ? (
                                        <span style={{ color: '#bbb', fontSize: 13 }}>—</span>
                                    ) : (
                                        <div className="action-btns-new">
                                            <span
                                                className="btn-action-text"
                                                onClick={() => onNavigate && onNavigate('memberEdit', item)}
                                            >
                                                수정
                                            </span>
                                            {' | '}
                                            <span
                                                className="btn-action-text"
                                                style={{ color: '#e53e3e' }}
                                                onClick={() => handleDelete(item)}
                                            >
                                                삭제
                                            </span>
                                        </div>
                                    )}
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
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                        const start = Math.max(1, Math.min(page - 4, totalPages - 9));
                        return start + i;
                    }).map((n) => (
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
