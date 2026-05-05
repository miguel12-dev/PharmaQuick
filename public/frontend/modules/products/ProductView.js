/**
 * PharmaQuick - Products View
 * Controls product display and user interactions
 */

class ProductView {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.controller = null;
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('ProductView: Container not found');
            return;
        }

        // Initialize controller
        this.controller = productController;
        
        // Listen to events
        window.addEventListener('product:search', e => {
            this.controller.search(e.detail);
        });

        window.addEventListener('product:filter', e => {
            this.controller.filterByCategory(e.detail);
        });

        window.addEventListener('product:create', () => {
            this.showCreateModal();
        });

        window.addEventListener('product:action', e => {
            const { action, id } = e.detail;
            if (action === 'edit') this.showEditModal(id);
            if (action === 'prices') this.showPricesModal(id);
        });

        // Load data
        this.controller.init();
    }

    /**
     * Render products
     */
    render(productos) {
        productViewRenderer.render(productos);
    }

    /**
     * Show loading
     */
    setLoading(loading) {
        const table = this.container.querySelector('.table-container');
        if (table) {
            table.classList.toggle('loading', loading);
        }
    }

    /**
     * Show error
     */
    showError(message) {
        if (typeof Toast !== 'undefined') {
            Toast.error(message);
        }
    }

    /**
     * Show create modal
     */
    showCreateModal() {
        const modal = new Modal({
            title: 'Nuevo Producto',
            content: productFormRenderer.getFormHtml(),
            onConfirm: () => this.handleCreate(modal)
        });
        modal.open();
        
        // Initialize form behaviors for the new modal
        productFormRenderer.setupCategoryField();
    }

    /**
     * Show edit modal
     */
    async showEditModal(id) {
        try {
            // Obtener datos frescos del servidor (incluye lote_id y metadata de inventario)
            const producto = await this.controller.fetchById(id);
            if (!producto) return;

            const modal = new Modal({
                title: 'Editar Producto',
                content: productFormRenderer.getFormHtml(producto),
                onConfirm: () => this.handleEdit(modal, id)
            });
            modal.open();
            productFormRenderer.fillForm(producto);
        } catch (error) {
            console.error('Error opening edit modal:', error);
            this.showError('No se pudo cargar la información del producto');
        }
    }

    /**
     * Show prices modal
     */
    showPricesModal(id) {
        const producto = this.controller.getProductoById(id);
        window.dispatchEvent(new CustomEvent('openPricesModal', {
            detail: { productoId: id, producto }
        }));
    }

    /**
     * Handle create
     */
    async handleCreate(modal) {
        const formData = productFormRenderer.getFormData();
        const nombre = formData.get('nombre');
        
        if (!nombre) {
            modal.showError('El nombre es requerido');
            return;
        }
        
        modal.setLoading(true);
        try {
            await this.controller.createProducto(formData);
            modal.close();
            if (typeof Toast !== 'undefined') {
                Toast.success('Producto creado');
            }
        } catch (error) {
            console.error('Create error:', error);
            modal.showError(error.message);
        }
    }

    /**
     * Handle edit
     */
    async handleEdit(modal, id) {
        const formData = productFormRenderer.getFormData();
        const nombre = formData.get('nombre');
        
        if (!nombre) {
            modal.showError('El nombre es requerido');
            return;
        }
        
        modal.setLoading(true);
        try {
            await this.controller.updateProducto(id, formData);
            modal.close();
            if (typeof Toast !== 'undefined') {
                Toast.success('Producto actualizado');
            }
        } catch (error) {
            console.error('Update error:', error);
            modal.showError(error.message);
        }
    }
}

// Export
const productView = null;