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
        container.innerHTML = `
            <!-- Navbar -->
            <nav class="navbar navbar-expand-lg navbar-light fixed-top" style="z-index: 1030;">
                <div class="container-fluid">
                    <a class="navbar-brand" href="/dashboard">
                        <i class="bi bi-capsule"></i> PharmaQuick
                    </a>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary btn-sm" id="newProductBtn">
                            <i class="bi bi-plus-lg"></i> Nuevo
                        </button>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Cerrar Sesión</button>
                    </div>
                </div>
            </nav>
            
            <!-- Sidebar -->
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
            
            <!-- Main Content -->
            <main class="main-content" id="mainContent" style="margin-top: 56px; padding: 20px;">
                <div class="container-fluid">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2><i class="bi bi-box-seam"></i> Productos</h2>
                        <span class="badge bg-secondary" id="totalProductos">0</span>
                    </div>
                    
                    <!-- Buscador y Filtros -->
                    <div class="row mb-4 g-2">
                        <div class="col-md-6">
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-search"></i></span>
                                <input type="text" class="form-control" id="searchInput" 
                                       placeholder="Buscar productos...">
                                <button class="btn btn-outline-secondary" id="clearSearch">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <select class="form-select" id="categoriaFilter">
                                <option value="">Todas las categorías</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="perPageSelect">
                                <option value="12" selected>12 por página</option>
                                <option value="24">24 por página</option>
                                <option value="48">48 por página</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Grid de Productos -->
                    <div id="productsGrid" class="row g-3">
                        <div class="col-12 text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <p class="mt-2 text-muted">Cargando productos...</p>
                        </div>
                    </div>
                    
                    <!-- Paginación -->
                    <nav id="paginationNav" class="mt-4 d-none">
                        <ul class="pagination justify-content-center" id="pagination"></ul>
                    </nav>
                </div>
            </main>
            
            <!-- Modal para Nuevo Producto -->
            <div class="modal fade" id="productModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Nuevo Producto</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="productForm">
                                <div class="row g-3">
                                    <div class="col-md-8">
                                        <label class="form-label">Nombre *</label>
                                        <input type="text" class="form-control" name="nombre" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Código de Barras</label>
                                        <input type="text" class="form-control" name="codigo_barras">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Categoría</label>
                                        <input type="text" class="form-control" name="categoria" list="categoriasList">
                                        <datalist id="categoriasList"></datalist>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Presentación</label>
                                        <input type="text" class="form-control" name="presentacion">
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Descripción</label>
                                        <textarea class="form-control" name="descripcion" rows="3"></textarea>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label"> Imagen del Producto</label>
                                        <div class="border rounded p-3 text-center">
                                            <input type="file" id="productImage" accept="image/*" class="d-none">
                                            <label for="productImage" class="btn btn-outline-secondary mb-2">
                                                <i class="bi bi-upload"></i> Subir Imagen
                                            </label>
                                            <div id="imagePreview" class="mt-2"></div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="saveProductBtn">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
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
            ? `<img src="${imgUrl}" class="card-img-top" alt="${producto.nombre}" style="height: 150px; object-fit: cover;">`
            : `<div class="bg-light d-flex align-items-center justify-content-center" style="height: 150px;">
                <i class="bi bi-box text-muted" style="font-size: 3rem;"></i>
               </div>`;
        
        return `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="card h-100 shadow-sm product-card" style="cursor: pointer;">
                    ${imgHtml}
                    <div class="card-body">
                        <h6 class="card-title mb-1">${producto.nombre || 'Sin nombre'}</h6>
                        <p class="text-muted small mb-1">${producto.categoria || 'Sin categoría'}</p>
                        <p class="small mb-0 text-muted">
                            <i class="bi bi-upc"></i> ${producto.codigo_barras || producto.codigo || 'Sin código'}
                        </p>
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <button class="btn btn-sm btn-outline-primary w-100" 
                                onclick="ProductsPage.editProduct(${producto.id})">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
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
        const form = document.getElementById('productForm');
        if (form) {
            form.reset();
            if (producto) {
                form.nombre.value = producto.nombre || '';
                form.codigo_barras.value = producto.codigo_barras || '';
                form.categoria.value = producto.categoria || '';
                form.presentacion.value = producto.presentacion || '';
                form.descripcion.value = producto.descripcion || '';
                
                const preview = document.getElementById('imagePreview');
                if (preview && producto.imagen) {
                    const imgUrl = producto.imagen.startsWith('/') ? producto.imagen : `/uploads/productos/${producto.imagen}`;
                    preview.innerHTML = `<img src="${imgUrl}" class="img-thumbnail" style="max-height: 150px;">`;
                }
            }
        }
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    },
    
    /**
     * Guardar producto
     */
    async saveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        const productoId = document.getElementById('productId')?.value;
        
        const data = Object.fromEntries(formData.entries());
        
        try {
            const token = AuthService.getToken();
            const url = productoId ? `/api/productos/${productoId}` : '/api/productos';
            
            const response = await fetch(url, {
                method: 'POST',  // Usamos POST para ambos por compatibilidad con FormData/Imágenes
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Cerrar modal
                bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
                
                // ID del producto (nuevo o existente)
                const targetId = productoId || result.data?.producto_id;
                
                // Verificar si hay imagen para subir
                const imageInput = document.getElementById('productImage');
                if (imageInput && imageInput.files[0] && targetId) {
                    await this.uploadImage(targetId, imageInput.files[0]);
                }
                
                // Recargar
                await this.loadData();
                
                // Mostrar éxito
                if (typeof Toast !== 'undefined') {
                    Toast.success('Producto creado correctamente');
                }
            } else {
                alert(result.message || 'Error al crear producto');
            }
            
        } catch (error) {
            console.error('Error guardando producto:', error);
            alert('Error: ' + error.message);
        }
    },
    
    /**
     * Subir imagen de producto
     */
    async uploadImage(productoId, file) {
        const formData = new FormData();
        formData.append('imagen', file);
        
        try {
            const token = AuthService.getToken();
            const response = await fetch(`/api/productos/${productoId}/imagen`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Imagen subida:', result.data);
            } else {
                console.warn('Error subiendo imagen:', result.message);
            }
            
        } catch (error) {
            console.error('Error upload image:', error);
        }
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