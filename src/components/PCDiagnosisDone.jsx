import UserPCLayout from './UserPCLayout';
import CheckDone from './CheckDone';

// Figma 941:12749 — PC 진단완료. CheckDone 재사용 (#23BDBB teal 테마)
export default function PCDiagnosisDone({ onNavigate }) {
    return (
        <UserPCLayout currentView="pcDiagnosisDone" onNavigate={onNavigate}>
            <CheckDone
                type="diagnosis"
                color="#23BDBB"
                onGoHome={() => onNavigate?.('home')}
            />
        </UserPCLayout>
    );
}
