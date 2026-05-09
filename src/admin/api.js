const API_BASE = `${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')}/api`;

export const fetchDashboardData = async (year, district) => {
    try {
        const res = await fetch(`${API_BASE}/dashboard/analysis?year=${year}&district=${district}`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch analysis:", e);
        return [];
    }
};

export const fetchScore = async (year, district) => {
    try {
        const res = await fetch(`${API_BASE}/dashboard/score?year=${year}&district=${district}`);
        if (!res.ok) return { score: 0, grade: 'N/A', trend: '-' };
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch score:", e);
        return { score: 0, grade: 'N/A', trend: '-' };
    }
};

export const fetchInsights = async (year, district) => {
    try {
        const res = await fetch(`${API_BASE}/dashboard/insights?year=${year}&district=${district}`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch insights:", e);
        return [];
    }
};

export const fetchPersonas = async (year, district) => {
    try {
        const res = await fetch(`${API_BASE}/dashboard/personas?year=${year}&district=${district}`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch personas:", e);
        return [];
    }
};

const api = {
    post: async (url, data) => {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                throw new Error(`API Error: ${res.status}`);
            }

            const json = await res.json();
            // Mimic Axios response structure
            return { data: json };
        } catch (e) {
            console.error("API POST Failed:", e);
            throw e;
        }
    },
    get: async (url) => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const json = await res.json();
            return { data: json };
        } catch (e) {
            console.error("API GET Failed:", e);
            throw e;
        }
    }
};

export default api;
