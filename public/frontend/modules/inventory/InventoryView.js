/**
 * PharmaQuick - InventoryView
 * Vista moderna de inventario con filtros, KPIs y carga masiva.
 */
class InventoryView {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.controller = inventoryController;
        this.currentImportSummary = null;
        this.init();
    }

    init() {
        if (!this.container) {
            return;
        }

        this.controller.on('onAlertasChange', (alertas) => this.renderAlertas(alertas));
        this.controller.on('onPaginationChange', (pagination) => this.renderPagination(pagination));
        this.controller.on('onLoadingChange', (loading) => this.setLoading(loading));
        this.controller.on('onError', (message) => this.showError(message));

        this.bindFilters();
        this.controller.init();
    }

    bindFilters() {
        const dias = this.container.querySelector('#diasVentanaSelect');
        const semaforo = this.container.querySelector('#semaforoFilter');
        const search = this.container.querySelector('#inventarioSearchInput');
        const perPage = this.container.querySelector('#inventarioPerPageSelect');

        if (dias) {
            dias.addEventListener('change', async (event) => {
                this.controller.setFilters({ dias: parseInt(event.target.value, 10) || 180 });
                await this.controller.loadAlertas();
            });
        }

        if (semaforo) {
            semaforo.addEventListener('change', async (event) => {
                this.controller.setFilters({ semaforo: event.target.value || '' });
                await this.controller.loadAlertas();
            });
        }

        if (search) {
            let timeoutRef = null;
            search.addEventListener('input', (event) => {
                clearTimeout(timeoutRef);
                timeoutRef = setTimeout(async () => {
                    this.controller.setFilters({ q: event.target.value.trim() });
                    await this.controller.loadAlertas();
                }, 250);
            });
        }

        if (perPage) {
            perPage.addEventListener('change', async (event) => {
                this.controller.setFilters({ perPage: parseInt(event.target.value, 10) || 25 });
                await this.controller.loadAlertas();
            });
        }

    }

    renderAlertas(alertas) {
        const tableBody = this.container.querySelector('#alertasTableBody');
        const total = this.container.querySelector('#inventarioTotalBadge');

        if (!tableBody) {
            return;
        }

        if (total) {
            total.textContent = `${this.controller.pagination.total || alertas.length}`;
        }

        if (!alertas || alertas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Sin resultados para los filtros aplicados.</td></tr>';
            return;
        }

        tableBody.innerHTML = alertas.map((item) => `
            <tr>
                <td><span class="badge inventory-semaforo inventory-semaforo-${item.semaforo.toLowerCase()}">${item.semaforo}</span></td>
                <td class="fw-semibold">${item.producto_nombre || '-'}</td>
                <td><code>${item.codigo_barras || '-'}</code></td>
                <td><code>${item.codigo_lote || '-'}</code></td>
                <td>${item.fecha_vencimiento || '-'}</td>
                <td>${item.dias_restantes ?? '-'}</td>
                <td>${item.stock_actual}</td>
                <td class="text-end">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary inventory-action-btn" data-id="${item.lote_id}" data-action="movimiento" title="Registrar Movimiento">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info inventory-action-btn" data-id="${item.lote_id}" data-action="historial" title="Ver Historial">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tableBody.querySelectorAll('[data-action="movimiento"]').forEach((button) => {
            button.addEventListener('click', () => this.showMovimientoModal(button.dataset.id));
        });

        tableBody.querySelectorAll('[data-action="historial"]').forEach((button) => {
            button.addEventListener('click', () => this.showHistorialModal(button.dataset.id));
        });
    }

    renderPagination(pagination) {
        const container = this.container.querySelector('#inventarioPagination');
        if (!container) {
            return;
        }

        const totalPages = pagination.total_pages || 1;
        const current = pagination.page || 1;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        html += `<li class="page-item ${current <= 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${current - 1}">«</a></li>`;

        for (let page = 1; page <= totalPages; page += 1) {
            if (page === 1 || page === totalPages || (page >= current - 1 && page <= current + 1)) {
                html += `<li class="page-item ${page === current ? 'active' : ''}"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`;
            } else if (page === current - 2 || page === current + 2) {
                html += '<li class="page-item disabled"><span class="page-link">…</span></li>';
            }
        }

        html += `<li class="page-item ${current >= totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${current + 1}">»</a></li>`;
        container.innerHTML = html;

        container.querySelectorAll('[data-page]').forEach((link) => {
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                const page = parseInt(link.dataset.page, 10);
                if (!page || page < 1 || page > totalPages) {
                    return;
                }
                this.controller.setPage(page);
                await this.controller.loadAlertas();
            });
        });
    }

    setLoading(isLoading) {
        this.container.querySelectorAll('.inventory-loading-target').forEach((element) => {
            element.classList.toggle('opacity-50', isLoading);
        });
    }

    showError(message) {
        if (typeof Toast !== 'undefined') {
            Toast.error(message);
        }
    }

    showMovimientoModal(loteId) {
        const modal = new Modal({
            title: '<i class="fas fa-exchange-alt me-2 text-primary"></i>Registrar movimiento',
            content: `
                <form id="movimientoForm" class="inventory-modal-form">
                    <div class="mb-3">
                        <label class="form-label">Tipo</label>
                        <select class="form-select" name="tipo" required>
                            <option value="ENTRADA">ENTRADA</option>
                            <option value="SALIDA">SALIDA</option>
                            <option value="RESERVA">RESERVA</option>
                            <option value="LIBERACION">LIBERACION</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Cantidad</label>
                        <input type="number" step="0.01" min="0.01" class="form-control" name="cantidad" required>
                    </div>
                    <div class="mb-0">
                        <label class="form-label">Descripción</label>
                        <textarea class="form-control" name="descripcion" rows="2" placeholder="Motivo del movimiento"></textarea>
                    </div>
                </form>
            `,
            onConfirm: async () => {
                const form = document.getElementById('movimientoForm');
                const formData = new FormData(form);

                const payload = {
                    lote_id: Number(loteId),
                    tipo: formData.get('tipo'),
                    cantidad: parseFloat(formData.get('cantidad')),
                    descripcion: formData.get('descripcion'),
                };

                try {
                    modal.setLoading(true);
                    await this.controller.registrarMovimiento(payload);
                    modal.close();
                    Toast.success('Movimiento registrado correctamente.');
                } catch (error) {
                    modal.showError(error.message || 'No fue posible registrar el movimiento.');
                } finally {
                    modal.setLoading(false);
                }
            },
        });

        modal.open();
    }

    async showImportModal() {
        const importModel = {
            headers_requeridos: ['codigo_barras', 'codigo_lote', 'cantidad'],
            headers_opcionales: ['costo_unitario', 'fecha_vencimiento'],
            formato_fecha: 'YYYY-MM-DD',
            ejemplo_fila: {
                codigo_barras: '7701234567890',
                codigo_lote: 'L-2026-001',
                cantidad: '120',
                costo_unitario: '4500.50',
                fecha_vencimiento: '2027-12-31',
            },
        };
        const headers = [...(importModel.headers_requeridos || []), ...(importModel.headers_opcionales || [])];
        const headerLine = headers.join(',');
        const exampleValues = headers.map((header) => importModel.ejemplo_fila?.[header] ?? '').join(',');
        const csvModel = `${headerLine}\n${exampleValues}`;

        const modal = new Modal({
            title: '<i class="fas fa-file-import me-2 text-primary"></i>Carga masiva de inventario',
            size: 'lg',
            confirmText: 'Importar archivo',
            content: `
                <div class="inventory-import-modal">
                    <p class="small text-muted mb-3">Sube un archivo <strong>.xlsx</strong> con los encabezados del modelo definido.</p>

                    <div class="inventory-import-format mb-3">
                        <h6 class="fw-bold mb-2">Modelo esperado</h6>
                        <div class="table-responsive">
                            <table class="table table-sm align-middle mb-0">
                                <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
                                <tbody><tr>${headers.map((h) => `<td>${importModel.ejemplo_fila?.[h] ?? '-'}</td>`).join('')}</tr></tbody>
                            </table>
                        </div>
                        <small class="text-muted d-block mt-2">Formato de fecha: ${importModel.formato_fecha || 'YYYY-MM-DD'}</small>
                    </div>

                    <div class="inventory-import-csv mb-3">
                        <label class="form-label fw-semibold">Referencia rápida (CSV)</label>
                        <textarea class="form-control" rows="3" readonly>${csvModel}</textarea>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold">Archivo Excel (.xlsx)</label>
                        <input type="file" class="form-control" id="excelFile" accept=".xlsx" required>
                    </div>

                    <div id="importResults" class="d-none"></div>
                </div>
            `,
            onConfirm: async () => {
                const fileInput = document.getElementById('excelFile');
                if (!fileInput?.files?.length) {
                    modal.showError('Seleccione un archivo .xlsx para continuar.');
                    return;
                }

                try {
                    modal.setLoading(true);
                    const result = await this.controller.importExcel(fileInput.files[0]);
                    this.currentImportSummary = result.summary;
                    this.renderImportResults(result.summary, modal);

                    if ((result.summary?.errores || []).length === 0) {
                        Toast.success('Importación completada correctamente.');
                        setTimeout(() => modal.close(), 1200);
                    }
                } catch (error) {
                    modal.showError(error.message || 'Error en la carga masiva.');
                } finally {
                    modal.setLoading(false);
                }
            },
        });

        modal.open();
    }

    renderImportResults(summary, modal) {
        const body = modal.element?.querySelector('#importResults');
        if (!body) {
            return;
        }

        const errores = summary?.errores || [];
        const erroresHtml = errores.length
            ? `<ul class="mb-0 ps-3">${errores.map((e) => `<li>Línea ${e.linea} (${e.codigo_barras}): ${e.error}</li>`).join('')}</ul>`
            : '<span class="text-success">Sin errores de importación.</span>';

        body.classList.remove('d-none');
        body.innerHTML = `
            <div class="alert alert-info inventory-import-summary mb-0">
                <div><strong>Total filas:</strong> ${summary?.total_filas || 0}</div>
                <div><strong>Procesadas OK:</strong> ${summary?.procesados_ok || 0}</div>
                <div><strong>Errores:</strong> ${errores.length}</div>
                <hr class="my-2">
                ${erroresHtml}
            </div>
        `;
    }

    showCreateLoteModal() {
        const DEFAULT_CATEGORIES = ['Analgésicos', 'Antibióticos', 'Antiinflamatorios', 'Antihistamínicos', 'Gastrointestinales', 'Vitaminas y suplementos', 'Dermatológicos', 'Cardiovasculares', 'Respiratorios', 'Pediátricos'];
        
        const modal = new Modal({
            title: '<i class="fas fa-plus me-2 text-primary"></i>Nuevo Ingreso de Inventario',
            size: 'xl',
            content: `
                <div class="inventory-create-modal" style="min-height: 450px;">
                    <div class="mb-4">
                        <label class="form-label fw-bold">1. Seleccionar Producto</label>
                        <div class="row g-2">
                            <div class="col-md-7">
                                <div class="input-group">
                                    <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
                                    <input type="text" id="productSearchInput" class="form-control border-start-0" placeholder="Buscar por nombre o código...">
                                </div>
                            </div>
                            <div class="col-md-5">
                                <select id="categoryFilter" class="form-select">
                                    <option value="">Todas las categorías</option>
                                    ${DEFAULT_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div id="productSearchResults" class="list-group mt-2 shadow-sm d-none" style="max-height: 450px; overflow-y: auto; z-index: 1050; position: absolute; width: calc(100% - 2rem);"></div>
                        <div id="selectedProductInfo" class="mt-3 p-3 bg-light rounded d-none">
                            <div class="d-flex align-items-center gap-3">
                                <div id="selectedProductIcon" class="bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                    <i class="fas fa-pills fs-4"></i>
                                </div>
                                <div>
                                    <h6 id="selectedProductName" class="mb-1 fw-bold"></h6>
                                    <p id="selectedProductBarcode" class="mb-0 text-muted small"></p>
                                </div>
                                <button type="button" id="changeProductBtn" class="btn btn-sm btn-link ms-auto text-decoration-none">Cambiar</button>
                            </div>
                        </div>
                    </div>

                    <form id="createLoteForm" class="d-none">
                        <input type="hidden" name="producto_id" id="targetProductoId">
                        <label class="form-label fw-bold mb-3">2. Detalles del Lote</label>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label small text-muted">Código de Lote</label>
                                <input type="text" name="codigo_lote" class="form-control" required placeholder="Ej: LOT-2026-001">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small text-muted">Fecha de Vencimiento</label>
                                <input type="date" name="fecha_vencimiento" class="form-control" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small text-muted">Cantidad Inicial</label>
                                <input type="number" name="stock_inicial" class="form-control" required min="1" step="1" placeholder="0">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small text-muted">Costo Unitario</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" name="costo_unitario" class="form-control" required min="0" step="0.01" placeholder="0.00">
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            `,
            onConfirm: async () => {
                const form = document.getElementById('createLoteForm');
                if (form.classList.contains('d-none')) {
                    modal.showError('Debe seleccionar un producto primero.');
                    return;
                }

                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                const formData = new FormData(form);
                const payload = {
                    producto_id: Number(formData.get('producto_id')),
                    codigo_lote: formData.get('codigo_lote'),
                    fecha_vencimiento: formData.get('fecha_vencimiento'),
                    stock_inicial: Number(formData.get('stock_inicial')),
                    costo_unitario: Number(formData.get('costo_unitario')),
                };

                try {
                    modal.setLoading(true);
                    await this.controller.crearLote(payload);
                    modal.close();
                    Toast.success('Lote creado e ingresado correctamente.');
                } catch (error) {
                    modal.showError(error.message || 'No fue posible crear el lote.');
                } finally {
                    modal.setLoading(false);
                }
            },
        });

        modal.open();

        // Lógica de búsqueda AJAX
        const searchInput = modal.element.querySelector('#productSearchInput');
        const categoryFilter = modal.element.querySelector('#categoryFilter');
        const resultsBox = modal.element.querySelector('#productSearchResults');
        const selectedInfo = modal.element.querySelector('#selectedProductInfo');
        const createForm = modal.element.querySelector('#createLoteForm');
        let searchTimeout = null;

        // Cargar categorías adicionales desde el API
        const loadCategories = async () => {
            try {
                const response = await httpClient.get('/productos/categorias');
                const apiCategorias = response.data?.categorias || [];
                
                // Obtener categorías actuales para evitar duplicados
                const currentOptions = Array.from(categoryFilter.options).map(opt => opt.value);

                apiCategorias.forEach(cat => {
                    if (cat && !currentOptions.includes(cat)) {
                        const option = document.createElement('option');
                        option.value = cat;
                        option.textContent = cat;
                        categoryFilter.appendChild(option);
                    }
                });
            } catch (error) {
                console.error('Error cargando categorías:', error);
            }
        };
        loadCategories();

        const performSearch = async (immediate = false) => {
            const q = searchInput.value.trim();
            const categoria = categoryFilter.value;
            clearTimeout(searchTimeout);

            if (q.length < 2 && !categoria) {
                resultsBox.classList.add('d-none');
                return;
            }

            const searchLogic = async () => {
                try {
                    resultsBox.innerHTML = '<div class="list-group-item text-center py-3"><span class="spinner-border spinner-border-sm me-2"></span> Buscando...</div>';
                    resultsBox.classList.remove('d-none');

                    const params = {};
                    if (q.length >= 2) {
                        params.q = q;
                    }
                    if (categoria) {
                        params.categoria = categoria;
                    }

                    const response = await httpClient.get('/productos/search', params);
                    const productos = response.data?.productos || [];
                    
                    if (productos.length === 0) {
                        resultsBox.innerHTML = '<div class="list-group-item text-muted text-center py-3">No se encontraron productos en esta categoría</div>';
                    } else {
                        resultsBox.innerHTML = productos.map(p => `
                            <button type="button" class="list-group-item list-group-item-action p-3 product-select-item" data-id="${p.id}" data-nombre="${p.nombre}" data-barcode="${p.codigo || p.codigo_barras || ''}">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="fw-bold d-block">${p.nombre}</span>
                                        <small class="text-muted">${p.categoria || 'Sin categoría'} • ${p.presentacion || ''}</small>
                                    </div>
                                    <span class="badge bg-light text-dark border">${p.codigo || p.codigo_barras || 'Sin código'}</span>
                                </div>
                            </button>
                        `).join('');

                        resultsBox.querySelectorAll('.product-select-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const id = item.dataset.id;
                                const nombre = item.dataset.nombre;
                                const barcode = item.dataset.barcode;

                                document.getElementById('targetProductoId').value = id;
                                document.getElementById('selectedProductName').textContent = nombre;
                                document.getElementById('selectedProductBarcode').textContent = barcode ? `Código: ${barcode}` : 'Sin código de barras';
                                
                                searchInput.closest('.row').classList.add('d-none');
                                resultsBox.classList.add('d-none');
                                selectedInfo.classList.remove('d-none');
                                createForm.classList.remove('d-none');
                            });
                        });
                    }
                } catch (error) {
                    console.error('Error buscando productos:', error);
                    resultsBox.innerHTML = `<div class="list-group-item text-danger text-center py-3">Error: ${error.message}</div>`;
                }
            };

            if (immediate) {
                searchLogic();
            } else {
                searchTimeout = setTimeout(searchLogic, 300);
            }
        };

        searchInput.addEventListener('input', performSearch);
        categoryFilter.addEventListener('change', () => performSearch(true)); // Pasar flag para búsqueda inmediata

        document.getElementById('changeProductBtn').addEventListener('click', () => {
            searchInput.closest('.row').classList.remove('d-none');
            selectedInfo.classList.add('d-none');
            createForm.classList.add('d-none');
            searchInput.value = '';
            searchInput.focus();
        });
    }

    async showHistorialModal(loteId) {
        const modal = new Modal({
            title: '<i class="fas fa-history me-2 text-primary"></i>Historial de Movimientos',
            size: 'lg',
            confirmText: 'Cerrar',
            showCancel: false,
            content: `
                <div class="inventory-history-modal">
                    <div id="historyTableContainer" class="table-responsive">
                        <table class="table table-sm table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Cantidad</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody id="historyTableBody">
                                <tr><td colspan="4" class="text-center py-4 text-muted">Cargando historial...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `,
        });

        modal.open();

        try {
            const movimientos = await this.controller.loadMovimientosPorLote(loteId);
            const tbody = document.getElementById('historyTableBody');

            if (movimientos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No hay movimientos registrados para este lote.</td></tr>';
                return;
            }

            tbody.innerHTML = movimientos.map(m => `
                <tr>
                    <td><small>${new Date(m.created_at).toLocaleString()}</small></td>
                    <td><span class="badge inventory-semaforo-${m.tipo === 'ENTRADA' ? 'verde' : m.tipo === 'SALIDA' ? 'rojo' : 'amarillo'}">${m.tipo}</span></td>
                    <td class="fw-bold">${m.cantidad}</td>
                    <td><small class="text-muted">${m.descripcion || '-'}</small></td>
                </tr>
            `).join('');
        } catch (error) {
            modal.showError('Error al cargar el historial.');
        }
    }
}
