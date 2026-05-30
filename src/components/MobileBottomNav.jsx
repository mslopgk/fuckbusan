import { useState } from 'react';
import './MobileBottomNav.css';

const ITEMS = [
    { key: 'home',          label: '홈',        activeColor: '#5B2EAB' },
    { key: 'survey',        label: '설문',       activeColor: '#5B2EAB' },
    { key: 'reportPropose', label: '제보/제안',  activeColor: '#5B2EAB' },
    { key: 'diagnosis',     label: '진단',       activeColor: '#23bdbb' },
    { key: 'activity',      label: '나의 활동',  activeColor: '#5B2EAB' },
];

const SURVEY_VIEWS    = ['mSurveyList', 'mSurveyDetail1', 'mSurveyDetail2', 'mSurveyJoin', 'mSurveyDone', 'mSurveyResults', 'survey', 'surveyDone'];
const REPORT_VIEWS    = ['mReportList', 'mReportMap', 'mReportForm', 'mReportDetail', 'mReportDone', 'reportList', 'reportForm', 'reportDetail', 'reportDone', 'report'];
const PROPOSE_VIEWS   = ['mProposalList', 'mProposalMap', 'mProposalForm', 'mProposalDetail', 'mProposalDone', 'proposalList', 'proposalForm', 'proposalDetail', 'proposalDone'];
const DIAG_VIEWS      = ['mDiagnosisList', 'mDiagnosisForm', 'mDiagnosisResult', 'mDiagnosisDone', 'mDiagnosisDetail', 'diagnosis', 'diagnosisStep1', 'bigCategory', 'checkList', 'satisfaction', 'review', 'checkDone', 'diagnosisResult', 'diagnosisList', 'diagnosisEdit', 'expertDiagnosisResult'];
const ACTIVITY_VIEWS  = ['myPage', 'myActivity', 'myActivityHub', 'myProposals', 'myReportList', 'myReports', 'mMyReportDetail', 'mMyReportEdit'];

const NAV_ICONS = {
    home:          { src: '/figma-assets/icons/nav_home.svg',             activeSrc: '/figma-assets/icons/nav_home_active.svg' },
    survey:        { src: '/figma-assets/icons/nav_survey.svg',            activeSrc: '/figma-assets/icons/nav_survey_active.svg' },
    reportPropose: { src: '/figma-assets/icons/nav_campaign_inactive.svg', activeSrc: '/figma-assets/icons/nav_campaign_active.svg' },
    diagnosis:     { src: '/figma-assets/icons/nav_barchart_inactive.svg', activeSrc: '/figma-assets/icons/nav_barchart_active.svg' },
    activity:      { src: '/figma-assets/icons/nav_activity.svg',          activeSrc: '/figma-assets/icons/nav_activity_active.svg' },
};

function NavIcon({ name, active }) {
    const cfg = NAV_ICONS[name];
    if (!cfg) return null;
    const src = (active && cfg.activeSrc) ? cfg.activeSrc : cfg.src;
    return <img src={src} alt="" width={22} height={22} style={{ display: 'block', objectFit: 'contain' }} />;
}

export default function MobileBottomNav({ currentView, onNavigate }) {
    const [chooserOpen, setChooserOpen] = useState(false);

    const isActive = (key) => {
        if (key === 'home')          return currentView === 'home';
        if (key === 'survey')        return SURVEY_VIEWS.includes(currentView);
        if (key === 'reportPropose') return REPORT_VIEWS.includes(currentView) || PROPOSE_VIEWS.includes(currentView);
        if (key === 'diagnosis')     return DIAG_VIEWS.includes(currentView);
        if (key === 'activity')      return ACTIVITY_VIEWS.includes(currentView);
        return false;
    };

    const handleClick = (key) => {
        if (key === 'home')               onNavigate?.('home');
        else if (key === 'survey')        onNavigate?.('mSurveyList');
        else if (key === 'reportPropose') setChooserOpen(true);
        else if (key === 'diagnosis')     onNavigate?.('mDiagnosisList');
        else if (key === 'activity')      onNavigate?.('myActivityHub');
    };

    const handleChoose = (target) => {
        setChooserOpen(false);
        onNavigate?.(target);
    };

    return (
        <>
            <nav className="m-bottom-nav">
                {ITEMS.map((it) => {
                    const active = isActive(it.key);
                    const style = active ? { color: it.activeColor } : undefined;
                    return (
                        <button
                            key={it.key}
                            className={`m-bnav-item ${active ? 'active' : ''}`}
                            onClick={() => handleClick(it.key)}
                            type="button"
                            style={style}
                        >
                            <span className="m-bnav-icon" aria-hidden="true">
                                <NavIcon name={it.key} active={active} />
                            </span>
                            <span className="m-bnav-label">{it.label}</span>
                        </button>
                    );
                })}
            </nav>

            {chooserOpen && (
                <div
                    className="m-bnav-chooser-backdrop"
                    onClick={() => setChooserOpen(false)}
                >
                    <div
                        className="m-bnav-chooser-sheet"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="m-bnav-chooser-grip" />
                        <h3 className="m-bnav-chooser-title">어디로 이동할까요?</h3>
                        <div className="m-bnav-chooser-row">
                            <button
                                type="button"
                                className="m-bnav-chooser-card"
                                onClick={() => handleChoose('mReportMap')}
                            >
                                <span className="m-bnav-chooser-icon" aria-hidden="true">
                                    <img src="/figma-assets/icons/nav_campaign_inactive.svg" alt="" width={24} height={24} style={{ display: 'block' }} />
                                </span>
                                <strong>제보하기</strong>
                                <span className="m-bnav-chooser-desc">우리 동네 불편사항을<br/>알려주세요</span>
                            </button>
                            <button
                                type="button"
                                className="m-bnav-chooser-card"
                                onClick={() => handleChoose('mProposalMap')}
                            >
                                <span className="m-bnav-chooser-icon" aria-hidden="true">
                                    <img src="/figma-assets/icons/nav_barchart_inactive.svg" alt="" width={24} height={24} style={{ display: 'block' }} />
                                </span>
                                <strong>제안하기</strong>
                                <span className="m-bnav-chooser-desc">새로운 정책 아이디어를<br/>제안해주세요</span>
                            </button>
                        </div>
                        <button
                            type="button"
                            className="m-bnav-chooser-cancel"
                            onClick={() => setChooserOpen(false)}
                        >취소</button>
                    </div>
                </div>
            )}
        </>
    );
}
