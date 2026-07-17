import './MProposalDone.css';

function DoneIllustration() {
    return (
        <div className="m-prop-done-illus" aria-hidden="true">
            {/* 문서 아이콘 — Figma 302:18637 export */}
            <img
                className="m-prop-done-scroll"
                src="/figma-assets/mobile-propose/done_icon_outer.png"
                alt=""
                width="132"
                height="132"
            />
            {/* 핑크 체크 원 — Figma 302:18639 export, (171,245)-(131,219)=(40,26) */}
            <img
                className="m-prop-done-check"
                src="/figma-assets/mobile-propose/done_icon_inner.png"
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
