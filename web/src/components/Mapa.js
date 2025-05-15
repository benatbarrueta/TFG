import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../styles/Mapa.css';
import { useNavigate } from 'react-router-dom';
import { useToken } from './Auth/tokenContext';

const MapaQGIS = () => {
    const navigate = useNavigate();
    const { userEmail } = useToken();
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const accuracyCircleRef = useRef(null);
    const photosMarkersRef = useRef([]);
    const [locationPermissionStatus, setLocationPermissionStatus] = useState('prompt');

    const handlePhotoClick = (imageUrl, imageName) => {
        navigate('/finder', { 
            state: { 
                imageUrl,
                imageName: imageName || 'Imagen sin identificar',
                fromMap: true
            } 
        });
    };

    // Función para verificar el estado de los permisos de ubicación
    const checkLocationPermission = async () => {
        try {
            // Verificar si el navegador soporta la API de permisos
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                setLocationPermissionStatus(result.state);
                
                // Escuchar cambios en el estado de los permisos
                result.addEventListener('change', () => {
                    setLocationPermissionStatus(result.state);
                });

                return result.state;
            } else {
                // Si no soporta la API de permisos, verificar si tiene geolocalización
                return navigator.geolocation ? 'prompt' : 'denied';
            }
        } catch (error) {
            console.error('Error al verificar permisos:', error);
            return 'denied';
        }
    };

    // Función para solicitar permisos y obtener la ubicación
    const requestLocationPermission = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('La geolocalización no está soportada por este navegador.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve(position);
                },
                (error) => {
                    console.error('Error al obtener la ubicación:', error);
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            reject(new Error('Has denegado el permiso de ubicación. Por favor, habilítalo en la configuración de tu navegador.'));
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject(new Error('La información de ubicación no está disponible.'));
                            break;
                        case error.TIMEOUT:
                            reject(new Error('Se ha agotado el tiempo de espera para obtener la ubicación.'));
                            break;
                        default:
                            reject(new Error('Ha ocurrido un error desconocido al obtener la ubicación.'));
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    };

    // Función para cargar y mostrar las fotos en el mapa
    const loadPhotosLocations = async () => {
        if (!mapRef.current || !userEmail) return;

        try {
            console.log("Email del usuario:", userEmail);
            const response = await axios.get('https://ecotrack.es/nature/getPhotosByUsername/' + userEmail);
            const photos = Array.isArray(response.data.result) ? response.data.result : [];
            console.log("Fotos recibidas:", photos);

            // Limpiar marcadores anteriores de fotos
            photosMarkersRef.current.forEach(marker => {
                marker.remove();
            });
            photosMarkersRef.current = [];

            // Crear icono personalizado para las fotos
            const photoIcon = window.L.divIcon({
                className: 'photo-marker',
                html: '<div class="photo-icon"></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            // Agregar marcadores para cada foto
            if (photos.length > 0) {
                photos.forEach(photo => {
                    if (!photo.latitude || !photo.longitude) {
                        console.warn('Foto sin coordenadas válidas:', photo);
                        return;
                    }

                    // Convertir la imagen base64 a URL
                    const imageUrl = `data:image/jpeg;base64,${photo.base64}`;
                    const photoId = `photo-${Date.now()}-${Math.random()}`;
                    
                    const marker = window.L.marker([photo.latitude, photo.longitude], {
                        icon: photoIcon
                    }).addTo(mapRef.current);

                    // Añadir popup con información de la foto
                    const popupContent = document.createElement('div');
                    popupContent.className = 'photo-popup';
                    popupContent.innerHTML = `
                        <h3>${photo.imageName || 'Foto sin título'}</h3>
                        <img src="${imageUrl}" alt="Foto de la ubicación" style="width: 200px; max-height: 200px; object-fit: cover;"/>
                        <button id="${photoId}" class="consultar-foto-btn">
                            Consultar esta foto
                        </button>
                    `;

                    marker.bindPopup(popupContent);

                    // Agregar el event listener después de que el popup se abra
                    marker.on('popupopen', () => {
                        const button = document.getElementById(photoId);
                        if (button) {
                            button.addEventListener('click', () => handlePhotoClick(imageUrl, photo.imageName));
                        }
                    });

                    photosMarkersRef.current.push(marker);
                });
            } else {
                console.log('No se encontraron fotos para mostrar');
            }
        } catch (error) {
            console.error('Error al cargar las fotos:', error);
        }
    };

    useEffect(() => {
        // Función para inicializar el mapa
        const initMap = (initialPosition = [43.2630, -2.9350], accuracy = 0, isDefaultLocation = true) => {
            if (window.L && !mapRef.current) {
                // Inicializamos el mapa con la posición proporcionada
                mapRef.current = window.L.map('map', {
                    zoomControl: false,
                    maxZoom: 19,
                    minZoom: 3
                }).setView(initialPosition, 12);

                // Agregar capa base de OpenStreetMap usando HTTPS
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19,
                    crossOrigin: true
                }).addTo(mapRef.current);

                // Agregar control de zoom
                window.L.control.zoom({
                    position: 'topleft'
                }).addTo(mapRef.current);

                // Solo agregar el waypoint y el círculo de precisión si no es la ubicación por defecto
                if (!isDefaultLocation) {
                    // Agregar un waypoint en la ubicación inicial
                    agregarWaypoint(initialPosition[0], initialPosition[1], 'Mi ubicación');

                    // Agregar círculo de precisión si hay accuracy
                    if (accuracy > 0) {
                        accuracyCircleRef.current = window.L.circle(initialPosition, {
                            radius: accuracy,
                            color: '#3498db',
                            fillColor: '#3498db',
                            fillOpacity: 0.15,
                            weight: 1
                        }).addTo(mapRef.current);
                    }
                }

                // Cargar las fotos una vez que el mapa esté inicializado
                loadPhotosLocations();

                // Configurar actualización automática de fotos cada 30 segundos
                const autoUpdateInterval = setInterval(() => {
                    loadPhotosLocations();
                }, 30000); // 30 segundos

                // Limpiar el intervalo cuando el componente se desmonte
                return () => clearInterval(autoUpdateInterval);
            }
        };

        // Función para inicializar el mapa con la ubicación
        const initMapWithLocation = async () => {
            try {
                const permissionStatus = await checkLocationPermission();
                
                if (permissionStatus === 'denied') {
                    console.warn('Permisos de ubicación denegados');
                    initMap(undefined, 0, true); // Inicializar con ubicación por defecto
                    return;
                }

                try {
                    const position = await requestLocationPermission();
                    const { latitude, longitude, accuracy } = position.coords;
                    initMap([latitude, longitude], accuracy, false); // Inicializar con ubicación real
                } catch (error) {
                    console.error('Error al obtener la ubicación:', error);
                    alert(error.message);
                    initMap(undefined, 0, true); // Inicializar con ubicación por defecto
                }
            } catch (error) {
                console.error('Error al verificar permisos:', error);
                initMap(undefined, 0, true); // Inicializar con ubicación por defecto
            }
        };

        // Función para actualizar la ubicación y el círculo de precisión
        const updateLocationAndAccuracy = (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Actualizar marcador
            if (markersRef.current.length > 0) {
                const marker = markersRef.current[0];
                marker.setLatLng([latitude, longitude]);
                marker.getPopup().setContent(`
                    <div class="waypoint-popup">
                        <h3>Mi ubicación</h3>
                        <p>Lat: ${latitude.toFixed(6)}</p>
                        <p>Lng: ${longitude.toFixed(6)}</p>
                        <p>Precisión: ±${Math.round(accuracy)} metros</p>
                    </div>
                `);
            }

            // Actualizar círculo de precisión
            if (accuracyCircleRef.current) {
                accuracyCircleRef.current.setLatLng([latitude, longitude]);
                accuracyCircleRef.current.setRadius(accuracy);
            } else {
                accuracyCircleRef.current = window.L.circle([latitude, longitude], {
                    radius: accuracy,
                    color: '#3498db',
                    fillColor: '#3498db',
                    fillOpacity: 0.15,
                    weight: 1
                }).addTo(mapRef.current);
            }

            // Centrar el mapa en la nueva ubicación
            mapRef.current.setView([latitude, longitude]);
        };

        // Modificar loadLeaflet para usar la nueva función de inicialización
        const loadLeaflet = () => {
            // Cargar CSS de Leaflet
            const leafletCSS = document.createElement('link');
            leafletCSS.rel = 'stylesheet';
            leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(leafletCSS);

            const scriptElement = document.createElement('script');
            scriptElement.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            scriptElement.onload = () => {
                initMapWithLocation();
            };
            document.body.appendChild(scriptElement);
        };

        loadLeaflet();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [navigate, userEmail]);

    // Función para agregar un waypoint
    const agregarWaypoint = (lat, lng, titulo) => {
        if (!mapRef.current) return;

        // Crear ícono personalizado para el waypoint
        const waypointIcon = window.L.divIcon({
            className: 'waypoint-marker',
            html: '<div class="waypoint-icon"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        // Crear el marcador
        const marker = window.L.marker([lat, lng], {
            icon: waypointIcon,
            draggable: true
        }).addTo(mapRef.current);

        // Agregar popup con información
        marker.bindPopup(`
            <div class="waypoint-popup">
                <h3>${titulo}</h3>
                <p>Lat: ${lat.toFixed(6)}</p>
                <p>Lng: ${lng.toFixed(6)}</p>
                <button onclick="this.closest('.leaflet-popup').remove()">Eliminar</button>
            </div>
        `);

        // Evento para cuando se arrastra el marcador
        marker.on('dragend', (e) => {
            const newLat = e.target.getLatLng().lat;
            const newLng = e.target.getLatLng().lng;
            marker.getPopup().setContent(`
                <div class="waypoint-popup">
                    <h3>${titulo}</h3>
                    <p>Lat: ${newLat.toFixed(6)}</p>
                    <p>Lng: ${newLng.toFixed(6)}</p>
                    <button onclick="this.closest('.leaflet-popup').remove()">Eliminar</button>
                </div>
            `);
        });

        markersRef.current.push(marker);
        return marker;
    };

    // Función para eliminar un waypoint
    const eliminarWaypoint = (marker) => {
        if (mapRef.current && marker) {
            mapRef.current.removeLayer(marker);
            markersRef.current = markersRef.current.filter(m => m !== marker);
        }
    };

    // Función para obtener la ubicación actual
    const obtenerUbicacionActual = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    agregarWaypoint(latitude, longitude, 'Mi ubicación');
                    mapRef.current.setView([latitude, longitude], 15);
                },
                (error) => {
                    console.error('Error al obtener la ubicación:', error);
                    alert('No se pudo obtener tu ubicación');
                }
            );
        } else {
            alert('Tu navegador no soporta la geolocalización');
        }
    };

    return (
        <div className='body'>
            <div id="map" style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
};

export default MapaQGIS;