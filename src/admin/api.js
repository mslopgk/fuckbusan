export const fetchDashboardData = async (year, district) => {
    // Mock analysis data
    // Mock analysis data - Array of District Objects with Category Scores
    return [
        { name: '21310', housing: 75, env: 82, transport: 65, safety: 88, culture: 70, welfare: 72 }, // 기장군
        { name: '21150', housing: 65, env: 70, transport: 60, safety: 75, culture: 60, welfare: 68 }, // 사상구
        { name: '21140', housing: 80, env: 85, transport: 75, safety: 90, culture: 85, welfare: 80 }, // 수영구
        { name: '21130', housing: 78, env: 80, transport: 72, safety: 85, culture: 78, welfare: 75 }, // 연제구
        { name: '21120', housing: 72, env: 78, transport: 68, safety: 82, culture: 70, welfare: 72 }, // 강서구
        { name: '21110', housing: 76, env: 82, transport: 74, safety: 86, culture: 75, welfare: 78 }, // 금정구
        { name: '21100', housing: 68, env: 72, transport: 65, safety: 78, culture: 65, welfare: 70 }, // 사하구
        { name: '21090', housing: 85, env: 88, transport: 80, safety: 92, culture: 90, welfare: 85 }, // 해운대구
        { name: '21080', housing: 70, env: 75, transport: 68, safety: 80, culture: 68, welfare: 72 }, // 북구
        { name: '21070', housing: 75, env: 80, transport: 72, safety: 85, culture: 75, welfare: 78 }, // 남구
        { name: '21060', housing: 82, env: 84, transport: 78, safety: 88, culture: 82, welfare: 80 }, // 동래구
        { name: '21050', housing: 74, env: 76, transport: 85, safety: 72, culture: 88, welfare: 82 }, // 부산진구
        { name: '21040', housing: 65, env: 70, transport: 62, safety: 75, culture: 65, welfare: 70 }, // 영도구
        { name: '21030', housing: 68, env: 72, transport: 60, safety: 76, culture: 70, welfare: 74 }, // 서구
        { name: '21020', housing: 70, env: 74, transport: 80, safety: 72, culture: 72, welfare: 76 }, // 동구
        { name: '21010', housing: 72, env: 76, transport: 75, safety: 80, culture: 85, welfare: 78 }, // 중구
    ];
};

export const fetchScore = async (year, district) => {
    return { score: 78.5, grade: 'B+', trend: '+2.4%' };
};

export const fetchInsights = async (year, district) => {
    // Mock insights with coordinates
    return [
        {
            id: 1,
            title: '안전사고 감소',
            description: 'CCTV 설치 확대 효과',
            type: 'positive',
            category: 'safety',
            severity: 'low',
            latitude: 35.1576,
            longitude: 129.0591, // Busan Jin-gu approx
            date: '2025-12-10',
            proposer: '김철수',
            image_url: 'https://placehold.co/300x200?text=Safety+CCTV'
        },
        {
            id: 2,
            title: '교통 체증',
            description: '주요 교차로 혼잡도 증가',
            type: 'negative',
            category: 'transport',
            severity: 'high',
            latitude: 35.1631,
            longitude: 129.1636, // Haeundae approx
            date: '2025-12-12',
            proposer: '이영희',
            image_url: 'https://placehold.co/300x200?text=Traffic+Jam'
        },
        {
            id: 3,
            title: '쓰레기 무단 투기',
            description: '골목길 미관 저해',
            type: 'negative',
            category: 'environment',
            severity: 'medium',
            latitude: 35.1062,
            longitude: 128.9669, // Saha-gu approx
            date: '2025-12-13',
            proposer: '박민수',
            image_url: 'https://placehold.co/300x200?text=Trash'
        },
    ];
};

export const fetchPersonas = async (year, district) => {
    return [
        {
            id: 1,
            name: '김철수',
            age: 72,
            job: '은퇴 (전 자영업)',
            district_code: '21050',
            image_emoji: '👴',
            tags: ['산책', '안전', '공원'],
            pain_points: ['경사로 보행 불편', '가로등 부족'],
            stats: { suggestion: 5, report: 3, diagnosis: 8 },
            quote: '저녁에 공원 나갈 때마다 어두워서 발목을 삐끗할 뻔했어. 가로등 좀 더 밝게 안 되나?',
            message: '저녁에 공원 나갈 때마다 어두워서 발목을 삐끗할 뻔했어. 가로등 좀 더 밝게 안 되나?'
        },
        {
            id: 2,
            name: '이영희',
            age: 28,
            job: '디자이너',
            district_code: '21090',
            image_emoji: '👩‍🎨',
            tags: ['문화', '출퇴근', '대중교통'],
            pain_points: ['버스 배차 간격', '문화 시설 부족'],
            stats: { suggestion: 12, report: 2, diagnosis: 5 },
            quote: '센텀 쪽 출퇴근 버스가 너무 꽉 차서 힘들어요. 아침마다 전쟁이라니까요.',
            message: '센텀 쪽 출퇴근 버스가 너무 꽉 차서 힘들어요. 아침마다 전쟁이라니까요.'
        },
        {
            id: 3,
            name: '박지민',
            age: 10,
            job: '초등학생',
            district_code: '21110',
            image_emoji: '👦',
            tags: ['학교', '놀이터', '교통안전'],
            pain_points: ['스쿨존 과속', '놀이 기구 노후'],
            stats: { suggestion: 0, report: 1, diagnosis: 0 },
            quote: '학교 앞 횡단보도에서 차들이 너무 쌩쌩 달려요. 무서워요!',
            message: '학교 앞 횡단보도에서 차들이 너무 쌩쌩 달려요. 무서워요!'
        }
    ];
};

const api = {
    post: async (url, data) => {
        if (url === '/auth/login') {
            // Mock login success
            return {
                data: {
                    access_token: 'dummy_token',
                    username: 'Admin User'
                }
            };
        }
        return {};
    }
};

export default api;
