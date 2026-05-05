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
     * Render layout completo
     */
    renderLayout(container) {
        const template = document.getElementById('template-layout');
        
        if (template) {
            container.innerHTML = template.innerHTML;
        } else {
            // Fallback layout if template not found
            container.innerHTML = `
                <div class="main-content">
                    <div class="container-fluid"><div class="page-content"></div></div>
                </div>`;
        }
        
        const pageContent = container.querySelector('.page-content');
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="view-container p-0">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 class="h3 fw-bold text-dark m-0">
                                <i class="fas fa-pills text-primary me-2"></i>Catálogo de Productos
                            </h2>
                            <p class="text-muted small mb-0">Gestione su inventario de medicamentos y productos</p>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary d-flex align-items-center gap-2" id="newProductBtn" style="background-color: var(--pq-primary); border: none; border-radius: 10px; padding: 10px 20px;">
                                <i class="fas fa-plus"></i>
                                <span>Nuevo Producto</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Buscador y Filtros -->
                    <div class="bg-white p-3 rounded-3 shadow-sm mb-4 border">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text bg-light border-end-0">
                                        <i class="fas fa-search text-muted"></i>
                                    </span>
                                    <input type="text" class="form-control border-start-0 ps-0" id="searchInput" 
                                           placeholder="Buscar por nombre, código o categoría...">
                                    <button class="btn btn-outline-secondary border-start-0" id="clearSearch">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="categoriaFilter">
                                    <option value="">Todas las categorías</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <div class="d-flex align-items-center gap-2 h-100 justify-content-end">
                                    <span class="text-muted small">Mostrar:</span>
                                    <select class="form-select form-select-sm" id="perPageSelect" style="width: auto;">
                                        <option value="12" selected>12</option>
                                        <option value="24">24</option>
                                        <option value="48">48</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Stats Summary -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-3">
                            <div class="card border-0 shadow-sm rounded-3">
                                <div class="card-body p-3">
                                    <div class="d-flex align-items-center">
                                        <div class="bg-primary-white p-2 rounded-3 me-3" style="background: rgba(var(--pq-primary-rgb), 0.1);">
                                            <i class="fas fa-box text-primary"></i>
                                        </div>
                                        <div>
                                            <div class="text-muted small">Total Productos</div>
                                            <div class="h5 fw-bold mb-0" id="totalProductos">0</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Grid de Productos -->
                    <div id="productsGrid" class="row g-4">
                        <div class="col-12 text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <p class="mt-2 text-muted">Cargando productos...</p>
                        </div>
                    </div>
                    
                    <!-- Paginación -->
                    <nav id="paginationNav" class="mt-5 d-none">
                        <ul class="pagination justify-content-center" id="pagination"></ul>
                    </nav>
                </div>
                
                <!-- Modal para Producto (Universal) -->
                <div class="modal fade" id="productModal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                            <div class="modal-header bg-light border-0 py-3">
                                <h5 class="modal-title fw-bold text-dark" id="modalTitle">
                                   <i class="fas fa-box-open me-2 text-primary"></i>Gestión de Producto
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body p-4">
                                <form id="productForm">
                                    <input type="hidden" name="id" id="productId">
                                    <div class="row g-4">
                                        <div class="col-md-4">
                                            <div class="text-center p-3 border rounded-4 bg-light" style="border-style: dashed !important;">
                                                <div id="imagePreview" class="mb-3 d-flex align-items-center justify-content-center" style="height: 180px; background: white; border-radius: 12px; overflow: hidden;">
                                                    <i class="fas fa-image fa-4x text-light"></i>
                                                </div>
                                                <input type="file" id="productImage" name="imagen" accept="image/*" class="d-none">
                                                <label for="productImage" class="btn btn-sm btn-outline-primary w-100 rounded-pill">
                                                    <i class="fas fa-upload me-1"></i> Seleccionar Imagen
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-8">
                                            <div class="row g-3">
                                                <div class="col-12">
                                                    <label class="form-label fw-semibold small text-muted">Nombre del Medicamento *</label>
                                                    <input type="text" class="form-control rounded-3" name="nombre" id="formNombre" placeholder="Ej. Aspirina 500mg" required>
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label fw-semibold small text-muted">Código / SKU</label>
                                                    <input type="text" class="form-control rounded-3" name="codigo_barras" id="formCodigo" placeholder="EAN-13">
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label fw-semibold small text-muted">Categoría</label>
                                                    <input type="text" class="form-control rounded-3" name="categoria" id="formCategoria" list="categoriasList" placeholder="Seleccione o escriba...">
                                                    <datalist id="categoriasList"></datalist>
                                                </div>
                                                <div class="col-12">
                                                    <label class="form-label fw-semibold small text-muted">Presentación / Envase</label>
                                                    <input type="text" class="form-control rounded-3" name="presentacion" id="formPresentacion" placeholder="Ej. Caja x 30 unidades">
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label fw-semibold small text-muted">Stock Inicial</label>
                                                    <input type="number" class="form-control rounded-3" name="stock_total" id="formStock" placeholder="0" min="0" step="1">
                                                </div>
                                                <div class="col-md-6">
                                                    <label class="form-label fw-semibold small text-muted">Precio de Venta *</label>
                                                    <div class="input-group">
                                                        <span class="input-group-text bg-light border-end-0"><i class="fas fa-tag small text-muted"></i></span>
                                                        <input type="text" class="form-control border-start-0 ps-0 rounded-end-3" id="formPrecioDisplay" placeholder="Ej. 20.000">
                                                        <input type="hidden" name="precio" id="formPrecio">
                                                    </div>

                                                </div>
                                                <div class="col-12">
                                                    <label class="form-label fw-semibold small text-muted">Descripción</label>
                                                    <textarea class="form-control rounded-3" name="descripcion" id="formDescripcion" rows="3" placeholder="Detalles descriptivos del producto..."></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer bg-light border-0 p-3">
                                <button type="button" class="btn btn-link text-muted text-decoration-none" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary px-4 fw-semibold" id="saveProductBtn" style="border-radius: 10px; background-color: var(--pq-primary); border: none;">Guardar Producto</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        this.setupEventListeners();
        
        // Cargar info de usuario si es necesario
        this.loadUserInfo();
    },
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Toggle Sidebar (Global)
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.getElementById('sidebar')?.classList.toggle('collapsed');
                document.querySelector('.main-content')?.classList.toggle('expanded');
            });
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
                const s = document.getElementById('searchInput');
                if (s) s.value = '';
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

        // Precio formatting logic
        const precioDisplay = document.getElementById('formPrecioDisplay');
        const precioValue = document.getElementById('formPrecio');

        if (precioDisplay && precioValue) {
            precioDisplay.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                precioValue.value = val;
                if (val !== '') {
                    e.target.value = new Intl.NumberFormat('es-CO').format(val);
                } else {
                    e.target.value = '';
                }
            });
        }
    },
    
    /**
     * Cargar información del usuario en el layout
     */
    loadUserInfo() {
        const session = AuthService.getSession();
        const userNameEl = document.getElementById('userName');
        if (userNameEl && session) {
            userNameEl.textContent = session.nombre || session.usuario || 'Usuario';
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
                    <i class="fas fa-inbox text-muted opacity-25" style="font-size: 3rem;"></i>
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
        const imgUrl = producto.imagen_url
            ? producto.imagen_url
            : (producto.imagen && String(producto.imagen).startsWith('/uploads/') ? producto.imagen : null);
        
        const imgHtml = imgUrl 
            ? `<img src="${imgUrl}" class="card-img-top" alt="${producto.nombre}" style="height: 150px; object-fit: cover;" onerror="this.onerror=null;this.src='data:image/gif;base64,R0lGODlhAQABAAAAACw='">`
            : `<div class="bg-light d-flex align-items-center justify-content-center" style="height: 150px;">
                <i class="fas fa-pills text-muted opacity-25" style="font-size: 3rem;"></i>
               </div>`;
        
        return `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="card h-100 border-0 shadow-sm product-card transition-all" style="cursor: pointer; border-radius: 12px; overflow: hidden;">
                    ${imgHtml}
                    <div class="card-body">
                        <h6 class="card-title fw-bold text-dark mb-1">${producto.nombre || 'Sin nombre'}</h6>
                        <p class="text-primary small mb-2 fw-medium">${producto.categoria || 'Sin categoría'}</p>
                        <p class="small mb-2 text-muted">
                            <i class="fas fa-barcode me-1"></i> ${producto.codigo_barras || producto.codigo || 'Sin código'}
                        </p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-dark">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(producto.precio_activo || producto.precio || 0)}</span>
                            <span class="badge ${producto.stock_total > 10 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'} rounded-pill px-2 py-1" style="font-size: 0.75rem;">
                                ${Math.round(producto.stock_total || 0)} unid.
                            </span>
                        </div>
                    </div>
                    <div class="card-footer bg-white border-0 pt-0 pb-3">
                        <button class="btn btn-sm btn-light w-100 border rounded-pill text-primary fw-medium" 
                                onclick="ProductsPage.editProduct(${producto.id})">
                            <i class="fas fa-edit me-1"></i> Editar
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
        
        const grid = document.getElementById('productsGrid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth' });
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
                <img src="${e.target.result}" class="img-fluid rounded" style="max-height: 180px; object-fit: contain;">
                <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle" 
                        onclick="document.getElementById('imagePreview').innerHTML = '<i class=\\'fas fa-image fa-4x text-light\\'></i>'; document.getElementById('productImage').value = '';">
                    <i class="fas fa-times"></i>
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
        if (!form) return;
        
        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('imagePreview').innerHTML = '<i class="fas fa-image fa-4x text-light"></i>';
        
        const modalTitle = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveProductBtn');
        
        if (producto) {
            modalTitle.innerHTML = '<i class="fas fa-edit me-2 text-primary"></i>Editar Medicamento';
            saveBtn.textContent = 'Actualizar Medicamento';
            
            // Llenar campos
            document.getElementById('productId').value = producto.id;
            document.getElementById('formNombre').value = producto.nombre || '';
            document.getElementById('formCodigo').value = producto.codigo_barras || producto.codigo || '';
            document.getElementById('formCategoria').value = producto.categoria || '';
            document.getElementById('formPresentacion').value = producto.presentacion || '';
            document.getElementById('formDescripcion').value = producto.descripcion || '';
            
            // Stock
            document.getElementById('formStock').value = Math.round(producto.stock_total || 0);
            
            // Precio
            const precio = producto.precio_activo || producto.precio || 0;
            document.getElementById('formPrecio').value = precio;
            document.getElementById('formPrecioDisplay').value = precio > 0 ? new Intl.NumberFormat('es-CO').format(precio) : '';

            if (producto.imagen) {
                const imgUrl = producto.imagen.startsWith('/') ? producto.imagen : `/uploads/productos/${producto.imagen}`;
                document.getElementById('imagePreview').innerHTML = `
                    <img src="${imgUrl}" class="img-fluid rounded" style="max-height: 180px; object-fit: contain;">
                `;
            }
        } else {
            modalTitle.innerHTML = '<i class="fas fa-box-open me-2 text-primary"></i>Nuevo Medicamento';
            saveBtn.textContent = 'Guardar Producto';
        }
        
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    },
    
    /**
     * Guardar producto (Create/Update Reformulado)
     */
    async saveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        const id = formData.get('id');
        
        const saveBtn = document.getElementById('saveProductBtn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
        
        try {
            const token = AuthService.getToken();
            const url = id ? `/api/productos/${id}` : '/api/productos';
            
            // Si es PUT, PHP no maneja bien multipart/form-data. 
            // Usaremos POST y en el backend ya detectamos si hay ID (reformulación).
            // O podemos usar un campo oculto _method.
            if (id) {
                // Para simplificar la reformulación, usaremos el endpoint de imagen si hay imagen,
                // Pero aquí el usuario quiere "reformulado". 
                // Enviaremos vía POST a la URL de creación si no hay ID, o a una especial si hay ID?
                // Mejor: Si hay ID, usamos el endpoint de actualización JSON y luego subimos imagen.
                // PERO el usuario pidió reformular. Así que enviaré FormData vía POST al router.
                // El router ya lo manejará.
            }

            const response = await fetch(url, {
                method: id ? 'POST' : 'POST', // Usamos POST para subida de archivos siempre
                headers: {
                    'Authorization': 'Bearer ' + token
                    // NO poner Content-Type: multipart/form-data manualmente, dejar que fetch lo haga
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
                await this.loadData();
                if (typeof Toast !== 'undefined') Toast.success(id ? 'Medicamento actualizado' : 'Medicamento creado');
            } else {
                alert(result.message || 'Error al procesar solicitud');
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error: ' + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    },
    
    /**
     * Editar producto
     */
    async editProduct(id) {
        const producto = this.productos.find(p => p.id === id);
        if (producto) {
            this.openProductModal(producto);
        } else {
            // Intentar cargar de la API si no está en memoria
            try {
                const token = AuthService.getToken();
                const response = await fetch(`/api/productos/${id}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const result = await response.json();
                if (result.success) {
                    this.openProductModal(result.data);
                }
            } catch (error) {
                console.error('Error cargando producto para editar:', error);
            }
        }
    }
};

// Exportar global
window.ProductsPage = ProductsPage;