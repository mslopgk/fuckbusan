import { useState } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCSurveyJoin.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function PCSurveyJoin({ onNavigate, survey }) {
    const data = survey || { title: '사직구장 일대 보행환경의 현황 조사' };

    const [q1, setQ1] = useState(null);
    const [q2, setQ2] = useState(null);
    const [q3, setQ3] = useState(null);
    const [q4, setQ4] = useState([]);
    const [q5, setQ5] = useState('');

    const toggleCheckbox = (key) => {
        setQ4((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    const renderScale = (value, setValue) => (
        <div className="pc-scale-row">
            <div className="pc-scale-track">
                {[0, 1, 2, 3, 4].map((i) => (
                    <button
                        key={i}
                        className={`pc-scale-dot ${i === value ? 'active' : ''}`}
                        onClick={() => setValue(i)}
                        aria-label={`${i + 1}점`}
                    />
                ))}
            </div>
            <div className="pc-scale-labels">
                <span>전혀<br/>아니다</span>
                <span></span>
                <span>보통</span>
                <span></span>
                <span>매우<br/>그렇다</span>
            </div>
        </div>
    );

    const Q4_OPTIONS = [
        { key: 'walkway', label: '보행로 확장' },
        { key: 'lighting', label: '야간 조명 개선' },
        { key: 'separation', label: '차량 통제 및 동선 분리' },
        { key: 'signage', label: '길 안내 시스템' },
        { key: 'other', label: '기타' },
    ];

    return (
        <UserPCLayout currentView="pcSurveyJoin" onNavigate={onNavigate}>
            <div className="pc-survey-join-page">
                <div className="pc-purple-banner pc-banner-tall">
                    <h1 className="pc-banner-title">{data.title}</h1>
                    <button
                        className="pc-banner-copy-btn"
                        onClick={() => { try { navigator.clipboard.writeText(window.location.href); } catch (_) {} }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        복사하기
                    </button>
                </div>

                <div className="pc-join-card">
                    <div className="pc-question">
                        <p className="pc-question-text">Q1. 사직구장을 방문한 경험이 있습니까?</p>
                        <div className="pc-question-options">
                            <label className={`pc-option-pill ${q1 === 'no' ? 'active' : ''}`}>
                                <input type="checkbox" checked={q1 === 'no'} onChange={() => setQ1('no')} /> 없다
                            </label>
                            <label className={`pc-option-pill ${q1 === 'yes' ? 'active' : ''}`}>
                                <input type="checkbox" checked={q1 === 'yes'} onChange={() => setQ1('yes')} /> 있다
                            </label>
                        </div>
                    </div>

                    <div className="pc-question">
                        <p className="pc-question-text">Q2. 사직구장 주변 보행로는 안전하다고 느낍니다.</p>
                        {renderScale(q2, setQ2)}
                    </div>

                    <div className="pc-question">
                        <p className="pc-question-text">Q3. 차량과 보행자의 동선이 잘 분리되어 있습니다.</p>
                        {renderScale(q3, setQ3)}
                    </div>

                    <div className="pc-question">
                        <p className="pc-question-text">Q4. 가장 개선이 필요하다고 생각하는 항목을<br/>선택해주세요. (중복가능)</p>
                        <div className="pc-checkbox-grid">
                            {Q4_OPTIONS.map((opt) => (
                                <label key={opt.key} className={`pc-option-pill ${q4.includes(opt.key) ? 'active' : ''}`}>
                                    <input type="checkbox" checked={q4.includes(opt.key)} onChange={() => toggleCheckbox(opt.key)} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pc-question">
                        <p className="pc-question-text">Q5. 사직구장 보행환경 개선을 위해 필요한 사항을 자유롭게 작성해주세요.</p>
                        <div className="pc-textarea-wrapper">
                            <textarea
                                value={q5}
                                onChange={(e) => setQ5(e.target.value.slice(0, 1300))}
                                placeholder="예: 야간 조명이 어두워 불안했어요 / 인도가 좁아 보행이 불편해요 등"
                            />
                            <span className="pc-textarea-count">{q5.length} /1300</span>
                        </div>
                    </div>
                </div>

                <div className="pc-join-actions">
                    <button className="pc-btn-secondary" onClick={() => onNavigate && onNavigate('pcSurveyDetail', data)}>이전</button>
                    <button className="pc-btn-primary" onClick={async () => {
                        const surveyId = survey?.id;
                        if (surveyId && survey?.questions?.length >= 5) {
                            const q4Labels = q4.map(k => Q4_OPTIONS.find(o => o.key === k)?.label).filter(Boolean);
                            const answers = [
                                { question_id: survey.questions[0].id, value: q1 === 'yes' ? '있다' : q1 === 'no' ? '없다' : '' },
                                { question_id: survey.questions[1].id, value: q2 !== null ? q2 + 1 : '' },
                                { question_id: survey.questions[2].id, value: q3 !== null ? q3 + 1 : '' },
                                { question_id: survey.questions[3].id, value: q4Labels },
                                { question_id: survey.questions[4].id, value: q5 },
                            ].filter(a => a.value !== '' && (Array.isArray(a.value) ? a.value.length > 0 : true));
                            const token = localStorage.getItem('access_token');
                            const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
                            await fetch(`${API_URL}/api/surveys/${surveyId}/responses`, {
                                method: 'POST', headers, body: JSON.stringify({ answers }),
                            }).catch(() => {});
                        }
                        onNavigate && onNavigate('pcSurveyDone', data);
                    }}>다음</button>
                </div>
            </div>
        </UserPCLayout>
    );
}
