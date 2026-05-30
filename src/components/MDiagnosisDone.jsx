import CheckDone from './CheckDone';

// Figma 22:7205 — 일반 진단 완료. CheckDone을 teal 테마(#23BDBB)로 재사용.
export default function MDiagnosisDone({ onNavigate }) {
    return (
        <CheckDone
            type="diagnosis"
            color="#23BDBB"
            onGoHome={() => onNavigate?.('mDiagnosisList')}
        />
    );
}
