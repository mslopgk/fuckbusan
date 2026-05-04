import './MProposalDone.css';

export default function MReportDone({ onNavigate }) {
    return (
        <div className="m-prop-done-page">
            <div className="m-prop-done-icon" aria-hidden="true">
                <img src="/figma-assets/done_doc.png" alt="" className="m-prop-done-doc" />
                <img src="/figma-assets/done_check.png" alt="" className="m-prop-done-check" />
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
