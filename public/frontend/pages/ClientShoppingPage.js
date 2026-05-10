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
        
        // Cargar carrito desde el backend
        await this.loadCartFromBackend();
        
        // Cargar historial desde el backend
        try {
            if (window.shoppingService) {
                try {
                    const response = await window.shoppingService.getPurchases();
                    // El servicio puede devolver data.data (formato original) o data (formato corregido)
                    const purchasesArray = (response.data || response) || [];
                    
                    // Mapear formato del backend al formato que usa la UI (incluyendo farmacia e imágenes)
                    this.purchaseHistory = purchasesArray.map(p => ({
                        id: p.codigo_pedido || p.id,  // Usar codigo_pedido como ID visible
                        rawId: p.id,                  // Guardar ID de BD para posibles referencias
                        fecha: p.fecha || p.created_at,
                        nombreFarmacia: p.nombre_farmacia || 'PharmaQuick',
                        direccionFarmacia: p.direccion_farmacia || '',
                        telefonoFarmacia: p.telefono_farmacia || '',
                        items: (p.items || []).map(item => ({
                            id: item.producto_id,
                            nombre: item.producto_nombre || item.nombre,
                            precio: item.precio_unitario || item.precio,
                            cantidad: item.cantidad,
                            imagen: item.producto_imagen || null
                        })),
                        total: p.total,
                        paymentMethod: (p.metodo_pago || '').toLowerCase() === 'tarjeta' ? 'card' : 'nequi',
                        metodoPago: p.metodo_pago || 'TARJETA',
                        status: p.estado,
                        delivery: {
                            address: p.direccion_envio || '',
                            name: p.nombre_recibe || '',
                            phone: p.telefono_contacto || '',
                            notes: p.observaciones || ''
                        }
                    }));
                } catch (backendError) {
                    console.error('Error al cargar historial:', backendError);
                    this.purchaseHistory = [];
                }
            } else {
                this.purchaseHistory = [];
            }
        } catch (error) {
            console.error('Error loading purchases:', error);
            
            // Si el error es de sesión expirada, NO continuar - el modal ya se mostrará
            if (error.message === 'Sesión expirada') {
                return; // Salir, el modal de sesión expirada ya está mostrando
            }
            
            // Para otros errores, usar array vacío
            this.purchaseHistory = [];
        }
        
        // Determinar vista según estado
        this.renderShopping();
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
                // Si no hay servicio, carrito vacío
                this.cart = [];
            }
        } catch (error) {
            console.error('Error al cargar carrito desde backend:', error);
            // En caso de error, carrito vacío
            this.cart = [];
        }
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
        const item = this.cart[index];
        if (item && window.cartService && item.id) {
            window.cartService.removeItem(item.id).catch(err => {
                console.error('Error al eliminar del backend:', err);
            });
        }
        this.cart.splice(index, 1);
        this.renderShopping();
    },
    
    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
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
                    // console.log('Backend response:', result);
                    
                    if (result.success) {
                        // Capturar también los items con sus imágenes desde la respuesta del backend
                        const itemsWithImages = result.data.items ? result.data.items.map(item => ({
                            id: item.producto_id,
                            nombre: item.producto_nombre,
                            precio: item.precio_unitario,
                            cantidad: item.cantidad,
                            imagen: item.producto_imagen || null
                        })) : purchaseData.items;
                        
                        purchase = {
                            id: result.data.codigo_pedido || result.data.id,  // Usar codigo_pedido como ID
                            fecha: result.data.fecha || new Date().toISOString(),
                            nombreFarmacia: result.data.nombre_farmacia || 'PharmaQuick',
                            direccionFarmacia: result.data.direccion_farmacia || '',
                            telefonoFarmacia: result.data.telefono_farmacia || '',
                            items: itemsWithImages,
                            total: result.data.total,
                            paymentMethod: (result.data.metodo_pago || 'TARJETA').toLowerCase() === 'tarjeta' ? 'card' : 'nequi',
                            metodoPago: result.data.metodo_pago || 'TARJETA',
                            status: result.data.estado || 'CONFIRMADA',
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
                // Mapear los items del carrito para incluir la imagen
                const itemsWithImages = this.cart.map(item => ({
                    id: item.producto_id,
                    nombre: item.nombre,
                    precio: item.precio,
                    cantidad: item.cantidad,
                    imagen: item.imagen || null
                }));
                
                purchase = {
                    id: 'PED-' + Date.now().toString(36).toUpperCase(),
                    fecha: new Date().toISOString(),
                    nombreFarmacia: 'PharmaQuick',
                    direccionFarmacia: '',
                    telefonoFarmacia: '',
                    items: itemsWithImages,
                    total: this.getCartTotal(),
                    paymentMethod: paymentMethod === 'card' ? 'card' : 'nequi',
                    metodoPago: paymentMethod === 'card' ? 'TARJETA' : 'NEQUI',
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
            
            // Limpiar carrito - también en el backend
            this.cart = [];
            
            // Eliminar el carrito del backend después de una compra exitosa
            try {
                if (window.cartService && savedToBackend) {
                    await window.cartService.clearCart();
                }
            } catch (clearError) {
                console.error('Error al limpiar carrito del backend:', clearError);
            }
            
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
            <div class="shopping-page">
                <div class="shopping-container">
                    <!-- Header -->
                    <div class="shopping-header">
                        <h4><i class="fas fa-shopping-bag"></i> Mis Compras</h4>
                        <button class="btn-shop-primary" onclick="window.ClientShoppingPage.renderShopping()">
                            <i class="fas fa-plus"></i> Nueva Compra
                        </button>
                    </div>
                    
                    ${this.purchaseHistory.length === 0 
                        ? `<div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-shopping-basket"></i>
                            </div>
                            <h5>No tienes compras realizadas</h5>
                            <p>Explora nuestro catálogo y realiza tu primera compra</p>
                            <a href="/cliente/catalogo" class="btn-shop-primary">
                                <i class="fas fa-store"></i> Ver Catálogo
                            </a>
                        </div>`
                        : `<div class="purchases-grid">
                            ${this.purchaseHistory.map(p => this.renderPurchaseCard(p)).join('')}
                        </div>`
                    }
                </div>
            </div>
        `;
    },
    
    renderPurchaseCard(purchase) {
        const items = purchase.items || [];
        const date = new Date(purchase.fecha).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const statusClass = (purchase.status || 'confirmada').toLowerCase();
        
        // Icono del método de pago
        const paymentIcon = purchase.paymentMethod === 'card' ? 'fa-credit-card' : 'fa-mobile-alt';
        const paymentLabel = purchase.metodoPago === 'TARJETA' ? 'Tarjeta' : 'Nequi';
        
        return `
            <div class="purchase-card" id="card-${purchase.id}">
                <!-- Header -->
                <div class="purchase-card-header">
                    <div class="purchase-id">
                        <i class="fas fa-receipt"></i>
                        ${purchase.id}
                    </div>
                    <div class="purchase-date">${date}</div>
                    <span class="purchase-status ${statusClass}">${purchase.status}</span>
                </div>
                
                <!-- Body -->
                <div class="purchase-card-body">
                    <!-- Información de Farmacia -->
                    ${purchase.nombreFarmacia ? `
                    <div class="purchase-farmacia">
                        <div class="purchase-farmacia-icon">
                            <i class="fas fa-store"></i>
                        </div>
                        <div class="purchase-farmacia-info">
                            <div class="purchase-farmacia-label">Comprado en</div>
                            <div class="purchase-farmacia-nombre">${purchase.nombreFarmacia}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Lista de productos (resumida) -->
                    <div class="purchase-products">
                        ${items.slice(0, 2).map(item => `
                            <div class="purchase-product-item">
                                <div class="purchase-product-image">
                                    ${item.imagen 
                                        ? `<img src="${item.imagen}" alt="${item.nombre}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-pills\\'></i>'">`
                                        : `<i class="fas fa-pills"></i>`
                                    }
                                </div>
                                <div class="purchase-product-details">
                                    <div class="purchase-product-name">${item.nombre}</div>
                                    <div class="purchase-product-meta">$${item.precio.toLocaleString()} x ${item.cantidad}</div>
                                </div>
                                <div class="purchase-product-price">
                                    <div class="purchase-product-subtotal">$${(item.precio * item.cantidad).toLocaleString()}</div>
                                </div>
                            </div>
                        `).join('')}
                        ${items.length > 2 ? `<div class="text-center text-muted small py-2">+ ${items.length - 2} producto(s) más</div>` : ''}
                    </div>
                    
                    <!-- Resumen -->
                    <div class="purchase-summary">
                        <div>
                            <span class="purchase-summary-label">Total</span>
                            <div class="purchase-method ${purchase.paymentMethod}">
                                <i class="fas ${paymentIcon}"></i> ${paymentLabel}
                            </div>
                        </div>
                        <div class="purchase-summary-total">$${purchase.total.toLocaleString()}</div>
                    </div>
                </div>
                
                <!-- Footer con botón -->
                <div class="purchase-card-footer">
                    <button class="purchase-detail-btn" onclick="window.ClientShoppingPage.showPurchaseDetail('${purchase.id}')">
                        <i class="fas fa-chevron-down"></i> Ver detalles completos
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
        const items = purchase.items || [];
        
        const statusClass = (purchase.status || 'confirmada').toLowerCase();
        
        // Icono y color del método de pago
        const paymentIcon = purchase.paymentMethod === 'card' ? 'fa-credit-card' : 'fa-mobile-alt';
        const paymentLabel = purchase.metodoPago === 'TARJETA' ? 'Tarjeta de Crédito/Débito' : 'Nequi';
        
        // Formatear fecha
        const formattedDate = new Date(purchase.fecha).toLocaleDateString('es-CO', { 
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        content.innerHTML = `
            <div class="shopping-page">
                <div class="shopping-container">
                    <!-- Back Button -->
                    <div class="purchase-detail-header">
                        <a href="#" class="purchase-detail-back" onclick="window.ClientShoppingPage.showAllPurchases(); return false;">
                            <i class="fas fa-arrow-left"></i> Volver
                        </a>
                        <div class="purchase-detail-title">
                            <i class="fas fa-receipt text-primary"></i> ${purchase.id}
                        </div>
                        <span class="purchase-status ${statusClass}">${purchase.status}</span>
                    </div>
                    
                    <!-- Información de la Compra -->
                    <div class="purchase-section">
                        <div class="purchase-section-header">
                            <i class="fas fa-info-circle"></i>
                            <h5>Detalles del Pedido</h5>
                        </div>
                        <div class="purchase-section-body">
                            <div class="info-row">
                                <span class="info-label">Fecha de compra</span>
                                <span class="info-value">${formattedDate}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Estado</span>
                                <span class="info-value"><span class="purchase-status ${statusClass}">${purchase.status}</span></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Método de pago</span>
                                <span class="info-value">
                                    <span class="payment-badge ${purchase.paymentMethod}">
                                        <i class="fas ${paymentIcon}"></i> ${paymentLabel}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de la Farmacia -->
                    ${purchase.nombreFarmacia ? `
                    <div class="purchase-section">
                        <div class="purchase-section-header">
                            <i class="fas fa-store"></i>
                            <h5>Farmacia</h5>
                        </div>
                        <div class="purchase-section-body">
                            <div class="info-row">
                                <span class="info-label">Nombre</span>
                                <span class="info-value fw-bold">${purchase.nombreFarmacia}</span>
                            </div>
                            ${purchase.direccionFarmacia ? `
                            <div class="info-row">
                                <span class="info-label">Dirección</span>
                                <span class="info-value">${purchase.direccionFarmacia}</span>
                            </div>
                            ` : ''}
                            ${purchase.telefonoFarmacia ? `
                            <div class="info-row">
                                <span class="info-label">Teléfono</span>
                                <span class="info-value">${purchase.telefonoFarmacia}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Productos -->
                    <div class="purchase-section">
                        <div class="purchase-section-header">
                            <i class="fas fa-pills"></i>
                            <h5>Productos (${items.length})</h5>
                        </div>
                        <div class="purchase-section-body">
                            <div class="purchase-detail-products">
                                ${items.map((item, index) => `
                                    <div class="purchase-detail-product" style="animation-delay: ${index * 0.1}s">
                                        <div class="purchase-detail-image">
                                            ${item.imagen 
                                                ? `<img src="${item.imagen}" alt="${item.nombre}" onerror="this.outerHTML='<div class=\\'purchase-detail-image-placeholder\\'><i class=\\'fas fa-pills\\'></i></div>'">`
                                                : `<div class="purchase-detail-image-placeholder">
                                                    <i class="fas fa-pills"></i>
                                                </div>`
                                            }
                                        </div>
                                        <div class="purchase-detail-info">
                                            <div class="purchase-detail-name">${item.nombre}</div>
                                            <div class="purchase-detail-qty">
                                                <span class="text-muted">Precio:</span> $${item.precio.toLocaleString()} 
                                                <span class="mx-1">•</span> 
                                                <span class="text-muted">Cantidad:</span> ${item.cantidad}
                                            </div>
                                        </div>
                                        <div class="purchase-detail-pricing">
                                            <div class="purchase-detail-price">$${(item.precio * item.cantidad).toLocaleString()}</div>
                                            <div class="purchase-detail-unit">$${item.precio.toLocaleString()} c/u</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <!-- Total -->
                            <div class="purchase-total-section">
                                <span class="purchase-total-label">Total Pagado</span>
                                <span class="purchase-total-amount">$${purchase.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de Entrega -->
                    <div class="purchase-section">
                        <div class="purchase-section-header">
                            <i class="fas fa-shipping-fast"></i>
                            <h5>Información de Entrega</h5>
                        </div>
                        <div class="purchase-section-body">
                            <div class="info-row">
                                <span class="info-label">Dirección de entrega</span>
                                <span class="info-value">${purchase.delivery.address}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Nombre de quien recibe</span>
                                <span class="info-value">${purchase.delivery.name}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Teléfono de contacto</span>
                                <span class="info-value">${purchase.delivery.phone}</span>
                            </div>
                            ${purchase.delivery.notes ? `
                            <div class="info-row">
                                <span class="info-label">Observaciones</span>
                                <span class="info-value">${purchase.delivery.notes}</span>
                            </div>
                            ` : ''}
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