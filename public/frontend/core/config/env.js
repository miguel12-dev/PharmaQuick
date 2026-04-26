/**
 * PharmaQuick - Config
 * Configuración global de la aplicación
 */

const Config = {
    // API
    API_BASE: '/api',
    API_VERSION: 'v1',
    
    // UI
    ANIMATION_DURATION: 250, // ms
    DEBOUNCE_DELAY: 300, // ms
    TOAST_DURATION: 3000, // ms
    
    // Colors - Verde menta como color principal
    COLORS: {
        primary: '#2dd4bf',      // Verde menta
        primaryDark: '#14b8a6',
        primaryLight: '#5eead4',
        secondary: '#60a5fa',    // Azul suave alternativo
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        text: '#6b7280',
        textDark: '#374151',
        background: '#ffffff',
        surface: '#f9fafb',
        border: '#e5e7eb'
    },
    
    // Breakpoints
    BREAKPOINTS: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280
    },
    
    // Pagination
    DEFAULT_PAGE_SIZE: 25,
    
    // Messages
    MESSAGES: {
        genericError: 'Error de conexión. Intente de nuevo.',
        noData: 'No hay datos disponibles',
        loading: 'Cargando...',
        saving: 'Guardando...',
        confirmDelete: '¿Está seguro de eliminar este elemento?',
        successSave: 'Guardado correctamente',
        errorSave: 'Error al guardar'
    }
};

// Exportar global
const config = Config;