import CheckDone from './CheckDone';
import './MDiagnosisDone.css';

// Figma 302:20369 — 일반 진단 완료. 상단 back + 닫기(gray)/홈으로 이동(teal).
export default function MDiagnosisDone({ onNavigate }) {
    return (
        <div className="m-diagdone-wrap" style={{ position: 'relative' }}>
            {/* Figma Frame 6 — back 아이콘 (16,24) */}
            <button
                type="button"
                aria-label="뒤로"
                onClick={() => onNavigate?.('mDiagnosisMap')}
                style={{
                    position: 'absolute',
                    top: 24,
                    left: 16,
                    zIndex: 2,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'inline-flex',
                }}
            >
                <img src="/figma-assets/mobile-diagnosis/arrow_back.png" width="24" height="24" alt="" />
            </button>
            <CheckDone
                type="diagnosis"
                color="#23BDBB"
                onGoHome={() => onNavigate?.('home')}
                onClose={() => onNavigate?.('mDiagnosisList')}
            />
        </div>
    );
}
