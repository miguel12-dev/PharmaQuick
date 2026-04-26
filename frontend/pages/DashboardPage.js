/**
 * PharmaQuick - Dashboard Page Initialization
 * Handles dashboard page initialization and data loading
 * 
 * RESPONSIBILITIES:
 * - Check authentication
 * - Set active navigation
 * - Load dashboard statistics
 */

const DashboardPage = {
    /**
     * Initialize dashboard page
     */
    init() {
        this.checkAuth();
        this.setActiveNav();
        this.loadStats();
    },

    /**
     * Verify user is authenticated
     */
    checkAuth() {
        const session = this.getSession();
        if (!session.token || !session.farmaciaId) {
            window.location.href = '/login';
            return false;
        }
        return true;
    },

    /**
     * Get current session
     */
    getSession() {
        try {
            return JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        } catch (e) {
            return {};
        }
    },

    /**
     * Set active navigation link
     */
    setActiveNav() {
        const page = 'dashboard';
        const links = document.querySelectorAll('.sidebar .nav-link');
        
        links.forEach(link => {
            link.classList.remove('active');
            const href = link.dataset.page;
            if (href === page) {
                link.classList.add('active');
            }
        });
    },

    /**
     * Load dashboard statistics
     */
    async loadStats() {
        const session = this.getSession();
        
        if (!session.token) {
            this.updateProductCount(0);
            return;
        }

        try {
            const response = await fetch('/api/productos', {
                headers: {
                    'Authorization': 'Bearer ' + session.token
                }
            });

            const data = await response.json();

            if (data.success) {
                this.updateProductCount(data.data?.total || 0);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.updateProductCount(0);
        }
    },

    /**
     * Update product count display
     */
    updateProductCount(count) {
        const el = document.getElementById('productos');
        if (el) {
            el.textContent = count;
        }
    }
};

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    DashboardPage.init();
});