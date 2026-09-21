import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Estado inicial leído de localStorage: si ya había una sesión guardada
    // (de una pestaña/visita anterior), la app arranca ya autenticada en vez
    // de mostrar el login un instante de más.
    const [employee, setEmployee] = useState(() => authService.getStoredAuth()?.employee ?? null);

    const login = useCallback(async (email, password) => {
        const loggedInEmployee = await authService.login(email, password);
        setEmployee(loggedInEmployee);
        return loggedInEmployee;
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setEmployee(null);
    }, []);

    // login/logout ya son estables (useCallback, sin dependencias) -- solo
    // `employee` puede cambiar. Sin useMemo, este objeto se recreaba en
    // cada render de AuthProvider (p. ej. al re-renderizar por cualquier
    // cambio en `children`), y todo consumidor de useContext(AuthContext)
    // se re-renderizaba con él aunque `employee` no hubiera cambiado.
    const value = useMemo(() => ({ employee, login, logout }), [employee, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
    }
    return context;
};
