/**
 * PharmaQuick - Client Catalog Page
 * Catálogo moderno de productos para clientes con buscador AJAX
 */

const ClientCatalogPage = {
    products: [],
    filteredProducts: [],
    cart: [],
    isLoading: false,
    searchTimeout: null,
    
    async init(container) {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        
        if (session.rol !== 'CLIENTE') {
            Router.navigate('/ventas');
            return;
        }

        ClientLayout.render(container, 'catalogo');
        
        // Cargar carrito desde el backend (no desde localStorage)
        await this.loadCartFromBackend();
        
        await this.loadProducts();
        this.renderCatalog();
        this.setupSearch();
    },
    
    async loadCartFromBackend() {
        try {
            if (window.cartService) {
                const cartData = await window.cartService.getCart();
                // Convertir formato del backend al formato que usa la UI
                this.cart = cartData.items.map(item => ({
                    id: item.id,
                    producto_id: item.producto_id,
                    nombre: item.producto_nombre,
                    precio: item.precio_unitario,
                    cantidad: item.cantidad
                }));
                // console.log('Carrito cargado desde backend:', this.cart.length, 'items');
            } else {
                // Si no hay servicio, usar array vacío
                this.cart = [];
            }
            // NO usar localStorage - el carrito debe estar solo en la base de datos
        } catch (error) {
            console.error('Error al cargar carrito desde backend:', error);
            this.cart = [];
        }
    },

    async loadProducts() {
        this.isLoading = true;
        this.showLoading();
        
        try {
            this.products = await window.publicCatalogService.getCatalog('', 50);
            this.filteredProducts = [...this.products];
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Error al cargar los productos');
            this.products = [];
            this.filteredProducts = [];
        }
        
        this.isLoading = false;
    },

    showLoading() {
        const content = document.getElementById('clientContent');
        content.innerHTML = `
            <div class="catalog-loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3 text-muted">Cargando catálogo...</p>
            </div>`;
    },

    showError(message) {
        const content = document.getElementById('clientContent');
        content.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-circle text-danger" style="font-size: 3rem;"></i>
                <p class="mt-3 text-muted">${message}</p>
                <button class="btn btn-primary" onclick="window.ClientCatalogPage.loadProducts()">
                    <i class="fas fa-redo me-2"></i>Reintentar
                </button>
            </div>`;
    },

    renderCatalog() {
        const content = document.getElementById('clientContent');
        
        content.innerHTML = `
        <!-- Encabezado del Catálogo -->
        <div class="catalog-header mb-4">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <h4 class="mb-1">
                        <i class="fas fa-shopping-bag text-primary me-2"></i>
                        Catálogo de Productos
                    </h4>
                    <p class="text-muted small mb-0">${this.filteredProducts.length} productos disponibles</p>
                </div>
                <div class="col-md-6 mt-3 mt-md-0">
                    <!-- Buscador Moderno AJAX -->
                    <div class="catalog-search-wrapper">
                        <div class="catalog-search">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" 
                                   id="catalogSearch" 
                                   class="form-control" 
                                   placeholder="Buscar medicamentos, categorías..."
                                   autocomplete="off">
                            <button class="search-clear" id="searchClear" style="display: none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div id="searchSpinner" class="search-spinner">
                            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        </div>
                    </div>
                    <div id="searchResultsInfo" class="search-results-info"></div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Grid de Productos -->
            <div class="col-lg-9">
                <div id="productsGrid" class="catalog-grid">
                    ${this.renderProductCards()}
                </div>
            </div>
            
            <!-- Carrito Lateral -->
            <div class="col-lg-3">
                <div class="catalog-cart-card">
                    <div class="cart-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i class="fas fa-shopping-cart me-2"></i>Mi Carrito
                            </h6>
                            <span class="cart-badge">${this.cart.length}</span>
                        </div>
                    </div>
                    
                    <div class="cart-items" id="cartItems">
                        ${this.cart.length === 0 ? this.renderEmptyCart() : this.renderCartItems()}
                    </div>
                    
                    ${this.cart.length > 0 ? `
                    <div class="cart-footer">
                        <div class="cart-total">
                            <span>Total:</span>
                            <span class="total-amount">$${this.getCartTotal().toLocaleString()}</span>
                        </div>
                        <button class="btn btn-primary btn-checkout w-100" onclick="window.ClientCatalogPage.processPurchase()">
                            <i class="fas fa-credit-card me-2"></i>Finalizar Compra
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        `;

        // Event listeners
        this.setupEventListeners();
    },

    renderProductCards() {
        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            return `
                <div class="product-card-empty">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron productos</p>
                </div>`;
        }
        
        return this.filteredProducts.map(p => {
            const stock = parseInt(p.stock_total || 0);
            const hasStock = stock > 0;
            const inCart = this.cart.find(item => item.producto_id === p.id);
            
            let stockBadge = '';
            if (!hasStock) {
                stockBadge = '<span class="product-card-stock out-of-stock">Agotado</span>';
            } else if (stock <= 5) {
                stockBadge = '<span class="product-card-stock low-stock">Poco stock</span>';
            } else {
                stockBadge = '<span class="product-card-stock in-stock">Disponible</span>';
            }
            
            return `
            <div class="product-card" data-product-id="${p.id}">
                <div class="product-card-image">
                    ${p.imagen ? 
                        `<img src="${p.imagen}" alt="${p.nombre}" class="product-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                        ''}
                    <i class="fas fa-pills" style="${p.imagen ? 'display:none;' : ''}"></i>
                    <span class="product-card-badge">${p.categoria || 'Medicamento'}</span>
                    ${stockBadge}
                </div>
                <div class="product-card-body">
                    <h6 class="product-card-title">${p.nombre}</h6>
                    <p class="product-card-presentation">${p.presentacion || ''}</p>
                    <div class="product-card-price">
                        $${parseFloat(p.precio_activo || 0).toLocaleString()}
                        <span>/ unidad</span>
                    </div>
                    <div class="product-card-actions">
                        ${hasStock && inCart ? `
                        <div class="quantity-wrapper">
                            <div class="quantity-control">
                                <button class="quantity-btn decrease" onclick="window.ClientCatalogPage.changeQuantity(${p.id}, -1)" ${inCart.cantidad <= 1 ? 'disabled' : ''}>
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" 
                                       class="quantity-input" 
                                       id="qty-${p.id}" 
                                       value="${inCart.cantidad}" 
                                       min="1" 
                                       max="${stock}"
                                       onchange="window.ClientCatalogPage.validateQuantity(${p.id})"
                                       oninput="window.ClientCatalogPage.updateQuantityDisplay(${p.id})">
                                <button class="quantity-btn increase" onclick="window.ClientCatalogPage.changeQuantity(${p.id}, 1)" ${inCart.cantidad >= stock ? 'disabled' : ''}>
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        ` : `
                        <div class="quantity-wrapper" style="display: none;"></div>
                        `}
                        <button class="btn-add-cart ${inCart ? 'added' : ''}" 
                                onclick="window.ClientCatalogPage.addToCart(${p.id})" 
                                ${!hasStock ? 'disabled' : ''}>
                            <i class="fas ${inCart ? 'fa-check' : 'fa-cart-plus'}"></i>
                            ${inCart ? `Añadido (${inCart.cantidad})` : 'Añadir'}
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    renderEmptyCart() {
        return `
            <div class="cart-empty">
                <i class="fas fa-shopping-basket"></i>
                <p class="mb-1">Tu carrito está vacío</p>
                <small class="text-muted">Añade productos del catálogo</small>
            </div>`;
    },

    renderCartItems() {
        return this.cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nombre}</div>
                    <div class="cart-item-details">$${item.precio.toLocaleString()} x ${item.cantidad}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-price">$${(item.precio * item.cantidad).toLocaleString()}</div>
                    <button class="btn-remove-item" onclick="window.ClientCatalogPage.removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    setupSearch() {
        const searchInput = document.getElementById('catalogSearch');
        const searchClear = document.getElementById('searchClear');
        const searchSpinner = document.getElementById('searchSpinner');
        const searchResultsInfo = document.getElementById('searchResultsInfo');
        
        if (!searchInput) return;
        
        // Debounced search AJAX
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Show/hide clear button
            searchClear.style.display = query ? 'block' : 'none';
            
            // Clear previous timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            if (query === '') {
                // Reset to all products
                searchSpinner.classList.remove('show');
                searchResultsInfo.textContent = '';
                this.filteredProducts = [...this.products];
                this.updateProductsGrid();
                return;
            }
            
            // Show loading
            searchSpinner.classList.add('show');
            
            // Debounce AJAX request (300ms)
            this.searchTimeout = setTimeout(async () => {
                await this.performSearch(query);
                searchSpinner.classList.remove('show');
            }, 300);
        });
        
        // Clear button
        searchClear?.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.style.display = 'none';
            searchInput.focus();
            searchResultsInfo.textContent = '';
            this.filteredProducts = [...this.products];
            this.updateProductsGrid();
        });
    },

    async performSearch(query) {
        const searchResultsInfo = document.getElementById('searchResultsInfo');
        
        try {
            // AJAX search to API
            const results = await window.publicCatalogService.getCatalog(query, 50);
            
            this.filteredProducts = results;
            
            // Update results info
            const count = this.filteredProducts.length;
            searchResultsInfo.textContent = count === 0 
                ? `No se encontraron resultados para "${query}"` 
                : `Se encontraron ${count} producto${count !== 1 ? 's' : ''} para "${query}"`;
            
            this.updateProductsGrid();
            
        } catch (error) {
            console.error('Search error:', error);
            // Fallback to local filter
            this.filteredProducts = this.products.filter(p => 
                p.nombre.toLowerCase().includes(query.toLowerCase()) ||
                (p.categoria && p.categoria.toLowerCase().includes(query.toLowerCase()))
            );
            searchResultsInfo.textContent = `Mostrando ${this.filteredProducts.length} resultados (búsqueda local)`;
            this.updateProductsGrid();
        }
    },

    updateProductsGrid() {
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = this.renderProductCards();
        }
    },

    setupEventListeners() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(el => el.classList.remove('show'));
            }
        });
    },

    async addToCart(productId) {
        // console.log('=== addToCart llamado ===');
        // console.log('window.cartService disponible?', typeof window.cartService);
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Obtener cantidad del input
        const qtyInput = document.getElementById(`qty-${productId}`);
        const cantidad = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
        
        // Validar cantidad
        if (cantidad < 1) {
            this.showToast('Cantidad inválida', 'warning');
            return;
        }
        
        const stock = parseInt(product.stock_total || 0);
        if (cantidad > stock) {
            this.showToast(`Stock máximo disponible: ${stock}`, 'warning');
            return;
        }
        
        try {
            // Guardar en el backend (no en localStorage)
            if (window.cartService) {
                // Verificar cantidad actual en el carrito del backend
                const existingItem = this.cart.find(item => item.producto_id === productId);
                const currentQty = existingItem ? existingItem.cantidad : 0;
                const newCantidad = currentQty + cantidad;
                
                if (newCantidad > stock) {
                    this.showToast(`Stock máximo disponible: ${stock}. Ya tienes ${currentQty} en el carrito.`, 'warning');
                    return;
                }
                
                await window.cartService.addItem({
                    id: product.id,
                    nombre: product.nombre,
                    codigo_barras: product.codigo_barras || null,
                    precio: parseFloat(product.precio_activo || 0),
                    cantidad: cantidad
                });
                
                // Recargar el carrito desde el backend
                await this.loadCartFromBackend();
            } else {
                // Fallback solo en memoria (sin localStorage)
                const existingItem = this.cart.find(item => item.producto_id === productId);
                if (existingItem) {
                    const newCantidad = existingItem.cantidad + cantidad;
                    if (newCantidad > stock) {
                        this.showToast(`Stock máximo disponible: ${stock}. Ya tienes ${existingItem.cantidad} en el carrito.`, 'warning');
                        return;
                    }
                    existingItem.cantidad = newCantidad;
                } else {
                    this.cart.push({
                        producto_id: product.id,
                        nombre: product.nombre,
                        precio: parseFloat(product.precio_activo || 0),
                        cantidad: cantidad,
                        imagen: product.imagen || null
                    });
                }
            }
            
            this.updateCart();
            
            // Actualizar solo el card específico con animación
            this.updateProductCardWithAnimation(productId, cantidad);
            
            this.showToast(`${cantidad} producto${cantidad > 1 ? 's' : ''} añadid${cantidad > 1 ? 'os' : 'o'} al carrito`, 'success');
        } catch (error) {
            console.error('Error al añadir al carrito:', error);
            console.error('¿cartService existe?', typeof window.cartService);
            console.error('¿Token existe?', window.cartService ? window.cartService.getToken() : 'N/A');
            this.showToast('Error al añadir al carrito: ' + error.message, 'danger');
        }
    },
    
    changeQuantity(productId, delta) {
        const qtyInput = document.getElementById(`qty-${productId}`);
        if (!qtyInput) return;
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        let currentQty = parseInt(qtyInput.value) || 1;
        const stock = parseInt(product.stock_total || 0);
        
        // Calcular nueva cantidad
        let newQty = currentQty + delta;
        
        // Si nueva cantidad es menor a 1, remover del carrito con animación
        if (newQty < 1) {
            this.removeFromCartWithAnimation(productId);
            return;
        }
        
        // Validar límite de stock
        if (newQty > stock) newQty = stock;
        
        // Actualizar input
        qtyInput.value = newQty;
        
        // Actualizar botón en el carrito
        this.updateCartItemQuantity(productId, newQty);
        
        // Actualizar botones según límites
        this.updateQuantityButtons(productId, newQty, stock);
        
        // Actualizar mostrar de cantidad en el botón
        this.updateButtonQuantityPreview(productId, newQty);
    },
    
    validateQuantity(productId) {
        const qtyInput = document.getElementById(`qty-${productId}`);
        if (!qtyInput) return;
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        let value = parseInt(qtyInput.value) || 1;
        const stock = parseInt(product.stock_total || 0);
        
        // Validar rango (mínimo 1)
        if (value < 1 || isNaN(value)) {
            this.removeFromCartWithAnimation(productId);
            return;
        }
        if (value > stock) value = stock;
        
        // Actualizar en carrito
        this.updateCartItemQuantity(productId, value);
        
        qtyInput.value = value;
        this.updateQuantityButtons(productId, value, stock);
        this.updateButtonQuantityPreview(productId, value);
    },
    
    updateQuantityDisplay(productId) {
        const qtyInput = document.getElementById(`qty-${productId}`);
        if (!qtyInput) return;
        
        const value = parseInt(qtyInput.value) || 1;
        this.updateButtonQuantityPreview(productId, value);
    },
    
    updateQuantityButtons(productId, currentQty, maxStock) {
        const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!card) return;
        
        const decreaseBtn = card.querySelector('.quantity-btn.decrease');
        const increaseBtn = card.querySelector('.quantity-btn.increase');
        
        // El botón de decrease siempre habilitado cuando hay producto en carrito
        // Permite llegar a 0 y remover el producto
        if (decreaseBtn) {
            decreaseBtn.disabled = false;
        }
        if (increaseBtn) {
            increaseBtn.disabled = currentQty >= maxStock;
        }
    },
    
    updateButtonQuantityPreview(productId, cantidad) {
        const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!card) return;
        
        const btn = card.querySelector('.btn-add-cart');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-cart-plus"></i> Añadir al Carrito`;
        }
    },

removeFromCart(index) {
        const item = this.cart[index];
        if (item && window.cartService && item.id) {
            window.cartService.removeItem(item.id).catch(err => {
                console.error('Error al eliminar del backend:', err);
            });
        }
        this.cart.splice(index, 1);
        this.updateCart();
    },
    
    removeFromCartByProductId(productId) {
        const index = this.cart.findIndex(item => item.producto_id === productId);
        if (index !== -1) {
            const item = this.cart[index];
            // Eliminar del backend
            if (window.cartService && item.id) {
                window.cartService.removeItem(item.id).catch(err => {
                    console.error('Error al eliminar del backend:', err);
                });
            }
            this.cart.splice(index, 1);
            this.updateCart();
            
            // Actualizar el card con animación
            this.updateProductCardToDefault(productId);
        }
    },
    
    removeFromCartWithAnimation(productId) {
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        // Obtener el quantity-wrapper y animarlo para ocultarlo
        const quantityWrapper = productCard.querySelector('.quantity-wrapper');
        const btn = productCard.querySelector('.btn-add-cart');
        
        // Primero removemos del array del carrito
        const index = this.cart.findIndex(item => item.producto_id === productId);
        if (index !== -1) {
            const item = this.cart[index];
            // Eliminar del backend
            if (window.cartService && item.id) {
                window.cartService.removeItem(item.id).catch(err => {
                    console.error('Error al eliminar del backend:', err);
                });
            }
            this.cart.splice(index, 1);
            this.updateCart();
        }
        
        // Animación para ocultar el control de cantidad
        if (quantityWrapper) {
            quantityWrapper.style.transition = 'all 0.25s ease-out';
            quantityWrapper.style.opacity = '0';
            quantityWrapper.style.transform = 'translateX(-15px) scale(0.8)';
            quantityWrapper.style.width = '0';
            quantityWrapper.style.padding = '0';
            quantityWrapper.style.margin = '0';
            quantityWrapper.style.overflow = 'hidden';
        }
        
        // Animación del botón para mostrar "Añadir"
        if (btn) {
            btn.classList.remove('added');
            btn.innerHTML = '<i class="fas fa-cart-plus"></i> Añadir';
            btn.style.transition = 'all 0.25s ease-out';
            btn.style.transform = 'scale(1.05)';
        }
        
        // Después de la animación, actualizar el card completo
        setTimeout(() => {
            this.updateProductCardToDefault(productId);
            this.showToast('Producto removido del carrito', 'info');
        }, 250);
    },
    
    updateProductCardToDefault(productId) {
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const stock = parseInt(product.stock_total || 0);
        const inCart = this.cart.find(item => item.producto_id === productId);
        
        // Generar el nuevo HTML sin control de cantidad
        const newCardHtml = this.renderSingleProductCard(product, stock, inCart);
        
        // Reemplazar contenido
        productCard.innerHTML = newCardHtml;
        
        // Animación para el botón "Añadir"
        const btn = productCard.querySelector('.btn-add-cart');
        if (btn) {
            btn.style.opacity = '0';
            btn.style.transform = 'scale(0.9)';
            
            requestAnimationFrame(() => {
                btn.style.transition = 'all 0.2s ease-out';
                btn.style.opacity = '1';
                btn.style.transform = 'scale(1)';
            });
        }
    },
    
    updateCartItemQuantity(productId, cantidad) {
        const item = this.cart.find(item => item.producto_id === productId);
        if (item) {
            item.cantidad = cantidad;
            // Sincronizar con el backend
            if (window.cartService && item.id) {
                window.cartService.updateQuantity(item.id, cantidad).catch(err => {
                    console.error('Error al actualizar cantidad en backend:', err);
                    this.showToast('Error al actualizar cantidad', 'danger');
                });
            }
            this.updateCart();
        }
    },
    
    updateProductCardWithAnimation(productId, cantidad) {
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const stock = parseInt(product.stock_total || 0);
        const inCart = this.cart.find(item => item.producto_id === productId);
        
        // Generar el nuevo HTML del card
        const newCardHtml = this.renderSingleProductCard(product, stock, inCart);
        
        // Reemplazar contenido inmediatamente para que sea visible
        productCard.innerHTML = newCardHtml;
        
        // Animación de entrada para el quantity-wrapper
        const qtyWrapper = productCard.querySelector('.quantity-wrapper');
        if (qtyWrapper) {
            qtyWrapper.style.opacity = '0';
            qtyWrapper.style.transform = 'translateX(-10px)';
            
            requestAnimationFrame(() => {
                qtyWrapper.style.transition = 'all 0.25s ease-out';
                qtyWrapper.style.opacity = '1';
                qtyWrapper.style.transform = 'translateX(0)';
            });
        }
        
        // También actualizar el botón
        const btn = productCard.querySelector('.btn-add-cart');
        if (btn) {
            btn.classList.add('added');
            btn.innerHTML = '<i class="fas fa-check"></i> Añadido (' + cantidad + ')';
            
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-check"></i> Añadido (' + cantidad + ')';
            }, 2500);
        }
    },
    
    renderSingleProductCard(p, stock, inCart) {
        const hasStock = stock > 0;
        
        let stockBadge = '';
        if (!hasStock) {
            stockBadge = '<span class="product-card-stock out-of-stock">Agotado</span>';
        } else if (stock <= 5) {
            stockBadge = '<span class="product-card-stock low-stock">Poco stock</span>';
        } else {
            stockBadge = '<span class="product-card-stock in-stock">Disponible</span>';
        }
        
        return `
            <div class="product-card-image">
                ${p.imagen ? 
                    `<img src="${p.imagen}" alt="${p.nombre}" class="product-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                    ''}
                <i class="fas fa-pills" style="${p.imagen ? 'display:none;' : ''}"></i>
                <span class="product-card-badge">${p.categoria || 'Medicamento'}</span>
                ${stockBadge}
            </div>
            <div class="product-card-body">
                <h6 class="product-card-title">${p.nombre}</h6>
                <p class="product-card-presentation">${p.presentacion || ''}</p>
                <div class="product-card-price">
                    $${parseFloat(p.precio_activo || 0).toLocaleString()}
                    <span>/ unidad</span>
                </div>
                <div class="product-card-actions">
                    ${hasStock && inCart ? `
                    <div class="quantity-wrapper">
                        <div class="quantity-control">
                            <button class="quantity-btn decrease" onclick="window.ClientCatalogPage.changeQuantity(${p.id}, -1)" ${inCart.cantidad <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" 
                                   class="quantity-input" 
                                   id="qty-${p.id}" 
                                   value="${inCart.cantidad}" 
                                   min="1" 
                                   max="${stock}"
                                   onchange="window.ClientCatalogPage.validateQuantity(${p.id})"
                                   oninput="window.ClientCatalogPage.updateQuantityDisplay(${p.id})">
                            <button class="quantity-btn increase" onclick="window.ClientCatalogPage.changeQuantity(${p.id}, 1)" ${inCart.cantidad >= stock ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    ` : `
                    <div class="quantity-wrapper" style="display: none;"></div>
                    `}
                    <button class="btn-add-cart ${inCart ? 'added' : ''}" 
                            onclick="window.ClientCatalogPage.addToCart(${p.id})" 
                            ${!hasStock ? 'disabled' : ''}>
                        <i class="fas ${inCart ? 'fa-check' : 'fa-cart-plus'}"></i>
                        ${inCart ? `Añadido (${inCart.cantidad})` : 'Añadir'}
                    </button>
                </div>
            </div>`;
    },
    
    updateCart() {
        const cartItems = document.getElementById('cartItems');
        const cartBadge = document.querySelector('.cart-badge');
        
        if (cartItems) {
            cartItems.innerHTML = this.cart.length === 0 
                ? this.renderEmptyCart() 
                : this.renderCartItems();
        }
        
        if (cartBadge) {
            cartBadge.textContent = this.cart.length;
        }
        
        // Update footer if cart has items
        const cartFooter = document.querySelector('.cart-footer');
        if (this.cart.length > 0) {
            if (!cartFooter) {
                // Add footer
                const cartCard = document.querySelector('.catalog-cart-card');
                if (cartCard) {
                    cartCard.insertAdjacentHTML('beforeend', `
                        <div class="cart-footer">
                            <div class="cart-total">
                                <span>Total:</span>
                                <span class="total-amount">$${this.getCartTotal().toLocaleString()}</span>
                            </div>
                            <button class="btn btn-primary btn-checkout w-100" onclick="window.ClientCatalogPage.processPurchase()">
                                <i class="fas fa-credit-card me-2"></i>Finalizar Compra
                            </button>
                        </div>`);
                }
            } else {
                // Update footer
                cartFooter.querySelector('.total-amount').textContent = `$${this.getCartTotal().toLocaleString()}`;
            }
        } else if (cartFooter) {
            cartFooter.remove();
        }
    },

    updateProductButton(productId, cantidad = 1) {
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        const btn = productCard.querySelector('.btn-add-cart');
        if (!btn) return;
        
        // Actualizar clase y contenido del botón
        btn.classList.add('added');
        btn.innerHTML = `<i class="fas fa-check"></i> Añadido (${cantidad})`;
        
        // Restaurar después de 2.5 segundos
        setTimeout(() => {
            const currentInCart = this.cart.find(item => item.producto_id === productId);
            if (currentInCart) {
                btn.innerHTML = `<i class="fas fa-check"></i> Añadido (${currentInCart.cantidad})`;
            } else {
                btn.classList.remove('added');
                btn.innerHTML = '<i class="fas fa-cart-plus"></i> Añadir';
            }
        }, 2500);
    },

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    },

    async processPurchase() {
        if (this.cart.length === 0) {
            this.showToast('El carrito está vacío', 'warning');
            return;
        }
        
        // Redirigir al carrito para completar la compra
        Router.navigate('/cliente/carrito');
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        toast.style.zIndex = '9999';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
};

window.ClientCatalogPage = ClientCatalogPage;