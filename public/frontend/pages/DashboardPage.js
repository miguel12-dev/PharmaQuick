/**
 * PharmaQuick - Dashboard Page
 * Página de dashboard para SPA con renderizado dinámico
 */

const DashboardPage = {
    /**
     * Inicializar página de dashboard
     */
    async init(container) {
        // Verificar autenticación
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }
        
        // Renderizar layout
        this.renderLayout(container);
        
        // Inicializar layout después de renderizar
        this.initLayout();
        
        // Cargar estadísticas
        await this.loadStats();
    },
    
    /**
     * Renderizar layout (navbar + sidebar + content)
     */
    renderLayout(container) {
        const template = document.getElementById('template-layout');
        const dashboardTemplate = document.getElementById('template-dashboard');
        
        container.innerHTML = '';
        if (template) {
            container.appendChild(template.content.cloneNode(true));
        } else {
            container.innerHTML = this.getLayoutHtml();
        }
        
        // Insertar contenido de dashboard en el contenedor correcto
        const pageContent = container.querySelector('.page-content');
        if (pageContent && dashboardTemplate) {
            pageContent.innerHTML = '';
            pageContent.appendChild(dashboardTemplate.content.cloneNode(true));
        } else if (pageContent) {
            pageContent.innerHTML = this.getDashboardContentHtml();
        }
        
        // Cargar info del usuario
        this.loadUserInfo();
    },
    
    /**
     * Obtener HTML del layout
     */
    getLayoutHtml() {
        return `
            <nav class="navbar navbar-expand-lg navbar-light fixed-top">
                <div class="container-fluid">
                    <button class="navbar-toggler me-2" type="button" id="sidebarToggle">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <a class="navbar-brand" href="/dashboard">
                        <i class="bi bi-capsule me-2"></i>PharmaQuick
                    </a>
                    <div class="d-flex align-items-center ms-auto">
                        <div class="dropdown">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                                <i class="bi bi-person-circle me-1"></i>
                                <span id="userName">Usuario</span>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#">Perfil</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="#" id="logoutBtn">Cerrar Sesión</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            <nav class="sidebar" id="sidebar">
                <div class="py-3">
                    <div class="px-3 mb-3">
                        <small class="text-muted text-uppercase fw-bold">Menú</small>
                    </div>
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link active" href="/dashboard" data-page="dashboard">
                                <i class="bi bi-speedometer2"></i>Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/productos" data-page="productos">
                                <i class="bi bi-box-seam"></i>Productos
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>

            <main class="main-content" id="mainContent">
                <div class="container-fluid">
                    <div class="page-content"></div>
                </div>
            </main>
        `;
    },
    
    /**
     * Obtener HTML del contenido del dashboard
     */
    getDashboardContentHtml() {
        return `
            <div class="welcome-card card mb-4">
                <div class="card-body py-4">
                    <h2 class="mb-1">Bienvenido a PharmaQuick</h2>
                    <p class="text-muted mb-0">Gestión integral para tu farmacia</p>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-6 col-lg-3">
                    <div class="card stats-card h-100">
                        <div class="card-body">
                            <h6 class="text-muted">Ventas Hoy</h6>
                            <h4 class="mb-0" id="ventasHoy">$0</h4>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="card stats-card h-100">
                        <div class="card-body">
                            <h6 class="text-muted">Transacciones</h6>
                            <h4 class="mb-0" id="transacciones">0</h4>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="card stats-card h-100">
                        <div class="card-body">
                            <h6 class="text-muted">Productos</h6>
                            <h4 class="mb-0" id="productos">0</h4>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="card stats-card h-100">
                        <div class="card-body">
                            <h6 class="text-muted">Alertas</h6>
                            <h4 class="mb-0" id="alertas">0</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-4">
                <div class="card-header"><h5 class="mb-0">Acceso Rápido</h5></div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-6 col-md-3">
                            <a href="/productos" class="quick-access-card">
                                <i class="bi bi-box-seam fs-3"></i>
                                <h6 class="mt-2 mb-0">Productos</h6>
                            </a>
                        </div>
                        <div class="col-6 col-md-3">
                            <a href="#" class="quick-access-card">
                                <i class="bi bi-cart-plus fs-3"></i>
                                <h6 class="mt-2 mb-0">Nueva Venta</h6>
                            </a>
                        </div>
                        <div class="col-6 col-md-3">
                            <a href="#" class="quick-access-card">
                                <i class="bi bi-box-seam-fill fs-3"></i>
                                <h6 class="mt-2 mb-0">Inventario</h6>
                            </a>
                        </div>
                        <div class="col-6 col-md-3">
                            <a href="#" class="quick-access-card">
                                <i class="bi bi-people fs-3"></i>
                                <h6 class="mt-2 mb-0">Clientes</h6>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-12 col-lg-8">
                    <div class="card">
                        <div class="card-header"><h5 class="mb-0">Últimas Ventas</h5></div>
                        <div class="card-body">
                            <table class="table">
                                <thead><tr><th>ID</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
                                <tbody id="ventasTable"><tr><td colspan="4" class="text-muted">Cargando...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-4">
                    <div class="card">
                        <div class="card-header"><h5 class="mb-0">Actividad</h5></div>
                        <div class="card-body">
                            <div class="activity-item"><div class="content"><div class="title">Venta registrada</div><div class="time">Hace 5 min</div></div></div>
                            <div class="activity-item"><div class="content"><div class="title">Inventario bajo</div><div class="time">Hace 15 min</div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="main-footer text-center mt-4">
                <small class="text-muted">&copy; 2024 PharmaQuick</small>
            </div>
        `;
    },
    
    /**
     * Inicializar layout (toggle sidebar, etc)
     */
    initLayout() {
        const sidebar = document.getElementById('sidebar');
        const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
        const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
        const mainContent = document.getElementById('mainContent');
        
        // Cargar estado previo del sidebar
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && sidebar && window.innerWidth > 768) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
        }

        const toggleSidebar = () => {
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
                const nowCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', nowCollapsed);
                document.body.classList.toggle('sidebar-collapsed', nowCollapsed);
                
                // Animación suave del icono
                const icon = sidebar.querySelector('.sidebar-toggle-icon');
                if (icon) {
                    icon.classList.toggle('fa-chevron-right', nowCollapsed);
                    icon.classList.toggle('fa-chevron-left', !nowCollapsed);
                }
            }
        };

        if (sidebarCollapseBtn) {
            sidebarCollapseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSidebar();
            });
            
            // Ajustar icono inicial si está colapsado
            if (isCollapsed) {
                const icon = sidebar.querySelector('.sidebar-toggle-icon');
                if (icon) {
                    icon.classList.remove('fa-chevron-left');
                    icon.classList.add('fa-chevron-right');
                }
            }
        }

        if (sidebarToggleMobile) {
            sidebarToggleMobile.addEventListener('click', (e) => {
                e.preventDefault();
                sidebar.classList.toggle('show');
            });
        }
        
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                if (sidebar) sidebar.classList.remove('collapsed');
                document.body.classList.remove('sidebar-collapsed');
            }
        });
        
        // Logout event listeners
        const logoutHandler = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const confirmed = await Confirm('¿Estás seguro que deseas cerrar sesión?');
            if (confirmed) {
                localStorage.removeItem('pharmaSession');
                window.location.href = '/login';
            }
        };

        ['logoutBtn', 'logoutBtnDropdown'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', logoutHandler);
        });
        
        // Set active nav based on current data-page
        this.setActiveNav('dashboard');
    },
    
    /**
     * Cargar información del usuario
     */
    loadUserInfo() {
        const userNameEls = document.querySelectorAll('#userName');
        const displayName = AuthService.getUserName() || 'Admin';
        userNameEls.forEach(el => {
            el.textContent = displayName;
        });
    },
    
    /**
     * Establecer enlace activo
     */
    setActiveNav(page) {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
            const dataPage = link.getAttribute('href').replace('/', '');
            if (dataPage === page || (page === 'dashboard' && dataPage === 'dashboard')) {
                link.classList.add('active');
            }
        });
    },
    
    /**
     * Cargar estadísticas del dashboard
     */
    async loadStats() {
        // Mock data para que el dashboard se vea "viable" y profesional
        const mockStats = {
            ventasHoy: 1250.50,
            transacciones: 24,
            alertas: 3
        };

        this.updateStatsDisplay(mockStats);
        
        try {
            const data = await httpClient.get('/productos');
            
            if (data.success) {
                const total = data.data?.total || data.data?.productos?.length || 0;
                const el = document.getElementById('productos');
                if (el) el.textContent = total;
            }
        } catch (error) {
            console.error('Error cargando stats reales:', error);
        }
    },

    /**
     * Actualizar visualización de estadísticas
     */
    updateStatsDisplay(stats) {
        const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });
        
        const elVentas = document.getElementById('ventasHoy');
        const elTrans = document.getElementById('transacciones');
        const elAlertas = document.getElementById('alertas');
        
        if (elVentas) elVentas.textContent = fmt.format(stats.ventasHoy);
        if (elTrans) elTrans.textContent = stats.transacciones;
        if (elAlertas) elAlertas.textContent = stats.alertas;
    }
};

// Exportar
window.DashboardPage = DashboardPage;
