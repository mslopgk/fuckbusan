import { useState, useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import './MSurveyDetail.css';
import { API_URL } from '../utils/api';
import { copyToClipboard } from '../utils/clipboard';

const GENDERS = ['남자', '여자'];
const AGES = ['20대 미만', '20대', '30대', '40대', '50대 이상'];
const DEVICES = ['PC', '모바일', '태블릿', '기타'];
const JOBS = ['학생(초중고생)', '대학/대학원생', '회사원', '전문직', '개인사업자', '기타'];

function birthToAgeGroup(birthDate) {
    if (!birthDate) return null;
    const year = parseInt(String(birthDate).slice(0, 4), 10);
    if (!year || isNaN(year)) return null;
    const age = new Date().getFullYear() - year;
    if (age < 20) return '20대 미만';
    if (age < 30) return '20대';
    if (age < 40) return '30대';
    if (age < 50) return '40대';
    return '50대 이상';
}

function detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|tablet/.test(ua)) return '태블릿';
    if (/mobile|android|iphone/.test(ua) || window.innerWidth < 1024) return '모바일';
    return 'PC';
}

export default function MSurveyDetail2({ onNavigate, survey }) {
    const data = {
        title: survey?.title || '',
    };
    const [agree, setAgree] = useState(null);
    const [gender, setGender] = useState('남자');
    const [age, setAge] = useState('20대');
    const [device, setDevice] = useState(() => detectDevice());
    const [job, setJob] = useState('학생(초중고생)');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState({});
    const [copied, setCopied] = useState(false);

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
                const ageGroup = birthToAgeGroup(d.birth_date);
                if (ageGroup) setAge(ageGroup);
            })
            .catch(() => {});
    }, []);

    const handlePhoneChange = (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 3) setPhone(digits);
        else if (digits.length <= 7) setPhone(`${digits.slice(0, 3)}-${digits.slice(3)}`);
        else setPhone(`${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`);
    };

    const nameValid = /^[가-힣]{2,10}$/.test(name.trim());
    const phoneValid = /^01[016789]-\d{3,4}-\d{4}$/.test(phone);
    const canSubmit = agree === true && nameValid && phoneValid;

    const handleSubmit = () => {
        const next = {};
        if (!nameValid) next.name = '이름은 한글 2~10자로 입력해주세요.';
        if (!phoneValid) next.phone = '올바른 휴대폰번호를 입력해주세요. (예: 010-1234-5678)';
        setErrors(next);
        if (Object.keys(next).length === 0) onNavigate && onNavigate('mSurveyJoin', {
            ...survey,
            demographics: {
                gender,
                ageGroup: age,
                device,
                job,
                name,
                phone,
            },
        });
    };

    return (
        <div className="m-survey-detail-page">
            <div className="m-survey-hero hero-shrunk">
                <div className="m-hero-topbar">
                    <button className="m-hero-back" onClick={() => onNavigate && onNavigate('mSurveyDetail1', survey)} aria-label="뒤로">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button className="m-hero-copy" type="button" onClick={async () => {
                        const url = window.location.href;
                        await copyToClipboard(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}>
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
                <h3 className="m-consent-title">개인정보 수집·이용에 관한 안내</h3>
                    <p className="m-consent-section">수집항목</p>
                    <ul className="m-consent-bullets">
                        <li>응답자 개인정보 : 성명, 휴대폰번호</li>
                    </ul>
                    <p className="m-consent-section">개인정보 수집·이용 동의서</p>
                    <ul className="m-consent-bullets">
                        <li>국가지표체계 응답자의 개인정보보호를 중요시하며, 개인정보보호에 관한 법률을 준수하고 있습니다.</li>
                        <li>위와 관련, 개인정보보호법 제15조에 근거하여 다음과 같이 응답자의 동의를 받고자 합니다.</li>
                    </ul>
                    <p className="m-consent-section">개인정보 수집·이용에 관한 사항</p>
                    <ul className="m-consent-bullets">
                        <li><strong>개인정보의 수집 및 이용 목적</strong><br/>· 만족도 조사 작성 및 모바일 주문·취소 발송을 위해 최소한의 개인정보를 이용하고자 합니다.</li>
                        <li><strong>수집하려는 개인정보의 항목</strong><br/>· 수집 항목명 : 성명, 휴대폰번호</li>
                        <li><strong>개인정보의 보유 및 이용기간</strong><br/>· 모니터링·고객 시술 및 조사 종료 후 1개월</li>
                        <li><strong>동의를 거부할 권리 및 불이익</strong><br/>· 정보주체는 개인정보의 수집·이용에 대한 동의를 거부할 권리가 있으며, 동의 거부 시 설문조사 의견 제출률 하실 수 없습니다.</li>
                    </ul>
                    <p className="m-consent-final">위 내용을 확인하여 개인정보 수집·이용에 동의합니다.</p>
                    <div className="m-consent-radios">
                        <label><input type="radio" name="agree" checked={agree === true} onChange={() => setAgree(true)} /><span>동의함</span></label>
                        <label><input type="radio" name="agree" checked={agree === false} onChange={() => setAgree(false)} /><span>동의하지 않음</span></label>
                    </div>
            </div>

            <div className="m-survey-body">
                <h3 className="m-form-section-title">작성자 기본정보</h3>

                <div className="m-form-row">
                    <label className="m-form-label">성별 <span className="req">*</span></label>
                    <div className="m-form-radios">
                        {GENDERS.map((g) => (
                            <label key={g}><input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} /><span>{g}</span></label>
                        ))}
                    </div>
                </div>

                <div className="m-form-row">
                    <label className="m-form-label">연령 <span className="req">*</span></label>
                    <div className="m-form-radios m-form-radios-grid">
                        {AGES.map((a) => (
                            <label key={a}><input type="radio" name="age" checked={age === a} onChange={() => setAge(a)} /><span>{a}</span></label>
                        ))}
                    </div>
                </div>

                <div className="m-form-row">
                    <label className="m-form-label">이용 기기 <span className="req">*</span></label>
                    <div className="m-form-radios m-form-radios-grid">
                        {DEVICES.map((d) => (
                            <label key={d}><input type="radio" name="device" checked={device === d} onChange={() => setDevice(d)} /><span>{d}</span></label>
                        ))}
                    </div>
                </div>

                <div className="m-form-row">
                    <label className="m-form-label">직업(소속) <span className="req">*</span></label>
                    <div className="m-form-radios m-form-radios-col">
                        {JOBS.map((j) => (
                            <label key={j}><input type="radio" name="job" checked={job === j} onChange={() => setJob(j)} /><span>{j}</span></label>
                        ))}
                    </div>
                </div>

                <div className="m-form-row">
                    <label className="m-form-label">성명 <span className="req">*</span></label>
                    <input
                        type="text"
                        className={`m-form-input${errors.name ? ' m-form-input-error' : ''}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="홍길동"
                    />
                    {errors.name && <p className="m-form-error">{errors.name}</p>}
                </div>

                <div className="m-form-row">
                    <label className="m-form-label">휴대폰번호 <span className="req">*</span></label>
                    <input
                        type="tel"
                        className={`m-form-input${errors.phone ? ' m-form-input-error' : ''}`}
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="010-0000-0000"
                        maxLength={13}
                    />
                    {errors.phone && <p className="m-form-error">{errors.phone}</p>}
                </div>

                <button
                    className="m-survey-cta"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >참여하기</button>
            </div>

            <MobileBottomNav currentView="mSurveyDetail2" onNavigate={onNavigate} />
        </div>
    );
}
