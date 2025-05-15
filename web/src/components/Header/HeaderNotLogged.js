import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../styles/Header.css";
import logo from "../../styles/images/logoConNombre.png";
import logoSinNombre from "../../styles/images/logoSinNombre.png";

const HeaderNotLogged = () => {
    const headerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

    // Función para actualizar la altura del header en CSS
    const updateHeaderHeight = () => {
        if (headerRef.current) {
            const height = headerRef.current.offsetHeight;
            document.documentElement.style.setProperty('--header-height', `${height}px`);
        }
    };

    // Efecto para medir y actualizar la altura del header
    useEffect(() => {
        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);
        return () => window.removeEventListener('resize', updateHeaderHeight);
    }, []);

    const loginWithGoogle = async () => {
        try {
            console.log('Iniciando sesión con Google...');
            const response = await axios.get('https://ecotrack.es/auth/google');
            if (response.status === 200 && response.data.authorization_url) {
                console.log('Redirigiendo a:', response.data.authorization_url);
                window.location.href = response.data.authorization_url;
                console.log('Redirección exitosa.');
            }
        } catch (error) {
            console.error('Error al iniciar sesión con Google:', error);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 900);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <header className="header" ref={headerRef}>
            {/* Contenedor izquierdo (Logo) */}
            <div className="header-left">
                <Link to="/">
                    <img src={isMobile ? logoSinNombre : logo} alt="Logo" className="logo-img" />
                </Link>
            </div>

            {/* Botón de Cuenta (a la derecha) */}
            <div className="session-buttons">
                <a className="session-link acceder-button" onClick={loginWithGoogle}>Acceder</a>
            </div>
        </header>
    );
};

export default HeaderNotLogged;
