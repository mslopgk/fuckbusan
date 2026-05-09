// 제보/제안/지도 공통 상수 — PC + 모바일 공용

export const LIVING_CATS = [
    { key: 'all',     label: '전체',       icon: 'grid',      cat: null },
    { key: 'safety',  label: '안전',       icon: 'shield',    cat: '안전' },
    { key: 'housing', label: '주거',       icon: 'home',      cat: '주거' },
    { key: 'work',    label: '산업·일자리', icon: 'briefcase', cat: '산업·일자리' },
    { key: 'edu',     label: '교육',       icon: 'book',      cat: '교육' },
    { key: 'env',     label: '환경',       icon: 'leaf',      cat: '환경' },
    { key: 'leisure', label: '문화·여가',  icon: 'heart',     cat: '문화·여가' },
    { key: 'health',  label: '보건·복지',  icon: 'plus',      cat: '보건·복지' },
    { key: 'traffic', label: '교통',       icon: 'bus',       cat: '교통' },
];

export const CAT_TO_KEY = LIVING_CATS.reduce((acc, c) => {
    if (c.cat) acc[c.cat] = c.key;
    return acc;
}, {});

export const CAT_COLOR = {
    traffic: '#E6235A', safety: '#FF7A00', env: '#16B5B0', work: '#5B2EAB',
    health: '#1971c2', leisure: '#c08800', housing: '#d9480f', edu: '#6741d9',
};

// 부산 16개 구·군 중심 좌표 — [lat, lng] 배열 형식
export const DISTRICT_CENTERS = {
    '중구':    [35.1064, 129.0322], '서구':    [35.0976, 129.0245], '동구':    [35.1295, 129.0454],
    '영도구':  [35.0915, 129.0680], '부산진구': [35.1626, 129.0531], '동래구':  [35.1972, 129.0786],
    '남구':    [35.1366, 129.0844], '북구':    [35.1972, 129.0124], '해운대구': [35.1631, 129.1635],
    '사하구':  [35.1042, 128.9745], '금정구':  [35.2429, 129.0926], '강서구':  [35.2123, 128.9805],
    '연제구':  [35.1762, 129.0796], '수영구':  [35.1452, 129.1133], '사상구':  [35.1525, 128.9912],
    '기장군':  [35.2444, 129.2222],
};

export const DISTRICTS = ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'];

// 모바일 필터용 — '부산전체' 포함 버전
export const REGIONS = ['부산전체', ...DISTRICTS];

export const SORTS = ['조회수', '투표순', '최신순'];

export const REPORT_STAGES = [
    { key: 'inProgress', label: '개선중',   apiValue: '개선중' },
    { key: 'planned',    label: '개선예정', apiValue: '개선예정' },
    { key: 'done',       label: '개선완료', apiValue: '개선완료' },
];

// 카테고리 필터 아이콘 (18×18, map3 필터 패널 전용)
const SVG_PROPS = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function CategoryIcon({ kind }) {
    switch (kind) {
        case 'grid':
            return (
                <svg {...SVG_PROPS} fill="currentColor" stroke="none">
                    {[0,1,2].map((r) => [0,1,2].map((c) => (
                        <circle key={`${r}-${c}`} cx={6 + c * 6} cy={6 + r * 6} r="1.4" />
                    )))}
                </svg>
            );
        case 'shield':
            return <svg {...SVG_PROPS}><path d="M12 21s7-3.5 7-9V6l-7-3-7 3v6c0 5.5 7 9 7 9z"/><path d="M12 9v6M9 12h6"/></svg>;
        case 'home':
            return <svg {...SVG_PROPS}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>;
        case 'briefcase':
            return <svg {...SVG_PROPS}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>;
        case 'book':
            return <svg {...SVG_PROPS}><path d="M2 9l10-4 10 4-10 4z"/><path d="M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4"/><path d="M22 9v4"/></svg>;
        case 'leaf':
            return <svg {...SVG_PROPS}><path d="M12 3l-4 6h2l-3 5h2l-4 6h14l-4-6h2l-3-5h2z"/><path d="M12 20v2"/></svg>;
        case 'heart':
            return (
                <svg {...SVG_PROPS}>
                    <rect x="2" y="7" width="20" height="11" rx="3"/>
                    <circle cx="8" cy="12.5" r="1" fill="currentColor"/>
                    <path d="M7 11v3M5.5 12.5h3"/>
                    <circle cx="16" cy="11" r="1.2" fill="currentColor"/>
                    <circle cx="18" cy="14" r="1.2" fill="currentColor"/>
                </svg>
            );
        case 'plus':
            return (
                <svg {...SVG_PROPS}>
                    <path d="M12 17l-4-4a2.5 2.5 0 0 1 3.5-3.5l.5.5.5-.5A2.5 2.5 0 0 1 16 13z"/>
                    <path d="M3 14a3 3 0 0 1 3-3h2v8H6a3 3 0 0 1-3-3z"/>
                    <path d="M21 14a3 3 0 0 0-3-3h-2v8h2a3 3 0 0 0 3-3z"/>
                </svg>
            );
        case 'bus':
            return (
                <svg {...SVG_PROPS}>
                    <path d="M5 17V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v10"/>
                    <rect x="5" y="7" width="14" height="7" rx="1"/>
                    <circle cx="8" cy="18" r="1.5"/>
                    <circle cx="16" cy="18" r="1.5"/>
                    <path d="M5 14h14"/>
                </svg>
            );
        default: return null;
    }
}
