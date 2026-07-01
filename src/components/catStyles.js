// 일반 list/detail 팔레트 (MProposalList/MReportList/MProposalDetail/MReportDetail/Map)
// Figma WDC 확인값: 배경색은 Figma 팔레트, 텍스트는 #242424 (검정) 통일
export const CAT_STYLES = {
    '주거':       { bg: '#dff8f8', color: '#242424' },
    '환경':       { bg: '#c0e6c0', color: '#242424' },
    '교통':       { bg: '#E0EAF7', color: '#242424' },
    '산업·일자리': { bg: '#FAEEDA', color: '#242424' },
    '교육':       { bg: '#ffc9c9', color: '#242424' },
    '안전':       { bg: '#FFE0DA', color: '#242424' },
    '문화·여가':   { bg: '#EBE0F7', color: '#242424' },
    '보건·복지':   { bg: '#F5DDEC', color: '#242424' },
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
