import React, { useState } from 'react';
import './Signup.css';
import './Login.css'; // Reuse common button/input styles

const Signup = ({ onBack }) => {
    const [userType, setUserType] = useState('general'); // 'general' | 'expert'

    const [formData, setFormData] = useState({
        id: '',
        password: '',
        name: '',
        nickname: '',
        phone: ''
    });

    const isFormValid = formData.id && formData.password && formData.name && formData.phone;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ...

    return (
        <div className="signup-container">
            {/* Header */}
            <div className="login-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            {/* Title */}
            <div className="login-title-section">
                <div className="login-title">회원가입</div>
            </div>



            {/* Form */}
            <div className="signup-form">
                {/* ID */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">아이디</label>
                        <div className="required-dot"></div>
                    </div>
                    <input
                        type="text"
                        name="id"
                        className="login-input"
                        placeholder="아이디를 입력해 주세요."
                        value={formData.id}
                        onChange={handleChange}
                    />
                </div>

                {/* Password */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">비밀번호</label>
                        <div className="required-dot"></div>
                    </div>
                    <input
                        type="password"
                        name="password"
                        className="login-input"
                        placeholder="비밀번호를 입력해 주세요."
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <div className="helper-text">*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.</div>
                </div>

                {/* Divider */}
                <div className="form-divider"></div>

                {/* Name */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">이름</label>
                        <div className="required-dot"></div>
                    </div>
                    <input
                        type="text"
                        name="name"
                        className="login-input"
                        placeholder="이름을 입력해 주세요."
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                {/* Nickname */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">닉네임</label>
                    </div>
                    <input
                        type="text"
                        name="nickname"
                        className="login-input"
                        placeholder="닉네임을 입력해 주세요."
                        value={formData.nickname}
                        onChange={handleChange}
                    />
                    <div className="helper-text">*한글·영문·숫자로 2~12자 이내로 입력해주세요.</div>
                </div>

                {/* Phone */}
                <div className="input-group">
                    <div className="input-label-row">
                        <label className="input-label">휴대폰번호</label>
                        <div className="required-dot"></div>
                    </div>
                    <input
                        type="tel"
                        name="phone"
                        className="login-input"
                        placeholder="휴대폰번호를 입력해 주세요."
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>

                {/* User Type Toggle */}
                <div className="user-type-toggle-container" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                        className={`user-type-btn ${userType === 'general' ? 'active' : ''}`}
                        onClick={() => setUserType('general')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: userType === 'general' ? '1px solid #E6235A' : '1px solid #eee',
                            backgroundColor: userType === 'general' ? '#FFF0F5' : '#fff',
                            color: userType === 'general' ? '#E6235A' : '#888',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        일반 시민
                    </button>
                    <button
                        className={`user-type-btn ${userType === 'expert' ? 'active' : ''}`}
                        onClick={() => setUserType('expert')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: userType === 'expert' ? '1px solid #542AA3' : '1px solid #eee',
                            backgroundColor: userType === 'expert' ? '#F3E5F5' : '#fff',
                            color: userType === 'expert' ? '#542AA3' : '#888',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        전문가
                    </button>
                </div>
            </div>

            {/* Submit Button */}
            <div className="signup-btn-container">
                <button
                    className={`login-submit-btn ${isFormValid ? 'active' : 'disabled'}`}
                    disabled={!isFormValid}
                >
                    회원가입
                </button>
            </div>
        </div>
    );
};

export default Signup;
