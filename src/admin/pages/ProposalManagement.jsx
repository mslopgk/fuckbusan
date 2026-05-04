import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';

const TYPE_CLASS = {
    교통: 'traffic',
    안전: 'safety',
    교육: 'education',
    환경: 'environment',
};

export default function ProposalManagement({ onNavigate }) {
    const [proposals, setProposals] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/api/reports/proposals`);
                if (response.ok) {
                    const data = await response.json();
                    setProposals(data);
                }
            } catch (error) {
                console.error('Failed to fetch proposals:', error);
            }
        };
        fetchProposals();
    }, []);

    const filtered = proposals.filter((p) => !search || (p.title || '').includes(search));
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const visible = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <AdminLayout onNavigate={onNavigate} currentView="proposalManagement">
            <div className="content-header-new">
                <h2 className="content-title-new">제안</h2>
                <div className="total-count-text">전체 제안 <span>{filtered.length}건</span></div>
            </div>

            <div className="search-box-new">
                <div className="search-label-new">제목</div>
                <div className="search-input-wrapper-new">
                    <input
                        type="text"
                        className="search-input-new"
                        placeholder="제목을 입력해 주세요"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn-search-new" onClick={() => setPage(1)}>검색</button>
            </div>

            <div className="table-container-new">
                <table className="admin-table-new">
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>제안 제목</th>
                            <th>유형</th>
                            <th>위치</th>
                            <th>작성자 ID</th>
                            <th>메뉴</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '40px 0', color: '#999' }}>
                                    등록된 제안이 없습니다.
                                </td>
                            </tr>
                        ) : visible.map((p) => (
                            <tr key={p.id}>
                                <td style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('adminProposalDetail', p)}>
                                    {p.title}
                                </td>
                                <td>
                                    <span className={`type-tag ${TYPE_CLASS[p.category] || ''}`}>{p.category || '-'}</span>
                                </td>
                                <td>{p.region || '-'}</td>
                                <td>{p.nickname || '-'}</td>
                                <td>
                                    <div className="action-btns-new">
                                        <span className="btn-action-text" onClick={() => onNavigate && onNavigate('adminProposalDetail', p)}>상세</span> | <span className="btn-action-text">삭제</span>
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
