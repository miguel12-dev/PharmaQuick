/**
 * PharmaQuick - Product Form Renderer
 * Renders product create/edit forms
 */

class ProductFormRenderer {
    /**
     * Get form HTML
     */
    getFormHtml(producto = null) {
        const p = producto || {};
        const barcode = p.codigo_barras || p.codigo || '';
        
        return `
            <form id="productForm" class="p-2">
                <div class="row g-3">
                    <!-- Nombre y Código -->
                    <div class="col-md-8">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Nombre del Producto <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-pills text-primary"></i></span>
                                <input type="text" name="nombre" class="form-control border-start-0" value="${p.nombre || ''}" placeholder="Ej. Amoxicilina 500mg" required>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Código</label>
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0"><i class="fas fa-barcode text-muted"></i></span>
                                <input type="text" name="codigo_barras" class="form-control border-start-0" value="${barcode}" placeholder="Opcional">
                            </div>
                        </div>
                    </div>

                    <!-- Categoría y Presentación -->
                    <div class="col-md-6">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Categoría</label>
                            <input type="text" name="categoria" class="form-control" value="${p.categoria || ''}" placeholder="Ej. Antibióticos">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group mb-3">
                            <label class="form-label fw-bold small text-muted text-uppercase">Presentación</label>
                            <input type="text" name="presentacion" class="form-control" value="${p.presentacion || ''}" placeholder="Ej. Caja x 30 tabletas">
                        </div>
                    </div>

                    <!-- Descripción -->
                    <div class="col-12">
                        <div class="form-group mb-0">
                            <label class="form-label fw-bold small text-muted text-uppercase">Descripción</label>
                            <textarea name="descripcion" class="form-control" rows="3" placeholder="Información adicional del producto...">${p.descripcion || ''}</textarea>
                        </div>
                    </div>
                </div>
            </form>
        `;
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
     * Get form data
     */
    getData() {
        const form = document.getElementById('productForm');
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    }
}

const productFormRenderer = new ProductFormRenderer();