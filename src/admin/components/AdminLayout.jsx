import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../styles/admin_layout.css';
// 셸 클래스(admin-dashboard-new/main-new/content-new)가 여기서 렌더되므로 정의 CSS도 여기서 로드 —
// lazy 페이지 단독 진입(F5)에서 dashboard_new.css 미로드로 레이아웃 깨지던 것 방지 (QA 검수)
import '../styles/dashboard_new.css';

export default function AdminLayout({ onNavigate, currentView, children }) {
    return (
        <div className="admin-dashboard-new">
            <AdminSidebar onNavigate={onNavigate} currentView={currentView} />
            <main className="admin-main-new">
                <AdminHeader onNavigate={onNavigate} />
                <div className="admin-content-new">{children}</div>
            </main>
        </div>
    );
}
