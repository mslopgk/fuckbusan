import { useState, useRef, useCallback } from 'react';

// 모바일 지도 바텀시트 — 2-snap (collapsed/mid). full은 별도 list 페이지로 navigate.
// 드래그 중 dragY로 실시간 follow → release 시 가장 가까운 snap으로 이동.
const SNAPS = ['collapsed', 'mid'];

export function useSwipeSheet(initial = 'mid') {
    const [snap, setSnap] = useState(initial);
    const [dragY, setDragY] = useState(0);
    const [dragging, setDragging] = useState(false);
    const startYRef = useRef(0);
    const startTRef = useRef(0);
    const lastYRef = useRef(0);

    const onTouchStart = useCallback((e) => {
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        startYRef.current = y;
        lastYRef.current = y;
        startTRef.current = Date.now();
        setDragging(true);
    }, []);

    const onTouchMove = useCallback((e) => {
        if (!dragging) return;
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        const dy = y - startYRef.current;
        lastYRef.current = y;
        // mid에서 더 위로 가지 못하게 살짝 저항 (rubber-band)
        const idx = SNAPS.indexOf(snap);
        if (dy < 0 && idx === SNAPS.length - 1) {
            setDragY(dy / 3); // 위로는 저항
        } else if (dy > 0 && idx === 0) {
            setDragY(dy / 3); // 아래로 collapsed 더 가지 못하게
        } else {
            setDragY(dy);
        }
    }, [dragging, snap]);

    const onTouchEnd = useCallback((e, { onSwipeUpAtTop } = {}) => {
        if (!dragging) return;
        const y = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) ?? lastYRef.current;
        const dy = y - startYRef.current;
        const dt = Date.now() - startTRef.current;
        const idx = SNAPS.indexOf(snap);
        const velocity = dt > 0 ? Math.abs(dy) / dt : 0; // px/ms

        setDragging(false);
        setDragY(0);

        // 탭(이동량 적고 빠른 release) → snap 토글
        if (Math.abs(dy) < 12 && dt < 220) return;

        // 빠른 플릭(velocity 기반) 또는 거리 기준
        const flick = velocity > 0.6;
        const threshold = flick ? 25 : 50;

        if (dy < -threshold) {
            if (idx === SNAPS.length - 1) {
                onSwipeUpAtTop?.();
            } else {
                setSnap(SNAPS[idx + 1]);
            }
        } else if (dy > threshold) {
            setSnap(SNAPS[Math.max(idx - 1, 0)]);
        }
    }, [dragging, snap]);

    return { snap, setSnap, dragY, dragging, onTouchStart, onTouchMove, onTouchEnd };
}
