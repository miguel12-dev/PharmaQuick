/**
 * PharmaQuick - App Entry Point
 * Carga todos los módulos del frontend
 */

// Cargar estilos
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = '/frontend/styles/app.css';
document.head.appendChild(styleLink);

// Cargar dependencias (core primero)
const coreFiles = [
    '/frontend/core/config/env.js',
    '/frontend/core/auth/AuthService.js',
    '/frontend/core/api/HttpClient.js'
];

const componentFiles = [
    '/frontend/components/Table.js',
    '/frontend/components/Modal.js',
    '/frontend/components/Input.js',
    '/frontend/components/Button.js',
    '/frontend/components/Toast.js'
];

const moduleFiles = [
    '/frontend/modules/products/ProductService.js',
    '/frontend/modules/products/ProductController.js',
    '/frontend/modules/products/ProductView.js',
    '/frontend/modules/prices/PriceService.js',
    '/frontend/modules/prices/PriceController.js',
    '/frontend/modules/prices/PriceView.js',
    '/frontend/modules/shopping/ShoppingService.js',
    '/frontend/modules/shopping/CartService.js'
];

const pageFiles = [
    '/frontend/pages/ProductsPage.js'
];

// Cargar script dinámicamente
async function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Cargar todos los scripts
async function initApp() {
    try {
        // Cargar core
        for (const file of coreFiles) {
            await loadScript(file);
        }
        
        // Verificar autenticación
        if (!authService.isAuthenticated()) {
            const currentPath = window.location.pathname;
            if (!currentPath.includes('login')) {
                authService.redirectToLogin();
            }
            return;
        }
        
        // Cargar componentes
        for (const file of componentFiles) {
            await loadScript(file);
        }
        
        // Cargar módulos
        for (const file of moduleFiles) {
            await loadScript(file);
        }
        
        // Cargar páginas
        for (const file of pageFiles) {
            await loadScript(file);
        }
        
        console.log('PharmaQuick Frontend initialized');
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}