import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const fmtDateTime = (v) => (v ? String(v).replace('T', ' ').slice(0, 16) : '-');

// Figma 설문목록(302-29426): AI 대화형 설문 "응답" 관리
export default function SurveyManagement({ onNavigate }) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [regionSearch, setRegionSearch] = useState('');
    const [surveySearch, setSurveySearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;

    const fetchList = useCallback(async (currentPage = 1) => {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        try {
            const params = new URLSearchParams({ page: currentPage, size: itemsPerPage });
            if (regionSearch) params.set('region', regionSearch);
            if (surveySearch) params.set('q', surveySearch);
            const res = await fetch(`${API_BASE}/survey-chat/admin/list?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
                setTotal(data.total ?? (data.items || []).length);
            } else {
                setItems([]);
                setTotal(0);
            }
        } catch (e) {
            console.error('Failed to fetch survey responses:', e);
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [regionSearch, surveySearch, itemsPerPage]);

    useEffect(() => { fetchList(page); }, [page]);

    const handleSearch = () => {
        if (page === 1) fetchList(1);
        else setPage(1);
    };

    const handleEdit = (row) => onNavigate && onNavigate('surveyStatusDetail', row);

    const handleDelete = async (row) => {
        if (!window.confirm('해당 설문 응답을 삭제하시겠습니까?')) return;
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        try {
            const res = await fetch(`${API_BASE}/survey-chat/admin/${row.session_id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) fetchList(page);
            else alert('삭제 실패: ' + res.status);
        } catch (e) {
            alert('오류: ' + e.message);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyManagement">
            <div className="content-header-new">
                <h2 className="content-title-new" style={{ marginBottom: 0 }}>설문목록</h2>
                <div className="total-count-text">총 <span>{total}건</span></div>
            </div>

            <div className="search-box-new-col" style={{ marginTop: 20 }}>
                <div className="search-row">
                    <div className="search-label-new">지역검색</div>
                    <div className="search-input-wrapper-new">
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="지역을 입력해 주세요"
                            value={regionSearch}
                            onChange={(e) => setRegionSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{ paddingRight: 40 }}
                        />
                        <SearchIcon />
                    </div>
                </div>
                <div className="search-row">
                    <div className="search-label-new">설문검색</div>
                    <div className="search-input-wrapper-new" style={{ maxWidth: 'none' }}>
                        <input
                            type="text"
                            className="search-input-new"
                            placeholder="설문을 검색해주세요"
                            value={surveySearch}
                            onChange={(e) => setSurveySearch(e.target.value)}
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
                            <th>지역</th>
                            <th>수정</th>
                            <th>설문유형</th>
                            <th>메뉴</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: '40px 0', color: '#999' }}>불러오는 중…</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '40px 0', color: '#999' }}>등록된 설문 응답이 없습니다.</td></tr>
                        ) : items.map((row) => (
                            <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => handleEdit(row)}>
                                <td>{row.region || '-'}</td>
                                <td>{fmtDateTime(row.updated_at)}</td>
                                <td>{row.survey_type || '-'}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <div className="action-btns-new">
                                        <span className="btn-action-text" onClick={() => handleEdit(row)}>수정</span>
                                        <span style={{ color: '#ddd' }}>|</span>
                                        <span className="btn-action-text" onClick={() => handleDelete(row)}>삭제</span>
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
