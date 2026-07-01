import './ReportDone.css';

const ReportDone = ({ onMyReports, onOthers }) => {
    return (
        <div className="rdone-container">
            <div className="rdone-content">
                <div className="rdone-icon-wrapper">
                    <div className="rdone-layered-icon">
                        <img src="/done.svg" alt="done background" className="rdone-icon-bg" />
                        <img src="/checkpink.svg" alt="checkmark" className="rdone-icon-check" />
                    </div>
                </div>

                <div className="rdone-text-section">
                    <h1 className="rdone-title">제보 제출을<br />완료 하였습니다</h1>
                </div>

                <div className="rdone-button-group">
                    <button className="rdone-btn-primary" onClick={onMyReports}>나의 제보 보기</button>
                    <button className="rdone-btn-secondary" onClick={onOthers}>다른 제보 보기</button>
                </div>
            </div>
        </div>
    );
};

export default ReportDone;
