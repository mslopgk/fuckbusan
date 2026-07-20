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
import { RegionFilterCard, LifeRail } from './filters/MapFilterPanel';
import { catIcon } from './filters/catIcons';
import { matchDistrict, nearestDistrict } from '../utils/format';
import { DISTRICT_CENTERS } from '../constants/mapConstants';
import './PCMapShared.css';
import './PCMap3.css';
import './PCDiagnosisMap.css';
import './PCDiagnosisDetail.css';
import './PCDiagnosisForm.css';
import { API_URL, authHeaders } from '../utils/api';

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
    '문화·여가': 'leisure',
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
    const [district, setDistrict] = useState('');
    const [livingCats, setLivingCats] = useState(() => new Set(['all']));
    // 대분류 체크박스 옵션은 '공공/시설물'(전문가 진단의 세부 시설 분류 체계)에서만 의미가 있음.
    // 시민 대분류(주거/환경 등 생활정보)는 이미 좌측 LifeRail(livingCats)에서 다루므로 여기선 제외.
    // 기본값은 미선택(전체) — 하드코딩된 라벨이 실제 데이터와 매칭되지 않아 전건이 걸러지는 것을 방지.
    const [bigSel, setBigSel] = useState(() => new Set());
    const [facilityMid, setFacilityMid] = useState('');
    const [facilitySub, setFacilitySub] = useState('');
    // 진단대상 기본값 = '전체'. 첫 진입부터 핀/우측 목록이 보이도록 한다(사용자 확정).
    // 참고: Figma 302:5843 은 진단대상 미선택(빈 화면) 상태를 그리고 있고 75f5105 에서 그에 맞춰
    // useState('') 로 두었으나, 빈 화면으로 진입하는 UX 문제로 '전체' 기본 선택으로 되돌린다.
    // 302:5562(전체)/302:4773·4977(시민)/302:5178·5370(전문가) 는 선택 후 상태.
    const [target, setTarget] = useState('all');
    const [sort, setSort] = useState('latest');
    const mapRef = useRef(null);
    const geocodeReqRef = useRef(0);

    const [panel, setPanel] = useState(initialPanel);
    const [selected, setSelected] = useState(initialItem);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        setPanel(initialPanel);
        setSelected(initialItem);
    }, [initialPanel, initialItem]);

    useEffect(() => {
        if (panel === 'detail') setSidebarOpen(true);
    }, [panel]);

    useEffect(() => {
        setLoading(true);
        // 백엔드 기본 limit=100이라 최신 100건만 오던 문제 — 서버 상한(500)까지 요청
        fetch(`${API_URL}/checklist/list?limit=500`, { headers: authHeaders() })
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
                    targetType: r.진단대상 || '',
                    _sessionKey: `${r.ID}_${Number(r.위도 || 0).toFixed(4)}_${Number(r.경도 || 0).toFixed(4)}_${String(r.created_at || '').slice(0, 10)}`,
                    _criteria: r.질문기준 || '',
                    _score: r.점수 != null ? Number(r.점수) : null,
                })).filter((it) => it.lat != null && it.lng != null && !isNaN(it.lat) && !isNaN(it.lng));

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
    }, [refreshKey]);

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
    // 진단지역이 '부산역' 같은 장소명이라 구 이름 직접 비교로는 항상 0건이던 문제 —
    // 장소명 매칭 실패 시 좌표 기반 최근접 구·군으로 판정 (모바일 제보/제안맵과 동일 패턴)
    if (district) filtered = filtered.filter((it) =>
        matchDistrict(it.region, district)
        || matchDistrict(nearestDistrict(it.lat, it.lng, DISTRICT_CENTERS), district));
    if (!livingCats.has('all')) filtered = filtered.filter((it) => livingCats.has(it.categoryKey));
    if (bigSel.size > 0) filtered = filtered.filter((it) => bigSel.has(it.big));
    if (facilityMid) filtered = filtered.filter((it) => it.mid === facilityMid);
    if (target === 'citizen') filtered = filtered.filter((it) => it.targetType === '시민');
    else if (target === 'expert') filtered = filtered.filter((it) => it.targetType === '전문가');
    else if (!target) filtered = []; // Figma 302:5843 — 진단대상 선택 전에는 데이터 미표시
    if (sort === 'views') filtered = [...filtered].sort((a, b) => b.views - a.views);
    if (sort === 'votes') filtered = [...filtered].sort((a, b) => b.likes - a.likes);

    // 디테일 모드 — Figma 302:6328: 다른 핀은 유지, 선택 핀만 focus(확대) 표시.
    // 핀 셋 개수가 동일하게 유지되므로 클러스터 재계산에 의한 순간이동 없음.
    const pins = (panel === 'detail' && selected)
        ? [
            ...filtered.filter((it) => it.id !== selected.id).map((it) => ({ ...it, focus: false })),
            { ...selected, focus: true },
        ]
        : filtered.map((it) => ({ ...it, focus: false }));

    const goList = () => { setPanel('list'); setSelected(null); };
    const goDetail = (item) => { setPanel('detail'); setSelected(item); };
    const goForm = (loc) => {
        if (loc) setSelectedLocation(loc);
        setPanel('form');
    };
    const goDone = () => { setPanel('done'); setRefreshKey((k) => k + 1); };

    // 우측 패널이 실제로 렌더되는지. 목록이 비면 패널 자체가 없으므로(아래 렌더 조건과 동일),
    // 그때는 지도 툴바가 패널 자리(431px 안쪽)에 떠 있지 않고 화면 오른쪽 끝에 붙어야 한다.
    const hasRightPanel = panel !== 'list' || (!loading && filtered.length > 0);

    return (
        <UserPCLayout currentView="pcDiagnosisMap" onNavigate={onNavigate}>
            <div className={`pc-diag-page${sidebarOpen ? '' : ' pc-diag-sidebar-closed'}${hasRightPanel ? '' : ' pc-diag-no-panel'}`}>
                {/* LEFT FILTER STACK — 1행: 구역별(전체폭) / 2행: 생활정보 rail | 진단대상+공공시설물 (2열) */}
                <div className="pc-diag-filter-stack pc-diag-filter-stack--rail">
                    {/* 1. 구역별 */}
                    <RegionFilterCard
                        value={district || null}
                        onSelect={(v) => setDistrict(v || '')}
                        options={DISTRICTS}
                        accent="#23BDBB"
                        placeholder="설정해주세요"
                    />

                    <div className="pc-diag-filter-row2">
                        {/* 2. 생활정보 */}
                        <LifeRail
                            categories={LIVING_CATS.map((c) => ({ key: c.key, label: c.label, icon: catIcon(c.label) }))}
                            isOn={(c) => livingCats.has(c.key)}
                            onChange={(c) => toggleLivingCat(c.key)}
                            accent="#23BDBB"
                        />

                        <div className="pc-diag-filter-col2">
                            {/* 3. 진단대상 */}
                            <aside className="pc-diag-filter-card">
                                <div className="pc-diag-section-label">진단대상</div>
                                <div className="pc-diag-target-row">
                                    {TARGETS.map((t) => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            className={`pc-diag-target-btn pc-diag-target-btn--${t.key} ${target === t.key ? 'on' : ''}`}
                                            onClick={() => setTarget(t.key)}
                                        >{t.label}</button>
                                    ))}
                                </div>
                            </aside>

                            {/* 4. 공공/시설물 */}
                            <aside className="pc-diag-filter-card">
                                <div className="pc-diag-facility-title">공공/시설물</div>
                                <div className="pc-diag-sub-title">대분류</div>
                                <div className="pc-diag-check-col">
                                    {[...new Set(
                                        items
                                            .filter((it) => it.targetType === '전문가')
                                            .map((it) => it.big)
                                            .filter(Boolean)
                                    )].sort().map((f) => (
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

                                <div className="pc-diag-sub-title">중분류</div>
                                <div className="pc-diag-dropdown pc-diag-sub-select">
                                    <select value={facilityMid} onChange={(e) => setFacilityMid(e.target.value)}>
                                        <option value="">선택해주세요</option>
                                        {[...new Set(items.map((it) => it.mid).filter(Boolean))].sort().map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pc-diag-facility-divider" />

                                <div className="pc-diag-sub-title">소분류</div>
                                <div className="pc-diag-dropdown pc-diag-sub-select">
                                    {/* 진단 데이터에 소분류 차원 없음 — 추후 데이터 추가 시 활성화 */}
                                    <select value={facilitySub} onChange={(e) => setFacilitySub(e.target.value)} disabled>
                                        <option value="">선택해주세요</option>
                                    </select>
                                </div>

                                <div className="pc-diag-filter-actions">
                                    <button type="button" className="pc-diag-btn-cancel" onClick={() => { setBigSel(new Set()); setFacilityMid(''); setFacilitySub(''); }}>취소</button>
                                    <button type="button" className="pc-diag-btn-confirm" onClick={() => setRefreshKey((k) => k + 1)}>확인</button>
                                </div>
                            </aside>
                        </div>
                    </div>

                    {/* Figma 302:6328/7903/8581 — 좌측 하단 '목록으로' 부유 버튼 없음 (패널 내 chevron으로 복귀) */}
                </div>

                {/* CENTER MAP */}
                <div className="pc-diag-canvas">
                    <PCMapCanvas
                        ref={mapRef}
                        pins={pins}
                        onPinClick={(it) => {
                            goDetail(it);
                            // 기존 핀 클릭 시 선택 위치(초록 핀) 해제
                            setSelectedLocation(null);
                        }}
                        selectedDistrict={district}
                        onMapClick={(coords) => {
                            if (panel !== 'list') goList();
                            setSelectedLocation({ ...coords, address: '선택된 위치' });
                            if (window.kakao?.maps?.services) {
                                const reqId = ++geocodeReqRef.current;
                                const geocoder = new window.kakao.maps.services.Geocoder();
                                geocoder.coord2Address(coords.lng, coords.lat, (result, status) => {
                                    if (reqId !== geocodeReqRef.current) return;
                                    const addr = status === window.kakao.maps.services.Status.OK
                                        ? (result[0]?.road_address?.address_name || result[0]?.address?.address_name || '선택된 위치')
                                        : '선택된 위치';
                                    setSelectedLocation({ ...coords, address: addr });
                                });
                            }
                        }}
                        accentColor="#23BDBB"
                        pinVariant="diagnosis"
                        selectedPoint={panel === 'list' ? selectedLocation : null}
                    />
                    <MapToolbar
                        mapRef={mapRef}
                        onToggleSidebar={() => setSidebarOpen((v) => !v)}
                        sidebarOpen={sidebarOpen}
                        showPerson={false}
                    />

                    {panel === 'list' && (
                        <div className="pc-diag-cta-wrap">
                            {selectedLocation ? (
                                <div className="pc-diag-cta-addr">
                                    <span>📍 {selectedLocation.address}</span>
                                    <button
                                        type="button"
                                        className="pc-diag-cta-clear"
                                        onClick={() => setSelectedLocation(null)}
                                        title="위치 선택 해제"
                                    >×</button>
                                </div>
                            ) : (
                                <div className="pc-diag-cta-hint">지도를 클릭해 진단할 위치를 선택하세요</div>
                            )}
                            <button
                                type="button"
                                className={`pc-diag-cta${!selectedLocation ? ' disabled' : ''}`}
                                disabled={!selectedLocation}
                                onClick={() => selectedLocation && goForm(selectedLocation)}
                            >
                                진단하기
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL — content varies by `panel` state.
                    Figma 302:5843: 목록이 비어 있으면(진단대상 선택 전 포함) 우측 패널 자체가 없음 */}
                {hasRightPanel && (
                <aside className={`pc-diag-right pc-diag-right-${panel}`}>
                    {panel === 'list' && (
                        <>
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
                            mode={selected?.targetType === '전문가' ? 'expert' : 'citizen'}
                        />
                    )}

                    {panel === 'form' && (
                        <PCDiagPanelForm onCancel={goList} onSubmit={goDone} location={selectedLocation} mode={target === 'expert' ? 'expert' : 'citizen'} />
                    )}

                    {panel === 'done' && (
                        <PCDiagPanelDone onClose={goList} />
                    )}
                </aside>
                )}
            </div>
        </UserPCLayout>
    );
}
