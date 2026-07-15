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

// 제안 카테고리(유형) — MProposalForm.jsx TYPES와 동일 taxonomy
const CATEGORIES = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

export default function ProposalManagement({ onNavigate }) {
    const [proposals, setProposals] = useState([]);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('전체');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;

    const fetchProposals = useCallback(async (currentPage = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams({ page: currentPage, size: itemsPerPage });
            if (category && category !== '전체') params.set('category', category);
            const res = await fetch(`${API_BASE}/admin/proposals?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            // 키워드: 제목·작성자 통합 검색 (클라이언트)
            const match = (p) => !keyword
                || (p.title || '').includes(keyword)
                || (p.author || p.nickname || '').includes(keyword);

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const filtered = data.filter(match);
                    setTotal(filtered.length);
                    setProposals(filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
                } else {
                    const filtered = (data.items || []).filter(match);
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
                    (category === '전체' || (p.category || '') === category) && match(p)
                );
                setTotal(filtered.length);
                setProposals(filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
            }
        } catch (error) {
            console.error('Failed to fetch proposals:', error);
        } finally {
            setLoading(false);
        }
    }, [category, keyword, itemsPerPage]);

    useEffect(() => {
        setPage(1);
        fetchProposals(1);
    }, [category]);

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
                    <div className="search-label-new search-label-fixed">카테고리 선택</div>
                    <select
                        className="search-select-new"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="전체">전체</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="search-row">
                    <div className="search-label-new search-label-fixed">검색</div>
                    <div className="search-input-wrapper-new" style={{ maxWidth: 'none' }}>
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="제목·작성자로 검색해주세요"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{ paddingRight: 40 }}
                        />
                        <SearchIcon />
                    </div>
                    <button className="btn-search-new" onClick={handleSearch}>검색</button>
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
