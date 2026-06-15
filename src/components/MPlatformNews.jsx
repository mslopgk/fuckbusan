import React, { useState } from 'react';
import './MPlatformNews.css';

/* 플랫폼 소식 목록/상세 — Figma 215:17129 (목록), 215:16718 (상세) */

const NEWS = [
    { title: '2025년 1월 시민 참여 결과 리포트가 업데이트되었습니다.', body: '2025년 1월 한 달간 접수된 시민 참여 결과를 정리한 리포트가 업데이트되었습니다. 제보·제안·진단 참여 현황과 처리 결과를 확인하실 수 있습니다.' },
    { title: '도로·보행 환경 개선 의견 접수 기간 안내', body: '도로 및 보행 환경 개선을 위한 시민 의견을 접수합니다. 우리 동네의 불편 사항을 자유롭게 남겨주세요.' },
    { title: '서비스 정기 점검 일정 안내 (12/30 02:00–05:00)', body: '안정적인 서비스 제공을 위해 정기 점검을 진행합니다. 점검 시간 동안 일부 기능 이용이 제한될 수 있습니다.' },
    { title: '제보된 안전 위험 요소의 조치 현황을 확인하세요', body: '시민들이 제보해주신 안전 위험 요소에 대한 조치 현황을 공개합니다. 처리 진행 상황을 투명하게 확인하실 수 있습니다.' },
    { title: '우수 사례 아카이브 신규 콘텐츠가 추가되었습니다', body: '시민 참여로 만들어진 우수 개선 사례가 아카이브에 새롭게 추가되었습니다.' },
    { title: '공공디자인 시민 워크숍 참가자 모집', body: '더 나은 부산을 함께 디자인할 시민 워크숍 참가자를 모집합니다. 관심 있는 누구나 신청할 수 있습니다.' },
];

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
    const [selected, setSelected] = useState(null);

    if (selected !== null) {
        const item = NEWS[selected];
        return (
            <div className="mpn-page">
                <BackBar onBack={() => onNavigate?.('home')} />
                <div className="mpn-detail">
                    <h1 className="mpn-detail-title">{item.title}</h1>
                    <div className="mpn-detail-divider" />
                    <p className="mpn-detail-body">{item.body}</p>
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
                {NEWS.map((n, i) => (
                    <button key={i} type="button" className="mpn-card" onClick={() => setSelected(i)}>
                        <div className="mpn-card-head">
                            <span className="mpn-card-title">{n.title}</span>
                            <ItemArrow />
                        </div>
                        <p className="mpn-card-body">{n.body}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MPlatformNews;
