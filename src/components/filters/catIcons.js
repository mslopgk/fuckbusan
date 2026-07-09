// 생활정보 카테고리 아이콘 매핑 (Figma TCuOzEqNhoLKjhF0reBDks 302:5940 export)
// 아이콘 원본: public/figma-assets/icons/cat/*.svg (Figma에서 export, 손으로 그리지 않음)
const B = '/figma-assets/icons/cat';

export const CAT_ICON = {
    '전체': `${B}/cat_all.svg`,
    '주거': `${B}/cat_housing.svg`,
    '환경': `${B}/cat_environment.svg`,
    '교통': `${B}/cat_traffic.svg`,
    '안전': `${B}/cat_safety.svg`,
    '교육': `${B}/cat_education.svg`,
    '산업·일자리': `${B}/cat_industry.svg`,
    '문화·여가': `${B}/cat_culture.svg`,
    '보건·복지': `${B}/cat_welfare.svg`,
};

// 페이지마다 라벨 표기가 다른 경우 별칭 매핑 (ProposalList 데스크톱 등)
export const CAT_ICON_ALIAS = {
    '산업 및 고용': `${B}/cat_industry.svg`,
    '산업 일자리': `${B}/cat_industry.svg`,
    '모빌리티': `${B}/cat_traffic.svg`,
    '문화 및 레저': `${B}/cat_culture.svg`,
    '문화·레저': `${B}/cat_culture.svg`,
    '보건 및 복지': `${B}/cat_welfare.svg`,
};

export function catIcon(label) {
    return CAT_ICON[label] || CAT_ICON_ALIAS[label] || CAT_ICON['전체'];
}

// Figma 302:5940에서 인스턴스가 좌우 반전(-scale-y-100 rotate-180)된 아이콘 →
// raw export가 미러링돼 있어 표시 시 되돌린다.
const FLIP_LABELS = new Set(['전체', '안전', '주거', '교통']);
export function catIconFlipped(label) {
    return FLIP_LABELS.has(label);
}
