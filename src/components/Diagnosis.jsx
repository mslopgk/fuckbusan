import React, { useState } from 'react';
import './Diagnosis.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const Diagnosis = ({ onBack, onNext, onList, onMyActivity }) => {
    const [diagnosisType, setDiagnosisType] = useState('general'); // 'general' | 'expert'
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedPin, setSelectedPin] = useState(null); // ID of selected pin or 'custom'
    const [customPin, setCustomPin] = useState(null); // { lat, lng }

    const primaryColor = diagnosisType === 'expert' ? '#542AA3' : '#E6235A';

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const selectType = (type) => {
        setDiagnosisType(type);
        setIsDropdownOpen(false);
        // Reset selection on type change if desired
        setSelectedPin(null);
        setCustomPin(null);
    };

    const handlePinClick = (id) => {
        setSelectedPin(id === selectedPin ? null : id);
    };

    // Helper for map events
    const MapClickHandler = ({ onClick }) => {
        useMapEvents({
            click: (e) => {
                onClick(e);
            },
        });
        return null;
    };

    // Mock Coords (Busanjin-gu Area)
    const mockCoordinates = {
        1: [35.1668, 129.0570], // Near Busan Citizens Park
        2: [35.1635, 129.0620], // Near Song Sang-hyeon Square
        3: [35.1610, 129.0550], // Near Seomyeon
        4: [35.1685, 129.0595]  // Another spot
    };

    const createCustomIcon = (id, isSelected, color) => {
        const fill = isSelected ? color : "#888";
        // Using renderToString or just template literal for simple SVG
        const svgHtml = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="${fill}" stroke="#fff" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3" fill="#fff"></circle>
            </svg>
        `;
        return L.divIcon({
            className: 'custom-map-icon',
            html: svgHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 40], // Tip of the pin
            popupAnchor: [0, -40]
        });
    };

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
                <MapContainer
                    center={[35.165, 129.058]}
                    zoom={15}
                    style={{ height: '100%', width: '100%', outline: 'none' }}
                    zoomControl={false}
                >
                    <MapClickHandler onClick={(e) => {
                        if (isDropdownOpen) {
                            setIsDropdownOpen(false);
                            return;
                        }
                        // Create custom pin
                        setCustomPin(e.latlng);
                        setSelectedPin('custom');
                    }} />

                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {[1, 2, 3, 4].map((id) => (
                        <Marker
                            key={id}
                            position={mockCoordinates[id]}
                            icon={createCustomIcon(id, selectedPin === id, primaryColor)}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e.originalEvent); // Stop propagation
                                    handlePinClick(id);
                                }
                            }}
                        />
                    ))}

                    {/* Custom Pin Marker */}
                    {customPin && (
                        <Marker
                            position={customPin}
                            icon={createCustomIcon('custom', selectedPin === 'custom', primaryColor)}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e.originalEvent);
                                    handlePinClick('custom');
                                }
                            }}
                        />
                    )}
                </MapContainer>
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
                                    {selectedPin === 'custom' ? '사용자 지정 위치' : '부산 부산진구 초연로 6'}
                                </div>
                            </div>

                            {/* Detail Row */}
                            <div className="panel-detail-row">
                                <div className="badge">지번</div>
                                <span>{selectedPin === 'custom' ? '지정된 위치' : '초읍동 676'}</span>
                                <div className="badge" style={{ marginLeft: '8px' }}>우편</div>
                                <span>{selectedPin === 'custom' ? '-' : '47107'}</span>
                            </div>

                            {/* Place Name */}
                            <div className="panel-place-name">
                                {selectedPin === 'custom' ? '새로운 진단 장소' : '포레나부산초읍'}
                            </div>
                        </div>

                        {/* Action Button - Outside the card */}
                        <button
                            className="btn-diagnose"
                            style={{
                                backgroundColor: primaryColor,
                                boxShadow: `0 4px 12px ${diagnosisType === 'expert' ? 'rgba(84, 42, 163, 0.3)' : 'rgba(230, 35, 90, 0.3)'}`
                            }}
                            onClick={() => onNext(diagnosisType)}
                        >
                            진단하기
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Diagnosis;
