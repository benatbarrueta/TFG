import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../styles/Preview.css';

const Preview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { imageUrl } = location.state || {};

    return (
        <div className="preview-container">
            <div className="preview-card">
                <h2 className="preview-title">Vista previa de la imagen</h2>
                <div className="image-container">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Previsualización" className="preview-image" />
                    ) : (
                        <div className="no-image">
                            <span className="no-image-text">No hay imagen para mostrar</span>
                        </div>
                    )}
                </div>
                <div className="button-group">
                    {imageUrl ? (
                        <button 
                            onClick={() => navigate('/finder', { state: { imageUrl } })} 
                            className="action-button accept-button"
                        >
                            Utilizar esta foto
                        </button>
                    ) : (
                        <p className="error-message">No se puede utilizar la foto porque no está disponible.</p>
                    )}
                    <Link to="/camera" className="action-button retry-button">
                        Tomar otra foto
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Preview;