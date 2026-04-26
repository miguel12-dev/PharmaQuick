/**
 * PharmaQuick - Products Page
 * Página de productos para SPA con renderizado dinámico
 */

const ProductsPage = {
    productView: null,
    priceView: null,
    
    /**
     * Inicializar página de productos
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
        
        // Inicializar ProductView
        this.initProductView();
        
        // Inicializar PriceView
        this.initPriceView();
    },
    
    /**
     * Renderizar layout (navbar + sidebar + content)
     */
    renderLayout(container) {
        const template = document.getElementById('template-layout');
        const productsTemplate = document.getElementById('template-productos');
        
        if (template) {
            container.innerHTML = template.innerHTML;
        } else {
            container.innerHTML = this.getLayoutHtml();
        }
        
        // Insertar contenido de productos en el contenedor correcto
        const pageContent = container.querySelector('.page-content');
        if (pageContent && productsTemplate) {
            pageContent.innerHTML = productsTemplate.innerHTML;
        } else if (pageContent) {
            pageContent.innerHTML = this.getProductsContentHtml();
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
                            <a class="nav-link active" href="/productos" data-page="productos">
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
     * Obtener HTML del contenido de productos
     */
    getProductsContentHtml() {
        return `
            <div id="productsContainer"></div>
            <div id="pricesContainer" class="d-none"></div>
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
        this.setActiveNav('productos');
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
     * Inicializar ProductView
     */
    initProductView() {
        const container = document.querySelector('#productsContainer');
        if (!container) {
            console.error('ProductsPage: productsContainer no encontrado');
            return;
        }
        
        // Crear instancia del controller
        this.productView = new ProductView('#productsContainer');
    },
    
    /**
     * Inicializar PriceView
     */
    initPriceView() {
        const container = document.querySelector('#pricesContainer');
        if (container) {
            this.priceView = new PriceView('#pricesContainer');
        }
    }
};

// Exportar
window.ProductsPage = ProductsPage;