import React, { useEffect } from 'react';
import { formatPhone, PHONE_RE } from '../utils/phoneAuth';

/* 휴대폰번호 입력 블록 (회원가입/아이디·비번찾기 공용)
   K19: SMS(OTP) 본인인증 제거. 전화번호 입력칸과 형식검증(하이픈/자릿수)은 그대로 유지.
   번호 형식이 올바르면 부모의 verified 를 자동으로 true 로 세팅해,
   기존 제출 게이트(`... && phoneVerified` / `!verified`)가 번호만 정상 입력하면 통과되도록 한다.
   props 시그니처는 호출부 호환을 위해 유지 (showOtpBeforeSend 는 이제 무의미하므로 무시). */

const PhoneVerify = ({ phone, setPhone, verified, setVerified, required = false, label = '휴대폰번호', showOtpBeforeSend = false }) => { // eslint-disable-line no-unused-vars
    const ok = PHONE_RE.test(phone);

    // 번호 형식이 유효하면 자동 인증 통과, 아니면 해제.
    useEffect(() => {
        setVerified(ok);
    }, [ok, setVerified]);

    const showErr = phone.length > 0 && !ok;

    return (
        <div className="pcauth-field">
            <label className="pcauth-label">{label}{required && <span className="req">*</span>}</label>
            <div className="pcauth-row">
                <input className="pcauth-input" placeholder="010-1234-5678" inputMode="numeric"
                    value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
            </div>
            {showErr && <div className="pcauth-helper err">올바른 휴대폰번호를 입력해주세요. (예: 010-1234-5678)</div>}
        </div>
    );
};

export default PhoneVerify;
