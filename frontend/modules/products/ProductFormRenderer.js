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
        return `
            <form id="productForm" class="product-form">
                <div class="form-group">
                    <label class="form-label">Nombre <span class="required">*</span></label>
                    <input type="text" name="nombre" class="form-input" value="${p.nombre || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Código de Barras</label>
                    <input type="text" name="codigo_barras" class="form-input" value="${p.codigo || p.codigo_barras || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Categoría</label>
                    <input type="text" name="categoria" class="form-input" value="${p.categoria || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Presentación</label>
                    <input type="text" name="presentacion" class="form-input" value="${p.presentacion || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea name="descripcion" class="form-textarea" rows="3">${p.descripcion || ''}</textarea>
                </div>
            </form>
        `;
    }

    /**
     * Fill form with data
     */
    fillForm(producto) {
        const fields = ['nombre', 'codigo_barras', 'categoria', 'presentacion', 'descripcion'];
        fields.forEach(field => {
            const input = document.querySelector(`[name="${field}"]`);
            if (input && producto[field] !== undefined) {
                input.value = producto[field];
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