import { useEffect, useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import MobileBottomNav from './MobileBottomNav';
import './MDiagnosisResult.css';
import { API_URL, authHeaders } from '../utils/api';

// 진단 6대 질문기준 축 — checklist_result.질문기준 컬럼 실제 값과 동일 순서
const RADAR_AXES = ['접근성', '이동성', '안전성', '정보제공성', '포용성', '심미성'];

// /checklist/criteria-summary 의 한 스코프(radar: [{subject, A, count}]) → recharts 6축 데이터.
// 데이터가 없는 축은 제외한다(0.0 날조 금지). 축 순서는 RADAR_AXES 로 고정해 6각형 방향 일관.
function scopeToRadar(scope) {
    if (!scope || !Array.isArray(scope.radar) || scope.radar.length === 0) return [];
    const byAxis = new Map(
        scope.radar
            .filter((d) => d && Number.isFinite(Number(d.A)))
            .map((d) => [d.subject, Number(d.A)]),
    );
    return RADAR_AXES
        .filter((ax) => byAxis.has(ax))
        .map((ax) => ({ subject: ax, A: byAxis.get(ax), fullMark: 5 }));
}

function CustomTick({ payload, x, y, textAnchor, radarData }) {
    const point = (radarData || []).find((d) => d.subject === payload.value);
    return (
        <g>
            <text x={x} y={y - 4} textAnchor={textAnchor} className="m-diagres-tick-label">
                {payload.value}
            </text>
            <text x={x} y={y + 9} textAnchor={textAnchor} className="m-diagres-tick-value">
                {point?.A?.toFixed(1)}
            </text>
        </g>
    );
}

// Figma 302:19985 진단결과1_시민 — 전체 핑크 / 시설물 보라 / 구역 파랑 / 인원 청록
const RADAR_COLORS = {
    total:    '#E6235A',
    facility: '#542AA3',
    zone:     '#005BE4',
    person:   '#0B9583',
};

// Figma 302:20225 진단결과2_전문가 — 섹션별 타일 틴트
const TILE_TINTS = {
    total:    '#f5f1fd',
    facility: '#fff6f9',
    zone:     '#eef5ff',
    person:   '#e7f8f5',
};

function RadarCard({ label, title, data, color }) {
    // recharts 레이더는 최소 3축 이상이어야 도형이 성립. 그 미만이면 빈상태 표기(빈 도형 노출 금지).
    const hasData = Array.isArray(data) && data.length >= 3;
    return (
        <div className="m-diagres-section-row">
            <div className="m-diagres-table-label">{label}</div>
            <div className="m-diagres-section-content">
                <div className="m-diagres-radar-card">
                    <p className="m-diagres-radar-card-title">{title}</p>
                    {hasData ? (
                        <div className="m-diagres-chart">
                            {/* 컨테이너가 226px 고정이므로 ResponsiveContainer 불필요 —
                                측정 기반 렌더는 숨김/초기 0-size 마운트에서 recharts 음수 크기 경고를 유발 */}
                            <RadarChart width={226} height={226} cx="50%" cy="50%" outerRadius="65%" data={data}>
                                <PolarGrid stroke="#dadde2" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={(props) => <CustomTick {...props} radarData={data} />}
                                />
                                <Radar
                                    name="Score"
                                    dataKey="A"
                                    stroke={color}
                                    strokeWidth={2}
                                    fill={color}
                                    fillOpacity={0.25}
                                />
                            </RadarChart>
                        </div>
                    ) : (
                        <div className="m-diagres-chart m-diagres-chart--empty">
                            <span className="m-diagres-empty-text">데이터 준비중</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// 전문가 결과 — 적합/부적합/만족도 타일 카드 (Figma Frame 47 243x146)
// stats 가 null 이면 실데이터 없음 → 값 자리에 "—" (날조 금지)
function ExpertCard({ label, title, tint, stats }) {
    const passV = stats ? `${stats.pass}/${stats.total}` : '—';
    const failV = stats ? `${stats.fail}/${stats.total}` : '—';
    const avgV = stats ? stats.avg : '—';
    return (
        <div className="m-diagres-section-row m-diagres-section-row--expert">
            <div className="m-diagres-table-label">{label}</div>
            <div className="m-diagres-section-content">
                <div className="m-diagres-expert-card">
                    <p className="m-diagres-expert-card-title">{title}</p>
                    <div className="m-diagres-expert-tiles">
                        <div className="m-diagres-expert-tile" style={{ background: tint }}>
                            <span className="m-diagres-expert-tile-label">적합</span>
                            <span className="m-diagres-expert-tile-value">{passV}</span>
                        </div>
                        <div className="m-diagres-expert-tile" style={{ background: tint }}>
                            <span className="m-diagres-expert-tile-label">부적합</span>
                            <span className="m-diagres-expert-tile-value">{failV}</span>
                        </div>
                        <div className="m-diagres-expert-tile" style={{ background: tint }}>
                            <span className="m-diagres-expert-tile-label">만족도 평가</span>
                            <span className="m-diagres-expert-tile-value">{avgV}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MDiagnosisResult({ onNavigate, address = '부산 부산진구 초연로 6', date = null, photo = null, resultId = null, big = null, mid = null, target = null, answers = null }) {
    const [resultDetail, setResultDetail] = useState(null);
    const [photoZoomOpen, setPhotoZoomOpen] = useState(false);
    // 질문기준별 실집계 (전체/시설물별/구역별/인원별) — /checklist/criteria-summary
    const [criteria, setCriteria] = useState(null);
    const isExpert = useMemo(() => {
        const t = resultDetail?.진단대상 ?? resultDetail?.target ?? target;
        return t === '전문가' || t === 'expert';
    }, [resultDetail, target]);

    // 6각형 레이더 데이터 — 질문기준(접근성/이동성/안전성/정보제공성/포용성/심미성)별 실점수 평균.
    // public 엔드포인트라 익명도 호출 가능. result_id 컨텍스트로 시설물/구역/인원 스코프 집계.
    useEffect(() => {
        const url = resultId
            ? `${API_URL}/checklist/criteria-summary?result_id=${resultId}`
            : `${API_URL}/checklist/criteria-summary`;
        fetch(url)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => { if (data) setCriteria(data); })
            .catch(() => {});
    }, [resultId]);

    // Fetch individual result for date/photo (로그인 사용자만; 익명은 401).
    useEffect(() => {
        if (!resultId) return;
        if (!localStorage.getItem('access_token')) return;
        fetch(`${API_URL}/checklist/${resultId}`, { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) setResultDetail(data);
            })
            .catch(() => {});
    }, [resultId]);

    // 전문가 타일용 answers 파싱 — 전문가 제출은 answers 가 {"1":5,...} 형태의 점수 맵.
    // 익명은 목록(public)에서 넘어온 answers prop, 로그인은 resultDetail.answers.
    const parsedAnswers = useMemo(() => {
        const raw = resultDetail?.answers ?? answers;
        if (!raw) return null;
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
            return null;
        }
    }, [resultDetail, answers]);

    // 스코프별 6축 레이더 데이터 (실데이터 없으면 빈 배열 → 카드가 "데이터 준비중" 표기)
    const totalRadar = useMemo(() => scopeToRadar(criteria?.total), [criteria]);
    const facilityRadar = useMemo(() => scopeToRadar(criteria?.facility), [criteria]);
    const zoneRadar = useMemo(() => scopeToRadar(criteria?.zone), [criteria]);
    const personRadar = useMemo(() => scopeToRadar(criteria?.person), [criteria]);

    // 전문가 타일 값 — 적합=4점 이상, 부적합=2~3점, 만족도=평균. 실데이터 없으면 null(→ "—").
    const expertStats = useMemo(() => {
        const values = parsedAnswers
            ? Object.values(parsedAnswers).map(Number).filter(Number.isFinite)
            : [];
        if (!values.length) return null;
        const pass = values.filter((v) => v >= 4).length;
        const fail = values.filter((v) => v >= 2 && v < 4).length;
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
        return { pass, fail, total: values.length, avg };
    }, [parsedAnswers]);

    // Displayed date: prop → result created_at → today
    const displayDate = useMemo(() => {
        const norm = (s) => s.replace(/\//g, '-');
        if (date && date !== '2024/05/16') return norm(date);
        if (resultDetail?.created_at) {
            const d = new Date(resultDetail.created_at);
            if (!isNaN(d)) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (date) return norm(date);
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }, [date, resultDetail]);

    // 전체 평균 — 6축 평균 점수 및 실제 표본수 (엔드포인트 집계값)
    const totalAvg = criteria?.total?.avg;      // number | null
    const totalCount = criteria?.total?.count ?? 0;

    const displayBig = big || resultDetail?.대분류 || '보도';
    const displayMid = mid || resultDetail?.중분류 || '보행공간';
    const displayPhoto = photo || resultDetail?.이미지경로 || null;

    useEffect(() => {
        if (!photoZoomOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setPhotoZoomOpen(false); };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [photoZoomOpen]);

    // Figma 302:19985: 전체 상태 라벨 표기는 "전체(All)" (백엔드는 "전체"로 반환)
    const asAllLabel = (l) => (!l || l === '전체' ? '전체(All)' : l);
    const facilityLabel = asAllLabel(criteria?.facility?.label);
    const zoneLabel = asAllLabel(criteria?.zone?.label);
    const personLabel = asAllLabel(criteria?.person?.label);

    return (
        <div className="m-diagres-page">
            {/* 헤더 — Figma: back + teal 타이틀 (20px/700) */}
            <header className="m-diagres-topbar">
                <button
                    type="button"
                    className="m-diagres-back"
                    aria-label="뒤로"
                    onClick={() => onNavigate?.('mDiagnosisList')}
                >
                    <img src="/figma-assets/mobile-diagnosis/arrow_back.png" width="24" height="24" alt="" />
                </button>
                <span className="m-diagres-topbar-title">{isExpert ? '전문가 진단 결과' : '시민 진단 결과'}</span>
            </header>

            <main className="m-diagres-body">
                {/* 테이블 — Figma Frame 494 */}
                <div className="m-diagres-table">
                    <div className="m-diagres-table-row">
                        <div className="m-diagres-table-label">위치</div>
                        <div className="m-diagres-table-value">{address}</div>
                    </div>
                    <div className="m-diagres-table-row m-diagres-table-row--photo">
                        <div className="m-diagres-table-label">사진</div>
                        <div className="m-diagres-table-value">
                            <div className="m-diagres-thumb">
                                {displayPhoto ? (
                                    <button
                                        type="button"
                                        className="m-diagres-thumb-btn"
                                        onClick={() => setPhotoZoomOpen(true)}
                                        aria-label="사진 확대해서 보기"
                                    >
                                        <img src={displayPhoto} alt="진단 사진" />
                                    </button>
                                ) : (
                                    <div className="m-diagres-thumb-placeholder">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                            <polyline points="21 15 16 10 5 21"/>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="m-diagres-table-row">
                        <div className="m-diagres-table-label">진단일</div>
                        <div className="m-diagres-table-value">{displayDate}</div>
                    </div>
                    <div className="m-diagres-table-row">
                        <div className="m-diagres-table-label">대분류</div>
                        <div className="m-diagres-table-value">{displayBig}</div>
                    </div>
                    <div className="m-diagres-table-row">
                        <div className="m-diagres-table-label">중분류</div>
                        <div className="m-diagres-table-value">{displayMid}</div>
                    </div>

                    {isExpert ? (
                        <>
                            <ExpertCard label="전체 평균" title="전체 결과" tint={TILE_TINTS.total} stats={expertStats} />
                            <ExpertCard label="시설물별" title={`시설물별 ${facilityLabel} 세부 정보`} tint={TILE_TINTS.facility} stats={expertStats} />
                            <ExpertCard label="구역별" title={`구역별 ${zoneLabel} 세부 정보`} tint={TILE_TINTS.zone} stats={expertStats} />
                            <ExpertCard label="인원별" title={`인원별 ${personLabel} 세부 정보`} tint={TILE_TINTS.person} stats={expertStats} />
                        </>
                    ) : (
                        <>
                            <RadarCard
                                label="전체 평균"
                                title={totalAvg != null
                                    ? `${totalAvg.toFixed(2)} 전체 평균 (${totalCount})`
                                    : '전체 평균'}
                                data={totalRadar}
                                color={RADAR_COLORS.total}
                            />
                            <RadarCard
                                label="시설물별"
                                title={`시설물별 ${facilityLabel} 세부 정보`}
                                data={facilityRadar}
                                color={RADAR_COLORS.facility}
                            />
                            <RadarCard
                                label="구역별"
                                title={`구역별 ${zoneLabel} 세부 정보`}
                                data={zoneRadar}
                                color={RADAR_COLORS.zone}
                            />
                            <RadarCard
                                label="인원별"
                                title={`인원별 ${personLabel} 세부 정보`}
                                data={personRadar}
                                color={RADAR_COLORS.person}
                            />
                        </>
                    )}
                </div>

            </main>

            {photoZoomOpen && displayPhoto && (
                <div
                    className="m-diagres-photo-modal"
                    role="dialog"
                    aria-label="진단 사진 확대"
                    onClick={() => setPhotoZoomOpen(false)}
                >
                    <button
                        type="button"
                        className="m-diagres-photo-close"
                        onClick={(e) => { e.stopPropagation(); setPhotoZoomOpen(false); }}
                        aria-label="닫기"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                    <img
                        src={displayPhoto}
                        alt="진단 사진 확대"
                        className="m-diagres-photo-zoom"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <MobileBottomNav currentView="mDiagnosisResult" onNavigate={onNavigate} />
        </div>
    );
}
