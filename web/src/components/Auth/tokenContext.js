import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const TokenContext = createContext();

const TOKEN_COOKIE_NAME = 'ecotrack_auth_token';
const USER_EMAIL_COOKIE_NAME = 'ecotrack_user_email';

export const TokenProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => {
    // Intentar recuperar el token de las cookies al iniciar
    return Cookies.get(TOKEN_COOKIE_NAME) || null;
  });

  const [userEmail, setUserEmail] = useState(() => {
    // Intentar recuperar el email de las cookies al iniciar
    return Cookies.get(USER_EMAIL_COOKIE_NAME) || null;
  });

  // Efecto para sincronizar el token con las cookies
  useEffect(() => {
    if (authToken) {
      // Si hay token, lo guardamos en las cookies (7 días de expiración)
      Cookies.set(TOKEN_COOKIE_NAME, authToken, {
        expires: 7,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } else {
      // Si no hay token, eliminamos la cookie
      Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
      // También eliminamos el email si no hay token
      Cookies.remove(USER_EMAIL_COOKIE_NAME, { path: '/' });
      setUserEmail(null);
    }
  }, [authToken]);

  // Efecto para sincronizar el email con las cookies
  useEffect(() => {
    if (userEmail) {
      // Si hay email, lo guardamos en las cookies (7 días de expiración)
      Cookies.set(USER_EMAIL_COOKIE_NAME, userEmail, {
        expires: 7,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
  }, [userEmail]);

  return (
    <TokenContext.Provider value={{ 
      authToken, 
      setAuthToken,
      userEmail,
      setUserEmail
    }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => {
  return useContext(TokenContext);
};
