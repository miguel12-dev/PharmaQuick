/**
 * PharmaQuick - InventoryService
 * Servicio de Inventario: alertas, resumen, movimientos e importación.
 */
class InventoryService {
    static async getAlertas(filters = {}) {
        const params = {
            dias: filters.dias ?? 180,
            semaforo: filters.semaforo || undefined,
            q: filters.q || undefined,
            page: filters.page ?? 1,
            per_page: filters.perPage ?? 25,
        };

        const response = await httpClient.get('/inventario/alertas', params);
        return {
            alertas: response.data?.alertas || [],
            pagination: response.data?.pagination || { page: 1, per_page: 25, total: 0, total_pages: 1 },
            filtros: response.data?.filtros || {},
        };
    }

    static async getResumen(dias = 180) {
        const response = await httpClient.get('/inventario/resumen', { dias });
        return response.data?.resumen || {
            total_alertas: 0,
            stock_en_riesgo: 0,
            vencidos: 0,
            rojos: 0,
            amarillos: 0,
            verdes: 0,
        };
    }

    static async getMovimientos(filters = {}) {
        const response = await httpClient.get('/inventario/movimientos', {
            tipo: filters.tipo || undefined,
            q: filters.q || undefined,
            page: filters.page ?? 1,
            per_page: filters.perPage ?? 10,
        });

        return {
            movimientos: response.data?.movimientos || [],
            pagination: response.data?.pagination || { page: 1, per_page: 10, total: 0, total_pages: 1 },
        };
    }

    static async getImportModel() {
        const response = await httpClient.get('/inventario/import-modelo');
        return response.data || {
            headers_requeridos: [],
            headers_opcionales: [],
            ejemplo_fila: {},
            formato_fecha: 'YYYY-MM-DD',
        };
    }

    static async registrarMovimiento(data) {
        const response = await httpClient.post('/inventario/movimiento', data);
        return response.data;
    }

    static async importExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await httpClient.post('/inventario/import-excel', formData);
        return response.data;
    }
}

const inventoryService = InventoryService;
