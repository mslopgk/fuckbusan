export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const authHeaders = (extra = {}) => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra };
};

export const fetchWithLogout = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        return res;
    } catch (error) {
        // TypeError 'Failed to fetch' is the typical Network Error in Chrome
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
            alert("서버와의 연결이 끊어졌습니다. 로그아웃 됩니다.");
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_name');
            // Force reload to reset app state and redirect to login/home
            window.location.href = '/';
            // note: using href='/' is safer than reload to ensure clean slate, 
            // though app likely handles '/' route. 
            // If we are in SPA without router that handles URL, reload might be better.
            // But reload keeps current path. 
            // Let's use reload to keep it simple, or setView logic?
            // api.js doesn't have access to setView.
            // If we reload, App checks token. If token missing, what happens?
            // App.jsx: if user clicks "diagnosis", it checks token.
            // If we want to return to "home" state effectively logged out.
        }
        throw error;
    }
};
