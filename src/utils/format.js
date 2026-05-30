/**
 * Given an image URL from the uploads endpoint, returns the thumbnail URL.
 * Pattern: /uploads/abc.jpg → /uploads/thumb_abc.jpg
 *          https://s3.../abc.jpg → https://s3.../thumb_abc.jpg
 * Returns null if src is falsy.
 */
export function thumbUrl(src) {
    if (!src) return null;
    // local /uploads/<filename>
    const localMatch = src.match(/^(\/uploads\/)([^/]+)$/);
    if (localMatch) return `${localMatch[1]}thumb_${localMatch[2]}`;
    // S3 https://bucket.s3.region.amazonaws.com/<filename>
    const s3Match = src.match(/^(https:\/\/[^/]+\.amazonaws\.com\/)([^/]+)$/);
    if (s3Match) return `${s3Match[1]}thumb_${s3Match[2]}`;
    return null;
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function extractDistrict(address) {
    if (!address) return '부산';
    const m = address.match(/([가-힣]+구)/);
    return m ? m[1] : '부산';
}

// region 필드와 필터 region(예: '동래구') 매칭. "부산 진구"/"부산진구"/null 등 표기 차이 흡수.
export function matchDistrict(itemRegion, filter) {
    if (!filter || filter === '부산전체') return true;
    if (!itemRegion) return false;
    const a = String(itemRegion).replace(/\s+/g, '');
    const b = String(filter).replace(/\s+/g, '');
    if (a === b) return true;
    return a.includes(b) || b.includes(a);
}

// 가장 가까운 부산 구 추정 — 데이터에 region 정보가 없을 때 lat/lng로 fallback.
export function nearestDistrict(lat, lng, centers) {
    if (typeof lat !== 'number' || typeof lng !== 'number' || !centers) return null;
    let best = null, bestDist = Infinity;
    for (const [name, [clat, clng]] of Object.entries(centers)) {
        const d = (lat - clat) ** 2 + (lng - clng) ** 2;
        if (d < bestDist) { bestDist = d; best = name; }
    }
    return best;
}

export function formatDraftDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 작성됨`;
    } catch {
        return '';
    }
}
