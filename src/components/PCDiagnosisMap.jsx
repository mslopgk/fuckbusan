import { useState, useRef, useEffect } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import MapToolbar from './PCMapToolbar';
import PCDiagPanelDetail from './PCDiagPanelDetail';
import PCDiagPanelForm from './PCDiagPanelForm';
import PCDiagPanelDone from './PCDiagPanelDone';
import {
    DISTRICTS,
    LIVING_CATS,
    DIAGNOSIS_TARGETS as TARGETS,
} from '../constants/diagnosis';
import './PCMapShared.css';
import './PCMap3.css';
import './PCDiagnosisMap.css';
import './PCDiagnosisDetail.css';
import './PCDiagnosisForm.css';

const FACILITY_BIG = ['공간 및 가로 환경', '공공시설물', '정보 및 서비스 매체'];

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

const BIG_COLORS = {
    '주거': '#DFF8F8',
    '환경': '#C0E6C0',
    '교육': '#FFC9C9',
    '교통': '#FFE2B5',
    '안전': '#FFD0D0',
    '산업·일자리': '#E5DDFF',
    '문화·여가': '#FFD9F0',
    '보건·복지': '#D0E8FF',
};

const BIG_TO_KEY = {
    '주거': 'housing',
    '환경': 'env',
    '교육': 'edu',
    '교통': 'traffic',
    '안전': 'safety',
    '산업·일자리': 'work',
    '문화·여가': 'culture',
    '보건·복지': 'health',
};

function CategoryIcon({ kind }) {
    switch (kind) {
        // 전체: apps — 3×3 circle grid (Figma 22:8835)
        case 'grid':
            return (
                <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                    {[0,1,2].flatMap((r) => [0,1,2].map((c) => (
                        <circle key={`${r}-${c}`} cx={2+c*6} cy={2+r*6} r="2"/>
                    )))}
                </svg>
            );
        // 안전: health_and_safety — shield + medical cross (Figma 22:8808)
        case 'shield':
            return (
                <svg width="22" height="22" viewBox="0 0 16 20" fill="currentColor">
                    <path d="M6.5 13.5H9.5V11H12V8H9.5V5.5H6.5V8H4V11H6.5V13.5ZM8 20C5.683 19.417 3.771 18.088 2.263 16.013C0.754 13.938 0 11.633 0 9.1V3L8 0L16 3V9.1C16 11.633 15.246 13.938 13.738 16.013C12.229 18.088 10.317 19.417 8 20ZM8 17.9C9.733 17.35 11.167 16.25 12.3 14.6C13.433 12.95 14 11.117 14 9.1V4.375L8 2.125L2 4.375V9.1C2 11.117 2.567 12.95 3.7 14.6C4.833 16.25 6.267 17.35 8 17.9Z"/>
                </svg>
            );
        // 주거: home — house (Figma 22:8822)
        case 'home':
            return (
                <svg width="22" height="22" viewBox="0 0 16 18" fill="currentColor">
                    <path d="M2 16H5V10H11V16H14V7L8 2.5L2 7V16ZM0 18V6L8 0L16 6V18H9V12H7V18H0Z"/>
                </svg>
            );
        // 산업·일자리: badge — ID card with person (Figma 22:8839)
        case 'briefcase':
            return (
                <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 20C1.45 20 0.979 19.804 0.588 19.413C0.196 19.021 0 18.55 0 18V7C0 6.45 0.196 5.979 0.588 5.588C0.979 5.196 1.45 5 2 5H7V2C7 1.45 7.196 0.979 7.588 0.588C7.979 0.196 8.45 0 9 0H11C11.55 0 12.021 0.196 12.413 0.588C12.804 0.979 13 1.45 13 2V5H18C18.55 5 19.021 5.196 19.413 5.588C19.804 5.979 20 6.45 20 7V18C20 18.55 19.804 19.021 19.413 19.413C19.021 19.804 18.55 20 18 20H2ZM2 18H18V7H13C13 7.55 12.804 8.021 12.413 8.413C12.021 8.804 11.55 9 11 9H9C8.45 9 7.979 8.804 7.588 8.413C7.196 8.021 7 7.55 7 7H2V18ZM4 16H10V15.55C10 15.267 9.921 15.004 9.763 14.763C9.604 14.521 9.383 14.333 9.1 14.2C8.767 14.05 8.429 13.938 8.088 13.863C7.746 13.788 7.383 13.75 7 13.75C6.617 13.75 6.254 13.788 5.913 13.863C5.571 13.938 5.233 14.05 4.9 14.2C4.617 14.333 4.396 14.521 4.238 14.763C4.079 15.004 4 15.267 4 15.55V16ZM12 14.5H16V13H12V14.5ZM7 13C7.417 13 7.771 12.854 8.063 12.563C8.354 12.271 8.5 11.917 8.5 11.5C8.5 11.083 8.354 10.729 8.063 10.438C7.771 10.146 7.417 10 7 10C6.583 10 6.229 10.146 5.938 10.438C5.646 10.729 5.5 11.083 5.5 11.5C5.5 11.917 5.646 12.271 5.938 12.563C6.229 12.854 6.583 13 7 13ZM12 11.5H16V10H12V11.5ZM9 7H11V2H9V7Z"/>
                </svg>
            );
        // 교육: school — mortarboard (Figma 22:8812)
        case 'book':
            return (
                <svg width="22" height="22" viewBox="0 0 22 18" fill="currentColor">
                    <path d="M11 18L4 14.2V8.2L0 6L11 0L22 6V14H20V7.1L18 8.2V14.2L11 18ZM11 9.7L17.85 6L11 2.3L4.15 6L11 9.7ZM11 15.725L16 13.025V9.25L11 12L6 9.25V13.025L11 15.725Z"/>
                </svg>
            );
        // 환경: forest — two trees (Figma 22:8826)
        case 'leaf':
            return (
                <svg width="22" height="22" viewBox="0 0 24 20" fill="currentColor">
                    <path d="M7 20V16H0L3.85 10H2L9 0L12 4.3L15 0L22 10H20.15L24 16H17V20H13V16H11V20H7ZM16.725 14H20.35L16.475 8H18.15L15 3.5L13.225 6.025L16 10H14.15L16.725 14ZM3.65 14H14.35L10.475 8H12.15L9 3.5L5.85 8H7.525L3.65 14Z"/>
                </svg>
            );
        // 문화·여가: sports_esports — game controller (Figma 22:8843)
        case 'heart':
            return (
                <svg width="22" height="22" viewBox="0 0 20 14" fill="currentColor">
                    <path d="M2.535 14C1.685 14 1.027 13.704 0.56 13.113C0.093 12.521 -0.082 11.8 0.035 10.95L1.085 3.45C1.235 2.45 1.681 1.625 2.423 0.975C3.164 0.325 4.035 0 5.035 0H14.935C15.935 0 16.806 0.325 17.548 0.975C18.289 1.625 18.735 2.45 18.885 3.45L19.935 10.95C20.052 11.8 19.877 12.521 19.41 13.113C18.943 13.704 18.285 14 17.435 14C17.085 14 16.76 13.938 16.46 13.813C16.16 13.688 15.885 13.5 15.635 13.25L13.385 11H6.585L4.335 13.25C4.085 13.5 3.81 13.688 3.51 13.813C3.21 13.938 2.885 14 2.535 14ZM2.935 11.85L5.785 9H14.185L17.035 11.85C17.618 12 17.764 11.946 17.873 11.838C17.981 11.729 18.018 11.583 17.985 11.4L16.885 3.7C16.818 3.217 16.602 2.813 16.235 2.488C15.868 2.163 15.435 2 14.935 2H5.035C4.535 2 4.102 2.163 3.735 2.488C3.368 2.813 3.152 3.217 3.085 3.7L1.985 11.4C1.952 11.583 1.989 11.729 2.098 11.838C2.206 11.946 2.352 12 2.535 12C2.702 11.95 2.935 11.85 2.935 11.85ZM14.985 8C15.268 8 15.506 7.904 15.698 7.713C15.889 7.521 15.985 7.283 15.985 7C15.985 6.717 15.889 6.479 15.698 6.288C15.506 6.096 15.268 6 14.985 6C14.702 6 14.464 6.096 14.273 6.288C14.081 6.479 13.985 6.717 13.985 7C13.985 7.283 14.081 7.521 14.273 7.713C14.464 7.904 14.702 8 14.985 8ZM12.985 5C13.268 5 13.506 4.904 13.698 4.713C13.889 4.521 13.985 4.283 13.985 4C13.985 3.717 13.889 3.479 13.698 3.288C13.506 3.096 13.268 3 12.985 3C12.702 3 12.464 3.096 12.273 3.288C12.081 3.479 11.985 3.717 11.985 4C11.985 4.283 12.081 4.521 12.273 4.713C12.464 4.904 12.702 5 12.985 5ZM5.735 8H7.235V6.25H8.985V4.75H7.235V3H5.735V4.75H3.985V6.25H5.735V8Z"/>
                </svg>
            );
        // 보건·복지: volunteer_activism — heart + hand (Figma 22:8816)
        case 'plus':
            return (
                <svg width="22" height="22" viewBox="0 0 21 20.5" fill="currentColor">
                    <path d="M15 11L10.85 6.95C10.333 6.45 9.896 5.896 9.538 5.288C9.179 4.679 9 4.017 9 3.3C9 2.383 9.321 1.604 9.963 0.963C10.604 0.321 11.383 0 12.3 0C12.833 0 13.333 0.113 13.8 0.338C14.267 0.563 14.667 0.867 15 1.25C15.333 0.867 15.733 0.563 16.2 0.338C16.667 0.113 17.167 0 17.7 0C18.617 0 19.396 0.321 20.038 0.963C20.679 1.604 21 2.383 21 3.3C21 4.017 20.825 4.679 20.475 5.288C20.125 5.896 19.692 6.45 19.175 6.95L15 11ZM15 8.2L17.725 5.525C18.042 5.208 18.333 4.871 18.6 4.513C18.867 4.154 19 3.75 19 3.3C19 2.933 18.875 2.625 18.625 2.375C18.375 2.125 18.067 2 17.7 2C17.467 2 17.246 2.046 17.038 2.138C16.829 2.229 16.65 2.367 16.5 2.55L15 4.35L13.5 2.55C13.35 2.367 13.171 2.229 12.963 2.138C12.754 2.046 12.533 2 12.3 2C11.933 2 11.625 2.125 11.375 2.375C11.125 2.625 11 2.933 11 3.3C11 3.75 11.133 4.154 11.4 4.513C11.667 4.871 11.958 5.208 12.275 5.525L15 8.2ZM6 16.5L12.95 18.4L18.9 16.55C18.817 16.4 18.696 16.271 18.538 16.163C18.379 16.054 18.2 16 18 16H12.95C12.5 16 12.142 15.983 11.875 15.95C11.608 15.917 11.333 15.85 11.05 15.75L8.725 14.975L9.275 13.025L11.3 13.7C11.583 13.783 11.917 13.85 12.3 13.9C12.683 13.95 13.25 13.983 14 14C14 13.817 13.946 13.642 13.838 13.475C13.729 13.308 13.6 13.2 13.45 13.15L7.6 11H6V16.5ZM0 20V9H7.6C7.717 9 7.833 9.013 7.95 9.038C8.067 9.063 8.175 9.092 8.275 9.125L14.15 11.3C14.7 11.5 15.146 11.85 15.488 12.35C15.829 12.85 16 13.4 16 14H18C18.833 14 19.542 14.275 20.125 14.825C20.708 15.375 21 16.1 21 17V18L13 20.5L6 18.55V20H0ZM2 18H4V11H2V18Z"/>
                </svg>
            );
        // 교통: directions_bus — bus (Figma 22:8830)
        case 'bus':
            return (
                <svg width="22" height="22" viewBox="0 0 16 19" fill="currentColor">
                    <path d="M2 19C1.717 19 1.479 18.904 1.288 18.713C1.096 18.521 1 18.283 1 18V15.95C0.7 15.617 0.458 15.246 0.275 14.838C0.092 14.429 0 13.983 0 13.5V4C0 2.617 0.642 1.604 1.925 0.963C3.208 0.321 5.233 0 8 0C10.867 0 12.917 0.308 14.15 0.925C15.383 1.542 16 2.567 16 4V13.5C16 13.983 15.908 14.429 15.725 14.838C15.542 15.246 15.3 15.617 15 15.95V18C15 18.283 14.904 18.521 14.713 18.713C14.521 18.904 14.283 19 14 19H13C12.717 19 12.479 18.904 12.288 18.713C12.096 18.521 12 18.283 12 18V17H4V18C4 18.283 3.904 18.521 3.713 18.713C3.521 18.904 3.283 19 3 19H2ZM2 8H14V5H2V8ZM4.5 14C4.917 14 5.271 13.854 5.563 13.563C5.854 13.271 6 12.917 6 12.5C6 12.083 5.854 11.729 5.563 11.438C5.271 11.146 4.917 11 4.5 11C4.083 11 3.729 11.146 3.438 11.438C3.146 11.729 3 12.083 3 12.5C3 12.917 3.146 13.271 3.438 13.563C3.729 13.854 4.083 14 4.5 14ZM11.5 14C11.917 14 12.271 13.854 12.563 13.563C12.854 13.271 13 12.917 13 12.5C13 12.083 12.854 11.729 12.563 11.438C12.271 11.146 11.917 11 11.5 11C11.083 11 10.729 11.146 10.438 11.438C10.146 11.729 10 12.083 10 12.5C10 12.917 10.146 13.271 10.438 13.563C10.729 13.854 11.083 14 11.5 14ZM4 15H12C12.55 15 13.021 14.804 13.413 14.413C13.804 14.021 14 13.55 14 13V10H2V13C2 13.55 2.196 14.021 2.588 14.413C2.979 14.804 3.45 15 4 15Z"/>
                </svg>
            );
        default:
            return null;
    }
}

/**
 * PC 진단 통합 셸. 지도 + 좌측 필터 + 우측 패널.
 * 우측 패널은 panel state에 따라 list / detail / form / done 콘텐츠를 렌더.
 *
 * App.jsx의 라우팅 view 4종 (pcDiagnosisMap/Detail/Form/Done) 모두 이 컴포넌트를
 * 다른 initialPanel prop으로 호출. 화면 전환은 라우팅 없이 내부 panel state로 처리.
 */
export default function PCDiagnosisMap({ onNavigate, initialPanel = 'list', initialItem = null }) {
    const [district, setDistrict] = useState('중구');
    const [livingCats, setLivingCats] = useState(() => new Set(['all']));
    const [bigSel, setBigSel] = useState(new Set(['공간 및 가로 환경']));
    const [facilityMid, setFacilityMid] = useState('');
    const [facilitySub, setFacilitySub] = useState('');
    const [target, setTarget] = useState('all');
    const [sort, setSort] = useState('latest');
    const mapRef = useRef(null);

    const [panel, setPanel] = useState(initialPanel);
    const [selected, setSelected] = useState(initialItem);
    const [items, setItems] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        setPanel(initialPanel);
        setSelected(initialItem);
    }, [initialPanel, initialItem]);

    useEffect(() => {
        if (panel === 'detail') setSidebarOpen(true);
    }, [panel]);

    useEffect(() => {
        fetch(`${API_URL}/checklist/list`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                if (!Array.isArray(rows)) {
                    setItems([]);
                    return;
                }
                setItems(rows.map((r) => ({
                    id: r.result_id,
                    big: r.대분류 || '주거',
                    bigColor: BIG_COLORS[r.대분류] || '#DFF8F8',
                    mid: r.중분류 || '',
                    name: r.질문기준 || r.대분류 || '진단',
                    score: r.점수 != null ? Number(r.점수).toFixed(1) : null,
                    reviewText: r.리뷰 || '',
                    region: r.진단지역 || '',
                    categoryKey: BIG_TO_KEY[r.대분류] || 'housing',
                    likes: r.likes || 0,
                    views: r.점수 || 0,
                    lat: r.위도 ? Number(r.위도) : null,
                    lng: r.경도 ? Number(r.경도) : null,
                    thumb: r.이미지경로 || null,
                })).filter((it) => it.lat && it.lng));
            })
            .catch(() => setItems([]));
    }, []);

    const toggleLivingCat = (key) => {
        setLivingCats((prev) => {
            const next = new Set(prev);
            if (key === 'all') return new Set(['all']);
            next.delete('all');
            if (next.has(key)) next.delete(key);
            else next.add(key);
            if (next.size === 0) next.add('all');
            return next;
        });
    };

    const toggleBig = (key) => setBigSel((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
    });

    let filtered = items;
    if (district && district !== '중구') filtered = filtered.filter((it) => it.region === district);
    if (!livingCats.has('all')) filtered = filtered.filter((it) => livingCats.has(it.categoryKey));
    if (sort === 'views') filtered = [...filtered].sort((a, b) => b.views - a.views);
    if (sort === 'votes') filtered = [...filtered].sort((a, b) => b.likes - a.likes);

    const pins = filtered.map((it, idx) => ({
        ...it,
        color: idx === 0 ? '#23bdbb' : '#808080',
        focus: idx === 0,
    }));

    const goList = () => { setPanel('list'); setSelected(null); };
    const goDetail = (item) => { setPanel('detail'); setSelected(item); };
    const goForm = () => { setPanel('form'); };
    const goDone = () => { setPanel('done'); };

    return (
        <UserPCLayout currentView="pcDiagnosisMap" onNavigate={onNavigate}>
            <div className={`pc-diag-page${sidebarOpen ? '' : ' pc-diag-sidebar-closed'}`}>
                {/* LEFT FILTER STACK — 4 separate cards */}
                <div className="pc-diag-filter-stack">
                    {/* 1. 구역별 */}
                    <aside className="pc-diag-filter-card">
                        <div className="pc-diag-section-label">구역별</div>
                        <div className="pc-diag-dropdown">
                            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <button className="pc-diag-dropdown-x" onClick={() => setDistrict('중구')} aria-label="초기화" type="button">×</button>
                        </div>
                    </aside>

                    {/* 2. 생활정보 */}
                    <aside className="pc-diag-filter-card">
                        <div className="pc-diag-facility-title">생활정보</div>
                        <div className="pc-diag-cat-grid">
                            {LIVING_CATS.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    className={`pc-diag-cat-btn ${livingCats.has(c.key) ? 'active' : ''}`}
                                    onClick={() => toggleLivingCat(c.key)}
                                >
                                    <span className="pc-diag-cat-icon"><CategoryIcon kind={c.icon} /></span>
                                    <span className="pc-diag-cat-label">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* 3. 진단대상 */}
                    <aside className="pc-diag-filter-card">
                        <div className="pc-diag-section-label">진단대상</div>
                        <div className="pc-diag-target-row">
                            {TARGETS.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    className={`pc-diag-target-btn ${target === t.key ? 'on' : ''}`}
                                    onClick={() => setTarget(t.key)}
                                >{t.label}</button>
                            ))}
                        </div>
                    </aside>

                    {/* 4. 공공/시설물 */}
                    <aside className="pc-diag-filter-card">
                        <div className="pc-diag-facility-title">공공/시설물</div>
                        <div className="pc-diag-section-label">대분류</div>
                        <div className="pc-diag-check-col">
                            {FACILITY_BIG.map((f) => (
                                <label key={f} className={`pc-diag-check ${bigSel.has(f) ? 'on' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={bigSel.has(f)}
                                        onChange={() => toggleBig(f)}
                                    />
                                    {f}
                                </label>
                            ))}
                        </div>

                        <div className="pc-diag-facility-divider" />

                        <div className="pc-diag-section-label">중분류</div>
                        <div className="pc-diag-dropdown pc-diag-sub-select">
                            <select value={facilityMid} onChange={(e) => setFacilityMid(e.target.value)}>
                                <option value="">선택해주세요</option>
                            </select>
                        </div>

                        <div className="pc-diag-facility-divider" />

                        <div className="pc-diag-section-label">소분류</div>
                        <div className="pc-diag-dropdown pc-diag-sub-select">
                            <select value={facilitySub} onChange={(e) => setFacilitySub(e.target.value)}>
                                <option value="">선택해주세요</option>
                            </select>
                        </div>

                        <div className="pc-diag-filter-actions">
                            <button type="button" className="pc-diag-btn-cancel" onClick={() => { setBigSel(new Set()); setFacilityMid(''); setFacilitySub(''); }}>취소</button>
                            <button type="button" className="pc-diag-btn-confirm">확인</button>
                        </div>
                    </aside>

                    {panel !== 'list' && (
                        <button type="button" className="pc-diag-back-btn" onClick={goList}>
                            ← 목록으로
                        </button>
                    )}
                </div>

                {/* CENTER MAP */}
                <div className="pc-diag-canvas">
                    <PCMapCanvas
                        ref={mapRef}
                        pins={pins}
                        onPinClick={panel === 'list' ? goDetail : undefined}
                        accentColor="#23BDBB"
                        pinVariant="diagnosis"
                    />
                    <MapToolbar
                        mapRef={mapRef}
                        onToggleSidebar={() => setSidebarOpen((v) => !v)}
                        sidebarOpen={sidebarOpen}
                    />

                    {panel === 'list' && (
                        <button
                            type="button"
                            className="pc-diag-cta"
                            onClick={goForm}
                        >
                            진단하기
                        </button>
                    )}
                </div>

                {/* RIGHT PANEL — content varies by `panel` state */}
                <aside className={`pc-diag-right pc-diag-right-${panel}`}>
                    {panel === 'list' && (
                        <>
                            <ul className="pc-diag-list-items">
                                {filtered.map((it) => (
                                    <li
                                        key={it.id}
                                        className="pc-diag-card"
                                        onClick={() => goDetail(it)}
                                    >
                                        <div className="pc-diag-card-body">
                                            <div className="pc-diag-card-tags">
                                                <span className="pc-diag-tag-fig">{it.big}</span>
                                                {it.mid && <span className="pc-diag-tag-fig">{it.mid}</span>}
                                            </div>
                                            <div className="pc-diag-card-name-row">
                                                <span className="pc-diag-card-name">{it.name}</span>
                                                {it.score != null && <span className="pc-diag-card-score">{it.score}</span>}
                                            </div>
                                            {it.reviewText && <p className="pc-diag-card-review">{it.reviewText}</p>}
                                        </div>
                                        <div
                                            className="pc-diag-card-thumb"
                                            style={it.thumb ? { backgroundImage: `url(${it.thumb})` } : undefined}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {panel === 'detail' && (
                        <PCDiagPanelDetail
                            item={selected}
                            onAddDiagnosis={goForm}
                            mode={target === 'expert' ? 'expert' : 'citizen'}
                        />
                    )}

                    {panel === 'form' && (
                        <PCDiagPanelForm onCancel={goList} onSubmit={goDone} />
                    )}

                    {panel === 'done' && (
                        <PCDiagPanelDone onClose={goList} />
                    )}
                </aside>
            </div>
        </UserPCLayout>
    );
}
