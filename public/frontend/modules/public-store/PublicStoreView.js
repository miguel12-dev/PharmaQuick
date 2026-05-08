class PublicStoreView {
    constructor(container) {
        this.container = container;
        this.onSearch = null;
        this.onBuy = null;
        this.onReserve = null;
    }

    render(products, query = '', loggedIn = false) {
        const shellExists = this.container.querySelector('.public-store-container');
        
        if (!shellExists) {
            const headerHtml = window.SiteHeader ? window.SiteHeader.render({ 
                loggedIn, 
                variant: 'marketing',
                headerExtraClass: 'store-reveal',
                revealDelay: 0
            }) : '';
            
            this.container.innerHTML = `
                ${headerHtml}
                <div class="public-store-container py-5">
                    <div class="container">
                        <div class="row mb-5 align-items-center">
                            <div class="col-md-7">
                                <h2 class="store-section-title store-reveal mb-2" data-delay="60">Catálogo de Productos</h2>
                                <p class="text-muted mb-0 store-reveal" data-delay="120">Encuentra los mejores medicamentos y productos de salud con trazabilidad garantizada.</p>
                            </div>
                            <div class="col-md-5 mt-4 mt-md-0">
                                <div class="public-search-container store-reveal" data-delay="180">
                                    <div class="input-group shadow-sm">
                                        <span class="input-group-text border-0 bg-white ps-3">
                                            <i class="fas fa-search text-muted"></i>
                                        </span>
                                        <input type="text" id="publicSearchInput" class="form-control border-0 py-2" placeholder="¿Qué medicamento buscas?" value="${query}">
                                        <div id="searchBadgeContainer" class="position-absolute end-0 top-50 translate-middle-y me-2" style="z-index: 5;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="publicProductsGrid" class="row g-4 min-vh-50">
                            ${this.renderProductsList(products)}
                        </div>
                    </div>
                </div>
            `;
            this.attachEvents();
        } else {
            const searchInput = document.getElementById('publicSearchInput');
            if (searchInput && searchInput.value !== query) {
                searchInput.value = query;
            }
            this.updateGrid(products);
        }
    }

    updateGrid(products) {
        const grid = document.getElementById('publicProductsGrid');
        if (grid) {
            grid.innerHTML = this.renderProductsList(products);
            this.attachActionEvents();
            
            // Trigger animations for new products
            const cards = grid.querySelectorAll('.product-card-reveal');
            cards.forEach((card, i) => {
                setTimeout(() => {
                    card.classList.add('product-card-reveal--visible');
                }, i * 40);
            });

            grid.classList.remove('opacity-50');
            const badge = document.getElementById('searchBadgeContainer');
            if (badge) badge.innerHTML = '';
        }
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
        const defaultImage = '/image/logo_pharmaQuick.png';
        const image = product.imagen || defaultImage;
        const price = parseFloat(product.precio_activo || 0);
        const formatPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
        const hasStock = parseInt(product.stock_total || 0) > 0;
        
        return `
            <div class="col-sm-6 col-md-4 col-lg-3">
                <div class="card h-100 product-card product-card-reveal shadow-sm border-0 position-relative">
                    ${!hasStock ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2 z-index-1">Agotado</span>' : ''}
                    
                    <div class="product-img-wrapper">
                        <img src="${image}" class="product-img" alt="${product.nombre}" onerror="this.src='${defaultImage}'">
                    </div>
                    
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="mb-1 text-muted small fw-semibold text-uppercase">${product.categoria || 'Medicamento'}</div>
                        <h5 class="card-title h6 fw-bold mb-2 text-dark">${product.nombre}</h5>
                        <p class="card-text text-secondary small mb-3">${product.presentacion || ''}</p>
                        
                        <div class="mt-auto">
                            <div class="fs-5 fw-bold text-primary mb-3">${formatPrice}</div>
                            
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary btn-sm action-buy" data-id="${product.id}" ${!hasStock ? 'disabled' : ''}>
                                    <i class="fas fa-cart-plus me-1"></i> Comprar
                                </button>
                                <button class="btn btn-outline-primary btn-sm action-reserve" data-id="${product.id}" ${!hasStock ? 'disabled' : ''}>
                                    <i class="fas fa-calendar-check me-1"></i> Reservar
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
            
            // For live search (input event)
            searchInput.addEventListener('input', (e) => {
                if (this.onSearch) {
                    this.onSearch(e.target.value.trim(), true); // true indicates it's a live search
                }
            });
        }

        this.attachActionEvents();
    }

    attachActionEvents() {
        // Buy and Reserve buttons
        this.container.querySelectorAll('.action-buy').forEach(btn => {
            // Avoid double binding
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (this.onBuy) this.onBuy(id);
            });
        });

        this.container.querySelectorAll('.action-reserve').forEach(btn => {
            // Avoid double binding
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (this.onReserve) this.onReserve(id);
            });
        });
    }

    showLoading() {
        const shellExists = this.container.querySelector('.public-store-container');
        if (shellExists) {
            this.showGridLoading();
            return;
        }

        const loggedIn = window.Router ? window.Router.isAuthenticated() : false;
        const headerHtml = window.SiteHeader ? window.SiteHeader.render({ loggedIn, variant: 'marketing' }) : '';
        
        this.container.innerHTML = `
            ${headerHtml}
            <div class="text-center py-5 min-vh-50 d-flex flex-column justify-content-center">
                <div class="spinner-border text-primary mx-auto" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Cargando catálogo...</span>
                </div>
                <p class="mt-3 text-muted fw-medium">Cargando catálogo de productos...</p>
            </div>
        `;
    }

    showGridLoading() {
        const grid = document.getElementById('publicProductsGrid');
        const badge = document.getElementById('searchBadgeContainer');
        
        if (grid) {
            grid.classList.add('opacity-50');
            grid.style.transition = 'opacity 0.2s ease';
        }
        
        if (badge) {
            badge.innerHTML = `
                <span class="badge rounded-pill bg-light text-primary border">
                    <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    Buscando...
                </span>
            `;
        }
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
