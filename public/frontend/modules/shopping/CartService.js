/**
 * PharmaQuick - Cart Service
 * Servicio para manejar el carrito del usuario en la base de datos
 */

class CartService {
    constructor() {
        this.baseUrl = '/api';
    }

    /**
     * Obtener el JWT del usuario desde la sesión
     */
    getToken() {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        return session.token || null;
    }

    /**
     * Obtener el ID del usuario desde la sesión
     */
    getUserId() {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        return session.userId || null;
    }

    /**
     * Obtener el ID de la farmacia desde la sesión
     */
    getFarmaciaId() {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        return session.farmaciaId || null;
    }

    /**
     * Headers comunes para las peticiones
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    /**
     * Obtener el carrito del usuario desde el backend
     */
    async getCart() {
        // console.log('CartService: Obteniendo...');
        // console.log('CartService: Token:', this.getToken() ? 'PRESENTE' : 'NO HAY TOKEN');
        
        const response = await fetch(`${this.baseUrl}/carrito`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        // console.log('CartService: GET Response status:', response.status);

        const data = await response.json();
        // console.log('CartService: GET Response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener el carrito');
        }

        return data.data;
    }

    /**
     * Agregar un producto al carrito
     */
    async addItem(producto) {
        const payload = {
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            producto_codigo_barras: producto.codigo_barras || null,
            cantidad: producto.cantidad || 1,
            precio_unitario: producto.precio,
            farmacia_id: this.getFarmaciaId(),
            usuario_id: this.getUserId() // Incluir el ID del usuario
        };

        // console.log('CartService: Intentando agregar al carrito:', payload);
        // console.log('CartService: Token:', this.getToken() ? 'PRESENTE' : 'NO HAY TOKEN');
        // console.log('CartService: Headers:', this.getHeaders());

        const response = await fetch(`${this.baseUrl}/carrito`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload)
        });

        // console.log('CartService: Respuesta status:', response.status);

        const data = await response.json();
        // console.log('CartService: Respuesta data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Error al agregar al carrito');
        }

        return data.data;
    }

    /**
     * Actualizar la cantidad de un item
     */
    async updateQuantity(itemId, cantidad) {
        const response = await fetch(`${this.baseUrl}/carrito/${itemId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ cantidad })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al actualizar la cantidad');
        }

        return data.data;
    }

    /**
     * Eliminar un item del carrito
     */
    async removeItem(itemId) {
        const response = await fetch(`${this.baseUrl}/carrito/${itemId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al eliminar del carrito');
        }

        return data.data;
    }

    /**
     * Vaciar el carrito
     */
    async clearCart() {
        const response = await fetch(`${this.baseUrl}/carrito`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al vaciar el carrito');
        }

        return data.data;
    }
}

// Instancia global
window.cartService = new CartService();