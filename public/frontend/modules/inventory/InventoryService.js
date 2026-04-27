/**
 * PharmaQuick - InventoryService
 * Servicio para manejo de Inventario (FEFO + Kardex + Import) via API
 */

class InventoryService {
    /**
     * Obtener sugerencia FEFO para un producto
     */
    static async getFefo(productoId) {
        try {
            const response = await httpClient.get('/inventario/fefo', { producto_id: productoId });
            return response.data?.lotes || [];
        } catch (error) {
            console.error('InventoryService.getFefo:', error);
            throw error;
        }
    }

    /**
     * Obtener alertas de vencimiento
     */
    static async getAlertas(dias = 180) {
        try {
            const response = await httpClient.get('/inventario/alertas', { dias: dias });
            return response.data?.alertas || [];
        } catch (error) {
            console.error('InventoryService.getAlertas:', error);
            throw error;
        }
    }

    /**
     * Registrar un movimiento de inventario
     * @param {Object} data {lote_id, tipo, cantidad, descripcion}
     */
    static async registrarMovimiento(data) {
        try {
            const response = await httpClient.post('/inventario/movimiento', data);
            return response.data;
        } catch (error) {
            console.error('InventoryService.registrarMovimiento:', error);
            throw error;
        }
    }

    /**
     * Importar inventario desde Excel
     * @param {File} file 
     */
    static async importExcel(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Nota: httpClient.post debería manejar FormData correctamente si está configurado
            // Si no, usaremos fetch directo o ajustaremos HttpClient
            const response = await httpClient.post('/inventario/import-excel', formData);
            return response.data;
        } catch (error) {
            console.error('InventoryService.importExcel:', error);
            throw error;
        }
    }
}

// Exportar global
const inventoryService = InventoryService;
