/**
 * PharmaQuick - Inventory Page
 * Página de gestión de inventario, stock y carga masiva
 */

const InventoryPage = {
    view: null,

    async init(container) {
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }

        this.renderLayout(container);
        
        // Inicializar la vista
        this.view = new InventoryView('.page-content');
    },

    renderLayout(container) {
        const template = document.getElementById('template-layout');
        if (template) {
            container.innerHTML = template.innerHTML;
        }

        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 class="fw-bold mb-0 text-dark"><i class="fas fa-boxes-stacked me-2 text-primary"></i> Control de Inventario</h2>
                        <p class="text-muted small mb-0">Gestión de lotes, vencimientos y movimientos Kardex</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary d-flex align-items-center gap-2" id="importExcelBtn">
                            <i class="fas fa-file-import"></i> <span class="d-none d-md-inline">Carga Masiva</span>
                        </button>
                    </div>
                </div>

                <div class="row g-4">
                    <!-- Sección de Alertas (Semáforo) -->
                    <div class="col-12">
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                <h5 class="mb-0 fw-bold"><i class="fas fa-clock text-warning me-2"></i> Próximos Vencimientos (FEFO)</h5>
                                <div class="d-flex align-items-center gap-2">
                                    <span class="text-muted small">Ventana:</span>
                                    <select class="form-select form-select-sm" id="diasVentanaSelect" style="width: auto;">
                                        <option value="30">30 días</option>
                                        <option value="90">90 días</option>
                                        <option value="180" selected>180 días</option>
                                        <option value="365">1 año</option>
                                    </select>
                                </div>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover align-middle mb-0">
                                        <thead class="bg-light">
                                            <tr>
                                                <th style="width: 100px;">Estado</th>
                                                <th>Producto</th>
                                                <th>Lote</th>
                                                <th>Vencimiento</th>
                                                <th>Stock</th>
                                                <th class="text-end">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="alertasTableBody">
                                            <tr>
                                                <td colspan="6" class="text-center py-4">
                                                    <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
                                                    <span class="ms-2 text-muted">Cargando alertas...</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        const pageTitle = container.querySelector('#pageTitle');
        if (pageTitle) pageTitle.textContent = 'Inventario';

        this.setupEventListeners();
        this.initSidebarToggle(container);
    },

    setupEventListeners() {
        const importBtn = document.getElementById('importExcelBtn');
        if (importBtn) {
            importBtn.onclick = () => this.view.showImportModal();
        }

        const diasSelect = document.getElementById('diasVentanaSelect');
        if (diasSelect) {
            diasSelect.onchange = (e) => {
                inventoryController.loadAlertas(parseInt(e.target.value));
            };
        }
    },

    initSidebarToggle(container) {
        // Reusar lógica de layout.js si es posible, o duplicar mínimamente
        const sidebar = container.querySelector('#sidebar');
        const sidebarCollapseBtn = container.querySelector('#sidebarCollapseBtn');
        
        if (sidebarCollapseBtn && sidebar) {
            sidebarCollapseBtn.onclick = () => {
                sidebar.classList.toggle('collapsed');
                document.body.classList.toggle('sidebar-collapsed');
            };
        }

        const logoutBtn = container.querySelector('#logoutBtn');
        if (logoutBtn) logoutBtn.onclick = () => Router.logout();
    }
};

window.InventoryPage = InventoryPage;
