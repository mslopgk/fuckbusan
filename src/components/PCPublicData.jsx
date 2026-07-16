import { useEffect, useMemo, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import BusanMap from './BusanMap';
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
const CATS = [
    { key: 'all', label: '전체', icon: CI('all') },
    { key: '산업일자리', label: '산업 일자리', icon: CI('badge'), metrics: [
        KPI('청년층 순 이동율', 215), KPI('고용율', 216), KPI('실업율', 217), KPI('근로여건 만족도(%)', 218),
        KPI('1인당 GRDP', 219), KPI('월평균 가구소득', 220), KPI('사업체수 증감율', 221), KPI('종사자수 증감율', 222),
    ] },
    { key: '문화여가', label: '문화·여가', icon: CI('game'), metrics: [
        KPI('공공체육시설 수', 253), KPI('문화예술행사 관람율', 254), KPI('인터넷이용율', 255), KPI('문화예술행사 만족도', 257),
        KPI('공원 수', 256), KPI('공공도서관 수', 259, '공공도서관'), KPI('지자체 문화예술 예산', 260),
    ] },
    { key: '안전', label: '안전', icon: CI('safety'), metrics: [
        KPI('사회안전 인식도', 225), KPI('경찰서 수', 226), KPI('소방서 수', 229), KPI('CCTV수', 232, 'CCTV'),
        KPI('안전체감도', 228), KPI('빈집비율', 233), KPI('주요 범죄발생 건수', 227), KPI('비상벨 수', 230), KPI('사고위험지역', 231),
    ] },
    { key: '교육', label: '교육', icon: CI('edu'), metrics: [
        KPI('유치원수/학생수', 271), KPI('사설학원수', 274), KPI('고등학교 수/학생수', 272), KPI('통학길 만족도(%)', 277),
        KPI('초등학교 수/학생수', 273), KPI('중학교 수/학생수', 275), KPI('학생의 학교생활 만족도(%)', 276),
    ] },
    { key: '보건', label: '보건·복지', icon: CI('care'), metrics: [
        KPI('의료시설 수', 261), KPI('노인복지시설 수', 265), KPI('자살율', 267), KPI('사회복지시설 수', 262),
        KPI('스트레스인지율', 268), KPI('출산율', 269), KPI('의료인력 수', 264), KPI('의료시설 만족도', 247), KPI('사망률', 266),
    ] },
    { key: '주거', label: '주거', icon: CI('home'), metrics: [
        KPI('보행환경 만족도', H('walk')), KPI('노후주택비율', H('oldhouse')), KPI('인구증감율', H('popchange')),
        KPI('연령별 인구비율', H('agepop')), KPI('고령화지수', H('aging')), KPI('소음도', H('noise')),
        KPI('녹지율', H('green')), KPI('주차장 이용 만족도', H('parking')), KPI('나홀로가구현황', H('alone')),
    ] },
    { key: '환경', label: '환경', icon: CI('forest'), metrics: [
        KPI('대기오염 지수', 234, '미세먼지'), KPI('생활폐기물 발생량', 235), KPI('사업자폐기물발생량', 241), KPI('재활용비율', 223),
        KPI('공원면적비', 237), KPI('하수도보급율', 242), KPI('소음도', 238),
    ] },
    { key: '교통', label: '교통', icon: CI('bus'), metrics: [
        KPI('대중 교통 이용 승객 수', 243), KPI('어린이보호구역', 246), KPI('대중교통 이용 만족도', 244), KPI('노인보호구역', 247),
        KPI('사고다발지역', 249), KPI('전기자전거 이용 현황', 251), KPI('교통사고비율', 245, '교통사고'), KPI('교통안전지수', 248), KPI('자전거도로 현황', 227),
    ] },
];

const GUGUN = ['부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구'];

// 지도 우측 툴바 (Figma 302:8820). 아이콘은 Figma export PNG. map/analytics 는 active(teal) 상태.
const TOOLS_MAIN = [
    { icon: 'tb_locate', title: '내 위치' },
    { icon: 'tb_add', title: '확대' },
    { icon: 'tb_remove', title: '축소' },
    { icon: 'tb_map', title: '지도', active: true },
    { icon: 'tb_satellite', title: '위성' },
];

function MapToolbar() {
    return (
        <div className="pubd-toolbar">
            <div className="pubd-tool-group">
                {TOOLS_MAIN.map((t) => (
                    <button key={t.icon} type="button" title={t.title} className={`pubd-tool-btn${t.active ? ' active' : ''}`}>
                        <img src={`/assets/publicdata/icons/${t.icon}.png`} alt="" aria-hidden="true" />
                    </button>
                ))}
            </div>
            <div className="pubd-tool-group">
                <button type="button" title="통계" className="pubd-tool-btn active">
                    <img src="/assets/publicdata/icons/tb_analytics.png" alt="" aria-hidden="true" />
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

    useEffect(() => {
        const q = region ? `?region=${encodeURIComponent(region)}` : '';
        fetch(`${API_URL}/api/public-data/overview${q}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setStats(Array.isArray(d?.theme_stats) ? d.theme_stats : []))
            .catch(() => {});
    }, [region]);

    const activeCat = CATS.find((c) => c.key === cat);
    const isAll = cat === 'all';

    // 지표 → 백엔드 stats row 매칭. 없으면 null → '준비중' 표기 (수치 날조 금지)
    const hitFor = (m) => {
        if (!m) return null;
        const needle = m.key || m.label;
        return stats.find((s) => (s.metric || '').includes(needle)) || null;
    };
    const valueFor = (m) => hitFor(m)?.value_text || null;

    const cards = useMemo(() => {
        let list = isAll
            ? CATS.filter((c) => c.metrics).flatMap((c) => c.metrics)
            : (activeCat?.metrics || []);
        if (sortAsc) list = [...list].sort((a, b) => a.label.localeCompare(b.label, 'ko'));
        return list;
    }, [cat, sortAsc, isAll, activeCat]);

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
                {/* 중앙 지도 */}
                <div className="pubd-map">
                    <BusanMap selectedDistrict={region} onDistrictChange={setRegion} />
                </div>
                <MapToolbar />

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

                {/* 좌측 생활정보 세로 사이드바 */}
                <aside className="pubd-side">
                    <div className="pubd-side-head">생활정보</div>
                    <div className="pubd-side-list">
                        {CATS.map((c, i) => (
                            <div key={c.key} className="pubd-side-item">
                                <button type="button" className={`pubd-side-cat${cat === c.key ? ' active' : ''}`} onClick={() => setCat(c.key)}>
                                    <img src={c.icon} alt="" aria-hidden="true" />
                                    <span>{c.label}</span>
                                </button>
                                {i < CATS.length - 1 && <div className="pubd-side-div" />}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* 우측 패널 (KPI + 상세) */}
                <div className={`pubd-right${isAll ? ' is-all' : ''}`}>
                    <aside className="pubd-kpi">
                        <div className="pubd-kpi-head">
                            <h2>{activeCat?.label || '전체'}</h2>
                            <button type="button" className="pubd-kpi-sort" onClick={() => setSortAsc((v) => !v)}>
                                가나다순 <i className="pubd-caret" />
                            </button>
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
                        return (
                            <section className="pubd-detail">
                                <div className="pubd-detail-head">
                                    <h3>{selMetric.label}</h3>
                                    <span className="pubd-detail-region">{hit?.region || region || '부산'}</span>
                                    <button type="button" className="pubd-detail-dl" disabled>다운로드</button>
                                </div>
                                {hit ? (
                                    <div className="pubd-detail-body">
                                        <p className="pubd-detail-value">{hit.value_text}{hit.unit ? ` ${hit.unit}` : ''}</p>
                                        <p className="pubd-detail-meta">
                                            {hit.year && <span>{hit.year}년 기준</span>}
                                            {hit.note && <span> · {hit.note}</span>}
                                        </p>
                                        {hit.source && <p className="pubd-detail-source">출처: {hit.source}</p>}
                                    </div>
                                ) : (
                                    <div className="pubd-detail-body">
                                        <p className="pubd-detail-na">데이터 준비중</p>
                                        <p className="pubd-detail-sub">공공데이터 연동 후 값·연도별 추이가 표시됩니다.</p>
                                    </div>
                                )}
                            </section>
                        );
                    })()}
                </div>
            </div>
        </UserPCLayout>
    );
}
