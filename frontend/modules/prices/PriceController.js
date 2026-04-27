/**
 * PharmaQuick - PriceController
 * Controlador de Precios - maneja lógica de negocio
 */

class PriceController {
    constructor() {
        this.precios = [];
        this.productoId = null;
        this.producto = null;
        this.precioActivo = null;
        this.isLoading = false;
        
        this.listeners = {
            onDataChange: [],
            onLoadingChange: [],
            onError: []
        };
    }
    
    /**
     * Inicializar para un producto
     */
    async loadForProducto(productoId, producto = null) {
        this.productoId = productoId;
        this.producto = producto;
        this.setLoading(true);
        
        try {
            const data = await PriceService.getByProducto(productoId);
            this.precios = data.precios || [];
            this.precioActivo = data.precio_activo || null;
            this.notify('onDataChange', {
                precios: this.precios,
                precioActivo: this.precioActivo
            });
        } catch (error) {
            this.notify('onError', error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Crear nuevo precio
     */
    async createPrecio(precio, activar = true) {
        if (!this.productoId) {
            throw new Error('Producto no especificado');
        }
        
        this.setLoading(true);
        
        try {
            const result = await PriceService.create({
                producto_id: this.productoId,
                precio: parseFloat(precio),
                activar: activar
            });
            
            // Recargar precios
            await this.loadForProducto(this.productoId, this.producto);
            
            return result;
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Actualizar precio
     */
    async updatePrecio(id, precio) {
        this.setLoading(true);
        
        try {
            const result = await PriceService.update(id, { precio: parseFloat(precio) });
            
            // Recargar precios
            await this.loadForProducto(this.productoId, this.producto);
            
            return result;
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Activar precio
     */
    async activatePrecio(id) {
        this.setLoading(true);
        
        try {
            const result = await PriceService.activate(id);
            
            // Recargar precios
            await this.loadForProducto(this.productoId, this.producto);
            
            return result;
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Eliminar precio
     */
    async deletePrecio(id) {
        this.setLoading(true);
        
        try {
            const result = await PriceService.delete(id);
            
            // Recargar precios
            await this.loadForProducto(this.productoId, this.producto);
            
            return result;
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Estado de carga
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.notify('onLoadingChange', loading);
    }
    
    /**
     * Registrar evento
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    /**
     * Notificar listeners
     */
    notify(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

// Exportar global
const priceController = new PriceController();