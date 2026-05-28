import './MProposalDone.css';
import './MReportDone.css';

function DoneIllustration() {
    return (
        <svg width="132" height="132" viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Scroll body */}
            <rect x="20" y="14" width="72" height="88" rx="8" fill="#fff" stroke="#1a1a1b" strokeWidth="4.5"/>
            {/* Scroll bottom roll */}
            <rect x="14" y="88" width="84" height="18" rx="9" fill="#f0f0f0" stroke="#1a1a1b" strokeWidth="4.5"/>
            {/* Text lines on scroll */}
            <line x1="32" y1="36" x2="80" y2="36" stroke="#1a1a1b" strokeWidth="3.5" strokeLinecap="round"/>
            <line x1="32" y1="50" x2="80" y2="50" stroke="#1a1a1b" strokeWidth="3.5" strokeLinecap="round"/>
            <line x1="32" y1="64" x2="64" y2="64" stroke="#1a1a1b" strokeWidth="3.5" strokeLinecap="round"/>
            {/* Pink checkmark circle — overlaid top-right */}
            <circle cx="88" cy="44" r="27" fill="#E6235A"/>
            <path d="M77 44 L85 52 L101 34" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default function MReportDone({ onNavigate }) {
    return (
        <div className="m-prop-done-page m-report-done-page">
            <div className="m-prop-done-icon" aria-hidden="true">
                <DoneIllustration />
            </div>

            <h1 className="m-prop-done-title">제보 제출을<br/>완료 하였습니다</h1>

            <div className="m-prop-done-actions">
                <button className="m-prop-done-primary" onClick={() => onNavigate && onNavigate('myReports')} type="button">
                    나의 제보 보기
                </button>
                <button className="m-prop-done-secondary" onClick={() => onNavigate && onNavigate('mReportList')} type="button">
                    다른 제보 보기
                </button>
            </div>
        </div>
    );
}
