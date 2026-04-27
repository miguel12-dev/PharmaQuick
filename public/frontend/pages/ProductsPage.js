/**
 * PharmaQuick - Products Page (Mejorado)
 * Página de productos con cards, paginación y búsqueda
 */

const ProductsPage = {
    // Estado
    productos: [],
    productosFiltrados: [],
    paginaActual: 1,
    productosPorPagina: 12,
    cargando: false,
    
    // Categorías únicas
    categorias: [],
    categoriaSeleccionada: null,
    busqueda: '',
    
    /**
     * Inicializar página de productos
     */
    async init(container) {
        console.log('ProductsPage.init() llamado');
        
        // Verificar autenticación
        if (!Router.isAuthenticated()) {
            Router.navigate('/login');
            return;
        }
        
        // Renderizar layout
        this.renderLayout(container);
        
        // Cargar datos
        await this.loadData();
    },
    
    /**
     * Renderizar layout completo
     */
    renderLayout(container) {
        const template = document.getElementById('template-layout');
        
        if (template) {
            container.innerHTML = template.innerHTML;
        } else {
            // Fallback (pero deberíamos usar el template)
            container.innerHTML = `
                <div class="main-content" id="mainContent">
                    <div class="container-fluid py-4">
                        <div class="page-content"></div>
                    </div>
                </div>
            `;
        }
        
        // Insertar contenido de productos
        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 class="fw-bold mb-0 text-dark"><i class="fas fa-pills me-2 text-primary"></i> Catálogo de Productos</h2>
                        <p class="text-muted small mb-0">Gestiona el inventario y stock de tu farmacia</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary d-flex align-items-center gap-2" id="newProductBtn">
                            <i class="fas fa-plus"></i> <span class="d-none d-md-inline">Nuevo Producto</span>
                        </button>
                    </div>
                </div>
                
                <!-- Buscador y Filtros -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body p-3">
                        <div class="row g-3">
                            <div class="col-md-5">
                                <div class="input-group">
                                    <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span>
                                    <input type="text" class="form-control border-start-0" id="searchInput" placeholder="Buscar por nombre, código o categoría...">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <select class="form-select" id="categoriaFilter">
                                    <option value="">Todas las categorías</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <div class="d-flex align-items-center gap-2">
                                    <span class="text-muted small flex-shrink-0">Mostrar:</span>
                                    <select class="form-select" id="perPageSelect">
                                        <option value="12" selected>12</option>
                                        <option value="24">24</option>
                                        <option value="48">48</option>
                                    </select>
                                    <span class="badge bg-primary-soft text-primary p-2 ms-auto" id="totalProductos">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Grid de Productos -->
                <div id="productsGrid" class="product-grid row g-4">
                    <div class="col-12 text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2 text-muted">Cargando productos...</p>
                    </div>
                </div>
                
                <!-- Paginación -->
                <div id="paginationNav" class="mt-5 d-none">
                    <nav>
                        <ul class="pagination justify-content-center" id="pagination"></ul>
                    </nav>
                </div>
            `;
        }

        // Configurar título de página en el navbar
        const pageTitle = container.querySelector('#pageTitle');
        if (pageTitle) pageTitle.textContent = 'Productos';

        this.setupEventListeners();
        this.initSidebarToggle(container);
    },

    /**
     * Inicializar toggle del sidebar (duplicando lógica del dashboard para consistencia)
     */
    initSidebarToggle(container) {
        const sidebar = container.querySelector('#sidebar');
        const sidebarCollapseBtn = container.querySelector('#sidebarCollapseBtn');
        const sidebarToggleMobile = container.querySelector('#sidebarToggleMobile');
        
        if (localStorage.getItem('sidebarCollapsed') === 'true' && sidebar) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            const icon = sidebar.querySelector('.sidebar-toggle-icon');
            if (icon) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
            }
        }

        const handleSidebar = () => {
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
                const nowCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', nowCollapsed);
                document.body.classList.toggle('sidebar-collapsed', nowCollapsed);
                const icon = sidebar.querySelector('.sidebar-toggle-icon');
                if (icon) {
                    icon.classList.toggle('fa-chevron-right', nowCollapsed);
                    icon.classList.toggle('fa-chevron-left', !nowCollapsed);
                }
            }
        };

        if (sidebarCollapseBtn) sidebarCollapseBtn.addEventListener('click', (e) => { e.preventDefault(); handleSidebar(); });
        if (sidebarToggleMobile) sidebarToggleMobile.addEventListener('click', (e) => { e.preventDefault(); sidebar.classList.toggle('show'); });
        
        // Logout
        const logoutBtn = container.querySelector('#logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); Router.logout(); });
    },
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Router.logout());
        }
        
        // Nuevo producto
        const newProductBtn = document.getElementById('newProductBtn');
        if (newProductBtn) {
            newProductBtn.addEventListener('click', () => this.openProductModal());
        }
        
        // Buscador
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.busqueda = e.target.value;
                this.filtrarProductos();
            });
        }
        
        // Limpiar búsqueda
        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                this.busqueda = '';
                this.filtrarProductos();
            });
        }
        
        // Filtro categoría
        const categoriaFilter = document.getElementById('categoriaFilter');
        if (categoriaFilter) {
            categoriaFilter.addEventListener('change', (e) => {
                this.categoriaSeleccionada = e.target.value || null;
                this.filtrarProductos();
            });
        }
        
        // Productos por página
        const perPageSelect = document.getElementById('perPageSelect');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', (e) => {
                this.productosPorPagina = parseInt(e.target.value) || 12;
                this.paginaActual = 1;
                this.renderPagination();
                this.renderProducts();
            });
        }
        
        // Imagen preview
        const productImage = document.getElementById('productImage');
        if (productImage) {
            productImage.addEventListener('change', (e) => this.handleImagePreview(e));
        }
        
        // Guardar producto
        const saveProductBtn = document.getElementById('saveProductBtn');
        if (saveProductBtn) {
            saveProductBtn.addEventListener('click', () => this.saveProduct());
        }
    },
    
    /**
     * Cargar datos desde API
     */
    async loadData() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        this.cargando = true;
        
        try {
            const token = AuthService.getToken();
            const response = await fetch('/api/productos', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.productos = data.data?.productos || [];
                this.productosFiltrados = [...this.productos];
                
                // Extraer categorías únicas
                this.categorias = [...new Set(this.productos.map(p => p.categoria).filter(Boolean))].sort();
                
                this.renderCategoriaFilter();
                this.renderProducts();
                this.renderPagination();
            } else {
                grid.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
            }
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            grid.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        } finally {
            this.cargando = false;
        }
    },
    
    /**
     * Filtrar productos
     */
    filtrarProductos() {
        let filtrados = [...this.productos];
        
        // Filtrar por búsqueda
        if (this.busqueda) {
            const search = this.busqueda.toLowerCase();
            filtrados = filtrados.filter(p => 
                (p.nombre && p.nombre.toLowerCase().includes(search)) ||
                (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search)) ||
                (p.categoria && p.categoria.toLowerCase().includes(search))
            );
        }
        
        // Filtrar por categoría
        if (this.categoriaSeleccionada) {
            filtrados = filtrados.filter(p => p.categoria === this.categoriaSeleccionada);
        }
        
        this.productosFiltrados = filtrados;
        this.paginaActual = 1;
        
        this.renderProducts();
        this.renderPagination();
    },
    
    /**
     * Renderizar filtro de categorías
     */
    renderCategoriaFilter() {
        const select = document.getElementById('categoriaFilter');
        const datalist = document.getElementById('categoriasList');
        
        if (select) {
            const options = this.categorias.map(c => 
                `<option value="${c}">${c}</option>`
            ).join('');
            select.innerHTML = `<option value="">Todas las categorías</option>${options}`;
        }
        
        if (datalist) {
            datalist.innerHTML = this.categorias.map(c => 
                `<option value="${c}">`
            ).join('');
        }
    },
    
    /**
     * Renderizar productos como cards
     */
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const total = document.getElementById('totalProductos');
        
        if (!grid) return;
        
        // Actualizar total
        if (total) {
            total.textContent = this.productosFiltrados.length;
        }
        
        if (this.productosFiltrados.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                    <p class="mt-2 text-muted">No se encontraron productos</p>
                </div>
            `;
            return;
        }
        
        // Calcular paginación
        const inicio = (this.paginaActual - 1) * this.productosPorPagina;
        const fin = inicio + this.productosPorPagina;
        const productosPagina = this.productosFiltrados.slice(inicio, fin);
        
        const cards = productosPagina.map(producto => this.renderProductCard(producto)).join('');
        
        grid.innerHTML = cards;
    },
    
    /**
     * Renderizar un card de producto
     */
    renderProductCard(producto) {
        const imagen = producto.imagen || producto.foto || null;
        const imgUrl = imagen 
            ? (imagen.startsWith('/') ? imagen : `/uploads/productos/${imagen}`) 
            : null;
        
        const imgHtml = imgUrl 
            ? `<div class="card-img-container overflow-hidden" style="height: 180px;">
                <img src="${imgUrl}" class="card-img-top h-100 w-100" alt="${producto.nombre}" style="object-fit: cover; transition: transform 0.5s ease;">
               </div>`
            : `<div class="bg-light d-flex align-items-center justify-content-center" style="height: 180px;">
                <i class="fas fa-pills text-muted opacity-25" style="font-size: 3rem;"></i>
               </div>`;
        
        return `
            <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div class="card h-100 shadow-sm border-0 product-item-card overflow-hidden">
                    ${imgHtml}
                    <div class="card-body p-3 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold text-dark mb-0 line-clamp-2" style="font-size: 0.95rem;">${producto.nombre || 'Sin nombre'}</h6>
                            <span class="badge bg-primary-soft text-primary small">${producto.categoria || 'Gral'}</span>
                        </div>
                        <p class="text-muted x-small mb-3">
                            <i class="fas fa-barcode me-1 opacity-50"></i> ${producto.codigo_barras || producto.codigo || 'S/C'}
                        </p>
                        <div class="mt-auto d-flex align-items-center justify-content-between">
                            <div class="text-primary fw-bold">$ ${producto.precio || '0.00'}</div>
                            <button class="btn btn-light btn-sm rounded-pill px-3" 
                                    onclick="ProductsPage.editProduct(${producto.id})">
                                <i class="fas fa-edit me-1"></i> <span class="small">Editar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Renderizar paginación
     */
    renderPagination() {
        const pagination = document.getElementById('pagination');
        const nav = document.getElementById('paginationNav');
        
        if (!pagination || !nav) return;
        
        const totalPaginas = Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
        
        if (totalPaginas <= 1) {
            nav.classList.add('d-none');
            return;
        }
        
        nav.classList.remove('d-none');
        
        let html = '';
        
        // Anterior
        html += `
            <li class="page-item ${this.paginaActual === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); ProductsPage.irPagina(${this.paginaActual - 1})">
                    &laquo;
                </a>
            </li>
        `;
        
        // Números de página
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= this.paginaActual - 1 && i <= this.paginaActual + 1)) {
                html += `
                    <li class="page-item ${i === this.paginaActual ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="event.preventDefault(); ProductsPage.irPagina(${i})">${i}</a>
                    </li>
                `;
            } else if (i === this.paginaActual - 2 || i === this.paginaActual + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        // Siguiente
        html += `
            <li class="page-item ${this.paginaActual === totalPaginas ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); ProductsPage.irPagina(${this.paginaActual + 1})">
                    &raquo;
                </a>
            </li>
        `;
        
        pagination.innerHTML = html;
    },
    
    /**
     * Ir a una página específica
     */
    irPagina(pagina) {
        const totalPaginas = Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
        
        if (pagina < 1 || pagina > totalPaginas) return;
        
        this.paginaActual = pagina;
        this.renderProducts();
        this.renderPagination();
        
        // Scroll al inicio de la grid
        document.getElementById('productsGrid')?.scrollIntoView({ behavior: 'smooth' });
    },
    
    /**
     * Preview de imagen
     */
    handleImagePreview(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('imagePreview');
        
        if (!file || !preview) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <img src="${e.target.result}" class="img-thumbnail" style="max-height: 150px;">
                <button type="button" class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2" 
                        onclick="this.parentElement.innerHTML = ''; document.getElementById('productImage').value = '';">
                    <i class="bi bi-x"></i>
                </button>
            `;
        };
        reader.readAsDataURL(file);
    },
    
    /**
     * Abrir modal para nuevo producto
     */
    openProductModal(producto = null) {
        const modal = new Modal({
            title: producto ? 'Editar Producto' : 'Nuevo Producto',
            content: productFormRenderer.getFormHtml(producto),
            confirmText: 'Guardar cambios',
            onConfirm: async () => {
                const data = productFormRenderer.getData();
                if (!data.nombre) {
                    modal.showError('El nombre es requerido');
                    return;
                }
                
                modal.setLoading(true);
                try {
                    const token = AuthService.getToken();
                    const url = producto ? `/api/productos/${producto.id}` : '/api/productos';
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        modal.close();
                        if (typeof Toast !== 'undefined') {
                            Toast.success(producto ? 'Producto actualizado' : 'Producto creado');
                        }
                        await this.loadData();
                    } else {
                        modal.showError(result.message);
                    }
                } catch (error) {
                    modal.showError(error.message);
                } finally {
                    modal.setLoading(false);
                }
            }
        });
        modal.open();
    },
    
    /**
     * Editar producto
     */
    editProduct(id) {
        const producto = this.productos.find(p => p.id === id);
        if (producto) {
            this.openProductModal(producto);
        }
    }
};

// Exportar global
window.ProductsPage = ProductsPage;