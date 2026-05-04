import { useState, useRef } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import MapToolbar from './PCMapToolbar';
import {
    DISTRICTS,
    LIVING_CATS,
    DIAGNOSIS_TARGETS as TARGETS,
} from '../constants/diagnosis';
import './PCMapShared.css';
import './PCDiagnosisMap.css';

const FACILITY_BIG = ['보도', '차도', '공원/광장', '공공시설물', '공공건축', '관광시설'];
const FACILITY_MID = ['보행공간', '차량진입구역', '대지 안의 공지', '자전거도로', '시설물구역'];

const DIAG_ITEMS = [
    { id: 1, big: '주거', bigColor: '#DFF8F8', mid: '시설물(거리/골목쓰레기통 등)', title: '전기자전거 재고 불균형 해결 제안', author: '동래구 우리디자이너', region: '동래구', categoryKey: 'housing', likes: 12, views: 12, lat: 35.1665, lng: 129.0530, thumb: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=200&q=60' },
    { id: 2, big: '환경', bigColor: '#C0E6C0', mid: '시설물(거리/골목쓰레기통 등)', title: '전기자전거 재고 불균형 해결 제안', author: '동래구 시민', region: '동래구', categoryKey: 'env', likes: 12, views: 12, lat: 35.1972, lng: 129.0786, thumb: null },
    { id: 3, big: '교육', bigColor: '#FFC9C9', mid: '시설물(거리/골목쓰레기통 등)', title: '전기자전거 재고 불균형 해결 제안', author: '동래구 홍보단 홍길동', region: '동래구', categoryKey: 'edu', likes: 12, views: 12, lat: 35.1986, lng: 129.0820, thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=60' },
    { id: 4, big: '주거', bigColor: '#DFF8F8', mid: '시설물(거리/골목쓰레기통 등)', title: '전기자전거 재고 불균형 해결 제안', author: '동래구 우리디자이너', region: '동래구', categoryKey: 'housing', likes: 12, views: 12, lat: 35.1610, lng: 129.0590, thumb: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=200&q=60' },
    { id: 5, big: '환경', bigColor: '#C0E6C0', mid: '시설물(거리/골목쓰레기통 등)', title: '전기자전거 재고 불균형 해결 제안', author: '동래구 시민', region: '연제구', categoryKey: 'env', likes: 12, views: 12, lat: 35.1765, lng: 129.0790, thumb: null },
    { id: 6, big: '교육', bigColor: '#FFC9C9', mid: '시설물(거리/골목쓰레기통 등)', title: '전기자전거 재고 불균형 해결 제안', author: '동래구 홍보단 홍길동', region: '부산진구', categoryKey: 'edu', likes: 12, views: 12, lat: 35.1670, lng: 129.0610, thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=60' },
];

function CategoryIcon({ kind }) {
    const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (kind) {
        case 'grid':      return <svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
        case 'shield':    return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
        case 'home':      return <svg {...props}><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>;
        case 'briefcase': return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
        case 'book':      return <svg {...props}><path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/></svg>;
        case 'leaf':      return <svg {...props}><path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 13-9-1 8-5 13-9 13z"/><path d="M11 20s5-7 6-13"/></svg>;
        case 'heart':     return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
        case 'plus':      return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>;
        case 'bus':       return <svg {...props}><rect x="4" y="3" width="16" height="14" rx="2"/><circle cx="8" cy="20" r="1.5"/><circle cx="16" cy="20" r="1.5"/></svg>;
        default:          return null;
    }
}

export default function PCDiagnosisMap({ onNavigate }) {
    const [district, setDistrict] = useState('중구');
    const [livingCats, setLivingCats] = useState(() => new Set(['all']));
    const [bigSel, setBigSel] = useState(new Set(['보도']));
    const [midSel, setMidSel] = useState(new Set(['보행공간']));
    const [target, setTarget] = useState('all');
    const [sort, setSort] = useState('latest');
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

    const toggleSet = (setter) => (key) => setter((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
    });

    let filtered = DIAG_ITEMS;
    if (!livingCats.has('all')) filtered = filtered.filter((it) => livingCats.has(it.categoryKey));
    if (sort === 'views') filtered = [...filtered].sort((a, b) => b.views - a.views);
    if (sort === 'votes') filtered = [...filtered].sort((a, b) => b.likes - a.likes);

    const pins = filtered.map((it, idx) => ({
        ...it,
        color: '#23BDBB',
        focus: idx === 0,
    }));

    return (
        <UserPCLayout currentView="pcDiagnosisMap" onNavigate={onNavigate}>
            <div className="pc-diag-page">
                {/* LEFT FILTER PANEL */}
                <aside className="pc-diag-filter">
                    <div className="pc-diag-section">
                        <div className="pc-diag-section-label">구역별</div>
                        <div className="pc-diag-dropdown">
                            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <button className="pc-diag-dropdown-x" onClick={() => setDistrict('중구')} aria-label="초기화" type="button">×</button>
                        </div>
                    </div>

                    <div className="pc-diag-section">
                        <div className="pc-diag-section-label">생활정보</div>
                        <div className="pc-diag-cat-grid">
                            {LIVING_CATS.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    className={`pc-diag-cat-btn ${livingCats.has(c.key) ? 'active' : ''}`}
                                    onClick={() => toggleLivingCat(c.key)}
                                >
                                    <span className="pc-diag-cat-icon"><CategoryIcon kind={c.icon} /></span>
                                    <span className="pc-diag-cat-label">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pc-diag-section">
                        <div className="pc-diag-facility-title">공공/시설물</div>
                        <div className="pc-diag-section-label">대분류</div>
                        <div className="pc-diag-check-row">
                            {FACILITY_BIG.map((f) => (
                                <label key={f} className={`pc-diag-check ${bigSel.has(f) ? 'on' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={bigSel.has(f)}
                                        onChange={() => toggleSet(setBigSel)(f)}
                                    />
                                    {f}
                                </label>
                            ))}
                        </div>

                        <div className="pc-diag-section-label" style={{ marginTop: '12px' }}>중분류</div>
                        <div className="pc-diag-check-row">
                            {FACILITY_MID.map((f) => (
                                <label key={f} className={`pc-diag-check ${midSel.has(f) ? 'on' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={midSel.has(f)}
                                        onChange={() => toggleSet(setMidSel)(f)}
                                    />
                                    {f}
                                </label>
                            ))}
                        </div>

                        <div className="pc-diag-filter-actions">
                            <button type="button" className="pc-diag-btn-cancel" onClick={() => { setBigSel(new Set()); setMidSel(new Set()); }}>취소</button>
                            <button type="button" className="pc-diag-btn-confirm">확인</button>
                        </div>
                    </div>

                    <div className="pc-diag-section">
                        <div className="pc-diag-section-label">진단대상</div>
                        <div className="pc-diag-target-row">
                            {TARGETS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    className={`pc-diag-target-btn ${target === t.key ? 'on' : ''}`}
                                    onClick={() => setTarget(t.key)}
                                >{t.label}</button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* CENTER MAP */}
                <div className="pc-diag-canvas">
                    <PCMapCanvas
                        ref={mapRef}
                        pins={pins}
                        onPinClick={(p) => onNavigate?.('pcDiagnosisDetail', p)}
                        accentColor="#23BDBB"
                    />
                    <MapToolbar mapRef={mapRef} />
                    <button
                        type="button"
                        className="pc-diag-cta"
                        onClick={() => onNavigate?.('pcDiagnosisForm')}
                    >
                        + 진단하기
                    </button>
                </div>

                {/* RIGHT LIST */}
                <aside className="pc-diag-list">
                    <div className="pc-diag-list-head">
                        <div className="pc-diag-list-count">
                            <strong>{filtered.length}건</strong>
                        </div>
                        <div className="pc-diag-sort">
                            <button type="button" className={sort === 'views' ? 'active' : ''} onClick={() => setSort('views')}>조회수</button>
                            <span>|</span>
                            <button type="button" className={sort === 'votes' ? 'active' : ''} onClick={() => setSort('votes')}>좋아요</button>
                            <span>|</span>
                            <button type="button" className={sort === 'latest' ? 'active' : ''} onClick={() => setSort('latest')}>최신순</button>
                        </div>
                    </div>

                    <ul className="pc-diag-list-items">
                        {filtered.map((it) => (
                            <li
                                key={it.id}
                                className="pc-diag-card"
                                onClick={() => onNavigate?.('pcDiagnosisDetail', it)}
                            >
                                <div className="pc-diag-card-body">
                                    <div className="pc-diag-card-tags">
                                        <span className="pc-diag-tag-big" style={{ background: it.bigColor }}>{it.big}</span>
                                        <span className="pc-diag-tag-mid">{it.mid}</span>
                                    </div>
                                    <h3 className="pc-diag-card-title">{it.title}</h3>
                                    <p className="pc-diag-card-author">{it.author}</p>
                                    <div className="pc-diag-card-meta">
                                        <span>♥ {it.likes}</span>
                                        <span>👁 {it.views}</span>
                                    </div>
                                </div>
                                {it.thumb && (
                                    <div className="pc-diag-card-thumb" style={{ backgroundImage: `url(${it.thumb})` }} />
                                )}
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </UserPCLayout>
    );
}
