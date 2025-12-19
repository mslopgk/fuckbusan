import React from 'react';
import './DiagnosisCard.css';

const DiagnosisCard = ({ item, onBookmark, onClick, style }) => {
    // item: { id, type, date, bookmarked, title, score, result, lat, lng, scores, desc, image }
    // onBookmark: function(id)
    // onClick: function(item)

    const handleBookmark = (e) => {
        e.stopPropagation();
        if (onBookmark) onBookmark(item.id);
    };

    return (
        <div className="diagnosis-card-component" onClick={onClick} style={style}>
            <div className="dc-header">
                <div className={`dc-type-badge ${item.type}`}>
                    {item.type === 'general' ? '일반인' : '전문가'}
                </div>
                <div className="dc-date-row">
                    <span className="dc-date">{item.date}</span>
                    <svg
                        onClick={handleBookmark}
                        className="dc-bookmark-icon"
                        width="20" height="20" viewBox="0 0 24 24"
                        fill={item.bookmarked ? "#242424" : "none"}
                        stroke={item.bookmarked ? "#242424" : "#ccc"}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
            </div>

            {/* Main Info Row */}
            <div className="dc-main-info">
                <div className="dc-img">
                    <img
                        src={item.image || '/assets/diagnosis_street.png'}
                        alt="site"
                        onError={(e) => { e.target.src = '/assets/diagnosis_street.png'; }}
                    />
                </div>
                <div className="dc-text-info">
                    <div className="dc-title">{item.title}</div>
                    {/* Place Name - New Field */}
                    {item.placeName && (
                        <div className="dc-place-name" style={{ fontSize: '0.875rem', color: '#111', fontWeight: 500, marginBottom: '4px' }}>
                            {item.placeName}
                        </div>
                    )}

                    {item.type === 'general' ? (
                        <div className="dc-score-large">{item.score}</div>
                    ) : (
                        <div className={`dc-result ${item.result}`}>
                            {item.result === 'suitable' ? '적합' : '부적합'}
                        </div>
                    )}

                    <div className="dc-coords">
                        {/* Address Side by Side with Coords or Just Above */}
                        <div className="dc-coord-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {item.address && (
                                <div className="dc-address" style={{ color: '#555', fontSize: '0.8125rem', wordBreak: 'keep-all' }}>
                                    {item.address}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#888' }}>
                                <span>위도 {Number(item.lat || 0).toFixed(6)}</span>
                                <span>경도 {Number(item.lng || 0).toFixed(6)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Only: Score Grid */}
            {item.type === 'general' && item.scores && (
                <div className="dc-score-grid">
                    {item.scores.map((s, idx) => (
                        <div key={idx} className="dc-score-box">
                            <div className="dc-score-label">{s.label}</div>
                            <div className="dc-score-val">{s.val}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Divider */}
            <div className="dc-divider"></div>

            {/* Description */}
            <div className="dc-desc">
                {item.desc}
            </div>
        </div>
    );
};

export default DiagnosisCard;
