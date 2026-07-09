import './PCAuth.css';

/* 회원가입 완료 — Figma 302:3357
   카드 안내 + '로그인 페이지로 이동' 버튼 (자동 로그인 안 함) */
const SignupDone = ({ onLogin }) => {
    return (
        <div className="pcauth">
            <div className="pcauth-card done">
                <h1 className="pcauth-done-title">회원가입 완료</h1>
                <strong className="pcauth-done-lead">회원가입이 완료되었습니다!</strong>
                <p className="pcauth-done-desc">
                    로그인 후 서비스를 이용하실 수 있습니다.<br />
                    로그인 페이지로 이동하시겠습니까?
                </p>
            </div>
            <button className="pcauth-submit" onClick={onLogin}>로그인 페이지로 이동</button>
        </div>
    );
};

export default SignupDone;
