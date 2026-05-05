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
        if (!session) return null;

        const nombre = this.resolveDisplayText(session.nombre);
        if (nombre) return nombre;

        const usuario = session.usuario;
        if (typeof usuario === 'string') return usuario;
        if (usuario && typeof usuario === 'object') {
            return this.resolveDisplayText(usuario.nombre)
                || this.resolveDisplayText(usuario.usuario)
                || this.resolveDisplayText(usuario.email);
        }

        return null;
    }
    
    /**
     * Obtener email de usuario
     */
    static getUserEmail() {
        const session = this.getSession();
        if (!session) return null;
        if (typeof session.usuario === 'string') return session.usuario;
        if (session.usuario && typeof session.usuario === 'object') {
            return session.usuario.email || session.usuario.usuario || null;
        }
        return null;
    }
    
    /**
     * Guardar sesión
     */
    static setSession(data) {
        const usuario = data?.usuario;
        const usuarioValue = typeof usuario === 'string'
            ? usuario
            : (usuario?.email || usuario?.usuario || '');
        const nombreValue = data?.nombre
            || usuario?.nombre
            || usuario?.usuario
            || usuarioValue;

        const session = {
            isAuthenticated: true,
            usuario: usuarioValue,
            farmaciaId: data.farmacia_id,
            nombre: nombreValue,
            token: data.token
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }

    static resolveDisplayText(value) {
        return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
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
