import { useEffect, useMemo, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import { MY_CAT_STYLES as CAT_STYLES } from './catStyles';
import './PCFormShared.css';
import './PCMyReportList.css';
import { API_URL } from '../utils/api';

// Figma 215:3065: 2행 지역 필터
const REGIONS_ROW1 = ['부산전체', '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구'];
const REGIONS_ROW2 = ['북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'];
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
    const [status, setStatus] = useState('개선중');
    const [keyword, setKeyword] = useState('');
    const [serverReports, setServerReports] = useState([]);
    const [myServerReports, setMyServerReports] = useState([]);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/reports/full`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setServerReports(Array.isArray(rows) ? rows : []))
            .catch(() => setServerReports([]));

        const token = localStorage.getItem('access_token');
        if (token) {
            fetch(`${API_URL}/api/reports/mine`, { headers: { Authorization: `Bearer ${token}` } })
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

    // 좋아요 탭에서의 하트/댓글 색 = 보라 #542aa3
    const isLikesTab = tab === 'likes';

    return (
        <UserPCLayout currentView="pcMyReportList" onNavigate={onNavigate}>
            <div className="pc-myrep-page">
                <div className="pc-myrep-inner">
                    {/* 페이지 제목 (Figma: "나의제보") */}
                    <h2 className="pc-myrep-title">나의제보</h2>

                    {/* 검색 바 */}
                    <div className="pc-myrep-search-wrap">
                        <input
                            type="text"
                            className="pc-myrep-search"
                            placeholder="검색"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <svg className="pc-myrep-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7"/>
                            <path d="M21 21l-4.35-4.35"/>
                        </svg>
                    </div>

                    {/* 지역 필터 — 2행 grid (Figma: row1=8개, row2=9개) */}
                    <div className="pc-myrep-region-wrap">
                        <div className="pc-myrep-region-row">
                            {REGIONS_ROW1.map((r) => (
                                <button
                                    key={r}
                                    className={`pc-myrep-region-chip ${region === r ? 'active' : ''}`}
                                    onClick={() => setRegion(r)}
                                    type="button"
                                >{r}</button>
                            ))}
                        </div>
                        <div className="pc-myrep-region-row" style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}>
                            {REGIONS_ROW2.map((r) => (
                                <button
                                    key={r}
                                    className={`pc-myrep-region-chip ${region === r ? 'active' : ''}`}
                                    onClick={() => setRegion(r)}
                                    type="button"
                                >{r}</button>
                            ))}
                        </div>
                    </div>

                    {/* 카테고리 필터 */}
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

                    {/* 탭 스위처 (나의 제보글 | 좋아요 제보글) */}
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

                    {/* 상태 필터 (나의 제보글 탭에만) */}
                    {tab === 'mine' && (
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
                    )}

                    {/* 카드 그리드 */}
                    <div className="pc-myrep-grid">
                        {filtered.map((r) => {
                            const cat = r.cat || r.category || '';
                            const sub = r.sub || r.sub_category || '';
                            const catStyle = CAT_STYLES[cat] || { bg: '#ffef8a', color: '#242424' };
                            const isLiked = likedIds && likedIds.has(r.id);
                            return (
                                <div key={r.id} className="pc-myrep-card" onClick={() => handleCardClick(r)}>
                                    {/* 배지 행: 지역 / 카테고리 / 서브 */}
                                    <div className="pc-myrep-card-tags">
                                        {r.region && (
                                            <span className="pc-myrep-region-tag">{r.region}</span>
                                        )}
                                        {cat && (
                                            <span className="pc-myrep-cat" style={{ background: catStyle.bg, color: catStyle.color }}>{cat}</span>
                                        )}
                                        {sub && (
                                            <span className="pc-myrep-sub">{sub}</span>
                                        )}
                                    </div>
                                    <div className="pc-myrep-card-row">
                                        <div className="pc-myrep-card-text">
                                            <h4 className="pc-myrep-card-title">{r.title}</h4>
                                            <p className="pc-myrep-card-author">
                                                {r.author || ''}{r.region ? ` ${r.region}` : ''}
                                            </p>
                                        </div>
                                        {r.image && (
                                            <div className="pc-myrep-card-img">
                                                <img src={r.image} alt={r.title}
                                                    onError={(e) => { e.currentTarget.parentNode.style.display = 'none'; }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pc-myrep-card-stats">
                                        {/* 좋아요 — 좋아요 탭 시 보라, 나의제보 탭 시 회색 */}
                                        <span className={`pc-myrep-stat ${isLikesTab || isLiked ? 'liked' : ''}`}>
                                            <svg width="14" height="12" viewBox="0 0 15.36 12.23"
                                                fill={isLikesTab || isLiked ? '#542aa3' : 'none'}
                                                stroke={isLikesTab || isLiked ? '#542aa3' : '#bfbfbf'}
                                                strokeWidth={isLikesTab || isLiked ? 0 : 1}>
                                                <path d="M9.057 1.081C10.498-0.36 12.836-0.36 14.277 1.081 15.719 2.523 15.719 4.860 14.277 6.302L8.781 11.799C8.478 12.102 8.076 12.244 7.679 12.229 7.282 12.244 6.880 12.102 6.577 11.799L1.081 6.302C-0.360 4.860-0.360 2.523 1.081 1.081 2.523-0.360 4.860-0.360 6.302 1.081L7.679 2.458Z"/>
                                            </svg>
                                            {(r.likes ?? 0) + (isLiked ? 1 : 0)}
                                        </span>
                                        <span className="pc-myrep-stat">
                                            <svg width="13" height="12" viewBox="0 0 14 11.85" fill="#bfbfbf">
                                                <path d="M9.154 0C11.831 0 14 2.169 14 4.846 14 7.522 11.831 9.691 9.154 9.691H6.513L3.230 11.846V9.414C1.349 8.749 0 6.955 0 4.846 0 2.169 2.169 0 4.846 0Z"/>
                                            </svg>
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
