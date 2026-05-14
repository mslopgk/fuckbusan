/* MyPage.jsx */
import React, { useState, useEffect } from 'react';
import './MyPage.css';
import { API_URL } from '../utils/api';

const MyPage = ({ onBack }) => {
    const [userInfo, setUserInfo] = useState({
        ID: '',
        name: '',
        phone_num: '',
        birth_date: ''
    });
    const [passwords, setPasswords] = useState({
        newPw: '',
        confirmPw: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('로그인이 필요합니다.');
                onBack();
                return;
            }

            try {
                const response = await fetch(`${API_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserInfo({
                        ID: data.ID || '',
                        name: data.name || '',
                        phone_num: data.phone_num || '',
                        birth_date: data.birth_date || '880911'
                    });
                } else {
                    console.error('Failed to fetch user data');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConfirm = async () => {
        const token = localStorage.getItem('access_token');
        let success = true;

        // 1. 프로필 정보 업데이트
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    name: userInfo.name,
                    phone_num: userInfo.phone_num,
                    birth_date: userInfo.birth_date
                })
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('Profile update failed:', err);
                success = false;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            success = false;
        }

        // 2. 비밀번호 변경 (입력된 경우에만)
        if (passwords.newPw) {
            if (passwords.newPw !== passwords.confirmPw) {
                alert('비밀번호가 일치하지 않습니다.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/users/reset-password`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ new_pw: passwords.newPw })
                });

                if (response.ok) {
                    setPasswords({ newPw: '', confirmPw: '' });
                } else {
                    const err = await response.json();
                    alert(`비밀번호 변경 실패: ${err.detail || '알 수 없는 오류'}`);
                    success = false;
                }
            } catch (error) {
                console.error('Error changing password:', error);
                success = false;
            }
        }

        if (success) {
            alert('정보가 수정되었습니다.');
        } else {
            alert('일부 정보 수정에 실패했습니다.');
        }
    };

    if (loading) {
        return <div className="mypage-loading">로딩 중...</div>;
    }

    return (
        <div className="mypage-container">
            {/* Header */}
            <header className="mypage-header">
                <button className="mypage-back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="15" y1="18" x2="9" y2="12"></line>
                        <line x1="9" y1="12" x2="15" y2="6"></line>
                    </svg>
                </button>
            </header>

            <div className="mypage-body">
                <h1 className="mypage-title">마이페이지</h1>
                
                <div className="mypage-welcome-section">
                    <h2 className="mypage-welcome-text">더 나은 부산을 위한 첫 걸음</h2>
                    <p className="mypage-welcome-desc">아직 계정이 없다면 회원가입을 진행해주세요.</p>
                </div>

                <div className="mypage-form">
                    {/* ID Field */}
                    <div className="mypage-input-group">
                        <label className="mypage-label">아이디<span className="required-dot">●</span></label>
                        <input 
                            type="text" 
                            className="mypage-input readonly" 
                            value={userInfo.ID} 
                            readOnly 
                        />
                    </div>

                    {/* Password Field */}
                    <div className="mypage-input-group">
                        <label className="mypage-label">비밀번호<span className="required-dot">●</span></label>
                        <input 
                            type="password" 
                            className="mypage-input" 
                            placeholder="수정할 비밀번호를 입력해 주세요." 
                            value={passwords.newPw}
                            onChange={(e) => setPasswords({...passwords, newPw: e.target.value})}
                        />
                        <input 
                            type="password" 
                            className="mypage-input second-pw" 
                            placeholder="비밀번호를 한번 더 입력해 주세요." 
                            value={passwords.confirmPw}
                            onChange={(e) => setPasswords({...passwords, confirmPw: e.target.value})}
                        />
                        <p className="mypage-hint">*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.</p>
                    </div>

                    {/* Name Field */}
                    <div className="mypage-input-group">
                        <label className="mypage-label">이름</label>
                        <input 
                            type="text" 
                            className="mypage-input" 
                            value={userInfo.name} 
                            onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                        />
                    </div>

                    {/* Phone Field */}
                    <div className="mypage-input-group">
                        <label className="mypage-label">휴대폰번호</label>
                        <input 
                            type="text" 
                            className="mypage-input" 
                            value={userInfo.phone_num} 
                            onChange={(e) => setUserInfo({...userInfo, phone_num: e.target.value})}
                        />
                    </div>

                    {/* Birth Field */}
                    <div className="mypage-input-group">
                        <label className="mypage-label">생년월일</label>
                        <input 
                            type="text" 
                            className="mypage-input" 
                            value={userInfo.birth_date} 
                            onChange={(e) => setUserInfo({...userInfo, birth_date: e.target.value})}
                        />
                    </div>
                </div>

                <div className="mypage-footer">
                    <button className="mypage-submit-btn" onClick={handleConfirm}>확인</button>
                </div>
            </div>
        </div>
    );
};

export default MyPage;
