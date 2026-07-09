import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

export default function ProposalManagement({ onNavigate }) {
    const [proposals, setProposals] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [authorSearch, setAuthorSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;

    const fetchProposals = useCallback(async (currentPage = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams({ page: currentPage, size: itemsPerPage });
            const res = await fetch(`${API_BASE}/admin/proposals?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const filtered = data.filter((p) =>
                        (!search || (p.title || '').includes(search)) &&
                        (!authorSearch || (p.author || p.nickname || '').includes(authorSearch))
                    );
                    setTotal(filtered.length);
                    setProposals(filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
                } else {
                    const filtered = (data.items || []).filter((p) =>
                        (!search || (p.title || '').includes(search)) &&
                        (!authorSearch || (p.author || '').includes(authorSearch))
                    );
                    setTotal(data.total ?? filtered.length);
                    setProposals(filtered);
                }
                return;
            }
            // fallback
            const fb = await fetch(`${API_BASE}/reports/proposals`);
            if (fb.ok) {
                const arr = await fb.json();
                const filtered = arr.filter((p) =>
                    (!search || (p.title || '').includes(search)) &&
                    (!authorSearch || (p.nickname || '').includes(authorSearch))
                );
                setTotal(filtered.length);
                setProposals(filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
            }
        } catch (error) {
            console.error('Failed to fetch proposals:', error);
        } finally {
            setLoading(false);
        }
    }, [search, authorSearch, itemsPerPage]);

    useEffect(() => {
        fetchProposals(page);
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchProposals(1);
    };

    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

    return (
        <AdminLayout onNavigate={onNavigate} currentView="proposalManagement">
            <div className="content-header-new">
                <h2 className="content-title-new">제안</h2>
                <div className="total-count-text">전체 제안 <span>{total}건</span></div>
            </div>

            <div className="search-box-new-col">
                <div className="search-row">
                    <div className="search-label-new">회원검색</div>
                    <div className="search-input-wrapper-new">
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="이름을 입력해 주세요"
                            value={authorSearch}
                            onChange={(e) => setAuthorSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <SearchIcon />
                    </div>
                    <button className="btn-search-new" onClick={handleSearch}>검색</button>
                </div>
                <div className="search-row">
                    <div className="search-label-new">제목</div>
                    <div className="search-input-wrapper-new">
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="제목을 입력해 주세요"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <SearchIcon />
                    </div>
                </div>
            </div>

            <div className="table-container-new">
                <table className="admin-table-new">
                    <thead>
                        <tr>
                            <th style={{ width: '55%', textAlign: 'left' }}>제안 제목</th>
                            <th>작성자 ID</th>
                            <th>유형</th>
                            <th>위치</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: '40px 0', color: '#999' }}>불러오는 중…</td></tr>
                        ) : proposals.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '40px 0', color: '#999' }}>등록된 제안이 없습니다.</td></tr>
                        ) : proposals.map((p) => (
                            <tr
                                key={p.id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => onNavigate && onNavigate('adminProposalDetail', p)}
                            >
                                <td style={{ textAlign: 'left' }}>{p.title}</td>
                                <td>{p.author || p.nickname || '-'}</td>
                                <td>{p.category || '-'}</td>
                                <td>{p.region || '-'}</td>
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
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((n) => (
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
