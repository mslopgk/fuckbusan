import { useState, useEffect } from 'react';
import './PCAuth.css';
import './Login.css';

/* 회원가입 완료 — PC: Figma 302:3357 / 모바일: Figma 302:14945 */
const SignupDone = ({ onLogin }) => {
    const [isPC, setIsPC] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

    useEffect(() => {
        const onResize = () => setIsPC(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (isPC) {
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
    }

    return (
        <div className="mauth-done">
            <div className="mauth-done-topbar">
                <button className="back-btn" onClick={onLogin} aria-label="뒤로">
                    <img src="/figma-assets/mobile-auth/arrow_back.png" alt="" />
                </button>
                <div className="mauth-done-title">회원가입 완료</div>
            </div>
            <div className="mauth-done-lead">회원가입이 완료되었습니다!</div>
            <div className="mauth-done-desc">{'로그인 후 서비스를 이용하실 수 있습니다.\n로그인 페이지로 이동하시겠습니까?'}</div>
            <div className="mauth-done-foot">
                <button className="mauth-done-btn lg" onClick={onLogin}>로그인 페이지로 이동</button>
            </div>
        </div>
    );
};

export default SignupDone;
