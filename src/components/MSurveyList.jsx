import { useState, useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MSurveyList.css';
import { API_URL } from '../utils/api';

const formatEndDate = (period) => {
    if (!period) return '';
    const parts = period.split('~');
    return parts.length >= 2 ? `~${parts[1].trim()}` : period;
};

export default function MSurveyList({ onNavigate }) {
    const [tab, setTab] = useState('active');
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/api/surveys/list?tab=${tab}`)
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
                <button
                    className={`m-stab ${tab === 'closed' ? 'on' : ''}`}
                    onClick={() => setTab('closed')}
                >마감</button>
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
                                // 'result' or 'closed' → 결과 페이지
                                onNavigate && onNavigate('mSurveyResults', it);
                            }
                        }}
                    >
                        <div className="m-card-body">
                            <h3 className="m-card-title">{it.title}</h3>
                            <p className="m-card-meta">응답시간 : {it.minutes}분</p>
                            <p className="m-card-meta">조사기간 : {formatEndDate(it.period)}</p>
                            {(tab === 'result' || tab === 'closed') && (
                                <p className="m-card-meta m-card-respondents">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                                    </svg>
                                    응답자 {(it.response_count || 0).toLocaleString()}명
                                </p>
                            )}
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
