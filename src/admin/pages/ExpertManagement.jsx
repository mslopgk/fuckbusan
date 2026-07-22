import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';
import { MEMBER_FIELD_OPTIONS, MEMBER_FIELD_GET } from './DashboardNew';

export default function ExpertManagement({ onNavigate }) {
    const [experts, setExperts] = useState([]);
    const [search, setSearch] = useState('');
    const [field, setField] = useState('전체');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchExperts = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${API_BASE}/admin/users?limit=500`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (response.ok) {
                    const data = await response.json();
                    // 전문가 = district_code가 'expert'로 지정된 회원
                    const expertsOnly = data.filter((u) => u.district_code === 'expert');
                    setExperts(expertsOnly.map((u) => ({
                        id: u.user_id,
                        name: u.name || '-',
                        loginId: u.ID || '-',
                        nickname: u.nickname || '-',
                        phone: u.phone_num || '-',
                        address: [u.address, u.detailed_address].filter(Boolean).join(' ') || '-',
                        email: u.email || '-',
                        approval: u.is_approved ? '승인' : '미승인',
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch experts:', error);
            }
        };
        fetchExperts();
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
                setExperts((prev) => prev.filter((u) => u.id !== item.id));
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || '삭제에 실패했습니다.');
            }
        } catch {
            alert('네트워크 오류가 발생했습니다.');
        }
    };

    // 카테고리 = 검색 대상 필드 (전체=모든 필드). 대소문자 무시.
    const sq = search.trim().toLowerCase();
    const getVals = MEMBER_FIELD_GET[field] || MEMBER_FIELD_GET['전체'];
    const filtered = experts.filter((e) => !sq
        || getVals(e).some((v) => (v || '').toString().toLowerCase().includes(sq)));
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const visible = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <AdminLayout onNavigate={onNavigate} currentView="expertManagement">
            <div className="admin-fixed-1300">
            <div className="content-header-new">
                <h2 className="content-title-new">회원관리 - 전문가</h2>
                <div className="total-count-text">전체 회원 <span>{filtered.length}명</span></div>
            </div>

            <div className="search-box-new-col">
                <div className="search-row">
                    <div className="search-label-new">카테고리 선택</div>
                    <select className="mgr-select" value={field} onChange={(e) => { setField(e.target.value); setPage(1); }}>
                        {MEMBER_FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div className="search-row">
                    <div className="search-label-new">검색</div>
                    <div className="search-input-wrapper-new">
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="이름·아이디·닉네임·연락처·주소·이메일로 검색"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
                        />
                        <img className="search-icon-img" src="/figma-assets/admin/search_glyph.png" alt="" />
                    </div>
                    <button className="btn-search-new btn-search-new--cyan" onClick={() => setPage(1)}>검색</button>
                </div>
            </div>

            <div className="table-container-new">
                <table className="admin-table-new">
                    <thead>
                        <tr>
                            {/* Figma 302:26797 컬럼 배분 (아이디 컬럼은 문서요구 추가분) */}
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
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '40px 0', color: '#999' }}>
                                    등록된 전문가가 없습니다.
                                </td>
                            </tr>
                        ) : visible.map((item) => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.loginId}</td>
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
                                        </span> | <span className="btn-action-text" onClick={() => handleDelete(item)}>삭제</span>
                                    </div>
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
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
