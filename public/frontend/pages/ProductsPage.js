/**
 * PharmaQuick - Products Page (Simplificado)
 * Página de productos para SPA con renderizado dinámico
 */

const ProductsPage = {
    /**
     * Inicializar página de productos
     */
    async init(container) {
        console.log('ProductsPage.init() llamado');
        
        // Verificar autenticación
        if (!Router.isAuthenticated()) {
            console.log('ProductsPage: No autenticado, redirigiendo a login');
            Router.navigate('/login');
            return;
        }
        
        // Renderizar layout básico primero
        this.renderBasicLayout(container);
        
        // Luego cargar datos
        await this.loadData();
    },
    
    /**
     * Renderizar layout básico
     */
    renderBasicLayout(container) {
        console.log('ProductsPage: Renderizando layout');
        
        container.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light fixed-top" style="z-index: 1030;">
                <div class="container-fluid">
                    <a class="navbar-brand" href="/dashboard">
                        <i class="bi bi-capsule"></i> PharmaQuick
                    </a>
                    <div class="d-flex">
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Cerrar Sesión</button>
                    </div>
                </div>
            </nav>
            
            <nav class="sidebar" id="sidebar" style="margin-top: 56px;">
                <ul class="nav flex-column">
                    <li class="nav-item">
                        <a class="nav-link" href="/dashboard">Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="/productos">Productos</a>
                    </li>
                </ul>
            </nav>
            
            <main class="main-content" id="mainContent" style="margin-top: 56px; padding: 20px;">
                <div class="container-fluid">
                    <h2>Productos</h2>
                    <div id="productsContainer">
                        <p>Cargando productos...</p>
                    </div>
                    <div id="productsTableContainer"></div>
                </div>
            </main>
        `;
        
        // Setup logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Router.logout();
            });
        }
    },
    
    /**
     * Cargar datos desde API
     */
    async loadData() {
        console.log('ProductsPage: Cargando datos...');
        
        const container = document.getElementById('productsContainer');
        if (!container) {
            console.error('ProductsPage: productsContainer no encontrado');
            return;
        }
        
        const token = AuthService.getToken();
        
        if (!token) {
            container.innerHTML = '<div class="alert alert-warning">No hay sesión. <a href="/login">Iniciar sesión</a></div>';
            return;
        }
        
        try {
            console.log('ProductsPage: Llamando API /api/productos');
            
            const response = await fetch('/api/productos', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            console.log('ProductsPage: Respuesta recibida', response.status);
            
            const data = await response.json();
            console.log('ProductsPage: Data', data);
            
            if (data.success) {
                this.renderProducts(data.data?.productos || []);
            } else {
                container.innerHTML = '<div class="alert alert-danger">Error: ' + (data.message || 'Desconocido') + '</div>';
            }
            
        } catch (error) {
            console.error('ProductsPage: Error', error);
            container.innerHTML = '<div class="alert alert-danger">Error de conexión: ' + error.message + '</div>';
        }
    },
    
    /**
     * Renderizar lista de productos
     */
    renderProducts(productos) {
        console.log('ProductsPage: Renderizando', productos.length, 'productos');
        
        const container = document.getElementById('productsContainer');
        const tableContainer = document.getElementById('productsTableContainer');
        
        if (!tableContainer) return;
        
        if (!productos || productos.length === 0) {
            tableContainer.innerHTML = '<div class="alert alert-info">No hay productos</div>';
            return;
        }
        
        const rows = productos.map(p => `
            <tr>
                <td>${p.id || p.producto_id || '-'}</td>
                <td>${p.nombre || '-'}</td>
                <td>${p.categoria || '-'}</td>
                <td>${p.codigo_barras || p.codigo || '-'}</td>
            </tr>
        `).join('');
        
        tableContainer.innerHTML = `
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Código</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <p class="text-muted">Total: ${productos.length} productos</p>
        `;
        
        container.innerHTML = '';
    }
};

// Exportar global
window.ProductsPage = ProductsPage;