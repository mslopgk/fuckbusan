import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import { API_BASE } from '../api';

export default function AdminProposalDetail({ proposal, onNavigate }) {
    const [data, setData] = useState(null);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!proposal?.id) return;
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        fetch(`${API_BASE}/reports/proposals/${proposal.id}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((found) => {
                if (!found) return;
                const mapped = {
                    id: found.id,
                    title: found.title,
                    category: found.category,
                    region: found.region,
                    detailed_address: found.detailed_address,
                    content: found.content,
                    nickname: found.nickname,
                    author_id: found.user_id,
                    created_at: found.created_at,
                    updated_at: found.updated_at,
                    image: found.files?.[0] || found.image || null,
                };
                setData(mapped);
                setForm({ ...mapped });
            })
            .catch((e) => console.error('Failed to fetch proposal detail:', e));
    }, [proposal?.id]);

    // Seed form from prop if fetch is slow
    useEffect(() => {
        if (!data && proposal) {
            const mapped = {
                id: proposal.id,
                title: proposal.title,
                category: proposal.category,
                region: proposal.region,
                detailed_address: proposal.detailed_address,
                content: proposal.content,
                nickname: proposal.author || proposal.nickname,
                author_id: proposal.user_id,
                created_at: proposal.created_at,
                updated_at: proposal.updated_at,
                image: null,
            };
            setData(mapped);
            setForm({ ...mapped });
        }
    }, [proposal]);

    if (!form) {
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
            const res = await fetch(`${API_BASE}/admin/proposals/${form.id}`, {
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
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/admin/proposals/${form.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: form.title,
                    category: form.category,
                    content: form.content,
                    region: form.region,
                    detailed_address: form.detailed_address,
                }),
            });
            if (res.ok) {
                setData({ ...form });
                alert('수정되었습니다.');
            } else {
                const err = await res.json().catch(() => ({}));
                alert('수정 실패: ' + (err.detail || res.status));
            }
        } catch (e) {
            alert('오류: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const createdAt = form.created_at ? String(form.created_at).slice(0, 10) : '-';
    const updatedAt = form.updated_at ? String(form.updated_at).slice(0, 10) : createdAt;

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
                <div className="rfd-row">
                    <span className="rfd-label">제안제목</span>
                    <input
                        className="rfd-input"
                        style={{ background: '#fff', border: '1px solid #d0d0d0', borderRadius: 6, padding: '0 10px', width: '100%' }}
                        value={form.title || ''}
                        onChange={set('title')}
                    />
                </div>

                <div className="rfd-row">
                    <span className="rfd-label">유형</span>
                    <input
                        className="rfd-input"
                        style={{ background: '#fff', border: '1px solid #d0d0d0', borderRadius: 6, padding: '0 10px' }}
                        value={form.category || ''}
                        onChange={set('category')}
                    />
                </div>

                <div className="rfd-row rfd-row--top">
                    <span className="rfd-label">자세한설명</span>
                    <textarea
                        className="rfd-textarea"
                        style={{ background: '#fff', border: '1px solid #d0d0d0', borderRadius: 6, padding: '10px', resize: 'vertical' }}
                        value={form.content || ''}
                        onChange={set('content')}
                        rows={6}
                    />
                </div>

                <div className="rfd-row">
                    <span className="rfd-label">위치정보</span>
                    <div className="rfd-location">
                        <input
                            className="rfd-input"
                            style={{ background: '#fff', border: '1px solid #d0d0d0', borderRadius: 6, padding: '0 10px' }}
                            value={form.region || ''}
                            onChange={set('region')}
                            placeholder="구/군"
                        />
                        <input
                            className="rfd-input"
                            style={{ background: '#fff', border: '1px solid #d0d0d0', borderRadius: 6, padding: '0 10px' }}
                            value={form.detailed_address || ''}
                            onChange={set('detailed_address')}
                            placeholder="상세 주소"
                        />
                    </div>
                </div>

                <div className="rfd-row rfd-row--top">
                    <span className="rfd-label">첨부이미지파일</span>
                    <div className="rfd-attachments">
                        {form.image ? (
                            <img src={form.image} alt="첨부" className="rfd-thumb" />
                        ) : (
                            <div className="rfd-thumb-empty" />
                        )}
                    </div>
                </div>

                <div className="rfd-row">
                    <span className="rfd-label">작성자 ID</span>
                    <div className="rfd-input">{form.author_id ?? '-'}</div>
                </div>

                <div className="rfd-row">
                    <span className="rfd-label">작성자 닉네임</span>
                    <div className="rfd-input">{form.nickname || '-'}</div>
                </div>

                <div className="rfd-row">
                    <span className="rfd-label">작성일</span>
                    <div className="rfd-input">{createdAt}</div>
                </div>

                <div className="rfd-row">
                    <span className="rfd-label">편집일</span>
                    <div className="rfd-input">{updatedAt}</div>
                </div>
            </div>

            <div className="rfd-divider" />

            <div className="rfd-footer">
                <button className="rfd-delete-btn" onClick={handleDelete}>글 삭제</button>
                <button className="rfd-save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? '저장 중…' : '수정하기'}
                </button>
            </div>
        </AdminLayout>
    );
}
