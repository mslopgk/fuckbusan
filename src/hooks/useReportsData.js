import { useState, useEffect } from 'react';
import { API_URL, authHeaders } from '../utils/api';

// 제보 목록 + 제안 목록을 동시에 fetching하는 공유 훅 (지도 뷰용 — 전체 로드)
export function useReportsData({ includeProposals = true } = {}) {
    const [reports, setReports] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const headers = authHeaders();
        const fetches = [
            fetch(`${API_URL}/api/reports/full`, { headers })
                .then((r) => (r.ok ? r.json() : []))
                .then((rows) => setReports(Array.isArray(rows) ? rows : (rows?.items ?? [])))
                .catch(() => setReports([])),
        ];

        if (includeProposals) {
            fetches.push(
                fetch(`${API_URL}/api/reports/proposals?skip=0&limit=9999`, { headers })
                    .then((r) => (r.ok ? r.json() : { items: [] }))
                    .then((data) => setProposals(Array.isArray(data) ? data : (data.items ?? [])))
                    .catch(() => setProposals([]))
            );
        }

        Promise.all(fetches).finally(() => setLoading(false));
    }, [includeProposals]);

    return { reports, proposals, loading };
}

// 제안만 fetching하는 훅 (지도 뷰용 — 전체 로드)
export function useProposalsData() {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/reports/proposals?skip=0&limit=9999`, { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then((data) => setProposals(Array.isArray(data) ? data : (data.items ?? [])))
            .catch(() => setProposals([]))
            .finally(() => setLoading(false));
    }, []);

    return { proposals, loading };
}
