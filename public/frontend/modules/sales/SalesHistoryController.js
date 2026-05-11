class SalesHistoryController {
    constructor() {
        this.sales = [];
    }

    async init() {
        this.view = new SalesHistoryView(this);
        await this.loadSales();

        const btnRefresh = document.getElementById('btnRefreshVentas');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => this.loadSales());
        }
    }

    async loadSales() {
        try {
            this.view.showLoading();
            const response = await httpClient.get('/ventas');
            if (response.success) {
                this.sales = response.data.ventas || [];
                this.view.renderSales(this.sales);
            } else {
                Toast.error('Error al cargar ventas');
            }
        } catch (error) {
            console.error('Error loading sales:', error);
            Toast.error('Error de conexión al cargar ventas');
        }
    }

    async viewDetails(ventaId, tipo = 'VENTA') {
        try {
            const response = await httpClient.get(`/ventas/${ventaId}/detalles?tipo=${tipo}`);
            if (response.success) {
                const venta = this.sales.find(v => v.id === ventaId && v.tipo === tipo);
                this.view.showDetailsModal(venta, response.data.detalles);
            } else {
                Toast.error('Error al cargar detalles');
            }
        } catch (error) {
            console.error('Error loading sale details:', error);
            Toast.error('Error al cargar detalles de la venta');
        }
    }
}
window.SalesHistoryController = SalesHistoryController;
