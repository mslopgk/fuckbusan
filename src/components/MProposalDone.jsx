import './MProposalDone.css';

function DoneIllustration() {
    return (
        <svg width="120" height="130" viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* scroll body */}
            <rect x="8" y="4" width="76" height="96" rx="10" fill="#fff" stroke="#1a1a1b" strokeWidth="4.5"/>
            {/* scroll top curl bar */}
            <rect x="4" y="4" width="84" height="14" rx="7" fill="#f0f0f0" stroke="#1a1a1b" strokeWidth="4"/>
            {/* scroll bottom curl bar */}
            <rect x="4" y="86" width="84" height="14" rx="7" fill="#f0f0f0" stroke="#1a1a1b" strokeWidth="4"/>
            {/* check circle badge */}
            <circle cx="84" cy="94" r="28" fill="#E6235A"/>
            <path d="M73 94 L81 102 L97 81" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default function MProposalDone({ onNavigate }) {
    return (
        <div className="m-prop-done-page">
            <div className="m-prop-done-icon" aria-hidden="true">
                <DoneIllustration />
            </div>

            <h1 className="m-prop-done-title">제안 제출을<br/>완료 하였습니다</h1>

            <div className="m-prop-done-actions">
                <button className="m-prop-done-primary" onClick={() => onNavigate && onNavigate('myProposals')} type="button">
                    나의 제안 보기
                </button>
                <button className="m-prop-done-secondary" onClick={() => onNavigate && onNavigate('mProposalList')} type="button">
                    다른 제안 보기
                </button>
            </div>
        </div>
    );
}
