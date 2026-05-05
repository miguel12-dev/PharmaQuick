class ReservationsPage {
    static async init(container) {
        const template = document.getElementById('template-reservas');
        if (!template) {
            console.error('Template template-reservas no encontrado');
            return;
        }
        
        container.innerHTML = '';
        container.appendChild(template.content.cloneNode(true));
        
        const titleElem = document.getElementById('pageTitle');
        if (titleElem) titleElem.textContent = 'Reservas';
        
        const controller = new ReservationController();
        await controller.init();
    }
}
window.ReservationsPage = ReservationsPage;
