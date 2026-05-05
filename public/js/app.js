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
        '/': LoginPage,
        '/login': LoginPage,
        '/dashboard': DashboardPage,
        '/productos': ProductsPage,
        '/inventario': InventoryPage,
        '/perfil': ProfilePage,
        '/404': NotFoundPage
    };
    
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
