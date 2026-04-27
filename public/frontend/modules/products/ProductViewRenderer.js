/**
 * PharmaQuick - Products View Renderer
 * Handles rendering of product table and filters
 */

class ProductViewRenderer {
    /**
     * Render main products view
     */
    render(productos) {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="view-header">
                <div class="view-title">
                    <h2>Catálogo de Productos</h2>
                    <span class="view-count">${productos?.length || 0} productos</span>
                </div>
                <button type="button" class="btn btn-primary" id="btnCreateProduct">
                    <i class="bi bi-plus-lg"></i>Nuevo Producto
                </button>
            </div>
            ${this.renderFilters()}
            <div class="table-container">${this.renderTable(productos)}</div>
        `;

        this.attachEvents();
    }

    /**
     * Render filters
     */
    renderFilters() {
        return `
            <div class="view-filters">
                <div class="filter-search">
                    <input type="text" id="searchInput" class="form-input" 
                           placeholder="Buscar productos..." autocomplete="off">
                </div>
                <div class="filter-category">
                    <select id="categoryFilter" class="form-select">
                        <option value="">Todas las categorías</option>
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
            return `<div class="table-empty"><p>No hay productos</p></div>`;
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th data-column="nombre" class="sortable">Nombre</th>
                        <th data-column="codigo">Código</th>
                        <th data-column="categoria">Categoría</th>
                        <th data-column="stock" class="sortable">Stock</th>
                        <th>Estado</th>
                        <th class="text-center">Acciones</th>
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
        return `
            <tr data-id="${id}">
                <td><strong>${p.nombre || '-'}</strong></td>
                <td><code>${p.codigo || p.codigo_barras || '-'}</code></td>
                <td>${p.categoria || '-'}</td>
                <td class="text-right">${p.stock_total || 0}</td>
                <td>${p.activo ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-inactive">Inactivo</span>'}</td>
                <td class="text-center">
                    <button class="btn btn-icon-only btn-ghost btn-sm" data-action="prices" data-id="${id}">
                        <i class="bi bi-currency-dollar"></i>
                    </button>
                    <button class="btn btn-icon-only btn-ghost btn-sm" data-action="edit" data-id="${id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEvents() {
        // Create button
        const btnCreate = document.getElementById('btnCreateProduct');
        if (btnCreate) {
            btnCreate.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('product:create'));
            });
        }

        // Search with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(e => {
                window.dispatchEvent(new CustomEvent('product:search', { detail: e.target.value }));
            }, 300));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', e => {
                window.dispatchEvent(new CustomEvent('product:filter', { detail: e.target.value }));
            });
        }

        // Action buttons
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

// Export
const productViewRenderer = ProductViewRenderer;