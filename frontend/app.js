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
    '/frontend/modules/prices/PriceView.js'
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
        if (typeof authService !== 'undefined' && !authService.isAuthenticated()) {
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
        
        // Inicializar UI Global (Sidebar, etc)
        initGlobalUI();
        
        console.log('PharmaQuick Frontend initialized');
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

/**
 * Inicializa elementos globales de la interfaz
 */
function initGlobalUI() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-collapsed');
            
            // Guardar preferencia
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
        
        // Restaurar estado previo
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
        }
    }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}