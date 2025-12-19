import React, { useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import './DiagnosisResult.css';

const DiagnosisResult = ({ onBack, onHome, onDetailFacility, onDetailZone, onDetailPerson }) => {
    // Force full width layout
    useEffect(() => {
        document.body.classList.add('layout-full-width');
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    // Data Structure matching the design
    // 6 Axes: 접근성, 이동성, 안전성, 정비나 조성, 포용성, 심미성
    const data = [
        { subject: '접근성', A: 2.3, fullMark: 5 },
        { subject: '이동성', A: 2.0, fullMark: 5 },
        { subject: '안전성', A: 3.8, fullMark: 5 },
        { subject: '정비와 조성', A: 1.7, fullMark: 5 }, // Assuming label text
        { subject: '포용성', A: 1.7, fullMark: 5 },
        { subject: '심미성', A: 2.8, fullMark: 5 },
    ];

    // Helper for custom labels to show value
    const CustomTick = ({ payload, x, y, textAnchor, stroke, radius }) => {
        const { value } = payload;
        const dataPoint = data.find(d => d.subject === value);
        return (
            <g className="recharts-layer recharts-polar-angle-axis-tick">
                <text
                    x={x}
                    y={y - 5}
                    textAnchor={textAnchor}
                    className="radar-tick-label"
                >
                    {value}
                </text>
                <text
                    x={x}
                    y={y + 10}
                    textAnchor={textAnchor}
                    className="radar-tick-value"
                >
                    {dataPoint?.A}
                </text>
            </g>
        );
    };

    return (
        <div className="diagnosis-result-container">
            {/* Header */}
            <div className="result-header">
                <button className="icon-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <button className="icon-btn" onClick={onHome}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </button>
            </div>

            <div className="result-title">일반 진단 결과</div>
            <div className="result-address">부산 부산진구 초연로 6</div>
            <div className="result-desc">위 지역의 일반 진단 결과입니다.</div>

            {/* Main Chart Card */}
            <div className="result-card">
                <div className="card-header-score">
                    <span className="main-chart-score">2.4</span> 전체 평균 (36)
                </div>
                <div className="chart-container-main">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={CustomTick} />
                            <Radar
                                name="Score"
                                dataKey="A"
                                stroke="#E6235A"
                                strokeWidth={2}
                                fill="#E6235A"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sub Info Section */}
            <div className="sub-info-section">
                <div className="sub-info-title">세부 정보도 확인해 보세요</div>
                <div className="sub-info-desc">시설물, 구역, 인원 기준으로<br />진단 결과를 더욱 자세히 확인할 수 있습니다.</div>
            </div>

            {/* Sub Charts */}
            {/* 1. Facility */}
            <div className="sub-card">
                <div className="sub-card-title">시설물별 전체(All) 세부 정보</div>
                <div className="chart-container-sub">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={({ payload, x, y, textAnchor }) => {
                                const dataPoint = data.find(d => d.subject === payload.value);
                                return (
                                    <text x={x} y={y} textAnchor={textAnchor} className="radar-mini-tick">
                                        {payload.value}
                                        <tspan x={x} dy="1.2em" className="radar-mini-value">{dataPoint?.A}</tspan>
                                    </text>
                                );
                            }} />
                            <Radar
                                name="Score"
                                dataKey="A"
                                stroke="#9C27B0"
                                strokeWidth={2}
                                fill="#9C27B0"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <button className="action-btn btn-purple" onClick={onDetailFacility}>
                    시설물별 세부 정보
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>

            {/* 2. Zone */}
            <div className="sub-card">
                <div className="sub-card-title">구역별 전체(All) 세부 정보</div>
                <div className="chart-container-sub">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={({ payload, x, y, textAnchor }) => {
                                const dataPoint = data.find(d => d.subject === payload.value);
                                return (
                                    <text x={x} y={y} textAnchor={textAnchor} className="radar-mini-tick">
                                        {payload.value}
                                        <tspan x={x} dy="1.2em" className="radar-mini-value">{dataPoint?.A}</tspan>
                                    </text>
                                );
                            }} />
                            <Radar
                                name="Score"
                                dataKey="A"
                                stroke="#4285F4"
                                strokeWidth={2}
                                fill="#4285F4"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <button className="action-btn btn-blue" onClick={onDetailZone}>
                    구역별 세부 정보
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>

            {/* 3. Person */}
            <div className="sub-card">
                <div className="sub-card-title">인원별 전체(All) 세부 정보</div>
                <div className="chart-container-sub">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={({ payload, x, y, textAnchor }) => {
                                const dataPoint = data.find(d => d.subject === payload.value);
                                return (
                                    <text x={x} y={y} textAnchor={textAnchor} className="radar-mini-tick">
                                        {payload.value}
                                        <tspan x={x} dy="1.2em" className="radar-mini-value">{dataPoint?.A}</tspan>
                                    </text>
                                );
                            }} />
                            <Radar
                                name="Score"
                                dataKey="A"
                                stroke="#009688"
                                strokeWidth={2}
                                fill="#009688"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <button className="action-btn btn-green" onClick={onDetailPerson}>
                    인원별 세부 정보
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>






        </div>
    );
};

export default DiagnosisResult;
