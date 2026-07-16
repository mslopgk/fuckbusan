import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import '../styles/admin_layout.css';
import '../styles/dashboard_new.css'; // 셸 CSS — lazy 단독 진입 시에도 로드
import { API_BASE } from '../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-gl3d-dist-min';
import './SurveyChatAnalytics.css';

const Plot = createPlotlyComponent(Plotly);

/* 어드민 — AI 대화형 설문 시각화 (shain1912/test4 analysis.py 이식)
   토픽 요약 카드 + 카테고리/심각도/위치 분포 + 이슈 3D 군집화(임베딩+KMeans+t-SNE) */

const CLUSTER_COLORS = ['#542aa3', '#23bdbb', '#f74e7e', '#dd5b1b', '#2f9e44', '#1d6fb8'];
const SEV_COLOR = ['#cfcfd4', '#9ad0cf', '#23bdbb', '#dd8a1b', '#e6235a'];

export default function SurveyChatAnalytics({ onNavigate }) {
    const [data, setData] = useState(null);
    const [clusters, setClusters] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    // 군집 분석(OpenAI 임베딩)은 비용이 있어 버튼으로만 실행
    const [clusterLoading, setClusterLoading] = useState(false);
    const [clusterErr, setClusterErr] = useState(null);

    // 집계(DB only, 무료)는 진입 시 자동 로드
    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true); setErr(null);
            try {
                const a = await fetch(`${API_BASE}/survey-chat/analytics`).then((r) => r.json());
                if (!alive) return;
                setData(a);
            } catch (e) {
                if (alive) setErr('데이터를 불러오지 못했습니다.');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    // 군집 분석 실행 — 버튼 클릭 시에만. force=true면 캐시 무시 재계산.
    const runClusters = async (force = false) => {
        setClusterLoading(true); setClusterErr(null);
        try {
            const c = await fetch(
                `${API_BASE}/survey-chat/clusters${force ? '?force=true' : ''}`
            ).then((r) => r.json());
            setClusters(c);
        } catch (e) {
            setClusterErr('군집 분석에 실패했습니다.');
        } finally {
            setClusterLoading(false);
        }
    };

    // plotly 3D 트레이스: 군집별로 분리
    const plotData = useMemo(() => {
        const pts = clusters?.points || [];
        if (!pts.length) return [];
        const byCluster = {};
        pts.forEach((p) => { (byCluster[p.cluster] ||= []).push(p); });
        return Object.entries(byCluster).map(([cid, members]) => {
            const meta = (clusters.clusters || []).find((m) => m.cluster === Number(cid));
            return {
                type: 'scatter3d', mode: 'markers',
                name: meta ? `${meta.label} (${meta.count})` : `군집 ${cid}`,
                x: members.map((m) => m.x), y: members.map((m) => m.y), z: members.map((m) => m.z),
                text: members.map((m) => `${m.issue}<br>분류:${m.category} · 심각도:${m.severity ?? '-'}<br>${m.location || ''}`),
                hoverinfo: 'text',
                marker: {
                    size: 7, color: CLUSTER_COLORS[Number(cid) % CLUSTER_COLORS.length],
                    opacity: 0.9, line: { width: 0.5, color: '#fff' },
                },
            };
        });
    }, [clusters]);

    const maxLoc = useMemo(() => Math.max(1, ...(data?.locations || []).map((l) => l.count)), [data]);

    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyChatAnalytics">
            <div className="sca">
                <div className="sca-head">
                    <h1 className="sca-title">AI 대화형 설문 분석</h1>
                    <p className="sca-sub">수집된 시민 인터뷰 이슈를 토픽·심각도·위치별로 분석하고 의미적으로 군집화합니다.</p>
                </div>

                {loading && <div className="sca-empty">불러오는 중…</div>}
                {err && <div className="sca-empty">{err}</div>}

                {!loading && !err && data && (
                    <>
                        <div className="sca-kpis">
                            <div className="sca-kpi"><span className="sca-kpi-num">{data.total}</span><span className="sca-kpi-label">수집 이슈</span></div>
                            <div className="sca-kpi"><span className="sca-kpi-num">{data.topics.length}</span><span className="sca-kpi-label">토픽(카테고리)</span></div>
                            <div className="sca-kpi"><span className="sca-kpi-num">{data.locations.length}</span><span className="sca-kpi-label">언급 지역</span></div>
                            <div className="sca-kpi"><span className="sca-kpi-num">{clusters?.k || 0}</span><span className="sca-kpi-label">의미 군집</span></div>
                        </div>

                        {/* 토픽 요약 카드 */}
                        <h2 className="sca-section">토픽 요약</h2>
                        <div className="sca-topics">
                            {data.topics.map((t) => (
                                <div key={t.category} className="sca-topic-card">
                                    <div className="sca-topic-head">
                                        <span className="sca-topic-name">{t.category}</span>
                                        <span className="sca-topic-count">{t.count}건</span>
                                    </div>
                                    {t.avg_severity != null && (
                                        <div className="sca-topic-sev">
                                            평균 심각도 <b style={{ color: SEV_COLOR[Math.round(t.avg_severity)] }}>{t.avg_severity}</b> / 4
                                        </div>
                                    )}
                                    {t.sample && <p className="sca-topic-sample">“{t.sample}”</p>}
                                </div>
                            ))}
                        </div>

                        <div className="sca-grid2">
                            {/* 카테고리 분포 */}
                            <div className="sca-chart-card">
                                <h3 className="sca-chart-title">카테고리별 이슈 수</h3>
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={data.topics} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {data.topics.map((_, i) => <Cell key={i} fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* 심각도 분포 */}
                            <div className="sca-chart-card">
                                <h3 className="sca-chart-title">심각도 분포</h3>
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={data.severity} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {data.severity.map((s) => <Cell key={s.score} fill={SEV_COLOR[s.score]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 위치 Top-N */}
                        {data.locations.length > 0 && (
                            <div className="sca-chart-card">
                                <h3 className="sca-chart-title">언급 많은 위치 Top {data.locations.length}</h3>
                                <div className="sca-loc-list">
                                    {data.locations.map((l) => (
                                        <div key={l.location} className="sca-loc-row">
                                            <span className="sca-loc-name">{l.location}</span>
                                            <span className="sca-loc-bar"><span style={{ width: `${(l.count / maxLoc) * 100}%` }} /></span>
                                            <span className="sca-loc-count">{l.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3D 의미 군집 — 버튼 클릭 시에만 실행 (OpenAI 임베딩 비용) */}
                        <div className="sca-cluster-head">
                            <h2 className="sca-section" style={{ margin: 0 }}>이슈 의미 군집 (3D)</h2>
                            <button
                                className="sca-run-btn"
                                onClick={() => runClusters(!!clusters && !clusters.note)}
                                disabled={clusterLoading}
                            >
                                {clusterLoading
                                    ? '분석 중…'
                                    : clusters && !clusters.note
                                        ? '↻ 재분석'
                                        : 'AI 군집 분석 실행'}
                            </button>
                        </div>
                        <div className="sca-chart-card">
                            {clusterErr ? (
                                <div className="sca-empty">{clusterErr}</div>
                            ) : clusterLoading ? (
                                <div className="sca-empty">OpenAI 임베딩으로 군집을 계산하는 중입니다…</div>
                            ) : !clusters ? (
                                <div className="sca-empty">
                                    군집 분석은 OpenAI 임베딩을 사용해 비용이 발생하므로
                                    <br />위 <b>‘AI 군집 분석 실행’</b> 버튼을 눌렀을 때만 실행됩니다.
                                </div>
                            ) : clusters.note ? (
                                <div className="sca-empty">{clusters.note}</div>
                            ) : (
                                <>
                                    <p className="sca-cluster-desc">
                                        OpenAI 임베딩으로 이슈 간 의미 유사도를 계산하고 K-Means로 군집화한 뒤 t-SNE로 3차원에 배치했습니다.
                                        가까운 점일수록 비슷한 내용의 시민 의견입니다. (드래그로 회전)
                                    </p>
                                    <Plot
                                        data={plotData}
                                        layout={{
                                            autosize: true, height: 460,
                                            margin: { l: 0, r: 0, t: 0, b: 0 },
                                            legend: { orientation: 'h', y: -0.05 },
                                            scene: {
                                                xaxis: { title: '', showspikes: false },
                                                yaxis: { title: '', showspikes: false },
                                                zaxis: { title: '', showspikes: false },
                                            },
                                        }}
                                        config={{ displayModeBar: false, responsive: true }}
                                        style={{ width: '100%', height: '460px' }}
                                        useResizeHandler
                                    />
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
