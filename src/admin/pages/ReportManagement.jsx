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

// 제보 카테고리(유형) — MReportForm.jsx CATS와 동일 taxonomy
const CATEGORIES = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

export default function ReportManagement({ onNavigate }) {
    const [reports, setReports] = useState([]);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('전체');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;

    const fetchReports = useCallback(async (currentPage = 1) => {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        try {
            const params = new URLSearchParams({ page: currentPage, size: itemsPerPage });
            if (category && category !== '전체') params.set('category', category);

            const adminUrl = `${API_BASE}/admin/reports?${params}`;
            let res = token
                ? await fetch(adminUrl, { headers: { Authorization: `Bearer ${token}` } })
                : null;

            if (!res || !res.ok) {
                const fallbackParams = new URLSearchParams();
                if (category && category !== '전체') fallbackParams.set('category', category);
                res = await fetch(`${API_BASE}/reports/full?${fallbackParams}`);
            }

            if (res && res.ok) {
                const data = await res.json();
                // 키워드: 제목·작성자 통합 검색 (클라이언트)
                const match = (r) => !keyword
                    || (r.title || '').includes(keyword)
                    || (r.author || r.author_name || '').includes(keyword);
                if (Array.isArray(data)) {
                    const filtered = data.filter(match);
                    setTotal(filtered.length);
                    setReports(filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
                } else {
                    // 인증 admin endpoint: {items, total}
                    const filtered = (data.items || []).filter(match);
                    setTotal(data.total ?? filtered.length);
                    setReports(filtered);
                }
            }
        } catch (e) {
            console.error('Failed to fetch reports:', e);
        } finally {
            setLoading(false);
        }
    }, [category, keyword, itemsPerPage]);

    useEffect(() => {
        setPage(1);
        fetchReports(1);
    }, [category]);

    useEffect(() => {
        fetchReports(page);
    }, [page]);

    const handleSearch = () => {
        setPage(1);
        fetchReports(1);
    };

    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

    return (
        <AdminLayout onNavigate={onNavigate} currentView="reportManagement">
            <div className="content-header-new">
                <h2 className="content-title-new" style={{ marginBottom: 0 }}>제보</h2>
                <div className="total-count-text">전체 제보 <span>{total}건</span></div>
            </div>

            <div className="search-box-new-col" style={{ marginTop: 20 }}>
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
                            <th style={{ width: '55%', textAlign: 'left' }}>제보 제목</th>
                            <th>작성자 ID</th>
                            <th>유형</th>
                            <th>위치</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: '40px 0', color: '#999' }}>불러오는 중…</td></tr>
                        ) : reports.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '40px 0', color: '#999' }}>등록된 제보가 없습니다.</td></tr>
                        ) : reports.map((r) => (
                            <tr
                                key={r.id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => onNavigate && onNavigate('adminReportDetail', r)}
                            >
                                <td style={{ textAlign: 'left' }}>{r.title}</td>
                                <td>{r.author || '-'}</td>
                                <td>{r.category || '-'}</td>
                                <td>{r.region || '-'}</td>
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
                            onClick={(e) => { e.stopPropagation(); setPage(n); }}
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
