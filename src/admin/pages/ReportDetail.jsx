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

const STAGES = [
    { key: 'received', label: '접수' },
    { key: 'reviewing', label: '검토중' },
    { key: 'reviewed', label: '검토완료' },
    { key: 'announced', label: '결과안내' },
];

export default function ReportDetail({ report, onNavigate }) {
    const [data, setData] = useState(report || null);
    const [reply, setReply] = useState('');
    const [stage, setStage] = useState('reviewing');

    useEffect(() => {
        if (!report?.id) return;
        const fetchOne = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${API_URL}/api/reports/list`);
                if (res.ok) {
                    const list = await res.json();
                    const found = list.find((r) => r.id === report.id);
                    if (found) setData(found);
                }
            } catch (e) {
                console.error('Failed to fetch report detail:', e);
            }
        };
        fetchOne();
    }, [report?.id]);

    if (!data) {
        return (
            <AdminLayout onNavigate={onNavigate} currentView="adminReportDetail">
                <div style={{ padding: 40, color: '#999' }}>제보 정보를 찾을 수 없습니다.</div>
            </AdminLayout>
        );
    }

    const handleDelete = () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        alert('삭제 API 연결은 준비 중입니다.');
    };

    const handleSaveReply = () => {
        if (!reply.trim()) {
            alert('답변을 입력해주세요.');
            return;
        }
        alert('답변 저장 API 연결은 준비 중입니다.');
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminReportDetail">
            <div className="content-header-new">
                <h2 className="content-title-new">제보 상세</h2>
                <button
                    className="btn-search-new"
                    style={{ height: 40, padding: '0 24px', background: '#f1f3f5', color: '#333' }}
                    onClick={() => onNavigate && onNavigate('reportManagement')}
                >
                    ← 목록으로
                </button>
            </div>

            <div className="report-detail-grid">
                <section className="report-detail-card">
                    <div className="detail-row">
                        <span className="detail-label">제보 제목</span>
                        <span className="detail-value detail-title">{data.title}</span>
                    </div>
                    <div className="detail-row split">
                        <div>
                            <span className="detail-label">유형</span>
                            <span className={`type-tag ${TYPE_CLASS[data.type] || ''}`} style={{ marginLeft: 8 }}>{data.type || '-'}</span>
                        </div>
                        <div>
                            <span className="detail-label">위치정보</span>
                            <span className="detail-value" style={{ marginLeft: 8 }}>{data.location || '-'}</span>
                        </div>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">자세한 설명</span>
                        <div className="detail-content-block">{data.content || '-'}</div>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">첨부 이미지</span>
                        <div className="detail-attachments">
                            <div className="attachment-placeholder">첨부 파일 없음</div>
                        </div>
                    </div>
                </section>

                <aside className="report-detail-side">
                    <div className="side-card">
                        <div className="side-row"><span>작성자 ID</span><strong>{data.author_id || '-'}</strong></div>
                        <div className="side-row"><span>작성자 닉네임</span><strong>부산시민</strong></div>
                        <div className="side-row"><span>작성일</span><strong>{data.created_at ? data.created_at.slice(0, 10) : '-'}</strong></div>
                        <div className="side-row"><span>편집일</span><strong>-</strong></div>
                    </div>

                    <div className="side-card">
                        <div className="side-card-title">제보 현황</div>
                        <div className="stage-track">
                            {STAGES.map((s, i) => {
                                const stageIdx = STAGES.findIndex((x) => x.key === stage);
                                const reached = i <= stageIdx;
                                return (
                                    <div key={s.key} className={`stage-item ${reached ? 'reached' : ''}`} onClick={() => setStage(s.key)}>
                                        <div className="stage-dot">{i + 1}</div>
                                        <div className="stage-label">{s.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>

            <section className="report-reply-card">
                <div className="reply-header">
                    <strong>답변드립니다.</strong>
                    <span className="reply-meta">관리자 답변</span>
                </div>
                <textarea
                    className="reply-textarea"
                    placeholder="답글 작성..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={6}
                />
                <div className="reply-actions">
                    <button className="pill-btn muted" onClick={handleDelete}>글 삭제</button>
                    <button className="pill-btn" onClick={handleSaveReply}>작성</button>
                </div>
            </section>
        </AdminLayout>
    );
}
