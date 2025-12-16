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
                    <img src={(item && item.image) || '/assets/placeholder.png'} alt="site" />
                </div>
                <div className="dc-text-info">
                    <div className="dc-title">{item.title}</div>
                    {item.type === 'general' ? (
                        <div className="dc-score-large">{item.score}</div>
                    ) : (
                        <div className={`dc-result ${item.result}`}>
                            {item.result === 'suitable' ? '적합' : '부적합'}
                        </div>
                    )}

                    <div className="dc-coords">
                        {/* Address Display */}
                        {item.address && (
                            <div className="dc-address" style={{ marginBottom: '4px', color: '#666', fontSize: '13px' }}>
                                {item.address}
                            </div>
                        )}
                        <div className="dc-coord-row" style={{ display: 'flex', gap: '8px' }}>
                            <div className="dc-coord-col">
                                <div className="dc-coord-label">위도</div>
                                <div className="dc-coord-val">{item.lat}</div>
                            </div>
                            <div className="dc-coord-col">
                                <div className="dc-coord-label">경도</div>
                                <div className="dc-coord-val">{item.lng}</div>
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
