/**
 * PharmaQuick - Client Dashboard Page
 * Dashboard simplificado tipo e-commerce para clientes
 */

const ClientDashboardPage = {
    async init(container) {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        
        // Verificar que es cliente
        if (session.rol !== 'CLIENTE') {
            Router.navigate('/dashboard');
            return;
        }

        ClientLayout.render(container, 'inicio');
        await this.loadDashboard();
    },

    async loadDashboard() {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        const content = document.getElementById('clientContent');
        
        // Extraer nombre (antes del @ si es email)
        let userName = session.userName || session.email || 'Cliente';
        if (userName.includes('@')) {
            userName = userName.split('@')[0];
        }
        
        // [DESHABILITADO] Cargar reservas - Deshabilitado por no utilizarse
        // try {
        //     const [reservasData] = await Promise.all([
        //         this.getMisReservas()
        //     ]);
        //     
        //     const reservasActivas = reservasData.filter(r => r.estado === 'ACTIVA').length;
        //     const reservasTotal = reservasData.length;
        //     
        //     content.innerHTML = this.getDashboardHtml({
        //         userName: userName,
        //         reservasActivas,
        //         reservasTotal
        //     });
        //     
        //     this.setupEventListeners();
        // } catch (error) {
        //     console.error('Error cargando dashboard:', error);
        //     content.innerHTML = this.getDashboardHtml({
        //         userName: userName,
        //         reservasActivas: 0,
        //         reservasTotal: 0
        //     });
        // }
        
        // Render dashboard sin datos de reservas
        content.innerHTML = this.getDashboardHtml({
            userName: userName,
            reservasActivas: 0,
            reservasTotal: 0
        });
        
        this.setupEventListeners();
    },

    getDashboardHtml(data) {
        return `
<div class="row g-4">
    
    <!-- Cards de acciones rápidas -->
    <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center">
                <div class="client-action-icon mb-3">
                    <i class="fas fa-store fa-2x text-primary"></i>
                </div>
                <h5 class="card-title">Explorar Productos</h5>
                <p class="card-text text-muted small">Ver el catálogo de medicamentos y productos disponibles</p>
                <a href="/cliente/tienda" class="btn btn-primary">
                    <i class="fas fa-arrow-right me-2"></i> Ir a la Tienda
                </a>
            </div>
        </div>
    </div>
    
    <!-- [DESHABILITADO] Sección de Reservas - Deshabilitado por no utilizarse
    <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center">
                <div class="client-action-icon mb-3">
                    <i class="fas fa-calendar-check fa-2x text-success"></i>
                </div>
                <h5 class="card-title">Mis Reservas</h5>
                <p class="card-text text-muted small">Tienes ${data.reservasActivas} reservas activas de ${data.reservasTotal} total</p>
                <a href="/cliente/reservas" class="btn btn-outline-success">
                    <i class="fas fa-arrow-right me-2"></i> Ver Mis Reservas
                </a>
            </div>
        </div>
    </div>
    -->
    
    <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center">
                <div class="client-action-icon mb-3">
                    <i class="fas fa-user-edit fa-2x text-info"></i>
                </div>
                <h5 class="card-title">Mi Perfil</h5>
                <p class="card-text text-muted small">Actualiza tus datos personales y contraseña</p>
                <a href="/cliente/perfil" class="btn btn-outline-info">
                    <i class="fas fa-arrow-right me-2"></i> Editar Perfil
                </a>
            </div>
        </div>
    </div>
    
    <!-- Sección de productos populares -->
    <div class="col-12 mt-4">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="fas fa-star text-warning me-2"></i> Productos Destacados</h5>
            </div>
            <div class="card-body">
                <div id="featuredProducts" class="row g-3">
                    <div class="col-12 text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer bg-white text-center">
                <a href="/cliente/tienda" class="btn btn-link">Ver todos los productos <i class="fas fa-arrow-right"></i></a>
            </div>
        </div>
    </div>
</div>

<style>
.client-action-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #f8f9fa;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
</style>`;
    },

    setupEventListeners() {
        this.loadFeaturedProducts();
    },

    async loadFeaturedProducts() {
        const container = document.getElementById('featuredProducts');
        if (!container) return;

        try {
            // Cargar productos destacados del catálogo público
            const products = await window.publicCatalogService.getCatalog('', 4);
            
            if (!products || products.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted">No hay productos disponibles</div>';
                return;
            }

            container.innerHTML = products.map(p => `
                <div class="col-md-3 col-sm-6">
                    <div class="card h-100 border">
                        <div class="card-body">
                            <h6 class="card-title">${p.nombre}</h6>
                            <p class="card-text small text-muted">${p.categoria || 'Medicamento'}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-bold text-primary">$${parseFloat(p.precio_activo || 0).toLocaleString()}</span>
                                <button class="btn btn-sm btn-outline-primary" onclick="window.ClientStorePage.addToCart(${p.id})">
                                    <i class="fas fa-cart-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading featured products:', error);
            container.innerHTML = '<div class="col-12 text-center text-danger">Error al cargar productos</div>';
        }
    },

    // [DESHABILITADO] Función getMisReservas - Deshabilitado por no utilizarse
    // async getMisReservas() {
    //     const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
    //     const httpClient = window.httpClient || window.HttpClient;
    //     
    //     if (!httpClient) return [];
    //     
    //     try {
    //         const data = await httpClient.get('/reservas/mis-reservas');
    //         return data.data || [];
    //     } catch (error) {
    //         console.error('Error fetching reservas:', error);
    //         return [];
    //     }
    // }
};

window.ClientDashboardPage = ClientDashboardPage;

// Helper global para navegar a tienda
window.goToStore = function(tab = 'comprar') {
    Router.navigate(`/cliente/tienda?tab=${tab}`);
};