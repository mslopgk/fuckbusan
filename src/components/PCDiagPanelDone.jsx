export default function PCDiagPanelDone({ onClose }) {
    return (
        <div className="pc-diag-done-panel">
            {/* Figma 269:14100 — check_circle_filled icon, 40×40 */}
            <div className="pc-diag-done-check">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="20" fill="#23BDBB"/>
                    <path d="M11 21L18 28L29 15" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            {/* Figma text: "진단 완료" (28px bold, teal) */}
            <h2 className="pc-diag-done-title">진단 완료</h2>
            <p className="pc-diag-done-sub">진단 결과가 제출되었습니다</p>
            <p className="pc-diag-done-detail">입력하신 진단 내용이 정상적으로 제출되었습니다.</p>
            {/* Figma: button rounded-[8px], "진단 홈으로 가기" */}
            <button type="button" className="pc-diag-done-close" onClick={onClose}>
                진단 홈으로 가기
            </button>
        </div>
    );
}
