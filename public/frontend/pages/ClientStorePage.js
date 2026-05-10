/**
 * PharmaQuick - Client Store Page
 * Catálogo de productos para clientes con opción de comprar/reservar
 */

const ClientStorePage = {
    products: [],
    cart: [],
    
    async init(container) {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        
        if (session.rol !== 'CLIENTE') {
            Router.navigate('/ventas');
            return;
        }

        ClientLayout.render(container, 'tienda');
        
        // Obtener parámetro de tab si existe
        const urlParams = new URLSearchParams(window.location.search);
        const activeTab = urlParams.get('tab') || 'comprar';
        
        this.cart = JSON.parse(localStorage.getItem('clientCart') || '[]');
        
        await this.loadProducts();
        this.renderStore(activeTab);
    },

    async loadProducts() {
        try {
            this.products = await window.publicCatalogService.getCatalog('', 50);
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    },

    renderStore(activeTab) {
        const content = document.getElementById('clientContent');
        
        content.innerHTML = `
<div class="row">
    <div class="col-lg-8">
        <!-- Tabs -->
        <ul class="nav nav-tabs mb-4">
            <li class="nav-item">
                <a class="nav-link ${activeTab === 'comprar' ? 'active' : ''}" href="#" data-tab="comprar" onclick="event.preventDefault(); window.ClientStorePage.switchTab('comprar')">
                    <i class="fas fa-shopping-cart me-2"></i> Comprar
                </a>
            </li>
            
        </ul>
        
        <!-- Buscador -->
        <div class="mb-4">
            <div class="input-group">
                <span class="input-group-text"><i class="fas fa-search"></i></span>
                <input type="text" class="form-control" id="productSearch" placeholder="Buscar medicamentos...">
                <button class="btn btn-outline-secondary" onclick="window.ClientStorePage.searchProducts()">Buscar</button>
            </div>
        </div>
        
        <!-- Grid de productos -->
        <div id="productsGrid" class="row g-3">
            ${this.renderProductCards(this.products)}
        </div>
    </div>
    
    <!-- Carrito lateral -->
    <div class="col-lg-4">
        <div class="card border-0 shadow-sm sticky-top" style="top: 100px;">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="fas fa-shopping-basket me-2"></i> Mi Carrito</h5>
                <small class="text-muted">${this.cart.length} item(s)</small>
            </div>
            <div class="card-body p-0" style="max-height: 400px; overflow-y: auto;">
                ${this.cart.length === 0 
                    ? '<div class="text-center py-4 text-muted"><i class="fas fa-cart-arrow-down fa-2x mb-2"></i><p>Tu carrito está vacío</p></div>' 
                    : this.renderCartItems()}
            </div>
            ${this.cart.length > 0 ? `
            <div class="card-footer bg-white">
                <div class="d-flex justify-content-between mb-3">
                    <strong>Total:</strong>
                    <strong class="text-primary">$${this.getCartTotal().toLocaleString()}</strong>
                </div>
                <button class="btn btn-primary w-100" onclick="window.ClientStorePage.processPurchase()">
                    <i class="fas fa-credit-card me-2"></i> Proceder al Pago
                </button>
            </div>
            ` : ''}
        </div>
    </div>
</div>`;
    },

    renderProductCards(products) {
        if (!products || products.length === 0) {
            return '<div class="col-12 text-center py-5 text-muted">No se encontraron productos</div>';
        }
        
        return products.map(p => {
            const hasStock = parseInt(p.stock_total || 0) > 0;
            const inCart = this.cart.find(item => item.producto_id === p.id);
            
            return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge bg-secondary">${p.categoria || 'Medicamento'}</span>
                            ${!hasStock ? '<span class="badge bg-danger">Agotado</span>' : ''}
                        </div>
                        <h6 class="card-title">${p.nombre}</h6>
                        <p class="card-text small text-muted mb-2">${p.presentacion || ''}</p>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="fs-5 fw-bold text-primary">$${parseFloat(p.precio_activo || 0).toLocaleString()}</span>
                            <span class="small text-muted">Stock: ${p.stock_total || 0}</span>
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-sm" onclick="window.ClientStorePage.addToCart(${p.id})" ${!hasStock ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus me-1"></i> Añadir al Carrito
                            </button>
                            
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    renderCartItems() {
        return this.cart.map((item, index) => `
            <div class="border-bottom p-3">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${item.nombre}</strong>
                        <div class="small text-muted">$${item.precio.toLocaleString()} x ${item.cantidad}</div>
                    </div>
                    <div class="text-end">
                        <strong>$${(item.precio * item.cantidad).toLocaleString()}</strong>
                        <button class="btn btn-sm btn-link text-danger p-0" onclick="window.ClientStorePage.removeFromCart(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const existingItem = this.cart.find(item => item.producto_id === productId);
        
        if (existingItem) {
            existingItem.cantidad += 1;
        } else {
            this.cart.push({
                producto_id: product.id,
                nombre: product.nombre,
                precio: parseFloat(product.precio_activo || 0),
                cantidad: 1,
                imagen: product.imagen || null
            });
        }
        
        this.saveCart();
        this.renderStore('comprar');
        
        // Mostrar toast
        this.showToast('Producto añadido al carrito', 'success');
    },

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.saveCart();
        this.renderStore('comprar');
    },

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    },

    saveCart() {
        localStorage.setItem('clientCart', JSON.stringify(this.cart));
    },

    switchTab(tab) {
        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url);
        
        this.renderStore(tab);
    },

    searchProducts() {
        const query = document.getElementById('productSearch').value.toLowerCase();
        const filtered = this.products.filter(p => 
            p.nombre.toLowerCase().includes(query) ||
            (p.categoria && p.categoria.toLowerCase().includes(query))
        );
        
        document.getElementById('productsGrid').innerHTML = this.renderProductCards(filtered);
    },



    async processPurchase() {
        if (this.cart.length === 0) return;
        
        const httpClient = window.httpClient || window.HttpClient;
        
        try {
            const items = this.cart.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio: item.precio
            }));
            
            const formData = new FormData();
            formData.append('items', JSON.stringify(items));
            formData.append('total', this.getCartTotal());
            
            const data = await httpClient.post('/ventas/create', formData);
            
            if (data.success) {
                this.cart = [];
                this.saveCart();
                this.showToast('Compra realizada exitosamente', 'success');
                Router.navigate('/cliente/compras');
            }
        } catch (error) {
            this.showToast(error.message || 'Error al procesar compra', 'danger');
        }
    },

    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        toast.style.zIndex = '9999';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
};

window.ClientStorePage = ClientStorePage;