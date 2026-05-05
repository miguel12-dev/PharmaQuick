/**
 * PharmaQuick - ProductController
 * Controlador de Productos - maneja lógica de negocio
 */

class ProductController {
    constructor() {
        this.productos = [];
        this.filteredProductos = [];
        this.searchQuery = '';
        this.categoryFilter = null;
        this.sortColumn = 'nombre';
        this.sortDirection = 'asc';
        this.isLoading = false;
        
        this.listeners = {
            onDataChange: [],
            onLoadingChange: [],
            onError: []
        };
    }
    
    /**
     * Inicializar controlador
     */
    async init() {
        await this.loadProductos();
    }
    
    /**
     * Cargar productos del API
     */
    async loadProductos() {
        this.setLoading(true);
        
        try {
            this.productos = await ProductService.getAll();
            this.applyFilters();
            this.notify('onDataChange', this.filteredProductos);
        } catch (error) {
            this.notify('onError', error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Buscar productos
     */
    async search(query) {
        this.searchQuery = query;
        
        if (query.length < 2) {
            this.applyFilters();
            this.notify('onDataChange', this.filteredProductos);
            return;
        }
        
        this.setLoading(true);
        
        try {
            this.productos = await ProductService.search(query);
            this.applyFilters();
            this.notify('onDataChange', this.filteredProductos);
        } catch (error) {
            this.notify('onError', error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Filtrar por categoría
     */
    filterByCategory(category) {
        this.categoryFilter = category;
        this.applyFilters();
        this.notify('onDataChange', this.filteredProductos);
    }
    
    /**
     * Ordenar productos
     */
    sort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.applyFilters();
        this.notify('onDataChange', this.filteredProductos);
    }
    
    /**
     * Aplicar filtros locales
     */
    applyFilters() {
        let data = [...this.productos];
        
        // Filtro por categoría
        if (this.categoryFilter) {
            data = data.filter(p => p.categoria === this.categoryFilter);
        }
        
        // Ordenar
        data.sort((a, b) => {
            const aVal = a[this.sortColumn];
            const bVal = b[this.sortColumn];
            
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            
            let comparison = 0;
            if (typeof aVal === 'number') {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }
            
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
        
        this.filteredProductos = data;
    }
    
    /**
     * Obtener producto por ID (desde el API)
     */
    async fetchById(id) {
        try {
            return await ProductService.getById(id);
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        }
    }

    /**
     * Obtener producto por ID (desde cache local)
     */
    getProductoById(id) {
        return this.productos.find(p => p.id === id || p.producto_id === id);
    }
    
    /**
     * Crear nuevo producto
     */
    async createProducto(data) {
        this.setLoading(true);
        
        try {
            const result = await ProductService.create(data);
            await this.loadProductos(); // Recargar
            return result;
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Actualizar producto
     */
    async updateProducto(id, data) {
        this.setLoading(true);
        
        try {
            const result = await ProductService.update(id, data);
            await this.loadProductos(); // Recargar
            return result;
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Eliminar producto
     */
    async deleteProducto(id) {
        this.setLoading(true);
        
        try {
            const result = await ProductService.delete(id);
            await this.loadProductos(); // Recargar
            return result;
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Obtener categorías disponibles
     */
    getCategories() {
        return ProductService.getCategories(this.productos);
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
const productController = new ProductController();