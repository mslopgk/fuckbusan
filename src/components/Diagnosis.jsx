import React, { useState, useEffect } from 'react';
import './Diagnosis.css';
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';

const buildPinDataUrl = (color) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const Diagnosis = ({ onBack, onNext, onList, onMyActivity, onEdit, onResult, initialMode, mapPins, onAddPin }) => {
    useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_MAP_KEY, libraries: ['services'] });
    const [diagnosisType, setDiagnosisType] = useState(initialMode || 'general'); // 'general' | 'expert'
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedPin, setSelectedPin] = useState(null); // ID of selected pin or 'custom'
    const [currentLocation, setCurrentLocation] = useState(null); // { lat, lng }
    const [addressInfo, setAddressInfo] = useState(null); // { road, jibun, zip, placeName }
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [customPin, setCustomPin] = useState(null);

    // Force full width layout
    useEffect(() => {
        document.body.classList.add('layout-full-width');
        return () => {
            document.body.classList.remove('layout-full-width');
        };
    }, []);

    // Initial Geolocation
    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // BUSAN BOUNDS CHECK (approx)
                    // Lat: 34.8 ~ 35.4
                    // Lng: 128.8 ~ 129.3
                    const isBusan = latitude > 34.8 && latitude < 35.4 && longitude > 128.8 && longitude < 129.3;

                    if (isBusan) {
                        // Only update center/fetch address if we are waiting for initial location
                        // and user hasn't selected a pin yet.
                        if (!selectedPin && !customPin) {
                            setCurrentLocation({ lat: latitude, lng: longitude });
                            fetchAddress(latitude, longitude);
                        }
                    } else {
                        console.warn("Location is outside Busan (e.g. Seoul), defaulting to Busanjin-gu");
                        if (!selectedPin && !customPin) {
                            // Default to Busan Citizens Park or Busanjin-gu
                            const busanCenter = { lat: 35.1689, lng: 129.0578 }; // Busan Citizens Park approx
                            setCurrentLocation(busanCenter);
                            fetchAddress(busanCenter.lat, busanCenter.lng);
                        }
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Fallback to Busanjin-gu if failed, only if no pin selected
                    if (!selectedPin && !customPin) {
                        setCurrentLocation({ lat: 35.1631, lng: 129.0529 });
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            console.error("Geolocation not supported");
        }
    }, []);

    const fetchAddress = (lat, lng) => {
        if (!window.kakao?.maps?.services) {
            setAddressInfo({ placeName: 'SDK 미로드', road: '주소를 불러올 수 없습니다', jibun: '-', zip: '-' });
            return;
        }
        setIsLoadingAddress(true);
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, (result, status) => {
            try {
                if (status === window.kakao.maps.services.Status.OK && result[0]) {
                    const r = result[0];
                    const road = r.road_address?.address_name || '';
                    const jibun = r.address?.address_name || '';
                    const place = r.road_address?.building_name || jibun.split(' ').slice(-2).join(' ') || '지정된 위치';
                    setAddressInfo({
                        placeName: place,
                        road: road || jibun,
                        jibun: jibun || road,
                        zip: r.road_address?.zone_no || '-',
                    });
                } else {
                    setAddressInfo({ placeName: '알 수 없는 위치', road: '주소 정보 없음', jibun: '-', zip: '-' });
                }
            } finally {
                setIsLoadingAddress(false);
            }
        });
    };

    const primaryColor = diagnosisType === 'expert' ? '#542AA3' : '#E6235A';

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const selectType = (type) => {
        setDiagnosisType(type);
        setIsDropdownOpen(false);
        setSelectedPin(null);
        setCustomPin(null);
        setAddressInfo(null);
    };

    const handlePinClick = (id) => {
        setSelectedPin(id === selectedPin ? null : id);

        // If clicking an existing pin, set its saved address
        if (mapPins && mapPins[id]) {
            setCustomPin(null); // Clear custom pin selection
            setAddressInfo(mapPins[id].address);
        }
    };

    const handleDiagnose = () => {
        // Prepare data to pass
        let locationData = null;

        if (selectedPin === 'custom' && customPin) {
            // Save new pin to App state
            const newId = onAddPin({
                lat: customPin.lat,
                lng: customPin.lng,
                address: addressInfo
            });

            locationData = {
                id: newId,
                lat: customPin.lat,
                lng: customPin.lng,
                address: addressInfo
            };
        } else if (mapPins && mapPins[selectedPin]) {
            locationData = mapPins[selectedPin];
        }

        if (locationData) {
            onNext({
                mode: diagnosisType,
                location: locationData,
                address: locationData.address
            });
        } else {
            alert('위치를 선택해주세요.');
        }
    };

    const pinImage = (isSelected, color) => ({
        src: buildPinDataUrl(isSelected ? color : '#888888'),
        size: { width: 40, height: 40 },
        options: { offset: { x: 20, y: 40 } },
    });

    return (
        <div className={`diagnosis-container ${diagnosisType}`}>
            {/* Header */}
            <div className="diagnosis-header">
                <div className="header-left">
                    <button className="back-btn" onClick={onBack} style={{ padding: 0, marginRight: '4px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>

                    <div className="diagnosis-title-wrapper" onClick={toggleDropdown}>
                        <span className="diagnosis-title" style={{ color: primaryColor }}>
                            {diagnosisType === 'general' ? '일반 진단' : '전문가 진단'}
                        </span>
                        <svg
                            className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>

                <div className="header-right">
                    <button className="header-action-btn" onClick={onList}>진단 목록</button>
                    <button className="header-action-btn" onClick={onMyActivity}>나의 활동</button>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className="diagnosis-dropdown">
                    <div
                        className={`dropdown-item ${diagnosisType === 'general' ? 'selected' : ''}`}
                        onClick={() => selectType('general')}
                    >
                        일반
                    </div>
                    <div
                        className={`dropdown-item ${diagnosisType === 'expert' ? 'selected' : ''}`}
                        onClick={() => selectType('expert')}
                    >
                        전문가
                    </div>
                </div>
            )}

            {/* Map Area */}
            <div className="diagnosis-map-container" style={{ position: 'relative', zIndex: 0 }}>
                <Map
                    center={currentLocation || { lat: 35.1631, lng: 129.0529 }}
                    level={3}
                    style={{ height: '100%', width: '100%', outline: 'none' }}
                    onClick={(_target, mouseEvent) => {
                        if (isDropdownOpen) {
                            setIsDropdownOpen(false);
                            return;
                        }
                        const latlng = mouseEvent.latLng;
                        const newPin = { lat: latlng.getLat(), lng: latlng.getLng() };
                        setCustomPin(newPin);
                        setSelectedPin('custom');
                        fetchAddress(newPin.lat, newPin.lng);
                    }}
                >
                    {/* Persistent Pins */}
                    {Object.values(mapPins)
                        .filter(pin => (pin.type || 'general') === diagnosisType)
                        .map((pin) => (
                            <MapMarker
                                key={pin.id}
                                position={{ lat: pin.lat, lng: pin.lng }}
                                image={pinImage(selectedPin == pin.id, primaryColor)}
                                onClick={() => handlePinClick(pin.id)}
                            />
                        ))}

                    {/* Current Location Dot */}
                    {currentLocation && (
                        <CustomOverlayMap position={currentLocation} yAnchor={0.5} xAnchor={0.5}>
                            <div style={{
                                width: 16, height: 16, borderRadius: '50%',
                                background: '#4285F4', border: '2px solid #fff',
                                boxShadow: '0 0 0 2px rgba(66,133,244,0.3)',
                            }} title="현재 위치" />
                        </CustomOverlayMap>
                    )}

                    {/* Custom Pin */}
                    {customPin && (
                        <MapMarker
                            position={customPin}
                            image={pinImage(selectedPin === 'custom', primaryColor)}
                            onClick={() => handlePinClick('custom')}
                        />
                    )}
                </Map>

                {/* GPS Button */}
                <button
                    className="gps-btn"
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    const { latitude, longitude } = position.coords;
                                    setCurrentLocation({ lat: latitude, lng: longitude });
                                    // Also fetch addr if no pin selected? Maybe just move map.
                                    // If they click GPS, they usually want to diagnose THERE.
                                    // Let's set it as custom pin? No, just show location.
                                    // If they want to diagnose, they'll click the map.
                                },
                                (error) => {
                                    alert("위치 정보를 가져올 수 없습니다.");
                                },
                                { enableHighAccuracy: true, timeout: 5000 }
                            );
                        }
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.25 1.51H13.5a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
            </div>

            {/* Bottom Panel */}
            <div className={`diagnosis-bottom-panel ${selectedPin ? 'selected' : ''}`}>
                {!selectedPin ? (
                    <div className="diagnosis-info-card">
                        <div className="panel-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                                <line x1="8" y1="2" x2="8" y2="18"></line>
                                <line x1="16" y1="6" x2="16" y2="22"></line>
                            </svg>
                        </div>
                        <div className="panel-text">
                            지도에서 진단할 위치를 선택하거나,<br />
                            원하는 곳을 직접 클릭해 주세요.
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="diagnosis-info-card selected">
                            {/* Address Row */}
                            <div className="panel-address-row">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={primaryColor} stroke="none">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                <div className="panel-address-text">
                                    {isLoadingAddress ? '주소 불러오는 중...' : (addressInfo ? addressInfo.road : '주소 불러오는 중...')}
                                </div>
                            </div>

                            {/* Detail Row */}
                            <div className="panel-detail-row">
                                <div className="badge">지번</div>
                                <span>{addressInfo ? addressInfo.jibun : '-'}</span>
                                <div className="badge" style={{ marginLeft: '8px' }}>우편</div>
                                <span>{addressInfo ? addressInfo.zip : '-'}</span>
                            </div>

                            {/* Place Name */}
                            <div className="panel-place-name">
                                {addressInfo ? addressInfo.placeName : '위치 확인 중...'}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {selectedPin !== 'custom' && mapPins && mapPins[selectedPin] ? (
                            <div className="action-buttons-row" style={{ display: 'flex', gap: '8px', marginTop: '16px', width: '100%' }}>
                                <button
                                    className="btn-view-result"
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#242424',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        height: '60px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        if (onResult) {
                                            onResult({
                                                ...mapPins[selectedPin],
                                                // Force navigation based on current active mode per user request
                                                type: diagnosisType,
                                                // Ensure image fallback if missing
                                                image: mapPins[selectedPin].image || '/assets/diagnosis_street.png'
                                            });
                                        }
                                    }}
                                >
                                    결과 보기
                                </button>
                                <button
                                    className="btn-diagnose"
                                    style={{
                                        flex: 1,
                                        backgroundColor: primaryColor,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        height: '60px',
                                        fontSize: '1rem',
                                        fontWeight: '600', // line 457
                                        cursor: 'pointer',
                                        boxShadow: `0 4px 12px ${diagnosisType === 'expert' ? 'rgba(84, 42, 163, 0.3)' : 'rgba(230, 35, 90, 0.3)'}`
                                    }}
                                    onClick={handleDiagnose}
                                >
                                    진단하기
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn-diagnose"
                                style={{
                                    backgroundColor: primaryColor,
                                    boxShadow: `0 4px 12px ${diagnosisType === 'expert' ? 'rgba(84, 42, 163, 0.3)' : 'rgba(230, 35, 90, 0.3)'}`
                                }}
                                onClick={handleDiagnose}
                            >
                                진단하기
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Diagnosis;
