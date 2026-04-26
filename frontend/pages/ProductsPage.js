/**
 * PharmaQuick - Products Page Initialization
 * Page entry point for productos.html
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check auth
    const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
    if (!session.token || !session.farmaciaId) {
        window.location.href = '/login';
        return;
    }

    // Initialize ProductView
    window.productView = new ProductView('#productsContainer');

    // Initialize PriceView
    new PriceView('#pricesContainer');
});