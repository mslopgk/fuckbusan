import CheckDone from './CheckDone';

// Figma 269:25745 — 일반 진단 완료. 닫기(gray) + 홈으로 이동(teal) 두 버튼.
export default function MDiagnosisDone({ onNavigate }) {
    return (
        <CheckDone
            type="diagnosis"
            color="#23BDBB"
            onGoHome={() => onNavigate?.('mDiagnosisList')}
            onClose={() => onNavigate?.('home')}
        />
    );
}
