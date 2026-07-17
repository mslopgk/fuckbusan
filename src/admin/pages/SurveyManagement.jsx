import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin_layout.css';
import '../styles/survey_admin.css';
import { API_BASE } from '../api';

// Figma 302:29426은 초 단위까지 표기 (2026-04-07 10:00:58)
const fmtDateTime = (v) => (v ? String(v).replace('T', ' ').slice(0, 19) : '-');

// 부산 16개 구·군 (설문 응답 지역 필터 — 문의사항 답변서 반영 기능)
const DISTRICTS = ['부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구'];

// Figma 설문_메인(302:29426): AI 대화형 설문 "응답" 관리
// * 응답자 컬럼·지역 드롭다운 필터는 문의사항 답변서 요구 반영분 (Figma 미표기, 기능 유지)
export default function SurveyManagement({ onNavigate }) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [region, setRegion] = useState('전체');
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;

    const fetchList = useCallback(async (currentPage = 1) => {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        try {
            const params = new URLSearchParams({ page: currentPage, size: itemsPerPage });
            if (region && region !== '전체') params.set('region', region);
            if (keyword) params.set('q', keyword);
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
    }, [region, keyword, itemsPerPage]);

    useEffect(() => { fetchList(page); }, [page]);

    useEffect(() => { setPage(1); fetchList(1); }, [region]);

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
            <div className="svm-page">
                <div className="svm-content">
                    <div className="svm-header">
                        <h2 className="svm-title">설문목록</h2>
                        <div className="svm-total">총 <b>{total}건</b></div>
                    </div>

                    <div className="svm-searchbox">
                        <div className="svm-search-row">
                            <label className="svm-search-label" htmlFor="svm-region">지역검색</label>
                            <select
                                id="svm-region"
                                className="svm-select"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                            >
                                <option value="전체">전체</option>
                                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="svm-search-row">
                            <label className="svm-search-label" htmlFor="svm-keyword">설문검색</label>
                            <div className="svm-input-wrap">
                                <input
                                    id="svm-keyword"
                                    type="text"
                                    className="svm-input"
                                    placeholder="응답자·설문유형으로 검색해주세요"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <img className="svm-input-icon" src="/figma-assets/admin/search_glass.png" alt="" />
                            </div>
                            <button className="svm-search-btn" onClick={handleSearch}>검색</button>
                        </div>
                    </div>

                    <table className="svm-table">
                        <colgroup>
                            <col style={{ width: 200 }} />
                            <col />
                            <col style={{ width: 290 }} />
                            <col style={{ width: 220 }} />
                            <col style={{ width: 160 }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>지역</th>
                                <th>응답자</th>
                                <th>수정</th>
                                <th>설문유형</th>
                                <th>메뉴</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="svm-row-empty"><td colSpan={5} style={{ height: 120, color: '#777' }}>불러오는 중…</td></tr>
                            ) : items.length === 0 ? (
                                <tr className="svm-row-empty"><td colSpan={5} style={{ height: 120, color: '#777' }}>등록된 설문 응답이 없습니다.</td></tr>
                            ) : items.map((row) => (
                                <tr key={row.id} onClick={() => handleEdit(row)}>
                                    <td>{row.region || '-'}</td>
                                    <td>{row.respondent || '비회원'}</td>
                                    <td className="svm-td-date">{fmtDateTime(row.updated_at)}</td>
                                    <td>{row.survey_type || '-'}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="svm-actions">
                                            <span className="svm-action-link" onClick={() => handleEdit(row)}>수정</span>
                                            <span className="svm-action-sep">|</span>
                                            <span className="svm-action-link" onClick={() => handleDelete(row)}>삭제</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="svm-pagination">
                        <button
                            className="svm-page-arrow"
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            aria-label="이전 페이지"
                        >
                            <img src="/figma-assets/admin/page_prev.png" alt="" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((n) => (
                            <span
                                key={n}
                                className={`svm-page-num ${page === n ? 'active' : ''}`}
                                onClick={() => setPage(n)}
                            >
                                {n}
                            </span>
                        ))}
                        <button
                            className="svm-page-arrow"
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            aria-label="다음 페이지"
                        >
                            <img src="/figma-assets/admin/page_next.png" alt="" />
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
