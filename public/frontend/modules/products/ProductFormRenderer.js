/**
 * PharmaQuick - Product Form Renderer
 * Renders product create/edit forms
 */

class ProductFormRenderer {
    static NO_IMAGE_FALLBACK = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
    static DEFAULT_CATEGORIES = ['Analgésicos', 'Antibióticos', 'Antiinflamatorios', 'Antihistamínicos', 'Gastrointestinales', 'Vitaminas y suplementos', 'Dermatológicos', 'Cardiovasculares', 'Respiratorios', 'Pediátricos'];

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

                    <!-- Stock -->
                    <div class="col-md-6">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Stock (cantidad disponible)</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-cubes text-muted"></i></span>
                                <input type="number" step="1" min="0" name="stock_total" class="form-control border-start-0" value="${(p.stock_total ?? 0)}" placeholder="0">
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

    getCategoryOptionsHtml(selectedCategory) {
        const options = ProductFormRenderer.DEFAULT_CATEGORIES.map(category => {
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
    }

    /**
     * Get form data as Object
     */
    getData() {
        const form = document.getElementById('productForm');
        if (!form) return {};

        const data = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.name && input.type !== 'file') {
                if (input.name === 'stock_total') {
                    data[input.name] = String(Math.max(0, Math.trunc(Number(input.value) || 0)));
                } else {
                    data[input.name] = input.value;
                }
            }
        });

        if (data.categoria === '__OTRA__') {
            data.categoria = document.getElementById('categoriaCustomInput')?.value?.trim() || '';
        }
        
        return data;
    }

    /**
     * Get form data as FormData (for file uploads)
     */
    getFormData() {
        const form = document.getElementById('productForm');
        if (!form) return new FormData();

        const data = this.getData();
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => formData.append(key, value));

        const imageInput = form.querySelector('#productImageInput');
        if (imageInput?.files?.[0]) {
            formData.append('imagen', imageInput.files[0]);
        }

        return formData;
    }
}

const productFormRenderer = new ProductFormRenderer();
