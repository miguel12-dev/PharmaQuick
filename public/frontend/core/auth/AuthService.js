/**
 * PharmaQuick - AuthService
 * Manejo de autenticación JWT
 */

class AuthService {
    static SESSION_KEY = 'pharmaSession';
    
    /**
     * Obtener sesión actual
     */
    static getSession() {
        try {
            const stored = localStorage.getItem(this.SESSION_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Verificar si está autenticado
     */
    static isAuthenticated() {
        const session = this.getSession();
        return session && session.token && session.farmaciaId;
    }
    
    /**
     * Obtener token JWT
     */
    static getToken() {
        const session = this.getSession();
        return session?.token || null;
    }
    
    /**
     * Obtener ID de farmacia
     */
    static getFarmaciaId() {
        const session = this.getSession();
        return session?.farmaciaId || null;
    }
    
    /**
     * Obtener nombre de usuario
     */
    static getUserName() {
        const session = this.getSession();
        return session?.nombre || session?.usuario || null;
    }
    
    /**
     * Obtener email de usuario
     */
    static getUserEmail() {
        const session = this.getSession();
        return session?.usuario || null;
    }
    
    /**
     * Guardar sesión
     */
    static setSession(data) {
        const session = {
            isAuthenticated: true,
            usuario: data.usuario,
            farmaciaId: data.farmacia_id,
            nombre: data.nombre,
            token: data.token
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
    
    /**
     * Cerrar sesión
     */
    static clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
    }
    
    /**
     * Redireccionar a login si no está autenticado
     */
    static requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }
    
    /**
     * Redireccionar al dashboard
     */
    static redirectToDashboard() {
        window.location.href = '/';
    }
    
    /**
     * Redireccionar al login
     */
    static redirectToLogin() {
        window.location.href = '/login';
    }
}

// Exportar global
const authService = AuthService;