/**
 * PharmaQuick - Product Form Renderer
 * Renders product create/edit forms
 */

class ProductFormRenderer {
    static NO_IMAGE_FALLBACK = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
    static DEFAULT_CATEGORIES = ['Analgésicos', 'Antibióticos', 'Antiinflamatorios', 'Antihistamínicos', 'Gastrointestinales', 'Vitaminas y suplementos', 'Dermatológicos', 'Cardiovasculares', 'Respiratorios', 'Pediátricos'];
    
    constructor() {
        this.dynamicCategories = [];
    }

    /**
     * Get form HTML
     */
    getFormHtml(producto = null) {
        const p = producto || {};
        const barcode = p.codigo_barras || p.codigo || '';
        const precioInicial = p.precio ?? p.precio_venta ?? p.precio_activo ?? '';
        const imageUrl = this.getImageUrl(p);
        
        return `
            <form id="productForm" class="p-2">
                <div class="row g-3">
                    <!-- Nombre y Código -->
                    <div class="col-md-7">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Nombre del Producto <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-pills text-primary"></i></span>
                                <input type="text" name="nombre" class="form-control border-start-0" value="${p.nombre || ''}" placeholder="Ej. Amoxicilina 500mg" required>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-5">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Código de Barras</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-barcode text-muted"></i></span>
                                <input type="text" name="codigo_barras" class="form-control border-start-0" value="${barcode}" placeholder="Escanee o escriba">
                            </div>
                        </div>
                    </div>

                    <!-- Categoría y Precio -->
                    <div class="col-md-6">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Categoría</label>
                            <div class="input-group mb-2">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-tag text-muted"></i></span>
                                <select name="categoria" id="categoriaSelect" class="form-select border-start-0">
                                    ${this.getCategoryOptionsHtml(p.categoria || '')}
                                </select>
                            </div>
                            <div id="categoriaCustomContainer" class="${this.shouldShowCustomCategory(p.categoria || '') ? '' : 'd-none'}">
                                <input type="text" id="categoriaCustomInput" class="form-control" value="${this.isDefaultCategory(p.categoria || '') ? '' : (p.categoria || '')}" placeholder="Escriba la nueva categoría">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Precio de Venta <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-dollar-sign text-success"></i></span>
                                <input type="number" step="0.01" name="precio" class="form-control border-start-0" value="${precioInicial}" placeholder="0.00" required>
                            </div>
                        </div>
                    </div>

                    <!-- Stock y Lote (Crítico para FEFO) -->
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Stock Actual</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-cubes text-muted"></i></span>
                                <input type="number" step="1" min="0" name="stock_total" class="form-control border-start-0" value="${(p.stock_total ?? 0)}" placeholder="0">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Lote / Batch</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-tag text-muted"></i></span>
                                <input type="text" name="codigo_lote" id="codigo_lote_input" class="form-control border-start-0" placeholder="Ej. LOT-2024">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Vencimiento</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-calendar-alt text-danger"></i></span>
                                <input type="date" name="fecha_vencimiento" id="fecha_vencimiento_input" class="form-control border-start-0">
                            </div>
                        </div>
                    </div>

                    <!-- Presentación -->
                    <div class="col-12">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Presentación / Formato</label>
                            <input type="text" name="presentacion" class="form-control" value="${p.presentacion || ''}" placeholder="Ej. Caja x 30 tabletas, Jarabe 120ml...">
                        </div>
                    </div>

                    <!-- Imagen -->
                    <div class="col-12">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Imagen del Producto</label>
                            <input type="file" name="imagen" id="productImageInput" class="form-control" accept="image/*">
                            <div id="imagePreviewContainer" class="mt-2 text-center position-relative">
                                ${imageUrl ? `<img src="${imageUrl}" class="img-thumbnail" style="max-height: 120px;" onerror="this.onerror=null;this.src='${ProductFormRenderer.NO_IMAGE_FALLBACK}'">` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Descripción -->
                    <div class="col-12">
                        <div class="form-group mb-0">
                            <label class="form-label fw-bold small text-muted text-uppercase">Descripción</label>
                            <textarea name="descripcion" class="form-control" rows="2" placeholder="Información adicional...">${p.descripcion || ''}</textarea>
                        </div>
                    </div>
                </div>
            </form>
        `;
    }

    getImageUrl(p) {
        if (p?.imagen_url) return p.imagen_url;
        if (p?.imagen) {
            if (String(p.imagen).startsWith('/uploads/')) return p.imagen;
            return p.imagen;
        }
        return null;
    }

    isDefaultCategory(category) {
        return ProductFormRenderer.DEFAULT_CATEGORIES.includes(category);
    }

    shouldShowCustomCategory(category) {
        return Boolean(category) && !this.isDefaultCategory(category);
    }

    setDynamicCategories(categories = []) {
        const cleaned = categories
            .map(c => String(c || '').trim())
            .filter(Boolean);
        this.dynamicCategories = [...new Set(cleaned)];
    }

    getCategoryOptionsHtml(selectedCategory) {
        const merged = [...new Set([...ProductFormRenderer.DEFAULT_CATEGORIES, ...this.dynamicCategories])];
        const options = merged.map(category => {
            const selected = category === selectedCategory ? 'selected' : '';
            return `<option value="${category}" ${selected}>${category}</option>`;
        }).join('');
        const useOther = this.shouldShowCustomCategory(selectedCategory);
        return `<option value="">Seleccione categoría</option>${options}<option value="__OTRA__" ${useOther ? 'selected' : ''}>Otra...</option>`;
    }

    setupCategoryField() {
        const select = document.getElementById('categoriaSelect');
        const customContainer = document.getElementById('categoriaCustomContainer');
        const customInput = document.getElementById('categoriaCustomInput');
        if (!select || !customContainer || !customInput) return;

        const toggle = () => {
            const isOther = select.value === '__OTRA__';
            customContainer.classList.toggle('d-none', !isOther);
            if (!isOther) customInput.value = '';
        };

        select.addEventListener('change', toggle);
        toggle();
    }

    setupStockFieldBehavior() {
        const form = document.querySelector('.modal-overlay.show #productForm') || document.getElementById('productForm');
        if (!form) return;

        const stockInput = form.querySelector('input[name="stock_total"]');
        if (stockInput) {
            stockInput.addEventListener('focus', () => {
                if (String(stockInput.value).trim() === '0') stockInput.value = '';
            });
            stockInput.addEventListener('blur', () => {
                const normalized = Math.max(0, Math.trunc(Number(stockInput.value) || 0));
                stockInput.value = String(normalized);
            });
        }

        // DEBUG: Track live changes to batch fields
        const batchInput = form.querySelector('#codigo_lote_input');
        if (batchInput) {
            batchInput.addEventListener('input', (e) => {
                console.log('LIVE DEBUG: Lote input changed to:', e.target.value);
            });
        }
        const dateInput = form.querySelector('#fecha_vencimiento_input');
        if (dateInput) {
            dateInput.addEventListener('input', (e) => {
                console.log('LIVE DEBUG: Date input changed to:', e.target.value);
            });
        }
    }

    /**
     * Fill form with data (Robust handling for different field names)
     */
    fillForm(producto) {
        if (!producto) return;

        const form = document.getElementById('productForm');
        if (!form) return;

        const mapping = {
            'nombre': producto.nombre,
            'codigo_barras': producto.codigo_barras || producto.codigo,
            'categoria': producto.categoria,
            'precio': producto.precio ?? producto.precio_venta ?? producto.precio_activo ?? 0,
            'stock_total': Number.isFinite(Number(producto.stock_total)) ? Math.trunc(Number(producto.stock_total)) : 0,
            'codigo_lote': producto.codigo_lote,
            'fecha_vencimiento': producto.fecha_vencimiento,
            'presentacion': producto.presentacion,
            'descripcion': producto.descripcion
        };

        Object.keys(mapping).forEach(name => {
            const input = form.querySelector(`[name="${name}"]`);
            if (input && mapping[name] !== undefined) {
                input.value = name === 'stock_total' ? Math.max(0, Math.trunc(Number(mapping[name]) || 0)) : mapping[name];
            }
        });

        this.setupCategoryField();
        this.setupStockFieldBehavior();
    }

    /**
     * Get form data as Object
     */
    getData() {
        // Search for the form inside the active modal first, fallback to document
        const form = document.querySelector('.modal-overlay.show #productForm') || document.getElementById('productForm');
        if (!form) {
            console.error('ProductFormRenderer: Form #productForm not found');
            return {};
        }

        const formData = new FormData(form);
        const data = {};
        
        console.log('--- EXTRACTING FORM DATA ---');
        formData.forEach((value, key) => {
            console.log(`Field: ${key}, Value: "${value}"`);
            if (key === 'stock_total') {
                data[key] = String(Math.max(0, Math.trunc(Number(value) || 0)));
            } else {
                data[key] = value;
            }
        });

        // Paranoid check for batch fields if they came back empty from FormData
        const batchInput = form.querySelector('#codigo_lote_input');
        const dateInput = form.querySelector('#fecha_vencimiento_input');
        
        if (!data.codigo_lote && batchInput && batchInput.value) {
            console.warn('Paranoid check: codigo_lote was empty in FormData but has value in DOM:', batchInput.value);
            data.codigo_lote = batchInput.value;
        }
        
        if (!data.fecha_vencimiento && dateInput && dateInput.value) {
            console.warn('Paranoid check: fecha_vencimiento was empty in FormData but has value in DOM:', dateInput.value);
            data.fecha_vencimiento = dateInput.value;
        }

        // VALIDATION: If expiration date is provided, batch code SHOULD be provided
        if (data.fecha_vencimiento && !data.codigo_lote) {
            console.error('VALIDATION ERROR: Fecha provided without Lote');
            // We could throw here, but for now let's just log and see if the paranoid check catches it
        }

        // Special handling for custom category
        if (data.categoria === '__OTRA__') {
            const customInput = form.querySelector('#categoriaCustomInput') || document.getElementById('categoriaCustomInput');
            data.categoria = customInput?.value?.trim() || '';
        }
        
        // Ensure image field is NOT in the plain object to avoid JSON issues
        delete data.imagen;
        
        console.log('ProductFormRenderer.getData result:', data);
        return data;
    }

    /**
     * Get form data as FormData (for file uploads)
     */
    getFormData() {
        const form = document.querySelector('.modal-overlay.show #productForm') || document.getElementById('productForm');
        if (!form) return new FormData();

        const data = this.getData();
        const formData = new FormData();
        
        // Add all text fields
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        // Add file field
        const imageInput = form.querySelector('#productImageInput');
        if (imageInput?.files?.[0]) {
            formData.append('imagen', imageInput.files[0]);
        }

        return formData;
    }
}

const productFormRenderer = new ProductFormRenderer();
