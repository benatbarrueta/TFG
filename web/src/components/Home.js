import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import "../styles/Home.css";
import lupa from "../styles/images/lupa.png";
import mapa from "../styles/images/mapa.png";
import { useToken } from './Auth/tokenContext';

const Home = () => {
  const navigate = useNavigate();
  const { userEmail } = useToken();
  const mapRef = useRef(null);
  const photosMarkersRef = useRef([]);
  const locationMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  const services = [
    { path: "/camera", image: lupa, label: "Buscador" },
    { path: "/map", image: mapa, label: "Mapa" },
  ];

  // Función para verificar el estado de los permisos de ubicación
  const checkLocationPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
      }
      return navigator.geolocation ? 'prompt' : 'denied';
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return 'denied';
    }
  };

  // Función para obtener y mostrar la ubicación del usuario
  const showUserLocation = () => {
    if (!mapRef.current || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Crear icono personalizado para la ubicación
        const locationIcon = window.L.divIcon({
          className: 'location-marker',
          html: '<div class="location-icon"></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        // Actualizar o crear el marcador de ubicación
        if (locationMarkerRef.current) {
          locationMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          locationMarkerRef.current = window.L.marker([latitude, longitude], {
            icon: locationIcon
          }).addTo(mapRef.current);
        }

        // Actualizar o crear el círculo de precisión
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

        // Centrar el mapa en la ubicación del usuario
        mapRef.current.setView([latitude, longitude], 13);
      },
      (error) => {
        console.error('Error al obtener la ubicación:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // Función para cargar y mostrar las fotos en el mapa
  const loadPhotosLocations = async () => {
    if (!mapRef.current || !userEmail) return;

    try {
      const response = await axios.get('http://localhost:8000/nature/getPhotosByUsername/' + userEmail);
      const photos = Array.isArray(response.data.result) ? response.data.result : [];

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

          const imageUrl = `data:image/jpeg;base64,${photo.base64}`;
          const photoId = `photo-${Date.now()}-${Math.random()}`;
          
          const marker = window.L.marker([photo.latitude, photo.longitude], {
            icon: photoIcon
          }).addTo(mapRef.current);

          // Crear el contenido del popup
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
              button.addEventListener('click', () => {
                navigate('/finder', { 
                  state: { 
                    imageUrl,
                    imageName: photo.imageName || 'Imagen sin identificar',
                    fromMap: true
                  } 
                });
              });
            }
          });

          photosMarkersRef.current.push(marker);
        });
      }
    } catch (error) {
      console.error('Error al cargar las fotos:', error);
    }
  };

  useEffect(() => {
    const initMap = async () => {
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(linkElement);

      const scriptElement = document.createElement('script');
      scriptElement.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      scriptElement.onload = async () => {
        if (window.L && !mapRef.current) {
          // Inicializamos el mapa con la posición de Bilbao
          mapRef.current = window.L.map('preview-map', {
            zoomControl: false,
            maxZoom: 19,
            minZoom: 3
          }).setView([43.2630, -2.9350], 13);

          // Agregar capa base de OpenStreetMap
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            crossOrigin: true
          }).addTo(mapRef.current);

          // Verificar permisos y mostrar ubicación si está permitido
          const permissionStatus = await checkLocationPermission();
          if (permissionStatus === 'granted') {
            showUserLocation();
          }

          // Cargar las fotos
          loadPhotosLocations();

          // Actualizar fotos cada 30 segundos
          const autoUpdateInterval = setInterval(loadPhotosLocations, 30000);
          return () => clearInterval(autoUpdateInterval);
        }
      };
      document.body.appendChild(scriptElement);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [navigate, userEmail]);

  return (
    <div className="home-container">
      <h1 className="home-title">Bienvenido a EcoTrack</h1>
      <p className="home-subtitle">Selecciona un servicio para comenzar</p>
      
      <div className="home-grid">
        {services.map((service, index) => (
          <Link key={index} to={service.path} className="home-card">
            <img src={service.image} alt={service.label} className="home-image" />
            <p>{service.label}</p>
          </Link>
        ))}
      </div>

      <div id="preview-map" className="home-map-preview"></div>
    </div>
  );
};

export default Home;
