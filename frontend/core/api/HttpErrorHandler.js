/**
 * PharmaQuick - HTTP Error Handler
 * Handles HTTP errors (401, 403, 404, 500)
 */

const HttpErrorHandler = {
    /**
     * Handle 401 - Unauthorized
     */
    handle401() {
        localStorage.removeItem('pharmaSession');
        if (typeof Toast !== 'undefined') {
            Toast.error('Sesión expirada. Inicie sesión nuevamente.');
        }
        window.location.href = '/login';
    },

    /**
     * Handle 403 - Forbidden
     */
    handle403(message = 'No tiene permisos') {
        if (typeof Toast !== 'undefined') {
            Toast.error(message);
        }
    },

    /**
     * Handle 404 - Not Found
     */
    handle404(message = 'Recurso no encontrado') {
        window.location.href = '/pages/404.html?msg=' + encodeURIComponent(message);
    },

    /**
     * Handle 500 - Server Error
     */
    handle500(message = 'Error interno del servidor') {
        if (typeof Toast !== 'undefined') {
            Toast.error(message);
        }
    },

    /**
     * Process HTTP error
     */
    process(response, data) {
        if (response.status === 401) {
            this.handle401();
            return true;
        }
        if (response.status === 403) {
            this.handle403(data?.message);
            return true;
        }
        if (response.status === 404) {
            this.handle404(data?.message);
            return true;
        }
        if (response.status >= 500) {
            this.handle500(data?.message);
            return true;
        }
        return false;
    }
};

const httpErrorHandler = HttpErrorHandler;