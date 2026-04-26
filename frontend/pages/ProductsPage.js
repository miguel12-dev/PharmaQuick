/**
 * PharmaQuick - ProductsPage
 * Página de Productos
 */

class ProductsPage {
    constructor() {
        this.view = null;
    }
    
    /**
     * Inicializar página
     */
    init() {
        // Verificar autenticación
        if (!authService.requireAuth()) {
            return;
        }
        
        // Inicializar ProductView
        const container = document.getElementById('productsContainer');
        if (container) {
            this.view = new ProductView('#productsContainer');
        }
        
        // Inicializar PriceView también
        new PriceView('#pricesContainer');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const page = new ProductsPage();
    page.init();
});