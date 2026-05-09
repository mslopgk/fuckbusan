import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

const STAGES = [
    { key: 'received', label: '접수', step: 1 },
    { key: 'reviewing', label: '검토중', step: 2 },
    { key: 'reviewed', label: '검토완료', step: 3 },
    { key: 'announced', label: '결과안내', step: 4 },
];

const STAGE_TO_STATUS = {
    received: '개선예정',
    reviewing: '개선중',
    reviewed: '개선중',
    announced: '개선완료',
};

export default function ReportDetail({ report, onNavigate }) {
    const [data, setData] = useState(report || null);
    const [reply, setReply] = useState('');
    const [stage, setStage] = useState('reviewing');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!report?.id) return;
        const fetchOne = async () => {
            try {
                const res = await fetch(`${API_BASE}/reports/${report.id}`);
                if (res.ok) {
                    const found = await res.json();
                    setData(found);
                    const stageMap = { 1: 'received', 2: 'reviewing', 3: 'reviewed', 4: 'announced' };
                    setStage(stageMap[found.progress_step] || 'reviewing');
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

    const handleDelete = async () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        try {
            const res = await fetch(`${API_BASE}/reports/${data.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                alert('삭제되었습니다.');
                onNavigate && onNavigate('reportManagement');
            } else {
                alert('삭제 실패: ' + res.status);
            }
        } catch (e) {
            alert('삭제 중 오류: ' + e.message);
        }
    };

    const handleStageClick = async (newStageKey) => {
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        const newStage = STAGES.find((s) => s.key === newStageKey);
        if (!newStage) return;
        try {
            const res = await fetch(`${API_BASE}/admin/reports/${data.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    status: STAGE_TO_STATUS[newStageKey],
                    progress_step: newStage.step,
                }),
            });
            if (res.ok) {
                setStage(newStageKey);
            } else {
                alert('상태 변경 실패: ' + res.status);
            }
        } catch (e) {
            alert('오류: ' + e.message);
        }
    };

    const handleSave = async () => {
        if (!reply.trim()) { alert('답변을 입력해주세요.'); return; }
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        setSaving(true);
        try {
            const res1 = await fetch(`${API_BASE}/admin/reports/${data.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    status: STAGE_TO_STATUS[stage],
                    progress_step: STAGES.find((s) => s.key === stage)?.step ?? 2,
                    result_details: {
                        body: reply.trim(),
                        date: new Date().toISOString().slice(0, 10),
                        manager: '관리자',
                    },
                }),
            });
            await fetch(`${API_BASE}/reports/${data.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: `[관리자 답변] ${reply.trim()}` }),
            });
            if (res1.ok) {
                setReply('');
                alert('수정되었습니다.');
            } else {
                alert('저장 실패: ' + res1.status);
            }
        } catch (e) {
            alert('오류: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const createdAt = data.date || (data.created_at ? String(data.created_at).slice(0, 10) : '-');
    const updatedAt = data.updated_at ? String(data.updated_at).slice(0, 10) : createdAt;

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminReportDetail">
            <div className="content-header-new">
                <h2 className="content-title-new">제보현황</h2>
                <button
                    className="btn-search-new"
                    style={{ height: 40, padding: '0 24px', background: '#f1f3f5', color: '#333' }}
                    onClick={() => onNavigate && onNavigate('reportManagement')}
                >
                    ← 목록으로
                </button>
            </div>

            <div className="rfd-body">
                {/* 제안제목 */}
                <div className="rfd-row">
                    <span className="rfd-label">제안제목</span>
                    <div className="rfd-input">{data.title || '-'}</div>
                </div>

                {/* 유형 */}
                <div className="rfd-row">
                    <span className="rfd-label">유형</span>
                    <div className="rfd-input">{data.category || data.type || '-'}</div>
                </div>

                {/* 자세한설명 */}
                <div className="rfd-row rfd-row--top">
                    <span className="rfd-label">자세한설명</span>
                    <div className="rfd-textarea">{data.content || '-'}</div>
                </div>

                {/* 위치정보 */}
                <div className="rfd-row">
                    <span className="rfd-label">위치정보</span>
                    <div className="rfd-location">
                        <div className="rfd-input">{data.region || data.location || '-'}</div>
                        <div className="rfd-input">{data.detailed_address || '-'}</div>
                    </div>
                </div>

                {/* 첨부이미지파일 */}
                <div className="rfd-row rfd-row--top">
                    <span className="rfd-label">첨부이미지파일</span>
                    <div className="rfd-attachments">
                        {data.image ? (
                            <img src={data.image} alt="첨부" className="rfd-thumb" />
                        ) : (
                            <div className="rfd-thumb-empty" />
                        )}
                    </div>
                </div>

                {/* 작성자 ID */}
                <div className="rfd-row">
                    <span className="rfd-label">작성자 ID</span>
                    <div className="rfd-input">{data.author_id ?? data.user_id ?? '-'}</div>
                </div>

                {/* 작성자 닉네임 */}
                <div className="rfd-row">
                    <span className="rfd-label">작성자 닉네임</span>
                    <div className="rfd-input">{data.nickname || data.author || '-'}</div>
                </div>

                {/* 작성일 */}
                <div className="rfd-row">
                    <span className="rfd-label">작성일</span>
                    <div className="rfd-input">{createdAt}</div>
                </div>

                {/* 편집일 */}
                <div className="rfd-row">
                    <span className="rfd-label">편집일</span>
                    <div className="rfd-input">{updatedAt}</div>
                </div>

                {/* 제보현황 */}
                <div className="rfd-row">
                    <span className="rfd-label">제보현황</span>
                    <div className="rfd-status-pills">
                        {STAGES.map((s) => (
                            <button
                                key={s.key}
                                className={`rfd-status-pill${stage === s.key ? ' active' : ''}`}
                                onClick={() => handleStageClick(s.key)}
                            >
                                <span className="rfd-pill-check">{stage === s.key ? '✓' : ''}</span>
                                {s.label}
                                <span className="rfd-pill-arrow">▾</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rfd-divider" />

            {/* 답글 작성 */}
            <div className="rfd-body">
                <div className="rfd-row rfd-row--top">
                    <span className="rfd-label">답글 작성</span>
                    <div className="rfd-reply-wrap">
                        <textarea
                            className="rfd-reply-textarea"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            rows={5}
                        />
                        <button
                            className="rfd-write-btn"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? '…' : '작성'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="rfd-divider" />

            {/* 하단 버튼 */}
            <div className="rfd-footer">
                <button className="rfd-delete-btn" onClick={handleDelete}>글 삭제</button>
                <button className="rfd-save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? '저장 중…' : '수정하기'}
                </button>
            </div>
        </AdminLayout>
    );
}
