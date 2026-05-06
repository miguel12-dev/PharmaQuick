/**
 * PharmaQuick - Router SPA
 * Sistema de rutas con History API, autenticación y renderizado dinámico
 */

class Router {
    static routes = {};
    static currentRoute = null;
    static rootElem = null;
    static isInitialized = false;
    
    /**
     * Configurar rutas
     * @param {Object} routes - Objeto de rutas {path: PageClass}
     */
    static configure(routes) {
        this.routes = routes;
    }
    
    /**
     * Inicializar el router
     * @param {String} rootElement - Selector del elemento raíz
     */
    static init(rootElement = '#app') {
        this.rootElem = document.querySelector(rootElement);
        
        if (!this.rootElem) {
            console.error('Router: Elemento raíz no encontrado:', rootElement);
            return;
        }
        
        // Configurar event listeners
        window.addEventListener('popstate', () => this.handlePopState());
        
        // Interceptar clicks en enlaces
        document.addEventListener('click', (e) => this.handleLinkClick(e));
        
        this.isInitialized = true;
        
        // Navegar a la URL actual
        this.navigateTo(window.location.pathname, false);
    }
    
    /**
     * Navegar a una ruta
     * @param {String} path - Ruta destino
     * @param {Boolean} pushState - Si true, agrega al historial
     */
    static navigate(path, pushState = true) {
        // Normalizar ruta
        path = this.normalizePath(path);
        
        // Verificar autenticación para rutas protegidas
        if (!this.isPublicRoute(path) && !this.isAuthenticated()) {
            this.redirectToLogin();
            return;
        }
        
        // Navegar
        if (pushState) {
            window.history.pushState({ path }, '', path);
        }
        
        this.navigateTo(path, pushState);
    }
    
    /**
     * Navegar internamente sin pushState
     */
    static navigateTo(path, pushState = true) {
        path = this.normalizePath(path);

        // Misma regla que navigate(): rutas protegidas sin sesión → login
        if (!this.isPublicRoute(path) && !this.isAuthenticated()) {
            this.redirectToLogin();
            return;
        }
        
        // Buscar route coincidente
        const route = this.findRoute(path);
        
        if (!route) {
            this.render404();
            return;
        }
        
        this.currentRoute = { path, route: route };
        
        // Renderizar página
        this.renderPage(route);
        
        // Actualizar UI
        this.updateActiveLinks(path);
    }
    
    /**
     * Handle popstate (botón atrás/adelante)
     */
    static handlePopState(e) {
        const path = window.location.pathname;
        this.navigateTo(path, false);
    }
    
    /**
     * Handle clicks en enlaces
     */
    static handleLinkClick(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) {
            return;
        }
        
        // Es ruta interna
        if (href !== window.location.pathname) {
            e.preventDefault();
            this.navigate(href);
        }
    }
    
    /**
     * Renderizar página
     */
    static async renderPage(route) {
        if (!this.rootElem) return;
        
        // Limpiar contenedor
        this.rootElem.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
        
        try {
            // Llamar al método init de la página
            if (route.init) {
                await route.init(this.rootElem);
            }
        } catch (error) {
            console.error('Error renderizando página:', error);
            this.rootElem.innerHTML = `<div class="alert alert-danger m-3" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error al cargar la página: ${error.message}
            </div>`;
        }
    }
    
    /**
     * Renderizar 404
     */
    static render404() {
        if (!this.rootElem) return;
        
        const NotFoundPage = this.routes['/404'];
        if (NotFoundPage) {
            this.renderPage(NotFoundPage);
        } else {
            // Fallback 404 básico
            this.rootElem.innerHTML = `
                <div class="container-fluid p-4">
                    <div class="text-center py-5">
                        <i class="bi bi-exclamation-circle text-warning" style="font-size: 4rem;"></i>
                        <h2 class="mt-3">Página no encontrada</h2>
                        <p class="text-muted">La página que buscas no existe.</p>
                        <a href="/dashboard" class="btn btn-primary mt-3">Volver al Dashboard</a>
                    </div>
                </div>
            `;
        }
        
        this.currentRoute = { path: window.location.pathname, route: null };
    }
    
    /**
     * Encontrar ruta coincidente
     */
    static findRoute(path) {
        // Match exacto
        if (this.routes[path]) {
            return this.routes[path];
        }
        
        // Buscar rutas con wildcards
        for (const [routePath, route] of Object.entries(this.routes)) {
            if (routePath.includes(':')) {
                const regex = new RegExp('^' + routePath.replace(/:(\w+)/g, '([^/]+)') + '$');
                if (regex.test(path)) {
                    return route;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Normalizar ruta
     */
    static normalizePath(path) {
        if (!path || path === '') return '/';
        if (path === '/index.html' || path === 'index.html') return '/';
        // Rutas relativas desde enlaces (ej. "login") → absolutas
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        if (path.endsWith('/') && path !== '/') return path.slice(0, -1);
        return path;
    }
    
    /**
     * Verificar si es ruta pública
     */
    static isPublicRoute(path) {
        const publicRoutes = ['/', '/login', '/tienda', '/404', '/500', '/403'];
        return publicRoutes.includes(path);
    }
    
    /**
     * Verificar autenticación
     */
    static isAuthenticated() {
        try {
            const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
            return !!(session.token && session.farmaciaId);
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Redireccionar a login
     */
    static redirectToLogin() {
        const currentPath = window.location.pathname;
        window.history.replaceState({ path: '/login' }, '', '/login');
        this.navigateTo('/login', false);
    }
    
    /**
     * Cerrar sesión y redirigir a login
     */
    static logout() {
        localStorage.removeItem('pharmaSession');
        this.redirectToLogin();
    }
    
    /**
     * Actualizar enlaces activos
     */
    static updateActiveLinks(path) {
        document.querySelectorAll('.sidebar .nav-link, .navbar .nav-link').forEach(link => {
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            if (href && this.normalizePath(href) === path) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * Obtener ruta actual
     */
    static getCurrentPath() {
        return window.location.pathname;
    }
    
    /**
     * Obtener params de la ruta actual
     */
    static getParams() {
        if (!this.currentRoute?.route) return {};
        
        const path = this.getCurrentPath();
        const routePath = Object.keys(this.routes).find(r => r.includes(':'));
        
        if (!routePath) return {};
        
        const regex = new RegExp('^' + routePath.replace(/:(\w+)/g, '([^/]+)') + '$');
        const match = path.match(regex);
        
        if (!match) return {};
        
        const params = {};
        const paramNames = routePath.match(/:(\w+)/g)?.map(p => p.slice(1)) || [];
        
        paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
        });
        
        return params;
    }
}

// Exportar global
window.Router = Router;
window.router = Router;