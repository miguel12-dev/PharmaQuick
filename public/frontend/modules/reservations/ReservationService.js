class ReservationService {
    static async getReservations() {
        return httpClient.get('/reservas');
    }

    static async createReservation(data) {
        return httpClient.post('/reservas', data);
    }
}
window.ReservationService = ReservationService;
