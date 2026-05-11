/**
 * PharmaQuick - Client Shopping Page
 * Página de historial de compras del cliente (solo lectura)
 * Versión mejorada con diseño profesional y más información
 */

const ClientShoppingPage = {
    purchaseHistory: [],
    selectedPurchase: null,

    async init(container) {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');

        if (session.rol !== 'CLIENTE') {
            Router.navigate('/ventas');
            return;
        }

        ClientLayout.render(container, 'compras');

        // Cargar historial desde el backend
        await this.loadPurchasesHistory();

        // Mostrar historial de compras
        this.renderPurchaseHistory();
    },

    async loadPurchasesHistory() {
        try {
            if (window.shoppingService) {
                const response = await window.shoppingService.getPurchases();
                const purchasesArray = (response.data || response) || [];

                this.purchaseHistory = purchasesArray.map(p => ({
                    id: p.codigo_pedido || p.id,
                    rawId: p.id,
                    fecha: p.fecha || p.created_at,
                    // Datos de la farmacia
                    nombreFarmacia: p.nombre_farmacia || 'PharmaQuick',
                    direccionFarmacia: p.direccion_farmacia || '',
                    telefonoFarmacia: p.telefono_farmacia || '',
                    // Items con imágenes
                    items: (p.items || []).map(item => ({
                        id: item.producto_id,
                        nombre: item.producto_nombre || item.nombre,
                        precio: item.precio_unitario || item.precio,
                        cantidad: item.cantidad,
                        subtotal: item.subtotal || (item.precio * item.cantidad),
                        imagen: item.producto_imagen || null
                    })),
                    total: p.total,
                    metodoPago: p.metodo_pago || 'TARJETA',
                    status: p.estado,
                    // Datos de entrega
                    delivery: {
                        address: p.direccion_envio || '',
                        name: p.nombre_recibe || '',
                        phone: p.telefono_contacto || '',
                        notes: p.observaciones || ''
                    },
                    // Más metadata
                    createdAt: p.created_at || p.fecha
                }));
            } else {
                this.purchaseHistory = [];
            }
        } catch (error) {
            console.error('Error loading purchases:', error);
            this.purchaseHistory = [];
        }
    },

    renderPurchaseHistory() {
        const content = document.getElementById('clientContent');

        content.innerHTML = `
            <div class="pq-shopping-page">
                <div class="pq-shopping-container">
                    <div class="pq-shopping-header">
                        <div class="pq-header-info">
                            <h4><i class="fas fa-shopping-bag"></i> Mis Compras</h4>
                            <p class="pq-header-subtitle">Historial de pedidos realizados</p>
                        </div>
                        <a href="/cliente/carrito" class="pq-btn pq-btn-primary">
                            <i class="fas fa-cart-plus"></i> Nuevo Pedido
                        </a>
                    </div>

                    ${this.purchaseHistory.length === 0
                        ? this.renderEmptyState()
                        : this.renderPurchaseList()
                    }
                </div>
            </div>
        `;
    },

    renderEmptyState() {
        return `
            <div class="pq-empty-state">
                <div class="pq-empty-icon">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h5>No tienes compras realizadas</h5>
                <p>Explora nuestro catálogo y realiza tu primera compra</p>
                <a href="/cliente/catalogo" class="pq-btn pq-btn-primary">
                    <i class="fas fa-store"></i> Ver Catálogo
                </a>
            </div>
        `;
    },

    renderPurchaseList() {
        return `
            <div class="pq-purchases-list">
                ${this.purchaseHistory.map(p => this.renderPurchaseCard(p)).join('')}
            </div>
        `;
    },

    renderPurchaseCard(purchase) {
        const items = purchase.items || [];
        const date = new Date(purchase.fecha);
        const formattedDate = date.toLocaleDateString('es-CO', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('es-CO', {
            hour: '2-digit', minute: '2-digit'
        });

        const statusConfig = this.getStatusConfig(purchase.status);
        const paymentIcon = purchase.metodoPago === 'TARJETA' ? 'fa-credit-card' : 'fa-mobile-alt';
        const paymentLabel = purchase.metodoPago === 'TARJETA' ? 'Tarjeta' : 'Nequi';

        return `
            <div class="pq-purchase-card" data-purchase-id="${purchase.id}">
                <div class="pq-card-header">
                    <div class="pq-header-left">
                        <div class="pq-order-badge">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <div class="pq-order-info">
                            <span class="pq-order-id">${purchase.id}</span>
                            <span class="pq-order-date">
                                <i class="far fa-calendar-alt"></i> ${formattedDate}
                                <span class="pq-time-separator">•</span>
                                <i class="far fa-clock"></i> ${formattedTime}
                            </span>
                        </div>
                    </div>
                    <span class="pq-status-badge ${statusConfig.class}">
                        <i class="${statusConfig.icon}"></i>
                        ${purchase.status}
                    </span>
                </div>

                <!-- Sección de la Farmacia -->
                <div class="pq-farmacia-section">
                    <div class="pq-farmacia-icon">
                        <i class="fas fa-prescription"></i>
                    </div>
                    <div class="pq-farmacia-details">
                        <span class="pq-farmacia-label">Comprado en</span>
                        <span class="pq-farmacia-name">${purchase.nombreFarmacia}</span>
                        ${purchase.direccionFarmacia ? `
                            <span class="pq-farmacia-address">
                                <i class="fas fa-map-marker-alt"></i> ${purchase.direccionFarmacia}
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Lista de Productos con Miniaturas -->
                <div class="pq-products-section">
                    <div class="pq-products-list">
                        ${items.slice(0, 4).map(item => this.renderProductItem(item)).join('')}
                        ${items.length > 4 ? `
                            <div class="pq-product-more">
                                <i class="fas fa-ellipsis-h"></i>
                                +${items.length - 4} productos más
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Resumen y Footer -->
                <div class="pq-card-footer">
                    <div class="pq-footer-left">
                        <div class="pq-payment-info">
                            <span class="pq-payment-badge ${purchase.metodoPago === 'TARJETA' ? 'card' : 'nequi'}">
                                <i class="fas ${paymentIcon}"></i>
                                ${paymentLabel}
                            </span>
                            <span class="pq-items-count">
                                ${items.length} ${items.length === 1 ? 'producto' : 'productos'}
                            </span>
                        </div>
                    </div>
                    <div class="pq-footer-right">
                        <div class="pq-total-display">
                            <span class="pq-total-label">Total</span>
                            <span class="pq-total-value">$${purchase.total.toLocaleString()}</span>
                        </div>
                        <button class="pq-btn pq-btn-details" onclick="ClientShoppingPage.showPurchaseDetails('${purchase.id}')">
                            Ver Detalles
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderProductItem(item) {
        const hasImage = item.imagen && item.imagen.trim() !== '';
        return `
            <div class="pq-product-item">
                <div class="pq-product-thumb">
                    ${hasImage
                        ? `<img src="${item.imagen}" alt="${item.nombre}" loading="lazy" />`
                        : `<i class="fas fa-pills"></i>`
                    }
                </div>
                <div class="pq-product-info">
                    <span class="pq-product-name">${item.nombre}</span>
                    <span class="pq-product-qty">Cant: ${item.cantidad}</span>
                </div>
                <div class="pq-product-price">
                    <span class="pq-price-total">$${(item.subtotal || item.precio * item.cantidad).toLocaleString()}</span>
                    <span class="pq-price-unit">$${item.precio.toLocaleString()} c/u</span>
                </div>
            </div>
        `;
    },

    getStatusConfig(status) {
        const configs = {
            'CONFIRMADA': { class: 'confirmed', icon: 'fas fa-check-circle' },
            'PENDIENTE': { class: 'pending', icon: 'fas fa-clock' },
            'ENTREGADA': { class: 'delivered', icon: 'fas fa-check-double' },
            'CANCELADA': { class: 'cancelled', icon: 'fas fa-times-circle' }
        };
        return configs[status] || configs['CONFIRMADA'];
    },

    async showPurchaseDetails(purchaseId) {
        const purchase = this.purchaseHistory.find(p => p.id === purchaseId);
        if (!purchase) return;

        this.selectedPurchase = purchase;

        const modal = document.createElement('div');
        modal.className = 'pq-modal-overlay';
        modal.innerHTML = this.renderPurchaseDetailModal(purchase);
        document.body.appendChild(modal);

        // Animación de entrada
        requestAnimationFrame(() => modal.classList.add('active'));

        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closePurchaseDetails();
        });
    },

    renderPurchaseDetailModal(purchase) {
        const items = purchase.items || [];
        const date = new Date(purchase.fecha);
        const formattedDate = date.toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('es-CO', {
            hour: '2-digit', minute: '2-digit'
        });

        const statusConfig = this.getStatusConfig(purchase.status);

        return `
            <div class="pq-modal-content pq-modal-large">
                <div class="pq-modal-header">
                    <div class="pq-modal-title-section">
                        <button class="pq-modal-close" onclick="ClientShoppingPage.closePurchaseDetails()">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h3>Detalle del Pedido</h3>
                            <span class="pq-modal-subtitle">${purchase.id}</span>
                        </div>
                    </div>
                    <span class="pq-status-badge ${statusConfig.class}">
                        <i class="${statusConfig.icon}"></i>
                        ${purchase.status}
                    </span>
                </div>

                <div class="pq-modal-body">
                    <!-- Fecha y Hora -->
                    <div class="pq-detail-section pq-section-highlight">
                        <div class="pq-datetime-info">
                            <div class="pq-datetime-icon">
                                <i class="far fa-calendar-check"></i>
                            </div>
                            <div>
                                <span class="pq-datetime-date">${formattedDate}</span>
                                <span class="pq-datetime-time">${formattedTime}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Información de la Farmacia -->
                    <div class="pq-detail-section">
                        <div class="pq-section-header">
                            <i class="fas fa-store"></i>
                            <h4>Farmacia</h4>
                        </div>
                        <div class="pq-farmacia-card">
                            <div class="pq-farmacia-card-header">
                                <div class="pq-farmacia-avatar">
                                    <i class="fas fa-prescription"></i>
                                </div>
                                <div class="pq-farmacia-card-info">
                            <span class="pq-farmacia-card-name">${purchase.nombreFarmacia}</span>
                            ${purchase.direccionFarmacia ? `
                                <span class="pq-farmacia-card-address">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${purchase.direccionFarmacia}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    ${purchase.telefonoFarmacia ? `
                        <div class="pq-farmacia-card-actions">
                            <a href="https://wa.me/57${purchase.telefonoFarmacia.replace(/\D/g, '')}" target="_blank" class="pq-action-btn pq-action-whatsapp">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </a>
                        </div>
                    ` : ''}
                        </div>
                    </div>

                    <!-- Datos de Entrega -->
                    <div class="pq-detail-section">
                        <div class="pq-section-header">
                            <i class="fas fa-truck"></i>
                            <h4>Información de Entrega</h4>
                        </div>
                        <div class="pq-delivery-info">
                            <div class="pq-info-grid">
                                <div class="pq-info-item">
                                    <span class="pq-info-label">
                                        <i class="fas fa-user"></i> Recibe
                                    </span>
                                    <span class="pq-info-value">${purchase.delivery.name}</span>
                                </div>
                                <div class="pq-info-item">
                                    <span class="pq-info-label">
                                        <i class="fas fa-phone-alt"></i> Teléfono
                                    </span>
                                    <span class="pq-info-value">${purchase.delivery.phone}</span>
                                </div>
                                <div class="pq-info-item pq-info-full">
                                    <span class="pq-info-label">
                                        <i class="fas fa-map-marker-alt"></i> Dirección
                                    </span>
                                    <span class="pq-info-value">${purchase.delivery.address}</span>
                                </div>
                                ${purchase.delivery.notes ? `
                                    <div class="pq-info-item pq-info-full">
                                        <span class="pq-info-label">
                                            <i class="fas fa-sticky-note"></i> Observaciones
                                        </span>
                                        <span class="pq-info-value pq-info-notes">${purchase.delivery.notes}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Productos -->
                    <div class="pq-detail-section">
                        <div class="pq-section-header">
                            <i class="fas fa-box-open"></i>
                            <h4>Productos</h4>
                        </div>
                        <div class="pq-products-detail-list">
                            ${items.map(item => this.renderDetailProduct(item)).join('')}
                        </div>
                    </div>

                    <!-- Resumen -->
                    <div class="pq-detail-section pq-section-total">
                        <div class="pq-summary-row">
                            <span>Subtotal</span>
                            <span>$${(purchase.total * 0.81).toLocaleString()}</span>
                        </div>
                        <div class="pq-summary-row">
                            <span>IVA (19%)</span>
                            <span>$${(purchase.total * 0.19).toLocaleString()}</span>
                        </div>
                        <div class="pq-summary-row pq-summary-total">
                            <span>Total Pagado</span>
                            <span>$${purchase.total.toLocaleString()}</span>
                        </div>
                        <div class="pq-payment-row">
                            <i class="fas ${purchase.metodoPago === 'TARJETA' ? 'fa-credit-card' : 'fa-mobile-alt'}"></i>
                            Pagado con ${purchase.metodoPago === 'TARJETA' ? 'Tarjeta' : 'Nequi'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderDetailProduct(item) {
        const hasImage = item.imagen && item.imagen.trim() !== '';
        return `
            <div class="pq-detail-product">
                <div class="pq-detail-thumb">
                    ${hasImage
                        ? `<img src="${item.imagen}" alt="${item.nombre}" />`
                        : `<i class="fas fa-pills"></i>`
                    }
                </div>
                <div class="pq-detail-info">
                    <span class="pq-detail-name">${item.nombre}</span>
                    <span class="pq-detail-meta">
                        ${item.cantidad} unidad${item.cantidad > 1 ? 'es' : ''} × $${item.precio.toLocaleString()}
                    </span>
                </div>
                <div class="pq-detail-pricing">
                    <span class="pq-detail-subtotal">$${(item.subtotal || item.precio * item.cantidad).toLocaleString()}</span>
                </div>
            </div>
        `;
    },

    closePurchaseDetails() {
        const modal = document.querySelector('.pq-modal-overlay');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
        this.selectedPurchase = null;
    }
};

window.ClientShoppingPage = ClientShoppingPage;
