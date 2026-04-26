/**
 * PharmaQuick - HttpClient
 * Manejo centralizado de peticiones HTTP con JWT
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
    
    /**
     * Obtener headers con autenticación JWT
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const session = this.getSession();
        if (session && session.token) {
            headers['Authorization'] = `Bearer ${session.token}`;
        }
        
        return headers;
    }
    
    /**
     * Obtener sesión del localStorage
     */
    getSession() {
        try {
            const stored = localStorage.getItem('pharmaSession');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Verificar autenticación
     */
    requireAuth() {
        const session = this.getSession();
        if (!session || !session.token) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }
    
    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        if (!this.requireAuth()) {
            throw new Error('No autenticado');
        }
        
        const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }
    
    /**
     * POST request
     */
    async post(endpoint, data) {
        if (!this.requireAuth()) {
            throw new Error('No autenticado');
        }
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        
        return this.handleResponse(response);
    }
    
    /**
     * PUT request
     */
    async put(endpoint, data) {
        if (!this.requireAuth()) {
            throw new Error('No autenticado');
        }
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        
        return this.handleResponse(response);
    }
    
    /**
     * DELETE request
     */
    async delete(endpoint) {
        if (!this.requireAuth()) {
            throw new Error('No autenticado');
        }
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }
    
    /**
     * Manejar respuesta HTTP
     */
    async handleResponse(response) {
        try {
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `Error HTTP ${response.status}`);
            }
            
            return data;
        } catch (e) {
            if (e instanceof SyntaxError) {
                // Respuesta no JSON
                if (response.ok) {
                    return { success: true };
                }
                throw new Error(`Error HTTP ${response.status}`);
            }
            throw e;
        }
    }
}

// Exportar instancia global
const httpClient = HttpClient.getInstance();