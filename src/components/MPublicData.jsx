import { useEffect, useMemo, useRef, useState } from 'react';
import BusanMap from './BusanMap';
import MobileBottomNav from './MobileBottomNav';
import { API_URL } from '../utils/api';
import './MPublicData.css';

/* 모바일 공공데이터 — Figma TCuOzEqNhoLKjhF0reBDks 섹션 302:21475 정합.
   상: BusanMap(토포배경) / 하: 드래그 바텀시트(지역 타이틀 + 생활정보 칩 + KPI 그리드 + 지표 상세).
   프레임 매핑: 302:21809(_01 기본) / 302:22500(칩+버블) / 302:22863(구 선택 줌) /
               302:23424(_02 카테고리+상세) / 302:23586(_03 풀시트) / 302:23194(전체 그리드 원본)
   ⚠️ 수치는 백엔드(/api/public-data/overview) 실값만 표시, 없으면 '준비중' — 통계 날조 금지. */

const A = '/figma-assets/mobile-publicdata';           // Figma 302:21475 export 에셋
const K = (n) => `${A}/kpi/kpi${String(n).padStart(2, '0')}.png`; // 카드 아이콘 (302:23194 개별 export)
const H = (name) => `/assets/publicdata/kpi/housing/${name}.png`; // 주거 아이콘 (PC 공용, Figma 302:9933)

/* 지표 정의 — Figma 302:23194 "전체" 그리드 실측 순서 그대로 (라벨·아이콘·표시크기 1:1).
   iw = Figma 아이콘 렌더 폭(px). key = 백엔드 theme_stats.metric 부분일치 키.
   df = overview.districts 의 구별 실데이터 필드 (버블/최소최대 표시용). */
const M = (label, n, iw, key, df) => ({ label, icon: K(n), iw, key, df });
const CATS = [
    { key: '산업일자리', label: '산업·일자리', metrics: [
        M('청년층 순 이동율', 1, 35), M('고용율', 2, 35), M('실업율', 3, 35),
        M('근로여건 만족도(%)', 4, 35), M('1인당 GRDP', 5, 42), M('월평균 가구소득', 6, 35),
        M('사업체수 증감율', 7, 35), M('종사자수 증감율', 8, 44), M('사고위험지역', 9, 35),
    ] },
    { key: '안전', label: '안전', metrics: [
        M('사회안전 인식도', 10, 35), M('안전체감도', 11, 35), M('빈집비율', 12, 35),
        M('경찰서 수', 13, 35), M('소방서 수', 14, 34), M('CCTV수', 15, 35, 'CCTV'),
        M('주요 범죄발생 건수', 16, 35), M('비상벨 수', 17, 35), M('소음도', 18, 35),
    ] },
    { key: '환경', label: '환경', metrics: [
        M('대기오염 지수', 19, 35, '미세먼지'), M('공원면적비', 20, 35), M('하수도보급율', 21, 35),
        M('생활폐기물 발생량', 22, 35), M('사업자폐기물발생량', 23, 34), M('재활용비율', 24, 35),
    ] },
    { key: '교통', label: '교통', metrics: [
        M('대중 교통 이용 승객 수', 25, 47), M('교통사고비율', 26, 46, '교통사고', 'accidents'), M('교통안전지수', 27, 35),
        M('대중교통 이용 만족도', 28, 40), M('어린이보호구역', 29, 40), M('노인보호구역', 30, 35),
        M('자전거도로 현황', 31, 40), M('사고다발지역', 32, 35), M('전기자전거 이용 현황', 33, 46),
    ] },
    { key: '문화여가', label: '문화·여가', metrics: [
        M('공공체육시설 수', 34, 47), M('공원 수', 35, 46), M('공공도서관 수', 36, 35, '공공도서관', 'libraries'),
        M('인터넷이용율', 37, 40), M('문화예술행사 관람율', 38, 40), M('문화예술행사 만족도', 39, 35),
        M('지자체 문화예술 예산', 40, 40),
    ] },
    { key: '보건복지', label: '보건·복지', metrics: [
        M('의료시설 수', 41, 40), M('의료인력 수', 42, 35), M('사회복지시설 수', 43, 35),
        M('노인복지시설 수', 44, 35), M('스트레스인지율', 45, 35), M('사망률', 46, 40),
        M('자살율', 47, 40), M('출산율', 48, 35), M('의료시설 만족도', 49, 35),
    ] },
    { key: '교육', label: '교육', metrics: [
        M('유치원수/학생수', 50, 35), M('초등학교 수/학생수', 51, 35), M('고등학교 수/학생수', 52, 35),
        M('사설학원수', 53, 35), M('통학길 만족도(%)', 54, 35), M('중학교 수/학생수', 55, 35),
        M('학생의 학교생활 만족도(%)', 56, 40, null, null),
    ] },
    // 주거는 모바일 Figma 전체 그리드에 카드가 없어 PC 공공데이터(302:9933) 지표·아이콘 재사용
    { key: '주거', label: '주거', metrics: [
        { label: '보행환경 만족도', icon: H('walk'), iw: 35 }, { label: '노후주택비율', icon: H('oldhouse'), iw: 35 },
        { label: '인구증감율', icon: H('popchange'), iw: 35 }, { label: '연령별 인구비율', icon: H('agepop'), iw: 35 },
        { label: '고령화지수', icon: H('aging'), iw: 35 }, { label: '소음도', icon: H('noise'), iw: 35 },
        { label: '녹지율', icon: H('green'), iw: 35 }, { label: '주차장 이용 만족도', icon: H('parking'), iw: 35 },
        { label: '나홀로가구현황', icon: H('alone'), iw: 35 },
    ] },
];

// 칩 배치 — Figma 302:21809 실측 2행 고정 (row1: 전체~안전 / row2: 교육~보건·복지)
const CHIP_ROWS = [
    [{ key: 'all', label: '전체' }, { key: '주거', label: '주거' }, { key: '환경', label: '환경' },
     { key: '교통', label: '교통' }, { key: '안전', label: '안전' }],
    [{ key: '교육', label: '교육' }, { key: '산업일자리', label: '산업·일자리' },
     { key: '문화여가', label: '문화·여가' }, { key: '보건복지', label: '보건·복지' }],
];

/* ── BusanMap 좌표계 (BusanMap.jsx 실측 상수 사본 — 공유 컴포넌트 수정 금지라 로컬 복제) ── */
const VBW = 750.48;
const VBH = 572.98;
const DISTRICT_BOX = {
    강서구: [0, 250.87, 290.94, 252.45], 사상구: [231.5, 311.47, 97.2, 131.77], 북구: [288.9, 177.37, 95.24, 149.38],
    금정구: [353.93, 131.7, 155.91, 160.47], 기장군: [462.15, 0, 288.33, 338.56], 동래구: [363.14, 263.99, 101.11, 59.36],
    연제구: [367.04, 310.23, 101.11, 61.97], 부산진구: [321.45, 308.86, 100.46, 110.9], 해운대구: [462.8, 230.14, 150.69, 159.17],
    수영구: [439.04, 339.51, 51.81, 64.58], 남구: [385.97, 373.44, 108.29, 101.11], 사하구: [200.84, 428.82, 121.99, 144.17],
    서구: [293.4, 404.68, 49.58, 139.6], 동구: [331.82, 396.85, 58.06, 49.58], 중구: [329.21, 441.15, 52.84, 41.1],
    영도구: [340.82, 460.06, 103.07, 93.28],
};
const CENTROID = {
    강서구: [0.535, 0.516], 사상구: [0.524, 0.506], 북구: [0.474, 0.556], 금정구: [0.497, 0.498],
    기장군: [0.474, 0.441], 동래구: [0.508, 0.528], 연제구: [0.576, 0.42], 부산진구: [0.428, 0.497],
    해운대구: [0.42, 0.572], 수영구: [0.483, 0.481], 남구: [0.488, 0.531], 사하구: [0.519, 0.447],
    서구: [0.5, 0.22], 동구: [0.553, 0.494], 중구: [0.492, 0.443], 영도구: [0.521, 0.505],
};
const GUGUN = Object.keys(DISTRICT_BOX);

// 구·군청 대표 위경도(근사) — "내 위치" geolocation 최근접 매칭 (PCPublicData 동일 로직)
const GUGUN_LATLNG = {
    강서구: [35.2124, 128.9806], 사상구: [35.1524, 128.9909], 북구: [35.197, 129.0061],
    금정구: [35.243, 129.0921], 기장군: [35.2443, 129.2223], 동래구: [35.1955, 129.0835],
    연제구: [35.1762, 129.0796], 부산진구: [35.1627, 129.053], 해운대구: [35.1631, 129.1636],
    수영구: [35.1455, 129.1132], 남구: [35.1365, 129.0843], 사하구: [35.1043, 128.9747],
    서구: [35.0975, 129.0242], 동구: [35.1294, 129.0454], 중구: [35.1002, 129.0324],
    영도구: [35.0912, 129.068],
};

const MAP_H = 482;               // 지도 컨테이너 높이 — Figma 지도 Group 세로중심 241.5 정합
const ZOOM_DEFAULT = 1.08;       // Figma 기본 지도 424/393
const ZOOM_DISTRICT = 3.28;      // Figma 구 선택 지도 1288/393
const ZOOM_BUBBLE = 3.0;         // Figma 버블 상태(f01d) 근사

// 구 중심의 스테이지(px) 좌표 (컨테이너 폭 w 기준)
function districtCenter(name, w) {
    const [bx, by, bw, bh] = DISTRICT_BOX[name];
    const [cx, cy] = CENTROID[name];
    const stageW = w;
    const stageH = w * (VBH / VBW);
    const top = (MAP_H - stageH) / 2;
    return {
        x: ((bx + cx * bw) / VBW) * stageW,
        y: top + ((by + cy * bh) / VBH) * stageH,
    };
}

export default function MPublicData({ onNavigate }) {
    const [region, setRegion] = useState(null);      // null = 부산전체
    const [cat, setCat] = useState('all');
    const [sortAsc, setSortAsc] = useState(false);
    const [selMetric, setSelMetric] = useState(null);
    const [expand, setExpand] = useState(false);     // false=half(438) / true=full(0)
    const [overview, setOverview] = useState(null);
    const [mapW, setMapW] = useState(393);
    const mapRef = useRef(null);
    const dragRef = useRef(null);

    useEffect(() => {
        const q = region ? `?region=${encodeURIComponent(region)}` : '';
        fetch(`${API_URL}/api/public-data/overview${q}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setOverview(d || null))
            .catch(() => {});
    }, [region]);

    useEffect(() => {
        const measure = () => { if (mapRef.current) setMapW(mapRef.current.clientWidth); };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const stats = overview?.theme_stats || [];
    const districts = overview?.districts || [];

    const activeCat = CATS.find((c) => c.key === cat);
    const isAll = cat === 'all';

    // 지표 → 백엔드 매칭 (없으면 null → '준비중'. 수치 날조 금지)
    const hitFor = (m) => {
        if (!m) return null;
        const needle = m.key || m.label;
        const rows = stats.filter((s) => (s.metric || '').includes(needle));
        if (!rows.length) return null;
        return rows.find((s) => region && s.region === region) || rows.find((s) => s.region === '부산') || rows[0];
    };
    const districtValue = (m, name) => {
        if (!m?.df) return null;
        const row = districts.find((d) => d.region === name);
        const v = row?.[m.df];
        return typeof v === 'number' ? v : null;
    };
    const valueFor = (m) => {
        if (region && m?.df) {
            const v = districtValue(m, region);
            if (v !== null) return `${v.toLocaleString()}${m.df === 'libraries' ? '개관' : '건'}`;
        }
        return hitFor(m)?.value_text || null;
    };

    const cards = useMemo(() => {
        let list = isAll ? CATS.filter((c) => c.key !== '주거').flatMap((c) => c.metrics) : (activeCat?.metrics || []);
        if (sortAsc) list = [...list].sort((a, b) => a.label.localeCompare(b.label, 'ko'));
        return list;
    }, [cat, sortAsc, isAll, activeCat]);

    // 카테고리 진입 시 첫 지표 자동 선택 (Figma _02), 전체는 자동 선택 없음
    useEffect(() => {
        setSelMetric(isAll ? null : (activeCat?.metrics?.[0] || null));
    }, [cat]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── 지도 변환 (줌·포커스) — Figma: 기본 1.08 / 버블 2.7 / 구 선택 3.28 ── */
    const bubbleData = useMemo(() => {
        if (!selMetric?.df || !districts.length) return null;
        const vals = districts
            .map((d) => ({ name: d.region, v: d[selMetric.df] }))
            .filter((d) => typeof d.v === 'number' && DISTRICT_BOX[d.name]);
        return vals.length ? vals : null;
    }, [selMetric, districts]);

    const transform = useMemo(() => {
        const c = { x: mapW / 2, y: MAP_H / 2 };
        let k = ZOOM_DEFAULT;
        let t = { x: 10.5, y: 0 };                       // Figma 기본 지도 중심 오프셋
        let f = null;
        if (region) { k = ZOOM_DISTRICT; f = districtCenter(region, mapW); }
        else if (bubbleData) {
            k = ZOOM_BUBBLE;
            const pts = bubbleData.map((b) => districtCenter(b.name, mapW));
            f = { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
        }
        if (f) t = { x: k * (c.x - f.x), y: k * (c.y - f.y) - 22 }; // -22: 시트 위 가시영역(0~438) 광학 중심 보정
        return { k, t, c };
    }, [region, bubbleData, mapW]);

    const screenPos = (p) => ({
        x: transform.c.x + transform.k * (p.x - transform.c.x) + transform.t.x,
        y: transform.c.y + transform.k * (p.y - transform.c.y) + transform.t.y,
    });

    const bubbles = useMemo(() => {
        if (!bubbleData) return [];
        const max = Math.max(...bubbleData.map((b) => b.v), 1);
        return bubbleData.map((b) => {
            const r = b.v / max;
            const size = r >= 0.66 ? 100 : r >= 0.33 ? 64 : 46; // Figma Ellipse 100/64/46
            const pos = screenPos(districtCenter(b.name, mapW));
            return { ...b, size, font: size === 46 ? 16 : 20, pos };
        });
    }, [bubbleData, transform, mapW]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── 내 위치 (PCPublicData locateMe 동일) ── */
    const locateMe = () => {
        if (!navigator.geolocation) { alert('이 브라우저는 위치 확인 기능을 지원하지 않습니다.'); return; }
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

    /* ── 시트 드래그 (half ↔ full) ── */
    // ⚠️ pointerdown에서 setPointerCapture 하면 click 합성이 죽는다(BusanMap 동일 이슈)
    //    → 실제 드래그 판정(8px 초과) 후에만 캡처
    const onHeadPointerDown = (e) => { dragRef.current = { y: e.clientY, moved: false }; };
    const onHeadPointerMove = (e) => {
        const d = dragRef.current;
        if (!d) return;
        if (!d.moved && Math.abs(e.clientY - d.y) > 8) {
            d.moved = true;
            e.currentTarget.setPointerCapture?.(e.pointerId); // 헤더 밖까지 드래그해도 up 수신
        }
    };
    const onHeadPointerUp = (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (!d) return;
        const dy = e.clientY - d.y;
        if (dy < -40) setExpand(true);
        else if (dy > 40) setExpand(false);
    };

    /* ── 다운로드: 실데이터 있을 때만 CSV (수치 날조 금지 — 없으면 비활성) ── */
    const selHit = hitFor(selMetric);
    const hasDistrictData = selMetric?.df && districts.length > 0;
    const canDownload = !!(selHit || hasDistrictData);
    const downloadCsv = () => {
        if (!canDownload) return;
        let rows;
        if (hasDistrictData) {
            rows = [['지역', selMetric.label], ...districts.map((d) => [d.region, d[selMetric.df]])];
        } else {
            rows = [['지역', '지표', '값', '연도', '출처'],
                [selHit.region || '부산', selMetric.label, selHit.value_text, selHit.year || '', selHit.source || '']];
        }
        const csv = '﻿' + rows.map((r) => r.join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `공공데이터_${selMetric.label}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    /* ── 상세(연도/최소최대) — 백엔드 실값 기반 ── */
    const detail = (() => {
        if (isAll || !selMetric) return null;
        const hit = selHit;
        const isPct = hit && (hit.unit === '%' || /^\s*-?\d+(\.\d+)?\s*%/.test(hit.value_text || ''));
        const pctNum = isPct ? parseFloat(hit.value_text) : NaN;
        const pct = Number.isFinite(pctNum) ? Math.min(100, Math.max(0, pctNum)) : null;
        let minmax = null;
        if (hasDistrictData) {
            const vals = districts
                .map((d) => ({ name: d.region, v: d[selMetric.df] }))
                .filter((d) => typeof d.v === 'number');
            if (vals.length) {
                const mn = vals.reduce((a, b) => (b.v < a.v ? b : a));
                const mx = vals.reduce((a, b) => (b.v > a.v ? b : a));
                minmax = { min: mn, max: mx };
            }
        }
        return { hit, pct, minmax };
    })();

    const regionValue = hasDistrictData && region ? districtValue(selMetric, region) : null;
    const detailValueText = regionValue !== null
        ? `${regionValue.toLocaleString()}${selMetric.df === 'libraries' ? '개관' : '건'}`
        : (detail?.hit?.value_text || null);
    // 최소~최대 대비 현재값 진행 바 (구별 실데이터가 있을 때 — %가 아니어도 실측 스케일이라 날조 아님)
    const rangeRatio = (() => {
        if (!detail?.minmax) return null;
        const cur = regionValue !== null ? regionValue
            : districts.length ? districts.reduce((s, d) => s + (d[selMetric.df] || 0), 0) / districts.length : null;
        if (cur === null) return null;
        const { min, max } = detail.minmax;
        if (max.v === min.v) return 1;
        return Math.min(1, Math.max(0, (cur - min.v) / (max.v - min.v)));
    })();

    const sheetTitle = region || '부산전체';
    const sectionTitle = isAll ? '전체' : (activeCat?.label || '').replace('·', '');

    return (
        <div className={`mpubd${bubbleData ? ' has-bubbles' : ''}`} style={{ '--mpubd-stroke': `${(1.4 / transform.k).toFixed(2)}px` }}>
            {/* 지도 영역 — BusanMap(공유) + 줌/포커스 래퍼 + 버블 오버레이 */}
            <div className="mpubd-map" ref={mapRef}>
                <div
                    className="mpubd-map-tr"
                    style={{ transform: `translate(${transform.t.x}px, ${transform.t.y}px) scale(${transform.k})` }}
                >
                    <BusanMap
                        selectedDistrict={region}
                        onDistrictChange={setRegion}
                        bgSrc="/assets/지도 배경 데스크탑.png"
                        showCharacters={false}
                    />
                </div>
                {bubbles.map((b) => (
                    <button
                        key={b.name}
                        type="button"
                        className={`mpubd-bubble${b.name === region ? ' selected' : ''}`}
                        /* 버블은 구명 라벨이 가려지지 않게 하단 오프셋 (Figma f01c/f01d 배치) */
                        style={{ left: b.pos.x + (b.name === region ? 0 : 14), top: b.pos.y + (b.name === region ? 26 : 16), width: b.size, height: b.size, fontSize: b.font }}
                        onClick={() => setRegion(b.name === region ? null : b.name)}
                        aria-label={`${b.name} ${b.v.toLocaleString()}`}
                    >
                        {b.v.toLocaleString()}
                    </button>
                ))}
                {!expand && (
                    <button type="button" className="mpubd-back" aria-label="뒤로" onClick={() => onNavigate?.('home')}>
                        <img src={`${A}/back_arrow.png`} alt="" />
                    </button>
                )}
            </div>

            {/* 바텀시트 */}
            <section className={`mpubd-sheet${expand ? ' full' : ''}`}>
                {expand ? (
                    /* 풀시트 헤더 — Figma 302:23586: 뒤로가기(24) + 타이틀(76) */
                    <div className="mpubd-head is-full">
                        <button type="button" className="mpubd-back in-sheet" aria-label="접기" onClick={() => setExpand(false)}>
                            <img src={`${A}/back_arrow.png`} alt="" />
                        </button>
                        <div className="mpubd-title-row">
                            <h1 className="mpubd-title">{sheetTitle}</h1>
                            <button type="button" className="mpubd-title-btn" aria-label="시트 접기" onClick={() => setExpand(false)}>
                                <img src={`${A}/chevron_btn.png`} alt="" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 하프시트 헤더 — Figma 302:21809: 그래버(12) + 타이틀(33) + 위치(우측) */
                    <div
                        className="mpubd-head"
                        onPointerDown={onHeadPointerDown}
                        onPointerMove={onHeadPointerMove}
                        onPointerUp={onHeadPointerUp}
                    >
                        <button type="button" className="mpubd-grabber" aria-label="시트 펼치기" onClick={() => setExpand(true)}>
                            <img src={`${A}/grabber.png`} alt="" />
                        </button>
                        <div className="mpubd-title-row">
                            <h1 className="mpubd-title">{sheetTitle}</h1>
                            <button type="button" className="mpubd-title-btn" aria-label="시트 펼치기" onClick={() => setExpand(true)}>
                                <img src={`${A}/chevron_btn.png`} alt="" />
                            </button>
                        </div>
                        <button type="button" className="mpubd-locate" aria-label="내 위치" onClick={locateMe}>
                            <img src={`${A}/locate.png`} alt="" />
                        </button>
                    </div>
                )}

                {/* 생활정보 칩 2행 — Figma 실측 배치 고정 */}
                <div className="mpubd-chips">
                    {CHIP_ROWS.map((row, ri) => (
                        <div className="mpubd-chip-row" key={ri}>
                            {row.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    className={`mpubd-chip${cat === c.key ? ' active' : ''}`}
                                    onClick={() => setCat(c.key)}
                                >{c.label}</button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* 스크롤 본문 */}
                <div className="mpubd-body">
                    <div className="mpubd-section-head">
                        <h2>{sectionTitle}</h2>
                        <button type="button" className="mpubd-sort" onClick={() => setSortAsc((v) => !v)}>
                            가나다순 <img src={`${A}/caret.png`} alt="" />
                        </button>
                    </div>

                    <div className="mpubd-grid">
                        {cards.map((m, i) => {
                            const val = valueFor(m);
                            const selected = selMetric && selMetric.label === m.label;
                            const wide = m.label === '학생의 학교생활 만족도(%)'; // Figma Rectangle 341 (175px)
                            return (
                                <button
                                    key={m.label + i}
                                    type="button"
                                    className={`mpubd-card${selected ? ' selected' : ''}${wide ? ' wide' : ''}`}
                                    onClick={() => setSelMetric(m)}
                                >
                                    <span className="mpubd-card-label">{m.label}</span>
                                    <span className="mpubd-card-icon"><img src={m.icon} alt="" style={{ width: m.iw }} /></span>
                                    <span className={`mpubd-card-val${val ? '' : ' na'}`}>{val || '준비중'}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* 지표 상세 — Figma _02/_03 (카테고리 모드 + 선택 지표) */}
                    {!isAll && selMetric && (
                        <>
                            <div className="mpubd-divider" />
                            <section className="mpubd-detail">
                                <div className="mpubd-detail-head">
                                    <h3>{selMetric.label}</h3>
                                    {detail?.hit?.unit && <span className="mpubd-detail-unit">(단위:{detail.hit.unit})</span>}
                                </div>

                                {detailValueText ? (
                                    <div className="mpubd-detail-block">
                                        <p className="mpubd-detail-year">
                                            {detail?.hit?.year && <span>{detail.hit.year}년 </span>}
                                            <em>{detailValueText}</em>
                                        </p>
                                        {(detail?.pct !== null || rangeRatio !== null) && (
                                            <div className="mpubd-detail-bar">
                                                <i style={{ width: `${detail?.pct !== null ? detail.pct : rangeRatio * 100}%` }} />
                                            </div>
                                        )}
                                        {detail?.minmax && (
                                            <div className="mpubd-detail-range">
                                                <span>{detail.minmax.min.v.toLocaleString()}({detail.minmax.min.name})</span>
                                                <span>{detail.minmax.max.v.toLocaleString()}({detail.minmax.max.name})</span>
                                            </div>
                                        )}
                                        {detail?.hit?.note && <p className="mpubd-detail-note">{detail.hit.note}</p>}
                                    </div>
                                ) : (
                                    <div className="mpubd-detail-block is-empty">
                                        <p className="mpubd-detail-na">데이터 준비중</p>
                                        <p className="mpubd-detail-sub">공공데이터 연동 후 값·연도별 추이가 표시됩니다.</p>
                                    </div>
                                )}

                                <div className="mpubd-detail-foot">
                                    <span className="mpubd-detail-updated">
                                        {detail?.hit?.source ? `출처: ${detail.hit.source}` : (detail?.hit?.year ? `${detail.hit.year}년 기준` : '')}
                                    </span>
                                    <button type="button" className="mpubd-detail-dl" disabled={!canDownload} onClick={downloadCsv}>
                                        다운로드
                                    </button>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </section>

            <MobileBottomNav currentView="mPublicData" onNavigate={onNavigate} />
        </div>
    );
}
