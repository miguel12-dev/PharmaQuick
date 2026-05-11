/**
 * PharmaQuick - Dashboard Page
 * Página de dashboard para SPA con renderizado dinámico y estética premium.
 */

const DashboardPage = {
    /**
     * Inicializar página de dashboard
     */
    async init(container) {
        // Verificar autenticación
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }

        // Cargar CSS específico si no está cargado
        this.loadStyles();
        
        // Renderizar layout base
        this.renderLayout(container);
        
        // Inicializar interactividad del layout
        this.initLayout();
        
        // Cargar y mostrar datos reales
        await this.refreshData();
    },

    /**
     * Cargar estilos dinámicamente
     */
    loadStyles() {
        if (!document.getElementById('dashboard-styles')) {
            const link = document.createElement('link');
            link.id = 'dashboard-styles';
            link.rel = 'stylesheet';
            link.href = 'frontend/styles/dashboard.css';
            document.head.appendChild(link);
        }
    },
    
    /**
     * Renderizar layout
     */
    renderLayout(container) {
        // Usar LayoutHelper para renderizar el layout base e inicializar el sidebar
        LayoutHelper.render(container, 'dashboard');
        
        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = this.getSkeletonHtml();
        }
    },

    /**
     * Skeleton loader para el dashboard
     */
    getSkeletonHtml() {
        return `
            <div class="dashboard-container">
                <div class="welcome-header">
                    <h1 class="placeholder-glow"><span class="placeholder col-4"></span></h1>
                    <p class="placeholder-glow"><span class="placeholder col-6"></span></p>
                </div>
                <div class="stats-grid">
                    ${Array(4).fill('<div class="stat-card placeholder" style="height: 140px"></div>').join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Obtener el contenido completo del dashboard con los datos
     */
    renderDashboardContent(data) {
        const container = document.querySelector('.page-content');
        if (!container) return;

        const stats = data.stats || { ventas_hoy: 0, transacciones_hoy: 0, productos_stock: 0, alertas_stock: 0 };
        const session = AuthService.getSession();
        const userName = session ? (session.nombre || session.usuario) : 'Administrador';

        container.innerHTML = `
            <div class="dashboard-container">
                <div class="welcome-header">
                    <h1>Hola, ${userName} 👋</h1>
                    <p class="text-muted">Esto es lo que está pasando hoy en tu farmacia.</p>
                </div>

                <div class="quick-actions">
                    <a href="/ventas" class="action-btn">
                        <i class="bi bi-cart-plus"></i> Nueva Venta
                    </a>
                    <a href="/productos" class="action-btn secondary">
                        <i class="bi bi-plus-circle"></i> Agregar Producto
                    </a>
                    <a href="/inventario" class="action-btn secondary">
                        <i class="bi bi-box-seam"></i> Ver Inventario
                    </a>
                </div>

                <div class="stats-grid">
                    <div class="stat-card primary">
                        <div class="stat-icon"><i class="bi bi-currency-dollar"></i></div>
                        <div class="stat-value" id="val-ventas">$${this.formatCurrency(stats.ventas_hoy)}</div>
                        <div class="stat-label">Ventas de Hoy</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-icon"><i class="bi bi-receipt"></i></div>
                        <div class="stat-value" id="val-trans">${stats.transacciones_hoy}</div>
                        <div class="stat-label">Transacciones</div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-icon"><i class="bi bi-box-seam"></i></div>
                        <div class="stat-value" id="val-prod">${stats.productos_stock}</div>
                        <div class="stat-label">Productos en Stock</div>
                    </div>
                    <div class="stat-card danger">
                        <div class="stat-icon"><i class="bi bi-exclamation-triangle"></i></div>
                        <div class="stat-value" id="val-alert">${stats.alertas_stock}</div>
                        <div class="stat-label">Alertas de Stock</div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <div class="panel-card">
                        <div class="panel-header">
                            <h3>Tendencia de Ventas (7 días)</h3>
                        </div>
                        <div class="chart-container">
                            ${this.renderChart(data.sales_trend || [])}
                        </div>
                    </div>

                    <div class="panel-card">
                        <div class="panel-header">
                            <h3>Ventas Recientes</h3>
                        </div>
                        <div class="activity-list">
                            ${this.renderRecentSales(data.recent_sales || [])}
                        </div>
                        <div class="mt-4 text-center">
                            <a href="/mis-ventas" class="text-primary text-decoration-none fw-bold" style="font-size: 0.8rem">
                                Ver todo el historial <i class="bi bi-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <div class="panel-card mt-4">
                    <div class="panel-header">
                        <h3>Productos más vendidos</h3>
                    </div>
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Unidades</th>
                                    <th>Total Generado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderTopProducts(data.top_products || [])}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Trigger animations
        this.animateCounters();
    },

    /**
     * Renderiza las barras del gráfico (Vanilla CSS/SVG style)
     */
    renderChart(trend) {
        if (!trend || trend.length === 0) {
            return '<div class="text-center w-100 py-5 text-muted">No hay datos suficientes</div>';
        }

        const max = Math.max(...trend.map(t => parseFloat(t.total)), 1);
        
        return trend.map(t => {
            const percentage = (parseFloat(t.total) / max) * 100;
            const date = new Date(t.fecha);
            const label = date.toLocaleDateString('es-ES', { weekday: 'short' });
            
            return `
                <div class="chart-bar-wrapper">
                    <div class="chart-bar" style="height: ${percentage}%" title="$${t.total}"></div>
                    <div class="chart-label">${label}</div>
                </div>
            `;
        }).join('');
    },

    /**
     * Renderiza la lista de ventas recientes
     */
    renderRecentSales(sales) {
        if (sales.length === 0) return '<p class="text-muted text-center py-3">No hay ventas registradas</p>';

        return sales.map(sale => `
            <div class="activity-item">
                <div class="activity-dot status-success"></div>
                <div class="activity-content">
                    <div class="d-flex justify-content-between">
                        <span class="activity-title">Venta #${sale.id}</span>
                        <span class="fw-bold">$${this.formatCurrency(sale.total)}</span>
                    </div>
                    <div class="activity-time">${sale.cliente_nombre || 'Consumidor Final'} • ${this.formatTime(sale.creado_en)}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Renderiza la tabla de productos top
     */
    renderTopProducts(products) {
        if (products.length === 0) return '<tr><td colspan="4" class="text-center py-4">No hay datos</td></tr>';

        return products.map(p => `
            <tr>
                <td class="fw-bold">${p.nombre}</td>
                <td><span class="badge bg-light text-dark">${p.categoria || 'Sin categoría'}</span></td>
                <td class="text-center">${this.formatQuantity(p.total_vendido)}</td>
                <td class="fw-bold text-success">$${this.formatCurrency(p.revenue)}</td>
            </tr>
        `).join('');
    },

    /**
     * Cargar datos desde la API
     */
    async refreshData() {
        const token = AuthService.getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/dashboard', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const result = await response.json();

            if (result.success) {
                this.renderDashboardContent(result.data);
            } else {
                console.error('Error en API:', result.message);
                // Si falla el token, redirigir
                if (response.status === 401) {
                    Router.logout();
                }
            }
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
        }
    },

    /**
     * Utilidad: Formatear moneda
     */
    formatCurrency(value) {
        return parseFloat(value).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },

    /**
     * Utilidad: Formatear cantidad (eliminar decimales innecesarios)
     */
    formatQuantity(value) {
        const num = parseFloat(value);
        return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, "");
    },

    /**
     * Utilidad: Formatear hora relativa o corta
     */
    formatTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    },

    /**
     * Inicializar interactividad del layout
     */
    initLayout() {
        // LayoutHelper ya inicializa el sidebar y los botones básicos.
        // Aquí agregamos comportamientos específicos del dashboard si es necesario.
    },

    /**
     * Cargar info del usuario en el navbar
     */
    loadUserInfo() {
        const session = AuthService.getSession();
        const userNameEl = document.getElementById('userName');
        if (userNameEl && session) {
            userNameEl.textContent = session.nombre || session.usuario || 'Usuario';
        }
    },

    /**
     * Animación de contadores
     */
    animateCounters() {
        // Implementación simple de animación de números si se desea
    }
};

// Exportar
window.DashboardPage = DashboardPage;
