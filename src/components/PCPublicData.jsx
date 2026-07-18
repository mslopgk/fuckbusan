import { useEffect, useMemo, useRef, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import BusanMap from './BusanMap';
import { LifeRail } from './filters/MapFilterPanel';
import { API_URL } from '../utils/api';
import './PublicData2.css';

/* PC 공공데이터 — Figma TCuOzEqNhoLKjhF0reBDks node 302:8774 정합.
   좌: 구역별 필터 카드 + 생활정보 세로 사이드바 / 중앙: 부산 지도 + 우측 지도 툴바
   우: KPI 패널(전체=전 지표 스크롤 / 카테고리=해당 지표 + 선택 지표 상세 카드).
   ⚠️ 값은 백엔드(/api/public-data/overview) 미연동 시 '준비중' placeholder — 통계 수치 날조 금지. */

// KPI 카드: icon 은 숫자(→ /assets/publicdata/kpi/image{n}.png) 또는 직접 경로 문자열.
const KPI = (label, icon, key) => ({
    label,
    icon: typeof icon === 'number' ? `/assets/publicdata/kpi/image${icon}.png` : icon,
    key,
});
const H = (name) => `/assets/publicdata/kpi/housing/${name}.png`; // 주거 전용 아이콘 (Figma 302:9933 export)
const CI = (name) => `/figma-assets/living-icons/${name}.svg`;    // 사이드바 카테고리 아이콘 (프로젝트 공용)

// 생활정보 카테고리 (Figma 302:8777 순서 = 전체/산업/문화/안전/교육/보건/주거/환경/교통)
// 지표 순서·아이콘 = 각 카테고리 KPI 패널 그룹(302:9767/10003/9894/10112/10073/9933/9972/10034) 실측.
const CATS = [
    { key: 'all', label: '전체', icon: CI('all') },
    { key: '산업일자리', label: '산업 일자리', icon: CI('badge'), metrics: [
        KPI('청년층 순 이동율', 215), KPI('고용율', 216), KPI('실업율', 217),
        KPI('근로여건 만족도(%)', 218), KPI('1인당 GRDP', 219), KPI('월평균 가구소득', 220),
        KPI('사업체수 증감율', 221), KPI('종사자수 증감율', 222),
    ] },
    { key: '문화여가', label: '문화·여가', icon: CI('game'), metrics: [
        KPI('공공체육시설 수', 253), KPI('공원 수', 256), KPI('공공도서관 수', 259, '공공도서관'),
        KPI('인터넷이용율', 254), KPI('문화예술행사 관람율', 255), KPI('문화예술행사 만족도', 257),
        KPI('지자체 문화예술 예산', 260),
    ] },
    { key: '안전', label: '안전', icon: CI('safety'), metrics: [
        KPI('사회안전 인식도', 225), KPI('안전체감도', 228), KPI('빈집비율', 233),
        KPI('경찰서 수', 226), KPI('소방서 수', 229), KPI('CCTV수', 232, 'CCTV'),
        KPI('주요 범죄발생 건수', 227), KPI('비상벨 수', 230), KPI('사고위험지역', 231),
    ] },
    { key: '교육', label: '교육', icon: CI('edu'), metrics: [
        KPI('유치원수/학생수', 271), KPI('초등학교 수/학생수', 273), KPI('중학교 수/학생수', 275),
        KPI('고등학교 수/학생수', 272), KPI('사설학원수', 277), KPI('통학길 만족도(%)', 274),
        KPI('학생의 학교생활 만족도(%)', 276),
    ] },
    { key: '보건', label: '보건·복지', icon: CI('care'), metrics: [
        KPI('의료시설 수', 261), KPI('의료인력 수', 264), KPI('의료시설 만족도', 266),
        KPI('사회복지시설 수', 262), KPI('노인복지시설 수', 270), KPI('스트레스인지율', 265),
        KPI('사망률', 267), KPI('자살율', 268), KPI('출산율', 269),
    ] },
    { key: '주거', label: '주거', icon: CI('home'), metrics: [
        KPI('보행환경 만족도', H('walk')), KPI('노후주택비율', H('oldhouse')), KPI('인구증감율', H('popchange')),
        KPI('연령별 인구비율', H('agepop')), KPI('고령화지수', H('aging')), KPI('소음도', H('noise')),
        KPI('녹지율', H('green')), KPI('주차장 이용 만족도', H('parking')), KPI('나홀로가구현황', H('alone')),
    ] },
    { key: '환경', label: '환경', icon: CI('forest'), metrics: [
        KPI('대기오염 지수', 234, '미세먼지'), KPI('공원면적비', 237), KPI('하수도보급율', 242),
        KPI('생활폐기물 발생량', 235), KPI('사업자폐기물발생량', 238), KPI('재활용비율', 241),
        KPI('소음도', '/assets/publicdata/kpi/noise.png'),
    ] },
    { key: '교통', label: '교통', icon: CI('bus'), metrics: [
        KPI('대중 교통 이용 승객 수', 243), KPI('교통사고비율', 245, '교통사고'), KPI('교통안전지수', 248),
        KPI('대중교통 이용 만족도', 244), KPI('어린이보호구역', 246), KPI('노인보호구역', 247),
        KPI('자전거도로 현황', 249), KPI('사고다발지역', 252), KPI('전기자전거 이용 현황', 251),
    ] },
];

// 전체 모드 카드 순서 — Figma 302:8879(Frame 733) 실측 순서 그대로 (주거 지표는 전체 목록에 없음).
const ALL_ORDER = [
    '청년층 순 이동율', '고용율', '실업율',
    '근로여건 만족도(%)', '1인당 GRDP', '월평균 가구소득',
    '사업체수 증감율', '종사자수 증감율', '사고위험지역',
    '사회안전 인식도', '안전체감도', '빈집비율',
    '경찰서 수', '소방서 수', 'CCTV수',
    '주요 범죄발생 건수', '비상벨 수', '소음도',
    '대기오염 지수', '공원면적비', '하수도보급율',
    '생활폐기물 발생량', '사업자폐기물발생량', '재활용비율',
    '대중 교통 이용 승객 수', '교통사고비율', '교통안전지수',
    '대중교통 이용 만족도', '어린이보호구역', '노인보호구역',
    '자전거도로 현황', '사고다발지역', '전기자전거 이용 현황',
    '공공체육시설 수', '공원 수', '공공도서관 수',
    '인터넷이용율', '문화예술행사 관람율', '문화예술행사 만족도',
    '지자체 문화예술 예산', '의료시설 수', '의료인력 수',
    '사회복지시설 수', '노인복지시설 수', '스트레스인지율',
    '사망률', '자살율', '출산율',
    '의료시설 만족도', '유치원수/학생수', '초등학교 수/학생수',
    '고등학교 수/학생수', '사설학원수', '통학길 만족도(%)',
    '중학교 수/학생수', '학생의 학교생활 만족도(%)',
];
// 라벨 → 지표 정의 (주거 제외 우선 — '소음도'는 환경 아이콘이 전체 목록의 아이콘)
const METRIC_BY_LABEL = (() => {
    const map = new Map();
    for (const c of CATS) {
        if (!c.metrics || c.key === '주거') continue;
        for (const m of c.metrics) if (!map.has(m.label)) map.set(m.label, m);
    }
    return map;
})();
const ALL_CARDS = ALL_ORDER.map((l) => METRIC_BY_LABEL.get(l)).filter(Boolean);

const GUGUN = ['부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구'];

// 지도 값 버블 위치용 구·군 박스/센트로이드 — BusanMap.jsx(수정 금지) 내부 상수와 동일 값 복제.
// 좌표계: 메인 지도 프레임 750.48×572.98 (BusanMap stage와 동일).
const MAP_VBW = 750.48;
const MAP_VBH = 572.98;
const MAP_BOX = {
    강서구: [0, 250.87, 290.94, 252.45], 사상구: [231.50, 311.47, 97.20, 131.77],
    북구: [288.90, 177.37, 95.24, 149.38], 금정구: [353.93, 131.70, 155.91, 160.47],
    기장군: [462.15, 0, 288.33, 338.56], 동래구: [363.14, 263.99, 101.11, 59.36],
    연제구: [367.04, 310.23, 101.11, 61.97], 부산진구: [321.45, 308.86, 100.46, 110.90],
    해운대구: [462.80, 230.14, 150.69, 159.17], 수영구: [439.04, 339.51, 51.81, 64.58],
    남구: [385.97, 373.44, 108.29, 101.11], 사하구: [200.84, 428.82, 121.99, 144.17],
    서구: [293.40, 404.68, 49.58, 139.60], 동구: [331.82, 396.85, 58.06, 49.58],
    중구: [329.21, 441.15, 52.84, 41.10], 영도구: [340.82, 460.06, 103.07, 93.28],
};
const MAP_CENTROID = {
    강서구: [0.535, 0.516], 사상구: [0.524, 0.506], 북구: [0.474, 0.556], 금정구: [0.497, 0.498],
    기장군: [0.474, 0.441], 동래구: [0.508, 0.528], 연제구: [0.576, 0.42], 부산진구: [0.428, 0.497],
    해운대구: [0.42, 0.572], 수영구: [0.483, 0.481], 남구: [0.488, 0.531], 사하구: [0.519, 0.447],
    서구: [0.5, 0.22], 동구: [0.553, 0.494], 중구: [0.492, 0.443], 영도구: [0.521, 0.505],
};
const BUBBLE_Y_OFFSET = 30; // 구 이름 라벨 아래로 내리는 오프셋 (stage px)

// 구·군청 대표 위경도(근사) — "내 위치" 버튼에서 브라우저 geolocation 결과와 최근접 구 매칭용.
const GUGUN_LATLNG = {
    강서구: [35.2124, 128.9806], 사상구: [35.1524, 128.9909], 북구: [35.1970, 129.0061],
    금정구: [35.2430, 129.0921], 기장군: [35.2443, 129.2223], 동래구: [35.1955, 129.0835],
    연제구: [35.1762, 129.0796], 부산진구: [35.1627, 129.0530], 해운대구: [35.1631, 129.1636],
    수영구: [35.1455, 129.1132], 남구: [35.1365, 129.0843], 사하구: [35.1043, 128.9747],
    서구: [35.0975, 129.0242], 동구: [35.1294, 129.0454], 중구: [35.1002, 129.0324],
    영도구: [35.0912, 129.0680],
};

const MAP_ZOOM_MIN = 0.7;
const MAP_ZOOM_MAX = 1.8;
const MAP_ZOOM_STEP = 0.15;

// 지도 우측 상단 툴바 (Figma 302:8820 실측): 버튼 48x48, 아이콘 전부 24px.
// 지도 버튼만 teal(#23bdbb) 배경+흰 아이콘, 애널리틱스 버튼도 teal+흰 아이콘(r12 별도 카드).
// 아이콘은 Figma 302:8823~8834 아이콘 노드를 4x PNG 로 직접 export (글리프 색 원본 그대로,
// CSS 필터·대체 에셋 사용 안 함).
// ⚠️ 이 지도는 카카오맵이 아닌 자체 SVG 구역 지도(BusanMap) — zoom/locate 는 CSS transform + geolocation.
const TB = '/figma-assets/icons/pubd-toolbar';
const TOOLS_MAIN = [
    { icon: `${TB}/tb_my_location.png`, title: '내 위치', key: 'locate' },
    { icon: `${TB}/tb_add.png`, title: '확대', key: 'in' },
    { icon: `${TB}/tb_remove.png`, title: '축소', key: 'out' },
    { icon: `${TB}/tb_map.png`, title: '지도', key: 'map', active: true },
    { icon: `${TB}/tb_satellite.png`, title: '위성', key: 'sat' },
];

function MapToolbar({ zoom, onZoomIn, onZoomOut, onLocate }) {
    const handlerFor = (key) => {
        if (key === 'in') return onZoomIn;
        if (key === 'out') return onZoomOut;
        if (key === 'locate') return onLocate;
        return undefined;
    };
    const disabledFor = (key) => {
        if (key === 'in') return zoom >= MAP_ZOOM_MAX;
        if (key === 'out') return zoom <= MAP_ZOOM_MIN;
        return false;
    };
    return (
        <div className="pubd-toolbar">
            <div className="pubd-tool-group">
                {TOOLS_MAIN.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        title={t.title}
                        className={`pubd-tool-btn${t.active ? ' active' : ''}`}
                        onClick={handlerFor(t.key)}
                        disabled={disabledFor(t.key)}
                    >
                        <img src={t.icon} alt="" aria-hidden="true" />
                    </button>
                ))}
            </div>
            <div className="pubd-tool-group pubd-tool-group--analytics">
                <button type="button" title="통계" className="pubd-tool-btn active">
                    <img src={`${TB}/tb_analytics.png`} alt="" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

export default function PCPublicData({ onNavigate }) {
    const [region, setRegion] = useState(null);     // null = 전체(부산)
    const [cat, setCat] = useState('all');
    const [stats, setStats] = useState([]);          // theme_stats (백엔드)
    const [sortAsc, setSortAsc] = useState(false);   // false = Figma 기본(카테고리 순서)
    const [selMetric, setSelMetric] = useState(null); // 카테고리 모드 선택 지표
    const [mapZoom, setMapZoom] = useState(1);        // 지도 확대/축소 (CSS transform scale)

    useEffect(() => {
        const q = region ? `?region=${encodeURIComponent(region)}` : '';
        fetch(`${API_URL}/api/public-data/overview${q}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setStats(Array.isArray(d?.theme_stats) ? d.theme_stats : []))
            .catch(() => {});
    }, [region]);

    const zoomIn = () => setMapZoom((z) => Math.min(MAP_ZOOM_MAX, +(z + MAP_ZOOM_STEP).toFixed(2)));
    const zoomOut = () => setMapZoom((z) => Math.max(MAP_ZOOM_MIN, +(z - MAP_ZOOM_STEP).toFixed(2)));

    // 내 위치: 브라우저 geolocation → 부산 구·군 중 최근접 구 선택(구역별 필터와 동일 state 재사용).
    const locateMe = () => {
        if (!navigator.geolocation) {
            alert('이 브라우저는 위치 확인 기능을 지원하지 않습니다.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (latitude < 34.8 || latitude > 35.5 || longitude < 128.5 || longitude > 129.5) {
                    alert('부산 지역 밖에 있어 위치를 표시할 수 없습니다.');
                    return;
                }
                let best = null;
                let bestDist = Infinity;
                for (const [name, [lat, lng]] of Object.entries(GUGUN_LATLNG)) {
                    const d = Math.hypot(lat - latitude, lng - longitude);
                    if (d < bestDist) { bestDist = d; best = name; }
                }
                if (best) setRegion(best);
            },
            () => alert('위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해주세요.'),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const activeCat = CATS.find((c) => c.key === cat);
    const isAll = cat === 'all';

    // 지표 → 백엔드 stats row 매칭. 없으면 null → '준비중' 표기 (수치 날조 금지).
    // 구 선택 시 해당 구 데이터만 사용 — 다른 지역 값을 선택 구 값처럼 보여주지 않는다(오귀속 금지).
    const rowsFor = (m) => {
        if (!m) return [];
        const needle = m.key || m.label;
        return stats.filter((s) => (s.metric || '').includes(needle));
    };
    const hitFor = (m) => {
        const rows = rowsFor(m);
        if (region) return rows.find((s) => s.region === region) || null;
        return rows.find((s) => s.region === '부산') || rows[0] || null;
    };
    const valueFor = (m) => hitFor(m)?.value_text || null;

    const cards = useMemo(() => {
        // 전체 모드 순서 = Figma 302:8879 실측 순서(ALL_CARDS), 카테고리 모드 = 해당 카테고리 순서
        let list = isAll ? ALL_CARDS : (activeCat?.metrics || []);
        if (sortAsc) list = [...list].sort((a, b) => a.label.localeCompare(b.label, 'ko'));
        return list;
    }, [cat, sortAsc, isAll, activeCat]);

    // 지도 값 버블 (Figma 302:9132/9670) — 카테고리 모드에서 지표 선택 시.
    // 구 선택: 선택 구 위 흰 버블(값 없으면 '준비중') / 전체: 실데이터 있는 구에만 회색 버블 (값 날조 금지).
    const bubbles = useMemo(() => {
        if (isAll || !selMetric) return [];
        const rows = rowsFor(selMetric);
        if (region) {
            const hit = rows.find((s) => s.region === region) || null;
            return [{ name: region, text: hit?.value_text || '준비중', sel: true }];
        }
        return GUGUN
            .map((g) => ({ name: g, text: rows.find((s) => s.region === g)?.value_text, sel: false }))
            .filter((b) => b.text);
    }, [isAll, selMetric, region, stats]); // eslint-disable-line react-hooks/exhaustive-deps

    // BusanMap(수정 금지) stage의 팬/줌 transform을 오버레이에 동기화 — DOM 관찰 방식
    const mapStackRef = useRef(null);
    const [stageTf, setStageTf] = useState('');
    const [stageDragging, setStageDragging] = useState(false);
    useEffect(() => {
        const root = mapStackRef.current;
        if (!root) return undefined;
        const mapEl = root.querySelector('.busanmap');
        const stageEl = root.querySelector('.busanmap-stage');
        if (!mapEl || !stageEl) return undefined;
        const sync = () => {
            setStageTf(stageEl.style.transform || '');
            setStageDragging(mapEl.classList.contains('dragging'));
        };
        sync();
        const mo = new MutationObserver(sync);
        mo.observe(stageEl, { attributes: true, attributeFilter: ['style'] });
        mo.observe(mapEl, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);

    // 카테고리 전환 시 해당 카테고리 첫 지표 자동 선택.
    // 전체 모드는 자동 선택 없이 대기 — 카드 클릭으로 언제든 selMetric 지정 가능(상세 렌더는 렌더 시점의 selMetric && 게이트만 따름).
    // 전체로 돌아왔을 때 강제로 null 처리하지 않아, 직전에 보던 지표 상세가 유지된다.
    useEffect(() => {
        if (isAll) return;
        setSelMetric(activeCat?.metrics?.[0] || null);
    }, [cat]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <UserPCLayout currentView="pcPublicData" onNavigate={onNavigate}>
            <div className="pubd">
                {/* 중앙 지도 (+ 값 버블 오버레이 — Figma 302:9132/9670) */}
                <div className="pubd-map">
                    <div className="pubd-map-stack" ref={mapStackRef}>
                        <BusanMap
                            selectedDistrict={region}
                            onDistrictChange={setRegion}
                            zoom={mapZoom}
                            draggable
                            showCharacters={false}
                        />
                        {bubbles.length > 0 && (
                            <div className="pubd-bubbles" aria-hidden="true">
                                <div
                                    className="pubd-bubbles-stage"
                                    style={{ transform: stageTf, transition: stageDragging ? 'none' : undefined }}
                                >
                                    {bubbles.map((b) => {
                                        const box = MAP_BOX[b.name];
                                        const c = MAP_CENTROID[b.name];
                                        if (!box || !c) return null;
                                        const left = `${((box[0] + box[2] * c[0]) / MAP_VBW) * 100}%`;
                                        const top = `${((box[1] + box[3] * c[1] + BUBBLE_Y_OFFSET) / MAP_VBH) * 100}%`;
                                        const long = (b.text || '').length > 4;
                                        return (
                                            <span
                                                key={b.name}
                                                className={`pubd-bubble${b.sel ? ' is-sel' : ''}${long ? ' is-long' : ''}`}
                                                style={{ left, top }}
                                            >
                                                {b.text}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 지도 컨트롤바 — 우측 패널보다 더 오른쪽, 화면 맨 끝 (사용자 확정) */}
                <MapToolbar zoom={mapZoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onLocate={locateMe} />

                {/* 좌측 구역별 필터 카드 */}
                <div className="pubd-region-card">
                    <span className="pubd-region-label">구역별</span>
                    <div className="pubd-region-select">
                        <select value={region || ''} onChange={(e) => setRegion(e.target.value || null)}>
                            <option value="">전체</option>
                            {GUGUN.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        {region && (
                            <button type="button" className="pubd-region-clear" aria-label="선택 해제" onClick={() => setRegion(null)}>×</button>
                        )}
                        <i className="pubd-caret" />
                    </div>
                </div>

                {/* 좌측 생활정보 세로 사이드바 — 제보/제안 지도와 동일한 공용 LifeRail 재사용 */}
                <div className="pubd-side">
                    <LifeRail
                        categories={CATS}
                        isOn={(c) => cat === c.key}
                        onChange={(c) => setCat(c.key)}
                        accent="#23bdbb"
                    />
                </div>

                {/* 우측 패널 (KPI + 상세) */}
                <div className={`pubd-right${isAll ? ' is-all' : ''}`}>
                    <aside className="pubd-kpi">
                        {/* Figma: 전체 모드 제목은 선택 구 이름(9314) 또는 '전체'(8776), 카테고리 모드는 카테고리명(9670).
                            가나다순 정렬 컨트롤은 전체 모드에만 존재(9670 카테고리 패널엔 없음) */}
                        <div className="pubd-kpi-head">
                            <h2>{isAll ? (region || '전체') : (activeCat?.label || '전체')}</h2>
                            {isAll && (
                                <button type="button" className="pubd-kpi-sort" onClick={() => setSortAsc((v) => !v)}>
                                    가나다순 <i className="pubd-caret" />
                                </button>
                            )}
                        </div>
                        <div className="pubd-kpi-grid">
                            {cards.map((m, i) => {
                                const val = valueFor(m);
                                const selected = selMetric && selMetric.label === m.label;
                                return (
                                    <button
                                        key={m.label + i}
                                        type="button"
                                        className={`pubd-kpi-card${selected ? ' selected' : ''}`}
                                        onClick={() => setSelMetric(m)}
                                    >
                                        <span className="pubd-kpi-label">{m.label}</span>
                                        <img src={m.icon} alt="" />
                                        <span className={`pubd-kpi-val${val ? '' : ' na'}`}>{val || '준비중'}</span>
                                    </button>
                                );
                            })}
                            {cards.length === 0 && <p className="pubd-kpi-empty">해당 분야의 공공데이터를 준비 중입니다.</p>}
                        </div>
                    </aside>

                    {/* 선택 지표 상세 — 카드 클릭 시 해당 지표의 백엔드 실값 표시(전체/카테고리 모드 공통).
                        값이 없으면 '준비중'(수치 날조 금지). TODO: 연도별 추이는 시계열 API 연동 시 recharts 렌더 */}
                    {selMetric && (() => {
                        const hit = hitFor(selMetric);
                        // % 값이면 Figma(302:9810)처럼 0~100 스케일 진행 바 표시. 그 외 단위는 스케일 날조 금지 → 바 생략.
                        const isPct = hit && (hit.unit === '%' || /^\s*-?\d+(\.\d+)?\s*%/.test(hit.value_text || ''));
                        const pctNum = isPct ? parseFloat(hit.value_text) : NaN;
                        const pct = Number.isFinite(pctNum) ? Math.min(100, Math.max(0, pctNum)) : null;
                        return (
                            <section className="pubd-detail">
                                <div className="pubd-detail-head">
                                    <h3>{selMetric.label}</h3>
                                    <span className="pubd-detail-unit">
                                        {hit?.unit ? `(단위:${hit.unit})` : (hit?.region || region || '부산')}
                                    </span>
                                </div>
                                {hit ? (
                                    <div className="pubd-detail-body">
                                        <p className="pubd-detail-row">
                                            {hit.year && <span>{hit.year}년</span>}
                                            <span className="pubd-detail-num">
                                                {hit.value_text}{hit.unit && !(hit.value_text || '').includes(hit.unit) ? hit.unit : ''}
                                            </span>
                                        </p>
                                        {pct !== null && <div className="pubd-detail-bar"><i style={{ width: `${pct}%` }} /></div>}
                                        {hit.note && <p className="pubd-detail-note">{hit.note}</p>}
                                    </div>
                                ) : (
                                    <div className="pubd-detail-body is-empty">
                                        <p className="pubd-detail-na">데이터 준비중</p>
                                        <p className="pubd-detail-sub">공공데이터 연동 후 값·연도별 추이가 표시됩니다.</p>
                                    </div>
                                )}
                                <div className="pubd-detail-foot">
                                    <span className="pubd-detail-updated">
                                        {hit?.source ? `출처: ${hit.source}` : (hit?.year ? `${hit.year}년 기준` : '')}
                                    </span>
                                    <button type="button" className="pubd-detail-dl" disabled>다운로드</button>
                                </div>
                            </section>
                        );
                    })()}
                </div>
            </div>
        </UserPCLayout>
    );
}
