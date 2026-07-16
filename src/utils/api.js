export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// 응답 본문을 안전하게 JSON 파싱. 빈 본문/비JSON/스트림 재사용 시 {}로 폴백.
// (res.json()을 두 번 호출하면 "body stream already read", 빈 204/500 본문이면 "unexpected end of JSON input" 발생)
export const safeJson = async (res) => {
    try {
        const text = await res.text();
        return text ? JSON.parse(text) : {};
    } catch {
        return {};
    }
};

export const authHeaders = (extra = {}) => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra };
};

// 페이지 이탈(리로드/이동) 중에는 in-flight fetch가 취소되며 TypeError가 발생하므로
// 그 순간의 실패를 서버 다운으로 오인해 로그아웃하면 안 된다.
let _pageUnloading = false;
if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => { _pageUnloading = true; });
    window.addEventListener('beforeunload', () => { _pageUnloading = true; });
}

export const fetchWithLogout = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        return res;
    } catch (error) {
        // 주의: TypeError('Failed to fetch')는 서버 다운뿐 아니라 페이지 이동/리로드로
        // in-flight 요청이 취소될 때도 발생 → 여기서 강제 로그아웃하면 정상 사용자가
        // 화면 전환 중 스퓨리어스 로그아웃됨(QA 재현 2회). 서버 생존 여부를 재확인한
        // 경우에만 로그아웃 처리한다.
        if (_pageUnloading) throw error;
        if (error.name === 'TypeError' || String(error.message).includes('Failed to fetch')) {
            try {
                // 800ms 안에 서버가 응답하면 일시적 취소/흔들림 → 로그아웃하지 않고 에러만 전달
                await fetch('/api/home/stats', { method: 'GET', signal: AbortSignal.timeout(800), cache: 'no-store' });
            } catch {
                // 재확인도 실패 → 진짜 서버 연결 불가로 판단
                alert('서버와의 연결이 끊어졌습니다. 로그아웃 됩니다.');
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_name');
                window.location.href = '/';
            }
        }
        throw error;
    }
};
