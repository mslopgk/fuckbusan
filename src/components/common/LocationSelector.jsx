import React, { useState, useEffect } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%23EF4E7B" stroke="%23fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="%23fff"/></svg>`;
const PIN_DATA_URL = `data:image/svg+xml;utf8,${PIN_SVG}`;

const LocationSelector = ({ onLocationSelect, initialLocation, refreshKey }) => {
    useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services'] });
    const [position, setPosition] = useState(initialLocation || null);
    const [center, setCenter] = useState(initialLocation || { lat: 35.165, lng: 129.058 });
    const [isLoading, setIsLoading] = useState(!initialLocation);

    const fetchAddress = (lat, lng) => {
        if (!window.kakao?.maps?.services) {
            if (onLocationSelect) onLocationSelect({ lat, lng, address: '주소 정보 확인 불가 (SDK 미로드)' });
            return;
        }
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, (result, status) => {
            let address = '주소 정보 확인 불가 (수동 입력 필요)';
            if (status === window.kakao.maps.services.Status.OK && result[0]) {
                const r = result[0];
                address = r.road_address?.address_name || r.address?.address_name || address;
            }
            if (onLocationSelect) onLocationSelect({ lat, lng, address });
        });
    };

    const findLocation = () => {
        if (!navigator.geolocation) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos = { lat: latitude, lng: longitude };
                setPosition(newPos);
                setCenter(newPos);
                fetchAddress(latitude, longitude);
                setIsLoading(false);
            },
            (err) => {
                console.error('Geolocation error:', err);
                setIsLoading(false);
                if (err.code === 1) {
                    alert('위치 정보 접근 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.');
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        findLocation();
    }, [initialLocation, refreshKey]);

    const handleClick = (_target, mouseEvent) => {
        const latlng = mouseEvent.latLng;
        const newPos = { lat: latlng.getLat(), lng: latlng.getLng() };
        setPosition(newPos);
        setCenter(newPos);
        fetchAddress(newPos.lat, newPos.lng);
    };

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: 0, overflow: 'hidden', position: 'relative' }}>
            {isLoading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 2000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                }}>
                    <div className="pf-map-loading-spinner"></div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#666' }}>현 위치를 찾는 중입니다...</span>
                </div>
            )}
            <Map
                center={center}
                level={3}
                style={{ height: '100%', width: '100%' }}
                onClick={handleClick}
            >
                {position && (
                    <MapMarker
                        position={position}
                        image={{ src: PIN_DATA_URL, size: { width: 40, height: 40 }, options: { offset: { x: 20, y: 40 } } }}
                    />
                )}
            </Map>
        </div>
    );
};

export default LocationSelector;
