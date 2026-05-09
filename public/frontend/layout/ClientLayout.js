/**
 * PharmaQuick - Client Layout (E-commerce style)
 * Layout simplificado para clientes sin sidebar administrativo
 */

const ClientLayout = {
    /**
     * Renderiza un layout tipo e-commerce para clientes
     */
    render(container, activePage = 'tienda') {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        let userName = session.userName || session.email || 'Cliente';
        
        // Si userName es un email, extraer solo el nombre (antes del @)
        if (userName && userName.includes('@')) {
            userName = userName.split('@')[0];
        }
        
        container.innerHTML = this.getHtml(userName, activePage);
        this.setupEventListeners(container);
    },

    getHtml(userName, activePage) {
        return `
<div class="client-layout">
    <!-- Header mejorado con más height y menú responsive -->
    <header class="client-header bg-white shadow-sm border-bottom">
        <div class="container-fluid px-3 px-lg-4">
            <div class="row align-items-center py-2 py-md-3">
                <!-- Logo -->
                <div class="col-auto">
                    <a href="/cliente" class="d-flex align-items-center text-decoration-none">
                        <img src="/image/logo_pharmaQuick.png" alt="PharmaQuick" class="client-logo" height="50">
                    </a>
                </div>
                
                <!-- Menú de navegación - Desktop -->
                <div class="col d-none d-md-flex justify-content-center">
                    <nav class="d-flex gap-1">
                        <a href="/cliente" class="nav-link client-nav-link px-3 py-2 ${activePage === 'inicio' ? 'active' : ''}">
                            <i class="fas fa-home me-1"></i> Inicio
                        </a>
                        <a href="/cliente/tienda" class="nav-link client-nav-link px-3 py-2 ${activePage === 'tienda' ? 'active' : ''}">
                            <i class="fas fa-store me-1"></i> Tienda
                        </a>
                        <a href="/cliente/reservas" class="nav-link client-nav-link px-3 py-2 ${activePage === 'reservas' ? 'active' : ''}">
                            <i class="fas fa-calendar-check me-1"></i> Mis Reservas
                        </a>
                        <a href="/cliente/compras" class="nav-link client-nav-link px-3 py-2 ${activePage === 'compras' ? 'active' : ''}">
                            <i class="fas fa-shopping-bag me-1"></i> Mis Compras
                        </a>
                    </nav>
                </div>
                
                <!-- Usuario y menú mobile -->
                <div class="col-auto d-flex align-items-center gap-2">
                    <!-- Botón menú mobile -->
                    <button class="btn btn-outline-secondary d-md-none p-2" type="button" data-bs-toggle="collapse" data-bs-target="#clientMobileMenu" aria-expanded="false">
                        <i class="fas fa-bars fa-lg"></i>
                    </button>
                    
                    <!-- Usuario dropdown - Verde menta mejorado -->
                    <div class="dropdown">
                        <button class="btn-client-user dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                            <div class="user-avatar">
                                <i class="fas fa-user-circle fa-lg"></i>
                            </div>
                            <span class="user-name d-none d-lg-inline">${userName}</span>
                            <i class="fas fa-chevron-down small ms-1"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3">
                            <li class="px-3 py-2 bg-light rounded-top">
                                <div class="fw-semibold text-dark">${userName}</div>
                                <small class="text-muted">Cuenta de cliente</small>
                            </li>
                            <li><hr class="dropdown-divider my-1"></li>
                            <li><a class="dropdown-item py-2" href="/perfil"><i class="fas fa-user-edit me-2 text-muted"></i> Mi Perfil</a></li>
                            <li><hr class="dropdown-divider my-1"></li>
                            <li><a class="dropdown-item py-2 text-danger" href="#" onclick="event.preventDefault(); window.Router.logout()"><i class="fas fa-power-off me-2"></i> Cerrar Sesión</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Menú colapsable mobile -->
            <div class="collapse d-md-none" id="clientMobileMenu">
                <nav class="mobile-nav py-3 border-top">
                    <a href="/cliente" class="mobile-nav-link ${activePage === 'inicio' ? 'active' : ''}">
                        <i class="fas fa-home me-2"></i> Inicio
                    </a>
                    <a href="/cliente/tienda" class="mobile-nav-link ${activePage === 'tienda' ? 'active' : ''}">
                        <i class="fas fa-store me-2"></i> Tienda
                    </a>
                    <a href="/cliente/reservas" class="mobile-nav-link ${activePage === 'reservas' ? 'active' : ''}">
                        <i class="fas fa-calendar-check me-2"></i> Mis Reservas
                    </a>
                    <a href="/cliente/compras" class="mobile-nav-link ${activePage === 'compras' ? 'active' : ''}">
                        <i class="fas fa-shopping-bag me-2"></i> Mis Compras
                    </a>
                    <hr class="my-2">
                    <a href="/perfil" class="mobile-nav-link">
                        <i class="fas fa-user-edit me-2"></i> Mi Perfil
                    </a>
                </nav>
            </div>
        </div>
    </header>
    
    <!-- Main Content -->
    <main class="client-main py-4">
        <div class="container-fluid px-3 px-lg-4">
            <div id="clientContent">
                <!-- El contenido de la página se renderiza aquí -->
            </div>
        </div>
    </main>
    
    <!-- Footer -->
    <footer class="client-footer py-3 border-top bg-light">
        <div class="container-fluid px-3 px-lg-4">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start text-muted small mb-2 mb-md-0">
                    &copy; ${new Date().getFullYear()} PharmaQuick · Tu salud en línea
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <a href="/" class="text-muted small text-decoration-none">Volver al inicio</a>
                </div>
            </div>
        </div>
    </footer>
</div>

<style>
.client-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Header mejorado */
.client-header {
    min-height: 70px;
}

.client-logo {
    height: 50px;
    width: auto;
}

.client-brand-text {
    font-size: 1.25rem;
}

/* Navigation links */
.client-nav-link {
    color: #495057;
    font-weight: 500;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    text-decoration: none;
}

.client-nav-link:hover {
    color: #0d6efd;
    background-color: #f0f7ff;
}

.client-nav-link.active {
    color: #0d6efd;
    background-color: #e7f1ff;
}

/* Mobile menu */
.mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.mobile-nav-link {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    color: #495057;
    text-decoration: none;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.mobile-nav-link:hover {
    color: #0d6efd;
    background-color: #f8f9fa;
}

.mobile-nav-link.active {
    color: #0d6efd;
    background-color: #e7f1ff;
    font-weight: 500;
}

/* User dropdown mejorado */
.btn-client-user {
    background: linear-gradient(135deg, #b8e4d4 0%, #98d8c8 100%);
    border: 1px solid rgba(26, 92, 74, 0.2);
    color: #1a5c4a;
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(152, 216, 200, 0.3);
}

.btn-client-user:hover {
    background: linear-gradient(135deg, #a8dbc5 0%, #88d0ba 100%);
    border-color: rgba(26, 92, 74, 0.3);
    box-shadow: 0 4px 12px rgba(152, 216, 200, 0.4);
    transform: translateY(-1px);
}

.btn-client-user::after {
    margin-left: 0.25rem;
    vertical-align: middle;
}

.user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a5c4a;
}

.user-name {
    font-weight: 600;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Dropdown menu estilizado */
.btn-client-user + .dropdown-menu {
    margin-top: 0.5rem;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    overflow: hidden;
}

.btn-client-user + .dropdown-menu .dropdown-item {
    padding: 0.75rem 1.25rem;
    transition: all 0.2s ease;
    border-radius: 0;
}

.btn-client-user + .dropdown-menu .dropdown-item:hover {
    background-color: #f8f9fa;
    color: #1a5c4a;
}

.btn-client-user + .dropdown-menu .dropdown-item:first-child {
    background-color: #e8f5ef;
}

.btn-client-user + .dropdown-menu .dropdown-item.text-danger:hover {
    background-color: #ffeaea;
    color: #dc3545;
}

/* Main content */
.client-main {
    flex: 1;
}

/* Footer */
.client-footer {
    margin-top: auto;
}

/* Responsive adjustments */
@media (max-width: 767.98px) {
    .client-header {
        position: sticky;
        top: 0;
        z-index: 1000;
    }
}
</style>`;
    },

    setupEventListeners(container) {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(el => el.classList.remove('show'));
            }
        });
        
        // Initialize Bootstrap dropdowns
        if (typeof bootstrap !== 'undefined') {
            const dropdowns = container.querySelectorAll('.dropdown-toggle');
            dropdowns.forEach(dropdown => {
                new bootstrap.Dropdown(dropdown);
            });
        }
    },

    /**
     * Renderiza contenido dentro del layout
     */
    renderContent(html) {
        const content = document.getElementById('clientContent');
        if (content) {
            content.innerHTML = html;
        }
    }
};

window.ClientLayout = ClientLayout;