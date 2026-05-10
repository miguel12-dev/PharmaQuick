/**
 * PharmaQuick - Client Cart Page
 * Página de carrito y checkout para clientes
 * Procesa pagos y creación de compras
 */

const ClientCartPage = {
    cart: [],
    isProcessing: false,

    async init(container) {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        
        if (session.rol !== 'CLIENTE') {
            Router.navigate('/ventas');
            return;
        }

        ClientLayout.render(container, 'carrito');
        
        // Cargar carrito desde el backend
        await this.loadCartFromBackend();
        
        // Determinar vista según estado
        this.renderCart();
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
            } else {
                this.cart = [];
            }
        } catch (error) {
            console.error('Error al cargar carrito desde backend:', error);
            this.cart = [];
        }
    },
    
    renderCart() {
        const content = document.getElementById('clientContent');
        
        if (this.cart.length === 0) {
            this.renderEmptyCart(content);
        } else {
            this.renderCheckout(content);
        }
    },
    
    renderEmptyCart(content) {
        content.innerHTML = `
            <div class="shopping-container">
                <div class="text-center py-5">
                    <div class="empty-cart-icon mb-4">
                        <i class="fas fa-shopping-basket text-muted" style="font-size: 3rem;"></i>
                    </div>
                    <h4 class="text-muted mb-3">Tu carrito está vacío</h4>
                    <p class="text-muted mb-4">Explora nuestro catálogo y añade productos a tu carrito</p>
                    <a href="/cliente/catalogo" class="btn btn-primary btn-lg">
                        <i class="fas fa-store me-2"></i> Ir al Catálogo
                    </a>
                </div>
            </div>
            
            <style>
            .shopping-container {
                max-width: 500px;
                margin: 0 auto;
            }
            .empty-cart-icon {
                opacity: 0.5;
            }
            </style>
        `;
    },
    
    renderCheckout(content) {
        const items = this.cart;
        const total = this.getCartTotal();
        
        content.innerHTML = `
            <div class="shopping-container">
                <div class="shopping-page">
                    <!-- Header -->
                    <div class="shopping-header">
                        <h4><i class="fas fa-shopping-cart"></i> Mi Carrito</h4>
                        <span class="badge bg-primary">${items.length} productos</span>
                    </div>
                    
                    <!-- Items -->
                    <div class="checkout-items">
                        ${items.map(item => this.renderCartItem(item)).join('')}
                    </div>
                    
                    <!-- Resumen -->
                    <div class="checkout-summary">
                        <div class="summary-row">
                            <span>Subtotal (${items.length} items)</span>
                            <span>$${total.toLocaleString()}</span>
                        </div>
                        <div class="summary-row">
                            <span>Envío</span>
                            <span class="text-success">Gratis</span>
                        </div>
                        <hr>
                        <div class="summary-row total">
                            <span>Total</span>
                            <span>$${total.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <!-- Formulario de entrega -->
                    <div class="checkout-form">
                        <h5 class="mb-3"><i class="fas fa-shipping-fast me-2"></i>Información de Entrega</h5>
                        
                        <div class="mb-3">
                            <label class="form-label">Dirección de entrega *</label>
                            <input type="text" class="form-control" id="deliveryAddress" 
                                   placeholder="Calle, número, barrio, ciudad" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Nombre de quien recibe *</label>
                            <input type="text" class="form-control" id="deliveryName" 
                                   placeholder="Nombre completo" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Teléfono de contacto *</label>
                            <input type="tel" class="form-control" id="deliveryPhone" 
                                   placeholder="3XX XXX XX XX" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Observaciones (opcional)</label>
                            <textarea class="form-control" id="deliveryNotes" rows="2"
                                   placeholder="Instrucciones especiales para la entrega"></textarea>
                        </div>
                        
                        <!-- Método de pago -->
                        <h5 class="mb-3 mt-4"><i class="fas fa-credit-card me-2"></i>Método de Pago</h5>
                        
                        <div class="payment-methods">
                            <div class="payment-method ${window.ClientCartPage?.paymentMethod === 'card' ? 'selected' : ''}" 
                                 data-method="card" onclick="window.ClientCartPage.selectPaymentMethod('card')">
                                <i class="fas fa-credit-card"></i>
                                <div>
                                    <div class="pm-title">Tarjeta</div>
                                    <div class="pm-subtitle">Crédito/Débito</div>
                                </div>
                            </div>
                            
                            <div class="payment-method ${window.ClientCartPage?.paymentMethod === 'nequi' ? 'selected' : ''}" 
                                 data-method="nequi" onclick="window.ClientCartPage.selectPaymentMethod('nequi')">
                                <i class="fas fa-mobile-alt"></i>
                                <div>
                                    <div class="pm-title">Nequi</div>
                                    <div class="pm-subtitle">310 XXX XX XX</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="payment-method-content d-none" id="nequiFields">
                            <div class="mb-3 mt-2">
                                <label class="form-label">Número Nequi</label>
                                <input type="tel" class="form-control" id="nequiPhone" 
                                       placeholder="310 XXX XX XX">
                            </div>
                        </div>
                        
                        <button class="btn btn-primary btn-lg w-100 mt-4" 
                                id="btnProcessPurchase"
                                onclick="window.ClientCartPage.processPurchase()">
                            <i class="fas fa-lock me-2"></i>Procesar Pago ($ ${total.toLocaleString()})
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
            .shopping-container {
                max-width: 500px;
                margin: 0 auto;
            }
            .shopping-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            .shopping-header h4 {
                margin: 0;
                font-weight: 600;
            }
            .checkout-items {
                margin-bottom: 1rem;
            }
            .cart-item {
                display: flex;
                gap: 0.75rem;
                padding: 0.75rem;
                background: #fff;
                border-radius: 8px;
                margin-bottom: 0.5rem;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .cart-item img {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 6px;
                background: #f8f9fa;
            }
            .cart-item-info {
                flex: 1;
            }
            .cart-item-name {
                font-weight: 500;
                margin-bottom: 0.25rem;
            }
            .cart-item-qty {
                font-size: 0.875rem;
                color: #6c757d;
            }
            .cart-item-price {
                font-weight: 600;
                color: #0d6efd;
            }
            .cart-item-actions {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: flex-end;
            }
            .cart-item-remove {
                background: none;
                border: none;
                color: #dc3545;
                padding: 0.25rem;
                cursor: pointer;
            }
            .checkout-summary {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }
            .summary-row.total {
                font-size: 1.25rem;
                font-weight: 700;
                color: #0d6efd;
            }
            .checkout-form {
                background: #fff;
                border-radius: 8px;
                padding: 1rem;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .payment-methods {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.75rem;
            }
            .payment-method {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .payment-method:hover {
                border-color: #0d6efd;
            }
            .payment-method.selected {
                border-color: #0d6efd;
                background: rgba(13, 110, 253, 0.05);
            }
            .payment-method i {
                font-size: 1.5rem;
                color: #6c757d;
            }
            .payment-method.selected i {
                color: #0d6efd;
            }
            .pm-title {
                font-weight: 600;
            }
            .pm-subtitle {
                font-size: 0.75rem;
                color: #6c757d;
            }
            </style>
        `;
        
        // Establecer método de pago por defecto
        this.paymentMethod = 'card';
    },
    
    renderCartItem(item) {
        const subtotal = item.precio * item.cantidad;
        return `
            <div class="cart-item" id="cart-item-${item.id}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nombre}</div>
                    <div class="cart-item-qty">Cantidad: ${item.cantidad}</div>
                </div>
                <div class="cart-item-actions">
                    <span class="cart-item-price">$${subtotal.toLocaleString()}</span>
                    <button class="cart-item-remove" onclick="window.ClientCartPage.removeItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    },
    
    selectPaymentMethod(method) {
        this.paymentMethod = method;
        
        // Actualizar visual
        document.querySelectorAll('.payment-method').forEach(el => {
            el.classList.remove('selected');
        });
        document.querySelector(`[data-method="${method}"]`)?.classList.add('selected');
        
        // Mostrar/ocultar campos de Nequi
        const nequiFields = document.getElementById('nequiFields');
        if (nequiFields) {
            nequiFields.classList.toggle('d-none', method !== 'nequi');
        }
        
        // Actualizar texto del botón
        const btn = document.getElementById('btnProcessPurchase');
        if (btn) {
            const total = this.getCartTotal();
            btn.innerHTML = `<i class="fas fa-lock me-2"></i>Procesar Pago ($${total.toLocaleString()})`;
        }
    },
    
    async removeItem(itemId) {
        try {
            if (window.cartService) {
                await window.cartService.removeItem(itemId);
            }
            
            // Actualizar UI
            this.cart = this.cart.filter(item => item.id !== itemId);
            this.renderCart();
            
            this.showToast('Producto eliminado del carrito', 'success');
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.showToast('Error al eliminar producto', 'danger');
        }
    },
    
    async processPurchase() {
        // Validar campos del formulario
        const deliveryAddress = document.getElementById('deliveryAddress')?.value;
        const deliveryName = document.getElementById('deliveryName')?.value;
        const deliveryPhone = document.getElementById('deliveryPhone')?.value;
        
        if (!deliveryAddress) {
            this.showToast('Ingresa la dirección de entrega', 'warning');
            return;
        }
        if (!deliveryName) {
            this.showToast('Ingresa tu nombre completo', 'warning');
            return;
        }
        if (!deliveryPhone) {
            this.showToast('Ingresa un teléfono de contacto', 'warning');
            return;
        }
        
        // Validar Nequi si es el método seleccionado
        if (this.paymentMethod === 'nequi') {
            const nequiPhone = document.getElementById('nequiPhone')?.value;
            if (!nequiPhone || nequiPhone.length < 10) {
                this.showToast('Ingresa un número de celular válido', 'warning');
                return;
            }
        }
        
        // Iniciar procesamiento
        this.isProcessing = true;
        this.updateProcessButton(true);
        
        // Simular delay de procesamiento
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
            if (window.cartService) {
                const result = await window.cartService.processPurchase({
                    deliveryAddress: deliveryAddress,
                    deliveryName: deliveryName,
                    deliveryPhone: deliveryPhone,
                    deliveryNotes: document.getElementById('deliveryNotes')?.value || '',
                    paymentMethod: this.paymentMethod === 'card' ? 'TARJETA' : 'NEQUI'
                });
                
                if (result) {
                    // Mostrar éxito
                    this.showToast('Compra procesada exitosamente', 'success');
                    this.renderPurchaseSuccess(result);
                    return;
                }
            }
            
            // Si falla el backend
            throw new Error('Error al procesar la compra');
            
        } catch (error) {
            this.isProcessing = false;
            this.updateProcessButton(false);
            this.showToast(error.message || 'Error en el procesamiento. Intenta de nuevo.', 'danger');
            this.renderCart();
        }
    },
    
    updateProcessButton(processing) {
        const btn = document.getElementById('btnProcessPurchase');
        if (btn) {
            if (processing) {
                btn.disabled = true;
                btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Procesando...`;
            } else {
                const total = this.getCartTotal();
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-lock me-2"></i>Procesar Pago ($${total.toLocaleString()})`;
            }
        }
    },
    
    renderPurchaseSuccess(purchase) {
        const content = document.getElementById('clientContent');
        
        content.innerHTML = `
            <div class="shopping-container">
                <div class="text-center py-4">
                    <div class="success-icon mb-4">
                        <i class="fas fa-check-circle text-success" style="font-size: 3.5rem;"></i>
                    </div>
                    <h3 class="fw-bold text-success mb-2">¡Pago Exitoso!</h3>
                    <p class="text-muted mb-4">Tu pedido ha sido confirmado</p>
                    
                    <div class="card border-0 shadow-sm mb-4 text-start">
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-6 text-muted">Pedido ID:</div>
                                <div class="col-6 fw-bold">${purchase.codigo_pedido || purchase.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6 text-muted">Fecha:</div>
                                <div class="col-6">${new Date(purchase.fecha).toLocaleDateString('es-CO', { 
                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6 text-muted">Método de pago:</div>
                                <div class="col-6">
                                    <i class="fas ${purchase.metodo_pago === 'TARJETA' ? 'fa-credit-card text-primary' : 'fa-mobile-alt text-success'} me-1"></i>
                                    ${purchase.metodo_pago === 'TARJETA' ? 'Tarjeta' : 'Nequi'}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6 text-muted">Total:</div>
                                <div class="col-6 fw-bold text-primary">$${purchase.total.toLocaleString()}</div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-6 text-muted">Entrega en:</div>
                                <div class="col-6 small">${purchase.direccion}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <a href="/cliente/catalogo" class="btn btn-primary btn-lg">
                            <i class="fas fa-store me-2"></i> Seguir Comprando
                        </a>
                        <a href="/cliente/compras" class="btn btn-outline-secondary">
                            <i class="fas fa-receipt me-2"></i> Ver Mis Compras
                        </a>
                    </div>
                </div>
            </div>
            
            <style>
            .shopping-container {
                max-width: 500px;
                margin: 0 auto;
            }
            .success-icon {
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            </style>
        `;
    },
    
    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }
};

// Asignar al window
window.ClientCartPage = ClientCartPage;