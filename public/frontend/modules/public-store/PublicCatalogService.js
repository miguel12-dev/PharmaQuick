class PublicCatalogService {
    constructor() {
        this.baseUrl = '/api/public';
        this.farmaciaId = window.Config?.PUBLIC_STORE_FARMACIA_ID || 1;
    }

    async getCatalog(q = '', limit = 20, offset = 0) {
        try {
            const queryParams = new URLSearchParams({
                farmacia_id: this.farmaciaId,
                limit,
                offset
            });
            if (q) queryParams.append('q', q);

            const response = await fetch(`${this.baseUrl}/catalogo?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error('Error al cargar el catálogo');
            }
            
            const data = await response.json();
            const products = data.success && data.data ? data.data.data : [];
            // Defensive: ensure we have an array if backend returned an object due to array_filter
            return Array.isArray(products) ? products : Object.values(products);
        } catch (error) {
            console.error('PublicCatalogService error:', error);
            throw error;
        }
    }

    async getTopProducts(limit = 10) {
        try {
            const response = await fetch(`${this.baseUrl}/productos-top?farmacia_id=${this.farmaciaId}&limit=${limit}`);
            if (!response.ok) {
                throw new Error('Error al cargar productos top');
            }
            
            const data = await response.json();
            // La respuesta es {success: true, data: {data: [...]}} - doble anidamiento
            return data.success && data.data ? data.data.data : [];
        } catch (error) {
            console.error('PublicCatalogService error:', error);
            throw error;
        }
    }
}

window.publicCatalogService = new PublicCatalogService();
