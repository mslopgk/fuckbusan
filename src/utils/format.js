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

export function formatDraftDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 작성됨`;
    } catch {
        return '';
    }
}
