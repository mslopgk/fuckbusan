import './UserPCLayout.css';
import PCHeader from './PCHeader';

/* PC 공용 셸 — 헤더는 홈과 동일한 PCHeader를 사용해 전 페이지 네비바 통일 */
export default function UserPCLayout({ children, currentView, onNavigate }) {
    return (
        <div className="user-pc-shell">
            <PCHeader currentView={currentView} onNavigate={onNavigate} />
            <main className="user-pc-main">
                {children}
            </main>
        </div>
    );
}
