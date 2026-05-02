import { useEffect, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCSurveyList.css';

const FALLBACK = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: '소비자 인식 조사',
    duration: '10분',
    period: '~2026-12-06',
}));

export default function PCSurveyList({ onNavigate }) {
    const [tab, setTab] = useState('active');
    const [items, setItems] = useState(FALLBACK);

    useEffect(() => {
        const load = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${API_URL}/api/surveys/list`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length) {
                        setItems(data.map((s) => ({
                            id: s.id,
                            title: s.title,
                            duration: '10분',
                            period: '~2026-12-06',
                            status: s.status,
                        })));
                    }
                }
            } catch (_) { /* keep fallback */ }
        };
        load();
    }, []);

    return (
        <UserPCLayout currentView="pcSurveyList" onNavigate={onNavigate}>
            <section className="pc-survey-list-page">
                <div className="pc-hero-card">
                    <div className="pc-hero-text">
                        <h1>우리동네 설문 참여<br />안전한 우리동네 만들기!</h1>
                    </div>
                    <div className="pc-hero-illu" aria-hidden="true">
                        <svg width="220" height="180" viewBox="0 0 260 200" fill="none">
                            {/* Background leaves */}
                            <path d="M30 60 Q10 50 20 30 Q40 35 45 55 Q35 65 30 60Z" fill="#A99BD9" opacity="0.5"/>
                            <path d="M60 30 Q50 10 70 5 Q85 20 80 40 Q70 38 60 30Z" fill="#7B5FB8" opacity="0.5"/>
                            <path d="M210 30 Q230 10 245 25 Q240 50 220 50 Q210 40 210 30Z" fill="#A99BD9" opacity="0.6"/>
                            <path d="M235 100 Q250 90 250 110 Q235 120 225 110 Q225 100 235 100Z" fill="#7B5FB8" opacity="0.5"/>

                            {/* Document paper */}
                            <rect x="100" y="50" width="100" height="130" rx="6" fill="#fff" stroke="#5B2EAB" strokeWidth="2"/>
                            <line x1="115" y1="76" x2="180" y2="76" stroke="#5B2EAB" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="115" y1="92" x2="180" y2="92" stroke="#5B2EAB" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="115" y1="108" x2="170" y2="108" stroke="#5B2EAB" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="115" y1="124" x2="180" y2="124" stroke="#5B2EAB" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="115" y1="140" x2="160" y2="140" stroke="#5B2EAB" strokeWidth="2" strokeLinecap="round"/>

                            {/* Check circle on paper */}
                            <circle cx="183" cy="158" r="14" fill="#5B2EAB"/>
                            <path d="M178 158l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

                            {/* Person */}
                            <ellipse cx="60" cy="170" rx="28" ry="6" fill="#000" opacity="0.10"/>
                            <circle cx="62" cy="80" r="14" fill="#F4D2B5"/>
                            <path d="M52 75 Q62 64 72 75" stroke="#3a2666" strokeWidth="3" strokeLinecap="round" fill="none"/>
                            <rect x="48" y="92" width="28" height="46" rx="6" fill="#5B2EAB"/>
                            <path d="M48 100 Q30 110 35 130" stroke="#5B2EAB" strokeWidth="9" strokeLinecap="round" fill="none"/>
                            <path d="M76 100 Q98 92 105 80" stroke="#5B2EAB" strokeWidth="9" strokeLinecap="round" fill="none"/>
                            <circle cx="105" cy="80" r="6" fill="#F4D2B5"/>
                            <rect x="50" y="138" width="9" height="32" rx="4" fill="#3a2666"/>
                            <rect x="65" y="138" width="9" height="32" rx="4" fill="#3a2666"/>
                            <ellipse cx="55" cy="172" rx="7" ry="3" fill="#1a1a1b"/>
                            <ellipse cx="69" cy="172" rx="7" ry="3" fill="#1a1a1b"/>
                        </svg>
                    </div>
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
                    {items.map((s) => (
                        <div
                            key={s.id}
                            className="pc-survey-card"
                            onClick={() => onNavigate && onNavigate(tab === 'results' ? 'pcSurveyResults' : 'pcSurveyDetail', s)}
                        >
                            <div className="pc-survey-card-info">
                                <div className="pc-survey-card-title">{s.title}</div>
                                <div className="pc-survey-card-meta">응답시간 : {s.duration}</div>
                                <div className="pc-survey-card-meta">조사기간 : {s.period}</div>
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
