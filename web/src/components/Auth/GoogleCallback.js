import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToken } from './tokenContext';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const { setAuthToken, setUserEmail } = useToken();

    useEffect(() => {
        const fetchToken = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (!code) {
                console.error('No se encontró el código de autorización.');
                return;
            }
            
            try {
                const response = await axios.get(`https://ecotrack.es/auth/google/callback?code=${code}`);
                console.log("Respuesta completa del backend:", response.data);

                if (response.status === 200 && response.data.access_token) {
                    // Asegurarnos de que estamos guardando el token correcto
                    const token = response.data.access_token.access_token || response.data.access_token;
                    
                    // Guardamos el token en el contexto (y por ende en las cookies)
                    setAuthToken(token);
                    
                    if (response.data.user) {
                        // Guardamos el email en el contexto (y por ende en las cookies)
                        setUserEmail(response.data.user.email);
                        // Solo guardamos la foto en localStorage ya que es un dato no crítico
                        localStorage.setItem('picture', response.data.user.picture);
                    }

                    console.log("Token y email guardados en las cookies");
                    console.log("Redirigiendo a /home...");
                    
                    navigate('/home', { replace: true });
                } else {
                    console.error("Respuesta del servidor no válida:", response);
                    navigate('/authentificationError');
                }
            } catch (error) {
                console.error("Error completo:", error);
                console.error("Error al hacer la solicitud al backend:", error.response || error.message);
                navigate('/authentificationError');
            }
        };

        fetchToken();
    }, [navigate, setAuthToken, setUserEmail]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
        }}>
            <h1>Iniciando sesión...</h1>
        </div>
    );
};

export default GoogleCallback;
