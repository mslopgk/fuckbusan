import { useState, useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MSurveyList.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function MSurveyList({ onNavigate }) {
    const [tab, setTab] = useState('active');
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${VITE_API_URL}/api/surveys/list?tab=${tab}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setList(Array.isArray(rows) ? rows : []))
            .catch(() => setList([]))
            .finally(() => setLoading(false));
    }, [tab]);

    return (
        <div className="m-survey-list-page">
            <header className="m-page-topbar">
                <button className="m-back" onClick={() => onNavigate && onNavigate('home')} aria-label="홈으로">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    <span>홈으로</span>
                </button>
            </header>

            <div className="m-survey-tabs">
                <button
                    className={`m-stab ${tab === 'active' ? 'on' : ''}`}
                    onClick={() => setTab('active')}
                >진행중인 설문</button>
                <button
                    className={`m-stab ${tab === 'result' ? 'on' : ''}`}
                    onClick={() => setTab('result')}
                >설문결과</button>
            </div>

            <ul className="m-survey-cards">
                {loading && <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>불러오는 중...</li>}
                {!loading && list.length === 0 && (
                    <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>설문이 없습니다.</li>
                )}
                {list.map((it) => (
                    <li
                        key={it.id}
                        className="m-survey-card"
                        onClick={() => {
                            if (tab === 'active') {
                                onNavigate && onNavigate('mSurveyDetail1', it);
                            } else {
                                onNavigate && onNavigate('mSurveyResults', it);
                            }
                        }}
                    >
                        <div className="m-card-body">
                            <h3 className="m-card-title">{it.title}</h3>
                            <p className="m-card-meta">응답시간 : {it.minutes}분</p>
                            <p className="m-card-meta">조사기간 : {it.period}</p>
                        </div>
                        <span className="m-card-arrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </span>
                    </li>
                ))}
            </ul>

            <MobileBottomNav currentView="mSurveyList" onNavigate={onNavigate} />
        </div>
    );
}
