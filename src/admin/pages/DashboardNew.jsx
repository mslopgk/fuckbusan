import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

const GUGUN = ['부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구'];

export default function DashboardNew({ onNavigate }) {
    const [memberData, setMemberData] = useState([]);
    const [search, setSearch] = useState('');
    const [region, setRegion] = useState('');
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
                    // 시민 = 전문가/관리자(district_code)로 지정되지 않은 회원
                    const citizens = data.filter((u) => u.district_code !== 'expert' && u.district_code !== 'admin');
                    setMemberData(citizens.map((u) => ({
                        id: u.user_id,
                        name: u.name || '-',
                        loginId: u.ID || '-',
                        nickname: u.nickname || '-',
                        phone: u.phone_num || '-',
                        address: [u.address, u.detailed_address].filter(Boolean).join(' ') || '-',
                        district: u.district_code || '',
                        email: u.email || '-',
                        birth: u.birth_date || '-',
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

    const sq = search.trim().toLowerCase();
    const filtered = memberData.filter((m) =>
        (!sq || m.name.toLowerCase().includes(sq) || (m.nickname || '').toLowerCase().includes(sq) || (m.loginId || '').toLowerCase().includes(sq))
        && (!region || (m.district || '').includes(region) || (m.address || '').includes(region)));
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const visible = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminDashboardNew">
            <div className="admin-fixed-1300">
            <div className="content-header-new">
                <h2 className="content-title-new">회원관리 - 시민</h2>
                <div className="total-count-text">전체 회원 <span>{filtered.length}명</span></div>
            </div>

            <div className="search-box-new-col">
                <div className="search-row">
                    <div className="search-label-new">카테고리 선택</div>
                    <select
                        className="mgr-select"
                        value={region}
                        onChange={(e) => { setRegion(e.target.value); setPage(1); }}
                    >
                        <option value="">선택해주세요</option>
                        {GUGUN.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div className="search-row">
                    <div className="search-label-new">검색</div>
                    <div className="search-input-wrapper-new">
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="이름 또는 닉네임을 입력해 주세요"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
                        />
                        {/* Figma export 검색 아이콘 (302:27483, #bbb) */}
                        <img className="search-icon-img" src="/figma-assets/admin/search_glyph.png" alt="" />
                    </div>
                    <button className="btn-search-new btn-search-new--cyan" onClick={() => setPage(1)}>검색</button>
                </div>
            </div>

            <div className="table-container-new">
                <table className="admin-table-new">
                    <thead>
                        <tr>
                            {/* Figma 302:27449 컬럼 배분 (아이디 컬럼은 문서요구 추가분) */}
                            <th style={{ width: 110 }}>회원이름</th>
                            <th style={{ width: 115 }}>아이디</th>
                            <th style={{ width: 120 }}>닉네임</th>
                            <th style={{ width: 160 }}>연락처</th>
                            <th style={{ width: 315 }}>주소</th>
                            <th style={{ width: 180 }}>이메일</th>
                            <th style={{ width: 140 }}>생년월일</th>
                            <th style={{ width: 160 }}>메뉴</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '40px 0', color: '#999' }}>
                                    등록된 시민이 없습니다.
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
                                <td>{item.birth}</td>
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
