/**
 * PharmaQuick - HTTP Client
 * Centralized HTTP requests with JWT and global error handling
 */

const API_BASE = '/api';

class HttpClient {
    static instance = null;

    constructor() {
        this.baseURL = API_BASE;
    }

    static getInstance() {
        if (!HttpClient.instance) {
            HttpClient.instance = new HttpClient();
        }
        return HttpClient.instance;
    }

    getHeaders(isFormData = false) {
        const headers = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        const session = this.getSession();
        if (session && session.token) {
            headers['Authorization'] = 'Bearer ' + session.token;
        }
        return headers;
    }

    getSession() {
        try {
            const stored = localStorage.getItem('pharmaSession');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Require authentication - returns false if not authenticated
     */
    requireAuth() {
        const session = this.getSession();
        if (!session || !session.token) {
            Router.redirectToLogin();
            return false;
        }
        return true;
    }

    /**
     * Verificar si hay sesión válida
     */
    hasValidSession() {
        const session = this.getSession();
        return !!(session && session.token && session.farmaciaId);
    }

    async get(endpoint, params = {}) {
        if (!this.requireAuth()) throw new Error('No autenticado');

        const url = new URL(this.baseURL + endpoint, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] != null) url.searchParams.append(key, params[key]);
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async post(endpoint, data) {
        if (!this.requireAuth()) throw new Error('No autenticado');

        const isFormData = data instanceof FormData;
        const body = isFormData ? data : JSON.stringify(data);

        const response = await fetch(this.baseURL + endpoint, {
            method: 'POST',
            headers: this.getHeaders(isFormData),
            body: body
        });
        return this.handleResponse(response);
    }

    async put(endpoint, data) {
        if (!this.requireAuth()) throw new Error('No autenticado');

        const response = await fetch(this.baseURL + endpoint, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async delete(endpoint) {
        if (!this.requireAuth()) throw new Error('No autenticado');

        const response = await fetch(this.baseURL + endpoint, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    /**
     * Handle response and global errors
     */
    async handleResponse(response) {
        let data;
        const isJson = response.headers.get('content-type')?.includes('application/json');
        
        if (isJson) {
            data = await response.json();
        }

        // Global error handling - BEFORE checking response.ok
        if (response.status === 401) {
            // No autorizado - clear session and redirect to login
            console.warn('HttpClient: 401 Unauthorized');
            localStorage.removeItem('pharmaSession');
            Router.redirectToLogin();
            throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
        }
        
        if (response.status === 403) {
            // Prohibido
            console.warn('HttpClient: 403 Forbidden');
            if (typeof Toast !== 'undefined') {
                Toast.error('No tienes permisos para realizar esta acción');
            }
            throw new Error('No tienes permisos');
        }
        
        if (response.status === 404) {
            // No encontrado
            console.warn('HttpClient: 404 Not Found');
            throw new Error(data?.message || 'Recurso no encontrado');
        }
        
        if (response.status >= 500) {
            // Error del servidor
            console.error('HttpClient: Server Error', response.status);
            if (typeof Toast !== 'undefined') {
                Toast.error('Error del servidor. Intenta más tarde.');
            }
            throw new Error(data?.message || 'Error del servidor');
        }

        // Check httpErrorHandler from HttpErrorHandler.js
        if (typeof httpErrorHandler !== 'undefined' && httpErrorHandler.process) {
            if (httpErrorHandler.process(response, data)) {
                throw new Error(data?.message || 'Error');
            }
        }

        if (!response.ok) {
            throw new Error(data?.message || 'Error HTTP ' + response.status);
        }

        return data || { success: true };
    }
}

const httpClient = HttpClient.getInstance();