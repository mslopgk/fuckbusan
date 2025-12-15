import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import '../../styles/admin.css';

export default function ScoreGauge({ score }) {
    // Default placeholder
    // backend sends { score: number, grade: string, trend: string }
    const safeScore = score || { score: 0, grade: '-', trend: '-' };

    // Comprehensive Redesign for better space utilization
    const gaugeData = [
        { name: 'Score', value: safeScore.score, fill: 'url(#scoreGradient)' },
        { name: 'Remaining', value: 100 - safeScore.score, fill: '#f1f5f9' },
    ];

    return (
        <div className="score-gauge-container">
            {/* Header */}
            <div className="score-header">
                <div>
                    <h3 className="score-title">부산시 종합 진단</h3>
                    <div className="score-subtitle">실시간 데이터 기반</div>
                </div>
                <div className="grade-display">
                    <span className={`grade-value ${safeScore.grade === 'S' || safeScore.grade === 'A' ? 'text-primary' : 'text-slate-700'}`}>
                        {safeScore.grade}
                    </span>
                    <span className="grade-label">등급</span>
                </div>
            </div>

            {/* Main Gauge Area - Horizontal Layout */}
            <div className="gauge-main">
                {/* Left: Chart */}
                <div className="gauge-chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#4f46e5" />
                                    <stop offset="100%" stopColor="#f43f5e" />
                                </linearGradient>
                            </defs>
                            <Pie
                                data={gaugeData}
                                cx="50%"
                                cy="50%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius="60%"
                                outerRadius="90%"
                                cornerRadius={8}
                                paddingAngle={-5}
                                dataKey="value"
                                stroke="none"
                            >
                                <Cell key="score" fill="url(#scoreGradient)" />
                                <Cell key="bg" fill="#f1f5f9" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Right: Text */}
                <div className="gauge-text-area">
                    <div className="gauge-label">Total Score</div>
                    <div className="gauge-value">
                        {safeScore.score}
                        <span className="gauge-max">/ 100</span>
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="score-footer">
                <span className="footer-label">전년 대비</span>
                <span className={`footer-value ${safeScore.trend && safeScore.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {safeScore.trend}
                </span>
            </div>
        </div>
    );
}
