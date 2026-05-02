import { useState } from 'react';
import UserPCLayout from './UserPCLayout';
import PCMapCanvas from './PCMapCanvas';
import './PCDetailShared.css';

const SAMPLE_COMMENTS = [
    { author: '동래주민01', date: '20분 전', body: '저도 동의합니다.' },
    { author: '동래주민01', date: '20분 전', body: '저도 동의합니다.' },
];

export default function PCProposeDetail({ onNavigate, proposal }) {
    const DEFAULT_BODY = '안녕하세요. 부산 해운대구에 거주하는 학생입니다.\n\n현재 공유 전기자전거 운영 과정에서 시간대 사용량 차이로 인해 대여소 간 재고 불균형이 심각하게 발생되고 있습니다.\n\n특히 아침 출퇴근 시간 또는 등하교 시간에는:\n- 시간대 보유, 보지 작전 적사 차이가 그러나 일부 자전거는 약 30%의 일대 부족\n\n해당 문제를 막기 위해 아래의 의견을 드립니다:\n1. 실시간 자전거 재고 모니터링 시스템 마련\n2. 실시간 자전거 재공의 재고 적사 가이즈\n3. 절대 시민이 자전거 운영 적사 가지원\n\n본 제안이 채택돼서 부산이 보다 편리하고 한자한 도시가 되었으면 합니다.';

    const data = {
        title: proposal?.title || '전기자전거 재고 불균형 해결 제안',
        author_id: proposal?.region || proposal?.author_id || '해운대구',
        date: proposal?.date || '2026-03-22',
        likes: proposal?.votes || proposal?.likes || 213,
        category: proposal?.category || '교통',
        categoryKey: proposal?.categoryKey || 'traffic',
        body: proposal?.body || DEFAULT_BODY,
        lat: proposal?.lat || 35.1631,
        lng: proposal?.lng || 129.1638,
    };

    const [voteOpen, setVoteOpen] = useState(false);
    const [voteResult, setVoteResult] = useState(null);
    const [comment, setComment] = useState('');

    const submitVote = (choice) => {
        setVoteResult(choice);
        setVoteOpen(false);
    };

    return (
        <UserPCLayout currentView="pcProposeDetail" onNavigate={onNavigate}>
            <div className="pc-detail-page">
                <div className="pc-detail-inner">
                    <div className="pc-detail-tags">
                        <span className={`pc-cat-tag pc-cat-${data.categoryKey}`}>{data.category}</span>
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

                    <div className="pc-detail-body">
                        {data.body.split('\n').map((p, i) => p.trim().startsWith('-') ? (
                            <li key={i}>{p.replace(/^-\s*/, '')}</li>
                        ) : (
                            <p key={i}>{p}</p>
                        ))}
                    </div>

                    <div className="pc-detail-vote-row">
                        <button className="pc-vote-btn" onClick={() => setVoteOpen(true)}>
                            <span className="pc-vote-circle">👍</span>
                            <span>응원하기</span>
                        </button>
                        {voteResult && <span className="pc-vote-result">투표 완료: {voteResult}</span>}
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

                {voteOpen && (
                    <div className="pc-modal-backdrop" onClick={() => setVoteOpen(false)}>
                        <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>이 제안에 응원해주세요</h3>
                            <p className="pc-vote-modal-text">제안에 동의하시나요?<br/>여러분의 의견이 정책 반영에 큰 도움이 됩니다.</p>
                            <div className="pc-vote-options">
                                <button className="pc-vote-option pc-vote-yes" onClick={() => submitVote('찬성')}>👍 찬성</button>
                                <button className="pc-vote-option pc-vote-no" onClick={() => submitVote('반대')}>👎 반대</button>
                            </div>
                            <button className="pc-btn-light" onClick={() => setVoteOpen(false)}>닫기</button>
                        </div>
                    </div>
                )}
            </div>
        </UserPCLayout>
    );
}
