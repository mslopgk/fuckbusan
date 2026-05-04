import MobileBottomNav from './MobileBottomNav';
import './MSurveyDetail.css';

export default function MSurveyDetail1({ onNavigate, survey }) {
    const data = {
        title: survey?.title || '사직구장 일대 보행환경의 현황 조사',
        period: survey?.period || '~2026-05-30',
        minutes: survey?.minutes || 10,
        intro: survey?.intro || '사직구장 갈 때, 걷기 불편했던 적 있으신가요? 여러분의 경험이 더 안전한 보행환경을 만듭니다. 지금 참여해주세요.',
    };

    return (
        <div className="m-survey-detail-page">
            <div className="m-survey-hero">
                <div className="m-hero-topbar">
                    <button className="m-hero-back" onClick={() => onNavigate && onNavigate('mSurveyList')} aria-label="뒤로">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button
                        className="m-hero-copy"
                        onClick={() => {
                            if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span>복사하기</span>
                    </button>
                </div>
                <h1 className="m-hero-title">{data.title}</h1>
            </div>

            <div className="m-hero-card m-hero-card-overlap">
                <div className="m-hero-row"><span className="m-hero-key">조사명</span><span className="m-hero-val">{data.title}</span></div>
                <div className="m-hero-row"><span className="m-hero-key">조사기간</span><span className="m-hero-val">{data.period}</span></div>
                <div className="m-hero-row"><span className="m-hero-key">응답시간</span><span className="m-hero-val">{data.minutes}분</span></div>
                <div className="m-hero-row"><span className="m-hero-key">내용</span><span className="m-hero-val">{data.intro}</span></div>
            </div>

            <div className="m-survey-body">
                <p className="m-body-lead">본 설문은 시민 여러분의 의견을 수렴하여 공공서비스 개선 및 정책 수립에 반영하기 위한 조사입니다.</p>

                <ul className="m-body-bullets">
                    <li>설문 조사는 응답을 중단하더라도, 언제든 이어서 참여할 수 있습니다.</li>
                    <li>응답해주신 내용은 통계 분석 목적으로만 활용되며, 관련 법령에 따라 안전하게 관리됩니다</li>
                </ul>

                <p className="m-body-terms">
                    <span className="link">이용약관</span> 및 <span className="link">개인정보처리방침</span>
                </p>

                <button className="m-survey-cta" onClick={() => onNavigate && onNavigate('mSurveyDetail2', survey)}>참여하기</button>
            </div>

            <MobileBottomNav currentView="mSurveyDetail1" onNavigate={onNavigate} />
        </div>
    );
}
