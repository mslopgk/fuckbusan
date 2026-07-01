import { useState, useEffect } from 'react';
import UserPCLayout from './UserPCLayout';
import './PCSurveyConsent.css';
import { API_URL } from '../utils/api';

function detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|tablet/.test(ua)) return 'tablet';
    if (/mobile|android|iphone/.test(ua) || window.innerWidth < 1024) return 'mobile';
    return 'pc';
}

export default function PCSurveyConsent({ onNavigate, survey }) {
    const data = survey || { title: '사직구장 일대 보행환경의 현황 조사' };

    const [agree, setAgree] = useState(null);
    const [gender, setGender] = useState(null);
    const [age, setAge] = useState(null);
    const [device, setDevice] = useState(() => detectDevice());
    const [job, setJob] = useState(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [jobOther, setJobOther] = useState('');
    const [deviceOther, setDeviceOther] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return;
                if (d.name) setName(d.name);
                if (d.phone_num) {
                    const digits = d.phone_num.replace(/\D/g, '').slice(0, 11);
                    if (digits.length <= 3) setPhone(digits);
                    else if (digits.length <= 7) setPhone(`${digits.slice(0, 3)}-${digits.slice(3)}`);
                    else setPhone(`${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`);
                }
                if (d.birth_date) {
                    const year = parseInt(String(d.birth_date).slice(0, 4), 10);
                    if (year && !isNaN(year)) {
                        const age = new Date().getFullYear() - year;
                        if (age < 20) setAge('under20');
                        else if (age < 30) setAge('20s');
                        else if (age < 40) setAge('30s');
                        else if (age < 50) setAge('40s');
                        else setAge('50plus');
                    }
                }
            })
            .catch(() => {});
    }, []);

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handlePhoneChange = (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
        let formatted = digits;
        if (digits.length > 7) {
            formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
        } else if (digits.length > 3) {
            formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
        }
        setPhone(formatted);
    };

    const phoneDigits = phone.replace(/\D/g, '');
    const canSubmit =
        agree === 'agree' &&
        gender !== null &&
        age !== null &&
        job !== null &&
        name.trim().length > 0 &&
        !/[^가-힣a-zA-Z\s]/.test(name) &&
        phoneDigits.length >= 10 && phoneDigits.length <= 11;

    const handleSubmit = () => {
        if (onNavigate) onNavigate('pcSurveyJoin', data);
    };

    return (
        <UserPCLayout currentView="pcSurveyConsent" onNavigate={onNavigate}>
            <div className="pc-survey-consent-page">
                <div className="pc-purple-banner">
                    <h1 className="pc-banner-title">{data.title}</h1>
                </div>

                <div className="pc-consent-card">
                    <h3 className="pc-consent-title">개인정보 수집·이용에 관한 안내</h3>

                    <div className="pc-consent-section">
                        <h4>수집항목</h4>
                        <div className="pc-consent-box">
                            <ul>
                                <li>응모자 개인정보 : 성명, 휴대폰번호</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pc-consent-section">
                        <h4>개인정보 수집·이용 동의서</h4>
                        <div className="pc-consent-box">
                            <ul>
                                <li>국가기록원은 응답자의 개인정보를 중요시하며, 개인정보보호에 관한 법률을 준수하고 있습니다.</li>
                                <li>위와 관련, 개인정보보호법 제15조에 근거하여 다음과 같이 응답자의 동의를 받고자 합니다.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pc-consent-section">
                        <h4>개인정보 수집·이용에 관한 사항</h4>
                        <div className="pc-consent-list">
                            <div className="pc-consent-item">
                                <strong>· 개인정보의 수집 및 이용 목적</strong>
                                <p>· 만족도 조사 작성 및 모바일 쿠폰 발송을 위해 최소한의 개인정보를 수집·이용하고자 합니다.</p>
                            </div>
                            <div className="pc-consent-item">
                                <strong>· 수집하려는 개인정보의 항목</strong>
                                <p>· 수집 필수항목 : 성명, 휴대폰번호</p>
                            </div>
                            <div className="pc-consent-item">
                                <strong>· 개인정보의 보유 및 이용기간</strong>
                                <p>· 보유기간 : 경품 배송 및 조사 완료 후 폐기</p>
                                <p>· 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
                            </div>
                            <div className="pc-consent-item">
                                <strong>· 동의거부 권리 및 불이익 내용</strong>
                                <p>· 정보주체는 개인정보의 수집·이용에 대한 동의를 거부할 수 있으며, 동의 거부 시 설문조사 의견 제출을 하실 수 없습니다.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pc-agree-row">
                        <p>위 내용을 확인하여 개인정보 수집·이용에 동의합니다.</p>
                        <div className="pc-agree-options">
                            <label className="pc-checkbox-pill">
                                <input type="checkbox" checked={agree === 'agree'} onChange={() => setAgree('agree')} />
                                <span>동의함</span>
                            </label>
                            <label className="pc-checkbox-pill">
                                <input type="checkbox" checked={agree === 'disagree'} onChange={() => setAgree('disagree')} />
                                <span>동의하지 않음</span>
                            </label>
                        </div>
                    </div>

                    <h3 className="pc-consent-title pc-consent-title-second">작성자 기본정보</h3>

                    <div className="pc-form-row">
                        <label>성별 <span className="pc-req-star">*</span></label>
                        <div className="pc-radio-group">
                            <label><input type="radio" checked={gender === 'male'} onChange={() => setGender('male')} /> 남자</label>
                            <label><input type="radio" checked={gender === 'female'} onChange={() => setGender('female')} /> 여자</label>
                        </div>
                    </div>

                    <div className="pc-form-row">
                        <label>연령 <span className="pc-req-star">*</span></label>
                        <div className="pc-radio-group pc-radio-grid">
                            <label><input type="radio" checked={age === 'under20'} onChange={() => setAge('under20')} /> 20대 미만</label>
                            <label><input type="radio" checked={age === '20s'} onChange={() => setAge('20s')} /> 20대</label>
                            <label><input type="radio" checked={age === '30s'} onChange={() => setAge('30s')} /> 30대</label>
                            <label><input type="radio" checked={age === '40s'} onChange={() => setAge('40s')} /> 40대</label>
                            <label><input type="radio" checked={age === '50plus'} onChange={() => setAge('50plus')} /> 50대 이상</label>
                        </div>
                    </div>

                    <div className="pc-form-row">
                        <label>이용 기기 <span className="pc-req-star">*</span></label>
                        <div className="pc-radio-group">
                            <label><input type="radio" checked={device === 'pc'} onChange={() => setDevice('pc')} /> PC</label>
                            <label><input type="radio" checked={device === 'mobile'} onChange={() => setDevice('mobile')} /> 모바일</label>
                            <label><input type="radio" checked={device === 'tablet'} onChange={() => setDevice('tablet')} /> 태블릿</label>
                            <label className="pc-radio-other">
                                <input type="radio" checked={device === 'other'} onChange={() => setDevice('other')} /> 기타
                                <input type="text" disabled={device !== 'other'} value={deviceOther} onChange={(e) => setDeviceOther(e.target.value)} />
                            </label>
                        </div>
                    </div>

                    <div className="pc-form-row">
                        <label>직업(소속) <span className="pc-req-star">*</span></label>
                        <div className="pc-radio-group pc-radio-grid">
                            <label><input type="radio" checked={job === 'student'} onChange={() => setJob('student')} /> 학생(초중고생)</label>
                            <label><input type="radio" checked={job === 'college'} onChange={() => setJob('college')} /> 대학/대학원생</label>
                            <label><input type="radio" checked={job === 'office'} onChange={() => setJob('office')} /> 회사원</label>
                            <label><input type="radio" checked={job === 'pro'} onChange={() => setJob('pro')} /> 전문직</label>
                            <label><input type="radio" checked={job === 'self'} onChange={() => setJob('self')} /> 개인사업자</label>
                            <label className="pc-radio-other">
                                <input type="radio" checked={job === 'other'} onChange={() => setJob('other')} /> 기타
                                <input type="text" disabled={job !== 'other'} value={jobOther} onChange={(e) => setJobOther(e.target.value)} />
                            </label>
                        </div>
                    </div>

                    <div className="pc-form-row pc-form-row-input">
                        <label>성명 <span className="pc-req-star">*</span></label>
                        <input type="text" value={name} onChange={handleNameChange} placeholder="이름을 입력해 주세요" />
                    </div>
                    <div className="pc-form-row pc-form-row-input">
                        <label>휴대폰번호 <span className="pc-req-star">*</span></label>
                        <input type="tel" inputMode="numeric" value={phone} onChange={handlePhoneChange} placeholder="010-0000-0000" maxLength={13} />
                    </div>

                    <div className="pc-consent-action">
                        <button className="pc-btn-primary" onClick={handleSubmit} disabled={!canSubmit}>참여하기</button>
                    </div>
                </div>
            </div>
        </UserPCLayout>
    );
}
