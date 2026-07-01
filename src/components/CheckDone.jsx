import './CheckDone.css';

const CheckDone = ({ onGoHome, onClose, color = '#E6235A', type = 'diagnosis', btnLabel: btnLabelProp }) => {
    const isExpert = color === '#542AA3';

    let title, subtitle, description, btnLabel;

    if (type === 'survey') {
        title = "설문 제출 완료";
        subtitle = "참여해 주셔서 감사합니다";
        btnLabel = "홈으로 이동";
        description = (
            <>
                귀하의 의견은 지역 개선을 위한 자료로 활용됩니다.<br />
                더 나은 동네를 만들기 위해 지속적으로 노력하겠습니다.
            </>
        );
    } else {
        // Default diagnosis
        title = isExpert ? '전문가 진단 완료' : '일반 진단 완료';
        subtitle = '진단 결과가 제출되었습니다';
        btnLabel = '홈으로 이동';
        description = '입력하신 진단 내용이 정상적으로 제출되었습니다.';
    }

    return (
        <div className="check-done-container">
            <div className="check-done-content">
                <div className="check-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="20" fill={color} />
                        <path d="M11 21L18 28L29 15" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h1 className="done-title" style={{ color: color }}>{title}</h1>
                <h2 className="done-subtitle">{subtitle}</h2>
                <p className="done-description">
                    {description}
                </p>
            </div>

            <div className={`check-done-footer${onClose ? ' check-done-footer--two' : ''}`}>
                {onClose && (
                    <button className="btn-close" onClick={onClose}>닫기</button>
                )}
                <button className="btn-home" onClick={onGoHome} style={{ backgroundColor: color, color: '#fff', border: 'none' }}>
                    {btnLabelProp || btnLabel}
                </button>
            </div>
        </div>
    );
};

export default CheckDone;
