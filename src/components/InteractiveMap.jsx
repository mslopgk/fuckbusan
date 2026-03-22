import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, GeoJSON, useMap, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Manual offsets for specific labels [latOffset, lngOffset] - User's latest values
const labelOffsets = {
    '강서구': [0.14, 0.15],
    '사하구': [0.11, -0.011],
    '서구': [0.07, 0],
    '영도구': [0, -0.04],
    '남구': [0.04, -0.02],
    '연제구': [0.005, 0],
    '해운대구': [-0.015, -0.005]
};

const InteractiveMap = () => {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState('부산진구');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        // Load high-fidelity GeoJSON
        fetch('/assets/busan_districts_high.json')
            .then(res => res.json())
            .then(data => setGeoJsonData(data));

        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const onEachFeature = (feature, layer) => {
        const name = feature.properties.name;

        layer.on({
            click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                setSelectedDistrict(name);
            },
            mouseover: (e) => {
                const layer = e.target;
                if (name !== selectedDistrict) {
                    layer.setStyle({
                        fillColor: '#e0f7f6', // Light mint hover
                        fillOpacity: 1
                    });
                }
            },
            mouseout: (e) => {
                const layer = e.target;
                if (name !== selectedDistrict) {
                    layer.setStyle({
                        fillColor: '#ffffff',
                        fillOpacity: 1
                    });
                }
            }
        });
    };

    const districtStyle = (feature) => {
        const isSelected = feature.properties.name === selectedDistrict;
        return {
            fillColor: isSelected ? '#16B5B0' : '#ffffff',
            weight: 0.8,
            opacity: 0.6,
            color: '#444',
            fillOpacity: 1,
        };
    };

    const BoundsFitter = ({ data }) => {
        const map = useMap();
        useEffect(() => {
            if (data) {
                const geoJsonLayer = L.geoJSON(data);
                map.fitBounds(geoJsonLayer.getBounds(), { padding: [5, 5] });
            }
        }, [data, map]);
        return null;
    };

    const getLabelPosition = (feature) => {
        const name = feature.properties.name;
        const coords = feature.geometry.coordinates;
        let points = [];
        if (feature.geometry.type === 'Polygon') points = coords[0];
        else if (feature.geometry.type === 'MultiPolygon') points = coords[0][0];

        const latLongs = points.map(p => [p[1], p[0]]);
        const bounds = L.latLngBounds(latLongs);
        const center = bounds.getCenter();

        const offset = labelOffsets[name] || [0, 0];
        return [center.lat + offset[0], center.lng + offset[1]];
    };

    if (!geoJsonData) return null;

    return (
        <div className="option2-map-container" style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '20px',
            overflow: 'visible'
        }}>
            <style>
                {`
                    .leaflet-container {
                        background: transparent !important;
                    }
                    .district-label-tooltip {
                        background: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                        color: #1a1a1a !important; /* Default Black */
                        font-family: 'GmarketSans', sans-serif !important;
                        font-weight: 500 !important;
                        font-size: ${isMobile ? '10px' : '12px'} !important;
                        text-shadow: 0px 0px 4px #fff, 0px 0px 4px #fff !important;
                        white-space: nowrap !important;
                        pointer-events: none !important;
                        opacity: 1 !important; /* Ensure no transparency */
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    .district-label-tooltip.selected {
                        color: #ffffff !important; /* Selected White */
                        text-shadow: 0px 0px 4px rgba(0,0,0,0.2) !important;
                        font-weight: 600 !important;
                        z-index: 1000 !important; /* Bring to front when selected */
                        opacity: 1 !important;
                    }
                    .selected-person-icon {
                        width: ${isMobile ? '60px' : '80px'} !important;
                        max-width: none !important; /* <--- root cause fix: allow icon to be wider than text */
                        height: auto !important;
                        margin-bottom: 4px !important;
                        filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.2));
                        opacity: 1 !important; /* Ensure icon is fully opaque */
                    }
                    .invisible-marker {
                        opacity: 0;
                        pointer-events: none;
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
                style={{ height: '100%', width: '100%' }}
            >
                <BoundsFitter data={geoJsonData} />
                <GeoJSON
                    key={`geojson-${selectedDistrict}`} // Force full re-render on selection
                    data={geoJsonData}
                    style={districtStyle}
                    onEachFeature={onEachFeature}
                />

                {geoJsonData.features.map(feature => {
                    const name = feature.properties.name;
                    const isSelected = name === selectedDistrict;
                    const pos = getLabelPosition(feature);

                    return (
                        <Marker
                            key={`marker-${name}-${isSelected}`}
                            position={pos}
                            icon={L.divIcon({ className: 'invisible-marker' })}
                        >
                            <Tooltip
                                permanent
                                direction="center"
                                offset={isSelected ? [0, isMobile ? -26 : -35] : [0, 0]}
                                className={`district-label-tooltip ${isSelected ? 'selected' : ''}`}
                            >
                                {isSelected && (
                                    <img
                                        src={isMobile ? "/people.png" : "/people2.png"}
                                        alt="selected"
                                        className="selected-person-icon"
                                    />
                                )}
                                <span>{name}</span>
                            </Tooltip>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default InteractiveMap;
