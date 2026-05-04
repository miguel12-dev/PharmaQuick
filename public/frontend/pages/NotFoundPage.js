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

        const pageTitle = container.querySelector('#pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'Página no encontrada';
        }
        
        // Cargar info del usuario
        this.loadUserInfo(container);
        this.initLayout(container);
    },
    
    /**
     * Obtener HTML del layout (Fallback)
     */
    getLayoutHtml() {
        return `
            <aside class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="d-flex align-items-center w-100">
                        <h4 class="m-0 fw-bold text-white">PharmaQuick</h4>
                    </div>
                </div>
                <nav class="nav flex-column py-3">
                    <a class="nav-link" href="/dashboard"><i class="fas fa-chart-pie"></i> Dashboard</a>
                    <a class="nav-link" href="/productos"><i class="fas fa-pills"></i> Productos</a>
                </nav>
            </aside>
            <main class="main-content" id="mainContent">
                <nav class="navbar navbar-expand-lg fixed-top px-4">
                    <div class="container-fluid p-0">
                        <button class="btn btn-link link-dark p-0 me-3 d-md-none" id="sidebarToggleMobile">
                            <i class="fas fa-bars fa-lg"></i>
                        </button>
                        <div class="ms-auto">
                            <span class="fw-semibold small" id="userName">Admin</span>
                        </div>
                    </div>
                </nav>
                <div class="container-fluid py-4">
                    <h4 class="m-0 mb-4 fw-bold text-dark" id="pageTitle">404</h4>
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
                <div class="mb-4">
                    <i class="fas fa-exclamation-circle text-warning opacity-25" style="font-size: 6rem;"></i>
                </div>
                <h2 class="fw-bold text-dark">Página no encontrada</h2>
                <p class="text-muted mb-4">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
                <a href="/dashboard" class="btn btn-primary px-4 py-2">
                    <i class="fas fa-home me-2"></i>Volver al Dashboard
                </a>
            </div>
        `;
    },
    
    /**
     * Inicializar layout
     */
    initLayout(container) {
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

        // Logout
        const logoutBtns = container.querySelectorAll('#logoutBtn, #logoutBtnDropdown');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                Router.logout();
            });
        });
    },
    
    /**
     * Cargar información del usuario
     */
    loadUserInfo(container) {
        if (typeof AuthService !== 'undefined') {
            const session = AuthService.getSession();
            const userNameEls = container.querySelectorAll('#userName');
            if (session) {
                userNameEls.forEach(el => {
                    el.textContent = session.nombre || session.usuario || 'Admin';
                });
            }
        }
    }
};

// Exportar
window.NotFoundPage = NotFoundPage;