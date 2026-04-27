/**
 * PharmaQuick - PriceService
 * Servicio para manejo de Precios via API
 */

class PriceService {
    /**
     * Obtener todos los precios
     */
    static async getAll() {
        try {
            const response = await httpClient.get('/precios');
            return response.data?.precios || [];
        } catch (error) {
            console.error('PriceService.getAll:', error);
            throw error;
        }
    }
    
    /**
     * Obtener precios por producto
     */
    static async getByProducto(productoId) {
        try {
            const response = await httpClient.get(`/precios/producto/${productoId}`);
            return response.data;
        } catch (error) {
            console.error('PriceService.getByProducto:', error);
            throw error;
        }
    }
    
    /**
     * Crear precio
     */
    static async create(data) {
        try {
            const response = await httpClient.post('/precios', data);
            return response.data;
        } catch (error) {
            console.error('PriceService.create:', error);
            throw error;
        }
    }
    
    /**
     * Actualizar precio
     */
    static async update(id, data) {
        try {
            const response = await httpClient.put(`/precios/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('PriceService.update:', error);
            throw error;
        }
    }
    
    /**
     * Eliminar precio
     */
    static async delete(id) {
        try {
            const response = await httpClient.delete(`/precios/${id}`);
            return response.data;
        } catch (error) {
            console.error('PriceService.delete:', error);
            throw error;
        }
    }
    
    /**
     * Activar precio
     */
    static async activate(id) {
        try {
            const response = await httpClient.put(`/precios/${id}`, { activar: true });
            return response.data;
        } catch (error) {
            console.error('PriceService.activate:', error);
            throw error;
        }
    }
}

// Exportar global
const priceService = PriceService;