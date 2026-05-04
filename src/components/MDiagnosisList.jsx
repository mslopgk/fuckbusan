import { useState, useEffect, useMemo, useRef } from 'react';
import { Map, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import MobileBottomNav from './MobileBottomNav';
import {
    DIAGNOSIS_MODES as MODES,
    DISTRICT_CENTERS,
    DISTRICTS,
    CATEGORIES_WITH_ALL as CATEGORIES,
} from '../constants/diagnosis';
import './MDiagnosisList.css';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const BIG_COLORS = {
    '주거': '#DFF8F8', '환경': '#C0E6C0', '교통': '#C7DBF7',
    '교육': '#FFC9C9', '안전': '#FFD0C2', '산업·일자리': '#FFE5C2',
    '문화·여가': '#E0CCF5', '보건·복지': '#F4CCE2',
};

function HeartIcon({ active = false }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? '#FF4D6D' : 'none'} stroke={active ? '#FF4D6D' : '#BFBFBF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BFBFBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

export default function MDiagnosisList({ onNavigate }) {
    const [district, setDistrict] = useState('부산진구');
    const [districtOpen, setDistrictOpen] = useState(false);
    const [category, setCategory] = useState('산업·일자리');
    const [mode, setMode] = useState('general');
    const [modeOpen, setModeOpen] = useState(false);
    const [mapHidden, setMapHidden] = useState(false);

    const titleWrapRef = useRef(null);

    useEffect(() => {
        if (!modeOpen) return undefined;
        const handler = (e) => {
            if (titleWrapRef.current && !titleWrapRef.current.contains(e.target)) {
                setModeOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [modeOpen]);

    const modeLabel = MODES.find((m) => m.key === mode)?.label ?? '일반';

    const [allRows, setAllRows] = useState([]);

    useEffect(() => {
        fetch(`${VITE_API_URL}/checklist/list`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => setAllRows(Array.isArray(rows) ? rows : []))
            .catch(() => setAllRows([]));
    }, []);

    const filtered = useMemo(() => {
        return allRows
            .filter((r) => !district || r.진단지역 === district || r.district_code === district)
            .map((r) => ({
                id: r.result_id,
                big: r.대분류 || '주거',
                bigColor: BIG_COLORS[r.대분류] || '#DFF8F8',
                mid: r.중분류 || '',
                title: r.질문기준 || `${r.진단지역 || ''} ${r.대분류 || ''} 진단`,
                author: r.ID || '익명',
                likes: 0,
                views: r.점수 || 0,
                thumb: r.이미지경로 || null,
            }));
    }, [allRows, district]);

    const DIAG_PINS = useMemo(() => {
        // 'Map' 식별자는 react-kakao-maps-sdk가 import해서 가려져 있음 → globalThis.Map 사용
        const map = new globalThis.Map();
        for (const r of allRows) {
            const key = r.district_code || r.진단지역;
            if (!key || !r.위도 || !r.경도) continue;
            if (!map.has(key)) {
                map.set(key, { id: key, district: key, count: 0, lat: parseFloat(r.위도), lng: parseFloat(r.경도), focus: key === district });
            }
            map.get(key).count += 1;
        }
        return Array.from(map.values());
    }, [allRows, district]);

    // 카카오맵 초기 로드 — 환경에 키가 없으면 placeholder로 fallback
    const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    const [kakaoLoading, kakaoError] = useKakaoLoader({ appkey: kakaoKey, libraries: ['services'] });
    const kakaoReady = !!kakaoKey && !kakaoLoading && !kakaoError;

    const mapCenter = useMemo(() => DISTRICT_CENTERS[district] ?? { lat: 35.158, lng: 129.06 }, [district]);
    const mapRef = useRef(null);

    // district 변경 시 지도 중심 이동
    useEffect(() => {
        if (mapRef.current && window.kakao) {
            mapRef.current.panTo(new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng));
        }
    }, [mapCenter]);

    return (
        <div className={`m-diag-list-page ${mapHidden ? 'no-map' : ''}`}>
            {/* 상단 헤더 */}
            <header className="m-diag-topbar">
                <button
                    className="m-diag-back"
                    onClick={() => onNavigate && onNavigate('home')}
                    aria-label="뒤로"
                    type="button"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06AB69" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div className="m-diag-title-wrap" ref={titleWrapRef}>
                    <button
                        type="button"
                        className="m-diag-title-btn"
                        aria-haspopup="menu"
                        aria-expanded={modeOpen}
                        onClick={() => setModeOpen((v) => !v)}
                    >
                        <span className="m-diag-title">{modeLabel} 진단</span>
                        <svg
                            className={`m-diag-title-caret ${modeOpen ? 'open' : ''}`}
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#06AB69"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="8 11 12 15 16 11" />
                        </svg>
                    </button>
                    {modeOpen && (
                        <ul className="m-diag-mode-menu" role="menu">
                            {MODES.map((m) => (
                                <li key={m.key}>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className={mode === m.key ? 'on' : ''}
                                        onClick={() => {
                                            setMode(m.key);
                                            setModeOpen(false);
                                        }}
                                    >{m.label}</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </header>

            {/* 지역 드롭다운 (지도 보기) 또는 컴팩트 라벨 (지도 숨김) */}
            {mapHidden ? (
                <button
                    type="button"
                    className="m-diag-district-compact"
                    onClick={() => setMapHidden(false)}
                    aria-label="지도 보기"
                >
                    <span>{district}</span>
                    <span className="m-diag-district-compact-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </span>
                </button>
            ) : (
                <div className="m-diag-district">
                    <button
                        type="button"
                        className="m-diag-district-btn"
                        onClick={() => setDistrictOpen((v) => !v)}
                    >
                        <span>{district}</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    {districtOpen && (
                        <ul className="m-diag-district-list">
                            {DISTRICTS.map((d) => (
                                <li key={d}>
                                    <button
                                        type="button"
                                        className={d === district ? 'on' : ''}
                                        onClick={() => {
                                            setDistrict(d);
                                            setDistrictOpen(false);
                                        }}
                                    >{d}</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* 지도 영역 — 카카오맵 (키 없을 시 placeholder). mapHidden 시 미렌더 */}
            {!mapHidden && <div className="m-diag-map">
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
                            <CustomOverlayMap
                                key={p.id}
                                position={{ lat: p.lat, lng: p.lng }}
                                yAnchor={1}
                            >
                                <button
                                    type="button"
                                    className={`m-diag-pin ${p.focus ? 'focus' : ''}`}
                                    aria-label={`${p.district} ${p.count}건`}
                                >
                                    <span className="m-diag-pin-count">{p.count}</span>
                                </button>
                            </CustomOverlayMap>
                        ))}
                    </Map>
                ) : (
                    <>
                        <div className="m-diag-map-bg" />
                        {DIAG_PINS.map((p, idx) => (
                            <span
                                key={p.id}
                                className="m-diag-pin-anchor"
                                style={{
                                    top: `${28 + (idx * 8) % 50}%`,
                                    left: `${22 + (idx * 13) % 60}%`,
                                }}
                            >
                                <span className={`m-diag-pin ${p.focus ? 'focus' : ''}`}>
                                    <span className="m-diag-pin-count">{p.count}</span>
                                </span>
                            </span>
                        ))}
                    </>
                )}
                <button
                    type="button"
                    className="m-diag-locate"
                    aria-label="현위치"
                    onClick={() => {
                        if (!('geolocation' in navigator)) {
                            alert('이 브라우저에서는 현위치를 가져올 수 없습니다.');
                            return;
                        }
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                if (mapRef.current && window.kakao) {
                                    mapRef.current.panTo(new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                                }
                            },
                            () => alert('현위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.'),
                            { timeout: 8000 }
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
            </div>}

            {/* 하단 시트: 필터 + 카드 리스트 */}
            <section className="m-diag-sheet">
                <button
                    type="button"
                    className="m-diag-sheet-handle"
                    onClick={() => setMapHidden((v) => !v)}
                    aria-label={mapHidden ? '지도 보기' : '리스트만 보기'}
                />

                <div className="m-diag-chips">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={`m-diag-chip ${c === category ? 'on' : ''}`}
                            onClick={() => setCategory(c)}
                        >{c}</button>
                    ))}
                </div>

                <ul className="m-diag-cards">
                    {filtered.map((it) => (
                        <li
                            key={it.id}
                            className="m-diag-card"
                            onClick={() => onNavigate && onNavigate('mDiagnosisDetail', it)}
                        >
                            <div className="m-diag-card-body">
                                <div className="m-diag-card-tags">
                                    <span className="m-diag-tag-big" style={{ background: it.bigColor }}>{it.big}</span>
                                    <span className="m-diag-tag-mid">{it.mid}</span>
                                </div>
                                <h3 className="m-diag-card-title">{it.title}</h3>
                                <p className="m-diag-card-author">{it.author}</p>
                                <div className="m-diag-card-meta">
                                    <span className="m-diag-meta-item"><HeartIcon /> {it.likes}</span>
                                    <span className="m-diag-meta-item"><EyeIcon /> {it.views}</span>
                                </div>
                            </div>
                            {it.thumb && (
                                <div className="m-diag-card-thumb" style={{ backgroundImage: `url(${it.thumb})` }} />
                            )}
                        </li>
                    ))}
                </ul>

                <button
                    type="button"
                    className="m-diag-fab"
                    onClick={() => onNavigate && onNavigate('mDiagnosisForm')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>진단하기</span>
                </button>
            </section>

            <MobileBottomNav currentView="mDiagnosisList" onNavigate={onNavigate} />
        </div>
    );
}
