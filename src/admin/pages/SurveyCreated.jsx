import { Check } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import '../styles/dashboard_new.css';
import '../styles/admin_layout.css';
import '../styles/survey_editor.css';

export default function SurveyCreated({ onNavigate }) {
    return (
        <AdminLayout onNavigate={onNavigate} currentView="surveyCreated">
            <div className="survey-created-wrap">
                <div className="created-check">
                    <Check size={48} strokeWidth={3} />
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
