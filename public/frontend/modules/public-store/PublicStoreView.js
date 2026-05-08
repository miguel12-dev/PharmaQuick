class PublicStoreView {
    constructor(container) {
        this.container = container;
        this.onSearch = null;
        this.onBuy = null;
        this.onReserve = null;
    }

    render(products, query = '', loggedIn = false) {
        const headerHtml = window.SiteHeader ? window.SiteHeader.render({ loggedIn, variant: 'marketing' }) : '';
        
        this.container.innerHTML = `
            ${headerHtml}
            <div class="public-store-container py-4">
                <div class="container">
                    <div class="row mb-4 align-items-center">
                        <div class="col-md-6">
                            <h2 class="h3 mb-0 text-primary fw-bold">Catálogo de Productos</h2>
                            <p class="text-muted mb-0">Encuentra los mejores medicamentos y productos de salud</p>
                        </div>
                        <div class="col-md-6 mt-3 mt-md-0">
                            <div class="search-box">
                                <div class="input-group">
                                    <span class="input-group-text bg-white border-end-0">
                                        <i class="bi bi-search text-muted"></i>
                                    </span>
                                    <input type="text" id="publicSearchInput" class="form-control border-start-0 ps-0" placeholder="Buscar medicamentos, marcas, categorías..." value="${query}">
                                    <button class="btn btn-primary" id="publicSearchBtn" type="button">Buscar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="publicProductsGrid" class="row g-4">
                        ${this.renderProductsList(products)}
                    </div>
                </div>
            </div>
        `;

        this.attachEvents();
    }

    renderProductsList(products) {
        if (!products || products.length === 0) {
            return `
                <div class="col-12 text-center py-5">
                    <div class="empty-state">
                        <i class="bi bi-box-seam display-1 text-muted mb-3 d-block"></i>
                        <h3 class="h4 text-secondary">No encontramos productos</h3>
                        <p class="text-muted">Intenta buscar con otros términos o explora nuestro catálogo completo.</p>
                        <button class="btn btn-outline-primary mt-3" onclick="document.getElementById('publicSearchInput').value=''; document.getElementById('publicSearchBtn').click();">Ver todos los productos</button>
                    </div>
                </div>
            `;
        }

        return products.map(p => this.renderProductCard(p)).join('');
    }

    renderProductCard(product) {
        const defaultImage = '/img/default-product.png';
        const image = product.imagen || defaultImage;
        const price = parseFloat(product.precio_activo || 0);
        const formatPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
        const hasStock = parseInt(product.stock_total || 0) > 0;
        
        return `
            <div class="col-sm-6 col-md-4 col-lg-3">
                <div class="card h-100 product-card shadow-sm border-0 position-relative">
                    ${!hasStock ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2 z-index-1">Agotado</span>' : ''}
                    
                    <div class="product-img-wrapper p-3 text-center bg-light">
                        <img src="${image}" class="card-img-top product-img" alt="${product.nombre}" onerror="this.src='${defaultImage}'">
                    </div>
                    
                    <div class="card-body d-flex flex-column">
                        <div class="mb-1 text-muted small">${product.categoria || 'Sin categoría'}</div>
                        <h5 class="card-title text-secondary fs-6 mb-1">${product.nombre}</h5>
                        <p class="card-text text-muted small mb-3">${product.presentacion || ''}</p>
                        
                        <div class="mt-auto">
                            <div class="fs-5 fw-bold text-primary mb-3">${formatPrice}</div>
                            
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary btn-sm action-buy" data-id="${product.id}" ${!hasStock ? 'disabled' : ''}>
                                    <i class="bi bi-cart-plus me-1"></i> Comprar
                                </button>
                                <button class="btn btn-outline-primary btn-sm action-reserve" data-id="${product.id}" ${!hasStock ? 'disabled' : ''}>
                                    <i class="bi bi-calendar-check me-1"></i> Reservar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const searchInput = document.getElementById('publicSearchInput');
        const searchBtn = document.getElementById('publicSearchBtn');
        
        const handleSearch = () => {
            if (this.onSearch) {
                this.onSearch(searchInput.value.trim());
            }
        };

        if (searchBtn) {
            searchBtn.addEventListener('click', handleSearch);
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
        }

        // Buy and Reserve buttons
        this.container.querySelectorAll('.action-buy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (this.onBuy) this.onBuy(id);
            });
        });

        this.container.querySelectorAll('.action-reserve').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (this.onReserve) this.onReserve(id);
            });
        });
    }

    showLoading() {
        const loggedIn = window.Router ? window.Router.isAuthenticated() : false;
        const headerHtml = window.SiteHeader ? window.SiteHeader.render({ loggedIn, variant: 'marketing' }) : '';
        
        this.container.innerHTML = `
            ${headerHtml}
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando catálogo...</span>
                </div>
                <p class="mt-3 text-muted">Cargando productos...</p>
            </div>
        `;
    }

    showError(message) {
        const loggedIn = window.Router ? window.Router.isAuthenticated() : false;
        const headerHtml = window.SiteHeader ? window.SiteHeader.render({ loggedIn, variant: 'marketing' }) : '';

        this.container.innerHTML = `
            ${headerHtml}
            <div class="container py-5">
                <div class="alert alert-danger shadow-sm border-0" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i> ${message}
                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-danger" onclick="location.reload()">Intentar nuevamente</button>
                    </div>
                </div>
            </div>
        `;
    }
}

window.PublicStoreView = PublicStoreView;
