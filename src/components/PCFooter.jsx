import './PCFooter.css';

/* PC 공용 다크 푸터 — Figma 302:2652(홈, h216) / 302:3536(로그인, h236)
   로고 텍스트는 Figma상 "PDDP"이나 확정 규칙(WDC 유지)에 따라 WDC 사용.
   tall: 로그인 페이지 변형 (하단 패딩 60 → 총 높이 236) */
const PCFooter = ({ tall = false, onFaq }) => (
    <footer className={`pcfooter${tall ? ' tall' : ''}`}>
        <div className="pcfooter-inner">
            <div className="pcfooter-left">
                <div className="pcfooter-brand">WDC</div>
                <div className="pcfooter-lines">
                    <span>이메일 &nbsp;|&nbsp; support@busan-design.kr</span>
                    <span>전화 &nbsp;|&nbsp; 051-XXX-XXXX</span>
                    <span>운영시간 &nbsp;|&nbsp; 평일 09:00 ~ 18:00</span>
                </div>
                <div className="pcfooter-copy">© 2025 Busan Public Design Platform. All rights reserved.</div>
            </div>
            <div className="pcfooter-right">
                <div className="pcfooter-links"><a>이용약관</a><span>·</span><a>개인정보처리방침</a><span>·</span><a>문의하기</a></div>
                <button className="pcfooter-faq" onClick={onFaq}>
                    자주 묻는 질문(FAQ)
                    <img src="/figma-assets/icons/footer_arrow.png" alt="" width={20} height={20} />
                </button>
            </div>
        </div>
    </footer>
);

export default PCFooter;
