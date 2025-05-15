import React, { useEffect, useRef, useState } from 'react';
import '../styles/Camara.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt, faCameraRotate, faImage } from '@fortawesome/free-solid-svg-icons';

const Camara = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [devices, setDevices] = useState([]);
    const [currentDeviceId, setCurrentDeviceId] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const streamRef = useRef(null);
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    // Efecto para manejar la visibilidad de la página
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && streamRef.current) {
                // Si la página está oculta, detener la cámara
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            } else if (!document.hidden && currentDeviceId) {
                // Si la página vuelve a estar visible, reiniciar la cámara
                openCamera();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Limpiar el stream al desmontar
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [currentDeviceId]);

    const openCamera = async () => {
        try {
            // Detener cualquier stream existente
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { deviceId: currentDeviceId } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (error) {
            console.error('Error al acceder a la cámara:', error);
        }
    };

    // Obtener dispositivos y abrir cámara al montar
    useEffect(() => {
        const initializeCamera = async () => {
            try {
                // Intentamos acceder directamente a la cámara
                // Esto mostrará automáticamente el diálogo de permisos si es necesario
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                
                // Detenemos el stream temporal para obtener los dispositivos
                stream.getTracks().forEach(track => track.stop());
                
                // Ahora obtenemos los dispositivos
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
                
                if (videoDevices.length > 0) {
                    setCurrentDeviceId(videoDevices[0].deviceId);
                }
            } catch (error) {
                console.error('Error al inicializar la cámara:', error);
            }
        };

        initializeCamera();
    }, []);

    useEffect(() => {
        if (currentDeviceId) {
            openCamera();
        }
    }, [currentDeviceId]);

    const toggleCamera = () => {
        if (devices.length > 1) {
            const currentIndex = devices.findIndex(device => device.deviceId === currentDeviceId);
            const nextIndex = (currentIndex + 1) % 2;
            setCurrentDeviceId(devices[nextIndex].deviceId);
            setIsFrontCamera(!isFrontCamera);
        }
    };

    const takePhoto = () => {
        if (canvasRef.current && videoRef.current) {
            const context = canvasRef.current.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasRef.current.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    setImageUrl(url);
                    // Detener la cámara antes de navegar
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                    }
                    navigate('/preview', { state: { imageUrl: url } });
                }
            }, 'image/jpeg');
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            // Detener la cámara antes de navegar
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            navigate('/preview', { state: { imageUrl: url } });
        }
    };

    return (
        <div className="camera-container">
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`video-feed ${isFrontCamera ? 'front-camera' : ''}`}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480" />
            <div className="button-container">
                <label className="gallery-button">
                    <FontAwesomeIcon icon={faImage} />
                    <input 
                        type="file" 
                        accept="image/*"
                        style={{ display: 'none' }} 
                        onChange={handleFileChange}
                    />
                </label>
                <button className="capture-button" onClick={takePhoto}></button>
                {devices.length > 1 ? (
                    <button className="toggle-button" onClick={toggleCamera}>
                        <FontAwesomeIcon icon={faCameraRotate} />
                    </button>
                ) : (
                    <div className="toggle-button" style={{ visibility: 'hidden' }}>
                        <FontAwesomeIcon icon={faCameraRotate} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Camara; 