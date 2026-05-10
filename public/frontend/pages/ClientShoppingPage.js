/**
 * PharmaQuick - Client Shopping Page
 * Página de historial de compras del cliente (solo lectura)
 */

const ClientShoppingPage = {
    purchaseHistory: [],
    
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
            <div class="shopping-page">
                <div class="shopping-container">
                    <div class="shopping-header">
                        <h4><i class="fas fa-shopping-bag"></i> Mis Compras</h4>
                        <a href="/cliente/carrito" class="btn btn-primary btn-sm">
                            <i class="fas fa-cart-plus me-1"></i> Nuevo Pedido
                        </a>
                    </div>
                    
                    ${this.purchaseHistory.length === 0 
                        ? `<div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-shopping-basket"></i>
                            </div>
                            <h5>No tienes compras realizadas</h5>
                            <p>Explora nuestro catálogo y realiza tu primera compra</p>
                            <a href="/cliente/catalogo" class="btn btn-primary">
                                <i class="fas fa-store"></i> Ver Catálogo
                            </a>
                        </div>`
                        : `<div class="purchases-grid">
                            ${this.purchaseHistory.map(p => this.renderPurchaseCard(p)).join('')}
                        </div>`
                    }
                </div>
            </div>
            
            <style>
            .shopping-page {
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
            .empty-state {
                text-align: center;
                padding: 3rem 1rem;
            }
            .empty-state-icon {
                font-size: 3rem;
                color: #adb5bd;
                margin-bottom: 1rem;
            }
            .empty-state h5 {
                color: #495057;
                margin-bottom: 0.5rem;
            }
            .empty-state p {
                color: #6c757d;
                margin-bottom: 1.5rem;
            }
            .purchases-grid {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            </style>
        `;
    },
    
    renderPurchaseCard(purchase) {
        const items = purchase.items || [];
        const date = new Date(purchase.fecha).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        
        const statusClass = (purchase.status || 'confirmada').toLowerCase();
        const paymentIcon = purchase.paymentMethod === 'card' ? 'fa-credit-card' : 'fa-mobile-alt';
        const paymentLabel = purchase.metodoPago === 'TARJETA' ? 'Tarjeta' : 'Nequi';
        
        return `
            <div class="purchase-card">
                <div class="purchase-card-header">
                    <div class="purchase-id">
                        <i class="fas fa-receipt"></i> ${purchase.id}
                    </div>
                    <div class="purchase-date">${date}</div>
                    <span class="purchase-status ${statusClass}">${purchase.status}</span>
                </div>
                
                <div class="purchase-card-body">
                    <div class="purchase-items">
                        ${items.slice(0, 3).map(item => `
                            <div class="purchase-item">
                                <div class="purchase-item-name">${item.nombre}</div>
                                <div class="purchase-item-qty">x${item.cantidad}</div>
                                <div class="purchase-item-price">$${(item.precio * item.cantidad).toLocaleString()}</div>
                            </div>
                        `).join('')}
                        ${items.length > 3 ? `<div class="purchase-more">+${items.length - 3} más</div>` : ''}
                    </div>
                    
                    <div class="purchase-footer">
                        <div class="purchase-payment">
                            <i class="fas ${paymentIcon}"></i> ${paymentLabel}
                        </div>
                        <div class="purchase-total">
                            <span class="purchase-total-amount">$${purchase.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
            .purchase-card {
                background: #fff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .purchase-card-header {
                display: flex;
                align-items: center;
                padding: 0.75rem 1rem;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }
            .purchase-id {
                font-weight: 600;
                font-size: 0.875rem;
            }
            .purchase-date {
                margin-left: auto;
                font-size: 0.75rem;
                color: #6c757d;
            }
            .purchase-status {
                margin-left: 0.5rem;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 600;
            }
            .purchase-status.confirmada {
                background: #d4edda;
                color: #155724;
            }
            .purchase-card-body {
                padding: 1rem;
            }
            .purchase-items {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .purchase-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .purchase-item-name {
                flex: 1;
                font-weight: 500;
                font-size: 0.875rem;
            }
            .purchase-item-qty {
                font-size: 0.75rem;
                color: #6c757d;
            }
            .purchase-item-price {
                font-weight: 600;
            }
            .purchase-more {
                font-size: 0.75rem;
                color: #6c757d;
                text-align: center;
            }
            .purchase-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 0.75rem;
                margin-top: 0.75rem;
                border-top: 1px solid #e9ecef;
            }
            .purchase-payment {
                font-size: 0.875rem;
                color: #6c757d;
            }
            .purchase-total-amount {
                font-weight: 700;
                font-size: 1.125rem;
                color: #0d6efd;
            }
            </style>
        `;
    }
};

window.ClientShoppingPage = ClientShoppingPage;