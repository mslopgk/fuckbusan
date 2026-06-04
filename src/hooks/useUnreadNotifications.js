import { useEffect, useState, useCallback, useRef } from 'react';
import { API_URL } from '../utils/api';

const POLL_INTERVAL_MS = 60_000;
const EVENT_NAME = 'unread-notifications:changed';

/**
 * 로그인 사용자의 안 읽은 알림 카운트.
 * - mount 시 1회 fetch
 * - 60초 폴링
 * - 탭 visibility 복귀 시 즉시 fetch
 * - 다른 컴포넌트(알림 화면 등)에서 읽음 처리 후 `notifyUnreadChanged()` 호출 시 동기화
 */
export function useUnreadNotifications() {
    const [count, setCount] = useState(0);
    const [hasToken, setHasToken] = useState(() => !!localStorage.getItem('access_token'));
    const timerRef = useRef(null);

    const fetchCount = useCallback(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setCount(0);
            setHasToken(false);
            return;
        }
        setHasToken(true);
        fetch(`${API_URL}/api/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : { count: 0 }))
            .then((j) => setCount(Number(j?.count) || 0))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchCount();
        timerRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);

        const onVisibility = () => {
            if (document.visibilityState === 'visible') fetchCount();
        };
        const onChanged = () => fetchCount();
        const onStorage = (e) => {
            if (e.key === 'access_token') fetchCount();
        };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener(EVENT_NAME, onChanged);
        window.addEventListener('storage', onStorage);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener(EVENT_NAME, onChanged);
            window.removeEventListener('storage', onStorage);
        };
    }, [fetchCount]);

    return { count, hasToken, refresh: fetchCount };
}

/** 다른 컴포넌트에서 알림 상태 변경 후 호출. 모든 listener가 즉시 재fetch. */
export function notifyUnreadChanged() {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
}
