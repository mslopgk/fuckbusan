import UserPCLayout from './UserPCLayout';
import './PCSurveyDone.css';

export default function PCSurveyDone({ onNavigate, survey }) {
    return (
        <UserPCLayout currentView="pcSurveyDone" onNavigate={onNavigate}>
            <div className="pc-survey-done-page">
                <div className="pc-done-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="32" fill="#5B2EAB"/>
                        <path d="M20 32l8 8 16-16" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <h1 className="pc-done-title">설문 제출 완료</h1>
                <p className="pc-done-subtitle">참여해 주셔서 감사합니다</p>
                <p className="pc-done-text">
                    귀하의 의견은 지역 개선을 위한 자료로 활용됩니다.<br/>
                    더 나은 동네를 만들기 위해 지속적으로 노력하겠습니다.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                    {survey?.id && (
                        <button className="pc-btn-primary pc-done-cta" onClick={() => onNavigate && onNavigate('pcSurveyResults', survey)}>
                            결과 보기
                        </button>
                    )}
                    <button className="pc-btn-secondary pc-done-cta" onClick={() => onNavigate && onNavigate('home')}>
                        홈으로 이동
                    </button>
                </div>
            </div>
        </UserPCLayout>
    );
}
