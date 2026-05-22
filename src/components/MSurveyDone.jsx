import MobileBottomNav from './MobileBottomNav';
import './MSurveyDone.css';

export default function MSurveyDone({ onNavigate, survey }) {
    return (
        <div className="m-survey-done-page">
            <div className="m-done-content">
                <div className="m-done-icon">
                    <img src="/figma-assets/survey_done_check.svg" alt="" width="40" height="40" />
                </div>
                <h1 className="m-done-title">설문 제출 완료</h1>
                <p className="m-done-subtitle">참여해 주셔서 감사합니다</p>
                <p className="m-done-text">
                    귀하의 의견은 지역 개선을 위한 자료로 활용됩니다.<br/>
                    더 나은 동네를 만들기 위해 지속적으로 노력하겠습니다.
                </p>
            </div>
            <div className="m-done-actions">
                {survey?.id && (
                    <button
                        className="m-done-cta"
                        onClick={() => onNavigate && onNavigate('mSurveyResults', survey)}
                        type="button"
                    >
                        결과 보기
                    </button>
                )}
                <button
                    className="m-done-cta m-done-cta-home"
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
