/**
 * PharmaQuick - HTTP Client
 * Centralized HTTP requests with JWT
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

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
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

    requireAuth() {
        const session = this.getSession();
        if (!session || !session.token) {
            window.location.href = '/login';
            return false;
        }
        return true;
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

        const response = await fetch(this.baseURL + endpoint, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
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

    async handleResponse(response) {
        let data;
        const isJson = response.headers.get('content-type')?.includes('application/json');
        
        if (isJson) {
            data = await response.json();
        }

        // Check for HTTP errors
        if (httpErrorHandler.process(response, data)) {
            throw new Error(data?.message || 'Error');
        }

        if (!response.ok) {
            throw new Error(data?.message || 'Error HTTP ' + response.status);
        }

        return data || { success: true };
    }
}

const httpClient = HttpClient.getInstance();