// 일반 list/detail 팔레트 (MProposalList/MReportList/MProposalDetail/MReportDetail/Map)
export const CAT_STYLES = {
    '주거':       { bg: '#E0F4F1', color: '#2C9A8F' },
    '환경':       { bg: '#E5F3DA', color: '#5B8E2E' },
    '교통':       { bg: '#E0EAF7', color: '#2D5BA1' },
    '산업·일자리': { bg: '#FAEEDA', color: '#A07321' },
    '교육':       { bg: '#FAE2E5', color: '#C24656' },
    '안전':       { bg: '#FFE0DA', color: '#C2522E' },
    '문화·여가':   { bg: '#EBE0F7', color: '#6E3FA1' },
    '보건·복지':   { bg: '#F5DDEC', color: '#A33780' },
};

// 마이페이지 팔레트 (Figma 830:6934 / 7233 의도) — 주거=노랑, 교통=핑크 등 다른 매핑
export const MY_CAT_STYLES = {
    '주거':       { bg: '#FFF6CC', color: '#C49A12' },
    '환경':       { bg: '#E0F4F1', color: '#2C9A8F' },
    '교통':       { bg: '#FCDAE3', color: '#E6235A' },
    '안전':       { bg: '#FFE2D6', color: '#E2742C' },
    '교육':       { bg: '#FCDAE3', color: '#E6235A' },
    '산업·일자리': { bg: '#FCDAE3', color: '#E6235A' },
    '문화·여가':   { bg: '#E0F4F1', color: '#2C9A8F' },
    '보건·복지':   { bg: '#FFE2D6', color: '#E2742C' },
};

export const CAT_STYLE_FALLBACK = { bg: '#eee', color: '#555' };

export function getCatStyle(cat) {
    return CAT_STYLES[cat] || CAT_STYLE_FALLBACK;
}

export function getMyCatStyle(cat) {
    return MY_CAT_STYLES[cat] || CAT_STYLE_FALLBACK;
}
