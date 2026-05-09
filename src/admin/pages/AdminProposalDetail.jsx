import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function AdminProposalDetail({ proposal, onNavigate }) {
    const [data, setData] = useState(proposal || null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!proposal?.id) return;
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        fetch(`${API_URL}/api/reports/proposals/${proposal.id}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((found) => {
                if (!found) return;
                setData({
                    id: found.id,
                    title: found.title,
                    type: found.category,
                    location: found.region,
                    detailedAddress: found.detailed_address,
                    content: found.content,
                    nickname: found.nickname,
                    author_id: found.user_id,
                    created_at: found.created_at,
                    updated_at: found.updated_at,
                    image: found.image,
                });
            })
            .catch((e) => console.error('Failed to fetch proposal detail:', e));
    }, [proposal?.id]);

    if (!data) {
        return (
            <AdminLayout onNavigate={onNavigate} currentView="adminProposalDetail">
                <div style={{ padding: 40, color: '#999' }}>제안 정보를 찾을 수 없습니다.</div>
            </AdminLayout>
        );
    }

    const handleDelete = async () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        try {
            const res = await fetch(`${API_URL}/api/admin/proposals/${data.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                alert('삭제되었습니다.');
                onNavigate && onNavigate('proposalManagement');
            } else {
                alert('삭제 실패: ' + res.status);
            }
        } catch (e) {
            alert('삭제 중 오류: ' + e.message);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            alert('수정 기능은 준비 중입니다.');
        } finally {
            setSaving(false);
        }
    };

    const createdAt = data.created_at ? String(data.created_at).slice(0, 10) : '-';
    const updatedAt = data.updated_at ? String(data.updated_at).slice(0, 10) : createdAt;

    return (
        <AdminLayout onNavigate={onNavigate} currentView="adminProposalDetail">
            <div className="content-header-new">
                <h2 className="content-title-new">제안현황</h2>
                <button
                    className="btn-search-new"
                    style={{ height: 40, padding: '0 24px', background: '#f1f3f5', color: '#333' }}
                    onClick={() => onNavigate && onNavigate('proposalManagement')}
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
                    <div className="rfd-input">{data.type || '-'}</div>
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
                        <div className="rfd-input">{data.location || '-'}</div>
                        <div className="rfd-input">{data.detailedAddress || '-'}</div>
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
                    <div className="rfd-input">{data.author_id ?? '-'}</div>
                </div>

                {/* 작성자 닉네임 */}
                <div className="rfd-row">
                    <span className="rfd-label">작성자 닉네임</span>
                    <div className="rfd-input">{data.nickname || '-'}</div>
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
