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
import './PCMap3.css';
import './PCDiagnosisMap.css';
import './PCDiagnosisDetail.css';
import './PCDiagnosisForm.css';
import { API_URL, authHeaders } from '../utils/api';
import { CategoryIcon } from '../constants/mapConstants';

const FACILITY_BIG = ['공간 및 가로 환경', '공공시설물', '정보 및 서비스 매체'];


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
    const [bigSel, setBigSel] = useState(new Set(['공간 및 가로 환경']));
    const [facilityMid, setFacilityMid] = useState('');
    const [facilitySub, setFacilitySub] = useState('');
    const [target, setTarget] = useState('all');
    const [sort, setSort] = useState('latest');
    const mapRef = useRef(null);

    const [panel, setPanel] = useState(initialPanel);
    const [selected, setSelected] = useState(initialItem);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        setPanel(initialPanel);
        setSelected(initialItem);
    }, [initialPanel, initialItem]);

    useEffect(() => {
        if (panel === 'detail') setSidebarOpen(true);
    }, [panel]);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/checklist/list`, { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                if (!Array.isArray(rows)) {
                    setItems([]);
                    return;
                }
                const mapped = rows.map((r) => ({
                    id: r.result_id,
                    big: r.대분류 || '주거',
                    bigColor: BIG_COLORS[r.대분류] || '#DFF8F8',
                    mid: r.중분류 || '',
                    name: r.질문기준 || r.대분류 || '진단',
                    score: r.점수 != null ? Number(r.점수).toFixed(1) : null,
                    reviewText: r.리뷰 || '',
                    region: r.진단지역 || '',
                    location: r.진단지역 || r.district_code || null,
                    date: r.created_at ? String(r.created_at).slice(0, 10) : null,
                    categoryKey: BIG_TO_KEY[r.대분류] || 'housing',
                    likes: r.likes || 0,
                    views: r.점수 || 0,
                    lat: r.위도 ? Number(r.위도) : null,
                    lng: r.경도 ? Number(r.경도) : null,
                    thumb: r.이미지경로 || null,
                    _sessionKey: `${r.ID}_${Number(r.위도 || 0).toFixed(4)}_${Number(r.경도 || 0).toFixed(4)}_${String(r.created_at || '').slice(0, 10)}`,
                    _criteria: r.질문기준 || '',
                    _score: r.점수 != null ? Number(r.점수) : null,
                })).filter((it) => it.lat && it.lng);

                // 세션 중복 제거: 같은 (user+좌표+날짜) = 한 세션, 기준별 점수를 sessionPeers로 집계
                const sessionMap = {};
                mapped.forEach((it) => {
                    const key = it._sessionKey;
                    if (!sessionMap[key]) {
                        sessionMap[key] = { ...it, sessionPeers: [] };
                    } else {
                        sessionMap[key].sessionPeers.push({ criteria: it._criteria, score: it._score });
                    }
                });
                const deduped = Object.values(sessionMap).map((it) => {
                    it.sessionPeers.unshift({ criteria: it._criteria, score: it._score });
                    return it;
                });
                setItems(deduped);
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
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

    const toggleBig = (key) => setBigSel((prev) => {
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
        color: idx === 0 ? '#23bdbb' : '#808080',
        focus: idx === 0,
    }));

    const goList = () => { setPanel('list'); setSelected(null); };
    const goDetail = (item) => { setPanel('detail'); setSelected(item); };
    const goForm = () => { setPanel('form'); };
    const goDone = () => { setPanel('done'); };

    return (
        <UserPCLayout currentView="pcDiagnosisMap" onNavigate={onNavigate}>
            <div className={`pc-diag-page${sidebarOpen ? '' : ' pc-diag-sidebar-closed'}`}>
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

                    {/* 3. 진단대상 */}
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

                    {/* 4. 공공/시설물 */}
                    <aside className="pc-diag-filter-card">
                        <div className="pc-diag-facility-title">공공/시설물</div>
                        <div className="pc-diag-section-label">대분류</div>
                        <div className="pc-diag-check-col">
                            {FACILITY_BIG.map((f) => (
                                <label key={f} className={`pc-diag-check ${bigSel.has(f) ? 'on' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={bigSel.has(f)}
                                        onChange={() => toggleBig(f)}
                                    />
                                    {f}
                                </label>
                            ))}
                        </div>

                        <div className="pc-diag-facility-divider" />

                        <div className="pc-diag-section-label">중분류</div>
                        <div className="pc-diag-dropdown pc-diag-sub-select">
                            <select value={facilityMid} onChange={(e) => setFacilityMid(e.target.value)}>
                                <option value="">선택해주세요</option>
                            </select>
                        </div>

                        <div className="pc-diag-facility-divider" />

                        <div className="pc-diag-section-label">소분류</div>
                        <div className="pc-diag-dropdown pc-diag-sub-select">
                            <select value={facilitySub} onChange={(e) => setFacilitySub(e.target.value)}>
                                <option value="">선택해주세요</option>
                            </select>
                        </div>

                        <div className="pc-diag-filter-actions">
                            <button type="button" className="pc-diag-btn-cancel" onClick={() => { setBigSel(new Set()); setFacilityMid(''); setFacilitySub(''); }}>취소</button>
                            <button type="button" className="pc-diag-btn-confirm">확인</button>
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
                        pinVariant="diagnosis"
                    />
                    <MapToolbar
                        mapRef={mapRef}
                        onToggleSidebar={() => setSidebarOpen((v) => !v)}
                        sidebarOpen={sidebarOpen}
                    />

                    {panel === 'list' && (
                        <button
                            type="button"
                            className="pc-diag-cta"
                            onClick={goForm}
                        >
                            진단하기
                        </button>
                    )}
                </div>

                {/* RIGHT PANEL — content varies by `panel` state */}
                <aside className={`pc-diag-right pc-diag-right-${panel}`}>
                    {panel === 'list' && (
                        <>
                            {loading && (
                                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#888', fontSize: '14px' }}>불러오는 중...</div>
                            )}
                            {!loading && filtered.length === 0 && (
                                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                                    {!localStorage.getItem('access_token')
                                        ? '로그인 후 진단 목록을 확인할 수 있습니다.'
                                        : '해당 조건의 진단 결과가 없습니다.'}
                                </div>
                            )}
                            <ul className="pc-diag-list-items">
                                {filtered.map((it) => (
                                    <li
                                        key={it.id}
                                        className="pc-diag-card"
                                        onClick={() => goDetail(it)}
                                    >
                                        <div className="pc-diag-card-body">
                                            <div className="pc-diag-card-tags">
                                                <span className="pc-diag-tag-fig">{it.big}</span>
                                                {it.mid && <span className="pc-diag-tag-fig">{it.mid}</span>}
                                            </div>
                                            <div className="pc-diag-card-name-row">
                                                <span className="pc-diag-card-name">{it.name}</span>
                                                {it.score != null && <span className="pc-diag-card-score">{it.score}</span>}
                                            </div>
                                            {it.reviewText && <p className="pc-diag-card-review">{it.reviewText}</p>}
                                        </div>
                                        <div
                                            className="pc-diag-card-thumb"
                                            style={it.thumb ? { backgroundImage: `url(${it.thumb})` } : undefined}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {panel === 'detail' && (
                        <PCDiagPanelDetail
                            item={selected}
                            onAddDiagnosis={goForm}
                            onBack={goList}
                            mode={target === 'expert' ? 'expert' : 'citizen'}
                        />
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
