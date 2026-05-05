class ReservationService {
    static async getReservations() {
        return HttpClient.get('/api/reservas');
    }

    static async createReservation(data) {
        return HttpClient.post('/api/reservas', data);
    }
}
window.ReservationService = ReservationService;
