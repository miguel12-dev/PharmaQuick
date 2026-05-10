/**
 * PharmaQuick - InventoryPage
 * Página de inventario con experiencia visual alineada a /productos.
 */
const InventoryPage = {
    view: null,

    async init(container) {
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }

        this.renderLayout(container);
        this.view = new InventoryView('.page-content');
    },

    renderLayout(container) {
        const template = document.getElementById('template-layout');
        if (template) {
            container.innerHTML = '';
            container.appendChild(template.content.cloneNode(true));
        }

        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = `
                <section class="inventory-page fade-in-up">
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                        <div>
                            <h2 class="fw-bold mb-1 text-dark"><i class="fas fa-boxes-stacked me-2 text-primary"></i>Gestión de Inventario</h2>
                            <p class="text-muted small mb-0">Control FEFO, alertas de vencimiento y movimientos Kardex.</p>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary d-flex align-items-center gap-2" id="importExcelBtn">
                                <i class="fas fa-file-import"></i>
                                <span>Carga masiva</span>
                            </button>
                            <button class="btn btn-primary d-flex align-items-center gap-2" id="createLoteBtn">
                                <i class="fas fa-plus"></i>
                                <span>Nuevo Ingreso</span>
                            </button>
                        </div>
                    </div>

                    <div class="card border-0 shadow-sm mb-4 inventory-loading-target">
                        <div class="card-body">
                            <div class="row g-3 align-items-end">
                                <div class="col-md-4">
                                    <label class="form-label small text-muted mb-1">Buscar</label>
                                    <input id="inventarioSearchInput" type="text" class="form-control" placeholder="Producto, código de barras o lote">
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label small text-muted mb-1">Semáforo</label>
                                    <select id="semaforoFilter" class="form-select">
                                        <option value="">Todos</option>
                                        <option value="VENCIDO">Vencido</option>
                                        <option value="ROJO">Rojo</option>
                                        <option value="AMARILLO">Amarillo</option>
                                        <option value="VERDE">Verde</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label small text-muted mb-1">Ventana</label>
                                    <select id="diasVentanaSelect" class="form-select">
                                        <option value="30">30 días</option>
                                        <option value="90">90 días</option>
                                        <option value="180" selected>180 días</option>
                                        <option value="365">365 días</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label small text-muted mb-1">Mostrar</label>
                                    <select id="inventarioPerPageSelect" class="form-select">
                                        <option value="10">10</option>
                                        <option value="25" selected>25</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>
                                <div class="col-md-2 text-md-end">
                                    <span class="badge bg-primary-soft text-primary p-2">Total <span id="inventarioTotalBadge">0</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 shadow-sm mb-4 inventory-loading-target">
                        <div class="card-header bg-white border-0 py-3"><h5 class="mb-0 fw-bold">Alertas FEFO</h5></div>
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0 inventory-table">
                                <thead>
                                    <tr>
                                        <th>Estado</th><th>Producto</th><th>Código</th><th>Lote</th><th>Vencimiento</th><th>Días</th><th>Stock</th><th class="text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="alertasTableBody">
                                    <tr><td colspan="8" class="text-center text-muted py-4">Cargando alertas...</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="card-footer bg-white border-0 py-3">
                            <nav><ul class="pagination pagination-sm justify-content-center mb-0" id="inventarioPagination"></ul></nav>
                        </div>
                    </div>
                </section>
            `;
        }

        const pageTitle = container.querySelector('#pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'Inventario';
        }

        this.loadUserInfo(container);
        this.setupEventListeners(container);
        this.initSidebarToggle(container);
        this.setActiveNav('inventario');
    },

    loadUserInfo(container) {
        if (typeof AuthService !== 'undefined') {
            const session = AuthService.getSession();
            const userNameEls = container.querySelectorAll('#userName');
            const displayName = AuthService.getUserName() || 'Admin';
            userNameEls.forEach(el => {
                el.textContent = displayName;
            });
        }
    },

    setActiveNav(page) {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && (href === '/' + page || href.includes(page))) {
                link.classList.add('active');
            }
        });
    },

    setupEventListeners(container) {
        const importButton = container.querySelector('#importExcelBtn');
        if (importButton) {
            importButton.addEventListener('click', () => this.view?.showImportModal());
        }

        const createLoteButton = container.querySelector('#createLoteBtn');
        if (createLoteButton) {
            createLoteButton.addEventListener('click', () => this.view?.showCreateLoteModal());
        }

        // Logout
        const logoutBtns = container.querySelectorAll('#logoutBtn, #logoutBtnDropdown');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const confirmed = await Confirm('¿Estás seguro que deseas cerrar sesión?');
                if (confirmed) {
                    localStorage.removeItem('pharmaSession');
                    window.location.href = '/login';
                }
            });
        });
    },

    initSidebarToggle(container) {
        const sidebar = container.querySelector('#sidebar');
        const collapseBtn = container.querySelector('#sidebarCollapseBtn');
        const mobileBtn = container.querySelector('#sidebarToggleMobile');

        // Restaurar estado previo
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && sidebar && window.innerWidth > 768) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            const icon = sidebar.querySelector('.sidebar-toggle-icon');
            if (icon) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            }
        } else if (!isCollapsed) {
            document.body.classList.remove('sidebar-collapsed');
        }

        if (collapseBtn && sidebar) {
            collapseBtn.addEventListener('click', (event) => {
                event.preventDefault();
                sidebar.classList.toggle('collapsed');
                const nowCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', nowCollapsed);
                document.body.classList.toggle('sidebar-collapsed', nowCollapsed);
                
                const icon = sidebar.querySelector('.sidebar-toggle-icon');
                if (icon) {
                    icon.classList.toggle('fa-chevron-right', nowCollapsed);
                    icon.classList.toggle('fa-chevron-left', !nowCollapsed);
                }
            });
        }

        if (mobileBtn && sidebar) {
            mobileBtn.addEventListener('click', (event) => {
                event.preventDefault();
                sidebar.classList.toggle('show');
            });
        }
    },
};

window.InventoryPage = InventoryPage;
