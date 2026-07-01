import { useEffect, useMemo, useState } from 'react';
import UserPCLayout from './UserPCLayout';
import BusanMap from './BusanMap';
import { API_URL } from '../utils/api';
import './PublicData2.css';

/* PC 공공데이터 — Figma 269:14295 (공공데이터>전체) 리뉴얼.
   좌: 구역별 카드 + 생활정보 세로 사이드바 / 중앙: 부산 지도 + 우측 툴바 / 우: 3열 KPI 카드 그리드. */

const KPI = (label, icon, key) => ({ label, icon: `/assets/publicdata/kpi/image${icon}.png`, key });

// 카테고리별 지표 (Figma 269:14295 라벨 + 일러스트 아이콘)
const CATS = [
    { key: 'all', label: '전체', icon: '/figma-assets/living-icons/all.svg' },
    { key: '산업일자리', label: '산업 일자리', icon: '/figma-assets/living-icons/badge.svg', metrics: [
        KPI('청년층 순 이동율', 215), KPI('고용율', 216), KPI('실업율', 217), KPI('근로여건 만족도(%)', 218),
        KPI('1인당 GRDP', 219), KPI('월평균 가구소득', 220), KPI('사업체수 증감율', 221), KPI('종사자수 증감율', 222),
    ] },
    { key: '문화여가', label: '문화·여가', icon: '/figma-assets/living-icons/game.svg', metrics: [
        KPI('공공체육시설 수', 253), KPI('공원 수', 256), KPI('공공도서관 수', 259, '공공도서관'), KPI('문화예술행사 관람율', 254),
        KPI('인터넷이용율', 255), KPI('문화예술행사 만족도', 257), KPI('지자체 문화예술 예산', 260),
    ] },
    { key: '안전', label: '안전', icon: '/figma-assets/living-icons/safety.svg', metrics: [
        KPI('사회안전 인식도', 225), KPI('안전체감도', 228), KPI('빈집비율', 233), KPI('경찰서 수', 226),
        KPI('소방서 수', 229), KPI('CCTV수', 232, 'CCTV'), KPI('주요 범죄발생 건수', 227), KPI('비상벨 수', 230), KPI('사고위험지역', 231),
    ] },
    { key: '교육', label: '교육', icon: '/figma-assets/living-icons/edu.svg', metrics: [
        KPI('초등학교 수/학생수', 273), KPI('중학교 수/학생수', 275), KPI('고등학교 수/학생수', 272), KPI('유치원수/학생수', 271),
        KPI('사설학원수', 274), KPI('통학길 만족도(%)', 277), KPI('학생의 학교생활 만족도(%)', 276),
    ] },
    { key: '보건', label: '보건·복지', icon: '/figma-assets/living-icons/care.svg', metrics: [
        KPI('의료시설 수', 261), KPI('의료인력 수', 264), KPI('사회복지시설 수', 262), KPI('노인복지시설 수', 265),
        KPI('자살율', 267), KPI('출산율', 269), KPI('사망률', 266), KPI('스트레스인지율', 268), KPI('의료시설 만족도', 247),
    ] },
    { key: '주거', label: '주거', icon: '/figma-assets/living-icons/home.svg', metrics: [] },
    { key: '환경', label: '환경', icon: '/figma-assets/living-icons/forest.svg', metrics: [
        KPI('대기오염 지수', 234, '미세먼지'), KPI('공원면적비', 237), KPI('하수도보급율', 242), KPI('소음도', 238),
        KPI('생활폐기물 발생량', 235), KPI('사업자폐기물발생량', 241), KPI('재활용비율', 223),
    ] },
    { key: '교통', label: '교통', icon: '/figma-assets/living-icons/bus.svg', metrics: [
        KPI('대중 교통 이용 승객 수', 243), KPI('교통사고비율', 245, '교통사고'), KPI('교통안전지수', 248), KPI('대중교통 이용 만족도', 244),
        KPI('어린이보호구역', 246), KPI('노인보호구역', 247), KPI('사고다발지역', 249), KPI('전기자전거 이용 현황', 251), KPI('자전거도로 현황', 227),
    ] },
];
const GUGUN = ['부산진구', '해운대구', '사하구', '동래구', '북구', '남구', '연제구', '금정구',
    '사상구', '기장군', '수영구', '강서구', '서구', '영도구', '동구', '중구'];

function MapToolbar() {
    const Btn = ({ d, active }) => (
        <button type="button" className={`pubd-tool-btn${active ? ' active' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
        </button>
    );
    return (
        <div className="pubd-toolbar">
            <div className="pubd-tool-group">
                <Btn d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>} />
                <Btn d={<path d="M12 5v14M5 12h14" />} />
                <Btn d={<path d="M5 12h14" />} />
                <Btn active d={<><polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21" /><path d="M8 3v15M16 6v15" /></>} />
                <Btn d={<><path d="M2 12a10 10 0 0 1 10-10M12 22a10 10 0 0 0 10-10" /><circle cx="12" cy="12" r="3" /></>} />
            </div>
            <div className="pubd-tool-group">
                <Btn active d={<><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-5" /></>} />
            </div>
        </div>
    );
}

export default function PCPublicData({ onNavigate }) {
    const [region, setRegion] = useState(null);     // null = 전체(부산)
    const [cat, setCat] = useState('all');
    const [stats, setStats] = useState([]);          // theme_stats
    const [sortAsc, setSortAsc] = useState(true);

    useEffect(() => {
        const q = region ? `?region=${encodeURIComponent(region)}` : '';
        fetch(`${API_URL}/api/public-data/overview${q}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setStats(Array.isArray(d?.theme_stats) ? d.theme_stats : []))
            .catch(() => {});
    }, [region]);

    // 지표 → 실데이터 매칭 (metric contains)
    const valueFor = (m) => {
        const needle = m.key || m.label;
        const hit = stats.find((s) => (s.metric || '').includes(needle));
        return hit ? hit.value_text : '—';
    };

    const cards = useMemo(() => {
        let list = cat === 'all'
            ? CATS.filter((c) => c.metrics).flatMap((c) => c.metrics)
            : (CATS.find((c) => c.key === cat)?.metrics || []);
        if (sortAsc) list = [...list].sort((a, b) => a.label.localeCompare(b.label, 'ko'));
        return list;
    }, [cat, sortAsc]);

    const activeCat = CATS.find((c) => c.key === cat);

    return (
        <UserPCLayout currentView="pcPublicData" onNavigate={onNavigate}>
            <div className="pubd">
                {/* 중앙 지도 */}
                <div className="pubd-map">
                    <BusanMap selectedDistrict={region} onDistrictChange={setRegion} />
                </div>
                <MapToolbar />

                {/* 좌측 구역별 카드 */}
                <div className="pubd-region-card">
                    <span className="pubd-region-label">구역별</span>
                    <div className="pubd-region-select">
                        <select value={region || ''} onChange={(e) => setRegion(e.target.value || null)}>
                            <option value="">전체</option>
                            {GUGUN.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
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

                {/* 우측 KPI 패널 */}
                <aside className="pubd-kpi">
                    <div className="pubd-kpi-head">
                        <h2>{activeCat?.label || '전체'}</h2>
                        <button type="button" className="pubd-kpi-sort" onClick={() => setSortAsc((v) => !v)}>
                            가나다순 <i className="pubd-caret" />
                        </button>
                    </div>
                    <div className="pubd-kpi-grid">
                        {cards.map((m, i) => (
                            <div key={m.label + i} className="pubd-kpi-card">
                                <img src={m.icon} alt="" />
                                <span className="pubd-kpi-label">{m.label}</span>
                                <span className="pubd-kpi-val">{valueFor(m)}</span>
                            </div>
                        ))}
                        {cards.length === 0 && <p className="pubd-kpi-empty">해당 분야의 공공데이터를 준비 중입니다.</p>}
                    </div>
                </aside>
            </div>
        </UserPCLayout>
    );
}
