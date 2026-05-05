class ReservationView {
    static renderReservations(reservations) {
        const tbody = document.getElementById('reservationsTableBody');
        tbody.innerHTML = '';

        if (!reservations || reservations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hay reservas activas</td></tr>';
            return;
        }

        reservations.forEach(reserva => {
            const tr = document.createElement('tr');
            
            // Estado y Badge
            let badgeClass = 'bg-secondary';
            let estadoTexto = reserva.estado;
            
            if (reserva.estado === 'ACTIVA') {
                badgeClass = 'bg-primary';
                
                // Verificar si está vencida localmente (fallback por si cron no corrió)
                const fechaLimite = new Date(reserva.fecha_limite);
                if (fechaLimite < new Date()) {
                    estadoTexto = 'Vencida/Cancelada';
                    badgeClass = 'bg-danger';
                }
            } else if (reserva.estado === 'COMPLETADA') {
                badgeClass = 'bg-success';
            } else if (reserva.estado === 'CANCELADA' || reserva.estado === 'VENCIDA') {
                estadoTexto = 'Vencida/Cancelada';
                badgeClass = 'bg-danger';
            }

            tr.innerHTML = `
                <td>#${reserva.id}</td>
                <td>
                    <strong>${reserva.producto_nombre || 'Producto ' + reserva.producto_id}</strong>
                </td>
                <td><span class="badge bg-info text-dark">${reserva.codigo_lote || 'N/A'}</span></td>
                <td>${reserva.cantidad}</td>
                <td>${new Date(reserva.fecha_limite).toLocaleString()}</td>
                <td><span class="badge ${badgeClass}">${estadoTexto}</span></td>
                <td class="text-end">
                    ${reserva.estado === 'ACTIVA' && estadoTexto !== 'Vencida/Cancelada' ? `
                        <button class="btn btn-sm btn-success btn-complete" data-id="${reserva.id}" title="Completar Venta"><i class="fas fa-check"></i></button>
                        <button class="btn btn-sm btn-outline-danger btn-cancel" data-id="${reserva.id}" title="Cancelar Reserva"><i class="fas fa-times"></i></button>
                    ` : ''}
                </td>
            `;

            tbody.appendChild(tr);
        });
    }
}
window.ReservationView = ReservationView;
