/* MyPage.jsx — Figma 215:2136 (마이페이지>내정보관리) */
import React, { useState, useEffect } from 'react';
import './MyPage.css';
import { API_URL } from '../utils/api';

const MyPage = ({ onBack, onLoginRequired }) => {
    const [userInfo, setUserInfo] = useState({
        ID: '',
        name: '',
        phone_num: '',
        birth_date: '',
        nickname: '',
        email: '',
        address: '',
        detailed_address: '',
    });
    const [passwords, setPasswords] = useState({
        newPw: '',
        confirmPw: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('로그인이 필요합니다.');
                (onLoginRequired || onBack)();
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
                        birth_date: data.birth_date || '',
                        nickname: data.nickname || '',
                        email: data.email || '',
                        address: data.address || '',
                        detailed_address: data.detailed_address || '',
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
        setSaving(true);
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
                    birth_date: userInfo.birth_date,
                    nickname: userInfo.nickname,
                    email: userInfo.email,
                    address: userInfo.address,
                    detailed_address: userInfo.detailed_address,
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
                setSaving(false);
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

        setSaving(false);
        if (success) {
            alert('정보가 수정되었습니다.');
        } else {
            alert('일부 정보 수정에 실패했습니다.');
        }
    };

    const handleAddressSearch = () => {
        // 카카오 주소검색 API (daum postcode) — 미구현 시 alert 처리
        if (window.daum && window.daum.Postcode) {
            new window.daum.Postcode({
                oncomplete: (data) => {
                    setUserInfo(prev => ({
                        ...prev,
                        address: data.roadAddress || data.jibunAddress || ''
                    }));
                }
            }).open();
        } else {
            alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        }
    };

    if (loading) {
        return <div className="mypg-loading">로딩 중...</div>;
    }

    return (
        <div className="mypg-container">
            {/* PC Header는 App.jsx의 PCHeader가 담당 — 모바일 전용 back 헤더 (Figma 302:19149) */}
            <header className="mypg-mobile-header">
                <button className="mypg-back-btn" onClick={onBack} aria-label="뒤로가기">
                    <img src="/figma-assets/mobile-myactivity/icon_back.png" alt="" width="24" height="24" />
                </button>
            </header>

            {/* PC 전용 타이틀 (기존 유지) */}
            <div className="mypg-page-title-row">
                <h1 className="mypg-page-title">내 정보 관리</h1>
            </div>

            {/* 모바일 타이틀 — Figma 302:19152 Frame 33 */}
            <div className="mypg-hero">
                <h1 className="mypg-hero-title">마이페이지</h1>
                <p className="mypg-hero-heading">더 나은 부산을 위한 첫 걸음</p>
                <p className="mypg-hero-caption">아직 계정이 없다면 회원가입을 진행해주세요.</p>
            </div>

            <div className="mypg-card">
                {/* 아이디 */}
                <div className="mypg-field-group">
                    <label className="mypg-label">아이디</label>
                    <div className="mypg-input mypg-input--readonly">{userInfo.ID || '—'}</div>
                </div>

                {/* 비밀번호 */}
                <div className="mypg-field-group">
                    <label className="mypg-label">비밀번호</label>
                    <input
                        type="password"
                        className="mypg-input mypg-input--pw1"
                        placeholder="수정할 비밀번호를 입력해 주세요."
                        value={passwords.newPw}
                        onChange={(e) => setPasswords({ ...passwords, newPw: e.target.value })}
                    />
                    <input
                        type="password"
                        className="mypg-input mypg-input--second"
                        placeholder="비밀번호를 한번 더 입력해 주세요."
                        value={passwords.confirmPw}
                        onChange={(e) => setPasswords({ ...passwords, confirmPw: e.target.value })}
                    />
                    <p className="mypg-hint">*영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.</p>
                </div>

                {/* 이름 */}
                <div className="mypg-field-group mypg-field-group--name">
                    <label className="mypg-label">이름</label>
                    <div className="mypg-input mypg-input--readonly">{userInfo.name || '—'}</div>
                </div>

                {/* 휴대폰번호 */}
                <div className="mypg-field-group">
                    <label className="mypg-label">휴대폰번호</label>
                    <div className="mypg-input mypg-input--readonly mypg-input--phone">
                        {userInfo.phone_num || '—'}
                    </div>
                </div>

                {/* 생년월일 */}
                <div className="mypg-field-group">
                    <label className="mypg-label">생년월일</label>
                    <div className="mypg-input mypg-input--readonly">{userInfo.birth_date || '—'}</div>
                </div>

                {/* 닉네임 */}
                <div className="mypg-field-group">
                    <label className="mypg-label">닉네임</label>
                    <input
                        type="text"
                        className="mypg-input"
                        placeholder="변경할 닉네임을 입력하세요"
                        value={userInfo.nickname}
                        onChange={(e) => setUserInfo({ ...userInfo, nickname: e.target.value })}
                    />
                </div>

                {/* 이메일 */}
                <div className="mypg-field-group">
                    <label className="mypg-label">이메일</label>
                    <input
                        type="email"
                        className="mypg-input"
                        placeholder="변경할 이메일을 입력하세요"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    />
                </div>

                {/* 주소 */}
                <div className="mypg-field-group mypg-field-group--addr">
                    <label className="mypg-label">주소</label>
                    <input
                        type="text"
                        className="mypg-input"
                        placeholder="주소"
                        value={userInfo.address}
                        onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                        readOnly
                    />
                    <button className="mypg-addr-search-btn" type="button" onClick={handleAddressSearch}>
                        주소검색
                    </button>
                    <input
                        type="text"
                        className="mypg-input"
                        placeholder="상세주소"
                        value={userInfo.detailed_address}
                        onChange={(e) => setUserInfo({ ...userInfo, detailed_address: e.target.value })}
                    />
                </div>
            </div>

            {/* 수정하기 버튼 */}
            <div className="mypg-submit-row">
                <button
                    className="mypg-submit-btn"
                    onClick={handleConfirm}
                    disabled={saving}
                >
                    {saving ? '저장 중...' : '확인'}
                </button>
            </div>
        </div>
    );
};

export default MyPage;
