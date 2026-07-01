import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/survey_editor.css';
import { API_BASE } from '../api';

const QTYPE_MAP = {
    short: 'text',
    radio: 'single',
    checkbox: 'multi',
    scale: 'scale',
    number: 'text',
};

const SERVER_TO_EDITOR = {
    text: 'short',
    single: 'radio',
    multi: 'checkbox',
    scale: 'scale',
};

const QUESTION_TYPES = [
    { value: 'radio',    label: '객관식 질문' },
    { value: 'checkbox', label: '체크박스' },
    { value: 'scale',    label: '선형배율' },
    { value: 'short',    label: '단답형' },
    { value: 'number',   label: '숫자' },
];

const DISTRICTS = ['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'];

let qidCounter = 1;

const newQuestion = (type = 'radio') => ({
    id: `q-${qidCounter++}`,
    type,
    title: '',
    options: type === 'radio' || type === 'checkbox' ? ['옵션 1'] : [],
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    minLabel: '',
    maxLabel: '',
    errorText: '',
    minSelect: '',
    maxSelect: '',
    exactSelect: '',
});

const newSection = () => ({
    id: `q-${qidCounter++}`,
    type: 'section',
    title: '',
    options: [],
    required: false,
    scaleMin: 1, scaleMax: 5, minLabel: '', maxLabel: '',
    errorText: '', minSelect: '', maxSelect: '', exactSelect: '',
});

const SVG = (p) => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', ...p });

const IconCopy     = () => <svg {...SVG({ width: 18, height: 18 })}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconTrash    = () => <svg {...SVG({ width: 18, height: 18 })}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>;
const IconMore     = () => <svg width="20" height="4" viewBox="0 0 20 4" fill="currentColor"><circle cx="2" cy="2" r="2" stroke="none"/><circle cx="10" cy="2" r="2" stroke="none"/><circle cx="18" cy="2" r="2" stroke="none"/></svg>;
const IconImage    = () => <svg {...SVG({ width: 22, height: 22 })}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconPlus     = () => <svg {...SVG({ width: 24, height: 24 })}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
const IconImport   = () => <svg {...SVG({ width: 22, height: 22 })}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconSection  = () => <svg {...SVG({ width: 22, height: 22 })}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconVideo    = () => <svg {...SVG({ width: 22, height: 22 })}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
const IconCalendar = () => <svg {...SVG({ width: 16, height: 16 })}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconClose    = () => <svg {...SVG({ width: 20, height: 20 })}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function SurveyEditor({ onNavigate, surveyData }) {
    const [tab, setTab] = useState('edit');
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([newQuestion('radio')]);
    const [surveyId, setSurveyId] = useState(null);

    const [region, setRegion] = useState('전체');
    const [ageRange, setAgeRange] = useState('만 12세 ~ 65세 이상까지');
    const [periodStart, setPeriodStart] = useState('2026-01-01');
    const [periodEnd, setPeriodEnd] = useState('2026-01-01');
    const [status, setStatus] = useState('draft');
    const [resultsPublic, setResultsPublic] = useState(true);
    const [rewardPublic, setRewardPublic] = useState(true);
    const [rewardOptionalPublic, setRewardOptionalPublic] = useState(true);
    const [requirePrivacy, setRequirePrivacy] = useState(true);
    const [saving, setSaving] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {
        if (!surveyData?.id) return;
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE}/surveys/${surveyData.id}`);
                if (!res.ok) return;
                const data = await res.json();
                setSurveyId(data.id);
                setTitle(data.title || '');
                if (data.period) {
                    const parts = data.period.split('~').map((s) => s.trim());
                    if (parts[0]) setPeriodStart(parts[0]);
                    if (parts[1]) setPeriodEnd(parts[1]);
                }
                if (data.status) setStatus(data.status === 'closed' ? 'ended' : data.status);
                if (Array.isArray(data.questions) && data.questions.length > 0) {
                    setQuestions(data.questions.map((q) => ({
                        id: `q-${qidCounter++}`,
                        type: SERVER_TO_EDITOR[q.qtype] || 'short',
                        title: q.text || '',
                        options: Array.isArray(q.options) ? q.options : [],
                        required: true,
                        scaleMin: 1, scaleMax: 5, minLabel: '', maxLabel: '',
                        errorText: '', minSelect: '', maxSelect: '', exactSelect: '',
                    })));
                }
            } catch (e) {
                console.error('Failed to load survey:', e);
            }
        };
        load();
    }, [surveyData?.id]);

    const updateQuestion = (id, patch) => setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    const removeQuestion = (id) => setQuestions((qs) => qs.filter((q) => q.id !== id));
    const duplicateQuestion = (id) => setQuestions((qs) => {
        const idx = qs.findIndex((q) => q.id === id);
        if (idx < 0) return qs;
        return [...qs.slice(0, idx + 1), { ...qs[idx], id: `q-${qidCounter++}` }, ...qs.slice(idx + 1)];
    });
    const addQuestion = () => setQuestions((qs) => [...qs, newQuestion('radio')]);
    const addSection  = () => setQuestions((qs) => [...qs, newSection()]);

    const updateOption = (qid, idx, value) => setQuestions((qs) =>
        qs.map((q) => q.id === qid ? { ...q, options: q.options.map((o, i) => (i === idx ? value : o)) } : q)
    );
    const addOption = (qid) => setQuestions((qs) =>
        qs.map((q) => q.id === qid ? { ...q, options: [...q.options, `옵션 ${q.options.length + 1}`] } : q)
    );
    const removeOption = (qid, idx) => setQuestions((qs) =>
        qs.map((q) => q.id === qid ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q)
    );
    const importQuestions = (newQs) =>
        setQuestions((qs) => [...qs, ...newQs.map((q) => ({ ...q, id: `q-${qidCounter++}` }))]);

    const handleSave = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) { alert('관리자 로그인이 필요합니다.'); return; }
        if (!title.trim()) { alert('제목을 입력해주세요.'); return; }
        const contentQs = questions.filter((q) => q.type !== 'section');
        const validQuestions = contentQs.filter((q) => q.title.trim());
        if (validQuestions.length === 0) { alert('질문을 1개 이상 입력해주세요.'); return; }
        const statusMap = { draft: 'active', scheduled: 'active', active: 'active', ended: 'closed' };
        const payload = {
            title: title.trim(),
            description: '',
            minutes: 10,
            status: statusMap[status] || 'active',
            period_start: periodStart ? `${periodStart}T00:00:00` : null,
            period_end: periodEnd ? `${periodEnd}T23:59:59` : null,
            questions: validQuestions.map((q, idx) => ({
                qtype: QTYPE_MAP[q.type] || 'single',
                text: q.title,
                options: (q.type === 'radio' || q.type === 'checkbox') ? q.options : [],
                order_no: idx,
            })),
        };
        setSaving(true);
        try {
            const url = surveyId
                ? `${API_BASE}/surveys/admin/${surveyId}`
                : `${API_BASE}/surveys/admin`;
            const res = await fetch(url, {
                method: surveyId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                onNavigate && onNavigate(surveyId ? 'surveyManagement' : 'surveyCreated');
            } else {
                const err = await res.text();
                alert(`설문 저장 실패: ${res.status}\n${err}`);
            }
        } catch (e) {
            alert(`오류: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyEditor">
            <div className="survey-editor-page">
                <div className="content-header-new">
                    <h2 className="content-title-new">{surveyId ? '설문 수정' : '설문 작성'}</h2>
                </div>

                <div className="survey-tabs">
                    <button className={`survey-tab ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}>편집</button>
                    <button className={`survey-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>설정</button>
                </div>

                {tab === 'edit' && (
                    <div className="survey-edit-layout">
                        <div className="survey-edit-pane">
                            <div className="se-qcard">
                                <div className="se-title-body">
                                    <div className="se-title-row">
                                        <label className="se-field-label">제목</label>
                                        <input
                                            className="se-title-input"
                                            placeholder="제목없는질문"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="se-title-row">
                                        <label className="se-field-label">질문</label>
                                        <div className="se-radio-row">
                                            <label className="se-radio"><input type="radio" name="dummy_q" defaultChecked readOnly/> 옵션</label>
                                            <label className="se-radio"><input type="radio" name="dummy_q" readOnly/> 옵션 1</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="se-qcard-footer">
                                    <button className="se-qcard-tool" title="복제"><IconCopy/></button>
                                    <button className="se-qcard-tool" title="삭제"><IconTrash/></button>
                                    <label className="se-qcard-required">
                                        필수
                                        <input type="checkbox" defaultChecked className="se-required-toggle" readOnly/>
                                    </label>
                                    <button className="se-qcard-tool" title="더보기"><IconMore/></button>
                                </div>
                            </div>

                            {questions.map((q) =>
                                q.type === 'section'
                                    ? <SectionCard
                                        key={q.id}
                                        section={q}
                                        onUpdate={(patch) => updateQuestion(q.id, patch)}
                                        onRemove={() => removeQuestion(q.id)}
                                      />
                                    : <QuestionCard
                                        key={q.id}
                                        question={q}
                                        onUpdate={(patch) => updateQuestion(q.id, patch)}
                                        onRemove={() => removeQuestion(q.id)}
                                        onDuplicate={() => duplicateQuestion(q.id)}
                                        onUpdateOption={(idx, val) => updateOption(q.id, idx, val)}
                                        onAddOption={() => addOption(q.id)}
                                        onRemoveOption={(idx) => removeOption(q.id, idx)}
                                      />
                            )}

                            <button className="se-confirm-btn" onClick={handleSave} disabled={saving}>
                                {saving ? '저장 중…' : (surveyId ? '수정 완료' : '확인')}
                            </button>
                        </div>

                        <aside className="se-toolbar">
                            <button className="se-tool-btn" onClick={addQuestion} title="질문 추가하기">
                                <IconPlus/><span>질문 추가하기</span>
                            </button>
                            <hr className="se-tool-divider"/>
                            <button className="se-tool-btn" onClick={() => setImportOpen(true)} title="질문 가져오기">
                                <IconImport/><span>질문 가져오기</span>
                            </button>
                            <hr className="se-tool-divider"/>
                            <button className="se-tool-btn" title="내용 추가하기">
                                <IconImage/><span>내용 추가하기</span>
                            </button>
                            <hr className="se-tool-divider"/>
                            <button className="se-tool-btn" title="내용 추가하기">
                                <IconVideo/><span>내용 추가하기</span>
                            </button>
                            <hr className="se-tool-divider"/>
                            <button className="se-tool-btn" onClick={addSection} title="섹션추가하기">
                                <IconSection/><span>섹션추가하기</span>
                            </button>
                        </aside>
                    </div>
                )}

                {tab === 'settings' && (
                    <div className="survey-settings-flat">
                        <div className="se-srow">
                            <label>설문대상</label>
                            <select className="se-select" value={region} onChange={(e) => setRegion(e.target.value)}>
                                <option>지역(선택)/전체 16개 구군</option>
                                <option>전체</option>
                                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="se-srow">
                            <label>나이선택</label>
                            <select className="se-select" value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                                <option>만 12세 ~ 65세 이상까지</option>
                                <option>만 19세 이상</option>
                                <option>만 6세 ~ 18세</option>
                            </select>
                        </div>
                        <div className="se-srow">
                            <label>기간 설정</label>
                            <div className="se-date-row">
                                <div className="se-date-wrap">
                                    <input type="date" className="se-date-input" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}/>
                                    <span className="se-date-icon"><IconCalendar/></span>
                                </div>
                                <span className="se-date-sep">~</span>
                                <div className="se-date-wrap">
                                    <input type="date" className="se-date-input" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}/>
                                    <span className="se-date-icon"><IconCalendar/></span>
                                </div>
                            </div>
                        </div>
                        <div className="se-srow">
                            <label>설문 상태 관리</label>
                            <div className="se-radios">
                                {[
                                    { v: 'draft',     l: '임시저장' },
                                    { v: 'scheduled', l: '설문예정' },
                                    { v: 'active',    l: '설문진행' },
                                    { v: 'ended',     l: '설문종료' },
                                ].map((s) => (
                                    <label key={s.v} className="se-radio">
                                        <input type="radio" name="status" checked={status === s.v} onChange={() => setStatus(s.v)}/>
                                        {s.l}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <PublicRow label="설문 결과 공개 (선택)" value={resultsPublic} onChange={setResultsPublic}/>
                        <PublicRow label="리워드 제공 (선택)" value={rewardPublic} onChange={setRewardPublic}/>
                        <PublicRow label="리워드는 선택사항 제공 (선택)" value={rewardOptionalPublic} onChange={setRewardOptionalPublic}/>
                        <PublicRow label="제안정보 동의 필수 여부 (선택)" value={requirePrivacy} onChange={setRequirePrivacy}/>
                        <div className="se-save-wrap">
                            <button className="se-save-btn" onClick={handleSave} disabled={saving}>
                                {saving ? '저장 중…' : '저장'}
                            </button>
                        </div>
                    </div>
                )}

                {importOpen && (
                    <ImportModal
                        onClose={() => setImportOpen(false)}
                        onImport={(qs) => { importQuestions(qs); setImportOpen(false); }}
                    />
                )}
            </div>
        </AdminLayout>
    );
}

function PublicRow({ label, value, onChange }) {
    return (
        <div className="se-srow">
            <label>{label}</label>
            <div className="se-radios">
                <label className="se-radio"><input type="radio" name={label} checked={value} onChange={() => onChange(true)}/> 공개</label>
                <label className="se-radio"><input type="radio" name={label} checked={!value} onChange={() => onChange(false)}/> 비공개</label>
            </div>
        </div>
    );
}

function SectionCard({ section, onUpdate, onRemove }) {
    return (
        <div className="se-section-card">
            <div className="se-section-icon"><IconSection/></div>
            <input
                className="se-section-input"
                placeholder="섹션 제목 (선택사항)"
                value={section.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
            />
            <button className="se-qcard-tool" onClick={onRemove} title="섹션 삭제"><IconTrash/></button>
        </div>
    );
}

function QuestionCard({ question, onUpdate, onRemove, onDuplicate, onUpdateOption, onAddOption, onRemoveOption }) {
    const showOptions = question.type === 'radio' || question.type === 'checkbox';

    return (
        <div className="se-qcard">
            <div className="se-qcard-header">
                <label className="se-field-label">제목</label>
                <input
                    className="se-qcard-title-input"
                    placeholder="제목"
                    value={question.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                />
                <button className="se-qcard-img" title="이미지 추가"><IconImage/></button>
                <select
                    className="se-qtype-select"
                    value={question.type}
                    onChange={(e) => onUpdate({ type: e.target.value })}
                >
                    {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>

            <div className="se-qcard-body">
                {(question.type === 'short' || question.type === 'number') && (
                    <input
                        className="se-body-preview"
                        placeholder={question.type === 'short' ? '단답형 텍스트' : '숫자'}
                        disabled
                    />
                )}

                {showOptions && (
                    <div className="se-options">
                        {question.options.map((opt, i) => (
                            <div key={i} className="se-option-row">
                                {question.type === 'radio'
                                    ? <input type="radio" disabled className="se-opt-marker"/>
                                    : <input type="checkbox" disabled className="se-opt-marker"/>
                                }
                                <input
                                    className="se-option-input"
                                    value={opt}
                                    onChange={(e) => onUpdateOption(i, e.target.value)}
                                />
                                <button className="se-qcard-tool" onClick={() => onRemoveOption(i)} title="옵션 삭제">
                                    <IconTrash/>
                                </button>
                            </div>
                        ))}
                        <div className="se-add-option-row">
                            {question.type === 'radio'
                                ? <input type="radio" disabled className="se-opt-marker"/>
                                : <input type="checkbox" disabled className="se-opt-marker"/>
                            }
                            <button className="se-add-option-btn" onClick={onAddOption}>
                                옵션 <span className="se-add-link">추가 또는 '기타' 추가</span>
                            </button>
                        </div>

                        {question.type === 'checkbox' && (
                            <div className="se-checkbox-meta">
                                <select
                                    className="se-meta-select"
                                    value={question.minSelect}
                                    onChange={(e) => onUpdate({ minSelect: e.target.value })}
                                >
                                    <option value="">최소 선택 개수</option>
                                    <option value="min">최소 선택 개수</option>
                                    <option value="max">최대 선택 개수</option>
                                    <option value="exact">정확한 선택 개수</option>
                                </select>
                                <input
                                    className="se-meta-input se-meta-input-sm"
                                    placeholder="숫자"
                                    value={question.maxSelect}
                                    onChange={(e) => onUpdate({ maxSelect: e.target.value })}
                                />
                                <input
                                    className="se-meta-input"
                                    placeholder="맞춤 오류 텍스트"
                                    value={question.errorText}
                                    onChange={(e) => onUpdate({ errorText: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                )}

                {question.type === 'scale' && (
                    <div className="se-scale">
                        <div className="se-scale-range">
                            <select
                                className="se-meta-select se-meta-select-sm"
                                value={question.scaleMin}
                                onChange={(e) => onUpdate({ scaleMin: +e.target.value })}
                            >
                                {[0, 1].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <span className="se-scale-tilde">~</span>
                            <select
                                className="se-meta-select se-meta-select-sm"
                                value={question.scaleMax}
                                onChange={(e) => onUpdate({ scaleMax: +e.target.value })}
                            >
                                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="se-scale-labels">
                            <div className="se-scale-label-row">
                                <span className="se-scale-num">{question.scaleMin}</span>
                                <input className="se-meta-input" placeholder="라벨(선택사항)" value={question.minLabel} onChange={(e) => onUpdate({ minLabel: e.target.value })}/>
                                <input className="se-meta-input" placeholder="맞춤 오류 텍스트" value={question.errorText} onChange={(e) => onUpdate({ errorText: e.target.value })}/>
                            </div>
                            <div className="se-scale-label-row">
                                <span className="se-scale-num">{question.scaleMax}</span>
                                <input className="se-meta-input" placeholder="라벨(선택사항)" value={question.maxLabel} onChange={(e) => onUpdate({ maxLabel: e.target.value })}/>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="se-qcard-footer">
                <button className="se-qcard-tool" onClick={onDuplicate} title="복제"><IconCopy/></button>
                <button className="se-qcard-tool" onClick={onRemove} title="삭제"><IconTrash/></button>
                <label className="se-qcard-required">
                    필수
                    <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => onUpdate({ required: e.target.checked })}
                        className="se-required-toggle"
                    />
                </label>
                <button className="se-qcard-tool" title="더보기"><IconMore/></button>
            </div>
        </div>
    );
}

function ImportModal({ onClose, onImport }) {
    const [surveys, setSurveys] = useState([]);
    const [selectedSurveyId, setSelectedSurveyId] = useState(null);
    const [surveyQuestions, setSurveyQuestions] = useState([]);
    const [selectedQIds, setSelectedQIds] = useState(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/surveys/list`)
            .then((r) => r.ok ? r.json() : [])
            .then((data) => setSurveys(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const loadSurveyQuestions = async (surveyId) => {
        setSelectedSurveyId(surveyId);
        setSelectedQIds(new Set());
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/surveys/${surveyId}`);
            if (res.ok) {
                const data = await res.json();
                setSurveyQuestions(data.questions || []);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const toggleQ = (qid) => setSelectedQIds((prev) => {
        const next = new Set(prev);
        if (next.has(qid)) next.delete(qid);
        else next.add(qid);
        return next;
    });

    const handleImport = () => {
        const toImport = surveyQuestions
            .filter((q) => selectedQIds.has(q.id))
            .map((q) => ({
                type: SERVER_TO_EDITOR[q.qtype] || 'short',
                title: q.text || '',
                options: Array.isArray(q.options) ? q.options : [],
                required: true,
                scaleMin: 1, scaleMax: 5, minLabel: '', maxLabel: '',
                errorText: '', minSelect: '', maxSelect: '', exactSelect: '',
            }));
        onImport(toImport);
    };

    return (
        <div className="se-modal-overlay" onClick={onClose}>
            <div className="se-modal" onClick={(e) => e.stopPropagation()}>
                <div className="se-modal-header">
                    <h3 className="se-modal-title">질문 가져오기</h3>
                    <button className="se-qcard-tool" onClick={onClose}><IconClose/></button>
                </div>
                <div className="se-modal-body">
                    <div className="se-import-left">
                        <div className="se-import-label">설문 목록</div>
                        {surveys.length === 0 && (
                            <div style={{ padding: '16px', color: '#999', fontSize: 13 }}>설문이 없습니다.</div>
                        )}
                        {surveys.map((s) => (
                            <div
                                key={s.id}
                                className={`se-import-survey-item ${selectedSurveyId === s.id ? 'active' : ''}`}
                                onClick={() => loadSurveyQuestions(s.id)}
                            >
                                {s.title}
                            </div>
                        ))}
                    </div>
                    <div className="se-import-right">
                        <div className="se-import-label">질문 목록</div>
                        {loading && <div style={{ padding: '16px', color: '#999', fontSize: 13 }}>불러오는 중...</div>}
                        {!loading && !selectedSurveyId && (
                            <div style={{ padding: '16px', color: '#999', fontSize: 13 }}>왼쪽에서 설문을 선택하세요.</div>
                        )}
                        {!loading && selectedSurveyId && surveyQuestions.length === 0 && (
                            <div style={{ padding: '16px', color: '#999', fontSize: 13 }}>질문이 없습니다.</div>
                        )}
                        {!loading && surveyQuestions.map((q) => (
                            <label key={q.id} className="se-import-question-item">
                                <input
                                    type="checkbox"
                                    checked={selectedQIds.has(q.id)}
                                    onChange={() => toggleQ(q.id)}
                                    style={{ accentColor: '#23BDBB' }}
                                />
                                <span>{q.text || '(제목 없음)'}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="se-modal-footer">
                    <button className="survey-tab" onClick={onClose}>취소</button>
                    <button
                        className={`survey-tab ${selectedQIds.size > 0 ? 'active' : ''}`}
                        onClick={handleImport}
                        disabled={selectedQIds.size === 0}
                    >
                        {selectedQIds.size > 0 ? `${selectedQIds.size}개 가져오기` : '가져오기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
