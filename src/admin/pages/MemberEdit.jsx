import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/member_edit.css';
import { API_BASE } from '../api';

const fmtDate = (v) => (v ? String(v).replace('T', ' ').slice(0, 10) : '-');
const fmtDateTime = (v) => (v ? String(v).replace('T', ' ').slice(0, 16) : '-');

export default function MemberEdit({ member, onNavigate }) {
    const [formData, setFormData] = useState(member || {});
    const [activity, setActivity] = useState({ proposals: [], reports: [], surveys: [] });
    const [open, setOpen] = useState({ proposals: true, reports: true, surveys: true });
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));
    const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

    // 상세/참여현황 최신 데이터 fetch (리스트가 안 넘겨준 필드 대비)
    useEffect(() => {
        const id = member?.id;
        if (!id) return;
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/admin/users/${id}`, { headers });
                if (res.ok) {
                    const u = await res.json();
                    setFormData({
                        id: u.user_id,
                        name: u.name || '',
                        loginId: u.ID || '',
                        nickname: u.nickname || '',
                        phone: u.phone_num || '',
                        address: [u.address, u.detailed_address].filter(Boolean).join(' '),
                        email: u.email || '',
                        birth: u.birth_date || '',
                        joinDate: fmtDate(u.created_at),
                        lastLogin: fmtDateTime(u.prev_login || u.last_login),
                    });
                }
            } catch (e) { console.error('Failed to fetch member:', e); }

            try {
                const res = await fetch(`${API_BASE}/admin/users/${id}/activity`, { headers });
                if (res.ok) setActivity(await res.json());
            } catch (e) { console.error('Failed to fetch activity:', e); }
        })();
    }, [member?.id]);

    const handleConfirm = async () => {
        if (!formData.id) { alert('회원 정보가 없습니다.'); return; }
        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/admin/users/${formData.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    nickname: formData.nickname || null,
                    phone_num: formData.phone || null,
                    email: formData.email || null,
                    address: formData.address || null,
                }),
            });
            if (res.ok) {
                alert('회원 정보가 수정되었습니다.');
                onNavigate && onNavigate('adminDashboardNew');
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || '수정에 실패했습니다.');
            }
        } catch (e) {
            alert('에러가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!formData.id) return;
        if (!window.confirm(`"${formData.name}"(${formData.loginId}) 님의 비밀번호를 임시 비밀번호로 초기화할까요?`)) return;
        setResetting(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/admin/users/${formData.id}/reset-password`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.temp_password) {
                alert(`임시 비밀번호가 발급되었습니다.\n\n아이디: ${formData.loginId}\n임시 비밀번호: ${data.temp_password}\n\n회원에게 직접 전달해주세요. (다시 확인할 수 없으니 지금 기록해두세요)`);
            } else {
                alert(data.detail || '비밀번호 초기화에 실패했습니다.');
            }
        } catch (e) {
            alert('에러가 발생했습니다.');
        } finally {
            setResetting(false);
        }
    };

    const handleDelete = async () => {
        if (!formData.id) return;
        if (!window.confirm(`"${formData.name}" 회원을 삭제하시겠습니까?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE}/admin/users/${formData.id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
                alert('회원이 삭제되었습니다.');
                onNavigate && onNavigate('adminDashboardNew');
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.detail || '삭제에 실패했습니다.');
            }
        } catch (e) {
            alert('에러가 발생했습니다.');
        }
    };

    const proposals = activity.proposals || [];
    const reports = activity.reports || [];
    const surveys = activity.surveys || [];

    return (
        <AdminLayout onNavigate={onNavigate} currentView="memberEdit">
            <div className="edit-form-header">
                <h2 className="edit-form-title">회원 정보</h2>
            </div>

            <div className="edit-form-box">
                <div className="edit-form-row">
                    <label className="edit-form-label">회원이름</label>
                    <input type="text" className="edit-form-input" value={formData.name || ''} readOnly />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">아이디</label>
                    <input type="text" className="edit-form-input" value={formData.loginId || ''} readOnly />
                    <button
                        type="button"
                        className="btn-pw-reset"
                        onClick={handleResetPassword}
                        disabled={resetting}
                    >
                        {resetting ? '초기화 중...' : '비밀번호 초기화'}
                    </button>
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">닉네임</label>
                    <input type="text" className="edit-form-input" value={formData.nickname || ''}
                        onChange={(e) => set('nickname', e.target.value)} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">연락처</label>
                    <input type="text" className="edit-form-input" value={formData.phone || ''}
                        onChange={(e) => set('phone', e.target.value)} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">주소</label>
                    <input type="text" className="edit-form-input wide" value={formData.address || ''}
                        onChange={(e) => set('address', e.target.value)} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">이메일</label>
                    <input type="text" className="edit-form-input" value={formData.email || ''}
                        onChange={(e) => set('email', e.target.value)} />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">생년월일</label>
                    <input type="text" className="edit-form-input" value={formData.birth || ''} readOnly />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">가입일</label>
                    <input type="text" className="edit-form-input" value={formData.joinDate || '-'} readOnly />
                </div>
                <div className="edit-form-row">
                    <label className="edit-form-label">최근 접속일</label>
                    <input type="text" className="edit-form-input" value={formData.lastLogin || '-'} readOnly />
                </div>

                {/* 참여현황 리스트 */}
                <div className="edit-form-row" style={{ alignItems: 'flex-start' }}>
                    <label className="edit-form-label">참여현황 리스트</label>
                    <div className="participation-wrap">
                        <ParticipationTable
                            title="제안" count={proposals.length} open={open.proposals} onToggle={() => toggle('proposals')}
                            head={['제안제목', '작성자 ID', '유형', '위치']}
                            rows={proposals.map((p) => [p.title, p.author_id, p.category, p.region])}
                        />
                        <ParticipationTable
                            title="제보" count={reports.length} open={open.reports} onToggle={() => toggle('reports')}
                            head={['제보제목', '작성자 ID', '유형', '위치']}
                            rows={reports.map((r) => [r.title, r.author_id, r.category, r.region])}
                        />
                        <ParticipationTable
                            variant="survey"
                            title="설문" count={surveys.length} open={open.surveys} onToggle={() => toggle('surveys')}
                            head={['설문제목', '작성자 ID', '상태', '답변', '수정', '메뉴']}
                            rows={surveys.map((s) => [s.title, s.author_id, s.status, s.answer_count, fmtDateTime(s.updated_at), '결과'])}
                        />
                    </div>
                </div>
            </div>

            <div className="edit-form-footer">
                <button className="btn-delete-member" onClick={handleDelete}>회원삭제</button>
                <button className="btn-confirm-edit" onClick={handleConfirm} disabled={saving}>
                    {saving ? '저장 중...' : '확인'}
                </button>
            </div>
        </AdminLayout>
    );
}

/* 참여현황 표 — Figma 302:27376 구조 (구분선 인셋 재현 위해 div 그리드) */
export function ParticipationTable({ title, count, head, rows, open, onToggle, variant }) {
    const colsClass = variant === 'survey' ? 'cols-survey' : 'cols-activity';
    const sepClass = variant === 'survey' ? 'ptable-sep full' : 'ptable-sep';
    return (
        <div className="participation-block">
            <div className="participation-caption participation-caption-toggle" onClick={onToggle}>
                <span>{title} <strong>{count}건</strong></span>
                {/* Figma export 섹션 셰브론 (302:26793) */}
                <img
                    className={`section-chevron ${open ? '' : 'closed'}`}
                    src="/figma-assets/admin/section_chevron.png"
                    alt=""
                />
            </div>
            {open && (
                <div className="ptable">
                    <div className={`ptable-row head ${colsClass}`}>
                        {head.map((h) => <div key={h}>{h}</div>)}
                    </div>
                    <div className={`${sepClass} strong`} />
                    {rows.length === 0 ? (
                        <div className="ptable-empty">내역이 없습니다.</div>
                    ) : rows.map((cells, i) => (
                        <div key={i}>
                            {i > 0 && <div className={sepClass} />}
                            <div className={`ptable-row ${colsClass}`}>
                                {cells.map((c, j) => (
                                    <div key={j} className={j === 0 ? 'ptable-title' : ''}>{c ?? '-'}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
