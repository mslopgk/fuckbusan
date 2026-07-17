import './MProposalDone.css';
import './MReportDone.css';

/* Figma 302:17045 — 문서 + 보라 체크 2레이어 일러스트 (노드 export) */
function DoneIllustration() {
    return (
        <div className="m-report-done-illus" aria-hidden="true">
            {/* Figma 302:17053 export — 132x132 문서 */}
            <img className="m-report-done-scroll" src="/figma-assets/mobile-report/done_icon_outer.png" alt="" width="132" height="132" />
            {/* Figma 302:17055 export — 54x54 보라 체크, offset (40,26) */}
            <img className="m-report-done-check" src="/figma-assets/mobile-report/done_icon_inner.png" alt="" width="54" height="54" />
        </div>
    );
}

export default function MReportDone({ onNavigate }) {
    return (
        <div className="m-prop-done-page m-report-done-page">
            <DoneIllustration />

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
