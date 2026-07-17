import { useState, useMemo, useRef } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import MapToolbar from './PCMapToolbar';
import { RegionFilterCard, LifeRail } from './filters/MapFilterPanel';
import { catIcon } from './filters/catIcons';
import { LIVING_CATS, CAT_TO_KEY, DISTRICTS } from '../constants/mapConstants';
import { useReportsData } from '../hooks/useReportsData';
import { thumbUrl } from '../utils/format';
import './PCMapShared.css';
import './PCMap3.css';
import './PCReportMap.css';


export default function PCReportMap({ onNavigate }) {
    const [district, setDistrict] = useState('');
    const [livingCats, setLivingCats] = useState(() => new Set(['all']));
    const [sort, setSort] = useState('latest');
    const [policyItem, setPolicyItem] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const mapRef = useRef(null);

    const { reports } = useReportsData({ includeProposals: false });

    const ITEMS = useMemo(() => reports.map((r) => ({
        id: r.id,
        kind: '제보',
        title: r.title,
        subtitle: r.author || '익명',
        category: r.category,
        categoryKey: CAT_TO_KEY[r.category] || 'safety',
        region: r.region,
        address: r.location || r.detailed_address || null,
        date: r.date,
        views: r.views || 0,
        votes: r.likes || 0,
        status: r.status,
        image: (Array.isArray(r.images) && r.images.length > 0) ? r.images[0] : (r.image || null),
        lat: r.lat,
        lng: r.lng,
    })), [reports]);

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

    // 클릭(선택)된 핀은 focus 디자인으로 변경 (코드코리아 260713)
    const pins = filtered
        .filter((it) => it.lat && it.lng)
        .map((it) => ({ ...it, color: '#542aa3', focus: policyItem != null && String(it.id) === String(policyItem.id) }));

    return (
        <UserPCLayout currentView="pcReportMap" onNavigate={onNavigate}>
            <div className={`pc-map3-page report${sidebarOpen ? '' : ' pc-map3-sidebar-closed'}`}>
                <div className="pc-map3-filter-stack pc-map3-filter-stack--rail">
                    <RegionFilterCard
                        value={district || '전체'}
                        onSelect={(v) => setDistrict(v === '전체' ? '' : v)}
                        options={['전체', ...DISTRICTS]}
                        accent="#542aa3"
                        unsetValue="전체"
                    />

                    <LifeRail
                        categories={LIVING_CATS.map((c) => ({ key: c.key, label: c.label, icon: catIcon(c.label) }))}
                        isOn={(c) => livingCats.has(c.key)}
                        onChange={(c) => toggleLivingCat(c.key)}
                        accent="#542aa3"
                    />
                </div>

                <div className="pc-map3-canvas">
                    <PCMapCanvas
                        ref={mapRef}
                        pins={pins}
                        onPinClick={(p) => setPolicyItem(p)}
                        accentColor="#542aa3"
                        selectedDistrict={district}
                    />

                    <MapToolbar
                        mapRef={mapRef}
                        onToggleSidebar={() => setSidebarOpen((v) => !v)}
                        sidebarOpen={sidebarOpen}
                    />

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
                                    onClick={(e) => { e.stopPropagation(); setPolicyItem(null); }}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="pc-map3-policy-scroll">
                                <table className="pc-map3-policy-table">
                                    <tbody>
                                        <tr><th>시도</th><td>부산광역시</td></tr>
                                        <tr><th>시군구</th><td>{policyItem.region || '준비중'}</td></tr>
                                        <tr><th>사업명</th><td>{policyItem.title}</td></tr>
                                        <tr><th>위치</th><td>{policyItem.address || '주소 준비중'}</td></tr>
                                        <tr><th>면적(㎡)</th><td>준비중</td></tr>
                                        <tr><th>선정년도</th><td>{policyItem.date ? String(policyItem.date).slice(0, 4) : '준비중'}</td></tr>
                                        <tr><th>사업기간</th><td>준비중</td></tr>
                                        <tr><th>사업구분</th><td>{policyItem.kind || '제보'}</td></tr>
                                        <tr><th>사업유형</th><td>{policyItem.category || '준비중'}</td></tr>
                                        <tr><th>계획 변경여부</th><td>{policyItem.status || '준비중'}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="pc-map3-policy-actions">
                                <button
                                    className="pc-map3-policy-cta"
                                    onClick={() => onNavigate && onNavigate('pcReportDetail', policyItem)}
                                >
                                    상세보기
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
                            <button className={sort === 'votes' ? 'active' : ''} onClick={() => setSort('votes')}>투표순</button>
                            <button className={sort === 'latest' ? 'active' : ''} onClick={() => setSort('latest')}>최신순</button>
                        </div>
                    </div>

                    <ul className="pc-map3-list-items">
                        {filtered.map((it) => (
                            <li key={it.id} onClick={() => onNavigate && onNavigate('pcReportDetail', it)}>
                                <div className="pc-map3-list-info">
                                    <div className="pc-map3-list-tags">
                                        {it.region && <span className="pc-map3-pill pink">{it.region}</span>}
                                        {it.category && <span className="pc-map3-pill green">{it.category}</span>}
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
                                            <img src="/figma-assets/icons/icon_vote_check.png" alt="" width="12" height="12" style={{ opacity: 0.3 }} />
                                            {it.votes}
                                        </span>
                                        <span>
                                            <img src="/figma-assets/icons/icon_comment.svg" alt="" width="14" height="12" />
                                            {it.views}
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
