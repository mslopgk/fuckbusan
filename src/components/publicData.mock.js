/* 공공데이터 페이지 mock 데이터.
   ⚠️ 프론트 우선 구현용 더미. 추후 RAG 백엔드(/api/public-data 등)로 교체 예정.
   교체 시 이 파일의 export 형태(필드명)만 맞추면 컴포넌트는 그대로 동작한다. */

// 부산진구 행정동
export const DONGS = [
    '부전1동', '부전2동', '전포1동', '전포2동', '연지동', '초읍동',
    '양정1동', '양정2동', '부암1동', '부암3동', '당감1동', '당감2동',
    '당감4동', '가야1동', '가야2동', '개금1동', '개금2동', '개금3동',
    '범천1동', '범천2동',
];

// 생활정보 카테고리 (전체 + 8개). icon = 제보·제안·진단 공용 living-icons 재사용
export const LIFE_CATEGORIES = [
    { key: 'all', label: '전체', color: '#23bdbb', icon: '/figma-assets/living-icons/all.svg' },
    { key: 'safety', label: '안전', color: '#e6235a', icon: '/figma-assets/living-icons/safety.svg' },
    { key: 'housing', label: '주거', color: '#23bdbb', icon: '/figma-assets/living-icons/home.svg' },
    { key: 'industry', label: '산업·일자리', color: '#f59e0b', icon: '/figma-assets/living-icons/badge.svg' },
    { key: 'education', label: '교육', color: '#5b2eab', icon: '/figma-assets/living-icons/edu.svg' },
    { key: 'env', label: '환경', color: '#06ab69', icon: '/figma-assets/living-icons/forest.svg' },
    { key: 'culture', label: '문화·여가', color: '#ec4899', icon: '/figma-assets/living-icons/game.svg' },
    { key: 'welfare', label: '보건·복지', color: '#3b82f6', icon: '/figma-assets/living-icons/care.svg' },
    { key: 'traffic', label: '교통', color: '#dd5b1b', icon: '/figma-assets/living-icons/bus.svg' },
];

// 공공데이터 리스트 (지도 레이어 토글, 3×3). 부산 실제 공공데이터 레이어.
// count/icon은 placeholder — 아이콘은 Figma에서 개별 SVG export 후 icon 경로 채우면 자동 표시.
export const DATA_SOURCES = [
    { key: 'walk', label: '통행불편지역', count: 64, color: '#dd5b1b', icon: null },
    { key: 'bell', label: '비상벨', count: 312, color: '#e6235a', icon: null },
    { key: 'lamp', label: '보안등', count: 1024, color: '#f59e0b', icon: null },
    { key: 'cctv', label: '안심이CCTV', count: 213, color: '#3b82f6', icon: null },
    { key: 'shelter', label: '무더위쉼터', count: 58, color: '#06ab69', icon: null },
    { key: 'child', label: '어린이보호구역', count: 37, color: '#5b2eab', icon: null },
    { key: 'wifi', label: '공공와이파이', count: 149, color: '#23bdbb', icon: null },
    { key: 'toilet', label: '공중화장실', count: 86, color: '#ec4899', icon: null },
    { key: 'fire', label: '소화전', count: 503, color: '#ef4444', icon: null },
];

// 지도 핀 (mock 공공데이터 포인트 — 부산진구 일대)
export const PINS = [
    { id: 1, lat: 35.1631, lng: 129.0535, category: 'culture', title: '까레 (carré)' },
    { id: 2, lat: 35.1668, lng: 129.0556, category: 'safety', title: '서면 스마트CCTV' },
    { id: 3, lat: 35.1572, lng: 129.0594, category: 'env', title: '전포 카페거리 환경' },
    { id: 4, lat: 35.1729, lng: 129.0641, category: 'welfare', title: '연지 보건지소' },
    { id: 5, lat: 35.1551, lng: 129.0606, category: 'traffic', title: '전포역 교통안전' },
    { id: 6, lat: 35.1707, lng: 129.0455, category: 'education', title: '초읍 어린이도서관' },
    { id: 7, lat: 35.1489, lng: 129.0382, category: 'industry', title: '개금 일자리센터' },
    { id: 8, lat: 35.1602, lng: 129.0461, category: 'housing', title: '당감 행복주택' },
    { id: 9, lat: 35.1648, lng: 129.0512, category: 'safety', title: '서면 방범초소' },
    { id: 10, lat: 35.1583, lng: 129.0558, category: 'culture', title: '전포 디자인 스튜디오' },
    { id: 11, lat: 35.1521, lng: 129.0488, category: 'env', title: '가야 미세먼지 측정소' },
    { id: 12, lat: 35.1695, lng: 129.0588, category: 'welfare', title: '양정 무더위쉼터' },
];

// 개별 데이터셋 상세 (핀 클릭 시). 실제로는 RAG가 채움 — 여기선 까레 1건 + 폴백 생성
const DETAIL_FALLBACK = {
    image: null,
    fields: [
        { label: '위치', value: '부산광역시 부산진구 서전로 58번길 33' },
        { label: '업종', value: '공공·생활 데이터' },
        { label: '한 줄 소개', value: '부산진구 공공데이터 기반 정보입니다.' },
    ],
};

export const DETAILS = {
    1: {
        title: '까레 (carré)',
        image: null,
        fields: [
            { label: '위치', value: '부산광역시 부산진구 서전로 58번길 33' },
            { label: '상호명', value: '까레 (carré)' },
            { label: '업종', value: '시각디자인 · 패키지디자인 · 브랜드 디자인' },
            { label: '주요 서비스', value: '브랜드 아이덴티티(BI) 및 시각 디자인 / 패키지 디자인 / 그래픽 콘텐츠 / 브랜드 굿즈·인쇄물' },
            { label: '한 줄 소개', value: '로컬 브랜드의 이야기를 시각과 패키지로 풀어내는 디자인 스튜디오입니다.' },
            { label: '취급 분야', value: '식품 · 로컬 브랜드 · 라이프스타일 제품' },
            { label: '디자인 스타일', value: '감성적 · 미니멀 · 스토리텔링 중심' },
            { label: '주요 고객', value: '소규모 브랜드 · 로컬 브랜드 · 창업 초기 사업자' },
            { label: '상담 방식', value: '사전 예약 상담 · 온라인 상담' },
            { label: '운영 시간', value: '월–금 10:00–18:00 (주말·공휴일 휴무)' },
            { label: '연락처', value: '이메일: carre.design@gmail.com / 인스타그램 DM 상담 가능' },
        ],
    },
};

export const getDetail = (pin) => {
    if (!pin) return null;
    const d = DETAILS[pin.id];
    if (d) return d;
    return { title: pin.title, ...DETAIL_FALLBACK };
};

// 인구 피라미드 (연령대별 남/여, 단위: 명). male은 차트에서 음수로 표시
export const POP_PYRAMID = [
    { age: '0–9', male: 1820, female: 1710 },
    { age: '10–19', male: 2240, female: 2110 },
    { age: '20–29', male: 3680, female: 3920 },
    { age: '30–39', male: 3410, female: 3360 },
    { age: '40–49', male: 3120, female: 3080 },
    { age: '50–59', male: 3260, female: 3340 },
    { age: '60–69', male: 2580, female: 2810 },
    { age: '70–79', male: 1520, female: 1880 },
    { age: '80+', male: 720, female: 1240 },
];

// 인구 추이 (연도별 총인구)
export const POP_TREND = [
    { year: '16', pop: 38.2 }, { year: '17', pop: 37.6 }, { year: '18', pop: 37.1 },
    { year: '19', pop: 36.5 }, { year: '20', pop: 35.9 }, { year: '21', pop: 35.2 },
    { year: '22', pop: 34.6 }, { year: '23', pop: 34.1 }, { year: '24', pop: 33.7 },
    { year: '25', pop: 33.4 },
];

// 통계 리스트 (테마별 지표)
export const STAT_LIST = [
    { cat: '안전', metric: 'CCTV 설치 대수', value: '213대', change: +6.2, color: '#e6235a' },
    { cat: '주거', metric: '공공임대 공급', value: '1,240호', change: +2.1, color: '#23bdbb' },
    { cat: '산업·일자리', metric: '신규 사업체', value: '186개', change: +4.5, color: '#f59e0b' },
    { cat: '교육', metric: '학생 1인당 예산', value: '92만원', change: +1.3, color: '#5b2eab' },
    { cat: '환경', metric: '미세먼지(연평균)', value: '31㎍/㎥', change: -3.8, color: '#06ab69' },
    { cat: '문화·여가', metric: '문화시설 수', value: '47개소', change: +0.0, color: '#ec4899' },
    { cat: '보건·복지', metric: '복지시설 수', value: '58개소', change: +2.7, color: '#3b82f6' },
    { cat: '교통', metric: '대중교통 분담률', value: '46%', change: +1.1, color: '#dd5b1b' },
];

// 부산 16개 구·군 비교 트리맵 (지표별 순위/비율)
export const COMPARE_TABS = [
    { key: 'satisfaction', label: '공공환경 만족도' },
    { key: 'priority', label: '공공환경 우선순위' },
    { key: 'walk', label: '보행안전지수' },
];

export const TREEMAP = {
    satisfaction: [
        { name: '안전', rank: 1, pct: 42, color: '#1f9e8f' },
        { name: '산업·일자리', rank: 2, pct: 36, color: '#37b3a1' },
        { name: '보건·복지', rank: 3, pct: 31, color: '#54c2b0' },
        { name: '주거', rank: 4, pct: 24, color: '#73cfc0' },
        { name: '문화·여가', rank: 5, pct: 18, color: '#93dccf' },
        { name: '교통', rank: 6, pct: 14, color: '#aee4da' },
        { name: '환경', rank: 7, pct: 10, color: '#c7ece5' },
        { name: '교육', rank: 8, pct: 7, color: '#ddf3ef' },
    ],
    priority: [
        { name: '교통', rank: 1, pct: 39, color: '#1f9e8f' },
        { name: '안전', rank: 2, pct: 33, color: '#37b3a1' },
        { name: '환경', rank: 3, pct: 28, color: '#54c2b0' },
        { name: '주거', rank: 4, pct: 22, color: '#73cfc0' },
        { name: '보건·복지', rank: 5, pct: 16, color: '#93dccf' },
        { name: '문화·여가', rank: 6, pct: 12, color: '#aee4da' },
        { name: '산업·일자리', rank: 7, pct: 9, color: '#c7ece5' },
        { name: '교육', rank: 8, pct: 6, color: '#ddf3ef' },
    ],
    walk: [
        { name: '보행환경', rank: 1, pct: 45, color: '#1f9e8f' },
        { name: '횡단보도', rank: 2, pct: 30, color: '#37b3a1' },
        { name: '보도폭', rank: 3, pct: 25, color: '#54c2b0' },
        { name: '신호체계', rank: 4, pct: 20, color: '#73cfc0' },
        { name: '조명', rank: 5, pct: 15, color: '#93dccf' },
        { name: '턱낮춤', rank: 6, pct: 9, color: '#c7ece5' },
    ],
};
