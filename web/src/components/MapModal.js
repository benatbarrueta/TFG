import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglar el ícono del marcador
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position ? <Marker position={position} /> : null;
};

const MapModal = ({ isOpen, onClose, onLocationSelect }) => {
    const [position, setPosition] = React.useState(null);

    if (!isOpen) return null;

    return (
        <div className="map-modal-overlay">
            <div className="map-modal">
                <h3>Selecciona la ubicación</h3>
                <MapContainer
                    center={[40.416775, -3.703790]} // Centro en España
                    zoom={6}
                    style={{ height: '400px', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
                <div className="map-modal-buttons">
                    <button 
                        className="boton-consultar"
                        onClick={() => {
                            if (position) {
                                onLocationSelect(position[0], position[1]);
                                onClose();
                            } else {
                                alert('Por favor, selecciona una ubicación en el mapa');
                            }
                        }}
                    >
                        Guardar ubicación
                    </button>
                    <button className="boton-consultar" onClick={onClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapModal; 