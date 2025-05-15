import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HeaderLogged from './components/Header/HeaderLogged';
import HeaderNotLogged from './components/Header/HeaderNotLogged';
import Description from './components/Description';
import GoogleCallback from './components/Auth/GoogleCallback';
import Home from './components/Home';
import Mapa from './components/Mapa';
import Finder from './components/Finder.js';
import Camara from './components/Camara';
import Preview from './components/Preview.js';
import AuthentificationError from './components/Auth/AuthentificationError.js';
import { useToken } from './components/Auth/tokenContext';

function App() {
  const { authToken, setAuthToken, setUserEmail } = useToken();

  const handleLogout = async () => {
    try {
      if (authToken) {
        // Llamar al backend para invalidar el token
        await fetch("https://ecotrack.es/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
      }

      // Limpiar el contexto (esto también limpiará las cookies)
      setAuthToken(null);
      setUserEmail(null);
      
      // Limpiar datos no críticos del localStorage
      localStorage.removeItem('picture');
      
      // Redirigir al usuario a la página de login
      window.location.href = "/";
    } catch (error) {
      console.error("Error durante el logout:", error);
      // Aún así, limpiamos todo
      setAuthToken(null);
      setUserEmail(null);
      localStorage.removeItem('picture');
      window.location.href = "/";
    }
  };

  // Componente de protección de ruta
  const ProtectedRoute = ({ children }) => {
    return authToken ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <div className="App">
        {/* Usar el componente Header */}
        {authToken ? <HeaderLogged onLogout={handleLogout} /> : <HeaderNotLogged />}

        {/* Usar el componente Routes */}
        <Routes>
          <Route path="/" element={!authToken ? <Description /> : <Navigate to="/home" />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/google/callback" element={<GoogleCallback />} />
          <Route path="/authentificationError" element={<AuthentificationError/>}/>
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><Mapa /></ProtectedRoute>} />
          <Route path="/camera" element={<ProtectedRoute><Camara /></ProtectedRoute>} />
          <Route path="/finder" element={<ProtectedRoute><Finder /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
