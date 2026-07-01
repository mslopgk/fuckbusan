import React, { useState, useEffect } from 'react';
import './Home.css';
import HomePC from './HomePC';
import HomeMobile from './HomeMobile';

// 뷰포트에 따라 PC/모바일 홈 분기 (둘 다 Figma 전용 레이아웃)
const Home = ({ onNavigate }) => {
    const [isPC, setIsPC] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

    useEffect(() => {
        const onResize = () => setIsPC(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return isPC
        ? <HomePC onNavigate={onNavigate} />
        : <HomeMobile onNavigate={onNavigate} />;
};

export default Home;
