class SalesService {
    static async searchProducts(query) {
        return httpClient.get('/productos/search', { q: query, stock_only: 1 });
    }

    static async getPOSProductos() {
        return httpClient.get('/ventas/pos-productos');
    }

    static async getFefoBatch(productoId) {
        return httpClient.get('/inventario/fefo', { producto_id: productoId });
    }

    static async createSale(saleData) {
        return httpClient.post('/ventas/crear', saleData);
    }
}
window.SalesService = SalesService;
