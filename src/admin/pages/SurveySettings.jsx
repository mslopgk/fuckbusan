import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import './SurveySettings.css';
import { API_BASE } from '../api';

/* AI설문 설정 (문의사항 답변서 [1-1]/[2-2])
   - 주제 키워드: 인터뷰 엔진 질문 범위 제약 + 스피드버튼 연관 생성에 주입
   - 스피드버튼(빠른응답): 첫 턴/텍스트 턴에 노출되는 칩 목록·순서 관리 */

const auth = () => {
    const t = localStorage.getItem('access_token');
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };
};

// 순서 있는 태그 입력 (엔터/추가 → 칩, ×로 삭제, ↑↓로 순서)
function TagListEditor({ title, hint, placeholder, items, setItems, accent }) {
    const [draft, setDraft] = useState('');
    const add = () => {
        const v = draft.trim();
        if (!v || items.includes(v)) { setDraft(''); return; }
        setItems([...items, v]);
        setDraft('');
    };
    const remove = (i) => setItems(items.filter((_, idx) => idx !== i));
    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= items.length) return;
        const next = [...items];
        [next[i], next[j]] = [next[j], next[i]];
        setItems(next);
    };
    return (
        <div className="ss-card">
            <div className="ss-card-head">
                <h3>{title}</h3>
                <span className="ss-count">{items.length}개</span>
            </div>
            {hint && <p className="ss-hint">{hint}</p>}
            <div className="ss-input-row">
                <input
                    className="ss-input"
                    value={draft}
                    placeholder={placeholder}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                />
                <button type="button" className="ss-add-btn" style={{ background: accent }} onClick={add}>추가</button>
            </div>
            <ul className="ss-chips">
                {items.length === 0 && <li className="ss-empty">아직 등록된 항목이 없습니다.</li>}
                {items.map((it, i) => (
                    <li key={it} className="ss-chip" style={{ borderColor: accent }}>
                        <span className="ss-chip-order">{i + 1}</span>
                        <span className="ss-chip-label">{it}</span>
                        <span className="ss-chip-actions">
                            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로">↑</button>
                            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="아래로">↓</button>
                            <button type="button" className="ss-chip-x" onClick={() => remove(i)} aria-label="삭제">×</button>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function SurveySettings({ onNavigate }) {
    const [keywords, setKeywords] = useState([]);
    const [speedButtons, setSpeedButtons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState(null);
    const [err, setErr] = useState('');

    const load = useCallback(async () => {
        setLoading(true); setErr('');
        try {
            const res = await fetch(`${API_BASE}/survey-chat/admin/settings`, { headers: auth() });
            if (!res.ok) throw new Error(`불러오기 실패 (${res.status})`);
            const d = await res.json();
            setKeywords(d.keywords || []);
            setSpeedButtons(d.speed_buttons || []);
            setSavedAt(d.updated_at || null);
        } catch (e) { setErr(String(e.message || e)); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        setSaving(true); setErr('');
        try {
            const res = await fetch(`${API_BASE}/survey-chat/admin/settings`, {
                method: 'PUT', headers: auth(),
                body: JSON.stringify({ keywords, speed_buttons: speedButtons }),
            });
            if (!res.ok) throw new Error(`저장 실패 (${res.status})`);
            const d = await res.json();
            setKeywords(d.keywords || []);
            setSpeedButtons(d.speed_buttons || []);
            setSavedAt(d.updated_at || null);
        } catch (e) { setErr(String(e.message || e)); }
        finally { setSaving(false); }
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveySettings">
            <div className="content-header-new">
                <h2 className="content-title-new" style={{ marginBottom: 0 }}>AI설문 설정</h2>
                {savedAt && <div className="total-count-text">최근 저장 <span>{savedAt.replace('T', ' ').slice(0, 16)}</span></div>}
            </div>

            <p className="ss-lead">
                AI 대화형 설문의 <b>주제 키워드</b>와 <b>스피드버튼(빠른응답)</b>을 관리합니다.
                키워드는 인터뷰 질문 범위를 좁히고, 스피드버튼은 사용자에게 노출되는 빠른응답 칩으로 사용됩니다.
            </p>

            {loading ? (
                <div className="ss-loading">불러오는 중…</div>
            ) : (
                <>
                    <div className="ss-grid">
                        <TagListEditor
                            title="주제 키워드"
                            hint="예: ‘보행 안전’, ‘야간 조명’. 설정 시 이 범위에 맞춰 질문·빠른응답을 좁혀 출력합니다."
                            placeholder="키워드를 입력하고 Enter"
                            items={keywords}
                            setItems={setKeywords}
                            accent="#5B2EAB"
                        />
                        <TagListEditor
                            title="스피드버튼 (빠른응답)"
                            hint="사용자가 바로 누를 수 있는 빠른응답 칩. 위/아래로 순서를 조정하세요."
                            placeholder="빠른응답 문구를 입력하고 Enter"
                            items={speedButtons}
                            setItems={setSpeedButtons}
                            accent="#5B2EAB"
                        />
                    </div>

                    {err && <div className="ss-err">⚠️ {err}</div>}

                    <div className="ss-foot">
                        <button type="button" className="ss-reset" onClick={load} disabled={saving}>되돌리기</button>
                        <button type="button" className="ss-save" onClick={save} disabled={saving}>
                            {saving ? '저장 중…' : '저장하기'}
                        </button>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
