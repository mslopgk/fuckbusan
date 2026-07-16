import { useState, useEffect, useMemo, useRef } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import MapToolbar from './PCMapToolbar';
import { RegionFilterCard, LifeRail } from './filters/MapFilterPanel';
import { catIcon } from './filters/catIcons';
import { LIVING_CATS, CAT_TO_KEY, DISTRICTS, DISTRICT_CENTERS } from '../constants/mapConstants';
import { useReportsData } from '../hooks/useReportsData';
import { thumbUrl } from '../utils/format';
import './PCMapShared.css';
import './PCMap3.css';
import './PCProposeMap.css';


export default function PCProposeMap({ onNavigate }) {
    const [district, setDistrict] = useState('');
    const [livingCats, setLivingCats] = useState(() => new Set(['all']));
    const [sort, setSort] = useState('latest');
    const [policyItem, setPolicyItem] = useState(null);
    const [policyDismissed, setPolicyDismissed] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const mapRef = useRef(null);

    const { reports, proposals } = useReportsData();

    // 제안 전용 지도 — 제안(new_proposals)만 표시. 제보는 pcReportMap에서.
    const ITEMS = useMemo(() => {
        const proposalItems = proposals.map((p) => {
            let lat, lng;
            if (p.lat && p.lng) {
                lat = p.lat;
                lng = p.lng;
            } else {
                const c = DISTRICT_CENTERS[p.region] || [35.1796, 129.0756];
                const seed = typeof p.id === 'number' ? p.id : String(p.id).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
                lat = c[0] + ((seed * 7919) % 1000 / 1000 - 0.5) * 0.005;
                lng = c[1] + ((seed * 6271) % 1000 / 1000 - 0.5) * 0.005;
            }
            return {
                id: `p-${p.id}`,
                rawId: p.id,
                kind: '제안',
                title: p.title,
                subtitle: p.nickname || '익명',
                category: p.category,
                categoryKey: CAT_TO_KEY[p.category] || 'safety',
                region: p.region,
                address: p.detailed_address || null,
                status: p.status || null,
                date: p.created_at ? p.created_at.slice(0, 10) : null,
                views: p.views_count || 0,
                votes: p.likes_count || 0,
                image: (Array.isArray(p.files) && p.files.length > 0) ? p.files[0] : null,
                lat,
                lng,
            };
        });
        return proposalItems;
    }, [proposals]);

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
        if (district) arr = arr.filter((it) => it.region === district);
        if (!livingCats.has('all')) arr = arr.filter((it) => livingCats.has(it.categoryKey));
        if (sort === 'views') arr = [...arr].sort((a, b) => b.views - a.views);
        else if (sort === 'votes') arr = [...arr].sort((a, b) => b.votes - a.votes);
        else arr = [...arr].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        return arr;
    }, [ITEMS, district, livingCats, sort]);

    const counts = {
        report: reports.length,
        propose: proposals.length,
    };

    // 클릭(선택)된 핀은 focus 디자인으로 변경 (코드코리아 260713)
    const pins = filtered
        .filter((it) => it.lat && it.lng)
        .map((it) => ({ ...it, color: '#E6235A', focus: policyItem != null && String(it.id) === String(policyItem.id) }));

    return (
        <UserPCLayout currentView="pcProposeMap" onNavigate={onNavigate}>
            <div className={`pc-map3-page propose${sidebarOpen ? '' : ' pc-map3-sidebar-closed'}`}>
                {/* LEFT FILTER STACK — 3 separate cards */}
                <div className="pc-map3-filter-stack pc-map3-filter-stack--rail">
                    <RegionFilterCard
                        value={district || '전체'}
                        onSelect={(v) => setDistrict(v === '전체' ? '' : v)}
                        options={['전체', ...DISTRICTS]}
                        accent="#f74e7e"
                        unsetValue="전체"
                    />

                    <LifeRail
                        categories={LIVING_CATS.map((c) => ({ key: c.key, label: c.label, icon: catIcon(c.label) }))}
                        isOn={(c) => livingCats.has(c.key)}
                        onChange={(c) => toggleLivingCat(c.key)}
                        accent="#f74e7e"
                    />

                    <aside className="pc-map3-filter-card">
                        <div className="pc-map3-section-label">유형</div>
                        <div className="pc-map3-kind-row">
                            <button
                                className="pc-map3-kind-card"
                                onClick={() => onNavigate && onNavigate('pcReportMap')}
                            >
                                <div>제보</div>
                                <strong>{counts.report}건</strong>
                            </button>
                            <button
                                className="pc-map3-kind-card active"
                                onClick={() => { }}
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
                        selectedDistrict={district}
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
                                    <tr><th>시군구</th><td>{policyItem.region || '준비중'}</td></tr>
                                    <tr><th>사업명</th><td>{policyItem.title}</td></tr>
                                    <tr><th>위치</th><td>{policyItem.address || '주소 준비중'}</td></tr>
                                    <tr><th>카테고리</th><td>{policyItem.category || '준비중'}</td></tr>
                                    <tr><th>등록일</th><td>{policyItem.date || '준비중'}</td></tr>
                                    <tr><th>진행상태</th><td>{policyItem.status || '준비중'}</td></tr>
                                </tbody>
                            </table>
                            <div className="pc-map3-policy-actions">
                                <button
                                    className="pc-map3-policy-cta"
                                    onClick={() => onNavigate && onNavigate('pcProposeDetail', { ...policyItem, id: policyItem.rawId })}
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
                                onClick={() => onNavigate && onNavigate('pcProposeDetail', { ...it, id: it.rawId })}
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
                                        style={{ backgroundImage: it.image ? `url(${thumbUrl(it.image) || it.image})` : "url('/figma-assets/detail-hero-haeundae.png')" }}
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
