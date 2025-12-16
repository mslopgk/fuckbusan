import React from 'react';
import './CheckDone.css'; // Reuse styles

const SignupDone = ({ onLogin }) => {
    return (
        <div className="check-done-container">
            <div className="check-done-content">
                <div className="check-icon-wrapper">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="30" cy="30" r="30" fill="#E6235A" />
                        <path d="M17 31L26 40L43 23" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h1 className="done-title" style={{ color: '#E6235A' }}>회원가입 완료</h1>
                <h2 className="done-subtitle">환영합니다!</h2>
                <p className="done-description">
                    회원가입이 성공적으로 완료되었습니다.<br />
                    이제 로그인을 진행해 주세요.
                </p>
            </div>

            <div className="check-done-footer">
                <button
                    className="btn-home"
                    onClick={onLogin}
                    style={{ backgroundColor: '#E6235A', color: '#fff', border: 'none' }}
                >
                    로그인 하기
                </button>
            </div>
        </div>
    );
};

export default SignupDone;
