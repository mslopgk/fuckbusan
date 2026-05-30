import { useState, useRef } from 'react';

const SNAPS = ['collapsed', 'mid', 'full'];

export function useSwipeSheet(initial = 'mid') {
    const [snap, setSnap] = useState(initial);
    const startYRef = useRef(0);
    const startTRef = useRef(0);

    const onTouchStart = (e) => {
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        startYRef.current = y;
        startTRef.current = Date.now();
    };

    const onTouchEnd = (e) => {
        const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const dy = y - startYRef.current;
        const dt = Date.now() - startTRef.current;
        const idx = SNAPS.indexOf(snap);

        if (Math.abs(dy) < 20 && dt < 250) return;

        if (dy < -50) setSnap(SNAPS[Math.min(idx + 1, SNAPS.length - 1)]);
        else if (dy > 50) setSnap(SNAPS[Math.max(idx - 1, 0)]);
    };

    return { snap, setSnap, onTouchStart, onTouchEnd };
}
