import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Reusable Location Selector Component
const LocationSelector = ({ onLocationSelect, initialLocation, refreshKey }) => {
    const [position, setPosition] = useState(initialLocation || null);
    const [isLoading, setIsLoading] = useState(!initialLocation);

    const defaultCenter = [35.165, 129.058];

    const ChangeView = ({ center }) => {
        const map = useMap();
        useEffect(() => {
            if (center) {
                map.setView(center, 17);
            }
        }, [center, map]);
        return null;
    };

    const fetchAddress = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ko`);
            if (!response.ok) throw new Error("API limit or error");
            const data = await response.json();
            const address = data.display_name || "주소를 찾을 수 없습니다.";
            if (onLocationSelect) {
                onLocationSelect({ lat, lng, address });
            }
        } catch (error) {
            console.error("Address fetch error:", error);
            if (onLocationSelect) {
                onLocationSelect({ lat, lng, address: "주소 정보 확인 불가 (수동 입력 필요)" });
            }
        }
    };

    const findLocation = () => {
        if (!navigator.geolocation) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos = { lat: latitude, lng: longitude };
                setPosition(newPos);
                fetchAddress(latitude, longitude);
                setIsLoading(false);
            },
            (err) => {
                console.error("Geolocation error:", err);
                setIsLoading(false);
                if (err.code === 1) {
                    alert("위치 정보 접근 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.");
                }
            },
            options
        );
    };

    useEffect(() => {
        findLocation();
    }, [initialLocation, refreshKey]);

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                fetchAddress(e.latlng.lat, e.latlng.lng);
            },
        });

        return position === null ? null : (
            <Marker position={position} icon={createDefaultIcon()} />
        );
    };

    const createDefaultIcon = () => {
        const svgHtml = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#16B5B0" stroke="#fff" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3" fill="#fff"></circle>
            </svg>
        `;
        return L.divIcon({
            className: 'custom-map-icon',
            html: svgHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });
    };

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '0', overflow: 'hidden', position: 'relative' }}>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                }}>
                    <div className="pf-map-loading-spinner"></div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>현 위치를 찾는 중입니다...</span>
                </div>
            )}
            <MapContainer
                center={defaultCenter}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <ChangeView center={position} />
                <TileLayer
                    attribution='&copy; <a href="http://www.vworld.kr/">VWorld</a> contributors'
                    url="https://api.vworld.kr/req/wmts/1.0.0/38F34106-A7C8-3457-ACDF-5C12CF09604A/Base/{z}/{y}/{x}.png"
                />
                <LocationMarker />
            </MapContainer>
        </div>
    );
};

export default LocationSelector;
