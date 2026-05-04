import { useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import './PCDetailShared.css';

const SAMPLE_COMMENTS = [
    { author: '동래주민01', date: '20분 전', body: '저도 동의합니다.' },
    { author: '동래주민01', date: '20분 전', body: '저도 동의합니다.' },
];

export default function PCReportDetail({ onNavigate, report }) {
    const DEFAULT_BODY = '안녕하세요. 부산 해운대구에 거주하는 학생입니다.\n\n현재 공유 전기자전거 운영 과정에서 시간대 사용량 차이로 인해 대여소 간 재고 불균형이 심각하게 발생되고 있습니다.\n\n특히 출퇴근 시간 또는 등하교 시간에:\n- 시간대 보유, 보지 작전 적사 차이가 그러나 일부 자전거는 약 30%의 일대 부족\n\n해당 문제를 막기 위해 아래의 의견을 드립니다:\n1. 실시간 자전거 재고 모니터링 시스템 마련\n2. 실시간 자전거 재공의 재고 적사 가이즈\n3. 절대 시민이 자전거 운영 적사 가지원\n\n본 제보가 채택돼서 부산 해운대구가 보다 편리하고 한자한 도시가 되었으면 합니다.';

    const data = {
        title: report?.title || '전기자전거 재고 불균형 해결 제안',
        author_id: report?.region || report?.author_id || '해운대구',
        date: report?.date || '2026-03-22',
        likes: report?.votes || report?.likes || 213,
        category: report?.category || '공공시설물',
        body: report?.body || DEFAULT_BODY,
        lat: report?.lat || 35.1631,
        lng: report?.lng || 129.1638,
    };

    const [comment, setComment] = useState('');
    const [liked, setLiked] = useState(false);

    return (
        <UserPCLayout currentView="pcReportDetail" onNavigate={onNavigate}>
            <div className="pc-detail-page">
                <div className="pc-detail-inner">
                    <div className="pc-detail-tags">
                        <span className="pc-status-tag pc-status-public">제보/제안</span>
                        <span className="pc-status-tag pc-status-cat">{data.category}</span>
                        <span style={{ marginLeft: 'auto' }}>
                            <span className="pc-status-tag pc-status-pending">처리중</span>
                        </span>
                    </div>
                    <h2 className="pc-detail-title">{data.title}</h2>
                    <div className="pc-detail-meta">
                        <span>{data.date}</span>
                        <span>·</span>
                        <span>{data.author_id}</span>
                        <span>·</span>
                        <span>❤️ {data.likes}</span>
                    </div>

                    <div className="pc-detail-image" />

                    <div className="pc-detail-map">
                        <PCMapCanvas
                            pins={[{ id: 'this', lat: data.lat, lng: data.lng, color: '#E6235A', title: data.title }]}
                            accentColor="#E6235A"
                        />
                    </div>

                    <div className="pc-detail-body-wrap">
                        <div className="pc-detail-body">
                            {data.body.split('\n').map((p, i) => p.trim().startsWith('-') ? (
                                <li key={i}>{p.replace(/^-\s*/, '')}</li>
                            ) : (
                                <p key={i}>{p}</p>
                            ))}
                        </div>
                        <button
                            className={`pc-vote-float ${liked ? 'on' : ''}`}
                            onClick={() => setLiked((v) => !v)}
                        >
                            <span className="pc-vote-float-icon">❤</span>
                            <span className="pc-vote-float-label">{liked ? '응원완료' : '응원해'}</span>
                        </button>
                    </div>

                    <div className="pc-comment-section">
                        <div className="pc-comment-input-row">
                            <input
                                type="text"
                                placeholder="댓글을 입력해주세요"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="pc-comment-input"
                            />
                            <button className="pc-comment-send" onClick={() => setComment('')}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                            </button>
                        </div>

                        <ul className="pc-comment-list">
                            {SAMPLE_COMMENTS.map((c, i) => (
                                <li key={i}>
                                    <div className="pc-comment-meta">
                                        <strong>{c.author}</strong>
                                        <span>{c.date}</span>
                                    </div>
                                    <p>{c.body}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </UserPCLayout>
    );
}
