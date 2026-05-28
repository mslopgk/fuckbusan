import MobileBottomNav from './MobileBottomNav';
import './MSurveyDone.css';

function DoneCheckIcon() {
    return (
        <div className="m-done-check-circle" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </div>
    );
}

export default function MSurveyDone({ onNavigate, survey }) {
    return (
        <div className="m-survey-done-page">
            <div className="m-done-content">
                <DoneCheckIcon />
                <h1 className="m-done-title">설문 제출 완료</h1>
                <p className="m-done-subtitle">참여해 주셔서 감사합니다</p>
                <p className="m-done-text">
                    귀하의 의견은 지역 개선을 위한 자료로 활용됩니다.<br/>
                    더 나은 동네를 만들기 위해 지속적으로 노력하겠습니다.
                </p>
            </div>
            <div className="m-done-actions">
                <button
                    className="m-done-cta"
                    onClick={() => onNavigate && onNavigate('home')}
                    type="button"
                >
                    홈으로 이동
                </button>
            </div>
            <MobileBottomNav currentView="mSurveyDone" onNavigate={onNavigate} />
        </div>
    );
}
