import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/survey_editor.css';

const QUESTION_TYPES = [
    { value: 'short', label: '단답형' },
    { value: 'radio', label: '객관식 질문' },
    { value: 'checkbox', label: '체크박스' },
    { value: 'scale', label: '선형배율' },
    { value: 'number', label: '숫자' },
];

const DISTRICTS = ['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'];

let qidCounter = 1;
const newQuestion = (type = 'short') => ({
    id: `q-${qidCounter++}`,
    type,
    title: '',
    options: type === 'radio' || type === 'checkbox' ? ['옵션 1'] : [],
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    errorText: '',
    label: '',
});

export default function SurveyEditor({ onNavigate }) {
    const [tab, setTab] = useState('edit');
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([newQuestion('short')]);

    // settings
    const [ageMin, setAgeMin] = useState(12);
    const [ageMax, setAgeMax] = useState(65);
    const [allDistricts, setAllDistricts] = useState(true);
    const [districts, setDistricts] = useState([]);
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [status, setStatus] = useState('scheduled'); // scheduled | active | ended | draft
    const [isPublic, setIsPublic] = useState(true);
    const [resultsPublic, setResultsPublic] = useState(false);
    const [reward, setReward] = useState('none'); // none | first-come | provided
    const [requirePrivacy, setRequirePrivacy] = useState(true);

    const updateQuestion = (id, patch) => {
        setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    };
    const removeQuestion = (id) => setQuestions((qs) => qs.filter((q) => q.id !== id));
    const addQuestion = () => setQuestions((qs) => [...qs, newQuestion('short')]);

    const updateOption = (qid, idx, value) => {
        setQuestions((qs) =>
            qs.map((q) =>
                q.id === qid
                    ? { ...q, options: q.options.map((o, i) => (i === idx ? value : o)) }
                    : q
            )
        );
    };
    const addOption = (qid) =>
        setQuestions((qs) =>
            qs.map((q) =>
                q.id === qid ? { ...q, options: [...q.options, `옵션 ${q.options.length + 1}`] } : q
            )
        );
    const removeOption = (qid, idx) =>
        setQuestions((qs) =>
            qs.map((q) =>
                q.id === qid ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q
            )
        );

    const handleSave = () => {
        if (!title.trim()) {
            alert('설문 제목을 입력해주세요.');
            return;
        }
        // TODO: POST to /api/surveys when backend lands. For now → confirmation page.
        if (onNavigate) onNavigate('surveyCreated');
    };

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyEditor">
            <div className="content-header-new">
                <h2 className="content-title-new">설문 작성</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="pill-btn muted" onClick={() => onNavigate && onNavigate('surveyManagement')}>임시저장</button>
                    <button className="btn-search-new" style={{ height: 40, padding: '0 24px' }} onClick={handleSave}>저장</button>
                </div>
            </div>

            <div className="survey-tabs">
                <button className={`survey-tab ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}>편집</button>
                <button className={`survey-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>설정</button>
            </div>

            {tab === 'edit' && (
                <div className="survey-edit-pane">
                    <div className="survey-card">
                        <input
                            className="survey-title-input"
                            placeholder="설문 제목을 입력해주세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <textarea
                            className="survey-desc-input"
                            placeholder="설문 설명 (선택)"
                            rows={2}
                        />
                    </div>

                    {questions.map((q, qi) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={qi}
                            onUpdate={(patch) => updateQuestion(q.id, patch)}
                            onRemove={() => removeQuestion(q.id)}
                            onUpdateOption={(idx, val) => updateOption(q.id, idx, val)}
                            onAddOption={() => addOption(q.id)}
                            onRemoveOption={(idx) => removeOption(q.id, idx)}
                        />
                    ))}

                    <button className="add-question-btn" onClick={addQuestion}>
                        <Plus size={18} /> 질문 추가
                    </button>
                </div>
            )}

            {tab === 'settings' && (
                <div className="survey-settings-pane">
                    <SettingCard title="설문 대상">
                        <div className="setting-row">
                            <label>나이 선택</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                만&nbsp;
                                <input type="number" className="num-input" value={ageMin} onChange={(e) => setAgeMin(+e.target.value)} />
                                세&nbsp;~&nbsp;
                                <input type="number" className="num-input" value={ageMax} onChange={(e) => setAgeMax(+e.target.value)} />
                                세 이상까지
                            </div>
                        </div>

                        <div className="setting-row">
                            <label>지역 선택</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                <button
                                    className={`chip ${allDistricts ? 'on' : ''}`}
                                    onClick={() => { setAllDistricts(true); setDistricts([]); }}
                                >전체</button>
                                {DISTRICTS.map((d) => {
                                    const selected = !allDistricts && districts.includes(d);
                                    return (
                                        <button
                                            key={d}
                                            className={`chip ${selected ? 'on' : ''}`}
                                            onClick={() => {
                                                setAllDistricts(false);
                                                setDistricts((arr) => arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d]);
                                            }}
                                        >{d}</button>
                                    );
                                })}
                            </div>
                        </div>
                    </SettingCard>

                    <SettingCard title="기간 설정">
                        <div className="setting-row">
                            <label>설문 기간</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input type="date" className="date-input" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                                <span style={{ color: '#888' }}>~</span>
                                <input type="date" className="date-input" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                            </div>
                        </div>
                    </SettingCard>

                    <SettingCard title="설문 상태 관리">
                        <div className="setting-row">
                            <label>상태</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[
                                    { v: 'scheduled', l: '설문예정' },
                                    { v: 'active', l: '설문진행' },
                                    { v: 'ended', l: '설문종료' },
                                    { v: 'draft', l: '임시저장' },
                                ].map((s) => (
                                    <button key={s.v} className={`chip ${status === s.v ? 'on' : ''}`} onClick={() => setStatus(s.v)}>{s.l}</button>
                                ))}
                            </div>
                        </div>
                        <div className="setting-row">
                            <label>공개 여부</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className={`chip ${isPublic ? 'on' : ''}`} onClick={() => setIsPublic(true)}>공개</button>
                                <button className={`chip ${!isPublic ? 'on' : ''}`} onClick={() => setIsPublic(false)}>비공개</button>
                            </div>
                        </div>
                    </SettingCard>

                    <SettingCard title="설문 결과 공개 (선택)">
                        <div className="setting-row">
                            <label>결과 공개</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className={`chip ${resultsPublic ? 'on' : ''}`} onClick={() => setResultsPublic(true)}>공개</button>
                                <button className={`chip ${!resultsPublic ? 'on' : ''}`} onClick={() => setResultsPublic(false)}>비공개</button>
                            </div>
                        </div>
                    </SettingCard>

                    <SettingCard title="리워드 제공 (선택)">
                        <div className="setting-row">
                            <label>리워드 유형</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className={`chip ${reward === 'none' ? 'on' : ''}`} onClick={() => setReward('none')}>제공안함</button>
                                <button className={`chip ${reward === 'first-come' ? 'on' : ''}`} onClick={() => setReward('first-come')}>선착순</button>
                                <button className={`chip ${reward === 'provided' ? 'on' : ''}`} onClick={() => setReward('provided')}>전체제공</button>
                            </div>
                        </div>
                    </SettingCard>

                    <SettingCard title="개인정보 동의 필수 여부 (선택)">
                        <div className="setting-row">
                            <label>동의 필수</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className={`chip ${requirePrivacy ? 'on' : ''}`} onClick={() => setRequirePrivacy(true)}>필수</button>
                                <button className={`chip ${!requirePrivacy ? 'on' : ''}`} onClick={() => setRequirePrivacy(false)}>선택</button>
                            </div>
                        </div>
                    </SettingCard>
                </div>
            )}
        </AdminLayout>
    );
}

function SettingCard({ title, children }) {
    return (
        <div className="setting-card">
            <div className="setting-card-title">{title}</div>
            {children}
        </div>
    );
}

function QuestionCard({ question, index, onUpdate, onRemove, onUpdateOption, onAddOption, onRemoveOption }) {
    const showOptions = question.type === 'radio' || question.type === 'checkbox';
    return (
        <div className="question-card">
            <div className="question-card-header">
                <span className="question-index"><GripVertical size={14} /> {index + 1}.</span>
                <input
                    className="question-title-input"
                    placeholder="제목없는질문"
                    value={question.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                />
                <select
                    className="question-type-select"
                    value={question.type}
                    onChange={(e) => onUpdate({ type: e.target.value })}
                >
                    {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                <button className="icon-btn" onClick={onRemove} title="삭제">
                    <Trash2 size={16} />
                </button>
            </div>

            {question.type === 'short' && (
                <div className="question-preview short">
                    <input className="preview-input" placeholder="단답형 텍스트" disabled />
                    <input
                        className="meta-input"
                        placeholder="라벨(선택사항)"
                        value={question.label}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                    />
                    <input
                        className="meta-input"
                        placeholder="맞춤 오류 텍스트"
                        value={question.errorText}
                        onChange={(e) => onUpdate({ errorText: e.target.value })}
                    />
                </div>
            )}

            {question.type === 'number' && (
                <div className="question-preview short">
                    <input className="preview-input" placeholder="숫자" type="number" disabled />
                    <input
                        className="meta-input"
                        placeholder="라벨(선택사항)"
                        value={question.label}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                    />
                </div>
            )}

            {showOptions && (
                <div className="question-options">
                    {question.options.map((opt, i) => (
                        <div key={i} className="option-row">
                            <span className="option-marker">{question.type === 'radio' ? '○' : '☐'}</span>
                            <input
                                className="option-input"
                                value={opt}
                                onChange={(e) => onUpdateOption(i, e.target.value)}
                            />
                            <button className="icon-btn" onClick={() => onRemoveOption(i)} title="옵션 삭제">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <button className="add-option-btn" onClick={onAddOption}>
                        + 옵션 추가 또는 '기타' 추가
                    </button>
                </div>
            )}

            {question.type === 'scale' && (
                <div className="question-preview scale">
                    <input
                        type="number"
                        className="num-input"
                        value={question.scaleMin}
                        onChange={(e) => onUpdate({ scaleMin: +e.target.value })}
                    />
                    <span style={{ color: '#888' }}>~</span>
                    <input
                        type="number"
                        className="num-input"
                        value={question.scaleMax}
                        onChange={(e) => onUpdate({ scaleMax: +e.target.value })}
                    />
                    <div className="scale-preview">
                        {Array.from({ length: Math.max(1, question.scaleMax - question.scaleMin + 1) }, (_, i) => (
                            <div key={i} className="scale-tick">
                                <div className="scale-dot" />
                                <span>{question.scaleMin + i}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="question-footer">
                <label className="required-toggle">
                    <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => onUpdate({ required: e.target.checked })}
                    />
                    필수
                </label>
            </div>
        </div>
    );
}
