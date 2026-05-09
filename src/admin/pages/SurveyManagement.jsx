import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

const STATUS_LABEL = {
    draft: '작성중',
    active: '답변수집중',
    result: '결과공개',
    closed: '종료',
};

export default function SurveyManagement({ onNavigate }) {
    const [surveys, setSurveys] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [openMenu, setOpenMenu] = useState(null);
    const itemsPerPage = 10;

    const fetchSurveys = async () => {
        try {
            const res = await fetch(`${API_BASE}/surveys/list`);
            if (res.ok) {
                const data = await res.json();
                setSurveys(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Failed to fetch surveys:', e);
        }
    };

    useEffect(() => {
        fetchSurveys();
    }, []);

    useEffect(() => {
        const handler = () => setOpenMenu(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const filtered = surveys.filter((s) => !search || (s.title || '').includes(search));
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const visible = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const handleNew = () => onNavigate && onNavigate('surveyEditor');
    const handleEdit = (s) => onNavigate && onNavigate('surveyEditor', s);
    const handleResults = (s) => onNavigate && onNavigate('surveyResults', s);

    const handleDelete = async (s) => {
        if (!window.confirm(`"${s.title}" 설문을 삭제하시겠습니까?`)) return;
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('관리자 로그인이 필요합니다.');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/surveys/admin/${s.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) fetchSurveys();
            else alert('삭제 실패: ' + res.status);
        } catch (e) {
            alert('오류: ' + e.message);
        }
    };

    const handleDuplicate = async (s) => {
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        try {
            const res = await fetch(`${API_BASE}/surveys/admin/${s.id}/duplicate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) fetchSurveys();
            else alert('복제 실패: ' + res.status);
        } catch (e) {
            alert('오류: ' + e.message);
        }
    };

    const handleRename = async (s) => {
        const newTitle = window.prompt('새 제목을 입력하세요', s.title);
        if (!newTitle || newTitle.trim() === s.title) return;
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        try {
            const res = await fetch(`${API_BASE}/surveys/admin/${s.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: newTitle.trim() }),
            });
            if (res.ok) fetchSurveys();
            else alert('이름 변경 실패: ' + res.status);
        } catch (e) {
            alert('오류: ' + e.message);
        }
    };

    const handleClose = async (s) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('관리자 로그인이 필요합니다.');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/surveys/admin/${s.id}/close`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) fetchSurveys();
            else alert('종료 실패: ' + res.status);
        } catch (e) {
            alert('오류: ' + e.message);
        }
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyManagement">
            <div className="content-header-new">
                <h2 className="content-title-new">설문</h2>
                <button className="btn-search-new" style={{ height: 50, padding: '0 20px', fontSize: 15 }} onClick={handleNew}>
                    + 새 설문 만들기
                </button>
            </div>

            <div className="search-box-new">
                <div className="search-label-new">설문검색</div>
                <div className="search-input-wrapper-new">
                    <input
                        type="text"
                        className="search-input-new"
                        placeholder="설문을 검색해주세요"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
                    />
                </div>
                <button className="btn-search-new" onClick={() => setPage(1)}>검색</button>
            </div>

            <div className="table-container-new">
                <table className="admin-table-new">
                    <thead>
                        <tr>
                            <th style={{ width: '38%', textAlign: 'left' }}>설문제목</th>
                            <th>작성자 ID</th>
                            <th>상태</th>
                            <th>답변</th>
                            <th>수정</th>
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
                                <td>{STATUS_LABEL[s.status] || s.status || '작성중'}</td>
                                <td>{s.response_count ?? 0}</td>
                                <td>
                                    <span style={{ marginRight: 8, color: '#555', fontSize: 13 }}>
                                        {s.updated_at ? String(s.updated_at).slice(0, 16).replace('T', ' ') : (s.period || '-')}
                                    </span>
                                    <button
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', verticalAlign: 'middle' }}
                                        title="편집"
                                        onClick={() => handleEdit(s)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                </td>
                                <td style={{ position: 'relative' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                        <button
                                            className="pill-btn"
                                            style={{ fontSize: 13, padding: '0 10px', height: 30 }}
                                            onClick={() => handleResults(s)}
                                        >결과</button>
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <button
                                                className="pill-btn"
                                                style={{ letterSpacing: 2, padding: '0 10px', height: 30 }}
                                                onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === s.id ? null : s.id); }}
                                            >···</button>
                                            {openMenu === s.id && (
                                                <div className="action-dropdown">
                                                    <div className="action-dropdown-item" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }}>권한</div>
                                                    <div className="action-dropdown-item" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); handleDuplicate(s); }}>사본 만들기</div>
                                                    <div className="action-dropdown-item" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); handleRename(s); }}>이름 변경</div>
                                                    <div className="action-dropdown-item" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); handleEdit(s); }}>상세정보</div>
                                                    <div className="action-dropdown-item" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }}>수정 이력</div>
                                                    {s.status === 'active' && (
                                                        <div className="action-dropdown-item" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); handleClose(s); }}>종료</div>
                                                    )}
                                                    <div className="action-dropdown-item danger" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); handleDelete(s); }}>휴지통으로 이동</div>
                                                </div>
                                            )}
                                        </div>
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
