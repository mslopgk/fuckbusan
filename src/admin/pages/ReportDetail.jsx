import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/report_propose_admin.css';
import { API_BASE } from '../api';

// Figma 302:28083 (제보 상세) — 좌 라벨(127) + 값 박스, 제보현황 pill, 검토 의견 패널
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
    const [resultImage, setResultImage] = useState('');   // 개선 결과사진 (업로드된 URL)
    const [uploadingImg, setUploadingImg] = useState(false);
    const fileRef = useRef(null);

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
                    // 기존 결과 답변/사진이 있으면 로드해 이어서 수정 가능하게
                    const rd = found.result_details;
                    if (rd) {
                        setReply(rd.body || rd.content || '');
                        setResultImage(rd.image || '');
                    }
                }
            } catch (e) {
                console.error('Failed to fetch report detail:', e);
            }
        };
        fetchOne();
    }, [report?.id]);

    const handleResultImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImg(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch(`${API_BASE}/reports/upload`, { method: 'POST', body: form });
            if (res.ok) {
                const j = await res.json();
                setResultImage(j.url || '');
            } else {
                alert('사진 업로드에 실패했습니다.');
            }
        } catch (err) {
            alert('사진 업로드 중 오류: ' + err.message);
        } finally {
            setUploadingImg(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

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
                        // body(모바일 결과모달)와 content(PC 결과배너)가 서로 다른 키를 읽어
                        // 둘 다 채워줌 — content 누락 시 PC에서 결과 코멘트가 안 보이던 버그
                        body: reply.trim(),
                        content: reply.trim(),
                        image: resultImage || null,
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
            <div className="rpa-page rpa-detail">
                <h2 className="rpa-title">제보현황</h2>
                <div className="rpa-detail-divider" />

                <div className="rpa-detail-body">
                    {/* 제보제목 (Figma 라벨 '제안제목'은 제보 화면 오탈자 → 제보제목 유지) */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">제보제목</span>
                        <div className="rpa-dbox rpa-dbox--title">{data.title || '-'}</div>
                    </div>

                    {/* 유형 */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">유형</span>
                        <div className="rpa-dbox">{data.category || data.type || '-'}</div>
                    </div>

                    {/* 자세한설명 */}
                    <div className="rpa-drow rpa-drow--top">
                        <span className="rpa-dlabel">자세한설명</span>
                        <div className="rpa-ddesc">{data.content || '-'}</div>
                    </div>

                    {/* 위치정보 */}
                    <div className="rpa-drow rpa-drow--loc">
                        <span className="rpa-dlabel">위치정보</span>
                        <div className="rpa-dlocation">
                            <div className="rpa-dbox rpa-dbox--addr">{data.region || data.location || '-'}</div>
                            <div className="rpa-dbox rpa-dbox--addr2">{data.detailed_address || '-'}</div>
                        </div>
                    </div>

                    {/* 첨부이미지파일 */}
                    <div className="rpa-drow rpa-drow--top rpa-drow--attach">
                        <span className="rpa-dlabel">첨부이미지파일</span>
                        {data.image ? (
                            <img src={data.image} alt="첨부" className="rpa-dthumb" />
                        ) : (
                            <div className="rpa-dthumb-empty" />
                        )}
                    </div>

                    {/* 작성자 ID */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">작성자 ID</span>
                        <div className="rpa-dbox">{data.author_id ?? data.user_id ?? '-'}</div>
                    </div>

                    {/* 작성자 닉네임 */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">작성자 닉네임</span>
                        <div className="rpa-dbox">{data.nickname || data.author || '-'}</div>
                    </div>

                    {/* 작성일 */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">작성일</span>
                        <div className="rpa-dbox">{createdAt}</div>
                    </div>

                    {/* 편집일 */}
                    <div className="rpa-drow">
                        <span className="rpa-dlabel">편집일</span>
                        <div className="rpa-dbox">{updatedAt}</div>
                    </div>

                    {/* 제보현황 */}
                    <div className="rpa-drow rpa-drow--top rpa-drow--pills">
                        <span className="rpa-dlabel">제보현황</span>
                        <div className="rpa-pills">
                            {STAGES.map((s) => (
                                <button
                                    key={s.key}
                                    type="button"
                                    className={`rpa-pill${stage === s.key ? ' active' : ''}`}
                                    onClick={() => handleStageClick(s.key)}
                                >
                                    <span className="rpa-pill-check">
                                        <img
                                            src={stage === s.key
                                                ? '/figma-assets/admin/rp_pill_chevron_pink.png'
                                                : '/figma-assets/admin/rp_pill_chevron_gray.png'}
                                            alt=""
                                        />
                                    </span>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 검토 의견 — 결과 답변 + 결과사진 (결과안내(개선완료) 시 사용자 상세 결과보기에 노출) */}
                <div className="rpa-review">
                    <div className="rpa-review-row">
                        <span className="rpa-review-label">검토 의견</span>
                        <textarea
                            className="rpa-review-textarea"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                        />
                        <button
                            type="button"
                            className="rpa-review-write-btn"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? '…' : '작성'}
                        </button>
                    </div>
                    <div className="rpa-review-photos">
                        {resultImage && (
                            <div className="rpa-photo-tile">
                                <img src={resultImage} alt="개선 결과" className="rpa-photo" />
                                <button
                                    type="button"
                                    className="rpa-photo-remove"
                                    onClick={() => setResultImage('')}
                                    aria-label="결과사진 삭제"
                                >×</button>
                            </div>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleResultImageChange} />
                        <button
                            type="button"
                            className="rpa-photo-add"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploadingImg}
                            aria-label="결과사진 업로드"
                        >
                            {uploadingImg ? '…' : '+'}
                        </button>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="rpa-detail-footer">
                    <button className="rpa-delete-btn" onClick={handleDelete}>글 삭제</button>
                    <button className="rpa-save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? '저장 중…' : '수정하기'}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
