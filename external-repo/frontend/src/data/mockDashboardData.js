// import { AlertTriangle, Lightbulb, TrendingUp, Info } from 'lucide-react';

import { DISTRICTS as DISTRICT_CONSTANTS } from './constants';

const DISTRICTS = DISTRICT_CONSTANTS.filter(d => d.id !== 'all').map(d => d.name);

// Deterministic random number generator
const mulberry32 = (a) => {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Convert string to seed
const stringToSeed = (str) => {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export const fetchAnalysisData = (year, district) => {
    // Helper to check if we should show all
    const showAll = !Array.isArray(district) || district.length === 0 || district === 'all';

    if (showAll) {
        return DISTRICTS.map(d => {
            const seed = stringToSeed(`${year}-${d}`);
            const rand = mulberry32(seed);
            return {
                name: d,
                housing: Math.floor(rand() * 40) + 10,
                env: Math.floor(rand() * 40) + 10,
                transport: Math.floor(rand() * 40) + 10,
                safety: Math.floor(rand() * 40) + 10,
            };
        });
    }

    // If single district selected, show monthly trend
    if (Array.isArray(district) && district.length === 1) {
        const dCode = district[0];
        const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        return months.map(m => {
            const seed = stringToSeed(`${year}-${dCode}-${m}`);
            const rand = mulberry32(seed);
            return {
                name: m,
                housing: Math.floor(rand() * 20) + 5,
                env: Math.floor(rand() * 20) + 5,
                transport: Math.floor(rand() * 20) + 5,
                safety: Math.floor(rand() * 20) + 5,
            }
        });
    }

    // If multiple districts selected, show comparison
    if (Array.isArray(district) && district.length > 1) {
        // Map codes to names
        const selectedNames = district.map(d => getDistrictName(d));
        // Filter DISTRICTS to ensure order and existence
        const targets = DISTRICTS.filter(d => selectedNames.includes(d));

        return targets.map(d => {
            const seed = stringToSeed(`${year}-${d}`);
            const rand = mulberry32(seed);
            return {
                name: d,
                housing: Math.floor(rand() * 40) + 10,
                env: Math.floor(rand() * 40) + 10,
                transport: Math.floor(rand() * 40) + 10,
                safety: Math.floor(rand() * 40) + 10,
            };
        });
    }

    return [];
};

export const fetchScore = (year, district) => {
    // Handle array input for seed
    const districtKey = Array.isArray(district) ? district.join(',') : district;
    const seed = stringToSeed(`${year}-${districtKey}`);
    const rand = mulberry32(seed);
    const score = 60 + Math.floor(rand() * 40); // 60 ~ 100
    const prevScore = 60 + Math.floor(mulberry32(seed + 1)() * 40);
    const diff = (score - prevScore).toFixed(1);

    let grade = 'C';
    if (score >= 90) grade = 'S';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';

    return {
        value: score,
        grade: grade,
        trend: diff > 0 ? `+${diff}% 대비` : `${diff}% 대비`
    };
};

// import { AlertTriangle, Lightbulb, TrendingUp, Info } from 'lucide-react';

export const fetchInsights = (year, district) => {
    const districtKey = Array.isArray(district) ? district.join(',') : district;
    const seed = stringToSeed(`${year}-${districtKey}`);
    const rand = mulberry32(seed);

    const types = ['danger', 'warning', 'info'];
    // const icons = { danger: AlertTriangle, warning: AlertTriangle, info: Lightbulb };
    const colors = {
        danger: 'text-rose-500 dark:text-red-400',
        warning: 'text-orange-500 dark:text-orange-400',
        info: 'text-yellow-500 dark:text-yellow-400'
    };

    let districtName = '부산시 전체';
    if (Array.isArray(district) && district.length > 0) {
        districtName = district.length === 1 ? getDistrictName(district[0]) : `${district.length}개 지역 복합`;
    } else if (district !== 'all') {
        districtName = getDistrictName(district);
    }

    const insights = [];
    const count = Math.floor(rand() * 5) + 5; // 5 to 9 insights

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(rand() * types.length)];
        // Re-seed for randomness inside loop
        const innerRand = mulberry32(seed + i);

        insights.push({
            id: i,
            type: type,
            title: `[${type.toUpperCase()}] ${districtName}: 이슈 #${i + 1}`,
            desc: `${year}년 데이터 기반 분석 결과입니다.`,
            icon: type, // Return string ID instead of component
            color: colors[type]
        });
    }
    return insights;
};

export const fetchPersonas = (year, district) => {
    const districtKey = Array.isArray(district) ? district.join(',') : district;
    const seed = stringToSeed(`${year}-${districtKey}-persona-v2`);
    const rand = mulberry32(seed);

    let districtName = '부산';
    if (Array.isArray(district) && district.length > 0) {
        districtName = district.length === 1 ? getDistrictName(district[0]) : `선택지역`;
    } else if (district !== 'all') {
        districtName = getDistrictName(district);
    }

    // Predefined Archetypes for consistency
    const archetypes = [
        {
            type: 'senior',
            names: ['홍길동', '김영자', '박춘식', '이말순', '최억만', '정봉수'],
            ages: [72, 75, 68, 70, 81, 65],
            gender: ['남성', '여성', '남성'],
            tags: [['#액티브시니어', '#낭만어부', '#손자바라기'], ['#시장단골', '#골목수다쟁이'], ['#등산마니아', '#건강제일']],
            jobs: ['은퇴자', '주부', '자영업'],
            hobbies: ['여행, 건강, 친구', '손주 돌보기, 요리', '등산, 바둑'],
            concerns: ['다리가 아파서 걷기 힘들다', '짐 들고 다니기 무겁다', '밤길이 너무 어둡다'],
            painPoints: [
                '급경사 계단 위험',
                '안전손잡이/조명 부재',
                '중간 쉼터 없음'
            ],
            suggestions: [
                '계단 핸드레일 및 미끄럼 방지 포장 필수',
                '경사로 중간 쌈지공원(쉼터 벤치) 조성',
                '고지대 전용 공공 모빌리티 도입 검토'
            ],
            effects: [
                '보행 안전사고 감소',
                '노년층 외출 빈도 증가'
            ],
            avatars: ['👴', '👵']
        },
        {
            type: 'youth',
            names: ['이서연', '박준호', '최지민', '김민재', '박소담', '정우성'],
            ages: [22, 24, 21, 23, 20, 26],
            gender: ['여성', '남성', '여성'],
            tags: [['#대학생', '#카페탐방러', '#야간도보족'], ['#취준생', '#도서관러'], ['#알바몬', '#뚜벅이']],
            jobs: ['대학생', '취업준비생', '대학생'],
            hobbies: ['카페 투어, 인스타', '독서, 게임', '영화, 쇼핑'],
            concerns: ['늦게 집에 갈 때 무섭다', '버스 배차 간격이 길다', '문화 시설이 부족하다'],
            painPoints: [
                '골목길 사각지대 존재',
                '비상벨 시인성 부족',
                '노후 가로등 조도 낮음'
            ],
            suggestions: [
                '범죄예방환경설계(CPTED) 적용 확대',
                '스마트 가로등 및 로고젝터 설치',
                '안심 귀갓길 조성 및 모니터링 강화'
            ],
            effects: [
                '야간 보행 불안감 해소',
                '청년층 유동인구 증가'
            ],
            avatars: ['👩', '👨', '👧']
        },
        {
            type: 'parent',
            names: ['정해준', '이미소', '강현우', '박지선', '김태훈', '이수진'],
            ages: [33, 35, 38, 31, 40, 36],
            gender: ['남성', '여성', '남성'],
            tags: [['#경찰관', '#야간순찰', '#동네지킴이'], ['#워킹맘', '#육아전쟁'], ['#딸바보', '#안전제일']],
            jobs: ['경찰관', '회사원', '자영업'],
            hobbies: ['운동, 캠핑', '아이와 여행, 독서', '낚시, 요리'],
            concerns: ['아이들 통학로가 위험하다', '놀이터가 낡았다', '유모차 끌기가 힘들다'],
            painPoints: [
                '어린이 보호구역 내 불법주정차',
                '보도 턱이 높아 유모차 통행 불편',
                '놀이시설 안전기준 미달'
            ],
            suggestions: [
                '스마트 횡단보도 및 옐로우카펫 설치',
                '무장애 보행로(Barrier-free) 정비',
                '안전 인증 친환경 놀이터 리모델링'
            ],
            effects: [
                '어린이 교통사고 제로화',
                '아이 키우기 좋은 환경 조성'
            ],
            avatars: ['👮', '👩‍💼', '👨‍💼']
        }
    ];

    const feedbacks = [];
    // Generate 8 personas
    for (let i = 0; i < 8; i++) {
        const innerRand = mulberry32(seed + i);
        const typeIdx = Math.floor(innerRand() * archetypes.length);
        const arch = archetypes[typeIdx];

        const nameIdx = Math.floor(innerRand() * arch.names.length);
        const selectedTagIdx = Math.floor(innerRand() * arch.tags.length);

        feedbacks.push({
            id: i,
            name: arch.names[nameIdx],
            age: arch.ages[nameIdx],
            gender: arch.gender[nameIdx],
            address: `${districtName}`,
            tags: arch.tags[nameIdx] || arch.tags[0],
            job: arch.jobs[nameIdx] || arch.jobs[0],
            hobbies: arch.hobbies[nameIdx] || arch.hobbies[0],
            concern: arch.concerns[nameIdx] || arch.concerns[0],
            shortComment: `"${arch.concerns[nameIdx] || arch.concerns[0]}"`,
            fullQuote: `"${districtName}에 살면서 가장 불편한 점은 ${arch.concerns[nameIdx] || arch.concerns[0]}입니다. 특히 요즘 같은 때는 더 걱정이 돼요. 우리 동네가 좀 더 안전하고 살기 좋아졌으면 좋겠어요."`,
            painPoints: arch.painPoints,
            suggestions: arch.suggestions,
            expectedEffects: arch.effects,
            avatar: arch.avatars[Math.floor(innerRand() * arch.avatars.length)],
            stats: {
                suggestion: Math.floor(innerRand() * 300) + 100,
                report: Math.floor(innerRand() * 500) + 200,
                diagnosis: Math.floor(innerRand() * 100) + 20
            }
        });
    }
    return feedbacks;
}

const getDistrictName = (code) => {
    // Simple helper to map code to name if code is passed, or just return code if it's name
    // Since mock logic handles strings mostly, we assume code might be passed.
    // Ideally use shared constant but for mock independent, let's map commonly used ones if needed.
    // For now, let's assume 'district' param is the CODE.
    const map = {
        '21310': '기장군', '21150': '사상구', '21140': '수영구', '21130': '연제구',
        '21120': '강서구', '21110': '금정구', '21100': '사하구', '21090': '해운대구',
        '21080': '북구', '21070': '남구', '21060': '동래구', '21050': '부산진구',
        '21040': '영도구', '21030': '동구', '21020': '서구', '21010': '중구'
    };
    return map[code] || code; // Fallback to code if not found or if it was already a name
}
