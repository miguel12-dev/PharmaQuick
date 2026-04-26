/**
 * PharmaQuick - ProductView
 * Vista de Productos - maneja renderizado de UI
 */

class ProductView {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.controller = productController;
        
        // Columnas para la tabla
        this.columns = [
            { key: 'nombre', label: 'Nombre', sortable: true },
            { key: 'codigo', label: 'Código', sortable: true },
            { key: 'categoria', label: 'Categoría', sortable: true },
            { key: 'stock_total', label: 'Stock', sortable: true, type: 'number' },
            { key: 'activo', label: 'Estado', sortable: true, type: 'boolean' },
            { key: 'acciones', label: 'Acciones', sortable: false }
        ];
        
        this.init();
    }
    
    /**
     * Inicializar vista
     */
    init() {
        if (!this.container) {
            console.error('ProductView: Container not found');
            return;
        }
        
        // Registrar eventos del controlador
        this.controller.on('onDataChange', (data) => this.render(data));
        this.controller.on('onLoadingChange', (loading) => this.renderLoading(loading));
        this.controller.on('onError', (error) => this.showError(error));
        
        // Cargar datos
        this.controller.init();
    }
    
    /**
     * Renderizar contenido principal
     */
    render(productos) {
        const html = `
            <div class="products-view">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderTable(productos)}
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachEventListeners();
    }
    
    /**
     * Renderizar header con título y botón crear
     */
    renderHeader() {
        return `
            <div class="view-header">
                <div class="view-title">
                    <h2>Catálogo de Productos</h2>
                    <span class="view-count">${productos?.length || 0} productos</span>
                </div>
                <button type="button" class="btn btn-primary" id="btnCreateProduct">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Nuevo Producto
                </button>
            </div>
        `;
    }
    
    /**
     * Renderizar filtros
     */
    renderFilters() {
        const categories = this.controller.getCategories();
        
        return `
            <div class="view-filters">
                <div class="filter-search">
                    <div class="input-with-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input type="text" id="searchInput" class="form-input" placeholder="Buscar productos..." autocomplete="off">
                    </div>
                </div>
                <div class="filter-category">
                    <select id="categoryFilter" class="form-select">
                        <option value="">Todas las categorías</option>
                        ${categories.map(cat => `
                            <option value="${cat}">${cat}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderizar tabla
     */
    renderTable(productos) {
        if (!productos || productos.length === 0) {
            return `
                <div class="table-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4-8-4m0 18v-8l-8 4-8-4m0 8V7l8-4 8 4"/>
                    </svg>
                    <p>No hay productos disponibles</p>
                    <p class="text-muted">Cree su primer producto para comenzar</p>
                </div>
            `;
        }
        
        // Agregar columnas de acciones
        const columnsWithActions = [
            ...this.columns.slice(0, -1),
            { 
                key: 'acciones', 
                label: 'Acciones', 
                sortable: false,
                width: '120px'
            }
        ];
        
        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${columnsWithActions.map(col => `
                                <th class="${col.sortable !== false ? 'sortable' : ''}" 
                                    data-column="${col.key}"
                                    ${col.width ? `style="width: ${col.width}"` : ''}>
                                    ${col.label}
                                    ${this.renderSortIcon(col.key)}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${productos.map(p => `
                            <tr data-id="${p.id || p.producto_id}">
                                <td><strong>${p.nombre || '-'}</strong></td>
                                <td><code>${p.codigo || p.codigo_barras || '-'}</code></td>
                                <td>${p.categoria || '-'}</td>
                                <td class="text-right">${this.formatNumber(p.stock_total)}</td>
                                <td>${this.renderStatus(p.activo)}</td>
                                <td class="actions-cell">
                                    <button type="button" class="btn btn-icon-only btn-ghost btn-sm" 
                                        title="Ver Precios" data-action="prices" data-id="${p.id || p.producto_id}">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                                        </svg>
                                    </button>
                                    <button type="button" class="btn btn-icon-only btn-ghost btn-sm" 
                                        title="Editar" data-action="edit" data-id="${p.id || p.producto_id}">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    /**
     * Renderizar ícono de ordenamiento
     */
    renderSortIcon(column) {
        const isActive = this.controller.sortColumn === column;
        const dir = isActive ? this.controller.sortDirection : 'asc';
        
        if (column === 'acciones') return '';
        
        return `<span class="sort-icon ${isActive ? 'active' : ''}" data-dir="${dir}">${dir === 'asc' ? '↑' : '↓'}</span>`;
    }
    
    /**
     * Renderizar estado
     */
    renderStatus(activo) {
        return activo ? 
            '<span class="badge badge-success">Activo</span>' : 
            '<span class="badge badge-inactive">Inactivo</span>';
    }
    
    /**
     * Formatear número
     */
    formatNumber(num) {
        return new Intl.NumberFormat('es-CO').format(num || 0);
    }
    
    /**
     * Renderizar estado de carga
     */
    renderLoading(loading) {
        const tableContainer = this.container?.querySelector('.table-container');
        if (!tableContainer) return;
        
        if (loading) {
            tableContainer.classList.add('loading');
            if (!tableContainer.querySelector('.spinner-overlay')) {
                tableContainer.insertAdjacentHTML('beforeend', '<div class="spinner-overlay"><div class="spinner"></div></div>');
            }
        } else {
            tableContainer.classList.remove('loading');
            const overlay = tableContainer.querySelector('.spinner-overlay');
            if (overlay) overlay.remove();
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
        // Botón crear producto
        const btnCreate = document.getElementById('btnCreateProduct');
        if (btnCreate) {
            btnCreate.addEventListener('click', () => this.showCreateModal());
        }
        
        // Input buscar
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.controller.search(e.target.value);
            }, Config.DEBOUNCE_DELAY));
        }
        
        // Filtro categoría
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.controller.filterByCategory(e.target.value || null);
            });
        }
        
        // Encabezados ordenables
        this.container.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                this.controller.sort(column);
            });
        });
        
        // Botones de acción
        this.container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                
                if (action === 'edit') {
                    this.showEditModal(id);
                } else if (action === 'prices') {
                    this.showPricesModal(id);
                }
            });
        });
    }
    
    /**
     * Debounce helper
     */
    debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    
    /**
     * Mostrar modal crear
     */
    showCreateModal() {
        const modal = new Modal({
            title: 'Nuevo Producto',
            content: this.getProductFormHtml(),
            size: 'md',
            onConfirm: () => this.handleCreateSubmit(modal)
        });
        
        modal.open();
    }
    
    /**
     * Mostrar modal editar
     */
    async showEditModal(id) {
        const producto = this.controller.getProductoById(id);
        if (!producto) return;
        
        const modal = new Modal({
            title: 'Editar Producto',
            content: this.getProductFormHtml(producto),
            size: 'md',
            onConfirm: () => this.handleEditSubmit(modal, id)
        });
        
        modal.open();
        
        // Llenar formulario
        this.fillProductForm(producto);
    }
    
    /**
     * Mostrar modal precios
     */
    showPricesModal(id) {
        const producto = this.controller.getProductoById(id);
        if (!producto) return;
        
        // Dispatch evento para que PricesView maneje
        window.dispatchEvent(new CustomEvent('openPricesModal', { 
            detail: { productoId: id, producto } 
        }));
    }
    
    /**
     * HTML del formulario de producto
     */
    getProductFormHtml(producto = null) {
        return `
            <form id="productForm" class="product-form">
                <div class="form-row">
                    ${this.renderInput({
                        name: 'nombre',
                        label: 'Nombre',
                        required: true,
                        value: producto?.nombre || ''
                    })}
                </div>
                <div class="form-row">
                    ${this.renderInput({
                        name: 'codigo_barras',
                        label: 'Código de Barras',
                        value: producto?.codigo || producto?.codigo_barras || ''
                    })}
                </div>
                <div class="form-row">
                    ${this.renderInput({
                        name: 'categoria',
                        label: 'Categoría',
                        value: producto?.categoria || ''
                    })}
                </div>
                <div class="form-row">
                    ${this.renderInput({
                        name: 'presentacion',
                        label: 'Presentación',
                        value: producto?.presentacion || ''
                    })}
                </div>
                <div class="form-row">
                    ${this.renderTextarea({
                        name: 'descripcion',
                        label: 'Descripción',
                        rows: 3,
                        value: producto?.descripcion || ''
                    })}
                </div>
            </form>
        `;
    }
    
    /**
     * Renderizar input
     */
    renderInput(config) {
        const { name, label, required, value, type = 'text' } = config;
        const id = `product_${name}`;
        
        return `
            <div class="form-group">
                <label for="${id}" class="form-label">
                    ${label} ${required ? '<span class="required">*</span>' : ''}
                </label>
                <input type="${type}" id="${id}" name="${name}" class="form-input" 
                    value="${value}" ${required ? 'required' : ''}>
            </div>
        `;
    }
    
    /**
     * Renderizar textarea
     */
    renderTextarea(config) {
        const { name, label, required, rows, value } = config;
        const id = `product_${name}`;
        
        return `
            <div class="form-group">
                <label for="${id}" class="form-label">
                    ${label} ${required ? '<span class="required">*</span>' : ''}
                </label>
                <textarea id="${id}" name="${name}" class="form-textarea" 
                    rows="${rows}" ${required ? 'required' : ''}>${value}</textarea>
            </div>
        `;
    }
    
    /**
     * Llenar formulario
     */
    fillProductForm(producto) {
        const fields = ['nombre', 'codigo_barras', 'categoria', 'presentacion', 'descripcion'];
        
        fields.forEach(field => {
            const input = document.querySelector(`#product_${field}`);
            if (input && producto[field] !== undefined) {
                input.value = producto[field];
            }
        });
    }
    
    /**
     * Manejar submit crear
     */
    async handleCreateSubmit(modal) {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Validar
        if (!data.nombre) {
            modal.showError('El nombre es requerido');
            return;
        }
        
        modal.setLoading(true);
        
        try {
            await this.controller.createProducto(data);
            modal.close();
            Toast.success('Producto creado correctamente');
        } catch (error) {
            modal.showError(error.message);
        }
    }
    
    /**
     * Manejar submit editar
     */
    async handleEditSubmit(modal, id) {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Validar
        if (!data.nombre) {
            modal.showError('El nombre es requerido');
            return;
        }
        
        modal.setLoading(true);
        
        try {
            await this.controller.updateProducto(id, data);
            modal.close();
            Toast.success('Producto actualizado correctamente');
        } catch (error) {
            modal.showError(error.message);
        }
    }
}

// Exportar global
const productView = null; // Se instancia en la página