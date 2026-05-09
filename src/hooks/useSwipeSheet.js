import { useState, useRef } from 'react';

export function useSwipeSheet(initialExpanded = false) {
    const [expanded, setExpanded] = useState(initialExpanded);
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
        if (Math.abs(dy) < 24 && dt < 250) {
            setExpanded((v) => !v);
            return;
        }
        if (dy < -40) setExpanded(true);
        else if (dy > 40) setExpanded(false);
    };

    return { expanded, setExpanded, onTouchStart, onTouchEnd };
}
