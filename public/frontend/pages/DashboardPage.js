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
        
        if (template) {
            container.innerHTML = template.innerHTML;
        } else {
            container.innerHTML = this.getLayoutHtml();
        }
        
        // Insertar contenido de dashboard en el contenedor correcto
        const pageContent = container.querySelector('.page-content');
        if (pageContent && dashboardTemplate) {
            pageContent.innerHTML = dashboardTemplate.innerHTML;
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
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mainContent = document.getElementById('mainContent');
        
        if (sidebarToggle && sidebar) {
            let isMobile = window.innerWidth <= 768;
            
            sidebarToggle.addEventListener('click', () => {
                if (isMobile) {
                    sidebar.classList.toggle('show');
                } else if (mainContent) {
                    mainContent.classList.toggle('sidebar-open');
                }
            });
            
            window.addEventListener('resize', () => {
                const wasMobile = isMobile;
                isMobile = window.innerWidth <= 768;
                
                if (wasMobile !== isMobile) {
                    if (!isMobile) {
                        sidebar.classList.remove('show');
                        if (mainContent) mainContent.classList.remove('sidebar-open');
                    }
                }
            });
            
            // Cerrar sidebar al hacer click fuera en móvil
            document.addEventListener('click', (e) => {
                if (isMobile && sidebar.classList.contains('show')) {
                    if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                        sidebar.classList.remove('show');
                    }
                }
            });
        }
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Router.logout();
            });
        }
        
        // Set active nav
        this.setActiveNav('dashboard');
    },
    
    /**
     * Cargar información del usuario
     */
    loadUserInfo() {
        const session = AuthService.getSession();
        
        const userNameEl = document.getElementById('userName');
        if (userNameEl && session) {
            userNameEl.textContent = session.nombre || session.usuario || 'Usuario';
        }
    },
    
    /**
     * Establecer enlace activo
     */
    setActiveNav(page) {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
            
            const dataPage = link.dataset.page;
            if (dataPage === page) {
                link.classList.add('active');
            }
        });
    },
    
    /**
     * Cargar estadísticas del dashboard
     */
    async loadStats() {
        const token = AuthService.getToken();
        
        if (!token) {
            this.updateProductCount(0);
            return;
        }
        
        try {
            const response = await fetch('/api/productos', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateProductCount(data.data?.total || data.data?.productos?.length || 0);
            }
        } catch (error) {
            console.error('Error cargando stats:', error);
            this.updateProductCount(0);
        }
    },
    
    /**
     * Actualizar conteo de productos
     */
    updateProductCount(count) {
        const el = document.getElementById('productos');
        if (el) {
            el.textContent = count;
        }
    }
};

// Exportar
window.DashboardPage = DashboardPage;