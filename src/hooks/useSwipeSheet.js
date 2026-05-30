import { useState, useRef } from 'react';

// 모바일 지도 바텀시트 — 2-snap (collapsed/mid). full은 별도 list 페이지로 navigate.
const SNAPS = ['collapsed', 'mid'];

export function useSwipeSheet(initial = 'mid') {
    const [snap, setSnap] = useState(initial);
    const startYRef = useRef(0);
    const startTRef = useRef(0);

    const onTouchStart = (e) => {
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        startYRef.current = y;
        startTRef.current = Date.now();
    };

    const onTouchEnd = (e, { onSwipeUpAtTop } = {}) => {
        const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const dy = y - startYRef.current;
        const dt = Date.now() - startTRef.current;
        const idx = SNAPS.indexOf(snap);

        if (Math.abs(dy) < 20 && dt < 250) return;

        if (dy < -50) {
            if (idx === SNAPS.length - 1) {
                // 이미 mid에서 위로 스와이프 → list 페이지로 이동
                onSwipeUpAtTop?.();
            } else {
                setSnap(SNAPS[idx + 1]);
            }
        } else if (dy > 50) {
            setSnap(SNAPS[Math.max(idx - 1, 0)]);
        }
    };

    return { snap, setSnap, onTouchStart, onTouchEnd };
}
