/**
 * PharmaQuick - Not Found Page
 * Página 404 para SPA
 */

const NotFoundPage = {
    /**
     * Inicializar página 404
     */
    async init(container) {
        // Renderizar layout
        this.renderLayout(container);
        
        // Inicializar layout
        this.initLayout();
    },
    
    /**
     * Renderizar layout (navbar + sidebar)
     */
    renderLayout(container) {
        const template = document.getElementById('template-layout');
        
        if (template) {
            container.innerHTML = template.innerHTML;
        } else {
            container.innerHTML = this.getLayoutHtml();
        }
        
        // Insertar contenido 404
        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = this.get404ContentHtml();
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
                            <a class="nav-link" href="/dashboard" data-page="dashboard">
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
     * Obtener HTML del contenido 404
     */
    get404ContentHtml() {
        return `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-circle text-warning" style="font-size: 4rem;"></i>
                <h2 class="mt-3">Página no encontrada</h2>
                <p class="text-muted">La página que buscas no existe.</p>
                <a href="/dashboard" class="btn btn-primary mt-3">Volver al Dashboard</a>
            </div>
        `;
    },
    
    /**
     * Inicializar layout
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
        this.setActiveNav('');
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
        });
    }
};

// Exportar
window.NotFoundPage = NotFoundPage;