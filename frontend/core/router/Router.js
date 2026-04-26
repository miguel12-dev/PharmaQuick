/**
 * PharmaQuick - Router
 * Simple client-side routing system
 */

class Router {
    static routes = {};
    static currentRoute = null;
    
    /**
     * Configure routes
     */
    static configure(routes) {
        this.routes = routes;
    }
    
    /**
     * Navigate to a path
     */
    static navigate(path, replace = false) {
        if (replace) {
            window.location.replace(path);
        } else {
            window.location.href = path;
        }
    }
    
    /**
     * Get current path
     */
    static getCurrentPath() {
        return window.location.pathname;
    }
    
    /**
     * Get current path without trailing slash
     */
    static getCleanPath() {
        let path = this.getCurrentPath();
        
        // Remove trailing slash (except for root)
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        return path;
    }
    
    /**
     * Check if current path matches
     */
    static is(path) {
        return this.getCleanPath() === path;
    }
    
    /**
     * Get route parameters from path
     */
    static getParams(path, routePattern) {
        // Convert route pattern to regex
        const regex = new RegExp(
            '^' + routePattern.replace(/:(\w+)/g, '([^/]+)') + '$'
        );
        
        const match = path.match(regex);
        
        if (!match) return null;
        
        const params = {};
        const paramNames = (routePattern.match(/:(\w+)/g) || []).map(p => p.slice(1));
        
        paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
        });
        
        return params;
    }
}

// Create global instance
const router = Router;