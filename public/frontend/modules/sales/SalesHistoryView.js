class SalesHistoryView {
    constructor(controller) {
        this.controller = controller;
        this.tableBody = document.getElementById('historyTableBody');
    }

    showLoading() {
        if (this.tableBody) {
            this.tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><span class="spinner-border spinner-border-sm me-2"></span>Cargando ventas...</td></tr>';
        }
    }

    renderSales(sales) {
        if (!this.tableBody) return;

        if (sales.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron ventas</td></tr>';
            return;
        }

        const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });
        
        this.tableBody.innerHTML = '';
        sales.forEach(venta => {
            const row = document.createElement('tr');
            const isEcommerce = venta.tipo === 'COMPRA';
            row.innerHTML = `
                <td>
                    <div class="fw-bold">${new Date(venta.creado_en).toLocaleDateString()}</div>
                    <small class="text-muted">${new Date(venta.creado_en).toLocaleTimeString()}</small>
                </td>
                <td>
                    <div class="fw-semibold text-dark">${venta.cliente_nombre || 'Consumidor Final'}</div>
                    <small class="text-muted">${isEcommerce ? `<i class="fas fa-hashtag me-1 small"></i>${venta.cliente_documento}` : (venta.cliente_documento || '-')}</small>
                </td>
                <td>
                    <span class="badge ${isEcommerce ? 'bg-info-soft text-info' : 'bg-light text-dark'} border">
                        <i class="fas ${isEcommerce ? 'fa-globe' : 'fa-cash-register'} me-1 opacity-75"></i>
                        ${isEcommerce ? 'E-commerce' : venta.vendedor}
                    </span>
                </td>
                <td class="fw-bold text-primary">${fmt.format(venta.total)}</td>
                <td><span class="badge ${this.getStatusBadgeClass(venta.estado)}">${venta.estado}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary btn-view-details" data-id="${venta.id}" data-tipo="${venta.tipo}">
                        <i class="fas fa-eye me-1"></i> Detalles
                    </button>
                </td>
            `;
            this.tableBody.appendChild(row);
        });

        // Bind buttons
        this.tableBody.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const tipo = btn.getAttribute('data-tipo');
                this.controller.viewDetails(id, tipo);
            });
        });
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'COMPLETADA': return 'bg-success-soft text-success';
            case 'CANCELADA': return 'bg-danger-soft text-danger';
            case 'PENDIENTE': return 'bg-warning-soft text-warning';
            default: return 'bg-light text-dark';
        }
    }

    showDetailsModal(venta, detalles) {
        const modalElem = document.getElementById('modalVentaDetalles');
        if (!modalElem) return;

        const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });
        const modal = new bootstrap.Modal(modalElem);

        const header = document.getElementById('ventaDetallesHeader');
        const isEcommerce = venta.tipo === 'COMPRA';
        header.innerHTML = `
            <div class="row g-3">
                <div class="col-6">
                    <p class="text-muted small mb-1">Cliente</p>
                    <p class="fw-bold mb-0">${venta.cliente_nombre || 'Consumidor Final'}</p>
                    <p class="text-muted small mb-0">${!isEcommerce && venta.cliente_documento ? venta.cliente_documento : ''}</p>
                </div>
                <div class="col-6 text-end">
                    <p class="text-muted small mb-1">Fecha y Hora</p>
                    <p class="fw-bold mb-0">${new Date(venta.creado_en).toLocaleString()}</p>
                    <p class="text-muted small mb-0">${isEcommerce ? `Código Pedido: ${venta.cliente_documento}` : `ID Venta: #${venta.id}`}</p>
                </div>
                <div class="col-6">
                    <p class="text-muted small mb-1">Tipo de Venta</p>
                    <p class="fw-bold mb-0">${isEcommerce ? 'Tienda Online' : 'Punto de Venta (POS)'}</p>
                </div>
                <div class="col-6 text-end">
                    <p class="text-muted small mb-1">Estado</p>
                    <span class="badge ${this.getStatusBadgeClass(venta.estado)}">${venta.estado}</span>
                </div>
            </div>
        `;

        const body = document.getElementById('ventaDetallesBody');
        body.innerHTML = '';
        detalles.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="fw-semibold">${item.producto}</div>
                </td>
                <td><small class="badge bg-light text-secondary border">${item.codigo_lote}</small></td>
                <td class="text-center">${item.cantidad}</td>
                <td class="text-end">${fmt.format(item.precio)}</td>
                <td class="text-end fw-bold">${fmt.format(item.subtotal)}</td>
            `;
            body.appendChild(row);
        });

        const footer = document.getElementById('ventaDetallesFooter');
        footer.innerHTML = `
            <tr>
                <td colspan="4" class="text-end py-3">Subtotal:</td>
                <td class="text-end py-3">${fmt.format(venta.total + (venta.descuento || 0))}</td>
            </tr>
            ${venta.descuento > 0 ? `
            <tr>
                <td colspan="4" class="text-end py-1 text-danger">Descuento:</td>
                <td class="text-end py-1 text-danger">-${fmt.format(venta.descuento)}</td>
            </tr>
            ` : ''}
            <tr class="table-light">
                <td colspan="4" class="text-end fw-bold py-3">Total:</td>
                <td class="text-end fw-bold text-primary py-3 fs-5">${fmt.format(venta.total)}</td>
            </tr>
        `;

        modal.show();
    }
}
window.SalesHistoryView = SalesHistoryView;
