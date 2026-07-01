import { useState, useEffect } from 'react';
import '../styles/admin_layout.css';

const MENU_TREE = [
    {
        key: 'member',
        label: '회원 관리',
        children: [
            { key: 'citizen', label: '시민', view: 'adminDashboardNew' },
            { key: 'expert', label: '전문가', view: 'expertManagement' },
            { key: 'admin', label: '관리자', view: 'adminUserList' },
        ],
    },
    {
        key: 'reportSuggest',
        label: '제안/제보 관리',
        children: [
            { key: 'reports', label: '제보', view: 'reportManagement' },
            { key: 'proposals', label: '제안', view: 'proposalManagement' },
        ],
    },
    {
        key: 'diagnosis',
        label: '진단관리',
        children: [
            { key: 'diagList', label: '진단 목록', view: 'adminDiagnosis' },
        ],
    },
    {
        key: 'survey',
        label: '설문관리',
        children: [
            { key: 'surveyList', label: '설문목록', view: 'surveyManagement' },
            { key: 'surveyChatAnalytics', label: 'AI설문 분석', view: 'surveyChatAnalytics' },
        ],
    },
    {
        key: 'publicData',
        label: '공공데이터관리',
        children: [
            { key: 'publicDataList', label: '공공데이터목록', view: 'adminPublicData' },
        ],
    },
    {
        key: 'aiCitizen',
        label: 'AI 가상시민',
        children: [
            { key: 'citizenData', label: '가상시민데이터 관리', view: 'adminCitizenData' },
            { key: 'citizenPersonas', label: '가상시민 생성 관리', view: 'adminCitizenPersonas' },
        ],
    },
    {
        key: 'notice',
        label: '공지사항',
        children: [
            { key: 'noticeList', label: '공지사항목록', view: 'adminNotices' },
        ],
    },
    {
        key: 'promo',
        label: '홍보',
        children: [
            { key: 'promoList', label: '홍보목록', view: 'adminPromos' },
        ],
    },
];

// Map a "view" string back to which menu key + child should be highlighted
const VIEW_TO_PATH = {
    adminDashboardNew: ['member', 'citizen'],
    memberEdit: ['member', 'citizen'],
    expertManagement: ['member', 'expert'],
    expertEdit: ['member', 'expert'],
    adminUserList: ['member', 'admin'],
    reportManagement: ['reportSuggest', 'reports'],
    adminReportDetail: ['reportSuggest', 'reports'],
    proposalManagement: ['reportSuggest', 'proposals'],
    proposalEdit: ['reportSuggest', 'proposals'],
    surveyManagement: ['survey', 'surveyList'],
    surveyChatAnalytics: ['survey', 'surveyChatAnalytics'],
    surveyEditor: ['survey', 'surveyList'],
    surveyCreated: ['survey', 'surveyList'],
    surveyResults: ['survey', 'surveyList'],
    adminProposalDetail: ['reportSuggest', 'proposals'],
    adminRAG: ['aiCitizen', 'citizenData'],
    adminCitizenData: ['aiCitizen', 'citizenData'],
    adminCitizenPersonas: ['aiCitizen', 'citizenPersonas'],
    adminDiagnosis: ['diagnosis', 'diagList'],
    adminPublicData: ['publicData', 'publicDataList'],
    adminNotices: ['notice', 'noticeList'],
    adminPromos: ['promo', 'promoList'],
};

export default function AdminSidebar({ onNavigate, currentView }) {
    const [openKeys, setOpenKeys] = useState(() => {
        const path = VIEW_TO_PATH[currentView];
        return new Set([path ? path[0] : 'member']);
    });

    useEffect(() => {
        const path = VIEW_TO_PATH[currentView];
        if (!path) return;
        setOpenKeys((prev) => {
            if (prev.has(path[0])) return prev;
            const next = new Set(prev);
            next.add(path[0]);
            return next;
        });
    }, [currentView]);

    const activeChildKey = (() => {
        const path = VIEW_TO_PATH[currentView];
        return path ? path[1] : null;
    })();

    const handleChildClick = (child) => {
        if (child.view === 'comingSoon') return;
        if (onNavigate) onNavigate(child.view);
    };

    const isMenuDisabled = (menu) =>
        menu.children.length === 0 || menu.children.every((c) => c.view === 'comingSoon');

    const toggleKey = (key, hasChildren, disabled) => {
        if (!hasChildren || disabled) return;
        setOpenKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <aside className="admin-sidebar-new">
            <div
                className="sidebar-logo-new"
                style={{ cursor: 'pointer' }}
                onClick={() => onNavigate && onNavigate('adminMain')}
            >
                <img src="/WDC.svg" alt="WDC" style={{ height: '32px', display: 'block' }} />
            </div>

            <nav className="sidebar-menu-new">
                {MENU_TREE.map((menu) => {
                    const isOpen = openKeys.has(menu.key);
                    const hasChildren = menu.children.length > 0;
                    const disabled = isMenuDisabled(menu);
                    return (
                        <div key={menu.key}>
                            <div
                                className={`menu-item-new ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                onClick={() => toggleKey(menu.key, hasChildren, disabled)}
                                style={disabled ? { color: '#6b7280', cursor: 'not-allowed', opacity: 0.5 } : undefined}
                            >
                                <span>{menu.label}</span>
                                {hasChildren && !disabled && (
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
                                    >
                                        <polyline points="18 15 12 9 6 15"></polyline>
                                    </svg>
                                )}
                            </div>
                            {isOpen && hasChildren && (
                                <div className="submenu-list-new">
                                    {menu.children.map((child) => {
                                        const childDisabled = child.view === 'comingSoon';
                                        return (
                                            <div
                                                key={child.key}
                                                className={`submenu-item-new ${activeChildKey === child.key ? 'active' : ''} ${childDisabled ? 'disabled' : ''}`}
                                                onClick={() => handleChildClick(child)}
                                                style={childDisabled ? { color: '#6b7280', cursor: 'not-allowed', opacity: 0.5 } : undefined}
                                            >
                                                {child.label}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
