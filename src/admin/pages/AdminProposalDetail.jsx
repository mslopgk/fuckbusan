import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import ImageLightbox from '../../components/common/ImageLightbox';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/report_propose_admin.css';
import { API_BASE } from '../api';

// Figma 302:28015 (제안2 상세) — 좌 라벨(127) + 값 박스, 푸터 위 1px #aaaaaa 구분선
export default function AdminProposalDetail({ proposal, onNavigate }) {
    const [data, setData] = useState(null);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState(null);   // 확대해서 볼 이미지 URL (null이면 닫힘)

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
            <div className="rpa-page rpa-detail">
                <h2 className="rpa-title">제안현황</h2>
                <div className="rpa-detail-divider" />

                <div className="rpa-detail-body">
                    {/* 제안제목 */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">제안제목</span>
                        <input
                            className="rpa-dbox rpa-dbox--title"
                            value={form.title || ''}
                            onChange={set('title')}
                        />
                    </div>

                    {/* 유형 */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">유형</span>
                        <input
                            className="rpa-dbox"
                            value={form.category || ''}
                            onChange={set('category')}
                        />
                    </div>

                    {/* 자세한설명 */}
                    <div className="rpa-drow rpa-drow--top">
                        <span className="rpa-dlabel">자세한설명</span>
                        <textarea
                            className="rpa-ddesc rpa-ddesc--tight"
                            value={form.content || ''}
                            onChange={set('content')}
                        />
                    </div>

                    {/* 위치정보 */}
                    <div className="rpa-drow rpa-drow--loc">
                        <span className="rpa-dlabel">위치정보</span>
                        <div className="rpa-dlocation">
                            <input
                                className="rpa-dbox rpa-dbox--addr"
                                value={form.region || ''}
                                onChange={set('region')}
                                placeholder="구/군"
                            />
                            <input
                                className="rpa-dbox rpa-dbox--addr2"
                                value={form.detailed_address || ''}
                                onChange={set('detailed_address')}
                                placeholder="상세 주소"
                            />
                        </div>
                    </div>

                    {/* 첨부이미지파일 */}
                    <div className="rpa-drow rpa-drow--top rpa-drow--attach">
                        <span className="rpa-dlabel">첨부이미지파일</span>
                        {form.image ? (
                            <img
                                src={form.image}
                                alt="첨부"
                                className="rpa-dthumb rpa-dthumb--zoom"
                                onClick={() => setLightboxSrc(form.image)}
                                title="클릭하면 크게 볼 수 있습니다"
                            />
                        ) : (
                            <div className="rpa-dthumb-empty" />
                        )}
                    </div>

                    {/* 작성자 ID */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">작성자 ID</span>
                        <div className="rpa-dbox">{form.author_id ?? '-'}</div>
                    </div>

                    {/* 작성자 닉네임 */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">작성자 닉네임</span>
                        <div className="rpa-dbox">{form.nickname || '-'}</div>
                    </div>

                    {/* 작성일 */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">작성일</span>
                        <div className="rpa-dbox">{createdAt}</div>
                    </div>

                    {/* 편집일 — Figma 899 (작성일과 61 피치) */}
                    <div className="rpa-drow rpa-drow--edited-tight">
                        <span className="rpa-dlabel">편집일</span>
                        <div className="rpa-dbox">{updatedAt}</div>
                    </div>
                </div>

                {/* 푸터 위 구분선 + 하단 버튼 */}
                <div className="rpa-footer-divider" />
                <div className="rpa-detail-footer">
                    <button className="rpa-delete-btn" onClick={handleDelete}>글 삭제</button>
                    <button className="rpa-save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? '저장 중…' : '수정하기'}
                    </button>
                </div>
            </div>

            {lightboxSrc && (
                <ImageLightbox images={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            )}
        </AdminLayout>
    );
}
