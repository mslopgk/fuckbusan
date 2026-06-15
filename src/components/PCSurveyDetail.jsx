import { useState, useEffect } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCSurveyDetail.css';
import { API_URL } from '../utils/api';
import { copyToClipboard } from '../utils/clipboard';

const formatEndDate = (period) => {
    if (!period) return '';
    const parts = String(period).split('~');
    return parts.length >= 2 ? `~${parts[1].trim()}` : `~${period}`;
};

export default function PCSurveyDetail({ onNavigate, survey }) {
    const [fullSurvey, setFullSurvey] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const id = survey?.id;
        if (!id) return;
        fetch(`${API_URL}/api/surveys/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d) setFullSurvey(d); })
            .catch(() => {});
    }, [survey?.id]);

    const enriched = { ...(survey || {}), ...(fullSurvey || {}) };
    const data = {
        title: '',
        period: '',
        duration: '',
        description: '',
        ...enriched,
    };

    const handleCopy = async () => {
        const lines = [data.title];
        if (data.period || data.end_date) lines.push(`조사기간: ${formatEndDate(data.period || data.end_date)}`);
        if (data.duration || data.minutes) lines.push(`응답시간: ${data.duration || `${data.minutes}분`}`);
        if (data.description) lines.push(`내용: ${data.description}`);
        const text = lines.join('\n');
        await copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <UserPCLayout currentView="pcSurveyDetail" onNavigate={onNavigate}>
            <div className="pc-survey-detail-page">
                <div className="pc-purple-banner pc-banner-tall">
                    <h1 className="pc-banner-title">{data.title}</h1>
                    <button className="pc-banner-copy-btn" onClick={handleCopy}>
                        {copied
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        }
                        {copied ? '복사됨' : '복사하기'}
                    </button>
                </div>

                <div className="pc-floating-card">
                    <div className="pc-info-row"><span className="pc-info-label">조사명</span><span className="pc-info-value">{data.title}</span></div>
                    <div className="pc-info-row"><span className="pc-info-label">조사기간</span><span className="pc-info-value">{formatEndDate(data.period || data.end_date) || '—'}</span></div>
                    <div className="pc-info-row"><span className="pc-info-label">응답시간</span><span className="pc-info-value">{data.duration || (data.minutes ? `${data.minutes}분` : '—')}</span></div>
                    <div className="pc-info-row pc-info-row-multiline"><span className="pc-info-label">내용</span><span className="pc-info-value pc-info-multiline">{data.description}</span></div>
                </div>

                <div className="pc-detail-body">
                    <p className="pc-detail-intro">
                        본 설문은 시민 여러분의 의견을 수렴하여 공공서비스<br/>
                        개선 및 정책 수립에 반영하기 위한 조사입니다.
                    </p>

                    <ul className="pc-bullet-list">
                        <li>설문 조사는 응답을 중단하더라도, 언제든 이어서 참여할 수 있습니다.</li>
                        <li>응답해주신 내용은 통계 분석 목적으로만 활용되며, 관련 법령에 따라 안전하게 관리됩니다.</li>
                    </ul>

                    <div className="pc-detail-links">
                        <a href="#" onClick={(e) => e.preventDefault()}>이용약관</a>
                        <span> 및 </span>
                        <a href="#" onClick={(e) => e.preventDefault()}>개인정보처리방침</a>
                    </div>

                    <div className="pc-detail-action">
                        <button
                            className="pc-btn-primary"
                            onClick={() => onNavigate && onNavigate('pcSurveyConsent', fullSurvey || survey || data)}
                        >
                            참여하기
                        </button>
                    </div>
                </div>
            </div>
        </UserPCLayout>
    );
}
