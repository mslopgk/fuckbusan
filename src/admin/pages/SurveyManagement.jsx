import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';

const STATUS_CLASS = {
    작성중: 'draft',
    답변수집중: 'collecting',
    종료: 'closed',
};

export default function SurveyManagement({ onNavigate }) {
    const [surveys, setSurveys] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchSurveys = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${API_URL}/api/surveys/list`);
                if (res.ok) {
                    const data = await res.json();
                    setSurveys(data);
                }
            } catch (e) {
                console.error('Failed to fetch surveys:', e);
            }
        };
        fetchSurveys();
    }, []);

    const filtered = surveys.filter((s) => !search || (s.title || '').includes(search));
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const visible = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const handleNew = () => onNavigate && onNavigate('surveyEditor');
    const handleEdit = () => onNavigate && onNavigate('surveyEditor');
    const handleResults = () => onNavigate && onNavigate('surveyResults');

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyManagement">
            <div className="content-header-new">
                <h2 className="content-title-new">설문 목록</h2>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="total-count-text">전체 설문 <span>{filtered.length}건</span></div>
                    <button className="btn-search-new" style={{ padding: '0 24px', height: 40 }} onClick={handleNew}>
                        + 설문 생성
                    </button>
                </div>
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
                            <th style={{ width: '40%' }}>설문제목</th>
                            <th>작성자 ID</th>
                            <th>상태</th>
                            <th>답변</th>
                            <th>작성일</th>
                            <th>메뉴</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px 0', color: '#999' }}>
                                    등록된 설문이 없습니다.
                                </td>
                            </tr>
                        ) : visible.map((s) => (
                            <tr key={s.id}>
                                <td style={{ textAlign: 'left' }}>{s.title}</td>
                                <td>{s.author_id || '-'}</td>
                                <td>
                                    <span className={`status-badge ${STATUS_CLASS[s.status] || 'draft'}`}>
                                        {s.status || '작성중'}
                                    </span>
                                </td>
                                <td>{s.response_count ?? 0}</td>
                                <td>{s.created_at ? new Date(s.created_at).toLocaleString('ko-KR', { hour12: false }) : '-'}</td>
                                <td>
                                    <button className="pill-btn" onClick={handleEdit}>수정</button>
                                    <button className="pill-btn muted" onClick={handleResults}>결과</button>
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
