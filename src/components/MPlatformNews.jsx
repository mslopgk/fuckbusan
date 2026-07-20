import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import './MPlatformNews.css';

/* 플랫폼 소식 목록/상세 — Figma 215:17129 (목록), 215:16718 (상세)
   실데이터: GET /api/announcements?kind=notice (공지사항). content=본문. */

const BackBar = ({ onBack }) => (
    <button type="button" className="mpn-back" onClick={onBack}>
        <svg width="7" height="13" viewBox="0 0 7 13" fill="none" aria-hidden="true">
            <path d="M6 1L1 6.5L6 12" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>홈으로</span>
    </button>
);

const ItemArrow = () => (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="#242424" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" />
    </svg>
);

const MPlatformNews = ({ onNavigate }) => {
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/api/announcements?kind=notice&size=50`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setItems(Array.isArray(d?.items) ? d.items : []))
            .catch(() => setItems([]))
            .finally(() => setLoaded(true));
    }, []);

    if (selected !== null && items[selected]) {
        const item = items[selected];
        return (
            <div className="mpn-page">
                <BackBar onBack={() => onNavigate?.('home')} />
                <div className="mpn-detail">
                    <h1 className="mpn-detail-title">{item.title}</h1>
                    <div className="mpn-detail-divider" />
                    <p className="mpn-detail-body">{item.content}</p>
                </div>
                <button type="button" className="mpn-list-btn" onClick={() => setSelected(null)}>목록으로</button>
            </div>
        );
    }

    return (
        <div className="mpn-page">
            <BackBar onBack={() => onNavigate?.('home')} />
            <h1 className="mpn-title">플랫폼 소식</h1>
            <div className="mpn-list">
                {items.map((n, i) => (
                    <button key={n.id ?? i} type="button" className="mpn-card" onClick={() => setSelected(i)}>
                        <div className="mpn-card-head">
                            <span className="mpn-card-title">{n.title}</span>
                            <ItemArrow />
                        </div>
                        <p className="mpn-card-body">{n.content}</p>
                    </button>
                ))}
                {loaded && items.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#999', padding: '40px 0', fontSize: 14 }}>등록된 소식이 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default MPlatformNews;
