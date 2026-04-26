/**
 * PharmaQuick - ProductService
 * Servicio para manejo de Productos via API
 */

class ProductService {
    /**
     * Obtener todos los productos
     */
    static async getAll() {
        try {
            const response = await httpClient.get('/productos');
            return response.data?.productos || [];
        } catch (error) {
            console.error('ProductService.getAll:', error);
            throw error;
        }
    }
    
    /**
     * Obtener producto por ID
     */
    static async getById(id) {
        try {
            const response = await httpClient.get(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error('ProductService.getById:', error);
            throw error;
        }
    }
    
    /**
     * Buscar productos
     */
    static async search(query) {
        try {
            const response = await httpClient.get('/productos', { q: query });
            return response.data?.productos || [];
        } catch (error) {
            console.error('ProductService.search:', error);
            throw error;
        }
    }
    
    /**
     * Crear producto
     */
    static async create(data) {
        try {
            const response = await httpClient.post('/productos', data);
            return response.data;
        } catch (error) {
            console.error('ProductService.create:', error);
            throw error;
        }
    }
    
    /**
     * Actualizar producto
     */
    static async update(id, data) {
        try {
            const response = await httpClient.put(`/productos/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('ProductService.update:', error);
            throw error;
        }
    }
    
    /**
     * Eliminar producto (inactivar)
     */
    static async delete(id) {
        try {
            const response = await httpClient.delete(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error('ProductService.delete:', error);
            throw error;
        }
    }
    
    /**
     * Obtener categorías únicas
     */
    static getCategories(productos) {
        const categories = new Set();
        
        productos.forEach(p => {
            if (p.categoria) {
                categories.add(p.categoria);
            }
        });
        
        return Array.from(categories).sort();
    }
}

// Exportar global
const productService = ProductService;