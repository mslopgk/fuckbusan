import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/survey_editor.css';

const QUESTION_TYPES = [
    { value: 'short',    label: '단답형' },
    { value: 'radio',    label: '객관식 질문' },
    { value: 'checkbox', label: '체크박스' },
    { value: 'scale',    label: '선형배율' },
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

// === 인라인 SVG 아이콘 ===
const SVG = (p) => ({ width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', ...p });
const IconCopy = () => <svg {...SVG()}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconTrash = () => <svg {...SVG()}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>;
const IconMore = () => <svg {...SVG()}><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
const IconImage = () => <svg {...SVG({ width: 18, height: 18 })}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconPlus = () => <svg {...SVG({ width: 18, height: 18 })}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconImport = () => <svg {...SVG({ width: 18, height: 18 })}><path d="M4 4h16v16H4z"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="6" x2="12" y2="16"/></svg>;
const IconSection = () => <svg {...SVG({ width: 18, height: 18 })}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconVideo = () => <svg {...SVG({ width: 18, height: 18 })}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
const IconCalendar = () => <svg {...SVG({ width: 16, height: 16 })}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

export default function SurveyEditor({ onNavigate }) {
    const [tab, setTab] = useState('edit');
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([newQuestion('radio')]);

    // settings
    const [region, setRegion] = useState('전체');
    const [ageRange, setAgeRange] = useState('만 12세 ~ 65세 이상까지');
    const [periodStart, setPeriodStart] = useState('2026-01-01');
    const [periodEnd, setPeriodEnd] = useState('2026-01-01');
    const [status, setStatus] = useState('draft'); // draft | scheduled | active | ended
    const [resultsPublic, setResultsPublic] = useState(true);
    const [rewardPublic, setRewardPublic] = useState(true);
    const [rewardOptionalPublic, setRewardOptionalPublic] = useState(true);
    const [requirePrivacy, setRequirePrivacy] = useState(true);

    const updateQuestion = (id, patch) => setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    const removeQuestion = (id) => setQuestions((qs) => qs.filter((q) => q.id !== id));
    const duplicateQuestion = (id) => setQuestions((qs) => {
        const idx = qs.findIndex((q) => q.id === id);
        if (idx < 0) return qs;
        const copy = { ...qs[idx], id: `q-${qidCounter++}` };
        return [...qs.slice(0, idx + 1), copy, ...qs.slice(idx + 1)];
    });
    const addQuestion = () => setQuestions((qs) => [...qs, newQuestion('radio')]);

    const updateOption = (qid, idx, value) => setQuestions((qs) =>
        qs.map((q) => q.id === qid ? { ...q, options: q.options.map((o, i) => (i === idx ? value : o)) } : q)
    );
    const addOption = (qid) => setQuestions((qs) =>
        qs.map((q) => q.id === qid ? { ...q, options: [...q.options, `옵션 ${q.options.length + 1}`] } : q)
    );
    const removeOption = (qid, idx) => setQuestions((qs) =>
        qs.map((q) => q.id === qid ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q)
    );

    const handleSave = () => {
        if (onNavigate) onNavigate('surveyCreated');
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyEditor">
            <div className="content-header-new">
                <h2 className="content-title-new">설문 작성</h2>
            </div>

            <div className="survey-tabs">
                <button className={`survey-tab ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}>편집</button>
                <button className={`survey-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>설정</button>
            </div>

            {tab === 'edit' && (
                <div className="survey-edit-layout">
                    <div className="survey-edit-pane">
                        <div className="se-field-row">
                            <label className="se-field-label">제목</label>
                            <input
                                className="se-field-input"
                                placeholder="제목없는질문"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="se-field-row">
                            <label className="se-field-label">질문</label>
                            <div className="se-radio-row">
                                <label className="se-radio"><input type="radio" name="dummy_q" defaultChecked/> 옵션</label>
                                <label className="se-radio"><input type="radio" name="dummy_q"/> 옵션 1</label>
                            </div>
                        </div>

                        {questions.map((q, qi) => (
                            <QuestionCard
                                key={q.id}
                                question={q}
                                index={qi}
                                onUpdate={(patch) => updateQuestion(q.id, patch)}
                                onRemove={() => removeQuestion(q.id)}
                                onDuplicate={() => duplicateQuestion(q.id)}
                                onUpdateOption={(idx, val) => updateOption(q.id, idx, val)}
                                onAddOption={() => addOption(q.id)}
                                onRemoveOption={(idx) => removeOption(q.id, idx)}
                            />
                        ))}

                        <button className="se-confirm-btn" onClick={handleSave}>확인</button>
                    </div>

                    {/* 우측 플로팅 툴바 — Figma의 5개 버튼 */}
                    <aside className="se-toolbar">
                        <button className="se-tool-btn" onClick={addQuestion} title="질문 추가하기">
                            <IconPlus/>
                            <span>질문 추가하기</span>
                        </button>
                        <button className="se-tool-btn" title="질문 가져오기">
                            <IconImport/>
                            <span>질문 가져오기</span>
                        </button>
                        <button className="se-tool-btn" title="섹션 추가하기">
                            <IconSection/>
                            <span>섹션 추가하기</span>
                        </button>
                        <button className="se-tool-btn" title="이미지 추가하기">
                            <IconImage/>
                            <span>이미지 추가하기</span>
                        </button>
                        <button className="se-tool-btn" title="동영상 추가하기">
                            <IconVideo/>
                            <span>동영상 추가하기</span>
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
                        <button className="se-save-btn" onClick={handleSave}>저장</button>
                    </div>
                </div>
            )}
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

function QuestionCard({ question, index, onUpdate, onRemove, onDuplicate, onUpdateOption, onAddOption, onRemoveOption }) {
    const showOptions = question.type === 'radio' || question.type === 'checkbox';
    return (
        <div className="se-qcard">
            <div className="se-qcard-toolbar">
                <button className="se-qcard-tool" onClick={onDuplicate} title="복제"><IconCopy/></button>
                <button className="se-qcard-tool" onClick={onRemove} title="삭제"><IconTrash/></button>
                <span className="se-qcard-required">
                    필수
                    <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => onUpdate({ required: e.target.checked })}
                        className="se-required-toggle"
                    />
                </span>
                <button className="se-qcard-tool" title="더보기"><IconMore/></button>
            </div>

            <div className="se-qcard-header">
                <label className="se-field-label">제목</label>
                <input
                    className="se-field-input"
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
                <div className="se-field-label se-field-label-tight">옵션</div>

                {(question.type === 'short' || question.type === 'number') && (
                    <input
                        className="se-meta-input"
                        placeholder={question.type === 'short' ? '단답형 텍스트' : '숫자'}
                        type={question.type === 'number' ? 'number' : 'text'}
                        disabled
                    />
                )}

                {showOptions && (
                    <div className="se-options">
                        {question.options.map((opt, i) => (
                            <div key={i} className="se-option-row">
                                <span className="se-option-marker">{question.type === 'radio' ? '○' : '☐'}</span>
                                <input
                                    className="se-option-input"
                                    value={opt}
                                    onChange={(e) => onUpdateOption(i, e.target.value)}
                                />
                                <button className="se-qcard-tool" onClick={() => onRemoveOption(i)} title="옵션 삭제"><IconTrash/></button>
                            </div>
                        ))}
                        <button className="se-add-option-btn" onClick={onAddOption}>옵션 추가 또는 '기타' 추가</button>

                        {question.type === 'checkbox' && (
                            <div className="se-checkbox-meta">
                                <select className="se-meta-select" value={question.minSelect} onChange={(e) => onUpdate({ minSelect: e.target.value })}>
                                    <option value="">최소 선택 개수</option>
                                    <option value="1">1</option><option value="2">2</option>
                                </select>
                                <input className="se-meta-input se-meta-input-sm" placeholder="숫자" value={question.maxSelect} onChange={(e) => onUpdate({ maxSelect: e.target.value })}/>
                                <input className="se-meta-input" placeholder="맞춤 오류 텍스트" value={question.errorText} onChange={(e) => onUpdate({ errorText: e.target.value })}/>
                            </div>
                        )}
                    </div>
                )}

                {question.type === 'scale' && (
                    <div className="se-scale">
                        <div className="se-scale-range">
                            <select className="se-meta-select se-meta-select-sm" value={question.scaleMin} onChange={(e) => onUpdate({ scaleMin: +e.target.value })}>
                                {[0,1].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <span style={{ color: '#888' }}>~</span>
                            <select className="se-meta-select se-meta-select-sm" value={question.scaleMax} onChange={(e) => onUpdate({ scaleMax: +e.target.value })}>
                                {[3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <select className="se-meta-select" defaultValue="••• 선형배율">
                                <option>••• 선형배율</option>
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
        </div>
    );
}
