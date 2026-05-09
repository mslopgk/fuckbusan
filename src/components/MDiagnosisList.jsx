import { useState, useEffect, useMemo, useRef } from 'react';
import { Map, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import MobileBottomNav from './MobileBottomNav';
import {
    DISTRICT_CENTERS,
    CATEGORIES_WITH_ALL as CATEGORIES,
} from '../constants/diagnosis';
import './MDiagnosisList.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function MDiagnosisList({ onNavigate }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('전체');
    const [mode, setMode] = useState('citizen');
    const [district, setDistrict] = useState('부산진구');
    const [allRows, setAllRows] = useState([]);
    const mapRef = useRef(null);

    useEffect(() => {
        fetch(`${VITE_API_URL}/checklist/list`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setAllRows(Array.isArray(rows) ? rows : []))
            .catch(() => setAllRows([]));
    }, []);

    const filtered = useMemo(() => {
        return allRows
            .filter((r) => !district || r.진단지역 === district || r.district_code === district)
            .filter((r) => category === '전체' || r.대분류 === category)
            .map((r) => ({
                id: r.result_id,
                big: r.대분류 || '주거',
                mid: r.중분류 || '',
                name: r.질문기준 || r.대분류 || '진단',
                score: r.점수 != null ? Number(r.점수).toFixed(1) : null,
                reviewText: r.리뷰 || '',
                thumb: r.이미지경로 || null,
            }));
    }, [allRows, district, category]);

    const DIAG_PINS = useMemo(() => {
        const map = new globalThis.Map();
        for (const r of allRows) {
            const key = r.district_code || r.진단지역;
            if (!key || !r.위도 || !r.경도) continue;
            if (!map.has(key)) {
                map.set(key, {
                    id: key, district: key, count: 0,
                    lat: parseFloat(r.위도), lng: parseFloat(r.경도),
                    focus: key === district,
                });
            }
            map.get(key).count += 1;
        }
        return Array.from(map.values());
    }, [allRows, district]);

    const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    const [kakaoLoading, kakaoError] = useKakaoLoader({ appkey: kakaoKey, libraries: ['services'] });
    const kakaoReady = !!kakaoKey && !kakaoLoading && !kakaoError;
    const mapCenter = useMemo(() => DISTRICT_CENTERS[district] ?? { lat: 35.158, lng: 129.06 }, [district]);

    useEffect(() => {
        if (mapRef.current && window.kakao) {
            mapRef.current.panTo(new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng));
        }
    }, [mapCenter]);

    return (
        <div className="m-diag-list-page">
            {/* 지도 영역 */}
            <div className="m-diag-map-area">
                {/* 검색바 — 지도 위 플로팅 */}
                <div className="m-diag-search-wrap">
                    <input
                        className="m-diag-search"
                        placeholder="지역검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* 카테고리 칩 바 — 지도 위 플로팅, 수평 스크롤 */}
                <div className="m-diag-cats-bar">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={`m-diag-cat-chip${category === c ? ' active' : ''}`}
                            onClick={() => setCategory(c)}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {/* 지도 */}
                {kakaoReady ? (
                    <Map
                        center={mapCenter}
                        level={5}
                        style={{ width: '100%', height: '100%' }}
                        draggable
                        zoomable
                        onCreate={(m) => { mapRef.current = m; }}
                    >
                        {DIAG_PINS.map((p) => (
                            <CustomOverlayMap key={p.id} position={{ lat: p.lat, lng: p.lng }} yAnchor={1}>
                                <button
                                    type="button"
                                    className={`m-diag-pin${p.focus ? ' focus' : ''}`}
                                    onClick={() => setDistrict(p.district)}
                                >
                                    <span className="m-diag-pin-count">{p.count}</span>
                                </button>
                            </CustomOverlayMap>
                        ))}
                    </Map>
                ) : (
                    <div className="m-diag-map-bg" />
                )}

                {/* 현위치 버튼 */}
                <button
                    type="button"
                    className="m-diag-locate"
                    aria-label="현위치"
                    onClick={() => {
                        if (!('geolocation' in navigator)) return;
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                if (mapRef.current && window.kakao) {
                                    mapRef.current.panTo(new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                                }
                            },
                            () => {},
                            { timeout: 8000 },
                        );
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <line x1="12" y1="2" x2="12" y2="5" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="5" y2="12" />
                        <line x1="19" y1="12" x2="22" y2="12" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </button>
            </div>

            {/* 하단 시트 */}
            <div className="m-diag-sheet">
                <div className="m-diag-sheet-handle" />

                {/* 시민 / 전문가 탭 */}
                <div className="m-diag-mode-tabs">
                    <button
                        type="button"
                        className={`m-diag-mode-tab${mode === 'citizen' ? ' active' : ''}`}
                        onClick={() => setMode('citizen')}
                    >시민 진단</button>
                    <button
                        type="button"
                        className={`m-diag-mode-tab${mode === 'expert' ? ' active' : ''}`}
                        onClick={() => setMode('expert')}
                    >전문가 진단</button>
                </div>

                {/* 카드 리스트 */}
                <ul className="m-diag-cards">
                    {filtered.map((it) => (
                        <li
                            key={it.id}
                            className="m-diag-card"
                            onClick={() => onNavigate?.('mDiagnosisResult', it)}
                        >
                            <div className="m-diag-card-body">
                                <div className="m-diag-card-tags">
                                    <span className="m-diag-tag">{it.big}</span>
                                    {it.mid && <span className="m-diag-tag">{it.mid}</span>}
                                </div>
                                <div className="m-diag-card-name-row">
                                    <span className="m-diag-card-name">{it.name}</span>
                                    {it.score != null && <span className="m-diag-card-score">{it.score}</span>}
                                </div>
                                {it.reviewText && <p className="m-diag-card-review">{it.reviewText}</p>}
                            </div>
                            <div
                                className="m-diag-card-thumb"
                                style={it.thumb ? { backgroundImage: `url(${it.thumb})` } : undefined}
                            />
                        </li>
                    ))}
                </ul>

                {/* 진단하기 FAB */}
                <button
                    type="button"
                    className="m-diag-fab"
                    onClick={() => onNavigate?.('mDiagnosisForm')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>진단하기</span>
                </button>
            </div>

            <MobileBottomNav currentView="mDiagnosisList" onNavigate={onNavigate} />
        </div>
    );
}
