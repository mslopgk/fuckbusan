import CheckDone from './CheckDone';

// Figma 22:7205 — 시민 진단 완료. CheckDone을 teal 테마(#23BDBB)로 재사용.
export default function MDiagnosisDone({ onNavigate }) {
    return (
        <CheckDone
            type="diagnosis"
            color="#23BDBB"
            btnLabel="진단 홈으로 가기"
            onGoHome={() => onNavigate?.('mDiagnosisList')}
        />
    );
}
