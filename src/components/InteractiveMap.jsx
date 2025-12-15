import React, { useState, useEffect } from 'react';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers if needed (though we only use Poly)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const selectedDistrictRef = React.useRef(null);

    useEffect(() => {
        selectedDistrictRef.current = selectedDistrict;
    }, [selectedDistrict]);

    useEffect(() => {
        fetch('/assets/busan_districts_high.json')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error("Error loading map data:", err));
    }, []);

    // Function to determine style based on state
    const getStyle = (feature) => {
        const isSelected = selectedDistrict === feature.properties.name;
        return {
            fillColor: isSelected ? '#E6235A' : 'white',
            weight: isSelected ? 2 : 1,
            opacity: 1,
            color: isSelected ? '#E6235A' : '#333', // Border color
            fillOpacity: 1 // Solid white or solid pink
        };
    };

    // Manual offsets for specific districts based on visual feedback center: [0, 0] is default
    // User feedback (Round 3): 
    // Gangseo: More Up + Right
    // Saha: More Up
    // Seo: More Up
    // Dong: Little Right
    // Jung: Little Down
    // Yeongdo: Little Left + Little Down
    // Nam: Up
    const labelOffsets = {
        '강서구': [40, -50],    // More Right, Much More Up
        '사하구': [-10, -40],   // Much More Up
        '서구': [-5, -25],      // More Up
        '영도구': [-20, 5],     // Left, Down (relative to previous -10 is down)
        '남구': [0, -30],       // More Up
        '동구': [5, 0],         // Right
        '중구': [0, 10],        // Down
        '기장군': [-10, 10],
        '북구': [0, 0]
    };

    const onEachDistrict = (feature, layer) => {
        const districtName = feature.properties.name;
        const offset = labelOffsets[districtName] || [0, 0];

        // Bind Label Tooltip
        layer.bindTooltip(districtName, {
            permanent: true,
            direction: 'center',
            offset: L.point(offset),
            className: `district-label`
        });

        // Effect to update tooltip class when selection changes (since bindTooltip is once)
        // We can't easily update class on existing tooltip without re-bind or ref manipulation.
        // Instead, rely on CSS :hover or just the fill color change which is reactive via style prop.
        // Actually, for the TEXT color to change to white, we need the class.
        // React-leaflet doesn't re-run this.
        // Workaround: We will use a unique key on MapContainer or GeoJSON to force re-render? No, too heavy.
        // Better: We add a listener to the layer to update tooltip class?
        // Let's stick to just Map Color for now, and handle Text Color via CSS targeting the parent group if possible, or accept it might lag slightly?
        // Actually, the `style` prop handles the polygon color. The Text color is inside the tooltip `div`.
        // We can access the tooltip from the layer.

        layer.on({
            mouseover: (e) => {
                const currentSelection = selectedDistrictRef.current;
                if (currentSelection !== districtName) {
                    // Hover effect for unselected: Light Grey
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

                // Force reset to correct state based on selection REF
                e.target.setStyle({
                    fillColor: isSelected ? '#E6235A' : 'white',
                    fillOpacity: 1,
                    weight: isSelected ? 2 : 1,
                    color: isSelected ? '#E6235A' : '#333'
                });
            },
            click: (e) => {
                const currentSelection = selectedDistrictRef.current;
                // Radio selection behavior
                if (currentSelection !== districtName) {
                    setSelectedDistrict(districtName);
                }
            },
            // Update tooltip class when generic 'click' happens anywhere? 
            // Better: use a useEffect in component to find layers and update tooltips.
        });
    };

    // Effect to update styles and tooltip classes when selection changes
    const geoJsonRef = React.useRef(null);
    useEffect(() => {
        if (geoJsonRef.current) {
            geoJsonRef.current.setStyle(getStyle); // Re-apply styles

            // Manually update tooltips
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
                        font-weight: 500; /* Medium weight */
                        font-size: 12px; /* Reduced size */
                        color: #555; /* Slightly softer black */
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
                dragging={false} // Static map feel for hero
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
            </MapContainer>
        </div>
    );
};

export default InteractiveMap;
