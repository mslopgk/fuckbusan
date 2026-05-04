import CheckDone from './CheckDone';

// Figma 941:12733 — 일반 진단 완료. CheckDone을 그린 테마(#06AB69)로 재사용.
export default function MDiagnosisDone({ onNavigate }) {
    return (
        <CheckDone
            type="diagnosis"
            color="#06AB69"
            onGoHome={() => onNavigate?.('home')}
        />
    );
}
