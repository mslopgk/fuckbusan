/* MySurveys.jsx — Figma 215:2435(PC 나의설문) + 215:14747(모바일 Z1a_나의 설문 참여 리스트) */
import React, { useState, useEffect } from 'react';
import './MySurveys.css';
import { API_URL } from '../utils/api';
import MobileBottomNav from './MobileBottomNav';

const PERIOD_OPTIONS = ['1개월', '6개월', '1년'];

/* 상태 배지 텍스트 → 레이블 매핑 */
const STATUS_LABEL = {
    완료: '완료',
    스크린아웃: '스크린아웃',
    응답중: '응답중',
    ongoing: '응답중',
    done: '완료',
    screened: '스크린아웃',
};

const STATUS_CLASS = {
    완료: 'ms-badge--done',
    done: 'ms-badge--done',
    스크린아웃: 'ms-badge--screenout',
    screened: 'ms-badge--screenout',
    응답중: 'ms-badge--ongoing',
    ongoing: 'ms-badge--ongoing',
};

function formatDate(str) {
    if (!str) return '';
    // ISO 형식 → "YYYY.MM.DD HH:mm"
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function getPeriodStartDate(period) {
    const now = new Date();
    if (period === '1개월') {
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    if (period === '6개월') {
        return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    }
    if (period === '1년') {
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    return new Date(0);
}

/* ── 모의 데이터 (백엔드 미구현 시 폴백) ── */
const MOCK_DATA = [
    {
        id: 1,
        title: '일상생활 관련 조사(동래구)',
        participated_at: '2026-01-18T22:56:00',
        status: '완료',
        approval_status: '승인',
        survey_id: 1,
    },
    {
        id: 2,
        title: '1인가구 인식 조사(해운대구)',
        participated_at: '2026-01-10T09:13:00',
        status: '스크린아웃',
        approval_status: '승인',
        survey_id: 2,
    },
    {
        id: 3,
        title: '기본 조사',
        participated_at: '2026-01-09T10:55:00',
        status: '응답중',
        approval_status: '승인',
        survey_id: 3,
    },
];

const MySurveys = ({ onBack, onNavigate }) => {
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
        const fetchMySurveys = async () => {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                setItems(MOCK_DATA);
                setLoading(false);
                return;
            }
            try {
                // 백엔드에 /api/surveys/my-participations 엔드포인트가 없으면 폴백
                const res = await fetch(`${API_URL}/api/surveys/my-participations`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setItems(Array.isArray(data) ? data : MOCK_DATA);
                } else {
                    setItems(MOCK_DATA);
                }
            } catch {
                setItems(MOCK_DATA);
            } finally {
                setLoading(false);
            }
        };
        fetchMySurveys();
    }, []);

    /* 기간 필터 */
    const cutoff = getPeriodStartDate(period);
    const filtered = items.filter((it) => {
        const d = new Date(it.participated_at || it.created_at || 0);
        return d >= cutoff;
    });

    const handleResultClick = (item) => {
        if (onNavigate && item.survey_id) {
            onNavigate(isPC ? 'pcSurveyResults' : 'mSurveyResults', { id: item.survey_id, title: item.title });
        }
    };

    return (
        <div className={`ms-container${isPC ? ' ms-container--pc' : ''}`}>
            {/* 모바일 뒤로가기 헤더 */}
            {!isPC && (
                <header className="ms-mobile-header">
                    <button className="ms-back-btn" onClick={onBack} aria-label="뒤로가기">
                        <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                            <path d="M9 1L1 8L9 15" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </header>
            )}

            {/* 페이지 제목 (PC만 좌측 정렬) */}
            {isPC && <h1 className="ms-page-title">나의 설문</h1>}

            {/* 기간 필터 탭 */}
            <div className="ms-period-bar">
                <div className="ms-period-track">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            className={`ms-period-btn${period === opt ? ' ms-period-btn--active' : ''}`}
                            onClick={() => setPeriod(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            {/* 카드 목록 */}
            {loading ? (
                <div className="ms-empty">불러오는 중...</div>
            ) : filtered.length === 0 ? (
                <div className="ms-empty">해당 기간에 참여한 설문이 없습니다.</div>
            ) : (
                <div className={`ms-list${isPC ? ' ms-list--pc' : ''}`}>
                    {filtered.map((item) => {
                        const statusKey = item.status || 'ongoing';
                        const badgeLabel = STATUS_LABEL[statusKey] || statusKey;
                        const badgeClass = STATUS_CLASS[statusKey] || 'ms-badge--ongoing';
                        return (
                            <div key={item.id} className="ms-card">
                                {/* 상단 행: 배지 + 종합결과보기 */}
                                <div className="ms-card-top">
                                    <span className={`ms-badge ${badgeClass}`}>{badgeLabel}</span>
                                    <button
                                        className="ms-result-btn"
                                        onClick={() => handleResultClick(item)}
                                    >
                                        종합결과보기
                                        <svg width="23" height="23" viewBox="0 0 23 23" fill="none" aria-hidden="true">
                                            <circle cx="11.5" cy="11.5" r="11.5" fill="#23bdbb" />
                                            <path d="M9 7l4.5 4.5L9 16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                                {/* 제목 */}
                                <p className="ms-card-title">{item.title}</p>
                                {/* 날짜 + 구분선 + 승인 상태 */}
                                <div className="ms-card-meta">
                                    <span className="ms-card-date">
                                        {formatDate(item.participated_at || item.created_at)}
                                    </span>
                                    <span className="ms-card-sep" />
                                    <span className="ms-card-approval">
                                        {item.approval_status || '승인'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 모바일 하단 네비 */}
            {!isPC && <MobileBottomNav currentView="myActivityHub" onNavigate={onNavigate} />}
        </div>
    );
};

export default MySurveys;
