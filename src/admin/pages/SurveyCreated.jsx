import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/survey_editor.css';

export default function SurveyCreated({ onNavigate }) {
    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyCreated">
            <div className="survey-created-wrap">
                <div className="created-check">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="created-message">설문등록이 완료되었습니다.</div>
                <button
                    className="btn-search-new"
                    style={{ height: 44, padding: '0 32px' }}
                    onClick={() => onNavigate && onNavigate('surveyManagement')}
                >
                    목록으로
                </button>
            </div>
        </AdminLayout>
    );
}
