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

    const handleSearch = () => setPage(1);

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

    // 시민/전문가 목록과 동일하게 입력 즉시 클라이언트 필터
    // 통합검색: 등록된 모든 표시 필드로 매칭 (대소문자 무시) — 5개 목록 동일 방식
    const sq = inputVal.trim().toLowerCase();
    const filtered = users.filter((u) =>
        !sq || [u.name, u.loginId, u.nickname, u.phone, u.address, u.email]
            .some((v) => (v || '').toString().toLowerCase().includes(sq)));
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const visible = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // 슈퍼관리자(admin 계정) 열람 여부 — 타이틀 왕관 배지 (Figma 슈퍼관리자01 프레임)
    const isSuperViewer = (() => {
        try {
            return JSON.parse(localStorage.getItem('user_info') || '{}').loginId === 'admin';
        } catch {
            return false;
        }
    })();

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminUserList">
            <div className="admin-fixed-1300">
            <div className="content-header-new">
                <h2 className="content-title-new">
                    회원관리 - 관리자
                    {isSuperViewer && (
                        /* 슈퍼관리자 열람 시 왕관 배지 (Figma 302:27285/27286) */
                        <span className="title-crown-badge" title="슈퍼관리자">
                            <img src="/figma-assets/admin/crown_glyph.png" alt="슈퍼관리자" />
                        </span>
                    )}
                </h2>
                <div className="total-count-text">전체 회원 <span>{filtered.length}명</span></div>
            </div>

            <div className="search-box-new">
                <div className="search-label-new">회원검색</div>
                <div className="search-input-wrapper-new">
                    <input
                        type="text"
                        className="search-input-new"
                        placeholder="이름·아이디·닉네임·연락처·주소·이메일로 검색"
                        value={inputVal}
                        onChange={(e) => { setInputVal(e.target.value); setPage(1); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    {/* Figma export 검색 아이콘 (302:27293, #aaa) */}
                    <img className="search-icon-img" src="/figma-assets/admin/rp_search.png" alt="" />
                </div>
                <button className="btn-search-new" onClick={handleSearch}>검색</button>
            </div>

            <div className="table-container-new">
                <table className="admin-table-new">
                    <thead>
                        <tr>
                            {/* Figma 302:26971/27144 컬럼 배분 (아이디 컬럼은 문서요구 추가분) */}
                            <th style={{ width: 110 }}>회원이름</th>
                            <th style={{ width: 110 }}>아이디</th>
                            <th style={{ width: 115 }}>닉네임</th>
                            <th style={{ width: 150 }}>연락처</th>
                            <th style={{ width: 300 }}>주소</th>
                            <th style={{ width: 175 }}>이메일</th>
                            <th style={{ width: 180 }}>승인상태</th>
                            <th style={{ width: 160 }}>메뉴</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '40px 0', color: '#999' }}>불러오는 중...</td>
                            </tr>
                        ) : visible.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '40px 0', color: '#999' }}>회원이 없습니다.</td>
                            </tr>
                        ) : visible.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    {item.name}
                                    {item.isSuperAdmin && (
                                        <span className="super-admin-crown" title="슈퍼관리자">👑</span>
                                    )}
                                </td>
                                <td>{item.loginId || '-'}</td>
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
                    <button
                        type="button"
                        className={`page-arrow-new ${page === 1 ? 'disabled' : ''}`}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <img src="/figma-assets/admin/rp_page_prev.png" alt="이전" />
                    </button>
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
                    <button
                        type="button"
                        className={`page-arrow-new ${page === totalPages ? 'disabled' : ''}`}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        <img src="/figma-assets/admin/rp_page_next.png" alt="다음" />
                    </button>
                </div>
            </div>
            </div>
        </AdminLayout>
    );
}
