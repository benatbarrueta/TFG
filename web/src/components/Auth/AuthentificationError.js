import React from 'react';
import '../../styles/AuthentificationError.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';

const AuthentificationError = () => {
    return (
        <div className="auth-error-container">
            <div className="auth-error-card">
                <div className="auth-error-icon">
                    <FontAwesomeIcon icon={faLock} size="3x" />
                </div>
                <h1 className="auth-error-title">Acceso Restringido</h1>
                <p className="auth-error-message">
                    No tienes acceso a <strong>ecotrack.es</strong>
                </p>
                <div className="auth-error-contact">
                    <p>¿Necesitas acceso? Contáctanos en:</p>
                    <div className="auth-error-email">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <a href="mailto:benat.barrueta@opendeusto.es">benat.barrueta@opendeusto.es</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthentificationError;