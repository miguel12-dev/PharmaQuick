/**
 * PharmaQuick - InventoryController
 * Coordina estado y eventos de la vista de inventario.
 */
class InventoryController {
    constructor() {
        this.alertas = [];
        this.pagination = { page: 1, per_page: 25, total: 0, total_pages: 1 };
        this.isLoading = false;

        this.filters = {
            dias: 180,
            semaforo: '',
            q: '',
            page: 1,
            perPage: 25,
        };

        this.listeners = {
            onAlertasChange: [],
            onPaginationChange: [],
            onLoadingChange: [],
            onError: [],
        };
    }

    async init() {
        this.setLoading(true);
        try {
            await this.loadAlertas();
        } finally {
            this.setLoading(false);
        }
    }

    async refreshCurrentView() {
        this.setLoading(true);
        try {
            await this.loadAlertas();
        } finally {
            this.setLoading(false);
        }
    }

    setFilters(partialFilters = {}) {
        this.filters = { ...this.filters, ...partialFilters };
        if (partialFilters.dias !== undefined || partialFilters.q !== undefined || partialFilters.semaforo !== undefined || partialFilters.perPage !== undefined) {
            this.filters.page = 1;
        }
    }

    setPage(page) {
        this.filters.page = Math.max(1, Number(page) || 1);
    }

    async loadAlertas() {
        try {
            const result = await InventoryService.getAlertas(this.filters);
            this.alertas = result.alertas;
            this.pagination = result.pagination;
            this.notify('onAlertasChange', this.alertas);
            this.notify('onPaginationChange', this.pagination);
        } catch (error) {
            this.notify('onError', error.message || 'Error cargando alertas de inventario');
        }
    }

    async registrarMovimiento(data) {
        this.setLoading(true);
        try {
            const result = await InventoryService.registrarMovimiento(data);
            await this.refreshCurrentView();
            return result;
        } catch (error) {
            this.notify('onError', error.message || 'Error registrando movimiento');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async crearLote(data) {
        this.setLoading(true);
        try {
            const result = await InventoryService.crearLote(data);
            await this.refreshCurrentView();
            return result;
        } catch (error) {
            this.notify('onError', error.message || 'Error creando lote');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async loadMovimientosPorLote(loteId) {
        try {
            return await InventoryService.getMovimientosByLote(loteId);
        } catch (error) {
            this.notify('onError', error.message || 'Error cargando historial de movimientos');
            throw error;
        }
    }

    async importExcel(file) {
        this.setLoading(true);
        try {
            const result = await InventoryService.importExcel(file);
            await this.refreshCurrentView();
            return result;
        } catch (error) {
            this.notify('onError', error.message || 'Error importando archivo');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        this.notify('onLoadingChange', isLoading);
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event].push(callback);
    }

    notify(event, payload) {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event].forEach((callback) => callback(payload));
    }
}

const inventoryController = new InventoryController();
