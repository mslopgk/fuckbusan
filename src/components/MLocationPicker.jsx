import { useState, useEffect } from 'react';
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';

const BUSAN_CENTER = { lat: 35.158, lng: 129.06 };

/**
 * 모바일 위치 선택 풀페이지 — Figma 302:17186(제보) / 302:18642(제안)
 * 지도를 드래그해 중앙 고정 핀 위치를 고르는 방식 (PC LocationPickerModal 패턴).
 * accent: 'report' | 'propose' — 헤더 아이콘(X/화살표)과 내위치 아이콘 컬러 분기
 */
export default function MLocationPicker({ accent = 'report', initialCenter, onClose, onConfirm }) {
    const [kakaoLoading] = useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services'] });
    const [center, setCenter] = useState(initialCenter || BUSAN_CENTER);
    const [address, setAddress] = useState('');
    const [search, setSearch] = useState('');

    // 중심 이동 시 디바운스 역지오코딩
    useEffect(() => {
        if (kakaoLoading) return;
        const t = setTimeout(() => {
            try {
                const geocoder = new window.kakao.maps.services.Geocoder();
                geocoder.coord2Address(center.lng, center.lat, (result, status) => {
                    if (status === 'OK' && result.length > 0) {
                        setAddress(result[0].road_address?.address_name || result[0].address?.address_name || '');
                    } else {
                        setAddress('');
                    }
                });
            } catch {
                setAddress('');
            }
        }, 400);
        return () => clearTimeout(t);
    }, [center, kakaoLoading]);

    const handleSearch = () => {
        if (!search.trim() || !window.kakao?.maps?.services) return;
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(search.trim(), (results, status) => {
            if (status === 'OK' && results.length > 0) {
                setCenter({ lat: parseFloat(results[0].y), lng: parseFloat(results[0].x) });
            }
        });
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {}
        );
    };

    const isReport = accent === 'report';

    return (
        <div className="m-loc-picker">
            <button className="m-loc-picker-close" onClick={onClose} aria-label="닫기" type="button">
                {isReport ? (
                    /* Figma 302:17192 export — 14x14 X */
                    <img src="/figma-assets/mobile-report/picker_close_x.png" alt="" width="14" height="14" />
                ) : (
                    /* Figma 302:18669 — 뒤로 화살표 24 */
                    <img src="/figma-assets/icons/icon_arrow_back.svg" alt="" width="24" height="24" />
                )}
            </button>

            {/* Figma 302:17189 — 두 프레임 공통 문구 */}
            <h2 className="m-loc-picker-title">우리동네 공공디자인을<br/>제안하고 싶은 장소를 선택해주세요.</h2>

            {/* Figma: 검색 353x55 r15, 아이콘 24 + clear 14 */}
            <div className="m-loc-picker-search">
                <img src="/figma-assets/icons/locate-modal/search.png" alt="" width="24" height="24" />
                <input
                    type="text"
                    placeholder="장소 또는 주소 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {search && (
                    <button type="button" onClick={() => setSearch('')} aria-label="지우기">
                        <img src="/figma-assets/icons/locate-modal/clear_x.png" alt="" width="14" height="14" />
                    </button>
                )}
            </div>

            <div className="m-loc-picker-map">
                {!kakaoLoading ? (
                    <Map
                        center={center}
                        level={4}
                        style={{ width: '100%', height: '100%' }}
                        draggable
                        zoomable
                        onCenterChanged={(m) => {
                            const c = m.getCenter();
                            setCenter({ lat: c.getLat(), lng: c.getLng() });
                        }}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a6a6a6', fontSize: 14 }}>지도 로딩 중...</div>
                )}
                {/* Figma 302:17214 — 중앙 고정 핀 50x50 */}
                <img className="m-loc-picker-pin" src="/figma-assets/icons/locate-modal/pin.png" alt="" width="50" height="50" />
            </div>

            <div className="m-loc-picker-hint">지도를 움직여서 선택해보세요</div>

            <button className="m-loc-picker-locate" onClick={handleCurrentLocation} aria-label="현재 위치" type="button">
                <img
                    src={isReport
                        ? '/figma-assets/mobile-report/picker_mylocation.png'
                        : '/figma-assets/mobile-propose/picker_mylocation.png'}
                    alt="" width="24" height="24"
                />
            </button>

            <button
                className="m-loc-picker-confirm"
                type="button"
                disabled={!address}
                onClick={() => onConfirm({ lat: center.lat, lng: center.lng, address })}
            >위치 선택완료</button>
        </div>
    );
}
