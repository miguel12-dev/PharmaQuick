/**
 * PharmaQuick - PriceView
 * Vista de Precios - maneja renderizado de UI
 */

class PriceView {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.controller = priceController;
        
        this.init();
    }
    
    /**
     * Inicializar vista
     */
    init() {
        if (!this.container) {
            console.error('PriceView: Container not found');
            return;
        }
        
        // Registrar eventos del controlador
        this.controller.on('onDataChange', (data) => this.render(data));
        this.controller.on('onLoadingChange', (loading) => this.renderLoading(loading));
        this.controller.on('onError', (error) => this.showError(error));
        
        // Escuchar evento para abrir modal
        window.addEventListener('openPricesModal', (e) => this.openModal(e.detail));
    }
    
    /**
     * Renderizar precios en contenedor
     */
    render(data) {
        const { precios, precioActivo } = data;
        
        if (!precios || precios.length === 0) {
            this.container.innerHTML = `
                <div class="prices-empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                    </svg>
                    <p>No hay precios registrados</p>
                </div>
            `;
            return;
        }
        
        this.container.innerHTML = `
            <div class="prices-list">
                ${precios.map(p => this.renderPriceItem(p, precioActivo?.precio_id === p.precio_id)).join('')}
            </div>
            <div class="prices-actions">
                ${this.renderAddPriceButton()}
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    /**
     * Renderizar item de precio
     */
    renderPriceItem(precio, isActive) {
        const date = precio.fecha_actualizacion || precio.created_at;
        const dateFormatted = date ? this.formatDate(date) : '-';
        
        return `
            <div class="price-item ${isActive ? 'active' : ''}" data-id="${precio.precio_id}">
                <div class="price-info">
                    <span class="price-value">${this.formatCurrency(precio.precio)}</span>
                    <span class="price-date">${dateFormatted}</span>
                </div>
                <div class="price-actions">
                    ${isActive ? `
                        <span class="badge badge-success">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Activo
                        </span>
                    ` : `
                        <button type="button" class="btn btn-sm btn-outline-primary" data-action="activate" data-id="${precio.precio_id}">
                            Activar
                        </button>
                    `}
                    <button type="button" class="btn btn-icon-only btn-ghost btn-sm" 
                        title="Eliminar" data-action="delete" data-id="${precio.precio_id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderizar botón agregar precio
     */
    renderAddPriceButton() {
        return `
            <button type="button" class="btn btn-primary btn-block" id="btnAddPrice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Agregar Precio
            </button>
        `;
    }
    
    /**
     * Formatear moneda
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
    
    /**
     * Formatear fecha
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    /**
     * Renderizar estado de carga
     */
    renderLoading(loading) {
        if (!this.container) return;
        
        const container = this.container.closest('.prices-modal-content') || this.container;
        
        if (loading) {
            container.classList.add('loading');
        } else {
            container.classList.remove('loading');
        }
    }
    
    /**
     * Mostrar error
     */
    showError(message) {
        Toast.error(message);
    }
    
    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Botón agregar precio
        const btnAdd = document.getElementById('btnAddPrice');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.showAddPriceModal());
        }
        
        // Botones de acciones
        this.container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);
                
                if (action === 'activate') {
                    await this.handleActivate(id);
                } else if (action === 'delete') {
                    await this.handleDelete(id);
                }
            });
        });
    }
    
    /**
     * Abrir modal de precios
     */
    openModal(detail) {
        const { productoId, producto } = detail;
        
        this.controller.loadForProducto(productoId, producto);
        
        const modal = new Modal({
            title: `Precios: ${producto?.nombre || 'Producto'}`,
            content: `
                <div class="prices-modal-content">
                    <div class="prices-list-container" id="pricesListContainer"></div>
                </div>
            `,
            size: 'md',
            showFooter: false
        });
        
        modal.open();
        
        // Mover contenedor de precios al modal
        const listContainer = document.getElementById('pricesListContainer');
        if (listContainer && this.controller.precios.length > 0) {
            listContainer.innerHTML = this.controller.precios.map(p => 
                this.renderPriceItem(p, this.controller.precioActivo?.precio_id === p.precio_id)
            ).join('');
        }
    }
    
    /**
     * Mostrar modal agregar precio
     */
    showAddPriceModal() {
        const modal = new Modal({
            title: 'Nuevo Precio',
            content: `
                <form id="priceForm" class="price-form">
                    <div class="form-group">
                        <label for="priceValue" class="form-label">
                            Valor <span class="required">*</span>
                        </label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">$</span>
                            <input type="number" id="priceValue" name="precio" class="form-input" 
                                min="1" step="1" required placeholder="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="priceActivate" name="activar" checked>
                            <span>Activar inmediatamente</span>
                        </label>
                        <p class="form-help">Solo puede haber un precio activo por producto</p>
                    </div>
                </form>
            `,
            size: 'sm',
            confirmText: 'Crear Precio',
            onConfirm: () => this.handleCreateSubmit(modal)
        });
        
        modal.open();
    }
    
    /**
     * Manejar submit crear
     */
    async handleCreateSubmit(modal) {
        const form = document.getElementById('priceForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        if (!data.precio || parseFloat(data.precio) <= 0) {
            modal.showError('El precio debe ser mayor a 0');
            return;
        }
        
        modal.setLoading(true);
        
        try {
            await this.controller.createPrecio(
                data.precio, 
                data.activar === 'on' || data.activar === true
            );
            modal.close();
            Toast.success('Precio creado correctamente');
            
            // Recargar lista
            if (this.controller.productoId) {
                await this.controller.loadForProducto(
                    this.controller.productoId, 
                    this.controller.producto
                );
            }
        } catch (error) {
            modal.showError(error.message);
        }
    }
    
    /**
     * Manejar activar precio
     */
    async handleActivate(id) {
        try {
            await this.controller.activatePrecio(id);
            Toast.success('Precio activado correctamente');
        } catch (error) {
            Toast.error(error.message);
        }
    }
    
    /**
     * Manejar eliminar precio
     */
    async handleDelete(id) {
        if (!confirm('¿Está seguro de eliminar este precio?')) {
            return;
        }
        
        try {
            await this.controller.deletePrecio(id);
            Toast.success('Precio eliminado correctamente');
        } catch (error) {
            Toast.error(error.message);
        }
    }
}

// Exportar global
const priceView = null; // Se instancia en la página