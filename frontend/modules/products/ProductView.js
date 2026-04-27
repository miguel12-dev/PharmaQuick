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
        productFormRenderer.attachEvents();
    }

    /**
     * Show edit modal
     */
    showEditModal(id) {
        const producto = this.controller.getProductoById(id);
        if (!producto) return;

        const modal = new Modal({
            title: 'Editar Producto',
            content: productFormRenderer.getFormHtml(producto),
            onConfirm: () => this.handleEdit(modal, id)
        });
        modal.open();
        productFormRenderer.attachEvents();
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
        const data = productFormRenderer.getData();
        if (!data?.nombre) {
            modal.showError('El nombre es requerido');
            return;
        }
        
        modal.setLoading(true);
        try {
            const result = await this.controller.createProducto(data);

            // Si el usuario adjuntó imagen, subirla al endpoint dedicado
            const fileInput = document.getElementById('productImageInput');
            const file = fileInput?.files?.[0];
            if (file && result?.producto_id) {
                await ProductService.uploadImage(result.producto_id, file);
            }

            modal.close();
            if (typeof Toast !== 'undefined') {
                Toast.success('Producto creado');
            }
        } catch (error) {
            modal.showError(error.message);
        }
    }

    /**
     * Handle edit
     */
    async handleEdit(modal, id) {
        const data = productFormRenderer.getData();
        if (!data?.nombre) {
            modal.showError('El nombre es requerido');
            return;
        }
        
        modal.setLoading(true);
        try {
            await this.controller.updateProducto(id, data);

            // Subir imagen si se seleccionó una nueva
            const fileInput = document.getElementById('productImageInput');
            const file = fileInput?.files?.[0];
            if (file) {
                await ProductService.uploadImage(id, file);
            }

            modal.close();
            if (typeof Toast !== 'undefined') {
                Toast.success('Producto actualizado');
            }
        } catch (error) {
            modal.showError(error.message);
        }
    }
}

// Export
const productView = null;