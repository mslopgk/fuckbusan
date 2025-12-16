import React, { useState, useEffect } from 'react';
import { MapContainer, GeoJSON, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// import * as turf from '@turf/turf'; // Unused

// Fix for default Leaflet markers if needed
delete L.Icon.Default.prototype._getIconUrl;
try {
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
} catch (e) { console.warn("L.Icon fix error", e); }

// Custom Icon
const peopleIcon = new L.Icon({
    iconUrl: '/assets/people.png',
    iconSize: [80, 80],
    iconAnchor: [40, 65], // Y=65 means bottom part is at center -> shifts image UP by ~25px
    popupAnchor: [0, -65]
});

// Mobile Icon: Smaller and slightly higher
const peopleIconMobile = new L.Icon({
    iconUrl: '/assets/people.png',
    iconSize: [60, 60], // Increased from 50x50
    iconAnchor: [30, 55], // X=30 (center), Y=55 (near bottom) -> lifts image up
    popupAnchor: [0, -55]
});

// Component to fit map bounds to GeoJSON
const BoundsFitter = ({ data }) => {
    const map = useMap();
    useEffect(() => {
        if (data) {
            const geoJsonLayer = L.geoJSON(data);
            map.fitBounds(geoJsonLayer.getBounds(), { padding: [10, 10] });
        }
    }, [data, map]);
    return null;
};

const InteractiveMap = () => {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState('부산진구'); // Default to '부산진구'
    const selectedDistrictRef = React.useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        selectedDistrictRef.current = selectedDistrict;
    }, [selectedDistrict]);

    useEffect(() => {
        fetch('/assets/busan_districts_high.json')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error("Error loading map data:", err));
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Function to determine style based on state
    const getStyle = (feature) => {
        const isSelected = selectedDistrict === feature.properties.name;
        return {
            fillColor: isSelected ? '#E6235A' : 'white',
            weight: isSelected ? 2 : 1,
            opacity: 1,
            color: isSelected ? '#E6235A' : '#333',
            fillOpacity: 1
        };
    };

    // Manual offsets 
    const desktopOffsets = {
        '강서구': [100, -130], // Slightly down
        '사하구': [-10, -90],  // Slightly down
        '서구': [-5, -55],
        '영도구': [-20, 5],
        '남구': [-15, -40],
        '동구': [5, 0],
        '중구': [0, 10],
        '기장군': [-10, 10],
        '북구': [0, 0]
    };

    const mobileOffsets = {
        '강서구': [140, -190], // Slightly down
        '사하구': [-10, -150], // Slightly down
        '서구': [-5, -90],
        '영도구': [-35, -5],
        '남구': [-25, -50],
        '동구': [5, 0],
        '중구': [0, 5],
        '기장군': [-10, 10],
        '북구': [0, 0]
    };

    const labelOffsets = isMobile ? mobileOffsets : desktopOffsets;

    const onEachDistrict = (feature, layer) => {
        const districtName = feature.properties.name;
        const offset = labelOffsets[districtName] || [0, 0];

        layer.bindTooltip(districtName, {
            permanent: true,
            direction: 'center',
            offset: L.point(offset),
            className: `district-label`
        });

        layer.on({
            mouseover: (e) => {
                const currentSelection = selectedDistrictRef.current;
                if (currentSelection !== districtName) {
                    e.target.setStyle({
                        fillColor: '#f5f5f5',
                        fillOpacity: 1,
                        weight: 1
                    });
                }
            },
            mouseout: (e) => {
                const currentSelection = selectedDistrictRef.current;
                const isSelected = currentSelection === districtName;

                e.target.setStyle({
                    fillColor: isSelected ? '#E6235A' : 'white',
                    fillOpacity: 1,
                    weight: isSelected ? 2 : 1,
                    color: isSelected ? '#E6235A' : '#333'
                });
            },
            click: (e) => {
                const currentSelection = selectedDistrictRef.current;
                if (currentSelection !== districtName) {
                    setSelectedDistrict(districtName);
                }
            },
        });
    };

    // Effect to update tooltip classes
    const geoJsonRef = React.useRef(null);
    useEffect(() => {
        if (geoJsonRef.current) {
            geoJsonRef.current.setStyle(getStyle);
            geoJsonRef.current.eachLayer(layer => {
                const name = layer.feature.properties.name;
                const tooltip = layer.getTooltip();
                if (tooltip) {
                    const el = tooltip.getElement();
                    if (el) {
                        if (name === selectedDistrict) {
                            el.classList.add('active');
                        } else {
                            el.classList.remove('active');
                        }
                    }
                }
            });
        }
    }, [selectedDistrict]);

    // Calculate center of selected district
    const getCenterOfDistrict = (districtName) => {
        if (!geoJsonData) return null;
        const feature = geoJsonData.features.find(f => f.properties.name === districtName);
        if (!feature) return null;

        // Leaflet bounds center (fast and adequate for maps)
        const layer = L.geoJSON(feature);
        return layer.getBounds().getCenter();
    };

    const selectedCenter = selectedDistrict ? getCenterOfDistrict(selectedDistrict) : null;

    if (!geoJsonData) return null;

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <style>
                {`
                    .district-label {
                        background: transparent;
                        border: none;
                        box-shadow: none;
                        font-family: 'GmarketSans', sans-serif;
                        font-weight: 500;
                        font-size: 12px;
                        color: #555;
                        text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;
                    }
                    .district-label.active {
                        color: white;
                        text-shadow: none;
                    }
                `}
            </style>
            <MapContainer
                center={[35.1795543, 129.0756416]}
                zoom={11}
                scrollWheelZoom={false}
                zoomControl={false}
                doubleClickZoom={false}
                dragging={false}
                attributionControl={false}
                style={{ height: '100%', width: '100%', background: 'transparent' }}
            >
                <BoundsFitter data={geoJsonData} />
                <GeoJSON
                    ref={geoJsonRef}
                    data={geoJsonData}
                    style={getStyle}
                    onEachFeature={onEachDistrict}
                />

                {/* People icon hidden as requested */}
                {/* {selectedCenter && (
                    <Marker position={selectedCenter} icon={isMobile ? peopleIconMobile : peopleIcon} interactive={false} />
                )} */}
            </MapContainer>
        </div>
    );
};

export default InteractiveMap;
