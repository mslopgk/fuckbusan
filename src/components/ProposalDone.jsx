/* ProposalDone.jsx */
import React from 'react';
import './ProposalDone.css';

const ProposalDone = ({ onMyProposals, onOthers }) => {
    return (
        <div className="proposal-done-container">
            <div className="pd-content">
                <div className="pd-icon-wrapper">
                    <div className="pd-layered-icon">
                        <img src="/done.svg" alt="done background" className="pd-icon-bg" />
                        <img src="/checkgreen.svg" alt="checkmark" className="pd-icon-check" />
                    </div>
                </div>

                <div className="pd-text-section">
                    <h1 className="pd-title">제안 제출을<br />완료 하였습니다</h1>
                </div>

                <div className="pd-button-group">
                    <button className="pd-btn-primary" onClick={onMyProposals}>나의 제안 보기</button>
                    <button className="pd-btn-secondary" onClick={onOthers}>다른 제안 보기</button>
                </div>
            </div>
        </div>
    );
};

export default ProposalDone;
