/**
 * PharmaQuick - App
 * Inicializador principal de la aplicación SPA
 */

(function() {
    'use strict';
    
    /**
     * Configuración de rutas
     */
    const routes = {
        '/': HomePage,
        '/login': LoginPage,
        '/register': RegisterPage,
        '/tienda': PublicStorePage,
        
        // Rutas administrativas (para ADMIN, FARMACEUTICO, AUXILIAR)
        '/dashboard': DashboardPage,
        '/productos': ProductsPage,
        '/inventario': InventoryPage,
        '/ventas': SalesPage,
        // [DESHABILITADO] '/reservas': ReservationsPage,
        
        // Rutas de cliente (CLIENTE)
        // [ELIMINADO] '/cliente': ClientDashboardPage, -- Ya no es ruta predeterminada
        // [ELIMINADO] '/cliente/tienda': ClientCatalogPage, -- Unificado con catálogo
        '/cliente/catalogo': ClientCatalogPage,
        // [DESHABILITADO] '/cliente/reservas': ClientReservationsPage,
        '/cliente/perfil': ClientProfilePage,
        '/cliente/compras': ClientShoppingPage,  // Página de historial de compras (solo lectura)
        '/cliente/carrito': ClientCartPage,  // Página de carrito y checkout
        
        '/perfil': ProfilePage,
        '/404': NotFoundPage
    };
    
    /**
     * Obtener el rol del usuario desde la sesión
     */
    function getUserRol() {
        try {
            const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
            return session.rol || 'USUARIO';
        } catch (e) {
            return 'USUARIO';
        }
    }
    
    /**
     * Verificar si la ruta es para clientes
     */
    function isClientRoute(path) {
        return path.startsWith('/cliente');
    }
    
    /**
     * Redirigir según el rol del usuario
     */
    function redirectByRole(path) {
        const rol = getUserRol();
        
        // Si es cliente e intenta acceder a rutas de admin, redirigir
        if (rol === 'CLIENTE') {
            if (path === '/dashboard' || path === '/ventas' || /* [DESHABILITADO] path === '/reservas' || */
                path === '/productos' || path === '/inventario' || path === '/perfil') {
                Router.navigate('/cliente');
                return true;
            }
        }
        
        // Si es admin y accede a rutas de cliente, redirigir
        if (rol !== 'CLIENTE' && isClientRoute(path)) {
            Router.navigate('/dashboard');
            return true;
        }
        
        // Redirigir /mi-cuenta a /cliente/catalogo para clientes
        if (rol === 'CLIENTE' && path.startsWith('/mi-cuenta')) {
            Router.navigate('/cliente/catalogo');
            return true;
        }
        
        // Si cliente accede a /cliente sin subruta, redirigir a catálogo
        if (rol === 'CLIENTE' && path === '/cliente') {
            Router.navigate('/cliente/catalogo');
            return true;
        }
        
        // Si cliente accede a /cliente/tienda (ruta antigua), redirigir a catálogo
        if (rol === 'CLIENTE' && path === '/cliente/tienda') {
            Router.navigate('/cliente/catalogo');
            return true;
        }
        
        return false;
    }
    
    /**
     * Inicializar aplicación
     */
    function init() {
        // Verificar si existe el contenedor SPA
        const appContainer = document.getElementById('app');
        if (!appContainer) {
            console.error('App: Contenedor #app no encontrado');
            return;
        }
        
        // Sobrescribir método navigate para agregar verificación de rol
        const originalNavigate = Router.navigate;
        Router.navigate = function(path, pushState = true) {
            if (redirectByRole(path)) {
                return;
            }
            originalNavigate.call(Router, path, pushState);
        };
        
        const originalNavigateTo = Router.navigateTo;
        Router.navigateTo = function(path, pushState = true) {
            if (redirectByRole(path)) {
                return;
            }
            originalNavigateTo.call(Router, path, pushState);
        };
        
        // Configurar y inicializar router
        Router.configure(routes);
        Router.init('#app');
        
        console.log('PharmaQuick SPA inicializado');
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
