/**
 * PharmaQuick - Client Layout (E-commerce style)
 * Layout simplificado para clientes sin sidebar administrativo
 */

const ClientLayout = {
    /**
     * Renderiza un layout tipo e-commerce para clientes
     */
    render(container, activePage = 'catalogo') {
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
    <!-- Header limpio - solo logo y usuario -->
    <header class="client-header bg-white shadow-sm border-bottom">
        <div class="container-fluid px-3 px-lg-4">
            <div class="row align-items-center py-2 py-md-3">
                <!-- Logo -->
                <div class="col-auto">
                    <a href="/cliente" class="d-flex align-items-center text-decoration-none">
                        <img src="/image/logo_pharmaQuick.png" alt="PharmaQuick" class="client-logo" height="50">
                    </a>
                </div>
                
                <!-- Espaciador vacío para mantener centrado -->
                <div class="col d-none d-md-block"></div>
                
                <!-- Usuario dropdown -->
                <div class="col-auto d-flex align-items-center gap-2">
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
                            <li><a class="dropdown-item py-2" href="/cliente/perfil"><i class="fas fa-user-edit me-2 text-muted"></i> Mi Perfil</a></li>
                            <li><hr class="dropdown-divider my-1"></li>
                            <li><a class="dropdown-item py-2 text-danger" href="#" onclick="event.preventDefault(); window.Router.logout()"><i class="fas fa-power-off me-2"></i> Cerrar Sesión</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </header>
    
    <!-- Main Content -->
    <main class="client-main py-4 pb-5">
        <div class="container-fluid px-3 px-lg-4">
            <div id="clientContent">
                <!-- El contenido de la página se renderiza aquí -->
            </div>
        </div>
    </main>
    
    <!-- Bottom Navigation - Fixed en la parte inferior -->
    <nav class="bottom-nav fixed-bottom">
        <div class="container-fluid px-2 px-lg-4">
            <div class="bottom-nav-inner" style="margin-bottom: 16px;">
                <a href="/cliente" class="bottom-nav-item ${activePage === 'inicio' ? 'active' : ''}">
                    <i class="fas fa-home bottom-nav-icon"></i>
                    <span class="bottom-nav-label">Inicio</span>
                </a>
                <a href="/cliente/catalogo" class="bottom-nav-item ${activePage === 'catalogo' ? 'active' : ''}">
                    <i class="fas fa-tags bottom-nav-icon"></i>
                    <span class="bottom-nav-label">Catálogo</span>
                </a>
                <!-- [DESHABILITADO] Link de Reservas - Deshabilitado por no utilizarse
                <a href="/cliente/reservas" class="bottom-nav-item ${activePage === 'reservas' ? 'active' : ''}">
                    <i class="fas fa-calendar-check bottom-nav-icon"></i>
                    <span class="bottom-nav-label">Reservas</span>
                </a>
                -->
                <a href="/cliente/compras" class="bottom-nav-item ${activePage === 'compras' ? 'active' : ''}">
                    <i class="fas fa-shopping-bag bottom-nav-icon"></i>
                    <span class="bottom-nav-label">Compras</span>
                </a>
            </div>
        </div>
    </nav>
</div>

<style>
.client-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Header limpio */
.client-header {
    min-height: 50px;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
}

.client-logo {
    height: 40px;
    width: auto;
}

.client-brand-text {
    font-size: 1.25rem;
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
    padding-bottom: 60px !important;
}

/* Bottom Navigation - Fixed en la parte inferior */
.bottom-nav {
    background: transparent;
    padding: 0.5rem 0;
}

.bottom-nav-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 16px;
    padding: 0.35rem 0.5rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    margin-bottom: 10px;
}

.bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.3rem 0.5rem;
    color: #6c757d;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;
    min-width: 50px;
}

.bottom-nav-item:hover {
    color: #0d6efd;
    background-color: rgba(13, 110, 253, 0.15);
}

.bottom-nav-item.active {
    color: #0d6efd;
    background-color: rgba(13, 110, 253, 0.2);
}

.bottom-nav-item.active .bottom-nav-icon {
    transform: scale(1.1);
}

.bottom-nav-icon {
    font-size: 1rem;
    margin-bottom: 1px;
    transition: transform 0.2s ease;
}

.bottom-nav-label {
    font-size: 0.6rem;
    font-weight: 500;
}

/* Responsive adjustments */
@media (min-width: 768px) {
    .bottom-nav-inner {
        max-width: 450px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .bottom-nav-item {
        padding: 0.3rem 0.6rem;
        min-width: 45px;
    }
    
    .bottom-nav-icon {
        font-size: 0.9rem;
    }
    
    .bottom-nav-label {
        font-size: 0.55rem;
    }
}

@media (max-width: 767.98px) {
    .client-header {
        position: sticky;
        top: 0;
        z-index: 1000;
    }
    
    .bottom-nav {
        margin-left: 0;
        margin-right: 0;
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