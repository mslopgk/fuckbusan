/* MyDiagnosis.jsx — 나의 진단 (Figma TCuOzEqNhoLKjhF0reBDks 302:13723)
 * 형제 페이지 MySurveys.jsx 패턴을 따름 (뷰포트 분기 + 기간 필터 + 카드 목록).
 * 데이터: /checklist/my (진단 결과). 값 없으면 빈 상태. */
import React, { useState, useEffect } from 'react';
import './MyDiagnosis.css';
import { fetchWithLogout, API_URL } from '../utils/api';

const ASSET = '/figma-assets/mobile-myactivity';

const PERIOD_OPTIONS = ['1개월', '6개월', '1년'];

function getPeriodStartDate(period) {
    const now = new Date();
    if (period === '1개월') return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    if (period === '6개월') return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    if (period === '1년') return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return new Date(0);
}

/* /checklist/my 응답(한글 키) → 카드 표현으로 매핑 */
function mapItem(item) {
    const imgPath = item.이미지경로;
    return {
        id: item.result_id,
        type: item.district_code === 'expert' ? 'expert' : 'general',
        created_at: item.created_at,
        cat: item.대분류 || '',
        sub: item.중분류 || '',
        title: item.소분류 || item.장소명 || item.중분류 || item.대분류 || '진단 결과',
        score: item.점수 != null ? String(item.점수) : '',
        desc: item.리뷰 || item.만족도 || '',
        result: item.만족도 || 'suitable',
        lat: item.위도,
        lng: item.경도,
        address: item.진단지역 || '',
        placeName: item.장소명 || '',
        image: imgPath
            ? (imgPath.startsWith('/uploads') ? `${API_URL}${imgPath}` : imgPath)
            : '',
        raw: item,
    };
}

const MyDiagnosis = ({ onBack, onNavigate, onCardClick }) => {
    const [isPC, setIsPC] = useState(
        () => typeof window !== 'undefined' && window.innerWidth >= 1024
    );
    const [period, setPeriod] = useState('6개월');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const onResize = () => setIsPC(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const fetchMine = async () => {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) { setItems([]); setLoading(false); return; }
            try {
                const res = await fetchWithLogout(`${API_URL}/checklist/my`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setItems(Array.isArray(data) ? data.map(mapItem) : []);
                } else {
                    setItems([]);
                }
            } catch {
                setItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMine();
    }, []);

    /* 기간 필터 */
    const cutoff = getPeriodStartDate(period);
    const filtered = items.filter((it) => {
        if (!it.created_at) return true;
        const d = new Date(it.created_at);
        if (isNaN(d.getTime())) return true;
        return d >= cutoff;
    });

    const handleCard = (item) => {
        if (onCardClick) onCardClick(item.raw || item);
    };

    return (
        <div className={`md-container${isPC ? ' md-container--pc' : ''}`}>
            {/* 모바일 헤더 — Figma 302:19523/19560: back (13,21) + 중앙 '나의진단' */}
            {!isPC && (
                <header className="md-mobile-header">
                    <button className="md-back-btn" onClick={onBack} aria-label="뒤로가기">
                        <img src={`${ASSET}/icon_back.png`} alt="" width="24" height="24" />
                    </button>
                    <h1 className="md-mobile-title">나의진단</h1>
                </header>
            )}

            {/* 페이지 제목 (PC 전용) */}
            {isPC && <h1 className="md-page-title">나의 진단</h1>}

            {/* 기간 필터 탭 */}
            <div className="md-period-bar">
                <div className="md-period-track">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            className={`md-period-btn${period === opt ? ' md-period-btn--active' : ''}`}
                            onClick={() => setPeriod(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            {/* 카드 목록 */}
            {loading ? (
                <div className="md-empty">불러오는 중...</div>
            ) : filtered.length === 0 ? (
                <div className="md-empty">해당 기간에 진단 내역이 없습니다.</div>
            ) : (
                <div className={`md-list${isPC ? ' md-list--pc' : ''}`}>
                    {filtered.map((item) => (
                        <button
                            key={item.id}
                            className="md-card"
                            onClick={() => handleCard(item)}
                            type="button"
                        >
                            <div className="md-card-body">
                                {/* 카테고리 배지 행 */}
                                <div className="md-badge-row">
                                    {item.cat && <span className="md-badge">{item.cat}</span>}
                                    {item.sub && <span className="md-badge">{item.sub}</span>}
                                </div>
                                {/* 제목 + 점수 */}
                                <div className="md-title-row">
                                    <span className="md-title">{item.title}</span>
                                    {item.score !== '' && <span className="md-score">{item.score}</span>}
                                </div>
                                {/* 설명 */}
                                {item.desc && <p className="md-desc">{item.desc}</p>}
                            </div>
                            {/* 썸네일 */}
                            <div className="md-thumb">
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt=""
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

        </div>
    );
};

export default MyDiagnosis;
