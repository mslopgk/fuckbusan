import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/report_propose_admin.css';
import { API_BASE } from '../api';

// Figma 302:27789 (제안_메인) — 회원검색(이름) + 제목 검색 2행 검색박스, 4컬럼 목록
export default function ProposalManagement({ onNavigate }) {
    const [proposals, setProposals] = useState([]);
    const [total, setTotal] = useState(0);
    const [authorKw, setAuthorKw] = useState('');
    const [titleKw, setTitleKw] = useState('');
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

            // 회원검색(작성자)·제목 검색 (클라이언트, 대소문자 무시 — 5개 목록 동일 방식)
            const aq = authorKw.trim().toLowerCase();
            const tq = titleKw.trim().toLowerCase();
            const match = (p) => (!aq || [p.author, p.author_name, p.nickname, p.author_id, p.loginId, p.email, p.phone]
                .some((v) => (v || '').toString().toLowerCase().includes(aq)))
                && (!tq || (p.title || '').toString().toLowerCase().includes(tq));

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
                const filtered = arr.filter(match);
                setTotal(filtered.length);
                setProposals(filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
            }
        } catch (error) {
            console.error('Failed to fetch proposals:', error);
        } finally {
            setLoading(false);
        }
    }, [authorKw, titleKw, itemsPerPage]);

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
            <div className="rpa-page">
                <h2 className="rpa-title">제안</h2>

                <div className="rpa-searchbox">
                    <div className="rpa-search-row">
                        <label className="rpa-search-label" htmlFor="rpa-proposal-author">회원검색</label>
                        <div className="rpa-search-input-wrap rpa-search-input-wrap--member">
                            <input
                                id="rpa-proposal-author"
                                type="text"
                                className="rpa-search-input"
                                placeholder="이름을 입력해 주세요"
                                value={authorKw}
                                onChange={(e) => setAuthorKw(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <img className="rpa-search-icon" src="/figma-assets/admin/rp_search.png" alt="" />
                        </div>
                    </div>
                    <div className="rpa-search-row">
                        <label className="rpa-search-label" htmlFor="rpa-proposal-title">제목</label>
                        <div className="rpa-search-input-wrap rpa-search-input-wrap--title">
                            <input
                                id="rpa-proposal-title"
                                type="text"
                                className="rpa-search-input"
                                placeholder="제목을 입력해 주세요"
                                value={titleKw}
                                onChange={(e) => setTitleKw(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <img className="rpa-search-icon" src="/figma-assets/admin/rp_search.png" alt="" />
                        </div>
                        <button className="rpa-search-btn" onClick={handleSearch}>검색</button>
                    </div>
                </div>

                <table className="rpa-table">
                    <colgroup>
                        <col className="rpa-col-title" />
                        <col className="rpa-col-id" />
                        <col className="rpa-col-cat" />
                        <col className="rpa-col-loc" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="rpa-cell-title">제안제목</th>
                            <th className="rpa-cell-id">작성자 ID</th>
                            <th className="rpa-cell-cat">유형</th>
                            <th className="rpa-cell-loc">위치</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td className="rpa-cell-empty" colSpan={4}>불러오는 중…</td></tr>
                        ) : proposals.length === 0 ? (
                            <tr><td className="rpa-cell-empty" colSpan={4}>등록된 제안이 없습니다.</td></tr>
                        ) : proposals.map((p) => (
                            <tr
                                key={p.id}
                                onClick={() => onNavigate && onNavigate('adminProposalDetail', p)}
                            >
                                <td className="rpa-cell-title">{p.title}</td>
                                <td className="rpa-cell-id">{p.author || p.nickname || '-'}</td>
                                <td className="rpa-cell-cat">{p.category || '-'}</td>
                                <td className="rpa-cell-loc">{p.region || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="rpa-pagination">
                    <button
                        type="button"
                        className="rpa-page-arrow"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-label="이전 페이지"
                    >
                        <img src="/figma-assets/admin/rp_page_prev.png" alt="" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((n) => (
                        <span
                            key={n}
                            className={`rpa-page-num ${page === n ? 'active' : ''}`}
                            onClick={() => setPage(n)}
                        >
                            {n}
                        </span>
                    ))}
                    <button
                        type="button"
                        className="rpa-page-arrow"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        aria-label="다음 페이지"
                    >
                        <img src="/figma-assets/admin/rp_page_next.png" alt="" />
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
