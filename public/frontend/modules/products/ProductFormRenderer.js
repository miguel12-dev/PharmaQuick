/**
 * PharmaQuick - Product Form Renderer
 * Renders product create/edit forms
 */

class ProductFormRenderer {
    static NO_IMAGE_FALLBACK = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
    /**
     * Get form HTML
     */
    getFormHtml(producto = null) {
        const p = producto || {};
        const barcode = p.codigo_barras || p.codigo || '';
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
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-tag text-muted"></i></span>
                                <input type="text" name="categoria" class="form-control border-start-0" value="${p.categoria || ''}" list="categoriasList" placeholder="Ej. Antibióticos">
                                <datalist id="categoriasList"></datalist>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Precio de Venta <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-dollar-sign text-success"></i></span>
                                <input type="number" step="0.01" name="precio" class="form-control border-start-0" value="${p.precio || ''}" placeholder="0.00" required>
                            </div>
                        </div>
                    </div>

                    <!-- Stock -->
                    <div class="col-md-6">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Stock (cantidad disponible)</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-cubes text-muted"></i></span>
                                <input type="number" step="0.001" min="0" name="stock_total" class="form-control border-start-0" value="${(p.stock_total ?? 0)}" placeholder="0">
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

    /**
     * Fill form with data (Robust handling for different field names)
     */
    fillForm(producto) {
        if (!producto) return;

        const form = document.getElementById('productForm');
        if (!form) return;

        // Mapeo de campos (name en form -> key en objeto)
        const mapping = {
            'nombre': producto.nombre,
            'codigo_barras': producto.codigo_barras || producto.codigo,
            'categoria': producto.categoria,
            'precio': producto.precio || producto.precio_venta || 0,
            'stock_total': producto.stock_total ?? 0,
            'presentacion': producto.presentacion,
            'descripcion': producto.descripcion
        };

        Object.keys(mapping).forEach(name => {
            const input = form.querySelector(`[name="${name}"]`);
            if (input && mapping[name] !== undefined) {
                input.value = mapping[name];
            }
        });
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
                data[input.name] = input.value;
            }
        });
        
        return data;
    }

    /**
     * Get form data as FormData (for file uploads)
     */
    getFormData() {
        const form = document.getElementById('productForm');
        if (!form) return new FormData();
        return new FormData(form);
    }
}

const productFormRenderer = new ProductFormRenderer();