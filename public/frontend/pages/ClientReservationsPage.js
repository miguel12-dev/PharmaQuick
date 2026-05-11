/**
 * PharmaQuick - Client Reservations Page
 * Mis reservas simplificado para clientes
 */

const ClientReservationsPage = {
    reservas: [],
    
    async init(container) {
        const session = JSON.parse(localStorage.getItem('pharmaSession') || '{}');
        
        if (session.rol !== 'CLIENTE') {
            Router.navigate('/reservas');
            return;
        }

        ClientLayout.render(container, 'reservas');
        
        await this.loadReservas();
        this.renderReservas();
    },

    async loadReservas() {
        const httpClient = window.httpClient || window.HttpClient;
        
        if (!httpClient) {
            this.reservas = [];
            return;
        }
        
        try {
            const data = await httpClient.get('/reservas/mis-reservas');
            this.reservas = data.data || [];
        } catch (error) {
            console.error('Error loading reservas:', error);
            this.reservas = [];
        }
    },

    renderReservas() {
        const content = document.getElementById('clientContent');
        
        const activas = this.reservas.filter(r => r.estado === 'ACTIVA');
        const expiradas = this.reservas.filter(r => r.estado === 'EXPIRADA');
        const consumidas = this.reservas.filter(r => r.estado === 'CONSUMIDA');
        const canceladas = this.reservas.filter(r => r.estado === 'CANCELADA');
        
        content.innerHTML = `
<div class="row">
    <div class="col-12 mb-4">
        <h4><i class="fas fa-calendar-check me-2"></i>Mis Reservas</h4>
        <p class="text-muted">Gestiona tus reservas de medicamentos</p>
    </div>
    
    <!-- Stats -->
    <div class="col-12 mb-4">
        <div class="row g-3">
            <div class="col-md-3">
                <div class="card border-0 bg-success text-white">
                    <div class="card-body text-center">
                        <h3>${activas.length}</h3>
                        <small>Activas</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 bg-warning text-dark">
                    <div class="card-body text-center">
                        <h3>${expiradas.length}</h3>
                        <small>Expiradas</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 bg-primary text-white">
                    <div class="card-body text-center">
                        <h3>${consumidas.length}</h3>
                        <small>Consumidas</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 bg-secondary text-white">
                    <div class="card-body text-center">
                        <h3>${canceladas.length}</h3>
                        <small>Canceladas</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Lista de reservas -->
    <div class="col-12">
        ${this.renderReservasList(activas, 'Activas', 'success')}
        ${this.renderReservasList(expiradas, 'Expiradas', 'warning')}
        ${this.renderReservasList(consumidas, 'Consumidas', 'primary')}
        ${this.renderReservasList(canceladas, 'Canceladas', 'secondary')}
        
        ${this.reservas.length === 0 ? `
        <div class="text-center py-5">
            <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
            <h5>No tienes reservas</h5>
            <p class="text-muted">Visita la tienda para reservar tus medicamentos</p>
            <a href="/cliente/catalogo" class="btn btn-primary">
                <i class="fas fa-store me-2"></i> Ir a la Tienda
            </a>
        </div>
        ` : ''}
    </div>
</div>`;
    },

    renderReservasList(reservas, title, badgeClass) {
        if (reservas.length === 0) return '';
        
        return `
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white py-3">
                <h6 class="mb-0">
                    <span class="badge bg-${badgeClass} me-2">${reservas.length}</span>
                    ${title}
                </h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Fecha de expiración</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reservas.map(r => this.renderReservaRow(r)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    },

    renderReservaRow(reserva) {
        const estadoBadge = {
            'ACTIVA': '<span class="badge bg-success">Activa</span>',
            'EXPIRADA': '<span class="badge bg-warning text-dark">Expirada</span>',
            'CONSUMIDA': '<span class="badge bg-primary">Consumida</span>',
            'CANCELADA': '<span class="badge bg-secondary">Cancelada</span>'
        };
        
        const actions = reserva.estado === 'ACTIVA' 
            ? `<button class="btn btn-sm btn-outline-danger" onclick="window.ClientReservationsPage.cancelReserva(${reserva.id})">
                   <i class="fas fa-times"></i> Cancelar
               </button>`
            : '';
        
        return `
            <tr>
                <td>${reserva.producto_nombre || 'Producto #' + reserva.lote_id}</td>
                <td>${reserva.cantidad}</td>
                <td>${reserva.fecha_expiracion ? new Date(reserva.fecha_expiracion).toLocaleDateString('es-CO') : '-'}</td>
                <td>${estadoBadge[reserva.estado] || reserva.estado}</td>
                <td>${actions}</td>
            </tr>
        `;
    },

    async cancelReserva(reservaId) {
        if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
        
        const httpClient = window.httpClient || window.HttpClient;
        
        try {
            const formData = new FormData();
            formData.append('reserva_id', reservaId);
            formData.append('accion', 'cancelar');
            
            const data = await httpClient.post('/reservas/cancelar', formData);
            
            if (data.success) {
                this.showToast('Reserva cancelada', 'success');
                await this.loadReservas();
                this.renderReservas();
            }
        } catch (error) {
            this.showToast(error.message || 'Error al cancelar reserva', 'danger');
        }
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        toast.style.zIndex = '9999';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
};

window.ClientReservationsPage = ClientReservationsPage;