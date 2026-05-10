/**
 * PharmaQuick - Client Shopping Page
 * Página de compras con simulación de pago real (Tarjeta/Nequi)
 * Conectado a la base de datos
 */

const ClientShoppingPage = {
    cart: [],
    purchaseHistory: [],
    isProcessing: false,
    
    async init(container) {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        
        if (session.rol !== 'CLIENTE') {
            Router.navigate('/ventas');
            return;
        }

        ClientLayout.render(container, 'compras');
        
        // Cargar carrito
        this.cart = JSON.parse(localStorage.getItem('clientCart') || '[]');
        
        // Cargar historial desde el backend
        try {
            if (window.shoppingService) {
                this.purchaseHistory = await window.shoppingService.getPurchases();
            } else {
                // Fallback a localStorage si el servicio no está disponible
                this.purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
            }
        } catch (error) {
            console.error('Error loading purchases:', error);
            
            // Si el error es de sesión expirada, NO continuar - el modal ya se mostrará
            if (error.message === 'Sesión expirada') {
                return; // Salir, el modal de sesión expirada ya está mostrando
            }
            
            // Para otros errores, usar fallback local
            this.purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
        }
        
        // Determinar vista según estado
        this.renderShopping();
    },
    
    renderShopping() {
        const content = document.getElementById('clientContent');
        
        if (this.cart.length === 0 && this.purchaseHistory.length > 0) {
            // Mostrar historial de compras
            this.renderPurchaseHistory(content);
        } else if (this.cart.length === 0) {
            // Carrito vacío
            this.renderEmptyCart(content);
        } else {
            // Mostrar checkout
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
                
                <!-- Mostrar historial si existe -->
                ${this.purchaseHistory.length > 0 ? `
                <div class="mt-5">
                    <h5 class="mb-3"><i class="fas fa-history me-2"></i>Compras Recientes</h5>
                    <div class="purchase-list">
                        ${this.purchaseHistory.slice(0, 3).map(p => this.renderPurchaseCard(p)).join('')}
                    </div>
                    <button class="btn btn-link w-100 mt-2" onclick="window.ClientShoppingPage.showAllPurchases()">
                        Ver todas las compras <i class="fas fa-arrow-right ms-1"></i>
                    </button>
                </div>
                ` : ''}
            </div>
            
            <style>
            .shopping-container {
                max-width: 800px;
                margin: 0 auto;
            }
            .empty-cart-icon {
                opacity: 0.5;
            }
            </style>
        `;
    },
    
    renderCheckout(content) {
        const total = this.getCartTotal();
        
        content.innerHTML = `
            <div class="shopping-container">
                <!-- Header -->
                <div class="checkout-header mb-4">
                    <h4 class="fw-bold"><i class="fas fa-shopping-cart me-2"></i>Finalizar Compra</h4>
                    <p class="text-muted small">${this.cart.length} producto(s) en tu carrito</p>
                </div>
                
                <!-- Resumen del carrito -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-white py-3">
                        <h6 class="mb-0 fw-bold">Resumen del Pedido</h6>
                    </div>
                    <div class="card-body p-0">
                        ${this.cart.map((item, index) => `
                            <div class="cart-item d-flex justify-content-between align-items-center p-3 ${index > 0 ? 'border-top' : ''}">
                                <div class="d-flex align-items-center">
                                    ${item.imagen 
                                        ? `<div class="cart-product-image me-3">
                                            <img src="${item.imagen}" alt="${item.nombre}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-pills text-muted\\'></i>'">
                                           </div>`
                                        : `<div class="cart-icon-placeholder me-3">
                                            <i class="fas fa-pills text-muted"></i>
                                           </div>`
                                    }
                                    <div>
                                        <h6 class="mb-1">${item.nombre}</h6>
                                        <small class="text-muted">$${item.precio.toLocaleString()} x ${item.cantidad}</small>
                                    </div>
                                </div>
                                <div class="text-end">
                                    <strong>$${(item.precio * item.cantidad).toLocaleString()}</strong>
                                    <button class="btn btn-sm btn-link text-danger d-block" onclick="window.ClientShoppingPage.removeItem(${index})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="card-footer bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold">Total a pagar:</span>
                            <span class="fs-5 fw-bold text-primary">$${total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Método de pago -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-white py-3">
                        <h6 class="mb-0 fw-bold"><i class="fas fa-credit-card me-2"></i>Método de Pago</h6>
                    </div>
                    <div class="card-body">
                        <div class="payment-methods">
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="radio" name="paymentMethod" id="paymentCard" value="card" checked>
                                <label class="form-check-label w-100" for="paymentCard">
                                    <div class="payment-option d-flex align-items-center p-3 border rounded">
                                        <i class="fas fa-credit-card text-primary me-3" style="font-size: 1.25rem;"></i>
                                        <div>
                                            <strong>Tarjeta de Crédito/Débito</strong>
                                            <small class="d-block text-muted">Visa, Mastercard, PSE</small>
                                        </div>
                                    </div>
                                </label>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="radio" name="paymentMethod" id="paymentNequi" value="nequi">
                                <label class="form-check-label w-100" for="paymentNequi">
                                    <div class="payment-option d-flex align-items-center p-3 border rounded">
                                        <i class="fas fa-mobile-alt text-success me-3" style="font-size: 1.25rem;"></i>
                                        <div>
                                            <strong>Nequi</strong>
                                            <small class="d-block text-muted">Pago con tu número celular</small>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Formulario de pago según método -->
                        <div id="paymentForm" class="mt-4">
                            <!-- Tarjeta -->
                            <div id="cardForm" class="payment-form">
                                <div class="row g-3">
                                    <div class="col-12">
                                        <label class="form-label small text-muted">Número de Tarjeta</label>
                                        <input type="text" class="form-control" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small text-muted">Fecha de Vencimiento</label>
                                        <input type="text" class="form-control" id="cardExpiry" placeholder="MM/AA" maxlength="5">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small text-muted">CVV</label>
                                        <input type="text" class="form-control" id="cardCvv" placeholder="123" maxlength="4">
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label small text-muted">Nombre del Titular</label>
                                        <input type="text" class="form-control" id="cardName" placeholder="Nombre como aparece en la tarjeta">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Nequi -->
                            <div id="nequiForm" class="payment-form d-none">
                                <div class="alert alert-info mb-0">
                                    <i class="fas fa-info-circle me-2"></i>
                                    <strong>Instrucciones Nequi:</strong>
                                    <ol class="mb-0 mt-2">
                                        <li>Se enviará un código de verificación a tu celular</li>
                                        <li>Ingresa el código en la app Nequi</li>
                                        <li>Confirma el pago por $${total.toLocaleString()}</li>
                                    </ol>
                                </div>
                                <div class="mt-3">
                                    <label class="form-label small text-muted">Número de Celular Nequi</label>
                                    <input type="tel" class="form-control" id="nequiPhone" placeholder="3101234567" maxlength="10" inputmode="numeric" pattern="[0-9]*">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Información de entrega -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-white py-3">
                        <h6 class="mb-0 fw-bold"><i class="fas fa-shipping-fast me-2"></i>Información de Entrega</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small text-muted">Dirección de Entrega</label>
                                <input type="text" class="form-control" id="deliveryAddress" placeholder="Calle, número, barrio, ciudad">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small text-muted">Nombre Completo</label>
                                <input type="text" class="form-control" id="deliveryName" placeholder="Tu nombre completo">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small text-muted">Teléfono de Contacto</label>
                                <input type="tel" class="form-control" id="deliveryPhone" placeholder="3101234567" maxlength="10" inputmode="numeric" pattern="[0-9]*">
                            </div>
                            <div class="col-12">
                                <label class="form-label small text-muted">Observaciones (opcional)</label>
                                <textarea class="form-control" id="deliveryNotes" rows="2" placeholder="Instrucciones especiales para la entrega"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Botón de pago -->
                <div class="d-grid gap-2">
                    <button class="btn btn-primary btn-lg" onclick="window.ClientShoppingPage.processPayment()" ${this.isProcessing ? 'disabled' : ''}>
                        ${this.isProcessing 
                            ? '<span class="spinner-border spinner-border-sm me-2"></span> Procesando...' 
                            : `<i class="fas fa-lock me-2"></i> Pagar $${total.toLocaleString()}`
                        }
                    </button>
                    <a href="/cliente/catalogo" class="btn btn-outline-secondary">
                        <i class="fas fa-arrow-left me-2"></i> Continuar Comprando
                    </a>
                </div>
                
                <!-- Mensaje de seguridad -->
                <div class="text-center mt-3">
                    <small class="text-muted">
                        <i class="fas fa-shield-alt me-1"></i>
                        Tus datos están seguros. Simulación de pago para pruebas.
                    </small>
                </div>
            </div>
            
            <style>
            .shopping-container {
                max-width: 600px;
                margin: 0 auto;
            }
            .payment-option {
                cursor: pointer;
                transition: all 0.2s;
            }
            .payment-option:hover {
                border-color: var(--bs-primary) !important;
                background: var(--bs-light);
            }
            .form-check-input:checked + .label .payment-option {
                border-color: var(--bs-primary);
                background: rgba(var(--bs-primary-rgb), 0.1);
            }
            .cart-product-image {
                width: 60px;
                height: 60px;
                flex-shrink: 0;
                border-radius: 8px;
                overflow: hidden;
                background: #f8f9fa;
            }
            .cart-product-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .cart-icon-placeholder {
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8f9fa;
                border-radius: 8px;
                flex-shrink: 0;
            }
            .cart-icon-placeholder i {
                font-size: 1.5rem;
            }
            </style>
        `;
        
        // Configurar event listeners para cambio de método de pago
        this.setupPaymentListeners();
    },
    
    setupPaymentListeners() {
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const cardForm = document.getElementById('cardForm');
                const nequiForm = document.getElementById('nequiForm');
                
                if (e.target.value === 'card') {
                    cardForm.classList.remove('d-none');
                    nequiForm.classList.add('d-none');
                } else {
                    cardForm.classList.add('d-none');
                    nequiForm.classList.remove('d-none');
                }
            });
        });
        
        // Formatear número de tarjeta (solo números)
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{4})/g, '$1 ').trim();
                e.target.value = value;
            });
        }
        
        // Formatear fecha de expiración (solo números)
        const cardExpiry = document.getElementById('cardExpiry');
        if (cardExpiry) {
            cardExpiry.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }
        
        // Validar CVV (solo números)
        const cardCvv = document.getElementById('cardCvv');
        if (cardCvv) {
            cardCvv.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
        
        // Validar teléfono Nequi (solo números)
        const nequiPhone = document.getElementById('nequiPhone');
        if (nequiPhone) {
            nequiPhone.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
        
        // Validar teléfono de entrega (solo números)
        const deliveryPhone = document.getElementById('deliveryPhone');
        if (deliveryPhone) {
            deliveryPhone.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
    },
    
    removeItem(index) {
        this.cart.splice(index, 1);
        this.saveCart();
        this.renderShopping();
    },
    
    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    },
    
    saveCart() {
        localStorage.setItem('clientCart', JSON.stringify(this.cart));
    },
    
    async processPayment() {
        // Validar carrito
        if (this.cart.length === 0) {
            this.showToast('Tu carrito está vacío', 'warning');
            return;
        }
        
        // Obtener método de pago
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // Validar según método de pago
        if (paymentMethod === 'card') {
            const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const cardExpiry = document.getElementById('cardExpiry').value;
            const cardCvv = document.getElementById('cardCvv').value;
            const cardName = document.getElementById('cardName').value;
            
            if (!cardNumber || cardNumber.length < 13) {
                this.showToast('Ingresa un número de tarjeta válido', 'warning');
                return;
            }
            if (!cardExpiry || cardExpiry.length < 5) {
                this.showToast('Ingresa la fecha de vencimiento', 'warning');
                return;
            }
            if (!cardCvv || cardCvv.length < 3) {
                this.showToast('Ingresa el CVV', 'warning');
                return;
            }
            if (!cardName) {
                this.showToast('Ingresa el nombre del titular', 'warning');
                return;
            }
        } else {
            const nequiPhone = document.getElementById('nequiPhone').value;
            if (!nequiPhone || nequiPhone.length < 10) {
                this.showToast('Ingresa un número de celular válido', 'warning');
                return;
            }
        }
        
        // Validar información de entrega
        const deliveryAddress = document.getElementById('deliveryAddress').value;
        const deliveryName = document.getElementById('deliveryName').value;
        const deliveryPhone = document.getElementById('deliveryPhone').value;
        
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
        
        // Iniciar procesamiento
        this.isProcessing = true;
        this.renderShopping();
        
        // Simular delay de procesamiento (1-2 segundos)
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500));
        
        try {
            // Preparar datos de la compra
            const purchaseData = {
                items: this.cart.map(item => ({
                    producto_id: item.producto_id,
                    nombre: item.nombre,
                    cantidad: item.cantidad,
                    precio: item.precio
                })),
                total: this.getCartTotal(),
                paymentMethod: paymentMethod === 'card' ? 'TARJETA' : 'NEQUI',
                deliveryAddress: deliveryAddress,
                deliveryName: deliveryName,
                deliveryPhone: deliveryPhone,
                deliveryNotes: document.getElementById('deliveryNotes').value
            };
            
            // Intentar guardar en el backend
            let purchase = null;
            let savedToBackend = false;
            
            if (window.shoppingService) {
                try {
                    const result = await window.shoppingService.createPurchase(purchaseData);
                    console.log('Backend response:', result);
                    
                    if (result.success) {
                        purchase = {
                            id: result.data.id,
                            codigo_pedido: result.data.codigo_pedido,
                            fecha: result.data.fecha,
                            items: purchaseData.items,
                            total: result.data.total,
                            paymentMethod: result.data.metodo_pago,
                            status: result.data.estado,
                            delivery: {
                                address: deliveryAddress,
                                name: deliveryName,
                                phone: deliveryPhone,
                                notes: document.getElementById('deliveryNotes').value
                            }
                        };
                        savedToBackend = true;
                    }
                } catch (backendError) {
                    console.error('Error al guardar en backend:', backendError);
                    // No usar fallback local, mostrar error al usuario
                    this.showToast('Error al procesar compra: ' + backendError.message, 'danger');
                    this.isProcessing = false;
                    this.renderShopping();
                    return;
                }
            }
            
            // Si no se guardó en backend, usar método local
            if (!purchase) {
                purchase = {
                    id: 'PED-' + Date.now().toString(36).toUpperCase(),
                    fecha: new Date().toISOString(),
                    items: this.cart,
                    total: this.getCartTotal(),
                    paymentMethod: paymentMethod === 'card' ? 'TARJETA' : 'NEQUI',
                    status: 'CONFIRMADA',
                    delivery: {
                        address: deliveryAddress,
                        name: deliveryName,
                        phone: deliveryPhone,
                        notes: document.getElementById('deliveryNotes').value
                    },
                    _local: true // Marcar como guardado localmente
                };
                
                // Guardar en historial local como backup
                this.purchaseHistory.unshift(purchase);
                localStorage.setItem('purchaseHistory', JSON.stringify(this.purchaseHistory));
            } else {
                // Agregar al historial local también para mostrar
                this.purchaseHistory.unshift(purchase);
            }
            
            // Limpiar carrito
            this.cart = [];
            this.saveCart();
            
            // Mostrar éxito
            this.isProcessing = false;
            this.showToast(savedToBackend ? 'Compra guardada en la base de datos' : 'Compra procesada (almacenamiento local)', 'success');
            this.renderPurchaseSuccess(purchase);
            
        } catch (error) {
            this.isProcessing = false;
            this.showToast(error.message || 'Error en el procesamiento. Intenta de nuevo.', 'danger');
            this.renderShopping();
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
                                <div class="col-6 fw-bold">${purchase.id}</div>
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
                                    <i class="fas ${purchase.paymentMethod === 'card' ? 'fa-credit-card text-primary' : 'fa-mobile-alt text-success'} me-1"></i>
                                    ${purchase.paymentMethod === 'card' ? 'Tarjeta' : 'Nequi'}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6 text-muted">Total:</div>
                                <div class="col-6 fw-bold text-primary">$${purchase.total.toLocaleString()}</div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-6 text-muted">Entrega en:</div>
                                <div class="col-6 small">${purchase.delivery.address}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <a href="/cliente/catalogo" class="btn btn-primary btn-lg">
                            <i class="fas fa-store me-2"></i> Seguir Comprando
                        </a>
                        <button class="btn btn-outline-secondary" onclick="window.ClientShoppingPage.showAllPurchases()">
                            <i class="fas fa-receipt me-2"></i> Ver Mis Compras
                        </button>
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
    
    renderPurchaseHistory(content) {
        content.innerHTML = `
            <div class="shopping-container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="mb-0 fw-bold"><i class="fas fa-receipt me-2"></i>Mis Compras</h4>
                    <button class="btn btn-primary btn-sm" onclick="window.ClientShoppingPage.renderShopping()">
                        <i class="fas fa-plus me-1"></i> Nueva Compra
                    </button>
                </div>
                
                ${this.purchaseHistory.length === 0 
                    ? `<div class="text-center py-5 text-muted">
                        <i class="fas fa-shopping-bag mb-3" style="font-size: 2.5rem;"></i>
                        <p>No tienes compras realizadas</p>
                    </div>`
                    : `<div class="purchase-list">
                        ${this.purchaseHistory.map(p => this.renderPurchaseCard(p)).join('')}
                    </div>`
                }
            </div>
        `;
    },
    
    renderPurchaseCard(purchase) {
        const date = new Date(purchase.fecha).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        
        return `
            <div class="card border-0 shadow-sm mb-3 purchase-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1 fw-bold">${purchase.id}</h6>
                            <small class="text-muted">${date}</small>
                        </div>
                        <span class="badge bg-success">${purchase.status}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-muted">${purchase.items.length} producto(s)</small>
                        </div>
                        <div class="text-end">
                            <strong>$${purchase.total.toLocaleString()}</strong>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-link text-primary mt-2 p-0" onclick="window.ClientShoppingPage.showPurchaseDetail('${purchase.id}')">
                        Ver detalles <i class="fas fa-chevron-right ms-1"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    showAllPurchases() {
        const content = document.getElementById('clientContent');
        this.renderPurchaseHistory(content);
    },
    
    showPurchaseDetail(purchaseId) {
        const purchase = this.purchaseHistory.find(p => p.id === purchaseId);
        if (!purchase) return;
        
        const content = document.getElementById('clientContent');
        
        content.innerHTML = `
            <div class="shopping-container">
                <button class="btn btn-link mb-3 ps-0" onclick="window.ClientShoppingPage.showAllPurchases()">
                    <i class="fas fa-arrow-left me-1"></i> Volver a Mis Compras
                </button>
                
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 fw-bold">${purchase.id}</h5>
                        <span class="badge bg-success">${purchase.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-6 text-muted">Fecha:</div>
                            <div class="col-6">${new Date(purchase.fecha).toLocaleDateString('es-CO', { 
                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-6 text-muted">Método de pago:</div>
                            <div class="col-6">${purchase.paymentMethod === 'card' ? 'Tarjeta' : 'Nequi'}</div>
                        </div>
                    </div>
                </div>
                
                <h6 class="fw-bold mb-3">Productos</h6>
                ${purchase.items.map(item => `
                    <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-2">
                        <div>
                            <strong>${item.nombre}</strong>
                            <small class="d-block text-muted">$${item.precio.toLocaleString()} x ${item.cantidad}</small>
                        </div>
                        <strong>$${(item.precio * item.cantidad).toLocaleString()}</strong>
                    </div>
                `).join('')}
                
                <div class="card border-0 shadow-sm mt-4">
                    <div class="card-header bg-white">
                        <h6 class="mb-0 fw-bold">Información de Entrega</h6>
                    </div>
                    <div class="card-body">
                        <div class="row mb-2">
                            <div class="col-4 text-muted">Dirección:</div>
                            <div class="col-8">${purchase.delivery.address}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-4 text-muted">Recibe:</div>
                            <div class="col-8">${purchase.delivery.name}</div>
                        </div>
                        <div class="row">
                            <div class="col-4 text-muted">Teléfono:</div>
                            <div class="col-8">${purchase.delivery.phone}</div>
                        </div>
                        ${purchase.delivery.notes ? `
                        <div class="row mt-2">
                            <div class="col-4 text-muted">Notas:</div>
                            <div class="col-8">${purchase.delivery.notes}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="card-footer bg-light">
                        <div class="d-flex justify-content-between">
                            <strong>Total:</strong>
                            <strong class="text-primary fs-5">$${purchase.total.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
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

window.ClientShoppingPage = ClientShoppingPage;