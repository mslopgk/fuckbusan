import { useState, useRef, useEffect } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import MapToolbar from './PCMapToolbar';
import PCDiagPanelDetail from './PCDiagPanelDetail';
import PCDiagPanelForm from './PCDiagPanelForm';
import PCDiagPanelDone from './PCDiagPanelDone';
import {
    DISTRICTS,
    LIVING_CATS,
    DIAGNOSIS_TARGETS as TARGETS,
} from '../constants/diagnosis';
import './PCMapShared.css';
import './PCDiagnosisMap.css';
import './PCDiagnosisDetail.css';
import './PCDiagnosisForm.css';

const FACILITY_BIG = ['보도', '차도', '공원/광장', '공공시설물', '공공건축', '관광시설'];
const FACILITY_MID = ['보행공간', '차량진입구역', '대지 안의 공지', '자전거도로', '시설물구역'];

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const BIG_COLORS = {
    '주거': '#DFF8F8',
    '환경': '#C0E6C0',
    '교육': '#FFC9C9',
    '교통': '#FFE2B5',
    '안전': '#FFD0D0',
    '산업·일자리': '#E5DDFF',
    '문화·여가': '#FFD9F0',
    '보건·복지': '#D0E8FF',
};

const BIG_TO_KEY = {
    '주거': 'housing',
    '환경': 'env',
    '교육': 'edu',
    '교통': 'traffic',
    '안전': 'safety',
    '산업·일자리': 'work',
    '문화·여가': 'culture',
    '보건·복지': 'health',
};

function CategoryIcon({ kind }) {
    const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (kind) {
        // 전체: 9 dots in 3x3 grid (Figma)
        case 'grid':
            return (
                <svg {...props} fill="currentColor" stroke="none">
                    {[0,1,2].map((r) => [0,1,2].map((c) => (
                        <circle key={`${r}-${c}`} cx={6 + c * 6} cy={6 + r * 6} r="1.6" />
                    )))}
                </svg>
            );
        // 안전: 방패 + 십자가 / 의료
        case 'shield':
            return (
                <svg {...props}>
                    <path d="M12 21s7-3.5 7-9V6l-7-3-7 3v6c0 5.5 7 9 7 9z"/>
                    <path d="M12 9v6M9 12h6"/>
                </svg>
            );
        // 주거: 집 (Figma 라인 아이콘)
        case 'home':
            return (
                <svg {...props}>
                    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>
                </svg>
            );
        // 산업·일자리: 브리프케이스
        case 'briefcase':
            return (
                <svg {...props}>
                    <rect x="3" y="7" width="18" height="13" rx="2"/>
                    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                    <path d="M3 12h18"/>
                </svg>
            );
        // 교육: 졸업모자 (mortarboard)
        case 'book':
            return (
                <svg {...props}>
                    <path d="M2 9l10-4 10 4-10 4z"/>
                    <path d="M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4"/>
                    <path d="M22 9v4"/>
                </svg>
            );
        // 환경: 나무 / 산
        case 'leaf':
            return (
                <svg {...props}>
                    <path d="M12 3l-4 6h2l-3 5h2l-4 6h14l-4-6h2l-3-5h2z"/>
                    <path d="M12 20v2"/>
                </svg>
            );
        // 문화·여가: 게임패드
        case 'heart':
            return (
                <svg {...props}>
                    <rect x="2" y="7" width="20" height="11" rx="3"/>
                    <circle cx="8" cy="12.5" r="1" fill="currentColor"/>
                    <path d="M7 11v3M5.5 12.5h3"/>
                    <circle cx="16" cy="11" r="1.2" fill="currentColor"/>
                    <circle cx="18" cy="14" r="1.2" fill="currentColor"/>
                </svg>
            );
        // 보건·복지: 손 위에 하트
        case 'plus':
            return (
                <svg {...props}>
                    <path d="M12 17l-4-4a2.5 2.5 0 0 1 3.5-3.5l.5.5.5-.5A2.5 2.5 0 0 1 16 13z"/>
                    <path d="M3 14a3 3 0 0 1 3-3h2v8H6a3 3 0 0 1-3-3z"/>
                    <path d="M21 14a3 3 0 0 0-3-3h-2v8h2a3 3 0 0 0 3-3z"/>
                </svg>
            );
        // 교통: 버스
        case 'bus':
            return (
                <svg {...props}>
                    <path d="M5 17V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v10"/>
                    <rect x="5" y="7" width="14" height="7" rx="1"/>
                    <circle cx="8" cy="18" r="1.5"/>
                    <circle cx="16" cy="18" r="1.5"/>
                    <path d="M5 14h14"/>
                </svg>
            );
        default:          return null;
    }
}

/**
 * PC 진단 통합 셸. 지도 + 좌측 필터 + 우측 패널.
 * 우측 패널은 panel state에 따라 list / detail / form / done 콘텐츠를 렌더.
 *
 * App.jsx의 라우팅 view 4종 (pcDiagnosisMap/Detail/Form/Done) 모두 이 컴포넌트를
 * 다른 initialPanel prop으로 호출. 화면 전환은 라우팅 없이 내부 panel state로 처리.
 */
export default function PCDiagnosisMap({ onNavigate, initialPanel = 'list', initialItem = null }) {
    const [district, setDistrict] = useState('중구');
    const [livingCats, setLivingCats] = useState(() => new Set(['all']));
    const [bigSel, setBigSel] = useState(new Set(['보도']));
    const [midSel, setMidSel] = useState(new Set(['보행공간']));
    const [target, setTarget] = useState('all');
    const [sort, setSort] = useState('latest');
    const mapRef = useRef(null);

    const [panel, setPanel] = useState(initialPanel);
    const [selected, setSelected] = useState(initialItem);
    const [items, setItems] = useState([]);

    useEffect(() => {
        setPanel(initialPanel);
        setSelected(initialItem);
    }, [initialPanel, initialItem]);

    useEffect(() => {
        fetch(`${API_URL}/checklist/list`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                if (!Array.isArray(rows)) {
                    setItems([]);
                    return;
                }
                setItems(rows.map((r) => ({
                    id: r.result_id,
                    big: r.대분류 || '주거',
                    bigColor: BIG_COLORS[r.대분류] || '#DFF8F8',
                    mid: r.중분류 || '',
                    title: r.리뷰 || `${r.대분류 || ''} 진단`,
                    author: r.ID || '익명',
                    region: r.진단지역 || '',
                    categoryKey: BIG_TO_KEY[r.대분류] || 'housing',
                    likes: 0,
                    views: r.점수 || 0,
                    lat: r.위도 ? Number(r.위도) : null,
                    lng: r.경도 ? Number(r.경도) : null,
                    thumb: r.이미지경로 || null,
                })).filter((it) => it.lat && it.lng));
            })
            .catch(() => setItems([]));
    }, []);

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

    let filtered = items;
    if (district && district !== '중구') filtered = filtered.filter((it) => it.region === district);
    if (!livingCats.has('all')) filtered = filtered.filter((it) => livingCats.has(it.categoryKey));
    if (sort === 'views') filtered = [...filtered].sort((a, b) => b.views - a.views);
    if (sort === 'votes') filtered = [...filtered].sort((a, b) => b.likes - a.likes);

    const pins = filtered.map((it, idx) => ({
        ...it,
        color: '#23BDBB',
        focus: idx === 0,
    }));

    const goList = () => { setPanel('list'); setSelected(null); };
    const goDetail = (item) => { setPanel('detail'); setSelected(item); };
    const goForm = () => { setPanel('form'); };
    const goDone = () => { setPanel('done'); };

    return (
        <UserPCLayout currentView="pcDiagnosisMap" onNavigate={onNavigate}>
            <div className="pc-diag-page">
                {/* LEFT FILTER STACK — 4 separate cards */}
                <div className="pc-diag-filter-stack">
                    {/* 1. 구역별 */}
                    <aside className="pc-diag-filter-card">
                        <div className="pc-diag-section-label">구역별</div>
                        <div className="pc-diag-dropdown">
                            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <button className="pc-diag-dropdown-x" onClick={() => setDistrict('중구')} aria-label="초기화" type="button">×</button>
                        </div>
                    </aside>

                    {/* 2. 생활정보 */}
                    <aside className="pc-diag-filter-card">
                        <div className="pc-diag-facility-title">생활정보</div>
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
                    </aside>

                    {/* 3. 공공/시설물 */}
                    <aside className="pc-diag-filter-card">
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
                    </aside>

                    {/* 4. 진단대상 */}
                    <aside className="pc-diag-filter-card">
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
                    </aside>

                    {panel !== 'list' && (
                        <button type="button" className="pc-diag-back-btn" onClick={goList}>
                            ← 목록으로
                        </button>
                    )}
                </div>

                {/* CENTER MAP */}
                <div className="pc-diag-canvas">
                    <PCMapCanvas
                        ref={mapRef}
                        pins={pins}
                        onPinClick={panel === 'list' ? goDetail : undefined}
                        accentColor="#23BDBB"
                    />
                    <MapToolbar mapRef={mapRef} />
                    {panel === 'list' && (
                        <button
                            type="button"
                            className="pc-diag-cta"
                            onClick={goForm}
                        >
                            + 진단하기
                        </button>
                    )}
                </div>

                {/* RIGHT PANEL — content varies by `panel` state */}
                <aside className={`pc-diag-right pc-diag-right-${panel}`}>
                    {panel === 'list' && (
                        <>
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
                                        onClick={() => goDetail(it)}
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
                        </>
                    )}

                    {panel === 'detail' && (
                        <PCDiagPanelDetail item={selected} onAddDiagnosis={goForm} />
                    )}

                    {panel === 'form' && (
                        <PCDiagPanelForm onCancel={goList} onSubmit={goDone} />
                    )}

                    {panel === 'done' && (
                        <PCDiagPanelDone onClose={goList} />
                    )}
                </aside>
            </div>
        </UserPCLayout>
    );
}
