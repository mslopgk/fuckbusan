import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

export default function ReportManagement({ onNavigate }) {
    const [reports, setReports] = useState([]);
    const [search, setSearch] = useState('');
    const [authorSearch, setAuthorSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchReports = async () => {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const token = localStorage.getItem('access_token');
            try {
                let res = token
                    ? await fetch(`${API_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } })
                    : null;
                if (!res || !res.ok) {
                    res = await fetch(`${API_URL}/api/reports/full`);
                }
                if (res.ok) {
                    const data = await res.json();
                    setReports(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error('Failed to fetch reports:', e);
            }
        };
        fetchReports();
    }, []);

    const filtered = reports.filter((r) =>
        (!search || (r.title || '').includes(search)) &&
        (!authorSearch || (r.author || r.author_id || '').includes(authorSearch))
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const visible = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <AdminLayout onNavigate={onNavigate} currentView="reportManagement">
            <h2 className="content-title-new" style={{ marginBottom: 30 }}>제보</h2>

            <div className="search-box-new-col">
                <div className="search-row">
                    <div className="search-label-new">회원검색</div>
                    <div className="search-input-wrapper-new" style={{ maxWidth: 'none' }}>
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="이름을 입력해 주세요"
                            value={authorSearch}
                            onChange={(e) => setAuthorSearch(e.target.value)}
                            style={{ paddingRight: 40 }}
                        />
                        <SearchIcon />
                    </div>
                </div>
                <div className="search-row">
                    <div className="search-label-new">제목</div>
                    <div className="search-input-wrapper-new" style={{ maxWidth: 'none' }}>
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="제목을 입력해 주세요"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingRight: 40 }}
                        />
                        <SearchIcon />
                    </div>
                    <button className="btn-search-new" onClick={() => setPage(1)}>검색</button>
                </div>
            </div>

            <div className="table-container-new">
                <table className="admin-table-new">
                    <thead>
                        <tr>
                            <th style={{ width: '50%', textAlign: 'left' }}>제보 제목</th>
                            <th>작성자 ID</th>
                            <th>유형</th>
                            <th>위치</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '40px 0', color: '#999' }}>
                                    등록된 제보가 없습니다.
                                </td>
                            </tr>
                        ) : visible.map((r) => {
                            const cat = r.category || r.type;
                            const loc = r.region || r.location;
                            const author = r.author || r.author_id;
                            return (
                            <tr
                                key={r.id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => onNavigate && onNavigate('adminReportDetail', r)}
                            >
                                <td style={{ textAlign: 'left' }}>{r.title}</td>
                                <td>{author || '-'}</td>
                                <td>{cat || '-'}</td>
                                <td>{loc || '-'}</td>
                            </tr>
                            );
                        })}
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
