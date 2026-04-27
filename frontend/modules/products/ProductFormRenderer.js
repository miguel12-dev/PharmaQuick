class ProductFormRenderer {
    /**
     * Get form HTML
     */
    getFormHtml(producto = null) {
        const p = producto || {};
        const imageUrl = p.imagen_url ? p.imagen_url : '/public/assets/img/no-image.png';
        
        return `
            <form id="productForm" class="product-form">
                <input type="hidden" name="producto_id" value="${p.producto_id || p.id || ''}">
                <div class="row">
                    <div class="col-md-4 mb-4">
                        <div class="image-upload-container text-center">
                            <label class="form-label d-block text-start mb-2">Imagen del Producto</label>
                            <div class="image-preview-wrapper mb-3 mx-auto" style="width: 180px; height: 180px; border-radius: var(--radius-lg); overflow: hidden; background: #f3f4f6; border: 2px dashed var(--color-border); position: relative;">
                                <img id="imagePreview" src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/public/assets/img/no-image.png'">
                            </div>
                            <button type="button" class="btn btn-outline-primary btn-sm w-100" onclick="document.getElementById('productImageInput').click()">
                                <i class="fas fa-camera me-1"></i> Cambiar Imagen
                            </button>
                            <input type="file" id="productImageInput" name="imagen" accept="image/*" class="d-none">
                            <small class="text-muted d-block mt-2">Formatos: JPG, PNG. Máx 2MB</small>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label fw-semibold">Nombre del Producto <span class="text-danger">*</span></label>
                                <input type="text" name="nombre" class="form-control" placeholder="Ej. Paracetamol 500mg" value="${p.nombre || ''}" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Código de Barras</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light"><i class="fas fa-barcode"></i></span>
                                    <input type="text" name="codigo_barras" class="form-control" placeholder="0000000000" value="${p.codigo || p.codigo_barras || ''}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Categoría</label>
                                <select name="categoria" class="form-select">
                                    <option value="">Seleccione...</option>
                                    <option value="Medicamentos" ${p.categoria === 'Medicamentos' ? 'selected' : ''}>Medicamentos</option>
                                    <option value="Higiene" ${p.categoria === 'Higiene' ? 'selected' : ''}>Higiene</option>
                                    <option value="Suplementos" ${p.categoria === 'Suplementos' ? 'selected' : ''}>Suplementos</option>
                                </select>
                            </div>
                            <div class="col-md-12">
                                <label class="form-label fw-semibold">Presentación / Envase</label>
                                <input type="text" name="presentacion" class="form-control" placeholder="Ej. Caja por 20 tabletas" value="${p.presentacion || ''}">
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-semibold">Descripción del Producto</label>
                                <textarea name="descripcion" class="form-control" rows="3" placeholder="Información adicional del producto...">${p.descripcion || ''}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;
    }

    /**
     * Attach form-specific events (image preview)
     */
    attachEvents() {
        const fileInput = document.getElementById('productImageInput');
        const preview = document.getElementById('imagePreview');
        
        if (fileInput && preview) {
            fileInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.src = e.target.result;
                    }
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    /**
     * Get form data
     */
    getData() {
        const form = document.getElementById('productForm');
        if (!form) return null;
        return new FormData(form);
    }
}

const productFormRenderer = new ProductFormRenderer();