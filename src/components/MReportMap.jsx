import { useState, useEffect, useMemo, useRef } from 'react';
import PCMapCanvas from './PCMapCanvas';
import MobileBottomNav from './MobileBottomNav';
import { CAT_STYLES } from './catStyles';
import { REGIONS, REPORT_STAGES as STAGES, DISTRICT_CENTERS } from '../constants/mapConstants';
import { matchDistrict, nearestDistrict } from '../utils/format';
import { RegionSheet, MMapSearchBar } from './MFilterSheets';
import { API_URL } from '../utils/api';
import { useLazyImage } from '../hooks/useLazyImage';
import './MProposalList.css';
import './MProposalMap.css';
import './MReportList.css';
import './MReportMap.css';

function ReportCard({ it, onNavigate }) {
    const style = CAT_STYLES[it.cat] || { bg: '#eee', color: '#555' };
    const { ref: imgRef, bgStyle } = useLazyImage(it.image);
    return (
        <li
            className="m-prop-card"
            onClick={() => onNavigate && onNavigate('mReportDetail', it)}
        >
            <div className="m-prop-card-text">
                <div className="m-report-tags">
                    <span className="m-prop-cat-tag" style={{ background: style.bg, color: style.color }}>{it.cat}</span>
                    {it.sub && <span className="m-report-sub-tag">{it.sub}</span>}
                </div>
                <h3 className="m-prop-title">{it.title}</h3>
                <p className="m-prop-author">{it.author}</p>
                <div className="m-prop-stats">
                    <span>
                        {/* Figma heart icon */}
                        <svg width="16" height="13" viewBox="0 0 15.3587 12.2297" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }}>
                            <path d="M9.0568 1.0811C10.4983 -0.360439 12.8359 -0.360292 14.2775 1.0811C15.7191 2.52272 15.7191 4.86019 14.2775 6.30181L8.78141 11.7989C8.47833 12.102 8.07586 12.2441 7.67887 12.2286C7.2822 12.2438 6.88013 12.1017 6.57731 11.7989L1.08121 6.30181C-0.360404 4.86019 -0.360404 2.52272 1.08121 1.0811C2.52285 -0.360296 4.86037 -0.36044 6.30192 1.0811L7.67887 2.45806L9.0568 1.0811Z"/>
                        </svg>
                        {it.likes ?? 0}
                    </span>
                    <span>
                        {/* Figma comment bubble icon */}
                        <svg width="14" height="12" viewBox="0 0 14 11.8457" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }}>
                            <path d="M9.1543 0C11.8305 0.000244114 14 2.1694 14 4.8457C14 7.52201 11.8305 9.69116 9.1543 9.69141H6.5127L3.23047 11.8457V9.41406C1.34871 8.74853 4.44368e-08 6.95541 0 4.8457C0 2.1694 2.16945 0.000244114 4.8457 0H9.1543Z"/>
                        </svg>
                        {it.comments ?? 0}
                    </span>
                </div>
            </div>
            {it.image && <div ref={imgRef} className="m-prop-card-img" style={bgStyle} />}
        </li>
    );
}

// All categories including 교육 (matches Figma 848:19015)
const CATEGORIES = ['전체', '주거', '환경', '교통', '안전', '교육', '산업·일자리', '문화·여가', '보건·복지'];

// 2-state bottom sheet: 'peek' (map-only) | 'half' (default). full은 별도 list 페이지로 navigate.
const SHEET_MODES = ['peek', 'half'];

export default function MReportMap({ onNavigate }) {
    const [region, setRegion] = useState('부산전체');
    const [regionOpen, setRegionOpen] = useState(false);
    const [regionDraft, setRegionDraft] = useState('부산전체');
    const [cat, setCat] = useState('전체');
    const [stage, setStage] = useState('inProgress');
    const [search, setSearch] = useState('');
    const [items, setItems] = useState([]);
    const [mapPins, setMapPins] = useState([]);
    const [selectedPinId, setSelectedPinId] = useState(null);
    const [sheetMode, setSheetMode] = useState('half');
    const mapRef = useRef(null);
    const touchStartY = useRef(0);
    const touchStartT = useRef(0);
    const [dragY, setDragY] = useState(0);
    const [dragging, setDragging] = useState(false);

    const goToList = () => onNavigate?.('mReportList');

    const onTouchStart = (e) => {
        touchStartY.current = e.touches?.[0]?.clientY ?? e.clientY;
        touchStartT.current = Date.now();
        setDragging(true);
    };
    const onTouchMove = (e) => {
        if (!dragging) return;
        const y = e.touches?.[0]?.clientY ?? e.clientY;
        const dy = y - touchStartY.current;
        const idx = SHEET_MODES.indexOf(sheetMode);
        // rubber-band 저항
        if (dy < 0 && idx === SHEET_MODES.length - 1) setDragY(dy / 3);
        else if (dy > 0 && idx === 0) setDragY(dy / 3);
        else setDragY(dy);
    };
    const onTouchEnd = (e) => {
        if (!dragging) return;
        const endY = e.changedTouches?.[0]?.clientY ?? e.clientY ?? (touchStartY.current + dragY);
        const dy = endY - touchStartY.current;
        const dt = Date.now() - touchStartT.current;
        const idx = SHEET_MODES.indexOf(sheetMode);
        const velocity = dt > 0 ? Math.abs(dy) / dt : 0;
        setDragging(false);
        setDragY(0);
        if (Math.abs(dy) < 12 && dt < 220) return;
        const flick = velocity > 0.6;
        const threshold = flick ? 25 : 40;
        if (dy < -threshold) {
            if (idx < SHEET_MODES.length - 1) setSheetMode(SHEET_MODES[idx + 1]);
            else goToList();
        } else if (dy > threshold && idx > 0) {
            setSheetMode(SHEET_MODES[idx - 1]);
        }
    };

    // Lightweight pins for map — fetch once on mount, independent of list filters
    useEffect(() => {
        fetch(`${API_URL}/api/reports/pins`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                const pins = (Array.isArray(rows) ? rows : []).map((r) => ({
                    id: String(r.id),
                    lat: r.lat,
                    lng: r.lng,
                    // Figma 215:10932 WDC — 제보 핀 색 보라 (#542aa3)
                    color: '#542aa3',
                    title: r.category || '',
                    // Figma 0:12148 — 단건도 숫자 배지 핀으로 통일 (teardrop 금지)
                    count: 1,
                }));
                setMapPins(pins);
            })
            .catch(() => {});
    }, []);

    // Full list — region은 클라이언트에서 정규화 매칭(아래 ITEMS 필터)으로 처리, 백엔드에는 cat/stage만 전달
    useEffect(() => {
        const params = new URLSearchParams();
        if (cat && cat !== '전체') params.set('category', cat);
        const stageDef = STAGES.find((s) => s.key === stage);
        if (stageDef) params.set('status', stageDef.apiValue);
        fetch(`${API_URL}/api/reports/full?${params.toString()}`)
            .then((r) => (r.ok ? r.json() : { items: [] }))
            .then((data) => {
                const list = data.items ?? data;
                setItems(Array.isArray(list) ? list : []);
            })
            .catch(() => setItems([]));
    }, [cat, stage]);

    const ITEMS = useMemo(() => {
        const q = search.trim().toLowerCase();
        const regionFilter = region && region !== '부산전체' ? region : null;
        return items
            .map((it) => ({
                id: it.id,
                cat: it.category,
                sub: it.sub_category,
                title: it.title,
                author: it.author || it.nickname || '익명',
                likes: it.likes_count ?? it.likes ?? 0,
                comments: it.comments_count ?? it.comments ?? 0,
                image: (Array.isArray(it.files) && it.files.length > 0) ? it.files[0] : (it.image || it.image_url || null),
                lat: it.lat,
                lng: it.lng,
                content: it.content,
                region: it.region,
                date: it.created_at || it.date,
                views: it.views_count ?? it.views,
                progress_step: it.progress_step,
                status: it.status,
            }))
            .filter((it) => {
                if (!regionFilter) return true;
                if (matchDistrict(it.region, regionFilter)) return true;
                const approx = nearestDistrict(it.lat, it.lng, DISTRICT_CENTERS);
                return matchDistrict(approx, regionFilter);
            })
            .filter((it) => !q || it.title?.toLowerCase().includes(q) || it.region?.toLowerCase().includes(q) || it.content?.toLowerCase().includes(q));
    }, [items, region, search]);

    // Filtered pins to match current category/region selection
    const FILTERED_PINS = useMemo(() => {
        const catFilter = cat !== '전체' ? cat : null;
        return mapPins.filter((p) => !catFilter || p.title === catFilter);
    }, [mapPins, cat]);

    const openRegion = () => { setRegionDraft(region); setRegionOpen(true); };
    const confirmRegion = () => { setRegion(regionDraft); setRegionOpen(false); };

    return (
        <div className={`m-prop-map-page m-rmap-page sheet-${sheetMode}`}>
            <MMapSearchBar
                value={search}
                onChange={setSearch}
                onBack={() => onNavigate?.('mReportList')}
                placeholder="제목·내용으로 검색"
                showBack={true}
            />

            <div className="m-map-canvas">
                <PCMapCanvas
                    ref={mapRef}
                    pins={FILTERED_PINS}
                    accentColor="#542aa3"
                    initialCenter={{ lat: 35.1796, lng: 129.0756 }}
                    onPinClick={(pin) => {
                        setSelectedPinId(String(pin.id));
                        setSheetMode('half');
                    }}
                    selectedDistrict={region !== '부산전체' ? region : null}
                />
            </div>

            {/* 내 위치 FAB */}
            <button
                className="m-locate-fab"
                onClick={() => mapRef.current?.locateMe?.()}
                aria-label="내 위치"
                title="내 위치"
            >
                {/* Figma 0:12150 — 검정 크로스헤어 (흰 원 배경 없음) */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" stroke="#000" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="1.5" fill="#D9D9D9" stroke="#000"/>
                    <path d="M12 0.5V5.5" stroke="#000" strokeWidth="2"/>
                    <path d="M12 18V23" stroke="#000" strokeWidth="2"/>
                    <path d="M23.2549 11.7451H18.2549" stroke="#000" strokeWidth="2"/>
                    <path d="M5.75488 11.7451H0.754883" stroke="#000" strokeWidth="2"/>
                </svg>
            </button>

            {/* 바텀시트 — 2-state (peek/half). 목록 전체는 별도 list 페이지 */}
            <div
                className={`m-map-sheet${dragging ? ' dragging' : ''}`}
                style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
            >
                <div
                    className="m-sheet-grab"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onTouchStart}
                    onMouseMove={onTouchMove}
                    onMouseUp={onTouchEnd}
                    onMouseLeave={(e) => dragging && onTouchEnd(e)}
                >
                    <div className="m-sheet-handle" />
                </div>

                <div className="m-sheet-region-row">
                    <button className="m-sheet-region-btn" onClick={openRegion} type="button">
                        <span>{region}</span>
                        <span className="m-region-arrow">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                        </span>
                    </button>
                    <button className="m-sheet-list-btn" onClick={goToList} aria-label="목록 보기">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"/>
                            <line x1="8" y1="12" x2="21" y2="12"/>
                            <line x1="8" y1="18" x2="21" y2="18"/>
                            <line x1="3" y1="6" x2="3.01" y2="6"/>
                            <line x1="3" y1="12" x2="3.01" y2="12"/>
                            <line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div className="m-cat-chips m-sheet-chips">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            className={`m-cat-chip ${cat === c ? 'on' : ''}`}
                            onClick={() => { setCat(c); setSelectedPinId(null); }}
                        >{c}</button>
                    ))}
                </div>

                <ul className="m-sheet-cards">
                    {(() => {
                        const displayed = selectedPinId
                            ? ITEMS.filter((it) => String(it.id) === selectedPinId)
                            : ITEMS;
                        if (displayed.length === 0) {
                            return (
                                <li style={{ padding: '32px 0', textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                                    {search.trim() ? '검색 결과가 없습니다.' : '조건에 맞는 제보가 없습니다.'}
                                </li>
                            );
                        }
                        return displayed.map((it) => (
                            <ReportCard key={it.id} it={it} onNavigate={onNavigate} />
                        ));
                    })()}
                </ul>
            </div>

            <button
                className="m-prop-fab m-rmap-fab"
                onClick={() => onNavigate && onNavigate('mReportForm')}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>제보하기</span>
            </button>

            {regionOpen && (
                <RegionSheet
                    accent="#542aa3"
                    regions={REGIONS}
                    draft={regionDraft}
                    onSelect={setRegionDraft}
                    onConfirm={confirmRegion}
                    onClose={() => setRegionOpen(false)}
                />
            )}

            <MobileBottomNav currentView="mReportMap" onNavigate={onNavigate} />
        </div>
    );
}
