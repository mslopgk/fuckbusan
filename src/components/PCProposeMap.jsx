import { useState, useEffect, useMemo, useRef } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import MapToolbar from './PCMapToolbar';
import { LIVING_CATS, CAT_TO_KEY, CAT_COLOR, DISTRICTS, DISTRICT_CENTERS, CategoryIcon } from '../constants/mapConstants';
import { useReportsData } from '../hooks/useReportsData';
import './PCMapShared.css';
import './PCMap3.css';


export default function PCProposeMap({ onNavigate }) {
    const [district, setDistrict] = useState('중구');
    const [livingCats, setLivingCats] = useState(() => new Set(['all']));
    const [kind, setKind] = useState(null);
    const [sort, setSort] = useState('latest');
    const [policyItem, setPolicyItem] = useState(null);
    const [policyDismissed, setPolicyDismissed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const mapRef = useRef(null);

    const { reports, proposals } = useReportsData();

    const ITEMS = useMemo(() => {
        const reportItems = reports.map((r) => ({
            id: `r-${r.id}`,
            rawId: r.id,
            kind: '제보',
            title: r.title,
            subtitle: r.author || '익명',
            category: r.category,
            categoryKey: CAT_TO_KEY[r.category] || 'safety',
            region: r.region,
            date: r.date,
            views: r.views || 0,
            votes: r.likes || 0,
            image: r.image || null,
            lat: r.lat,
            lng: r.lng,
        }));
        const proposalItems = proposals.map((p) => {
            const c = DISTRICT_CENTERS[p.region];
            return {
                id: `p-${p.id}`,
                rawId: p.id,
                kind: '제안',
                title: p.title,
                subtitle: p.nickname || '익명',
                category: p.category,
                categoryKey: CAT_TO_KEY[p.category] || 'safety',
                region: p.region,
                date: p.created_at ? p.created_at.slice(0, 10) : null,
                views: p.views_count || 0,
                votes: p.likes_count || 0,
                image: p.image || null,
                lat: c ? c[0] + (Math.random() - 0.5) * 0.005 : null,
                lng: c ? c[1] + (Math.random() - 0.5) * 0.005 : null,
            };
        });
        return [...reportItems, ...proposalItems];
    }, [reports, proposals]);

    // 정책정보 카드: 데이터 들어오면 첫 항목으로 시드. X로 닫은 뒤(policyDismissed=true)는 다시 안 열림.
    useEffect(() => {
        if (!policyDismissed && !policyItem && ITEMS.length > 0) {
            setPolicyItem(ITEMS[0]);
        }
    }, [ITEMS, policyItem, policyDismissed]);

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

    const filtered = useMemo(() => {
        let arr = ITEMS;
        if (!livingCats.has('all')) arr = arr.filter((it) => livingCats.has(it.categoryKey));
        if (kind) arr = arr.filter((it) => it.kind === kind);
        if (sort === 'views') arr = [...arr].sort((a, b) => b.views - a.views);
        else if (sort === 'votes') arr = [...arr].sort((a, b) => b.votes - a.votes);
        else arr = [...arr].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        return arr;
    }, [ITEMS, livingCats, kind, sort]);

    const counts = {
        report: ITEMS.filter((i) => i.kind === '제보').length,
        propose: ITEMS.filter((i) => i.kind === '제안').length,
    };

    const pins = filtered.filter((it) => it.lat && it.lng).map((it) => ({ ...it, color: '#E6235A' }));

    return (
        <UserPCLayout currentView="pcProposeMap" onNavigate={onNavigate}>
            <div className={`pc-map3-page${sidebarOpen ? '' : ' pc-map3-sidebar-closed'}`}>
                {/* LEFT FILTER STACK — 3 separate cards */}
                <div className="pc-map3-filter-stack">
                    <aside className="pc-map3-filter-card">
                        <div className="pc-map3-section-label">구역별</div>
                        <div className="pc-map3-dropdown">
                            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <button className="pc-map3-dropdown-x" onClick={() => setDistrict('중구')} aria-label="초기화">×</button>
                        </div>
                    </aside>

                    <aside className="pc-map3-filter-card">
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
                    </aside>

                    <aside className="pc-map3-filter-card">
                        <div className="pc-map3-section-label">유형</div>
                        <div className="pc-map3-kind-row">
                            <button
                                className={`pc-map3-kind-card ${kind === '제보' ? 'active' : ''}`}
                                onClick={() => setKind(kind === '제보' ? null : '제보')}
                            >
                                <div>제보</div>
                                <strong>{counts.report}건</strong>
                            </button>
                            <button
                                className={`pc-map3-kind-card ${kind === '제안' ? 'active' : ''}`}
                                onClick={() => setKind(kind === '제안' ? null : '제안')}
                            >
                                <div>제안</div>
                                <strong>{counts.propose}건</strong>
                            </button>
                        </div>
                    </aside>
                </div>

                {/* CENTER MAP */}
                <div className="pc-map3-canvas">
                    <PCMapCanvas
                        ref={mapRef}
                        pins={pins}
                        onPinClick={(p) => setPolicyItem(p)}
                        accentColor="#E6235A"
                    />

                    {/* Right toolbar */}
                    <MapToolbar
                        mapRef={mapRef}
                        onToggleSidebar={() => setSidebarOpen((v) => !v)}
                        sidebarOpen={sidebarOpen}
                    />

                    {/* Floating policy info card */}
                    {policyItem && (
                        <div
                            className="pc-map3-policy"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="pc-map3-policy-head">
                                <strong>정책 정보</strong>
                                <button
                                    className="pc-map3-policy-close"
                                    aria-label="닫기"
                                    onClick={(e) => { e.stopPropagation(); setPolicyItem(null); setPolicyDismissed(true); }}
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
                                    onClick={() => onNavigate && onNavigate(policyItem.kind === '제안' ? 'pcProposeDetail' : 'pcReportDetail', policyItem)}
                                >
                                    자세히 보기
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bottom CTA */}
                    <button
                        className="pc-map3-cta"
                        onClick={() => onNavigate && onNavigate('pcProposeForm')}
                    >
                        제안하기
                    </button>
                </div>

                {/* RIGHT LIST */}
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
                            <li
                                key={it.id}
                                onClick={() => onNavigate && onNavigate(it.kind === '제안' ? 'pcProposeDetail' : 'pcReportDetail', it)}
                            >
                                <div className="pc-map3-list-info">
                                    <div className="pc-map3-list-tags">
                                        <span className="pc-map3-pill pink">{it.region}</span>
                                        <span className="pc-map3-pill green">{it.category}</span>
                                    </div>
                                    <div className="pc-map3-list-title">{it.title}</div>
                                    <div className="pc-map3-list-sub">{it.subtitle}</div>
                                </div>
                                <div className="pc-map3-list-right">
                                    <div
                                        className="pc-map3-list-thumb"
                                        style={{ backgroundImage: it.image ? `url(${it.image})` : "url('/figma-assets/detail-hero-haeundae.png')" }}
                                    />
                                    <div className="pc-map3-list-stats">
                                        <span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/></svg>
                                            {it.views}
                                        </span>
                                        <span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                            {it.votes}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </UserPCLayout>
    );
}
