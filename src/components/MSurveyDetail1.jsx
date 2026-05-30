import { useState, useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MSurveyDetail.css';
import { API_URL } from '../utils/api';
import { copyToClipboard } from '../utils/clipboard';

const TERMS_TEXT = `[부산 공공디자인 진단 플랫폼 이용약관]

제1조 (목적)
본 약관은 부산 공공디자인 진단 플랫폼(이하 "플랫폼")이 제공하는 시민참여형 공공디자인 진단·제보·제안·설문 서비스 이용에 관한 사항을 규정함을 목적으로 합니다.

제2조 (서비스의 내용)
1. 시민이 참여하는 공공디자인 진단
2. 거리/시설의 불편사항 제보 및 개선 제안
3. 공공디자인 관련 설문 참여
4. 가상시민 페르소나 기반 공공정책 인사이트 제공

제3조 (이용자의 의무)
- 타인의 명예를 훼손하거나 권리를 침해하는 내용을 게시하지 않습니다.
- 허위 정보 또는 욕설·차별·혐오 표현을 사용하지 않습니다.
- 본 서비스를 영리·상업적 목적으로 이용하지 않습니다.

제4조 (게시물의 관리)
운영자는 신고 또는 자체 모니터링을 통해 약관에 위배되는 게시물을 사전 통지 없이 비공개 처리할 수 있습니다.

제5조 (책임의 제한)
플랫폼은 시민 의견 수렴을 위한 도구이며, 게시된 내용은 작성자 본인의 책임입니다.

본 약관은 2026년 1월 1일부터 시행됩니다.`;

const PRIVACY_TEXT = `[개인정보처리방침]

1. 수집하는 개인정보 항목
- 필수: 이름, 이메일, 휴대전화번호, 비밀번호, 닉네임
- 선택: 거주 지역(구 단위), 연령대, 성별
- 자동수집: 접속 IP, 쿠키, 서비스 이용기록

2. 개인정보의 수집·이용 목적
- 회원 식별 및 부정 이용 방지
- 공공디자인 진단 결과 집계 및 통계
- 설문 응답 분석 및 정책 자료 활용

3. 보유 및 이용기간
- 회원 탈퇴 시까지 보관, 탈퇴 후 즉시 파기 (관계 법령에 따라 일정 기간 보관할 수 있음)
- 설문 응답은 통계 목적으로 비식별화 후 영구 보관 가능

4. 제3자 제공
원칙적으로 외부에 제공하지 않습니다. 다만 법령에 근거한 경우 예외로 합니다.

5. 정보주체의 권리
이용자는 언제든 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.

6. 개인정보 보호책임자
부산광역시 공공디자인 진단 플랫폼 운영팀
이메일: privacy@busan-pddp.kr

본 방침은 2026년 1월 1일부터 시행됩니다.`;

export default function MSurveyDetail1({ onNavigate, survey }) {
    const [fullSurvey, setFullSurvey] = useState(null);
    const [copied, setCopied] = useState(false);
    const [policyOpen, setPolicyOpen] = useState(null); // 'terms' | 'privacy' | null

    useEffect(() => {
        if (!policyOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setPolicyOpen(null); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [policyOpen]);

    useEffect(() => {
        const id = survey?.id;
        if (!id) return;
        fetch(`${API_URL}/api/surveys/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d) setFullSurvey(d); })
            .catch(() => {});
    }, [survey?.id]);

    const enriched = { ...(survey || {}), ...(fullSurvey || {}) };

    // Format period to show ~end_date (Figma: "~2026-05-30")
    const formatPeriodEnd = (period) => {
        if (!period) return '';
        const parts = period.split('~');
        return parts.length >= 2 ? `~${parts[1].trim()}` : period;
    };

    const data = {
        title: enriched.title || '',
        period: formatPeriodEnd(enriched.period || enriched.end_date || ''),
        minutes: enriched.minutes || 10,
        intro: enriched.description || enriched.intro || '',
    };

    return (
        <div className="m-survey-detail-page">
            <div className="m-survey-hero">
                <div className="m-hero-topbar">
                    <button className="m-hero-back" onClick={() => onNavigate && onNavigate('mSurveyList')} aria-label="뒤로">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button
                        className="m-hero-copy"
                        onClick={async () => {
                            const lines = [data.title];
                            if (data.period) lines.push(`조사기간: ${data.period}`);
                            lines.push(`응답시간: ${data.minutes}분`);
                            if (data.intro) lines.push(`내용: ${data.intro}`);
                            const text = lines.join('\n');
                            await copyToClipboard(text);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                    >
                        {copied
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        }
                        <span>{copied ? '복사됨' : '복사하기'}</span>
                    </button>
                </div>
                <h1 className="m-hero-title">{data.title}</h1>
            </div>

            <div className="m-hero-card m-hero-card-overlap">
                <div className="m-hero-row"><span className="m-hero-key">조사명</span><span className="m-hero-val">{data.title}</span></div>
                <div className="m-hero-row"><span className="m-hero-key">조사기간</span><span className="m-hero-val">{data.period}</span></div>
                <div className="m-hero-row"><span className="m-hero-key">응답시간</span><span className="m-hero-val">{data.minutes}분</span></div>
                <div className="m-hero-row"><span className="m-hero-key">내용</span><span className="m-hero-val">{data.intro}</span></div>
            </div>

            <div className="m-survey-body">
                <p className="m-body-lead">본 설문은 시민 여러분의 의견을 수렴하여 공공서비스 개선 및 정책 수립에 반영하기 위한 조사입니다.</p>

                <ul className="m-body-bullets">
                    <li>설문 조사는 응답을 중단하더라도, 언제든 이어서 참여할 수 있습니다.</li>
                    <li>응답해주신 내용은 통계 분석 목적으로만 활용되며, 관련 법령에 따라 안전하게 관리됩니다</li>
                </ul>

                <p className="m-body-terms">
                    <button
                        type="button"
                        className="m-policy-link"
                        onClick={() => setPolicyOpen('terms')}
                    >이용약관</button> 및 <button
                        type="button"
                        className="m-policy-link"
                        onClick={() => setPolicyOpen('privacy')}
                    >개인정보처리방침</button>
                </p>

                <button className="m-survey-cta" onClick={() => onNavigate && onNavigate('mSurveyDetail2', fullSurvey || survey)}>참여하기</button>
            </div>

            {policyOpen && (
                <div
                    className="m-policy-modal"
                    role="dialog"
                    aria-label={policyOpen === 'terms' ? '이용약관' : '개인정보처리방침'}
                    onClick={() => setPolicyOpen(null)}
                >
                    <div className="m-policy-sheet" onClick={(e) => e.stopPropagation()}>
                        <header className="m-policy-header">
                            <h2 className="m-policy-title">
                                {policyOpen === 'terms' ? '이용약관' : '개인정보처리방침'}
                            </h2>
                            <button
                                type="button"
                                className="m-policy-close"
                                onClick={() => setPolicyOpen(null)}
                                aria-label="닫기"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </header>
                        <pre className="m-policy-body">{policyOpen === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}</pre>
                    </div>
                </div>
            )}

            <MobileBottomNav currentView="mSurveyDetail1" onNavigate={onNavigate} />
        </div>
    );
}
