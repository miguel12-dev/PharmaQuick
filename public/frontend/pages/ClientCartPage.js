/**
 * PharmaQuick - Client Cart Page
 * Página de carrito y checkout para clientes
 * Procesa pagos y creación de compras
 * 
 * Versión mejorada con:
 * - Selector de método de entrega (envío/recoger)
 * - Costo de envío configurable
 * - Campos de tarjeta para pago
 * - Animaciones fluidas
 */

const ClientCartPage = {
    cart: [],
    isProcessing: false,
    deliveryMethod: 'envio',  // 'envio' o 'recoger'
    paymentMethod: 'card',   // 'card' o 'nequi'
    shippingCost: 3000,      // Costo de envío por defecto

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
        const subtotal = this.getCartTotal();
        const shippingCost = this.deliveryMethod === 'envio' ? this.shippingCost : 0;
        const total = subtotal + shippingCost;
        
        const deliveryFieldsVisible = this.deliveryMethod === 'envio';
        const isPickup = this.deliveryMethod === 'recoger';
        
        content.innerHTML = `
            <div class="pq-cart-container">
                <!-- Header -->
                <div class="pq-cart-header">
                    <div class="pq-header-left">
                        <i class="bi bi-cart3"></i>
                        <h4>Mi Carrito</h4>
                        <span class="pq-badge">${items.length} ${items.length === 1 ? 'producto' : 'productos'}</span>
                    </div>
                    <button class="pq-btn-clear" onclick="window.ClientCartPage.clearCart()">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
                
                <!-- Items -->
                <div class="pq-items-section">
                    ${items.map((item, index) => this.renderCartItem(item, index)).join('')}
                </div>
                
                <!-- Selector de método de entrega -->
                <div class="pq-delivery-section">
                    <h5 class="pq-section-title"><i class="bi bi-truck"></i> Tipo de entrega</h5>
                    <div class="pq-delivery-options">
                        <label class="pq-delivery-option ${this.deliveryMethod === 'envio' ? 'selected' : ''}" 
                               onclick="window.ClientCartPage.selectDeliveryMethod('envio')">
                            <input type="radio" name="delivery" value="envio" ${this.deliveryMethod === 'envio' ? 'checked' : ''}>
                            <div class="pq-delivery-icon">
                                <i class="bi bi-truck"></i>
                            </div>
                            <div class="pq-delivery-info">
                                <span class="pq-delivery-title">Envío a domicilio</span>
                                <span class="pq-delivery-subtitle">Recibe en tu dirección</span>
                            </div>
                            <span class="pq-delivery-price">$3.000</span>
                        </label>
                        
                        <label class="pq-delivery-option ${this.deliveryMethod === 'recoger' ? 'selected' : ''}" 
                               onclick="window.ClientCartPage.selectDeliveryMethod('recoger')">
                            <input type="radio" name="delivery" value="recoger" ${this.deliveryMethod === 'recoger' ? 'checked' : ''}>
                            <div class="pq-delivery-icon pq-delivery-pickup">
                                <i class="bi bi-shop"></i>
                            </div>
                            <div class="pq-delivery-info">
                                <span class="pq-delivery-title">Recoger en tienda</span>
                                <span class="pq-delivery-subtitle">Apartar y pasar a recoger</span>
                            </div>
                            <span class="pq-delivery-price pq-price-free">Gratis</span>
                        </label>
                    </div>
                </div>
                
                <!-- Resumen -->
                <div class="pq-summary-section">
                    <div class="pq-summary-row">
                        <span>Subtotal (${items.length} ${items.length === 1 ? 'item' : 'items'})</span>
                        <span>$${subtotal.toLocaleString()}</span>
                    </div>
                    <div class="pq-summary-row">
                        <span><i class="bi bi-box-seam me-1"></i>Envío</span>
                        <span class="${shippingCost > 0 ? '' : 'pq-text-success'}">
                            ${shippingCost > 0 ? '$' + shippingCost.toLocaleString() : 'Gratis'}
                        </span>
                    </div>
                    ${isPickup ? '<div class="pq-pickup-badge"><i class="bi bi-bag-check"></i> Apartado</div>' : ''}
                    <hr class="pq-summary-divider">
                    <div class="pq-summary-row pq-summary-total">
                        <span>Total a pagar</span>
                        <span>$ ${total.toLocaleString()}</span>
                    </div>
                </div>
                
                <!-- Formulario -->
                <div class="pq-form-section">
                    <!-- Datos de entrega -->
                    <h5 class="pq-section-title"><i class="bi bi-person-badge"></i> Datos de contacto</h5>
                    
                    <div class="pq-input-group">
                        <label>Nombre completo *</label>
                        <input type="text" id="deliveryName" class="pq-input" 
                               placeholder="Nombre completo">
                    </div>
                    
                    <div class="pq-input-group">
                        <label>Teléfono de contacto *</label>
                        <input type="tel" id="deliveryPhone" class="pq-input" 
                               placeholder="3XX XXX XX XX">
                    </div>
                    
                    <!-- Dirección (solo para envío) -->
                    <div class="pq-address-section ${deliveryFieldsVisible ? '' : 'pq-hidden'}">
                        <h5 class="pq-section-title"><i class="bi bi-geo-alt"></i> Dirección de envío</h5>
                        
                        <div class="pq-input-group">
                            <label>Dirección *</label>
                            <input type="text" id="deliveryAddress" class="pq-input" 
                                   placeholder="Calle, número, barrio, ciudad">
                        </div>
                        
                        <div class="pq-input-group">
                            <label>Observaciones (opcional)</label>
                            <textarea id="deliveryNotes" class="pq-input pq-textarea" rows="2"
                                   placeholder="Instrucciones especiales para la entrega"></textarea>
                        </div>
                    </div>
                    
                    ${isPickup ? `
                    <div class="pq-pickup-info">
                        <i class="bi bi-info-circle"></i>
                        <p>Tu pedido será apartado por 48 horas. Pasando este tiempo, será cancelado si no lo recoges.</p>
                    </div>
                    ` : ''}
                    
                    <!-- Método de pago -->
                    <h5 class="pq-section-title"><i class="bi bi-credit-card"></i> Método de pago</h5>
                    
                    <div class="pq-payment-options">
                        <div class="pq-payment-option ${this.paymentMethod === 'card' ? 'selected' : ''}" 
                             onclick="window.ClientCartPage.selectPaymentMethod('card')">
                            <i class="bi bi-credit-card-2-front"></i>
                            <span>Tarjeta</span>
                        </div>
                        <div class="pq-payment-option ${this.paymentMethod === 'nequi' ? 'selected' : ''}" 
                             onclick="window.ClientCartPage.selectPaymentMethod('nequi')">
                            <i class="bi bi-phone"></i>
                            <span>Nequi</span>
                        </div>
                    </div>
                    
                    <!-- Campos de tarjeta -->
                    <div class="pq-card-fields ${this.paymentMethod === 'card' ? '' : 'pq-hidden'}">
                        <div class="pq-input-group">
                            <label>Número de tarjeta</label>
                            <input type="text" id="cardNumber" class="pq-input" 
                                   placeholder="1234 5678 9012 3456" maxlength="19">
                        </div>
                        <div class="pq-card-row">
                            <div class="pq-input-group">
                                <label>Fecha</label>
                                <input type="text" id="cardExpiry" class="pq-input" 
                                       placeholder="MM/AA" maxlength="5">
                            </div>
                            <div class="pq-input-group">
                                <label>CVV</label>
                                <input type="text" id="cardCvv" class="pq-input" 
                                       placeholder="123" maxlength="4">
                            </div>
                        </div>
                        <div class="pq-input-group">
                            <label>Nombre en tarjeta</label>
                            <input type="text" id="cardName" class="pq-input" 
                                   placeholder="Nombre como aparece en la tarjeta">
                        </div>
                    </div>
                    
                    <!-- Campos de Nequi -->
                    <div class="pq-nequi-fields ${this.paymentMethod === 'nequi' ? '' : 'pq-hidden'}">
                        <div class="pq-input-group">
                            <label>Número Nequi vinculado</label>
                            <input type="tel" id="nequiPhone" class="pq-input" 
                                   placeholder="310 XXX XX XX">
                        </div>
                        <p class="pq-nequi-info"><i class="bi bi-envelope"></i> Se enviará confirmación al correo</p>
                    </div>
                    
                    <!-- Botón de compra -->
                    <button class="pq-btn-checkout" id="btnProcessPurchase"
                            onclick="window.ClientCartPage.processPurchase()">
                        <i class="bi bi-lock-fill"></i>
                        <span>${isPickup ? 'Confirmar Apartado' : 'Pagar'} $${total.toLocaleString()}</span>
                    </button>
                </div>
            </div>
            
            ${this.getCartStyles()}
        `;
        
        // Inicializar estado
        this.paymentMethod = 'card';
        this.deliveryMethod = 'envio';
    },
    
    renderCartItem(item, index) {
        const subtotal = item.precio * item.cantidad;
        return `
            <div class="pq-cart-item" id="cart-item-${item.id}" style="animation-delay: ${index * 0.05}s">
                <div class="pq-item-image">
                    <i class="bi bi-capsule"></i>
                </div>
                <div class="pq-item-details">
                    <span class="pq-item-name">${item.nombre}</span>
                    <span class="pq-item-qty">Cant: ${item.cantidad}</span>
                </div>
                <div class="pq-item-actions">
                    <span class="pq-item-price">$${subtotal.toLocaleString()}</span>
                    <button class="pq-btn-remove" onclick="window.ClientCartPage.removeItem(${item.id})">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    getCartStyles() {
        return `
            <style>
            .pq-cart-container {
                max-width: 600px;
                margin: 0 auto;
                padding: 1rem;
                animation: pqFadeIn 0.4s ease-out;
            }
            
            /* Header */
            .pq-cart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.25rem;
                background: white;
                border-radius: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                margin-bottom: 1rem;
            }
            
            .pq-header-left {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .pq-header-left i {
                font-size: 1.5rem;
                color: #3eb489;
            }
            
            .pq-header-left h4 {
                margin: 0;
                font-weight: 700;
                color: #1e293b;
            }
            
            .pq-badge {
                background: #3eb489;
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .pq-btn-clear {
                background: none;
                border: none;
                color: #94a3b8;
                padding: 0.5rem;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .pq-btn-clear:hover {
                background: #fee2e2;
                color: #ef4444;
            }
            
            /* Items */
            .pq-items-section {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            
            .pq-cart-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.85rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                animation: pqSlideUp 0.4s ease-out backwards;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .pq-cart-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            }
            
            .pq-item-image {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .pq-item-image i {
                color: #3eb489;
                font-size: 1.25rem;
            }
            
            .pq-item-details {
                flex: 1;
                min-width: 0;
            }
            
            .pq-item-name {
                display: block;
                font-weight: 600;
                color: #1e293b;
                font-size: 0.9rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .pq-item-qty {
                display: block;
                font-size: 0.8rem;
                color: #64748b;
                margin-top: 0.15rem;
            }
            
            .pq-item-actions {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .pq-item-price {
                font-weight: 700;
                color: #3eb489;
                font-size: 1rem;
            }
            
            .pq-btn-remove {
                background: none;
                border: none;
                color: #94a3b8;
                padding: 0.4rem;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s;
            }
            
            .pq-btn-remove:hover {
                background: #fee2e2;
                color: #ef4444;
            }
            
            /* Delivery Section */
            .pq-delivery-section {
                background: white;
                border-radius: 16px;
                padding: 1.25rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                margin-bottom: 1rem;
            }
            
            .pq-section-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.95rem;
                font-weight: 600;
                color: #334155;
                margin-bottom: 1rem;
            }
            
            .pq-section-title i {
                color: #3eb489;
            }
            
            .pq-delivery-options {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .pq-delivery-option {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .pq-delivery-option:hover {
                border-color: #3eb489;
            }
            
            .pq-delivery-option.selected {
                border-color: #3eb489;
                background: rgba(62, 180, 137, 0.08);
            }
            
            .pq-delivery-option input {
                display: none;
            }
            
            .pq-delivery-icon {
                width: 40px;
                height: 40px;
                background: #3eb489;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .pq-delivery-icon i {
                color: white;
                font-size: 1.1rem;
            }
            
            .pq-delivery-pickup {
                background: #f59e0b;
            }
            
            .pq-delivery-info {
                flex: 1;
            }
            
            .pq-delivery-title {
                display: block;
                font-weight: 600;
                color: #1e293b;
                font-size: 0.9rem;
            }
            
            .pq-delivery-subtitle {
                display: block;
                font-size: 0.75rem;
                color: #64748b;
                margin-top: 0.15rem;
            }
            
            .pq-delivery-price {
                font-weight: 700;
                color: #334155;
            }
            
            .pq-price-free {
                color: #3eb489;
            }
            
            /* Summary */
            .pq-summary-section {
                background: white;
                border-radius: 16px;
                padding: 1.25rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                margin-bottom: 1rem;
            }
            
            .pq-summary-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
                color: #64748b;
            }
            
            .pq-text-success {
                color: #3eb489 !important;
            }
            
            .pq-summary-divider {
                border: none;
                border-top: 1px dashed #e2e8f0;
                margin: 1rem 0;
            }
            
            .pq-summary-total {
                font-size: 1.25rem;
                font-weight: 700;
                color: #1e293b;
            }
            
            .pq-summary-total span:last-child {
                color: #3eb489;
            }
            
            .pq-pickup-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                padding: 0.4rem 0.75rem;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                margin: 0.5rem 0;
            }
            
            /* Form */
            .pq-form-section {
                background: white;
                border-radius: 16px;
                padding: 1.25rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            }
            
            .pq-form-group {
                margin-bottom: 1.25rem;
                animation: pqFadeIn 0.3s ease-out;
            }
            
            .pq-form-group.pq-hidden,
            .pq-address-section.pq-hidden {
                display: none;
            }
            
            .pq-input-group {
                margin-bottom: 1rem;
            }
            
            .pq-input-group label {
                display: block;
                font-size: 0.8rem;
                font-weight: 600;
                color: #475569;
                margin-bottom: 0.35rem;
            }
            
            .pq-input {
                width: 100%;
                padding: 0.75rem 1rem;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                font-size: 0.9rem;
                transition: all 0.2s;
                background: #f8fafc;
            }
            
            .pq-input:focus {
                outline: none;
                border-color: #3eb489;
                background: white;
                box-shadow: 0 0 0 3px rgba(62, 180, 137, 0.15);
            }
            
            .pq-textarea {
                resize: none;
            }
            
            .pq-card-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.75rem;
            }
            
            .pq-card-fields, .pq-nequi-fields {
                margin-top: 1rem;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 12px;
                animation: pqFadeIn 0.3s ease-out;
            }
            
            .pq-card-fields.pq-hidden, .pq-nequi-fields.pq-hidden {
                display: none;
            }
            
            .pq-nequi-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.8rem;
                color: #64748b;
                margin-top: 0.75rem;
            }
            
            .pq-nequi-info i {
                color: #3eb489;
            }
            
            .pq-pickup-info {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                padding: 1rem;
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-radius: 12px;
                margin-bottom: 1.25rem;
            }
            
            .pq-pickup-info i {
                color: #d97706;
                font-size: 1.1rem;
                margin-top: 0.15rem;
            }
            
            .pq-pickup-info p {
                margin: 0;
                font-size: 0.85rem;
                color: #92400e;
            }
            
            /* Payment Options */
            .pq-payment-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            
            .pq-payment-option {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1rem;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 600;
                color: #64748b;
            }
            
            .pq-payment-option:hover {
                border-color: #3eb489;
                color: #3eb489;
            }
            
            .pq-payment-option.selected {
                border-color: #3eb489;
                background: rgba(62, 180, 137, 0.08);
                color: #3eb489;
            }
            
            .pq-payment-option i {
                font-size: 1.25rem;
            }
            
            /* Checkout Button */
            .pq-btn-checkout {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                padding: 1rem;
                background: linear-gradient(135deg, #3eb489 0%, #2d9a70 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                margin-top: 1rem;
            }
            
            .pq-btn-checkout:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(62, 180, 137, 0.4);
            }
            
            .pq-btn-checkout:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
            
            .pq-btn-checkout i {
                font-size: 1rem;
            }
            
            /* Animations */
            @keyframes pqFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes pqSlideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes pqPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            /* Responsive */
            @media (max-width: 480px) {
                .pq-cart-container {
                    padding: 0.5rem;
                }
                
                .pq-delivery-options {
                    gap: 0.5rem;
                }
                
                .pq-delivery-option {
                    padding: 0.75rem;
                }
            }
            </style>
        `;
    },
    
    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    },
    
    selectDeliveryMethod(method) {
        this.deliveryMethod = method;
        
        // Actualizar UI - opciones de entrega
        document.querySelectorAll('.pq-delivery-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Seleccionar la opción correcta
        const selectedOption = document.querySelector(`.pq-delivery-option[onclick*="${method}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Mostrar/ocultar campos de dirección según el método
        const addressSection = document.querySelector('.pq-address-section');
        if (addressSection) {
            if (method === 'recoger') {
                addressSection.classList.add('pq-hidden');
            } else {
                addressSection.classList.remove('pq-hidden');
            }
        }
        
        // Actualizar el resumen (totales)
        this.updateSummary();
        
        // Actualizar botón
        this.updateProcessButton(false);
    },
    
    updateSummary() {
        // Actualizar visualización de totales
        const subtotal = this.getCartTotal();
        const shippingCost = this.deliveryMethod === 'envio' ? this.shippingCost : 0;
        const total = subtotal + shippingCost;
        
        // Actualizar costo de envío en el resumen
        const shippingElement = document.querySelector('.pq-summary-row:nth-child(2) span:last-child');
        if (shippingElement) {
            if (shippingCost > 0) {
                shippingElement.textContent = '$' + shippingCost.toLocaleString();
                shippingElement.classList.remove('pq-text-success');
            } else {
                shippingElement.textContent = 'Gratis';
                shippingElement.classList.add('pq-text-success');
            }
        }
        
        // Actualizar badge de Apartado
        const pickupBadge = document.querySelector('.pq-pickup-badge');
        const isPickup = this.deliveryMethod === 'recoger';
        
        // Agregar o quitar badge según corresponda
        if (isPickup && !pickupBadge) {
            const summarySection = document.querySelector('.pq-summary-section');
            const badge = document.createElement('div');
            badge.className = 'pq-pickup-badge';
            badge.innerHTML = '<i class="bi bi-bag-check"></i> Apartado';
            const divider = summarySection.querySelector('.pq-summary-divider');
            if (divider) {
                summarySection.insertBefore(badge, divider);
            }
        } else if (!isPickup && pickupBadge) {
            pickupBadge.remove();
        }
        
        // Actualizar total
        const totalElement = document.querySelector('.pq-summary-total span:last-child');
        if (totalElement) {
            totalElement.textContent = '$ ' + total.toLocaleString();
        }
    },
    
    selectPaymentMethod(method) {
        this.paymentMethod = method;
        
        // Actualizar visual - opciones de pago
        document.querySelectorAll('.pq-payment-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Seleccionar la opción correcta
        const selectedOption = document.querySelector(`.pq-payment-option[onclick*="${method}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Mostrar/ocultar campos de tarjeta
        const cardFields = document.querySelector('.pq-card-fields');
        if (cardFields) {
            if (method === 'card') {
                cardFields.classList.remove('pq-hidden');
            } else {
                cardFields.classList.add('pq-hidden');
            }
        }
        
        // Mostrar/ocultar campos de Nequi
        const nequiFields = document.querySelector('.pq-nequi-fields');
        if (nequiFields) {
            if (method === 'nequi') {
                nequiFields.classList.remove('pq-hidden');
            } else {
                nequiFields.classList.add('pq-hidden');
            }
        }
        
        // Actualizar texto del botón
        this.updateProcessButton(false);
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
    
    async clearCart() {
        try {
            if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
                if (window.cartService) {
                    await window.cartService.clearCart();
                }
                
                this.cart = [];
                this.renderCart();
                
                this.showToast('Carrito vaciado', 'success');
            }
        } catch (error) {
            console.error('Error al limpiar:', error);
            this.showToast('Error al vaciar el carrito', 'danger');
        }
    },
    
    async processPurchase() {
        // Validar según método de entrega
        let deliveryAddress = '';
        let deliveryName = document.getElementById('deliveryName')?.value;
        let deliveryPhone = document.getElementById('deliveryPhone')?.value;
        
        if (this.deliveryMethod === 'envio') {
            // Requiere dirección para envío
            deliveryAddress = document.getElementById('deliveryAddress')?.value;
            if (!deliveryAddress) {
                this.showToast('Ingresa la dirección de entrega', 'warning');
                return;
            }
        } else {
            // Para recoger en tienda, enviar N/A
            deliveryAddress = 'N/A - Recoger en tienda';
        }
        
        if (!deliveryName) {
            this.showToast('Ingresa tu nombre completo', 'warning');
            return;
        }
        if (!deliveryPhone) {
            this.showToast('Ingresa un teléfono de contacto', 'warning');
            return;
        }
        
        // Validar según método de pago
        if (this.paymentMethod === 'nequi') {
            const nequiPhone = document.getElementById('nequiPhone')?.value;
            if (!nequiPhone || nequiPhone.length < 10) {
                this.showToast('Ingresa un número de celular válido', 'warning');
                return;
            }
        }
        
        if (this.paymentMethod === 'card') {
            // Validar campos de tarjeta
            const cardNumber = document.getElementById('cardNumber')?.value;
            const cardExpiry = document.getElementById('cardExpiry')?.value;
            const cardCvv = document.getElementById('cardCvv')?.value;
            const cardName = document.getElementById('cardName')?.value;
            
            if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
                this.showToast('Ingresa un número de tarjeta válido', 'warning');
                return;
            }
            if (!cardExpiry || cardExpiry.length < 5) {
                this.showToast('Ingresa la fecha de expiración', 'warning');
                return;
            }
            if (!cardCvv || cardCvv.length < 3) {
                this.showToast('Ingresa el CVV', 'warning');
                return;
            }
            if (!cardName) {
                this.showToast('Ingresa el nombre en la tarjeta', 'warning');
                return;
            }
        }
        
        // Iniciar procesamiento
        this.isProcessing = true;
        this.updateProcessButton(true);
        
        try {
            // Llamar al backend
            if (window.cartService) {
                const result = await window.cartService.processPurchase({
                    deliveryAddress: deliveryAddress,
                    deliveryName: deliveryName,
                    deliveryPhone: deliveryPhone,
                    deliveryNotes: document.getElementById('deliveryNotes')?.value || '',
                    paymentMethod: this.paymentMethod === 'card' ? 'TARJETA' : 'NEQUI',
                    metodo_entrega: this.deliveryMethod === 'envio' ? 'ENVIO' : 'RECOGER'
                });
                
                // Ir directamente a la pantalla de éxito
                this.renderPurchaseSuccess(result);
                return;
            }
            
            throw new Error('Carrito no disponible');
            
        } catch (error) {
            console.error('Error en compra:', error);
            this.isProcessing = false;
            this.updateProcessButton(false);
            this.showToast(error.message || 'Error al procesar. Intenta de nuevo.', 'danger');
        }
    },
    
    updateProcessButton(processing) {
        const btn = document.getElementById('btnProcessPurchase');
        const subtotal = this.getCartTotal();
        const shippingCost = this.deliveryMethod === 'envio' ? this.shippingCost : 0;
        const total = subtotal + shippingCost;
        const isPickup = this.deliveryMethod === 'recoger';
        
        if (btn) {
            if (processing) {
                btn.disabled = true;
                btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Procesando...`;
            } else {
                btn.disabled = false;
                const icon = isPickup ? '<i class="bi bi-bag-check"></i>' : '<i class="bi bi-lock-fill"></i>';
                const text = isPickup ? 'Confirmar Apartado' : 'Pagar';
                btn.innerHTML = `${icon} <span>${text} $${total.toLocaleString()}</span>`;
            }
        }
    },
    
    renderPurchaseSuccess(purchase) {
        // Limpiar el carrito y el contenido
        this.cart = [];
        
        const content = document.getElementById('clientContent');
        if (content) {
            content.style.display = 'none';
        }
        
        const isPickup = purchase.metodo_entrega === 'RECOGER';
        const title = isPickup ? '¡Apartado Confirmado!' : '¡Pago Exitoso!';
        const subtitle = isPickup ? 'Tu pedido ha sido apartado' : 'Tu pedido ha sido confirmado';
        
        // Crear modal de éxito
        const modal = document.createElement('div');
        modal.className = 'pq-modal-notification pq-modal-success-wrapper';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 10000;';
        modal.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"></div>
            <div style="position: relative; background: white; border-radius: 20px; padding: 2.5rem 2rem; text-align: center; max-width: 350px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: pqPop 0.3s ease-out;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                    <i class="bi bi-check-lg" style="font-size: 2.5rem; color: white;"></i>
                </div>
                <h3 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">${title}</h3>
                <p style="color: #64748b; margin-bottom: 1.5rem;">${subtitle}</p>
                
                <div style="background: #f8fafc; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; text-align: left;">
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed #e2e8f0;">
                        <span style="color: #64748b; font-size: 0.875rem;">Pedido</span>
                        <span style="font-weight: 600; color: #1e293b;">${purchase.codigo_pedido || purchase.id}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed #e2e8f0;">
                        <span style="color: #64748b; font-size: 0.875rem;">Total</span>
                        <span style="font-weight: 700; color: #10b981; font-size: 1.1rem;">$ ${purchase.total.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed #e2e8f0;">
                        <span style="color: #64748b; font-size: 0.875rem;">Método</span>
                        <span style="font-weight: 600; color: #1e293b;">${purchase.metodo_pago === 'TARJETA' ? 'Tarjeta' : 'Nequi'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                        <span style="color: #64748b; font-size: 0.875rem;">Entrega</span>
                        <span style="font-weight: 600; color: #1e293b;">${isPickup ? 'Recoger en tienda' : 'Envío a domicilio'}</span>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <a href="/cliente/catalogo" onclick="document.querySelector('.pq-modal-success-wrapper')?.remove(); window.location.href='/cliente/catalogo';" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.5rem; border-radius: 12px; font-weight: 600; text-decoration: none; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; transition: all 0.2s; cursor: pointer;">
                        <i class="bi bi-bag"></i> Seguir Comprando
                    </a>
                    <a href="/cliente/compras" onclick="document.querySelector('.pq-modal-success-wrapper')?.remove();" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.5rem; border-radius: 12px; font-weight: 600; text-decoration: none; background: #f1f5f9; color: #475569; transition: all 0.2s; cursor: pointer;">
                        <i class="bi bi-receipt"></i> Mis Compras
                    </a>
                </div>
            </div>
            
            <style>
            @keyframes pqPop {
                from { opacity: 0; transform: scale(0.9) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            </style>
        `;
        
        // Eliminar cualquier modal anterior
        const oldModal = document.querySelector('.pq-modal-notification');
        if (oldModal) oldModal.remove();
        
        document.body.appendChild(modal);
    },
    
    showModal(message, type = 'info') {
        // Eliminar modal anterior si existe
        const existingModal = document.querySelector('.pq-modal-notification');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Iconos según tipo
        const icons = {
            success: '<i class="bi bi-check-circle-fill"></i>',
            danger: '<i class="bi bi-exclamation-circle-fill"></i>',
            warning: '<i class="bi bi-exclamation-triangle-fill"></i>',
            info: '<i class="bi bi-info-circle-fill"></i>'
        };
        
        const colors = {
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        const color = colors[type] || colors.info;
        
        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'pq-modal-notification';
        modal.innerHTML = `
            <div class="pq-modal-backdrop"></div>
            <div class="pq-modal-content pq-modal-animate">
                <div class="pq-modal-icon" style="color: ${color}">
                    ${icons[type] || icons.info}
                </div>
                <p class="pq-modal-message">${message}</p>
                <button class="pq-modal-btn" style="background: ${color}" onclick="this.closest('.pq-modal-notification').remove()">
                    Aceptar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Agregar estilos si no existen
        if (!document.getElementById('pq-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'pq-modal-styles';
            styles.textContent = `
                .pq-modal-notification {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .pq-modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                }
                .pq-modal-content {
                    position: relative;
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    text-align: center;
                    max-width: 320px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    animation: pqModalPop 0.3s ease-out;
                }
                .pq-modal-animate {
                    animation: pqModalPop 0.3s ease-out;
                }
                @keyframes pqModalPop {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .pq-modal-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                .pq-modal-message {
                    font-size: 1rem;
                    color: #374151;
                    margin-bottom: 1.5rem;
                    line-height: 1.5;
                }
                .pq-modal-btn {
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .pq-modal-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Auto cerrar después de 4 segundos para SUCCESS
        if (type === 'success') {
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 4000);
        }
    },
    
    showToast(message, type = 'info') {
        // Usar el toast global si existe, si no usar alert básico
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            // Toast simple manual
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 24px;
                background: ${type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
                color: white;
                border-radius: 8px;
                font-weight: 500;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }
};

window.ClientCartPage = ClientCartPage;