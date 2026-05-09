import './MProposalDone.css';

function DoneIllustration() {
    return (
        <svg width="132" height="132" viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="14" y="10" width="80" height="98" rx="10" fill="#fff" stroke="#1a1a1b" strokeWidth="5"/>
            <path d="M74 98 L94 108 L94 88 Z" fill="#f0f0f0" stroke="#1a1a1b" strokeWidth="3" strokeLinejoin="round"/>
            <line x1="28" y1="34" x2="80" y2="34" stroke="#1a1a1b" strokeWidth="4" strokeLinecap="round"/>
            <line x1="28" y1="50" x2="80" y2="50" stroke="#1a1a1b" strokeWidth="4" strokeLinecap="round"/>
            <line x1="28" y1="66" x2="62" y2="66" stroke="#1a1a1b" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="90" cy="90" r="30" fill="#E6235A"/>
            <path d="M77 90 L86 99 L105 78" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default function MReportDone({ onNavigate }) {
    return (
        <div className="m-prop-done-page">
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
