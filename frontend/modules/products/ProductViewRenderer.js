class ProductViewRenderer {
    /**
     * Render main products view
     */
    render(productos) {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="view-header mb-4 d-flex justify-content-between align-items-center">
                <div class="view-title">
                    <h2 class="h3 fw-bold text-dark m-0">Catálogo de Productos</h2>
                    <span class="text-muted small">${productos?.length || 0} productos registrados</span>
                </div>
                <button type="button" class="btn btn-primary d-flex align-items-center gap-2" id="btnCreateProduct" style="background-color: var(--pq-primary); border: none; border-radius: var(--radius-md); padding: 10px 20px;">
                    <i class="fas fa-plus"></i>
                    <span>Nuevo Producto</span>
                </button>
            </div>
            ${this.renderFilters()}
            <div class="table-container bg-white rounded-3 shadow-sm p-0 overflow-hidden">${this.renderTable(productos)}</div>
        `;

        this.attachEvents();
    }

    /**
     * Render filters
     */
    renderFilters() {
        return `
            <div class="view-filters row g-3 mb-4">
                <div class="col-md-8">
                    <div class="input-group">
                        <span class="input-group-text bg-white border-end-0">
                            <i class="fas fa-search text-muted"></i>
                        </span>
                        <input type="text" id="searchInput" class="form-control border-start-0 ps-0" 
                               placeholder="Buscar por nombre o código..." autocomplete="off">
                    </div>
                </div>
                <div class="col-md-4">
                    <select id="categoryFilter" class="form-select">
                        <option value="">Todas las categorías</option>
                        <option value="Medicamentos">Medicamentos</option>
                        <option value="Higiene">Higiene</option>
                        <option value="Suplementos">Suplementos</option>
                    </select>
                </div>
            </div>
        `;
    }

    /**
     * Render products table
     */
    renderTable(productos) {
        if (!productos || productos.length === 0) {
            return `<div class="p-5 text-center text-muted">
                <i class="fas fa-box-open fa-3x mb-3 opacity-25"></i>
                <p>No se encontraron productos en el catálogo</p>
            </div>`;
        }

        return `
            <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                    <tr>
                        <th class="ps-4" style="width: 80px">Imagen</th>
                        <th data-column="nombre" class="sortable">Nombre</th>
                        <th data-column="codigo">Código</th>
                        <th data-column="categoria">Categoría</th>
                        <th data-column="stock" class="sortable text-center">Stock</th>
                        <th>Estado</th>
                        <th class="text-center pe-4">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(p => this.renderRow(p)).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Render single row
     */
    renderRow(p) {
        const id = p.id || p.producto_id;
        const imageUrl = p.imagen_url ? p.imagen_url : '/public/assets/img/no-image.png';
        const stockClass = p.stock_total <= 5 ? 'text-danger fw-bold' : (p.stock_total <= 15 ? 'text-warning fw-bold' : '');
        
        return `
            <tr data-id="${id}">
                <td class="ps-4">
                    <div class="product-img-thumb" style="width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: #f3f4f6;">
                        <img src="${imageUrl}" alt="${p.nombre}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/public/assets/img/no-image.png'">
                    </div>
                </td>
                <td>
                    <div class="fw-semibold text-dark">${p.nombre || '-'}</div>
                    <small class="text-muted">${p.presentacion || ''}</small>
                </td>
                <td><span class="badge bg-light text-dark border fw-normal">${p.codigo || p.codigo_barras || '-'}</span></td>
                <td>${p.categoria || '<span class="text-muted italic">Sin categoría</span>'}</td>
                <td class="text-center ${stockClass}">${p.stock_total || 0}</td>
                <td>
                    ${p.activo ? 
                        '<span class="badge rounded-pill" style="background-color: var(--color-primary-soft); color: var(--color-primary);">Activo</span>' : 
                        '<span class="badge bg-light text-muted rounded-pill">Inactivo</span>'}
                </td>
                <td class="text-center pe-4">
                    <div class="d-flex justify-content-center gap-1">
                        <button class="btn btn-sm btn-light border" data-action="prices" data-id="${id}" title="Precios">
                            <i class="fas fa-tag text-primary"></i>
                        </button>
                        <button class="btn btn-sm btn-light border" data-action="edit" data-id="${id}" title="Editar">
                            <i class="fas fa-edit text-success"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEvents() {
        const btnCreate = document.getElementById('btnCreateProduct');
        if (btnCreate) {
            btnCreate.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('product:create'));
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(e => {
                window.dispatchEvent(new CustomEvent('product:search', { detail: e.target.value }));
            }, 300));
        }

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', e => {
                window.dispatchEvent(new CustomEvent('product:filter', { detail: e.target.value }));
            });
        }

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', e => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                window.dispatchEvent(new CustomEvent('product:action', { 
                    detail: { action, id } 
                }));
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
}

const productViewRenderer = new ProductViewRenderer();