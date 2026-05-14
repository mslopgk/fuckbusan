import { useEffect, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCSurveyList.css';
import { API_URL } from '../utils/api';

const formatEndDate = (period) => {
    if (!period) return '';
    const parts = period.split('~');
    return parts.length >= 2 ? `~${parts[1].trim()}` : period;
};

export default function PCSurveyList({ onNavigate }) {
    const [tab, setTab] = useState('active');
    const [items, setItems] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                // tab이 null이면 active(진행중)을 기본 fetch — 단, UI는 비활성으로 표시
                const tabQuery = tab === 'results' ? 'result' : 'active';
                const res = await fetch(`${API_URL}/api/surveys/list?tab=${tabQuery}`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(Array.isArray(data) ? data.map((s) => ({
                        id: s.id,
                        title: s.title,
                        duration: `${s.minutes || 10}분`,
                        period: s.period || '',
                        status: s.status,
                        response_count: s.response_count || 0,
                    })) : []);
                }
            } catch (_) {
                setItems([]);
            }
        };
        load();
    }, [tab]);

    return (
        <UserPCLayout currentView="pcSurveyList" onNavigate={onNavigate}>
            <section className="pc-survey-list-page">
                <div className="pc-hero-card">
                    <div className="pc-hero-text">
                        <h1>우리동네 설문 참여<br />안전한 우리동네 만들기!</h1>
                    </div>
                    <img className="pc-hero-illu" src="/figma-assets/survey-hero.png" alt="" />
                </div>

                <div className="pc-tabs">
                    <button className={`pc-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
                        진행중인 설문
                    </button>
                    <button className={`pc-tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>
                        설문결과
                    </button>
                </div>

                <div className="pc-survey-grid">
                    {items.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#999' }}>
                            {tab === 'active' ? '진행중인 설문이 없습니다.' : '결과가 공개된 설문이 없습니다.'}
                        </div>
                    )}
                    {items.map((s) => (
                        <div
                            key={s.id}
                            className="pc-survey-card"
                            onClick={() => onNavigate && onNavigate(tab === 'results' ? 'pcSurveyResults' : 'pcSurveyDetail', s)}
                        >
                            <div className="pc-survey-card-info">
                                <div className="pc-survey-card-title">{s.title}</div>
                                <div className="pc-survey-card-meta">응답시간 : {s.duration}</div>
                                <div className="pc-survey-card-meta">조사기간 : {formatEndDate(s.period)}</div>
                            </div>
                            <button className="pc-survey-card-arrow" aria-label="이동">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </UserPCLayout>
    );
}
