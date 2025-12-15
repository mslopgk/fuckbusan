import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Reusable Location Selector Component
// Props:
// - onLocationSelect: ({ lat, lng, address }) => void
// - initialLocation: { lat, lng } (optional)
const LocationSelector = ({ onLocationSelect, initialLocation }) => {
    const [position, setPosition] = useState(initialLocation || null);

    // Default center (Busanjin-gu, same as Diagnosis)
    const defaultCenter = [35.165, 129.058];

    // Component to re-center map when position changes (e.g. GPS found)
    const ChangeView = ({ center }) => {
        const map = useMap();
        useEffect(() => {
            if (center) {
                map.setView(center, 15); // Zoom to 15 when centered
            }
        }, [center, map]);
        return null;
    };

    // Helper to fetch address from Coordinates (Reverse Geocoding)
    const fetchAddress = async (lat, lng) => {
        try {
            // Using OSM Nominatim (Free, Rate limited)
            // For production, consider Google Maps or Kakao Maps API
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ko`);
            const data = await response.json();

            const address = data.display_name || "주소를 찾을 수 없습니다.";

            if (onLocationSelect) {
                onLocationSelect({ lat, lng, address });
            }
        } catch (error) {
            console.error("Address fetch error:", error);
            if (onLocationSelect) {
                onLocationSelect({ lat, lng, address: `위도: ${lat.toFixed(4)}, 경도: ${lng.toFixed(4)}` });
            }
        }
    };

    // Geographic Location (GPS) on Mount
    useEffect(() => {
        if (!initialLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const newPos = { lat: latitude, lng: longitude };
                    setPosition(newPos);
                    fetchAddress(latitude, longitude);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    // Fallback to default behavior (do nothing, user picks manually)
                },
                { enableHighAccuracy: true }
            );
        }
    }, [initialLocation]);

    // Helper to handle clicks
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
        // Simple red pin SVG
        const svgHtml = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#E6235A" stroke="#fff" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
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
        <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
            <MapContainer
                center={defaultCenter}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <ChangeView center={position} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker />
            </MapContainer>
        </div>
    );
};

export default LocationSelector;
