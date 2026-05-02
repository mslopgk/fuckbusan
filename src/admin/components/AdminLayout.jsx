import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../styles/admin_layout.css';

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
