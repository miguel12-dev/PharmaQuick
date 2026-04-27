/**
 * PharmaQuick - InventoryController
 * Controlador de Inventario - maneja FEFO, Alertas e Importación
 */

class InventoryController {
    constructor() {
        this.alertas = [];
        this.fefoData = {}; // productoId => [lotes]
        this.isLoading = false;
        
        this.listeners = {
            onAlertasChange: [],
            onFefoChange: [],
            onLoadingChange: [],
            onError: []
        };
    }

    /**
     * Inicializar controlador - cargar alertas por defecto
     */
    async init() {
        await this.loadAlertas();
    }

    /**
     * Cargar alertas de vencimiento
     */
    async loadAlertas(dias = 180) {
        this.setLoading(true);
        try {
            this.alertas = await InventoryService.getAlertas(dias);
            this.notify('onAlertasChange', this.alertas);
        } catch (error) {
            this.notify('onError', error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Cargar sugerencia FEFO para un producto
     */
    async loadFefo(productoId) {
        this.setLoading(true);
        try {
            const lotes = await InventoryService.getFefo(productoId);
            this.fefoData[productoId] = lotes;
            this.notify('onFefoChange', { productoId, lotes });
            return lotes;
        } catch (error) {
            this.notify('onError', error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Registrar movimiento
     */
    async registrarMovimiento(data) {
        this.setLoading(true);
        try {
            const result = await InventoryService.registrarMovimiento(data);
            // Si el movimiento afecta a un producto que estamos viendo en FEFO, recargar
            const loteId = data.lote_id;
            // Podríamos ser más específicos aquí si supiéramos el producto_id del lote
            return result;
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Importar desde Excel
     */
    async importExcel(file) {
        this.setLoading(true);
        try {
            const result = await InventoryService.importExcel(file);
            await this.loadAlertas(); // Recargar alertas después de importar
            return result;
        } catch (error) {
            this.notify('onError', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.notify('onLoadingChange', loading);
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    notify(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

// Exportar global
const inventoryController = new InventoryController();
