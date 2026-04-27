/**
 * PharmaQuick - Table Component
 * Tabla reutilizable con soporte para ordenamiento, búsqueda y paginación
 */

class Table {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.options = {
            columns: [],
            data: [],
            emptyMessage: 'No hay datos disponibles',
            loadingMessage: 'Cargando...',
            sortable: true,
            onRowClick: null,
            onEdit: null,
            onDelete: null,
            ...options
        };
        
        this.currentPage = 1;
        this.pageSize = options.pageSize || Config.DEFAULT_PAGE_SIZE;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.error(`Table: Container not found: ${this.containerSelector}`);
            return;
        }
        
        this.render();
    }
    
    /**
     * Renderizar la tabla
     */
    render() {
        const { columns, data, emptyMessage, loadingMessage } = this.options;
        
        if (this.options.loading) {
            this.container.innerHTML = `
                <div class="table-loading">
                    <div class="spinner"></div>
                    <p>${loadingMessage}</p>
                </div>
            `;
            return;
        }
        
        if (!data || data.length === 0) {
            this.container.innerHTML = `
                <div class="table-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9 17H7A5 5 0 017 7h2m6 10h2a5 5 0 010 10h-2m-8-5h2m-2 0h2"/>
                    </svg>
                    <p>${emptyMessage}</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${columns.map(col => `
                            <th class="${col.sortable !== false ? 'sortable' : ''}" 
                                data-column="${col.key}" 
                                style="${col.width ? `width: ${col.width}` : ''}">
                                ${col.label}
                                ${this.renderSortIcon(col.key)}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map((row, index) => `
                        <tr data-index="${index}" class="${this.options.onRowClick ? 'clickable' : ''}">
                            ${columns.map(col => `
                                <td>${this.renderCell(row, col)}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        this.container.innerHTML = html;
        this.attachEventListeners();
    }
    
    /**
     * Renderizar ícono de ordenamiento
     */
    renderSortIcon(column) {
        if (!this.options.sortable) return '';
        
        const isActive = this.sortColumn === column;
        const direction = isActive ? this.sortDirection : 'asc';
        
        return `
            <span class="sort-icon ${isActive ? 'active' : ''}" data-direction="${direction}">
                ${direction === 'asc' ? '↑' : '↓'}
            </span>
        `;
    }
    
    /**
     * Renderizar contenido de celda
     */
    renderCell(row, column) {
        const value = row[column.key];
        
        if (column.render) {
            return column.render(value, row);
        }
        
        // Valores especiales
        if (column.type === 'boolean') {
            return value ? 
                '<span class="badge badge-success">Activo</span>' : 
                '<span class="badge badge-inactive">Inactivo</span>';
        }
        
        if (column.type === 'currency') {
            return new Intl.NumberFormat('es-CO', { 
                style: 'currency', 
                currency: 'COP' 
            }).format(value || 0);
        }
        
        if (column.type === 'number') {
            return new Intl.NumberFormat('es-CO').format(value || 0);
        }
        
        return value ?? '-';
    }
    
    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Ordenamiento
        if (this.options.sortable) {
            this.container.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.dataset.column;
                    this.sort(column);
                });
            });
        }
        
        // Clic en fila
        if (this.options.onRowClick) {
            this.container.querySelectorAll('tbody tr.clickable').forEach(tr => {
                tr.addEventListener('click', (e) => {
                    // No disparar si se hizo clic en botón
                    if (e.target.closest('.btn')) return;
                    
                    const index = parseInt(tr.dataset.index);
                    this.options.onRowClick(this.options.data[index], index);
                });
            });
        }
    }
    
    /**
     * Ordenar datos
     */
    sort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        // Ordenar array
        this.options.data.sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];
            
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            
            let comparison = 0;
            if (typeof aVal === 'number') {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }
            
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
        
        this.render();
    }
    
    /**
     * Actualizar datos
     */
    setData(data) {
        this.options.data = data;
        this.currentPage = 1;
        this.render();
    }
    
    /**
     * Mostrar estado de carga
     */
    setLoading(loading) {
        this.options.loading = loading;
        this.render();
    }
    
    /**
     * Destruir tabla
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Exportar global
const TableComponent = Table;