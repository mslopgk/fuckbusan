import { useState, useEffect } from 'react';
import { API_URL, authHeaders } from '../utils/api';

// 제보 목록 + 제안 목록을 동시에 fetching하는 공유 훅
export function useReportsData({ includeProposals = true } = {}) {
    const [reports, setReports] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const headers = authHeaders();
        const fetches = [
            fetch(`${API_URL}/api/reports/full`, { headers })
                .then((r) => (r.ok ? r.json() : []))
                .then((rows) => setReports(Array.isArray(rows) ? rows : []))
                .catch(() => setReports([])),
        ];

        if (includeProposals) {
            fetches.push(
                fetch(`${API_URL}/api/reports/proposals`, { headers })
                    .then((r) => (r.ok ? r.json() : []))
                    .then((rows) => setProposals(Array.isArray(rows) ? rows : []))
                    .catch(() => setProposals([]))
            );
        }

        Promise.all(fetches).finally(() => setLoading(false));
    }, [includeProposals]);

    return { reports, proposals, loading };
}

// 제안만 fetching하는 훅
export function useProposalsData() {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/reports/proposals`, { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setProposals(Array.isArray(rows) ? rows : []))
            .catch(() => setProposals([]))
            .finally(() => setLoading(false));
    }, []);

    return { proposals, loading };
}
