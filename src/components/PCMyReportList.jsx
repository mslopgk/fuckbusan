import { useEffect, useMemo, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import { MY_CAT_STYLES as CAT_STYLES } from './catStyles';
import './PCFormShared.css';
import './PCMyReportList.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const REGIONS = ['부산전체', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'];
const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];
const STATUSES = ['개선중', '개선예정', '개선완료'];

const PROGRESS_TO_STATUS = {
    1: '개선예정',
    2: '개선중',
    3: '개선중',
    4: '개선완료',
};

export default function PCMyReportList({ onNavigate, deletedIds, likedIds, userCreatedReports, updatedReportsMap }) {
    const [tab, setTab] = useState('mine');
    const [region, setRegion] = useState('부산전체');
    const [category, setCategory] = useState('전체');
    const [status, setStatus] = useState('');
    const [keyword, setKeyword] = useState('');
    const [serverReports, setServerReports] = useState([]);
    const [myServerReports, setMyServerReports] = useState([]);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        fetch(`${VITE_API_URL}/api/reports/full`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setServerReports(Array.isArray(rows) ? rows : []))
            .catch(() => setServerReports([]));

        const token = localStorage.getItem('access_token');
        if (token) {
            fetch(`${VITE_API_URL}/api/reports/mine`, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => {
                    if (r.status === 401 || r.status === 403) { setAuthError(true); return []; }
                    return r.ok ? r.json() : [];
                })
                .then((rows) => setMyServerReports(Array.isArray(rows) ? rows : []))
                .catch(() => setMyServerReports([]));
        } else {
            setAuthError(true);
        }
    }, []);

    const finalReports = useMemo(() => {
        const base = tab === 'mine'
            ? [...(userCreatedReports || []), ...myServerReports]
            : [...(userCreatedReports || []), ...myServerReports, ...serverReports];
        return base
            .filter((r) => !deletedIds || !deletedIds.has(r.id))
            .filter((r) => tab !== 'likes' || (likedIds && likedIds.has(r.id)))
            .map((r) => (updatedReportsMap && updatedReportsMap[r.id]) ? { ...r, ...updatedReportsMap[r.id] } : r);
    }, [tab, userCreatedReports, myServerReports, serverReports, deletedIds, likedIds, updatedReportsMap]);

    const filtered = useMemo(() => {
        return finalReports.filter((r) => {
            const reportStatus = r.status || PROGRESS_TO_STATUS[r.progress_step] || '개선예정';
            if (status && reportStatus !== status) return false;
            if (category && category !== '전체' && r.category !== category && r.cat !== category) return false;
            if (region && region !== '부산전체' && r.region !== region) return false;
            if (keyword && !`${r.title || ''} ${r.body || ''}`.includes(keyword)) return false;
            return true;
        });
    }, [finalReports, status, category, region, keyword]);

    const handleCardClick = (report) => {
        if (onNavigate) onNavigate('pcReportDetail', { ...report, showActions: tab === 'mine' });
    };

    return (
        <UserPCLayout currentView="pcMyReportList" onNavigate={onNavigate}>
            <div className="pc-myrep-page">
                <div className="pc-myrep-inner">
                    <h2 className="pc-myrep-title">제보하기</h2>

                    <div className="pc-form-hero pc-hero-yellow">
                        <div>
                            <h3>문제 상황이 잘 보이도록<br/>사진을 등록해 주세요</h3>
                        </div>
                        <img className="pc-form-hero-img" src="/figma-assets/propose-hero.png" alt="" />
                    </div>

                    <div className="pc-myrep-search-wrap">
                        <input
                            type="text"
                            className="pc-myrep-search"
                            placeholder="검색"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <svg className="pc-myrep-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                    </div>

                    <div className="pc-myrep-region-row">
                        {REGIONS.map((r) => (
                            <button
                                key={r}
                                className={`pc-myrep-region-chip ${region === r ? 'active' : ''}`}
                                onClick={() => setRegion(r)}
                                type="button"
                            >{r}</button>
                        ))}
                    </div>

                    <div className="pc-myrep-cat-row">
                        {CATEGORIES.map((c) => (
                            <button
                                key={c}
                                className={`pc-myrep-cat-chip ${category === c ? 'active' : ''}`}
                                onClick={() => setCategory(c)}
                                type="button"
                            >{c}</button>
                        ))}
                    </div>

                    <div className="pc-myrep-tabs">
                        <button
                            type="button"
                            className={`pc-myrep-tab ${tab === 'mine' ? 'active' : ''}`}
                            onClick={() => setTab('mine')}
                        >나의 제보글</button>
                        <button
                            type="button"
                            className={`pc-myrep-tab ${tab === 'likes' ? 'active' : ''}`}
                            onClick={() => setTab('likes')}
                        >좋아요 제보글</button>
                    </div>

                    <div className="pc-myrep-status-row">
                        {STATUSES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`pc-myrep-status-chip ${status === s ? 'active' : ''}`}
                                onClick={() => setStatus(s)}
                            >{s}</button>
                        ))}
                    </div>

                    <div className="pc-myrep-grid">
                        {filtered.map((r) => {
                            const cat = r.cat || r.category || '';
                            const sub = r.sub || r.sub_category || '';
                            const style = CAT_STYLES[cat] || { bg: '#E0F4F1', color: '#2C9A8F' };
                            return (
                                <div key={r.id} className="pc-myrep-card" onClick={() => handleCardClick(r)}>
                                    <div className="pc-myrep-card-tags">
                                        {cat && <span className="pc-myrep-cat" style={{ background: style.bg, color: style.color }}>{cat}</span>}
                                        {sub && <span className="pc-myrep-sub">{sub}</span>}
                                    </div>
                                    <div className="pc-myrep-card-row">
                                        <div className="pc-myrep-card-text">
                                            <h4 className="pc-myrep-card-title">{r.title}</h4>
                                            <p className="pc-myrep-card-author">{r.author || ''}{r.region ? ` ${r.region}` : ''}</p>
                                        </div>
                                        {r.image && (
                                            <div className="pc-myrep-card-img">
                                                <img src={r.image} alt={r.title} onError={(e) => { e.currentTarget.parentNode.style.display = 'none'; }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pc-myrep-card-stats">
                                        <span className="pc-myrep-stat">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill={likedIds && likedIds.has(r.id) ? '#E6235A' : 'none'} stroke={likedIds && likedIds.has(r.id) ? '#E6235A' : '#adb5bd'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                            {(r.likes ?? 0) + (likedIds && likedIds.has(r.id) ? 1 : 0)}
                                        </span>
                                        <span className="pc-myrep-stat">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                            {r.comments ?? 0}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <p className="pc-myrep-empty">
                            {authError && tab === 'mine' ? '로그인이 필요합니다.' : '표시할 제보가 없습니다.'}
                        </p>
                    )}
                </div>
            </div>
        </UserPCLayout>
    );
}
