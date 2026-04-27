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
    
    // Colors - PharmaGreen Mint Premium
    COLORS: {
        primary: '#10b981',      // Verde menta premium
        primaryDark: '#059669',
        primaryLight: '#34d399',
        secondary: '#0f172a',    // Azul marino oscuro
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#0ea5e9',
        text: '#475569',
        textDark: '#1e293b',
        background: '#ffffff',
        surface: '#f8fafc',
        border: '#e2e8f0'
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