// 진단 04/23 (Figma 941:5782) 도메인 상수 — Mobile/PC 진단 컴포넌트가 공유

// 진단 모드
export const DIAGNOSIS_MODES = [
    { key: 'general', label: '일반' },
    { key: 'expert',  label: '전문가' },
];

// 카테고리 (대분류)
export const CATEGORIES = ['주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

// 칩 필터용 (전체 포함)
export const CATEGORIES_WITH_ALL = ['전체', ...CATEGORIES];

// 카테고리별 서브 항목 (mock 데이터 — 추후 API 연동 시 동적으로)
export const SUB_BY_CATEGORY = {
    '주거': ['주거1', '주거2'],
    '환경': ['환경1', '환경2'],
    '교통': ['교통1', '교통2'],
    '안전': ['안전1', '안전2'],
    '교육': ['교육1', '교육2'],
    '산업·일자리': ['산업1', '산업2'],
    '문화·여가': ['문화1', '문화2'],
    '보건·복지': ['복지1', '복지2'],
};

// 카테고리 칩 배경색 (Figma)
export const CATEGORY_TAG_COLORS = {
    '주거':       '#DFF8F8',
    '환경':       '#C0E6C0',
    '교통':       '#FFE2C9',
    '안전':       '#FFD4D4',
    '교육':       '#FFC9C9',
    '산업·일자리': '#FFE9A8',
    '문화·여가':   '#E0D4FF',
    '보건·복지':   '#D4E9FF',
};

// 부산 16개 구·군 + 중심 좌표 (lat/lng)
export const DISTRICT_CENTERS = {
    '부산진구': { lat: 35.1632, lng: 129.0531 },
    '중구':     { lat: 35.1064, lng: 129.0322 },
    '서구':     { lat: 35.0975, lng: 129.0244 },
    '동구':     { lat: 35.1294, lng: 129.0451 },
    '영도구':   { lat: 35.0911, lng: 129.0683 },
    '동래구':   { lat: 35.1972, lng: 129.0786 },
    '남구':     { lat: 35.1335, lng: 129.0851 },
    '북구':     { lat: 35.1971, lng: 129.0124 },
    '해운대구': { lat: 35.1631, lng: 129.1638 },
    '사하구':   { lat: 35.1043, lng: 128.9747 },
    '금정구':   { lat: 35.2429, lng: 129.0925 },
    '강서구':   { lat: 35.2123, lng: 128.9802 },
    '연제구':   { lat: 35.1769, lng: 129.0794 },
    '수영구':   { lat: 35.1530, lng: 129.1186 },
    '사상구':   { lat: 35.1525, lng: 128.9911 },
    '기장군':   { lat: 35.2444, lng: 129.2228 },
};

export const DISTRICTS = Object.keys(DISTRICT_CENTERS);

// 진단 만족도 평가 4문항
export const DIAGNOSIS_QUESTIONS = [
    '간판, 전신주, 가로등, 가로수 등의 장애물이 보행을 방해하지 않고 있나요?',
    '보행로는 모든 사람들이 편안하고 안전하게 통행할 수 있도록 조성되어져 있나요?',
    '보행로는 노인, 어린이, 유아차, 여성, 장애인, 휠체어 등 누구나 편안하고 안전하게 통행할 수 있도록 쾌적하고 친환경적인 보행 공간을 구성하고 있나요?',
    '보행 시 보행안전구역과 그 외 구역의 바닥재의 질감과 색상차이가 명확한가요?',
];

// 만족도 척도 (3단)
export const SATISFACTION_SCALE = [
    { value: 1, face: '😞', label: '아니에요' },
    { value: 2, face: '😐', label: '보통이에요' },
    { value: 3, face: '😄', label: '좋아요' },
];

// 진단 대상
export const DIAGNOSIS_TARGETS = [
    { key: 'all',     label: '전체' },
    { key: 'citizen', label: '시민' },
    { key: 'expert',  label: '전문가' },
];

// 생활정보 카테고리 (PC 대시보드 필터용 — icon kind 포함)
export const LIVING_CATS = [
    { key: 'all',     label: '전체',        icon: 'grid' },
    { key: 'safety',  label: '안전',        icon: 'shield' },
    { key: 'housing', label: '주거',        icon: 'home' },
    { key: 'work',    label: '산업·일자리', icon: 'briefcase' },
    { key: 'edu',     label: '교육',        icon: 'book' },
    { key: 'env',     label: '환경',        icon: 'leaf' },
    { key: 'leisure', label: '문화·여가',   icon: 'heart' },
    { key: 'health',  label: '보건·복지',   icon: 'plus' },
    { key: 'traffic', label: '교통',        icon: 'bus' },
];
