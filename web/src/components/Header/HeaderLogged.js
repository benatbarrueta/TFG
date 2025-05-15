import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; // Importar Link de React Router
import "../../styles/Header.css";
import logo from "../../styles/images/logoConNombre.png";
import logoSinNombre from "../../styles/images/logoSinNombre.png";

const Header = ({ onLogout }) => {
  const [isServicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef(null); // Referencia para detectar clics fuera
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

  // Efecto para actualizar altura cuando cambia el menú
  useEffect(() => {
    updateHeaderHeight();
  }, [isServicesOpen]);

  // Función para alternar el menú al hacer clic en el botón
  const toggleMenu = () => {
    setServicesOpen((prev) => !prev);
  };

  // Función para cerrar el menú cuando se hace clic fuera
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setServicesOpen(false);
    }
  };

  // Función para cerrar el menú cuando se hace clic en un enlace
  const closeMenu = () => {
    setServicesOpen(false);
  };

  // Agregar y remover evento global para detectar clics fuera del menú
  useEffect(() => {
    if (isServicesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isServicesOpen]);

  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="header" ref={headerRef}>
      {/* Contenedor izquierdo (Servicios + Logo) */}
      <div className="header-left">
        
        {/* Logo */}
        <Link to="/home" onClick={closeMenu}>
          <img src={isMobile ? logoSinNombre : logo} alt="Logo" className="logo-img" />
        </Link>
        
        {/* Enlaces de navegación */}
        <div className="nav-links">
          <Link to="/camera" className="session-link">Buscador</Link>
          <Link to="/map" className="session-link">Mapa</Link>
        </div>
      </div>

      {/* Botón de Cuenta (a la derecha) */}
      <div className="session-buttons">
        <Link to="/" className="session-link" onClick={onLogout}>Cerrar sesión</Link>
      </div>
    </header>
  );
};

export default Header;
