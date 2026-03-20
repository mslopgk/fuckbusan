/* ProposalDone.jsx */
import React from 'react';
import './ProposalDone.css';

const ProposalDone = ({ onMyProposals, onOthers }) => {
    return (
        <div className="pdone-container">
            <div className="pdone-content">
                <div className="pdone-icon-wrapper">
                    <div className="pdone-layered-icon">
                        <img src="/done.svg" alt="done background" className="pdone-icon-bg" />
                        <img src="/checkgreen.svg" alt="checkmark" className="pdone-icon-check" />
                    </div>
                </div>

                <div className="pdone-text-section">
                    <h1 className="pdone-title">제안 제출을<br />완료 하였습니다</h1>
                </div>

                <div className="pdone-button-group">
                    <button className="pdone-btn-primary" onClick={onMyProposals}>나의 제안 보기</button>
                    <button className="pdone-btn-secondary" onClick={onOthers}>다른 제안 보기</button>
                </div>
            </div>
        </div>
    );
};

export default ProposalDone;
