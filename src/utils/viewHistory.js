/* 조회 이력 / 관심목록 — 백엔드 테이블 없이 localStorage로 관리.
   - 최근 본 글: viewedAt 내림차순
   - 자주 본 글: count 내림차순
   - 관심목록: 좋아요한 제보(liked_report_ids) + 투표한 제안(/api/reports/voted-proposals)은 호출부에서 합성 */

const VIEW_KEY = 'view_history';
const MAX_ENTRIES = 100;

const read = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const write = (key, arr) => {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch { /* quota 등 무시 */ }
};

/* 상세 진입 시 호출. item: { type:'report'|'proposal'|'survey'|'diagnosis', id, title, category, region } */
export const recordView = (item) => {
    if (!item || item.id == null || !item.type) return;
    const key = `${item.type}:${item.id}`;
    const now = Date.now();
    const list = read(VIEW_KEY).filter((e) => e && e.key);
    const idx = list.findIndex((e) => e.key === key);
    if (idx >= 0) {
        const prev = list[idx];
        list.splice(idx, 1);
        list.unshift({ ...prev, ...sanitize(item), key, viewedAt: now, count: (prev.count || 1) + 1 });
    } else {
        list.unshift({ ...sanitize(item), key, viewedAt: now, count: 1 });
    }
    write(VIEW_KEY, list.slice(0, MAX_ENTRIES));
};

const sanitize = (item) => ({
    type: item.type,
    id: item.id,
    title: item.title || '(제목 없음)',
    category: item.category || '',
    region: item.region || '',
    status: item.status || '',
});

/* 최근 본 글 (viewedAt desc) */
export const getRecentViews = (limit = 20) =>
    read(VIEW_KEY).filter((e) => e && e.key).sort((a, b) => (b.viewedAt || 0) - (a.viewedAt || 0)).slice(0, limit);

/* 자주 본 글 (count desc, 동률은 최근순) — 2회 이상만 "자주"로 노출 */
export const getFrequentViews = (limit = 20) =>
    read(VIEW_KEY)
        .filter((e) => e && e.key && (e.count || 1) >= 2)
        .sort((a, b) => (b.count || 1) - (a.count || 1) || (b.viewedAt || 0) - (a.viewedAt || 0))
        .slice(0, limit);

export const clearViewHistory = () => write(VIEW_KEY, []);
