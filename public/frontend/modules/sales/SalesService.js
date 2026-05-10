class SalesService {
    static async searchProducts(query) {
        return HttpClient.get(`/api/productos/search?q=${encodeURIComponent(query)}`);
    }

    static async getFefoBatch(productoId) {
        return HttpClient.get(`/api/inventario/fefo?producto_id=${productoId}`);
    }

    static async createSale(saleData) {
        return HttpClient.post('/api/ventas/crear', saleData);
    }
}
window.SalesService = SalesService;
