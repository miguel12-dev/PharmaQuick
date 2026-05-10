/**
 * PharmaQuick - Shopping Service
 * Servicio para manejar compras de clientes con el backend
 */

class ShoppingService {
    constructor() {
        this.baseUrl = '/api';
    }

    /**
     * Manejar respuesta 401 - Sesión expirada
     */
    handle401() {
        localStorage.removeItem('pharmaSession');
        
        // Mostrar modal de sesión expirada
        if (typeof window.showSessionExpiredModal === 'function') {
            window.showSessionExpiredModal();
        } else {
            // Fallback
            window.location.href = '/login?expired=1';
        }
    }

    /**
     * Crear una nueva compra
     * @param {Object} purchaseData - Datos de la compra
     * @returns {Promise}
     */
    async createPurchase(purchaseData) {
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

        // Manejar 401
        if (response.status === 401) {
            this.handle401();
            throw new Error('Sesión expirada');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al crear la compra');
        }

        return data;
    }

    /**
     * Obtener compras del cliente
     * @returns {Promise}
     */
    async getPurchases() {
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

        // Manejar 401
        if (response.status === 401) {
            this.handle401();
            throw new Error('Sesión expirada');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener compras');
        }

        return data.data || [];
    }

    /**
     * Obtener una compra por código
     * @param {string} codigo - Código del pedido
     * @returns {Promise}
     */
    async getPurchaseByCode(codigo) {
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

        // Manejar 401
        if (response.status === 401) {
            this.handle401();
            throw new Error('Sesión expirada');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener la compra');
        }

        return data.data;
    }

    /**
     * Guardar método de pago para uso futuro
     * @param {Object} metodoPago - Datos del método de pago
     * @returns {Promise}
     */
    async savePaymentMethod(metodoPago) {
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

        // Manejar 401
        if (response.status === 401) {
            this.handle401();
            throw new Error('Sesión expirada');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al guardar método de pago');
        }

        return data;
    }

    /**
     * Obtener métodos de pago guardados del cliente
     * @returns {Promise}
     */
    async getPaymentMethods() {
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

        // Manejar 401
        if (response.status === 401) {
            this.handle401();
            return [];
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener métodos de pago');
        }

        return data.data || [];
    }
}

window.shoppingService = new ShoppingService();