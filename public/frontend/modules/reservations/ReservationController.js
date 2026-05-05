class ReservationController {
    async init() {
        await this.loadReservations();
        
        const btnNew = document.getElementById('btnNewReservation');
        if(btnNew) {
            btnNew.addEventListener('click', () => {
                Toast.showInfo("La creación de reservas manuales está en desarrollo.");
            });
        }
    }

    async loadReservations() {
        try {
            const response = await ReservationService.getReservations();
            if (response.success) {
                ReservationView.renderReservations(response.data.reservas || response.data || []);
            } else {
                Toast.showError('Error al cargar reservas');
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
            Toast.showError('Error de red al cargar reservas');
            ReservationView.renderReservations([]);
        }
    }
}
window.ReservationController = ReservationController;
