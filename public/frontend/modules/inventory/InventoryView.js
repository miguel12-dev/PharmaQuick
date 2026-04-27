/**
 * PharmaQuick - Inventory View
 * Maneja la interfaz de inventario, FEFO e importación
 */

class InventoryView {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.controller = inventoryController;
        this.init();
    }

    init() {
        if (!this.container) return;

        // Escuchar eventos del controlador
        this.controller.on('onAlertasChange', (alertas) => this.renderAlertas(alertas));
        this.controller.on('onLoadingChange', (loading) => this.setLoading(loading));
        this.controller.on('onError', (msg) => this.showError(msg));

        // Inicializar
        this.controller.init();
    }

    /**
     * Renderiza la tabla de alertas/semáforo
     */
    renderAlertas(alertas) {
        const tableBody = this.container.querySelector('#alertasTableBody');
        if (!tableBody) return;

        if (alertas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay alertas de vencimiento.</td></tr>';
            return;
        }

        tableBody.innerHTML = alertas.map(a => `
            <tr>
                <td><span class="badge bg-${this.getSemaforoColor(a.semaforo)}">${a.semaforo}</span></td>
                <td><strong>${a.producto_nombre}</strong></td>
                <td><code>${a.codigo_lote}</code></td>
                <td>${a.fecha_vencimiento}</td>
                <td>${a.stock_actual}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary action-btn" data-id="${a.lote_id}" data-action="movimiento">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Re-vincular eventos de botones
        tableBody.querySelectorAll('.action-btn').forEach(btn => {
            btn.onclick = () => this.handleAction(btn.dataset.action, btn.dataset.id);
        });
    }

    getSemaforoColor(semaforo) {
        const colors = {
            'VENCIDO': 'dark',
            'ROJO': 'danger',
            'AMARILLO': 'warning',
            'VERDE': 'success'
        };
        return colors[semaforo] || 'secondary';
    }

    setLoading(loading) {
        const table = this.container.querySelector('.table-responsive');
        if (table) {
            table.classList.toggle('opacity-50', loading);
        }
    }

    showError(message) {
        if (typeof Toast !== 'undefined') {
            Toast.error(message);
        }
    }

    handleAction(action, id) {
        if (action === 'movimiento') {
            this.showMovimientoModal(id);
        }
    }

    /**
     * Modal para registrar movimiento manual (Ajuste, Merma, etc)
     */
    showMovimientoModal(loteId) {
        const modal = new Modal({
            title: 'Registrar Movimiento de Inventario',
            content: `
                <form id="movimientoForm">
                    <div class="mb-3">
                        <label class="form-label">Tipo de Movimiento</label>
                        <select class="form-select" name="tipo" required>
                            <option value="ENTRADA">ENTRADA (Ajuste/Compra)</option>
                            <option value="SALIDA">SALIDA (Merma/Ajuste)</option>
                            <option value="RESERVA">RESERVA</option>
                            <option value="LIBERACION">LIBERACION</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Cantidad</label>
                        <input type="number" step="0.01" class="form-control" name="cantidad" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Descripción / Motivo</label>
                        <textarea class="form-control" name="descripcion" rows="2"></textarea>
                    </div>
                </form>
            `,
            onConfirm: async () => {
                const form = document.getElementById('movimientoForm');
                const formData = new FormData(form);
                const data = {
                    lote_id: loteId,
                    tipo: formData.get('tipo'),
                    cantidad: parseFloat(formData.get('cantidad')),
                    descripcion: formData.get('descripcion')
                };

                try {
                    await this.controller.registrarMovimiento(data);
                    modal.close();
                    Toast.success('Movimiento registrado correctamente');
                    this.controller.loadAlertas(); // Recargar alertas
                } catch (e) {
                    modal.showError(e.message);
                }
            }
        });
        modal.open();
    }

    /**
     * Modal para Importación Excel
     */
    showImportModal() {
        const modal = new Modal({
            title: 'Importar Inventario Masivo',
            content: `
                <div class="p-3">
                    <p class="text-muted small">Selecciona un archivo .xlsx siguiendo la plantilla por código de barras.</p>
                    <div class="mb-3">
                        <label class="form-label">Archivo Excel (.xlsx)</label>
                        <input type="file" class="form-control" id="excelFile" accept=".xlsx">
                    </div>
                    <div id="importResults" class="mt-3 d-none">
                        <h6>Resultados:</h6>
                        <div class="alert alert-info py-2 small" id="importSummary"></div>
                        <div id="importErrors" class="text-danger small mt-2" style="max-height: 150px; overflow-y: auto;"></div>
                    </div>
                </div>
            `,
            onConfirm: async () => {
                const fileInput = document.getElementById('excelFile');
                if (!fileInput.files.length) {
                    modal.showError('Selecciona un archivo');
                    return;
                }

                modal.setLoading(true);
                try {
                    const result = await this.controller.importExcel(fileInput.files[0]);
                    this.showImportResults(result.summary);
                    if (result.summary.errores.length === 0) {
                        setTimeout(() => modal.close(), 3000);
                        Toast.success('Importación completada con éxito');
                    }
                } catch (e) {
                    modal.showError(e.message);
                } finally {
                    modal.setLoading(false);
                }
            }
        });
        modal.open();
    }

    showImportResults(summary) {
        const container = document.getElementById('importResults');
        const summaryElem = document.getElementById('importSummary');
        const errorsElem = document.getElementById('importErrors');

        container.classList.remove('d-none');
        summaryElem.innerHTML = `
            <strong>Total:</strong> ${summary.total_filas} | 
            <strong>OK:</strong> ${summary.procesados_ok} | 
            <strong>Errores:</strong> ${summary.errores.length}
        `;

        if (summary.errores.length > 0) {
            errorsElem.innerHTML = '<ul>' + summary.errores.map(e => `
                <li>Línea ${e.linea} (${e.codigo_barras}): ${e.error}</li>
            `).join('') + '</ul>';
        } else {
            errorsElem.innerHTML = '';
        }
    }
}
