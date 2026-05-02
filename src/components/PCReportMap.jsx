import { useState, useRef } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import MapToolbar from './PCMapToolbar';
import './PCMapShared.css';
import './PCMap3.css';

const DISTRICTS = ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'];

const LIVING_CATS = [
    { key: 'all', label: '전체', icon: 'grid' },
    { key: 'safety', label: '안전', icon: 'shield' },
    { key: 'housing', label: '주거', icon: 'home' },
    { key: 'work', label: '산업·일자리', icon: 'briefcase' },
    { key: 'edu', label: '교육', icon: 'book' },
    { key: 'env', label: '환경', icon: 'leaf' },
    { key: 'leisure', label: '문화·여가', icon: 'heart' },
    { key: 'health', label: '보건·복지', icon: 'plus' },
    { key: 'traffic', label: '교통', icon: 'bus' },
];

const ITEMS = [
    { id: 1, kind: '제보', title: '도로 표면 균열 — 차량 통행 위험', subtitle: '동래구 우리디자이너', category: '안전', categoryKey: 'safety', region: '동래구', date: '2026-04-12', views: 18, votes: 9, status: '처리중', lat: 35.1972, lng: 129.0786 },
    { id: 2, kind: '제보', title: '가로등 고장 — 야간 보행 어두움', subtitle: '해운대구 우리디자이너', category: '안전', categoryKey: 'safety', region: '해운대구', date: '2026-04-10', views: 12, votes: 8, status: '접수', lat: 35.1631, lng: 129.1638 },
    { id: 3, kind: '제보', title: '쓰레기 무단투기 — 악취 발생', subtitle: '부산진구 우리디자이너', category: '환경', categoryKey: 'env', region: '부산진구', date: '2026-04-08', views: 9, votes: 5, status: '처리완료', lat: 35.1632, lng: 129.0531 },
    { id: 4, kind: '제보', title: '버스정류장 안내판 파손', subtitle: '연제구 우리디자이너', category: '교통', categoryKey: 'traffic', region: '연제구', date: '2026-04-06', views: 7, votes: 4, status: '처리중', lat: 35.1769, lng: 129.0794 },
    { id: 5, kind: '제보', title: '횡단보도 신호등 작동 이상', subtitle: '사하구 우리디자이너', category: '교통', categoryKey: 'traffic', region: '사하구', date: '2026-04-04', views: 6, votes: 3, status: '접수', lat: 35.1043, lng: 128.9747 },
    { id: 6, kind: '제보', title: '공원 벤치 파손', subtitle: '남구 우리디자이너', category: '문화·여가', categoryKey: 'leisure', region: '남구', date: '2026-04-02', views: 5, votes: 2, status: '처리완료', lat: 35.1335, lng: 129.0851 },
    { id: 7, kind: '제보', title: '도서관 주변 보행로 미끄럼', subtitle: '수영구 우리디자이너', category: '안전', categoryKey: 'safety', region: '수영구', date: '2026-03-30', views: 4, votes: 2, status: '접수', lat: 35.1530, lng: 129.1186 },
    { id: 8, kind: '제보', title: '공중화장실 시설 노후', subtitle: '영도구 우리디자이너', category: '보건·복지', categoryKey: 'health', region: '영도구', date: '2026-03-28', views: 3, votes: 1, status: '처리중', lat: 35.0911, lng: 129.0680 },
];

const CAT_COLOR = {
    traffic: '#E6235A', safety: '#FF7A00', env: '#16B5B0', work: '#5B2EAB',
    health: '#1971c2', leisure: '#c08800', housing: '#d9480f', edu: '#6741d9',
};

function CategoryIcon({ kind }) {
    const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (kind) {
        case 'grid': return <svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
        case 'shield': return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
        case 'home': return <svg {...props}><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>;
        case 'briefcase': return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
        case 'book': return <svg {...props}><path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/></svg>;
        case 'leaf': return <svg {...props}><path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 13-9-1 8-5 13-9 13z"/><path d="M11 20s5-7 6-13"/></svg>;
        case 'heart': return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
        case 'plus': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>;
        case 'bus': return <svg {...props}><rect x="4" y="3" width="16" height="14" rx="2"/><circle cx="8" cy="20" r="1.5"/><circle cx="16" cy="20" r="1.5"/></svg>;
        default: return null;
    }
}


export default function PCReportMap({ onNavigate }) {
    const [district, setDistrict] = useState('중구');
    const [livingCats, setLivingCats] = useState(() => new Set(['all']));
    const [kind, setKind] = useState(null);
    const [sort, setSort] = useState('latest');
    const [policyItem, setPolicyItem] = useState(ITEMS[0]);
    const mapRef = useRef(null);

    const toggleLivingCat = (key) => {
        setLivingCats((prev) => {
            const next = new Set(prev);
            if (key === 'all') return new Set(['all']);
            next.delete('all');
            if (next.has(key)) next.delete(key);
            else next.add(key);
            if (next.size === 0) next.add('all');
            return next;
        });
    };

    let filtered = ITEMS;
    if (!livingCats.has('all')) filtered = filtered.filter((it) => livingCats.has(it.categoryKey));
    if (sort === 'views') filtered = [...filtered].sort((a, b) => b.views - a.views);
    if (sort === 'votes') filtered = [...filtered].sort((a, b) => b.votes - a.votes);

    const counts = {
        report: ITEMS.length,
        propose: 0,
    };

    const pins = filtered.map((it) => ({ ...it, color: CAT_COLOR[it.categoryKey] || '#E6235A' }));

    return (
        <UserPCLayout currentView="pcReportMap" onNavigate={onNavigate}>
            <div className="pc-map3-page">
                <aside className="pc-map3-filter">
                    <div className="pc-map3-section">
                        <div className="pc-map3-section-label">구역별</div>
                        <div className="pc-map3-dropdown">
                            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <button className="pc-map3-dropdown-x" onClick={() => setDistrict('중구')} aria-label="초기화">×</button>
                        </div>
                    </div>

                    <div className="pc-map3-section">
                        <div className="pc-map3-section-label">생활정보</div>
                        <div className="pc-map3-cat-grid">
                            {LIVING_CATS.map((c) => (
                                <button
                                    key={c.key}
                                    className={`pc-map3-cat-btn ${livingCats.has(c.key) ? 'active' : ''}`}
                                    onClick={() => toggleLivingCat(c.key)}
                                >
                                    <span className="pc-map3-cat-icon"><CategoryIcon kind={c.icon} /></span>
                                    <span className="pc-map3-cat-label">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pc-map3-section">
                        <div className="pc-map3-section-label">유형</div>
                        <div className="pc-map3-kind-row">
                            <button
                                className={`pc-map3-kind-card ${kind === '제보' ? 'active' : ''}`}
                                onClick={() => { setKind('제보'); }}
                            >
                                <div>제보</div>
                                <strong>{counts.report}건</strong>
                            </button>
                            <button
                                className="pc-map3-kind-card"
                                onClick={() => onNavigate && onNavigate('pcProposeMap')}
                            >
                                <div>제안</div>
                                <strong>0건</strong>
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="pc-map3-canvas">
                    <PCMapCanvas
                        ref={mapRef}
                        pins={pins}
                        onPinClick={(p) => setPolicyItem(p)}
                        accentColor="#E6235A"
                    />

                    <MapToolbar mapRef={mapRef} />

                    {policyItem && (
                        <div className="pc-map3-policy">
                            <div className="pc-map3-policy-head">
                                <strong>정책 정보</strong>
                                <button
                                    className="pc-map3-policy-close"
                                    aria-label="닫기"
                                    onClick={() => setPolicyItem(null)}
                                >
                                    ×
                                </button>
                            </div>
                            <table className="pc-map3-policy-table">
                                <tbody>
                                    <tr><th>시도</th><td>부산광역시</td></tr>
                                    <tr><th>시군구</th><td>{policyItem.region}</td></tr>
                                    <tr><th>사업명</th><td>{policyItem.title}</td></tr>
                                    <tr><th>위치</th><td>부산광역시 {policyItem.region} 245172번지 일원</td></tr>
                                    <tr><th>면적(㎡)</th><td>2446㎡</td></tr>
                                    <tr><th>선정년도</th><td>2023</td></tr>
                                </tbody>
                            </table>
                            <div className="pc-map3-policy-actions">
                                <button
                                    className="pc-map3-policy-cta"
                                    onClick={() => onNavigate && onNavigate('pcReportDetail', policyItem)}
                                >
                                    자세히 보기
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        className="pc-map3-cta"
                        onClick={() => onNavigate && onNavigate('pcReportForm')}
                    >
                        제보하기
                    </button>
                </div>

                <aside className="pc-map3-list">
                    <div className="pc-map3-list-head">
                        <div className="pc-map3-list-count">
                            <strong>{filtered.length}건</strong>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                        <div className="pc-map3-sort">
                            <button className={sort === 'views' ? 'active' : ''} onClick={() => setSort('views')}>조회수</button>
                            <span>|</span>
                            <button className={sort === 'votes' ? 'active' : ''} onClick={() => setSort('votes')}>투표순</button>
                            <span>|</span>
                            <button className={sort === 'latest' ? 'active' : ''} onClick={() => setSort('latest')}>최신순</button>
                        </div>
                    </div>

                    <ul className="pc-map3-list-items">
                        {filtered.map((it) => (
                            <li key={it.id} onClick={() => onNavigate && onNavigate('pcReportDetail', it)}>
                                <div className="pc-map3-list-info">
                                    <div className="pc-map3-list-tags">
                                        <span className="pc-map3-pill pink">{it.region}</span>
                                        <span className="pc-map3-pill green">{it.category}</span>
                                    </div>
                                    <div className="pc-map3-list-title">{it.title}</div>
                                    <div className="pc-map3-list-sub">{it.subtitle}</div>
                                    <div className="pc-map3-list-stats">
                                        <span>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/></svg>
                                            {it.views}
                                        </span>
                                        <span>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                            {it.votes}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className="pc-map3-list-thumb"
                                    style={{ background: `linear-gradient(135deg, #1f2540, #4a3070, ${CAT_COLOR[it.categoryKey] || '#E6235A'})` }}
                                />
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </UserPCLayout>
    );
}
