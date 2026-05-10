/**
 * PharmaQuick - Shopping Service
 * Servicio para manejar compras de clientes con el backend
 */

class ShoppingService {
    constructor() {
        this.baseUrl = '/api';
    }

    /**
     * Crear una nueva compra
     * @param {Object} purchaseData - Datos de la compra
     * @returns {Promise}
     */
    async createPurchase(purchaseData) {
        try {
            const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
            
            const response = await fetch(`${this.baseUrl}/compras`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token || ''}`
                },
                body: JSON.stringify({
                    usuario_id: session.userId || 1,
                    farmacia_id: session.farmaciaId || 1,
                    items: purchaseData.items,
                    total: purchaseData.total,
                    metodo_pago: purchaseData.paymentMethod,
                    direccion: purchaseData.deliveryAddress,
                    nombre: purchaseData.deliveryName,
                    telefono: purchaseData.deliveryPhone,
                    observaciones: purchaseData.deliveryNotes
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear la compra');
            }

            return data;
        } catch (error) {
            console.error('ShoppingService.createPurchase error:', error);
            throw error;
        }
    }

    /**
     * Obtener compras del cliente
     * @returns {Promise}
     */
    async getPurchases() {
        try {
            const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
            
            const response = await fetch(
                `${this.baseUrl}/compras?usuario_id=${session.userId || 1}&farmacia_id=${session.farmaciaId || 1}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${session.token || ''}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener compras');
            }

            return data.data || [];
        } catch (error) {
            console.error('ShoppingService.getPurchases error:', error);
            // En caso de error, devolver datos locales
            return JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
        }
    }

    /**
     * Obtener una compra por código
     * @param {string} codigo - Código del pedido
     * @returns {Promise}
     */
    async getPurchaseByCode(codigo) {
        try {
            const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
            
            const response = await fetch(
                `${this.baseUrl}/compras/${codigo}?usuario_id=${session.userId || 1}&farmacia_id=${session.farmaciaId || 1}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${session.token || ''}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener la compra');
            }

            return data.data;
        } catch (error) {
            console.error('ShoppingService.getPurchaseByCode error:', error);
            throw error;
        }
    }

    /**
     * Guardar método de pago para uso futuro
     * @param {Object} metodoPago - Datos del método de pago
     * @returns {Promise}
     */
    async savePaymentMethod(metodoPago) {
        try {
            const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
            
            const response = await fetch(`${this.baseUrl}/compras/metodo-pago`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token || ''}`
                },
                body: JSON.stringify({
                    usuario_id: session.userId || 1,
                    ...metodoPago
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al guardar método de pago');
            }

            return data;
        } catch (error) {
            console.error('ShoppingService.savePaymentMethod error:', error);
            throw error;
        }
    }

    /**
     * Obtener métodos de pago guardados del cliente
     * @returns {Promise}
     */
    async getPaymentMethods() {
        try {
            const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
            
            const response = await fetch(
                `${this.baseUrl}/compras/metodos-pago?usuario_id=${session.userId || 1}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${session.token || ''}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener métodos de pago');
            }

            return data.data || [];
        } catch (error) {
            console.error('ShoppingService.getPaymentMethods error:', error);
            return [];
        }
    }
}

window.shoppingService = new ShoppingService();