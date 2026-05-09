export default function PCDiagPanelDone({ onClose }) {
    return (
        <div className="pc-diag-done-panel">
            <div className="pc-diag-done-check">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <h2 className="pc-diag-done-title">일반 진단 완료</h2>
            <p className="pc-diag-done-sub">진단 결과가 제출되었습니다</p>
            <p className="pc-diag-done-detail">입력하신 진단 내용이 정상적으로 제출되었습니다.</p>
            <button type="button" className="pc-diag-done-close" onClick={onClose}>
                지도로 돌아가기
            </button>
        </div>
    );
}
