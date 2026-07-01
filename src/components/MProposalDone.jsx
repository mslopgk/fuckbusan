import './MProposalDone.css';

function DoneIllustration() {
    return (
        <div className="m-prop-done-illus" aria-hidden="true">
            {/* Scroll/document icon — Figma node 0:14117 */}
            <img
                className="m-prop-done-scroll"
                src="/figma-assets/proposal-done-scroll.svg"
                alt=""
                width="132"
                height="132"
            />
            {/* Pink check circle — Figma node 0:14119, positioned at bottom-right of scroll */}
            <img
                className="m-prop-done-check"
                src="/figma-assets/proposal-done-check.svg"
                alt=""
                width="54"
                height="54"
            />
        </div>
    );
}

export default function MProposalDone({ onNavigate }) {
    return (
        <div className="m-prop-done-page">
            <DoneIllustration />

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
